/**
 * v2 계수 체계 마이그레이션 스크립트.
 *
 * Firestore `measurements` 컬렉션에서 실측 각속도는 있으나 v2 필드(index 등)가
 * 없는 문서를 찾아, constants/physics.ts의 compute()로 재계산해 새 필드를 채운다.
 *
 * 안전 규칙 (사용자 지시):
 *  - 기존 필드는 읽기만 한다. 수정·삭제하지 않는다.
 *  - 문서를 삭제하지 않는다.
 *  - 이미 값이 있는 필드는 덮어쓰지 않는다. 누락된 필드만 추가한다.
 *  - 기본 동작은 미리보기(dry-run)다. 실제 쓰기는 --commit 을 명시해야 한다.
 *
 * 사용법:
 *   npm run migrate:v2                # 미리보기 — 대상 건수만 출력
 *   npm run migrate:v2 -- --dry-run   # 위와 동일 (명시적)
 *   npm run migrate:v2 -- --commit    # 실제 쓰기
 *
 * 인증: 앱과 동일한 Firebase 웹 SDK + .env.local 의 EXPO_PUBLIC_FIREBASE_* 값을
 *       사용한다. 서비스 계정 키가 필요 없는 대신, Firestore 보안 규칙이
 *       measurements 컬렉션 쓰기를 허용해야 한다.
 */
import fs from 'fs';
import path from 'path';

import { initializeApp } from 'firebase/app';
import {
  collection,
  getDocs,
  getFirestore,
  writeBatch,
} from 'firebase/firestore';

import { COEFF_VERSION, compute } from '../constants/physics';

const COLLECTION = 'measurements';
/** Firestore 배치 상한은 500 — 여유를 두고 400씩 커밋한다. */
const BATCH_SIZE = 400;

const args = process.argv.slice(2);
const shouldCommit = args.includes('--commit');
const isDryRun = !shouldCommit;

/** .env.local 을 직접 파싱한다 (dotenv 의존성 추가 없이). */
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local 파일을 찾을 수 없습니다.');
  }

  const env = {};
  for (const rawLine of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    env[line.slice(0, eq).trim()] = line
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
  }
  return env;
}

/**
 * 재계산의 근거가 되는 실측 각속도를 고른다.
 * omegaMax(v2 원본)를 우선하고, 없으면 과거 필드 maxAngularVelocity를 쓴다.
 */
function readOmega(data) {
  if (typeof data.omegaMax === 'number' && Number.isFinite(data.omegaMax)) {
    return { omega: data.omegaMax, source: 'omegaMax' };
  }
  if (
    typeof data.maxAngularVelocity === 'number' &&
    Number.isFinite(data.maxAngularVelocity)
  ) {
    return { omega: data.maxAngularVelocity, source: 'maxAngularVelocity' };
  }
  return null;
}

async function main() {
  const env = loadEnv();

  const app = initializeApp({
    apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
  });
  const db = getFirestore(app);

  console.log(`모드: ${isDryRun ? 'DRY RUN (쓰기 없음)' : 'COMMIT (실제 쓰기)'}`);
  console.log(`계수 버전: ${COEFF_VERSION}`);

  const snapshot = await getDocs(collection(db, COLLECTION));

  const stats = {
    total: snapshot.size,
    alreadyMigrated: 0,
    noOmega: 0,
    fromOmegaMax: 0,
    fromLegacyField: 0,
  };
  const pending = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    // index가 이미 있으면 마이그레이션 완료된 문서로 본다.
    if (typeof data.index === 'number') {
      stats.alreadyMigrated += 1;
      return;
    }

    const omegaInfo = readOmega(data);
    if (!omegaInfo) {
      stats.noOmega += 1;
      return;
    }

    if (omegaInfo.source === 'omegaMax') stats.fromOmegaMax += 1;
    else stats.fromLegacyField += 1;

    const result = compute(data.weapon ?? '', omegaInfo.omega);

    // 누락된 필드만 담는다. 기존 값은 절대 덮어쓰지 않는다.
    const update = {};
    if (data.omegaMax === undefined) update.omegaMax = result.omega;
    if (data.tipSpeed === undefined) update.tipSpeed = result.tipSpeed;
    if (data.energy === undefined) update.energy = result.energy;
    if (data.index === undefined) update.index = result.index;
    if (data.coeffVersion === undefined) update.coeffVersion = COEFF_VERSION;
    // measuredAt은 기존 timestamp를 그대로 복사한다 (없으면 채우지 않는다).
    if (data.measuredAt === undefined && data.timestamp !== undefined) {
      update.measuredAt = data.timestamp;
    }

    if (Object.keys(update).length > 0) {
      pending.push({ ref: docSnap.ref, id: docSnap.id, update });
    }
  });

  console.log('');
  console.log(`전체 문서            : ${stats.total}`);
  console.log(`이미 v2 (index 존재) : ${stats.alreadyMigrated}`);
  console.log(`각속도 없음 (건너뜀) : ${stats.noOmega}`);
  console.log(`omegaMax 기준 대상   : ${stats.fromOmegaMax}`);
  console.log(`legacy 필드 기준 대상: ${stats.fromLegacyField}`);
  console.log(`실제 변경 대상       : ${pending.length}`);

  if (pending.length > 0) {
    const sample = pending[0];
    console.log('');
    console.log(`예시 (${sample.id}):`, sample.update);
  }

  if (isDryRun) {
    console.log('');
    console.log('DRY RUN이므로 아무것도 쓰지 않았습니다. 실행: npm run migrate:v2 -- --commit');
    return;
  }

  let written = 0;
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const chunk = pending.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    // merge 의미의 부분 업데이트 — 지정한 필드만 건드린다.
    for (const item of chunk) batch.update(item.ref, item.update);
    await batch.commit();
    written += chunk.length;
    console.log(`커밋 완료: ${written} / ${pending.length}`);
  }

  console.log('');
  console.log(`마이그레이션 완료: ${written}건`);
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error('마이그레이션 실패:', error);
    process.exit(1);
  }
);
