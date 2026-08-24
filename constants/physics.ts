/**
 * 편곤/봉 측정 물리 상수 및 계산식 — 유일한 출처(single source of truth).
 *
 * 이 파일 외의 어떤 화면·컴포넌트·스크립트에도 물리 상수를 하드코딩하지 않는다.
 *
 * 설계 원칙 (v2, 2026-07 개정):
 *  1. 절대 힘은 산출하지 않는다. 유효질량·충돌시간을 실측할 수 없으므로
 *     힘 단위의 값은 근거 없는 임의값이 된다.
 *  2. 자이로스코프가 측정하는 것은 손잡이(본체)의 각속도뿐이다. 편곤은 연결부가
 *     자유회전하는 다물체계여서 v = L·ω(강체 가정)가 성립하지 않는다.
 *     따라서 끝속도는 "추정값"으로만 취급하고 화면에서도 그렇게 표기한다.
 *  3. 비교는 기준무기(봉)를 1.00으로 두는 무단위 상대지수로 한다.
 */

export type WeaponId = 'pyeongon' | 'staff';

/** 과거 데이터/라우팅 파라미터에서 쓰였던 무기 ID 별칭 */
type WeaponIdAlias = WeaponId | 'flail' | '편곤' | '봉';

// ---------------------------------------------------------------------------
// 1. 실물 제원
// ---------------------------------------------------------------------------

/**
 * 편곤 부위별 제원.
 *
 * TODO(실측): 질량 3개(0.8 / 0.5 / 0.7 kg)는 현재 문헌 기반 추정치이며,
 *             실물 편곤 계측 후 실측값으로 교체할 것. 질량이 바뀌면
 *             INERTIA 값도 함께 재계산해야 한다.
 */
export const PYEONGON_PARTS = {
  /** 본체(손잡이) */
  body: { length: 1.85, mass: 0.8 },
  /** 연결부(쇠사슬) */
  joint: { length: 0.055, mass: 0.5 },
  /** 보조체(타격부) */
  tip: { length: 0.47, mass: 0.7 },
} as const;

/** 전체 유효 길이 L_TOT (m) = 1.85 + 0.055 + 0.47 */
export const L_TOT =
  PYEONGON_PARTS.body.length +
  PYEONGON_PARTS.joint.length +
  PYEONGON_PARTS.tip.length;

/** 총질량 (kg) = 0.8 + 0.5 + 0.7 */
export const TOTAL_MASS =
  PYEONGON_PARTS.body.mass +
  PYEONGON_PARTS.joint.mass +
  PYEONGON_PARTS.tip.mass;

// ---------------------------------------------------------------------------
// 2. 관성모멘트 / 환산계수
// ---------------------------------------------------------------------------

/**
 * 회전축(손잡이 끝) 기준 관성모멘트 I (kg·m²).
 *
 * - 편곤 5.894 : 부위별 질량을 각 위치에 배분해 합산한 값. 작품설명서 <표 14>.
 * - 봉    3.760 : 편곤과 동일한 길이(2.375m)·질량(2.0kg)의 균일봉.
 *                 I = (1/3)·m·L² = (1/3)·2.0·2.375² = 3.760.
 */
export const INERTIA: Record<WeaponId, number> = {
  pyeongon: 5.894,
  staff: 3.76,
};

/**
 * 끝속도 환산계수 k (무단위).
 *
 * 봉은 강체이므로 끝속도가 손잡이 각속도에 그대로 비례한다 → k = 1.0.
 * 편곤은 연결부가 자유회전하면서 보조체가 본체보다 앞서 나가므로
 * 끝속도가 강체 가정보다 크다 → k = 1.3. 작품설명서 <표 21>, <표 22>.
 *
 * 주의: k는 "각속도에 곱하는 가속효율"이 아니라 "L_TOT·ω로 얻은
 * 강체 기준 끝속도를 실제 끝속도로 환산하는 계수"다. 실측 각속도에
 * 별도의 가속효율계수를 다시 곱하면 이중 계상이 되므로 하지 않는다.
 */
export const TIP_SPEED_COEFFICIENT: Record<WeaponId, number> = {
  pyeongon: 1.3,
  staff: 1.0,
};

/** 상대지수의 기준이 되는 무기 */
export const REFERENCE_WEAPON: WeaponId = 'staff';

// ---------------------------------------------------------------------------
// 3. 파생값
// ---------------------------------------------------------------------------

/**
 * 등가질량 m_eq = I / L_TOT² (kg).
 * 회전운동에너지를 "끝속도를 가진 점질량"으로 환산했을 때의 질량.
 * → 봉 0.667 kg, 편곤 1.045 kg
 */
export const EQUIVALENT_MASS: Record<WeaponId, number> = {
  pyeongon: INERTIA.pyeongon / L_TOT ** 2,
  staff: INERTIA.staff / L_TOT ** 2,
};

/**
 * 상대 타격계수 C = (I / I_봉) × k² (무단위).
 * → 봉 1.00, 편곤 2.65
 *
 * 관성모멘트 비(구조적 유리함)와 끝속도 환산계수의 제곱(운동에너지 기여)을
 * 함께 반영한다. 같은 각속도로 휘둘렀을 때의 타격부 에너지 비와 동일하다.
 */
export const STRIKE_COEFFICIENT: Record<WeaponId, number> = {
  pyeongon:
    (INERTIA.pyeongon / INERTIA[REFERENCE_WEAPON]) *
    TIP_SPEED_COEFFICIENT.pyeongon ** 2,
  staff:
    (INERTIA.staff / INERTIA[REFERENCE_WEAPON]) *
    TIP_SPEED_COEFFICIENT.staff ** 2,
};

/**
 * 계수 체계 버전. 저장된 측정 데이터가 어느 계수로 계산되었는지 추적한다.
 * 계수나 계산식이 바뀌면 이 값을 올리고, 저장된 omegaMax로 재계산한다.
 */
export const COEFF_VERSION = 'v2-2026-07';

/**
 * Firestore `weapon` 필드에 저장·조회되는 고정 값.
 * 표시용이 아니며 절대 번역하지 않는다.
 * 기존 문서 및 복합 인덱스(weapon ASC + maxAngularVelocity ASC)와의
 * 호환을 위해 한글 리터럴을 그대로 유지한다.
 */
export const WEAPON_QUERY_VALUE: Record<WeaponId, string> = {
  pyeongon: '편곤',
  staff: '봉',
};

// ---------------------------------------------------------------------------
// 4. 계산 함수 (순수 함수)
// ---------------------------------------------------------------------------

export interface ComputeResult {
  /** 측정 최대 각속도 (rad/s) — 실측값. 손잡이(본체) 기준 */
  omega: number;
  /** 추정 끝속도 (m/s) — k·L_TOT·ω. 추정값 */
  tipSpeed: number;
  /** 타격부 등가 운동에너지 (J) — ½·m_eq·tipSpeed² */
  energy: number;
  /** 상대 타격지수 (무단위) — C·ω². 봉을 10 rad/s로 휘두르면 정확히 100 */
  index: number;
}

/** 별칭을 정규 WeaponId로 변환한다. 알 수 없는 값은 기준무기로 처리한다. */
export const normalizeWeaponId = (weapon: string): WeaponId => {
  switch (weapon) {
    case 'pyeongon':
    case 'flail':
    case '편곤':
      return 'pyeongon';
    case 'staff':
    case '봉':
      return 'staff';
    default:
      return REFERENCE_WEAPON;
  }
};

/**
 * 측정 각속도로부터 표시·저장할 물리량을 산출한다.
 *
 * omega는 자이로스코프로 측정한 손잡이의 최대 각속도(rad/s)다.
 * tipSpeed 이하 값은 모두 omega에서 파생된 계산값이므로, 계수가 바뀌면
 * 저장된 omega만으로 전부 재계산할 수 있다.
 */
export const compute = (weapon: WeaponIdAlias, omega: number): ComputeResult => {
  const id = normalizeWeaponId(weapon);

  if (!Number.isFinite(omega) || omega <= 0) {
    return { omega: 0, tipSpeed: 0, energy: 0, index: 0 };
  }

  const tipSpeed = TIP_SPEED_COEFFICIENT[id] * L_TOT * omega;
  const energy = 0.5 * EQUIVALENT_MASS[id] * tipSpeed ** 2;
  const index = STRIKE_COEFFICIENT[id] * omega ** 2;

  return { omega, tipSpeed, energy, index };
};

// ---------------------------------------------------------------------------
// 5. 화면 게이지 스케일
// ---------------------------------------------------------------------------

/**
 * 랭킹 모집단에 포함할 각속도 범위 (rad/s).
 * 편곤 실측 852건 분포를 기준으로, 하한은 측정만 시작하고 휘두르지 않은 기록을,
 * 상한은 기기를 흔든 것으로 의심되는 비현실적인 기록을 제외한다.
 */
/** 랭킹 모집단에 포함할 각속도 하한 (rad/s) */
export const RANKING_MIN_ANGULAR_VELOCITY = 1.0;
/** 랭킹 모집단에 포함할 각속도 상한 (rad/s) */
export const RANKING_MAX_ANGULAR_VELOCITY = 40.0;

/**
 * 게이지 풀스케일 기준 각속도 (rad/s).
 * 편곤 실측 최대는 62.9 rad/s이며, 상위 1% 수준인 40 rad/s를 표시 상한으로 삼는다.
 */
export const FULL_SCALE_ANGULAR_VELOCITY = 40;

/** 상대 타격지수 게이지 풀스케일 — 가장 계수가 큰 무기(편곤) 기준 */
export const INDEX_FULL_SCALE = compute(
  'pyeongon',
  FULL_SCALE_ANGULAR_VELOCITY
).index;

/** 등가 운동에너지 게이지 풀스케일 (J) — 동일 기준 */
export const ENERGY_FULL_SCALE = compute(
  'pyeongon',
  FULL_SCALE_ANGULAR_VELOCITY
).energy;

/** 끝속도 게이지 풀스케일 (m/s) — 동일 기준 */
export const TIP_SPEED_FULL_SCALE = compute(
  'pyeongon',
  FULL_SCALE_ANGULAR_VELOCITY
).tipSpeed;
