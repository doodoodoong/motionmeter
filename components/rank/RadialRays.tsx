import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

interface RadialRaysProps { count: number; color: string; progress: SharedValue<number> }

export function RadialRays({ count, color, progress }: RadialRaysProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.38, 0.55, 1], [0, 0.58, 0.22], 'clamp'),
    transform: [
      { scale: interpolate(progress.value, [0.38, 1], [0.35, 1.15], 'clamp') },
      { rotate: `${interpolate(progress.value, [0.38, 1], [-8, 5], 'clamp')}deg` },
    ],
  }));

  if (count === 0) return null;
  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={[styles.ray, { backgroundColor: color, transform: [{ rotate: `${index * (360 / count)}deg` }] }]} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  ray: { position: 'absolute', width: 2, height: '68%', opacity: 0.55 },
});
