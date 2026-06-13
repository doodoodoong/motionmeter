import { SIMPLE_COLORS } from "@/constants/theme";
import { fontScale, hp, wp } from "@/utils/responsive";
import { StyleSheet } from "react-native";

export const homeStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SIMPLE_COLORS.background.primary,
  },
  container: {
    flex: 1,
    backgroundColor: SIMPLE_COLORS.background.primary,
    justifyContent: 'space-between',
    paddingVertical: hp(1.5),
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingTop: hp(4),
    paddingBottom: hp(2),
    backgroundColor: 'transparent',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(3),
    marginBottom: hp(2.5),
  },
  title: {
    color: SIMPLE_COLORS.text.primary,
    fontSize: fontScale(26),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: hp(1),
  },
  subtitle: {
    color: SIMPLE_COLORS.text.secondary,
    fontSize: fontScale(15),
    textAlign: 'center',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: wp(6),
  },
  selectionButton: {
    borderRadius: 12,
    paddingVertical: hp(2.5),
    paddingHorizontal: wp(4),
    alignItems: 'center',
  },
  buttonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(0.5),
  },
  buttonIconWrapper: {
    marginRight: wp(2),
  },
  buttonTitle: {
    color: '#FFFDF8',
    fontSize: fontScale(20),
    fontWeight: '700',
    marginBottom: hp(0.5),
    textAlign: 'center',
  },
  buttonDescription: {
    color: 'rgba(255, 253, 248, 0.82)',
    fontSize: fontScale(13),
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: wp(8),
    paddingBottom: hp(4),
  },
  footerLabel: {
    color: SIMPLE_COLORS.primary,
    fontSize: fontScale(13),
    fontWeight: '600',
    marginBottom: hp(0.6),
    letterSpacing: 1,
  },
  footerText: {
    color: SIMPLE_COLORS.text.muted,
    fontSize: fontScale(12),
    textAlign: 'center',
    lineHeight: fontScale(18),
  },
});
