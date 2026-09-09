import { useMemo } from "react";
import { Dimensions, PixelRatio, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const SHORT_SCREEN_THRESHOLD = 700;

export interface ResponsiveMetricsInput {
  width: number;
  height: number;
  insets: { top: number; bottom: number; left: number; right: number };
  systemFontScale: number;
}

export interface ResponsiveMetrics {
  width: number;
  height: number;
  usableHeight: number;
  usableWidth: number;
  isShort: boolean;
  isNarrow: boolean;
  systemFontScale: number;
  /** isShort일 때 compact 값, 아니면 regular 값을 고른다 */
  pick: <T>(regular: T, compact: T) => T;
}

export function getResponsiveMetrics(
  input: ResponsiveMetricsInput
): ResponsiveMetrics {
  const { width, height, insets, systemFontScale } = input;
  const usableHeight = height - insets.top - insets.bottom;
  const usableWidth = width - insets.left - insets.right;
  const isShort = usableHeight < SHORT_SCREEN_THRESHOLD;

  return {
    width,
    height,
    usableHeight,
    usableWidth,
    isShort,
    isNarrow: width < 375,
    systemFontScale,
    pick: <T>(regular: T, compact: T): T => isShort ? compact : regular,
  };
}

export function useResponsiveMetrics(): ResponsiveMetrics {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const systemFontScale = PixelRatio.getFontScale();

  return useMemo(
    () => getResponsiveMetrics({ width, height, insets, systemFontScale }),
    [
      height,
      insets.bottom,
      insets.left,
      insets.right,
      insets.top,
      systemFontScale,
      width,
    ]
  );
}

/** metrics 기반으로 세로 공간까지 반영한 폰트 크기. 짧은 화면에서 축소된다. */
export function metricFontSize(
  metrics: ResponsiveMetrics,
  size: number
): number {
  const widthRatio = metrics.width / 375;
  const heightRatio = metrics.usableHeight / 812;
  const ratio = Math.min(widthRatio, heightRatio);
  const scaledSize = size + (size * ratio - size) * 0.3;
  const minSize = size * 0.8;
  const maxSize = size * 1.3;

  return Math.max(minSize, Math.min(maxSize, scaledSize));
}

// 화면 크기 가져오기
export const SCREEN_WIDTH = Dimensions.get("window").width;
export const SCREEN_HEIGHT = Dimensions.get("window").height;

// 기준 화면 크기 (iPhone 11 기준)
const baseWidth = 375;
const baseHeight = 812;

// 디바이스 크기 분류
export const isSmallDevice = SCREEN_WIDTH < 375;
export const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
export const isLargeDevice = SCREEN_WIDTH >= 414;
export const isTablet = SCREEN_WIDTH >= 768;

/**
 * 화면 너비 기준 백분율 값 반환
 * @param percentage 백분율 (0-100)
 * @returns 화면 너비에 대한 백분율 값
 */
export const wp = (percentage: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * percentage) / 100);
};

/**
 * 화면 높이 기준 백분율 값 반환
 * @param percentage 백분율 (0-100)
 * @returns 화면 높이에 대한 백분율 값
 */
export const hp = (percentage: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * percentage) / 100);
};

/**
 * 비례 크기 조정 (너비 기준)
 * @param size 기준 크기
 * @returns 화면 비율에 맞게 조정된 크기
 */
export const scale = (size: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH / baseWidth) * size);
};

/**
 * 비례 크기 조정 (높이 기준)
 * @param size 기준 크기
 * @returns 화면 비율에 맞게 조정된 크기
 */
export const verticalScale = (size: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT / baseHeight) * size);
};

/**
 * 완화된 비례 크기 조정 (폰트 크기 등에 적합)
 * @param size 기준 크기
 * @param factor 조정 계수 (기본값: 0.5)
 * @returns 완화된 비율로 조정된 크기
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
  return PixelRatio.roundToNearestPixel(
    size + (scale(size) - size) * factor
  );
};

/**
 * 완화된 수직 비례 크기 조정
 * @param size 기준 크기
 * @param factor 조정 계수 (기본값: 0.5)
 * @returns 완화된 비율로 조정된 크기
 */
export const moderateVerticalScale = (size: number, factor: number = 0.5): number => {
  return PixelRatio.roundToNearestPixel(
    size + (verticalScale(size) - size) * factor
  );
};

/**
 * 폰트 크기 조정 (플랫폼별 최적화)
 * @param size 기준 폰트 크기
 * @returns 조정된 폰트 크기
 */
export const fontScale = (size: number): number => {
  const scaledSize = moderateScale(size, 0.3);
  // 최소 및 최대 크기 제한
  const minSize = size * 0.8;
  const maxSize = size * 1.3;
  return Math.max(minSize, Math.min(maxSize, scaledSize));
};

/**
 * 현재 화면 크기 정보 반환
 */
export const screenInfo = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: isSmallDevice,
  isMedium: isMediumDevice,
  isLarge: isLargeDevice,
  isTablet: isTablet,
};

/**
 * 반응형 값 선택 (디바이스 크기에 따라)
 * @param small 소형 디바이스 값
 * @param medium 중형 디바이스 값
 * @param large 대형 디바이스 값
 * @param tablet 태블릿 값 (선택)
 * @returns 현재 디바이스에 맞는 값
 */
export const responsive = <T>(
  small: T,
  medium: T,
  large: T,
  tablet?: T
): T => {
  if (isTablet && tablet !== undefined) return tablet;
  if (isLargeDevice) return large;
  if (isMediumDevice) return medium;
  return small;
};

export default {
  wp,
  hp,
  scale,
  verticalScale,
  moderateScale,
  moderateVerticalScale,
  fontScale,
  responsive,
  screenInfo,
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
  isTablet,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
};
