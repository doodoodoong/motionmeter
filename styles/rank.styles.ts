import { FONT_FAMILY, RANK_COLORS } from '@/constants/theme';
import { fontScale, hp, wp } from '@/utils/responsive';
import { StyleSheet } from 'react-native';

export const rankStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: RANK_COLORS.background },
  screen: { flex: 1, backgroundColor: RANK_COLORS.background, overflow: 'hidden' },
  textureLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(243,239,230,0.025)' },
  flash: { ...StyleSheet.absoluteFillObject, backgroundColor: RANK_COLORS.card },
  content: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: wp(7), paddingTop: hp(5), paddingBottom: hp(3) },
  eyebrow: { color: 'rgba(243,239,230,0.64)', fontFamily: FONT_FAMILY.semibold, fontSize: fontScale(13), letterSpacing: 3 },
  arena: { width: wp(92), height: hp(58), alignItems: 'center', justifyContent: 'center' },
  gaugeLayer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  mainCopy: { zIndex: 3, alignItems: 'center', justifyContent: 'center' },
  stampSpacing: { marginTop: hp(1.5) },
  fallbackTitle: { color: RANK_COLORS.paper, fontFamily: FONT_FAMILY.extrabold, fontSize: fontScale(28), textAlign: 'center', marginBottom: hp(1) },
  population: { color: 'rgba(243,239,230,0.66)', fontFamily: FONT_FAMILY.medium, fontSize: fontScale(14), marginTop: hp(0.5) },
  indexCaption: { color: 'rgba(243,239,230,0.45)', fontFamily: FONT_FAMILY.regular, fontSize: fontScale(12), marginTop: hp(0.5) },
  encouragement: { color: RANK_COLORS.paper, fontFamily: FONT_FAMILY.semibold, fontSize: fontScale(16), lineHeight: fontScale(23), textAlign: 'center', marginBottom: hp(2) },
  footer: { width: '100%', alignItems: 'center' },
  detailButton: { width: '100%', borderWidth: 1.5, borderRadius: 12, paddingVertical: hp(1.8), alignItems: 'center', justifyContent: 'center' },
  detailButtonDisabled: { opacity: 0.38 },
  detailButtonText: { fontFamily: FONT_FAMILY.bold, fontSize: fontScale(16) },
});
