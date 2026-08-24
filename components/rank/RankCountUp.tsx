import { FONT_FAMILY } from '@/constants/theme';
import { fontScale } from '@/utils/responsive';
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { interpolate, useAnimatedProps, type SharedValue } from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

type RankCountUpProps = {
  topPercent: number;
  color: string;
  progress: SharedValue<number>;
  label: string;
  accessibilityLabel: string;
};

export function RankCountUp({ topPercent, color, progress, label, accessibilityLabel }: RankCountUpProps) {
  const animatedProps = useAnimatedProps(() => {
    const value = Math.round(topPercent * interpolate(progress.value, [0.08, 0.5], [0, 1], 'clamp'));
    return { text: String(value), defaultValue: String(value) } as never;
  });

  return (
    <View style={styles.row} accessibilityLabel={accessibilityLabel}>
      <Text style={styles.label}>{label}</Text>
      <AnimatedTextInput
        animatedProps={animatedProps}
        editable={false}
        underlineColorAndroid="transparent"
        style={[styles.number, { color }]}
      />
      <Text style={[styles.percent, { color }]}>%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', height: fontScale(68) },
  label: { color: '#F3EFE6', fontFamily: FONT_FAMILY.semibold, fontSize: fontScale(20), marginRight: 8 },
  number: { fontFamily: FONT_FAMILY.extrabold, fontSize: fontScale(54), padding: 0, minWidth: 68, textAlign: 'right' },
  percent: { fontFamily: FONT_FAMILY.bold, fontSize: fontScale(28), marginLeft: 2 },
});
