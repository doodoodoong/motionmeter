import { initializeApp } from 'firebase/app';
import { addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore';
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
): Promise<boolean> => {
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
    return true;
  } catch (error) {
    console.error('Firestore 업로드 오류:', error);
    return false;
  }
};
