import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { interpolate, useAnimatedProps, type SharedValue } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const DEFAULT_SIZE = 270;
const RADIUS_RATIO = 116 / DEFAULT_SIZE;
const OUTER_STROKE_RATIO = 7 / DEFAULT_SIZE;
const INNER_STROKE_RATIO = 2 / DEFAULT_SIZE;
const DOUBLE_GAP_RATIO = 12 / DEFAULT_SIZE;

interface RankGaugeProps {
  topPercent: number;
  color: string;
  progress: SharedValue<number>;
  double?: boolean;
  size?: number;
}

function GaugeCircle({ radius, center, strokeWidth, opacity, topPercent, color, progress }: RankGaugeProps & { radius: number; center: number; strokeWidth: number; opacity: number }) {
  const circumference = 2 * Math.PI * radius;
  const fill = Math.max(0.04, Math.min(1, 1 - topPercent / 100));
  const animatedProps = useAnimatedProps(() => {
    const localProgress = interpolate(progress.value, [0.14, 0.61], [0, 1], 'clamp');
    return { strokeDashoffset: circumference * (1 - fill * localProgress) };
  });

  return (
    <AnimatedCircle
      animatedProps={animatedProps}
      cx={center}
      cy={center}
      r={radius}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeOpacity={opacity}
      strokeLinecap="round"
      strokeDasharray={`${circumference} ${circumference}`}
      transform={`rotate(-90 ${center} ${center})`}
    />
  );
}

export function RankGauge(props: RankGaugeProps) {
  const size = props.size ?? DEFAULT_SIZE;
  const center = size / 2;
  const radius = size * RADIUS_RATIO;
  const outerStrokeWidth = size * OUTER_STROKE_RATIO;
  const innerStrokeWidth = size * INNER_STROKE_RATIO;

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(243,239,230,0.1)" strokeWidth={outerStrokeWidth} />
        <GaugeCircle {...props} radius={radius} center={center} strokeWidth={outerStrokeWidth} opacity={1} />
        {props.double ? <GaugeCircle {...props} radius={radius - size * DOUBLE_GAP_RATIO} center={center} strokeWidth={innerStrokeWidth} opacity={0.55} /> : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({ container: { position: 'absolute', alignItems: 'center', justifyContent: 'center' } });
