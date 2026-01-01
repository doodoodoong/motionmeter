import { CYBER_COLORS, NEON_GLOW, TEXT_GLOW } from "@/constants/theme";
import { fontScale, hp, wp } from "@/utils/responsive";
import { StyleSheet } from "react-native";

export const homeStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CYBER_COLORS.background.primary,
  },
  container: {
    flex: 1,
    backgroundColor: CYBER_COLORS.background.primary,
    justifyContent: 'space-between',
    paddingVertical: hp(1.5),
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(1),
    backgroundColor: 'transparent',
  },
  title: {
    color: CYBER_COLORS.text.primary,
    fontSize: fontScale(28),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: hp(0.5),
    ...TEXT_GLOW.strong,
  },
  subtitle: {
    color: CYBER_COLORS.text.secondary,
    fontSize: fontScale(14),
    textAlign: 'center',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: wp(5),
    gap: hp(2),
  },
  selectionButton: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: hp(2.5),
    paddingHorizontal: wp(5),
    alignItems: 'center',
  },
  elementaryButton: {
    backgroundColor: CYBER_COLORS.background.card,
    borderColor: CYBER_COLORS.neon.cyan,
    ...NEON_GLOW.cyan,
  },
  secondaryButton: {
    backgroundColor: CYBER_COLORS.background.card,
    borderColor: CYBER_COLORS.neon.magenta,
    shadowColor: '#FF00FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  buttonTitle: {
    color: CYBER_COLORS.text.primary,
    fontSize: fontScale(22),
    fontWeight: 'bold',
    marginBottom: hp(0.5),
    textAlign: 'center',
    ...TEXT_GLOW.cyan,
  },
  buttonDescription: {
    color: CYBER_COLORS.text.muted,
    fontSize: fontScale(13),
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingBottom: hp(1),
  },
  footerCard: {
    backgroundColor: CYBER_COLORS.background.card,
    borderWidth: 1,
    borderColor: CYBER_COLORS.neon.cyanDim,
    borderRadius: 10,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    ...NEON_GLOW.subtle,
  },
  footerText: {
    color: CYBER_COLORS.text.secondary,
    fontSize: fontScale(11),
    textAlign: 'center',
  },
});
