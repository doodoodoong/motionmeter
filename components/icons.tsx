import React from "react";
import Svg, { Path, Polyline, Rect, Circle } from "react-native-svg";

/**
 * 절제된 선형 아이콘 세트 (이모지 대체).
 * react-native-svg 기반, stroke 스타일 통일. 새 의존성 없음.
 */
type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

const DEFAULTS = {
  size: 20,
  color: "#1F2520",
  strokeWidth: 2,
};

function frame(size: number) {
  return { width: size, height: size, viewBox: "0 0 24 24" };
}

// 측정 시작
export function PlayIcon({ size = DEFAULTS.size, color = DEFAULTS.color }: IconProps) {
  return (
    <Svg {...frame(size)} fill="none">
      <Path d="M7 5l12 7-12 7V5z" fill={color} />
    </Svg>
  );
}

// 측정 완료 / 정지
export function StopIcon({ size = DEFAULTS.size, color = DEFAULTS.color }: IconProps) {
  return (
    <Svg {...frame(size)} fill="none">
      <Rect x="6" y="6" width="12" height="12" rx="2" fill={color} />
    </Svg>
  );
}

// 화면 저장 (카메라)
export function CameraIcon({ size = DEFAULTS.size, color = DEFAULTS.color, strokeWidth = DEFAULTS.strokeWidth }: IconProps) {
  return (
    <Svg {...frame(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
      <Circle cx="12" cy="13" r="3.5" />
    </Svg>
  );
}

// 다시 측정 (회전)
export function RotateIcon({ size = DEFAULTS.size, color = DEFAULTS.color, strokeWidth = DEFAULTS.strokeWidth }: IconProps) {
  return (
    <Svg {...frame(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 12a9 9 0 1 0 3-6.7" />
      <Polyline points="3 3 3 7 7 7" />
    </Svg>
  );
}

// 뒤로가기 (셰브론)
export function ChevronLeftIcon({ size = DEFAULTS.size, color = DEFAULTS.color, strokeWidth = DEFAULTS.strokeWidth }: IconProps) {
  return (
    <Svg {...frame(size)} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="15 5 8 12 15 19" />
    </Svg>
  );
}
