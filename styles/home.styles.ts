import { SIMPLE_COLORS, SIMPLE_STYLES } from "@/constants/theme";
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
    paddingTop: hp(5),
    paddingBottom: hp(2),
    backgroundColor: 'transparent',
  },
  title: {
    color: SIMPLE_COLORS.text.primary,
    fontSize: fontScale(26),
    fontWeight: '800',
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
    ...SIMPLE_STYLES.primaryButton,
    paddingVertical: hp(2.5),
    paddingHorizontal: wp(4),
  },
  elementaryButton: {
    // keeping object key for index.tsx ref but utilizing simple styles
  },
  buttonTitle: {
    color: '#FFFFFF',
    fontSize: fontScale(20),
    fontWeight: 'bold',
    marginBottom: hp(0.5),
    textAlign: 'center',
  },
  buttonDescription: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: fontScale(13),
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingBottom: hp(4),
  },
  footerCard: {
    ...SIMPLE_STYLES.card,
    backgroundColor: SIMPLE_COLORS.background.secondary,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderRadius: 12,
  },
  footerText: {
    color: SIMPLE_COLORS.text.muted,
    fontSize: fontScale(12),
    textAlign: 'center',
  },
});
