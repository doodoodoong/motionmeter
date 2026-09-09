import { FONT_FAMILY, type RankPresentationConfig } from '@/constants/theme';
import { fontScale, wp } from '@/utils/responsive';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, interpolate, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, type SharedValue } from 'react-native-reanimated';

interface RankStampProps {
  config: RankPresentationConfig;
  progress: SharedValue<number>;
  label: string;
  reducedMotion?: boolean;
  size?: number;
}

export function RankStamp({ config, progress, label, reducedMotion = false, size }: RankStampProps) {
  const glyphCount = label.replace(/\s/g, '').length;
  const sizeRatio = size === undefined ? 1 : size / 270;
  const labelFontSize = fontScale(Math.max(22, 34 - Math.max(0, glyphCount - 2) * 6)) * sizeRatio;
  const frameSize = size === undefined ? wp(54) : size * 0.75;
  const stampSize = size === undefined ? wp(36) : size * 0.5;
  const stampBorderWidth = size === undefined ? 4 : size * (4 / 270);
  const stampBorderRadius = size === undefined ? wp(3) : size * (11.25 / 270);
  const stampPadding = size === undefined ? wp(1.5) : size * (5.625 / 270);
  const innerBorderWidth = size === undefined ? 1.5 : size * (1.5 / 270);
  const innerBorderRadius = size === undefined ? wp(1.5) : size * (5.625 / 270);
  const inkBorderWidth = size === undefined ? 1.5 : size * (1.5 / 270);
  const textOffset = size === undefined ? 3 : size * (3 / 270);
  const letterSpacing = size === undefined ? 3 : size * (3 / 270);
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
    <View style={[styles.frame, { width: frameSize, height: frameSize }]} pointerEvents="none">
      {Array.from({ length: config.inkCircleCount }, (_, index) => (
        <View
          key={index}
          style={[
            styles.inkCircle,
            {
              borderColor: config.color,
              borderWidth: inkBorderWidth,
              width: size === undefined ? wp(38 + index * 7) : size * ((142.5 + index * 26.25) / 270),
              height: size === undefined ? wp(38 + index * 7) : size * ((142.5 + index * 26.25) / 270),
              opacity: 0.25 - index * 0.07,
            },
          ]}
        />
      ))}
      <Animated.View style={[styles.stamp, { width: stampSize, height: stampSize, borderColor: config.color, borderWidth: stampBorderWidth, borderRadius: stampBorderRadius, padding: stampPadding }, animatedStyle]}>
        <View style={[styles.innerBorder, { borderColor: config.color, borderWidth: innerBorderWidth, borderRadius: innerBorderRadius }]}>
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={1.2}
            style={[styles.text, { color: config.color, fontSize: labelFontSize, lineHeight: labelFontSize * 1.15, marginLeft: textOffset, letterSpacing }]}
          >
            {label}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center' },
  stamp: {
    alignItems: 'center', justifyContent: 'center', padding: wp(1.5),
  },
  innerBorder: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  text: {
    width: '100%',
    fontFamily: FONT_FAMILY.extrabold,
    textAlign: 'center',
    includeFontPadding: false,
  },
  inkCircle: { position: 'absolute', borderRadius: 999 },
});
