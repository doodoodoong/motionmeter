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
 * 심플 라이트 테마
 */
export const SIMPLE_COLORS = {
  background: {
    primary: '#F8F9FA',      // 옅은 회색 배경
    secondary: '#FFFFFF',    // 흰색 패널/카드
    card: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.4)',
  },
  
  primary: '#007AFF', // 메인 브랜드 컬러 (iOS 기본 블루)
  
  text: {
    primary: '#1C1C1E',      // 강한 검정
    secondary: '#3A3A3C',    // 중간 텍스트
    muted: '#8E8E93',        // 아주 옅은 보조 텍스트
  },
  
  border: {
    light: '#E5E5EA',
    medium: '#C7C7CC',
  },
  
  gauge: {
    flail: '#5AC8FA',   // 시안 계열의 파랑
    staff: '#4CD964',   // 밝은 초록
    track: '#EFEFEF',   // 게이지 배경 회색
  }
};

export const SIMPLE_STYLES = {
  card: {
    backgroundColor: SIMPLE_COLORS.background.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: SIMPLE_COLORS.border.medium,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  primaryButton: {
    backgroundColor: SIMPLE_COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center' as const,
  }
};
