import {
  MIN_SAMPLE,
  computePercentile,
  gradeForPercent,
} from '@/utils/percentile';

describe('computePercentile()', () => {
  it('조회 결과가 없으면 unavailable을 반환한다', () => {
    expect(computePercentile(null)).toEqual({
      topPercent: null,
      total: 0,
      grade: null,
      status: 'unavailable',
    });
  });

  it.each([0, 1, 4])('모집단이 %i건이면 insufficient를 반환한다', (total) => {
    expect(computePercentile({ total, below: 0 })).toEqual({
      topPercent: null,
      total,
      grade: null,
      status: 'insufficient',
    });
  });

  it('최소 모집단 5건부터 퍼센타일을 계산한다', () => {
    expect(computePercentile({ total: MIN_SAMPLE, below: 0 }).status).toBe('ok');
  });

  it('최상위 기록은 상위 1%이며 범위를 벗어나지 않는다', () => {
    const result = computePercentile({ total: 100, below: 100 });

    expect(result.topPercent).toBe(1);
    expect(result.topPercent).toBeGreaterThanOrEqual(1);
    expect(result.topPercent).toBeLessThanOrEqual(100);
  });

  it('최하위 기록은 상위 100%다', () => {
    expect(computePercentile({ total: 5, below: 0 }).topPercent).toBe(100);
  });

  it('필터로 줄어든 모집단에서도 상위 50%를 급제로 계산한다', () => {
    expect(computePercentile({ total: 800, below: 408 })).toMatchObject({
      topPercent: 50,
      grade: 'geupje',
      status: 'ok',
    });
  });

  it('하한 미만 기록은 below=0으로 상위 100% 수련이 된다', () => {
    expect(computePercentile({ total: 800, below: 0 })).toMatchObject({
      topPercent: 100,
      grade: 'suryeon',
      status: 'ok',
    });
  });

  it('상한 초과 기록은 clamp된 below=total로 상위 1% 장원이 된다', () => {
    expect(computePercentile({ total: 800, below: 800 })).toMatchObject({
      topPercent: 1,
      grade: 'jangwon',
      status: 'ok',
    });
  });

  it('clamp 누락 등으로 below가 total보다 크면 unavailable을 반환한다', () => {
    expect(computePercentile({ total: 800, below: 801 })).toEqual({
      topPercent: null,
      total: 0,
      grade: null,
      status: 'unavailable',
    });
  });

  it('필터 후 모집단이 최소 표본보다 작으면 insufficient를 반환한다', () => {
    expect(computePercentile({ total: MIN_SAMPLE - 1, below: 2 })).toEqual({
      topPercent: null,
      total: MIN_SAMPLE - 1,
      grade: null,
      status: 'insufficient',
    });
  });

  it.each([
    { below: 9, topPercent: 10, grade: 'jangwon' },
    { below: 5, topPercent: 50, grade: 'geupje' },
    { below: 2, topPercent: 80, grade: 'sungnyeon' },
  ] as const)(
    '등급 경계 상위 $topPercent%를 $grade 등급에 포함한다',
    ({ below, topPercent, grade }) => {
      expect(computePercentile({ total: 9, below })).toMatchObject({
        topPercent,
        grade,
      });
    }
  );

  it('동점자는 below에 포함하지 않아 보수적으로 낮은 순위를 부여한다', () => {
    // 총 9명 중 자신보다 작은 기록이 5명뿐이면, 동점 수와 무관하게 5위로 계산한다.
    expect(computePercentile({ total: 9, below: 5 })).toMatchObject({
      topPercent: 50,
      grade: 'geupje',
    });
  });

  it.each([
    { total: NaN, below: 0 },
    { total: Infinity, below: 0 },
    { total: -1, below: 0 },
    { total: 5.5, below: 0 },
    { total: 5, below: NaN },
    { total: 5, below: Infinity },
    { total: 5, below: -1 },
    { total: 5, below: 1.5 },
    { total: 5, below: 6 },
  ])('잘못된 집계값 $total/$below는 unavailable로 처리한다', (input) => {
    expect(computePercentile(input).status).toBe('unavailable');
  });

  it('정상 입력의 topPercent는 항상 1~100 범위의 정수다', () => {
    for (let total = MIN_SAMPLE; total <= 100; total += 1) {
      for (let below = 0; below <= total; below += 1) {
        const { topPercent } = computePercentile({ total, below });

        expect(Number.isInteger(topPercent)).toBe(true);
        expect(topPercent).toBeGreaterThanOrEqual(1);
        expect(topPercent).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe('gradeForPercent()', () => {
  it.each([
    [1, 'jangwon'],
    [10, 'jangwon'],
    [11, 'geupje'],
    [50, 'geupje'],
    [51, 'sungnyeon'],
    [80, 'sungnyeon'],
    [81, 'suryeon'],
    [100, 'suryeon'],
  ] as const)('상위 %i%%를 %s 등급으로 매핑한다', (topPercent, grade) => {
    expect(gradeForPercent(topPercent)).toBe(grade);
  });
});
