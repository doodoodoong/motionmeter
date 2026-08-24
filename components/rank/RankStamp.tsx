import { FONT_FAMILY, type RankPresentationConfig } from '@/constants/theme';
import { fontScale, wp } from '@/utils/responsive';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, interpolate, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, type SharedValue } from 'react-native-reanimated';

interface RankStampProps {
  config: RankPresentationConfig;
  progress: SharedValue<number>;
  label?: string;
  reducedMotion?: boolean;
}

export function RankStamp({ config, progress, label, reducedMotion = false }: RankStampProps) {
  const stampScale = useSharedValue(reducedMotion ? 1 : 2.4);

  useEffect(() => {
    if (reducedMotion) {
      stampScale.value = 1;
      return;
    }
    const damping = config.stampBounce === 'strong' ? 7 : 11;
    stampScale.value = 2.4;
    stampScale.value = withDelay(650, withSequence(
      withSpring(0.88, { damping, stiffness: 260 }),
      withSpring(1.05, { damping: 10, stiffness: 230 }),
      withSpring(1, { damping: 14, stiffness: 240 }),
    ));
    return () => cancelAnimation(stampScale);
  }, [config.stampBounce, reducedMotion, stampScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.32, 0.36, 0.62], [0, 1, 1], 'clamp'),
    transform: [{ scale: stampScale.value }, { rotate: '-3deg' }],
  }));

  return (
    <View style={styles.frame} pointerEvents="none">
      {Array.from({ length: config.inkCircleCount }, (_, index) => (
        <View
          key={index}
          style={[
            styles.inkCircle,
            { borderColor: config.color, width: wp(38 + index * 7), height: wp(38 + index * 7), opacity: 0.25 - index * 0.07 },
          ]}
        />
      ))}
      <Animated.View style={[styles.stamp, { borderColor: config.color }, animatedStyle]}>
        <View style={[styles.innerBorder, { borderColor: config.color }]}>
          <Text style={[styles.text, { color: config.color }]}>{label ?? config.name}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: wp(54), height: wp(54), alignItems: 'center', justifyContent: 'center' },
  stamp: {
    width: wp(36), height: wp(36), borderWidth: 4, borderRadius: wp(3),
    alignItems: 'center', justifyContent: 'center', padding: wp(1.5),
  },
  innerBorder: {
    width: '100%', height: '100%', borderWidth: 1.5, borderRadius: wp(1.5),
    alignItems: 'center', justifyContent: 'center',
  },
  text: { fontFamily: FONT_FAMILY.extrabold, fontSize: fontScale(34), letterSpacing: 3 },
  inkCircle: { position: 'absolute', borderWidth: 1.5, borderRadius: 999 },
});
