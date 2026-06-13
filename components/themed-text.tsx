import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { fontFamilyForWeight } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  const typeStyle =
    type === 'title' ? styles.title :
    type === 'defaultSemiBold' ? styles.defaultSemiBold :
    type === 'subtitle' ? styles.subtitle :
    type === 'link' ? styles.link :
    styles.default;

  // 최종 적용되는 fontWeight를 읽어 Pretendard 패밀리로 치환
  const flattened = (StyleSheet.flatten([typeStyle, style]) || {}) as TextStyle;
  const fontFamily = fontFamilyForWeight(flattened.fontWeight);

  return (
    <Text
      style={[
        { color },
        typeStyle,
        style,
        // static 폰트는 family가 굵기를 결정하므로 fontWeight는 normal로 고정해 합성굵기 방지
        { fontFamily, fontWeight: 'normal' },
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});
