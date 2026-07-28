import { SIMPLE_COLORS, SIMPLE_STYLES } from "@/constants/theme";
import { fontScale, hp, wp } from "@/utils/responsive";
import { StyleSheet } from "react-native";

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
    justifyContent: 'center',
    backgroundColor: SIMPLE_COLORS.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: SIMPLE_COLORS.border.light,
  },
  backButton: {
    position: 'absolute',
    left: wp(3),
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
    color: SIMPLE_COLORS.text.primary,
    fontSize: fontScale(18),
    fontWeight: '600',
  },

  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(6),
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

  // --- Result ---
  viewShot: {
    flex: 1,
    backgroundColor: SIMPLE_COLORS.background.primary,
  },
  resultContainer: {
    flex: 1,
    backgroundColor: SIMPLE_COLORS.background.primary,
  },
  resultContent: {
    paddingHorizontal: wp(6),
    paddingTop: hp(4),
    paddingBottom: hp(6),
  },
  resultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(3),
  },
  resultHeaderLabel: {
    fontSize: fontScale(18),
    fontWeight: '600',
    color: SIMPLE_COLORS.text.primary,
  },
  resultHeaderSub: {
    fontSize: fontScale(12),
    fontWeight: '600',
    color: SIMPLE_COLORS.primary,
    letterSpacing: 1,
    marginTop: hp(0.3),
  },
  heroValueBox: {
    ...SIMPLE_STYLES.card,
    alignItems: 'center',
    paddingVertical: hp(3.5),
    marginBottom: hp(3),
  },
  heroValueLabel: {
    fontSize: fontScale(14),
    color: SIMPLE_COLORS.text.secondary,
    marginBottom: hp(0.5),
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  heroValue: {
    fontSize: fontScale(48),
    fontWeight: '800',
    lineHeight: fontScale(54),
  },
  heroValueUnit: {
    fontSize: fontScale(18),
    color: SIMPLE_COLORS.text.muted,
    marginLeft: 4,
    marginBottom: hp(1),
  },
  heroSubValue: {
    fontSize: fontScale(14),
    color: SIMPLE_COLORS.text.secondary,
    marginTop: hp(1),
  },

  // --- Metric list (실측/추정 구분) ---
  metricList: {
    ...SIMPLE_STYLES.card,
    paddingVertical: hp(0.5),
    marginBottom: hp(2),
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.6),
    borderBottomWidth: 1,
    borderBottomColor: SIMPLE_COLORS.border.light,
  },
  metricRowLast: {
    borderBottomWidth: 0,
  },
  metricLabelColumn: {
    flex: 1,
    paddingRight: wp(3),
  },
  metricLabel: {
    fontSize: fontScale(15),
    fontWeight: '500',
    color: SIMPLE_COLORS.text.primary,
  },
  metricBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    marginTop: hp(0.5),
  },
  metricBadge: {
    paddingHorizontal: wp(1.8),
    paddingVertical: hp(0.2),
    borderRadius: 3,
    borderWidth: 1,
  },
  metricBadgeMeasured: {
    borderColor: SIMPLE_COLORS.primary,
    backgroundColor: 'rgba(176, 138, 60, 0.12)',
  },
  metricBadgeEstimated: {
    borderColor: SIMPLE_COLORS.border.light,
    backgroundColor: 'transparent',
  },
  metricBadgeText: {
    fontSize: fontScale(10),
    fontWeight: '700',
    lineHeight: fontScale(14),
  },
  metricBadgeTextMeasured: {
    color: SIMPLE_COLORS.primary,
  },
  metricBadgeTextEstimated: {
    color: SIMPLE_COLORS.text.muted,
  },
  metricNote: {
    fontSize: fontScale(11),
    color: SIMPLE_COLORS.text.muted,
  },
  metricValue: {
    fontSize: fontScale(19),
    fontWeight: '700',
    color: SIMPLE_COLORS.text.primary,
  },

  // --- 해석 한계 안내 ---
  noticeBox: {
    marginTop: hp(3),
    paddingVertical: hp(1.6),
    paddingHorizontal: wp(4),
    borderLeftWidth: 2,
    borderLeftColor: SIMPLE_COLORS.primary,
    backgroundColor: SIMPLE_COLORS.background.secondary,
  },
  noticeText: {
    fontSize: fontScale(12),
    lineHeight: fontScale(19),
    color: SIMPLE_COLORS.text.secondary,
  },

  // --- Gauge ---
  gaugeContainer: {
    marginVertical: hp(1.6),
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: hp(1),
  },
  gaugeLabel: {
    fontSize: fontScale(15),
    color: SIMPLE_COLORS.text.secondary,
    fontWeight: '500',
  },
  gaugeValueText: {
    fontSize: fontScale(16),
    color: SIMPLE_COLORS.text.primary,
    fontWeight: '600',
  },
  gaugeBackground: {
    height: 8,
    backgroundColor: SIMPLE_COLORS.gauge.track,
    borderRadius: 0,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  gaugeTick: {
    position: 'absolute',
    width: 1.5,
    height: '100%',
    backgroundColor: 'rgba(176, 138, 60, 0.55)',
    zIndex: 2,
  },
  gaugeFill: {
    height: '100%',
  },

  // --- Buttons ---
  buttonRow: {
    flexDirection: 'row',
    gap: wp(3),
    marginTop: hp(4),
  },
  captureButton: {
    ...SIMPLE_STYLES.button,
    flex: 1,
    flexDirection: 'row',
    gap: wp(2),
  },
  captureButtonText: {
    fontSize: fontScale(15),
    fontWeight: '600',
    color: SIMPLE_COLORS.text.primary,
  },
  retryButton: {
    ...SIMPLE_STYLES.button,
    flex: 1,
    flexDirection: 'row',
    gap: wp(2),
  },
  retryButtonText: {
    fontSize: fontScale(15),
    fontWeight: '600',
    color: SIMPLE_COLORS.text.primary,
  },
});
