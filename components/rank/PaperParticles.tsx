import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '@/utils/responsive';

interface ParticleSpec { x: number; y: number; size: number; angle: number; delay: number; rotation: number }
interface PaperParticlesProps { count: number; color: string; progress: SharedValue<number>; reducedMotion: boolean }

function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

const Particle = memo(function Particle({ spec, color, progress }: { spec: ParticleSpec; color: string; progress: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => {
    const local = Math.max(0, Math.min(1, (progress.value - (0.39 + spec.delay * 0.2)) / 0.41));
    return {
      opacity: interpolate(local, [0, 0.12, 0.72, 1], [0, 1, 0.9, 0]),
      transform: [
        { translateX: spec.x * local },
        { translateY: spec.y * local + 55 * local * local },
        { rotate: `${spec.angle + spec.rotation * local}deg` },
        { scale: interpolate(local, [0, 0.15, 1], [0.2, 1, 0.72]) },
      ],
    };
  });
  return <Animated.View style={[styles.particle, { width: spec.size, height: spec.size * 0.48, backgroundColor: color }, animatedStyle]} />;
});

export function PaperParticles({ count, color, progress, reducedMotion }: PaperParticlesProps) {
  const particles = useMemo<ParticleSpec[]>(() => Array.from({ length: reducedMotion ? Math.min(4, count) : count }, (_, index) => {
    const angle = pseudoRandom(index + 1) * Math.PI * 2;
    const distance = 80 + pseudoRandom(index + 19) * Math.min(SCREEN_WIDTH * 0.52, SCREEN_HEIGHT * 0.3);
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      size: 5 + pseudoRandom(index + 37) * 8,
      angle: angle * 57.2958,
      delay: pseudoRandom(index + 53),
      rotation: -180 + pseudoRandom(index + 71) * 540,
    };
  }), [count, reducedMotion]);

  return (
    <View style={styles.layer} pointerEvents="none">
      {particles.map((spec, index) => <Particle key={index} spec={spec} color={index % 3 === 0 ? '#F3EFE6' : color} progress={progress} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  particle: { position: 'absolute', borderRadius: 1 },
});
