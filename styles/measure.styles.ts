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
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(2),
  },
  backButtonText: {
    color: SIMPLE_COLORS.primary,
    fontSize: fontScale(16),
    fontWeight: '600',
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
  readyBox: {
    ...SIMPLE_STYLES.card,
    width: '100%',
    alignItems: 'center',
    paddingVertical: hp(4),
    marginBottom: hp(4),
  },
  infantryBox: {
    // keeping object key for measure.tsx ref
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  readyEmoji: {
    fontSize: fontScale(32),
    marginRight: wp(2),
  },
  readyTitle: {
    fontSize: fontScale(24),
    fontWeight: 'bold',
    color: SIMPLE_COLORS.text.primary,
    marginBottom: hp(1),
  },
  readyDescription: {
    fontSize: fontScale(15),
    color: SIMPLE_COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: fontScale(22),
  },
  specBox: {
    backgroundColor: SIMPLE_COLORS.background.primary,
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    borderRadius: 8,
    marginTop: hp(2),
  },
  specText: {
    fontSize: fontScale(13),
    color: SIMPLE_COLORS.text.muted,
  },
  calibrationRequired: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    backgroundColor: '#FFFBEA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCC00',
    marginBottom: hp(2),
  },
  calibrationTitle: {
    fontSize: fontScale(15),
    fontWeight: 'bold',
    color: '#D48806',
    marginBottom: hp(1),
  },
  calibrateButton: {
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(5),
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCC00',
  },
  calibrateButtonText: {
    fontSize: fontScale(14),
    fontWeight: 'bold',
    color: '#D48806',
  },
  startButton: {
    ...SIMPLE_STYLES.primaryButton,
    width: '100%',
    paddingVertical: hp(2),
  },
  infantryButton: {
    // ref
  },
  cavalryButton: {
    // ref
  },
  startButtonText: {
    fontSize: fontScale(18),
    fontWeight: 'bold',
    color: '#FFF',
  },
  measuringBox: {
    ...SIMPLE_STYLES.card,
    width: '100%',
    alignItems: 'center',
    paddingVertical: hp(4),
    marginBottom: hp(4),
  },
  infantryMeasuring: {
    // ref
  },
  cavalryMeasuring: {
    // ref
  },
  measuringTitle: {
    fontSize: fontScale(22),
    fontWeight: 'bold',
    color: SIMPLE_COLORS.primary,
    marginBottom: hp(1.5),
  },
  measuringDescription: {
    fontSize: fontScale(16),
    color: SIMPLE_COLORS.text.secondary,
    textAlign: 'center',
  },
  liveDataBox: {
    ...SIMPLE_STYLES.card,
    width: '100%',
    marginBottom: hp(4),
  },
  liveDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(1.2),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SIMPLE_COLORS.border.light,
  },
  liveDataLabel: {
    fontSize: fontScale(15),
    color: SIMPLE_COLORS.text.secondary,
  },
  liveDataValue: {
    fontSize: fontScale(16),
    fontWeight: 'bold',
    color: SIMPLE_COLORS.text.primary,
  },
  liveDataValueMax: {
    fontSize: fontScale(18),
    fontWeight: 'bold',
    color: SIMPLE_COLORS.primary,
  },
  stopButton: {
    ...SIMPLE_STYLES.button,
    borderColor: '#FF3B30',
    width: '100%',
  },
  stopButtonText: {
    fontSize: fontScale(18),
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  resultContainer: {
    flex: 1,
    backgroundColor: SIMPLE_COLORS.background.secondary,
  },
  resultContent: {
    paddingHorizontal: wp(6),
    paddingTop: hp(4),
    paddingBottom: hp(6),
  },
  resultTitle: {
    fontSize: fontScale(24),
    fontWeight: 'bold',
    color: SIMPLE_COLORS.text.primary,
    textAlign: 'center',
    marginBottom: hp(2),
  },
  resultMainCard: {
    ...SIMPLE_STYLES.card,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: hp(20),
    marginBottom: hp(2),
  },
  infantryResult: {
    // ref
  },
  cavalryResultCard: {
    // ref
  },
  resultEnergyValue: {
    fontSize: fontScale(48),
    fontWeight: '800',
    color: SIMPLE_COLORS.primary,
    marginTop: hp(1),
  },
  resultEnergyUnit: {
    fontSize: fontScale(16),
    color: SIMPLE_COLORS.text.secondary,
    marginBottom: hp(1),
  },
  resultEnergyLevel: {
    fontSize: fontScale(18),
    fontWeight: '600',
    color: SIMPLE_COLORS.text.primary,
  },
  resultDetailsCard: {
    ...SIMPLE_STYLES.card,
    marginBottom: hp(2),
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(1.2),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SIMPLE_COLORS.border.light,
  },
  resultDetailLabel: {
    fontSize: fontScale(15),
    color: SIMPLE_COLORS.text.secondary,
  },
  resultDetailValue: {
    fontSize: fontScale(15),
    fontWeight: 'bold',
    color: SIMPLE_COLORS.text.primary,
  },
  nextButton: {
    ...SIMPLE_STYLES.primaryButton,
    marginTop: hp(2),
  },
  nextButtonText: {
    fontSize: fontScale(16),
    fontWeight: 'bold',
    color: '#FFF',
  },
  finalButton: {
    ...SIMPLE_STYLES.primaryButton,
    marginTop: hp(2),
  },
  finalButtonText: {
    fontSize: fontScale(16),
    fontWeight: 'bold',
    color: '#FFF',
  },
  finalTitle: {
    fontSize: fontScale(20),
    fontWeight: 'bold',
    color: SIMPLE_COLORS.text.primary,
    textAlign: 'center',
    marginBottom: hp(4),
  },
  comparisonCard: {
    ...SIMPLE_STYLES.card,
    marginBottom: hp(2),
  },
  winnerCard: {
    borderWidth: 2,
    borderColor: '#FFCC00',
  },
  winnerBadge: {
    position: 'absolute',
    top: -hp(1.5),
    right: wp(4),
    backgroundColor: '#FFCC00',
    paddingVertical: hp(0.4),
    paddingHorizontal: wp(2.5),
    borderRadius: 8,
    fontSize: fontScale(12),
    fontWeight: 'bold',
    color: '#000',
    overflow: 'hidden',
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  comparisonEmoji: {
    fontSize: fontScale(28),
    marginRight: wp(3),
  },
  comparisonTitle: {
    fontSize: fontScale(18),
    fontWeight: 'bold',
    color: SIMPLE_COLORS.text.primary,
  },
  comparisonEnergy: {
    fontSize: fontScale(36),
    fontWeight: '800',
    color: SIMPLE_COLORS.primary,
    textAlign: 'center',
    paddingVertical: hp(1.5),
  },
  comparisonSpec: {
    fontSize: fontScale(13),
    color: SIMPLE_COLORS.text.muted,
    textAlign: 'center',
    marginTop: hp(1),
  },
  differenceCard: {
    ...SIMPLE_STYLES.card,
    backgroundColor: SIMPLE_COLORS.background.primary,
    alignItems: 'center',
    marginBottom: hp(2),
  },
  differenceLabel: {
    fontSize: fontScale(14),
    color: SIMPLE_COLORS.text.secondary,
    marginBottom: hp(0.5),
  },
  differenceValue: {
    fontSize: fontScale(24),
    fontWeight: 'bold',
    color: SIMPLE_COLORS.primary,
  },
  formulaCard: {
    ...SIMPLE_STYLES.card,
    backgroundColor: SIMPLE_COLORS.background.primary,
    alignItems: 'center',
    marginBottom: hp(3),
  },
  formulaTitle: {
    fontSize: fontScale(15),
    fontWeight: 'bold',
    color: SIMPLE_COLORS.text.primary,
    marginBottom: hp(1),
  },
  formulaText: {
    fontSize: fontScale(14),
    color: SIMPLE_COLORS.text.secondary,
  },
  retryButton: {
    ...SIMPLE_STYLES.button,
    flex: 1,
  },
  retryButtonText: {
    fontSize: fontScale(15),
    fontWeight: '600',
    color: SIMPLE_COLORS.text.primary,
  },
  viewShot: {
    flex: 1,
    backgroundColor: SIMPLE_COLORS.background.secondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: wp(3),
    marginTop: hp(2),
  },
  captureButton: {
    ...SIMPLE_STYLES.button,
    flex: 1,
  },
  captureButtonText: {
    fontSize: fontScale(15),
    fontWeight: '600',
    color: SIMPLE_COLORS.text.primary,
  },
  
  // --- New Gauge Bar Styles ---
  gaugeContainer: {
    marginVertical: hp(1.8),
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
    color: '#000000',
    fontWeight: '600',
  },
  gaugeBackground: {
    height: hp(1.8),
    backgroundColor: SIMPLE_COLORS.gauge.track,
    borderRadius: hp(1),
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: hp(1),
  },
});
