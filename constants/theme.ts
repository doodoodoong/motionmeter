/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

/**
 * 전통 측정 도구 테마 — "종이 + 먹 + 놋쇠"
 * 전통무기를 측정하는 현대 도구를 지향. 이모지/기본 블루 배제, 소재 기반 색만 사용.
 */
export const SIMPLE_COLORS = {
  background: {
    primary: '#F3EFE6',      // 종이색 기본 배경
    secondary: '#FFFDF8',    // 카드/패널
    card: '#FFFDF8',
    overlay: 'rgba(31, 37, 32, 0.4)',
  },

  primary: '#B08A3C',        // 놋쇠 — 포인트/CTA
  primaryPressed: '#8E6E2F', // CTA pressed

  text: {
    primary: '#1F2520',      // 먹색
    secondary: '#6F6A60',    // 보조 텍스트
    muted: '#7A7468',        // 수치 단위 등
  },

  border: {
    light: '#E3DCCE',
    medium: '#DDD6C8',
  },

  // 무기별 소재 색
  weapon: {
    flail: '#7A4A2A',        // 편곤 — 목재 갈색
    staff: '#2F5D45',        // 봉 — 짙은 녹갈색
  },

  gauge: {
    flail: '#7A4A2A',        // 편곤 목재 갈색
    staff: '#2F5D45',        // 봉 녹갈색
    track: '#DDD6C8',        // 게이지 트랙
  },
};

/**
 * Pretendard 폰트 패밀리. weight별 static 파일을 각각의 패밀리로 등록한다
 * (RN에서 static 폰트는 fontWeight가 아니라 fontFamily로 굵기를 지정해야 안정적).
 */
export const FONT_FAMILY = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
  extrabold: 'Pretendard-ExtraBold',
} as const;

/** fontWeight 값을 Pretendard 패밀리로 변환 */
export function fontFamilyForWeight(weight?: string | number): string {
  const w = typeof weight === 'number' ? String(weight) : weight;
  switch (w) {
    case '500':
      return FONT_FAMILY.medium;
    case '600':
      return FONT_FAMILY.semibold;
    case '700':
    case 'bold':
      return FONT_FAMILY.bold;
    case '800':
    case '900':
      return FONT_FAMILY.extrabold;
    default:
      return FONT_FAMILY.regular; // '400' | 'normal' | undefined
  }
}

export const SIMPLE_STYLES = {
  card: {
    backgroundColor: SIMPLE_COLORS.background.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: SIMPLE_COLORS.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  button: {
    backgroundColor: SIMPLE_COLORS.background.secondary,
    borderWidth: 1,
    borderColor: SIMPLE_COLORS.border.medium,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center' as const,
  },
  primaryButton: {
    backgroundColor: SIMPLE_COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center' as const,
  },
};
