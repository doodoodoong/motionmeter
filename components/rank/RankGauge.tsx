import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { interpolate, useAnimatedProps, type SharedValue } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SIZE = 270;
const CENTER = SIZE / 2;
const RADIUS = 116;

interface RankGaugeProps {
  topPercent: number;
  color: string;
  progress: SharedValue<number>;
  double?: boolean;
}

function GaugeCircle({ radius, opacity, topPercent, color, progress }: RankGaugeProps & { radius: number; opacity: number }) {
  const circumference = 2 * Math.PI * radius;
  const fill = Math.max(0.04, Math.min(1, 1 - topPercent / 100));
  const animatedProps = useAnimatedProps(() => {
    const localProgress = interpolate(progress.value, [0.14, 0.61], [0, 1], 'clamp');
    return { strokeDashoffset: circumference * (1 - fill * localProgress) };
  });

  return (
    <AnimatedCircle
      animatedProps={animatedProps}
      cx={CENTER}
      cy={CENTER}
      r={radius}
      fill="none"
      stroke={color}
      strokeWidth={radius === RADIUS ? 7 : 2}
      strokeOpacity={opacity}
      strokeLinecap="round"
      strokeDasharray={`${circumference} ${circumference}`}
      transform={`rotate(-90 ${CENTER} ${CENTER})`}
    />
  );
}

export function RankGauge(props: RankGaugeProps) {
  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="rgba(243,239,230,0.1)" strokeWidth={7} />
        <GaugeCircle {...props} radius={RADIUS} opacity={1} />
        {props.double ? <GaugeCircle {...props} radius={RADIUS - 12} opacity={0.55} /> : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({ container: { position: 'absolute', alignItems: 'center', justifyContent: 'center' } });
