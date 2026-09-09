import {
  SHORT_SCREEN_THRESHOLD,
  getResponsiveMetrics,
  metricFontSize,
  type ResponsiveMetricsInput,
} from '@/utils/responsive';

const noInsets = { top: 0, bottom: 0, left: 0, right: 0 };

function metrics(input: Partial<ResponsiveMetricsInput> = {}) {
  return getResponsiveMetrics({
    width: 375,
    height: 812,
    insets: noInsets,
    systemFontScale: 1,
    ...input,
  });
}

describe('getResponsiveMetrics()', () => {
  it('XCover 5의 safe area를 제외한 크기와 compact 상태를 계산한다', () => {
    const result = metrics({
      width: 360,
      height: 740,
      insets: { top: 24, bottom: 48, left: 0, right: 0 },
    });

    expect(result.usableHeight).toBe(668);
    expect(result.isShort).toBe(true);
    expect(result.isNarrow).toBe(true);
  });

  it('iPhone 11은 짧거나 좁은 화면으로 분류하지 않는다', () => {
    const result = metrics({
      width: 375,
      height: 812,
      insets: { top: 44, bottom: 34, left: 0, right: 0 },
    });

    expect(result.isShort).toBe(false);
    expect(result.isNarrow).toBe(false);
  });

  it('pick()은 짧은 화면에서 compact 값을, 그 외에는 regular 값을 고른다', () => {
    expect(metrics({ height: 699 }).pick('A', 'B')).toBe('B');
    expect(metrics({ height: 700 }).pick('A', 'B')).toBe('A');
  });

  it.each([
    [SHORT_SCREEN_THRESHOLD, false],
    [SHORT_SCREEN_THRESHOLD - 1, true],
  ] as const)(
    'usableHeight가 %i일 때 isShort가 %s다',
    (usableHeight, expected) => {
      expect(metrics({ height: usableHeight }).isShort).toBe(expected);
    }
  );
});

describe('metricFontSize()', () => {
  it('짧은 화면에서 기준 폰트 크기보다 작게 조정한다', () => {
    const result = metricFontSize(metrics({ width: 360, height: 668 }), 20);

    expect(result).toBeLessThan(20);
  });

  it('화면이 매우 작아도 기준 폰트 크기의 0.8배보다 작아지지 않는다', () => {
    const result = metricFontSize(metrics({ width: 1, height: 1 }), 20);

    expect(result).toBe(16);
  });
});
