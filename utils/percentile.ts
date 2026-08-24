export type RankGrade = 'jangwon' | 'geupje' | 'sungnyeon' | 'suryeon';

export interface PercentileResult {
  /** 상위 백분율 (1~100). 표본 부족/조회 실패면 null */
  topPercent: number | null;
  /** 비교 모집단 크기 (내 기록 제외) */
  total: number;
  grade: RankGrade | null;
  status: 'ok' | 'insufficient' | 'unavailable';
}

/** 퍼센타일을 표시하기 위한 최소 모집단 크기 */
export const MIN_SAMPLE = 5;

/** 등급 경계값 (상위 %). 경계값 자체는 더 높은 등급에 포함한다. */
export const GRADE_THRESHOLDS = {
  jangwon: 10,
  geupje: 50,
  sungnyeon: 80,
} as const;

/** 상위 백분율을 등급으로 변환한다. 각 경계값은 바로 위 등급에 포함한다. */
export function gradeForPercent(topPercent: number): RankGrade {
  if (topPercent <= GRADE_THRESHOLDS.jangwon) return 'jangwon';
  if (topPercent <= GRADE_THRESHOLDS.geupje) return 'geupje';
  if (topPercent <= GRADE_THRESHOLDS.sungnyeon) return 'sungnyeon';
  return 'suryeon';
}

/**
 * 모집단 count 결과로부터 상위 백분율과 등급을 계산한다.
 *
 * 조회 실패는 unavailable, 유효한 모집단이 5건 미만이면 insufficient로 구분한다.
 * 현재 기록은 저장 전일 수 있으므로 모집단에 정확히 한 번 가상 삽입한다.
 * below는 현재 값보다 엄격히 작은 기록만 세므로 동점자는 앞선 것으로 간주해
 * 보수적인 순위를 부여한다.
 */
export function computePercentile(
  input: { total: number; below: number } | null
): PercentileResult {
  if (input === null) {
    return { topPercent: null, total: 0, grade: null, status: 'unavailable' };
  }

  const { total, below } = input;

  /** 잘못된 집계값은 예외를 던지지 않고 조회 불가 상태로 정규화한다. */
  if (
    !Number.isFinite(total) ||
    !Number.isFinite(below) ||
    !Number.isInteger(total) ||
    !Number.isInteger(below) ||
    total < 0 ||
    below < 0 ||
    below > total
  ) {
    return { topPercent: null, total: 0, grade: null, status: 'unavailable' };
  }

  if (total < MIN_SAMPLE) {
    return { topPercent: null, total, grade: null, status: 'insufficient' };
  }

  const rank = total - below + 1;
  /** 올림 후에도 방어적으로 1~100 범위에 고정해 표시값의 계약을 지킨다. */
  const topPercent = Math.min(
    100,
    Math.max(1, Math.ceil((rank / (total + 1)) * 100))
  );

  return {
    topPercent,
    total,
    grade: gradeForPercent(topPercent),
    status: 'ok',
  };
}
