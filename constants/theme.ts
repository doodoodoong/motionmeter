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
 * 사이버조선 (Cyber-Joseon) 테마
 * 전통 조선시대 미학과 미래지향적 사이버펑크 요소의 융합
 */

// 사이버조선 색상 팔레트
export const CYBER_COLORS = {
  // 배경색
  background: {
    primary: '#050505',      // 매우 어두운 검정
    secondary: '#0A0A12',    // 어두운 남색
    card: 'rgba(10, 10, 18, 0.85)',  // 반투명 카드 배경
    overlay: 'rgba(5, 5, 5, 0.7)',   // 오버레이
  },
  
  // 네온 포인트 컬러
  neon: {
    cyan: '#00F0FF',         // 네온 시안 - 메인 포인트
    cyanDim: 'rgba(0, 240, 255, 0.3)',  // 흐린 시안
    magenta: '#FF00FF',      // 네온 마젠타 - 강조
    blue: '#0077FF',         // 네온 블루
    green: '#00FF88',        // 네온 그린
  },
  
  // 텍스트 색상
  text: {
    primary: '#FFFFFF',      // 흰색
    secondary: '#00D4E6',    // 밝은 시안
    muted: 'rgba(255, 255, 255, 0.6)',  // 흐린 흰색
  },
  
  // 상태 색상
  status: {
    success: '#00FF88',
    warning: '#FFB800',
    error: '#FF3366',
    info: '#00F0FF',
  },
};

// 네온 글로우 효과 스타일
export const NEON_GLOW = {
  cyan: {
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  magenta: {
    shadowColor: '#FF00FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  subtle: {
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
};

// 텍스트 글로우 효과
export const TEXT_GLOW = {
  cyan: {
    textShadowColor: '#00F0FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  strong: {
    textShadowColor: '#00F0FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
};

// 공통 컴포넌트 스타일
export const CYBER_STYLES = {
  // 네온 테두리 카드
  neonCard: {
    backgroundColor: CYBER_COLORS.background.card,
    borderWidth: 1,
    borderColor: CYBER_COLORS.neon.cyanDim,
    borderRadius: 12,
    ...NEON_GLOW.subtle,
  },
  
  // 네온 버튼
  neonButton: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: CYBER_COLORS.neon.cyan,
    borderRadius: 8,
    ...NEON_GLOW.cyan,
  },
  
  // 액티브 버튼
  activeButton: {
    backgroundColor: 'rgba(0, 240, 255, 0.2)',
    borderWidth: 2,
    borderColor: CYBER_COLORS.neon.cyan,
    borderRadius: 8,
    ...NEON_GLOW.cyan,
  },
  
  // 위험 버튼 (정지, 삭제 등)
  dangerButton: {
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
    borderWidth: 1,
    borderColor: '#FF3366',
    borderRadius: 8,
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  
  // 성공 버튼
  successButton: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderWidth: 1,
    borderColor: '#00FF88',
    borderRadius: 8,
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  
  // 입력 필드
  input: {
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    borderWidth: 1,
    borderColor: CYBER_COLORS.neon.cyanDim,
    borderRadius: 8,
    color: CYBER_COLORS.text.primary,
  },
};

// 그래프 차트 설정
export const CYBER_CHART_CONFIG = {
  backgroundColor: CYBER_COLORS.background.secondary,
  backgroundGradientFrom: CYBER_COLORS.background.secondary,
  backgroundGradientTo: CYBER_COLORS.background.primary,
  decimalPlaces: 2,
  color: (opacity = 1) => `rgba(0, 240, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: CYBER_COLORS.neon.cyan,
  },
};
