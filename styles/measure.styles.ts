import { SIMPLE_COLORS, SIMPLE_STYLES } from "@/constants/theme";
import { fontScale, hp, wp } from "@/utils/responsive";
import { StyleSheet } from "react-native";

const COMPACT_TRAIL_SIZE = wp(38);

export const measureStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SIMPLE_COLORS.background.primary,
  },
  header: {
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SIMPLE_COLORS.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: SIMPLE_COLORS.border.light,
  },
  headerSide: {
    minWidth: wp(24),
    flexShrink: 0,
  },
  headerSpacer: {
    minWidth: wp(24),
    flexShrink: 0,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(2),
  },
  backButtonText: {
    color: SIMPLE_COLORS.text.primary,
    fontSize: fontScale(15),
    fontWeight: '500',
    marginLeft: 2,
  },
  title: {
    flex: 1,
    color: SIMPLE_COLORS.text.primary,
    fontSize: fontScale(18),
    fontWeight: '600',
    textAlign: 'center',
  },

  stateContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: wp(6),
    paddingBottom: hp(2),
  },
  stateBody: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateFooter: {
    flexShrink: 0,
    width: '100%',
  },

  // --- Ready ---
  readyBox: {
    ...SIMPLE_STYLES.card,
    width: '100%',
    alignItems: 'center',
    paddingVertical: hp(4),
    marginBottom: hp(4),
  },
  readyTitle: {
    fontSize: fontScale(20),
    fontWeight: '600',
    color: SIMPLE_COLORS.text.primary,
    marginBottom: hp(1),
  },
  readyDescription: {
    fontSize: fontScale(15),
    color: SIMPLE_COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: fontScale(22),
  },
  rankCaption: {
    marginTop: hp(1.4),
    color: SIMPLE_COLORS.primary,
    fontSize: fontScale(13),
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    width: '100%',
    borderRadius: 10,
    paddingVertical: hp(2),
  },
  startButtonText: {
    fontSize: fontScale(17),
    fontWeight: '600',
    color: '#FFFDF8',
  },

  // --- Measuring ---
  measuringBox: {
    width: '100%',
    alignItems: 'center',
    marginBottom: hp(7),
  },
  measuringTitle: {
    fontSize: fontScale(20),
    fontWeight: '600',
    color: SIMPLE_COLORS.text.primary,
    marginBottom: hp(1),
  },
  measuringDescription: {
    fontSize: fontScale(15),
    color: SIMPLE_COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: fontScale(22),
  },
  liveCenter: {
    width: '100%',
    minHeight: wp(48),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(7),
  },
  trail: {
    position: 'absolute',
    width: wp(48),
    height: wp(48),
    borderRadius: wp(24),
    borderWidth: 1.5,
    borderColor: 'rgba(176, 138, 60, 0.18)',
    borderTopColor: 'rgba(176, 138, 60, 0.45)',
  },
  liveValue: {
    fontSize: fontScale(44),
    lineHeight: fontScale(58),
    fontWeight: '700',
    color: SIMPLE_COLORS.text.primary,
    textAlign: 'center',
    includeFontPadding: false,
    paddingVertical: hp(0.5),
  },
  liveUnit: {
    fontSize: fontScale(15),
    color: SIMPLE_COLORS.text.muted,
    marginTop: hp(0.3),
  },
  maxLine: {
    width: wp(10),
    height: 1.5,
    backgroundColor: SIMPLE_COLORS.primary,
    marginTop: hp(3),
    marginBottom: hp(1.5),
  },
  maxRecord: {
    fontSize: fontScale(14),
    color: SIMPLE_COLORS.text.secondary,
    fontWeight: '500',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
    width: '100%',
    borderRadius: 10,
    paddingVertical: hp(2.2),
    marginTop: hp(2),
    backgroundColor: SIMPLE_COLORS.text.primary,
  },
  stopButtonText: {
    fontSize: fontScale(17),
    fontWeight: '600',
    color: '#FFFDF8',
  },
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 999,
  },
  splashVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export const measureCompactStyles = StyleSheet.create({
  readyBox: {
    paddingVertical: hp(2),
    marginBottom: hp(2),
  },
  measuringBox: {
    marginBottom: hp(3),
  },
  liveCenter: {
    minHeight: COMPACT_TRAIL_SIZE,
    marginBottom: hp(3),
  },
  trail: {
    width: COMPACT_TRAIL_SIZE,
    height: COMPACT_TRAIL_SIZE,
    borderRadius: COMPACT_TRAIL_SIZE / 2,
  },
  liveValue: {
    fontSize: fontScale(34),
    lineHeight: fontScale(44),
  },
});
