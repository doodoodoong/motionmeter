/**
 * 순위 집계 쿼리에는 Firestore 복합 인덱스
 * `weapon ASC + maxAngularVelocity ASC`와 measurements 컬렉션의 list/read 권한이 필요하다.
 */
import { initializeApp } from 'firebase/app';
import {
  addDoc,
  collection,
  getCountFromServer,
  getFirestore,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import {
  COEFF_VERSION,
  INERTIA,
  normalizeWeaponId,
  type WeaponId,
} from '@/constants/physics';

// 환경 변수에서 Firebase 설정 로드
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const RANK_QUERY_TIMEOUT_MS = 5_000;

export type WeaponType = WeaponId;

export interface MeasurementData {
  /** 무기 표시명 (한글) — 기존 스키마와 동일 */
  weapon: string;
  /** 최대 각속도 (rad/s) — 실측 원본값 */
  omegaMax: number;
  /** 추정 끝속도 (m/s) */
  tipSpeed: number;
  /** 타격부 등가 운동에너지 (J) */
  energy: number;
  /** 상대 타격지수 (무단위, 봉 10 rad/s = 100) */
  index: number;
}

/** Firestore 오류의 code와 message를 호출부에 전달할 문자열로 정규화한다. */
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const code = (error as Error & { code?: unknown }).code;
    return typeof code === 'string'
      ? `${code}: ${error.message}`
      : error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const { code, message } = error as { code?: unknown; message?: unknown };
    if (typeof code === 'string' && typeof message === 'string') {
      return `${code}: ${message}`;
    }
    if (typeof code === 'string') return code;
    if (typeof message === 'string') return message;
  }

  return String(error);
};

/**
 * 같은 무기의 기존 기록 수와 현재 각속도보다 작은 기록 수를 집계한다.
 *
 * 비교 기준은 파생값 index가 아니라 v1 문서에도 존재하는 maxAngularVelocity다.
 * 따라서 과거 기록을 포함하며 향후 물리 계수 개정에도 순위가 달라지지 않는다.
 * 문서 본문 대신 count만 읽고, 두 집계는 동시에 실행해 비용과 지연을 줄인다.
 */
export const fetchWeaponRank = async (
  weaponKorean: string,
  omegaMax: number
): Promise<{ total: number; below: number } | null> => {
  if (!Number.isFinite(omegaMax) || omegaMax <= 0) {
    console.warn('Firestore 순위 조회 생략: omegaMax가 유효한 양수가 아닙니다.');
    return null;
  }

  const collectionRef = collection(db, 'measurements');
  const totalQuery = query(collectionRef, where('weapon', '==', weaponKorean));
  const belowQuery = query(
    collectionRef,
    where('weapon', '==', weaponKorean),
    where('maxAngularVelocity', '<', omegaMax)
  );

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const countsPromise = Promise.all([
      getCountFromServer(totalQuery),
      getCountFromServer(belowQuery),
    ]);
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error('순위 조회 시간이 5초를 초과했습니다.')),
        RANK_QUERY_TIMEOUT_MS
      );
    });
    const [totalSnapshot, belowSnapshot] = await Promise.race([
      countsPromise,
      timeoutPromise,
    ]);

    return {
      total: totalSnapshot.data().count,
      below: belowSnapshot.data().count,
    };
  } catch (error) {
    console.warn(`Firestore 순위 조회 오류: ${getErrorMessage(error)}`, error);
    return null;
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
};

/**
 * 측정 결과를 Cloud Firestore에 업로드
 * 경로: measurements/{docId}
 *
 * 스키마 정책:
 *  - v2 필드(omegaMax, tipSpeed, energy, index, coeffVersion, measuredAt)를 추가한다.
 *  - omegaMax는 유일한 실측 원본이므로 반드시 저장한다. 계수 체계가 바뀌어도
 *    이 값만으로 나머지를 전부 재계산할 수 있다.
 *  - 기존 필드(maxAngularVelocity, rotationalEnergy, strikePower, strikeIndex,
 *    timestamp)는 과거 데이터 및 통계 웹 하위 호환을 위해 절대 삭제하지 않고
 *    계속 함께 기록한다.
 */
export const uploadMeasurementResult = async (
  data: MeasurementData
): Promise<{ ok: boolean; error?: string }> => {
  try {
    const collectionRef = collection(db, 'measurements');

    // 하위 호환 필드는 과거와 동일한 정의를 유지한다.
    // rotationalEnergy = ½·I·ω² (환산계수 미적용)
    const rotationalEnergy =
      0.5 * INERTIA[normalizeWeaponId(data.weapon)] * data.omegaMax ** 2;

    await addDoc(collectionRef, {
      // --- v2 필드 ---
      weapon: data.weapon,
      omegaMax: data.omegaMax,
      tipSpeed: data.tipSpeed,
      energy: data.energy,
      index: data.index,
      coeffVersion: COEFF_VERSION,
      measuredAt: serverTimestamp(),

      // --- 하위 호환 필드 (삭제 금지) ---
      maxAngularVelocity: data.omegaMax,
      rotationalEnergy,
      strikePower: data.energy,
      strikeIndex: data.index,
      timestamp: serverTimestamp(),
    });

    console.log(`측정 결과 업로드 성공: ${data.weapon}`);
    return { ok: true };
  } catch (error) {
    console.error('Firestore 업로드 오류:', error);
    return { ok: false, error: getErrorMessage(error) };
  }
};
