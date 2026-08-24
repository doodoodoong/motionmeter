import { CameraIcon, RotateIcon } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { WeaponIcon } from '@/components/weapon-icons';
import { ENERGY_FULL_SCALE, INDEX_FULL_SCALE, compute, normalizeWeaponId } from '@/constants/physics';
import { RANK_PRESENTATION, SIMPLE_COLORS } from '@/constants/theme';
import { WEAPON_DISPLAY } from '@/constants/weapon-specs';
import { useI18n } from '@/i18n';
import { resultStyles as styles } from '@/styles/result.styles';
import type { RankGrade } from '@/utils/percentile';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Alert, Animated, Easing, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';

const GRADES: readonly RankGrade[] = ['jangwon', 'geupje', 'sungnyeon', 'suryeon'];

function parseNumber(value: string | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function ResultScreen() {
  const router = useRouter();
  const { language, t } = useI18n();
  const params = useLocalSearchParams<{ weapon?: string; omega?: string; top?: string; total?: string; status?: string; grade?: string; uploadOk?: string }>();
  const weapon = normalizeWeaponId(params.weapon ?? 'pyeongon');
  const omegaValue = Math.max(0, parseNumber(params.omega));
  const { omega, tipSpeed, energy, index } = compute(weapon, omegaValue);
  const weaponInfo = WEAPON_DISPLAY[weapon];
  const top = Math.min(100, Math.max(1, Math.round(parseNumber(params.top, 100))));
  const total = Math.max(0, Math.round(parseNumber(params.total)));
  const grade = GRADES.includes(params.grade as RankGrade) ? params.grade as RankGrade : null;
  const ranked = params.status === 'ok' && grade !== null;
  const presentationKey = ranked && grade ? grade : 'fallback';
  const config = RANK_PRESENTATION[presentationKey];
  const badgeLabel = ranked
    ? t(`grade.${presentationKey}`)
    : params.status === 'insufficient'
      ? t('rank.firstRecord')
      : t('rank.recordComplete');
  const formattedTotal = total.toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US');
  const rankCaption = ranked ? t('result.rankCaption', { top, total: formattedTotal }) : badgeLabel;
  const viewShotRef = useRef<ViewShot>(null);

  const captureScreen = async () => {
    try {
      const uri = await viewShotRef.current?.capture?.();
      if (!uri) throw new Error('capture failed');
      try {
        await MediaLibrary.saveToLibraryAsync(uri);
      } catch (saveError) {
        const current = await MediaLibrary.getPermissionsAsync();
        const permission = current.status === 'granted' ? current : await MediaLibrary.requestPermissionsAsync();
        if (permission.status !== 'granted') throw saveError;
        await MediaLibrary.saveToLibraryAsync(uri);
      }
      Alert.alert(t('common.done'), t('result.saved'));
    } catch (error) {
      console.error('캡쳐 오류:', error);
      Alert.alert(t('common.error'), t('result.saveFailed'));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }} style={styles.viewShot}>
        <ScrollView style={styles.resultContainer} contentContainerStyle={styles.resultContent}>
          <View style={styles.resultHeaderRow}>
            <WeaponIcon weapon={weapon} size={60} />
            <View style={styles.headerCopy}>
              <ThemedText style={styles.resultHeaderLabel}>{t('result.header', { weapon: t(`weapon.${weapon}`) })}</ThemedText>
              <ThemedText style={[styles.rankCaption, { color: config.color }]}>{rankCaption}</ThemedText>
            </View>
            <View style={[styles.rankBadge, { borderColor: config.color }]}>
              <ThemedText numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.7} style={[styles.rankBadgeText, { color: config.color }]}>{badgeLabel}</ThemedText>
            </View>
          </View>

          <View style={styles.heroValueBox}>
            <ThemedText style={styles.heroValueLabel}>{t('result.strikeIndex')}</ThemedText>
            <View style={styles.heroValueRow}>
              <ThemedText style={[styles.heroValue, { color: weaponInfo.color }]}>{Math.round(index)}</ThemedText>
            </View>
            <ThemedText numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={styles.heroSubValue}>{t('result.baseline', { weapon: t('weapon.staff') })}</ThemedText>
          </View>

          <View style={styles.metricList}>
            <MetricRow label={t('result.angularVelocity')} value={`${omega.toFixed(1)} rad/s`} measured originLabel={t('result.measured')} note={t('result.bodyBaseline')} />
            <MetricRow label={t('result.tipSpeed')} value={`${tipSpeed.toFixed(1)} m/s`} originLabel={t('result.estimated')} note={t('result.conversionApplied')} />
            <MetricRow label={t('result.equivalentEnergy')} value={`${Math.round(energy)} J`} originLabel={t('result.estimated')} />
            <MetricRow label={t('result.strikeIndex')} value={`${Math.round(index)}`} originLabel={t('result.estimated')} note={t('result.baseline', { weapon: t('weapon.staff') })} last />
          </View>

          <GaugeBar label={t('result.strikeIndex')} value={index} maxValue={INDEX_FULL_SCALE} color={weaponInfo.color} unit="" />
          <GaugeBar label={t('result.equivalentEnergy')} value={energy} maxValue={ENERGY_FULL_SCALE} color={weaponInfo.color} />

          <View style={styles.noticeBox}>
            <ThemedText style={styles.noticeText}>
              {t('result.notice')}
            </ThemedText>
          </View>
          {params.uploadOk === 'false' ? <ThemedText style={styles.uploadNotice}>{t('result.uploadFailed')}</ThemedText> : null}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.actionButton} onPress={captureScreen} activeOpacity={0.85}>
              <CameraIcon size={18} color={SIMPLE_COLORS.text.primary} />
              <ThemedText numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={styles.actionButtonText}>{t('result.saveScreen')}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.replace({ pathname: '/measure', params: { weapon } })} activeOpacity={0.85}>
              <RotateIcon size={18} color={SIMPLE_COLORS.text.primary} />
              <ThemedText numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={styles.actionButtonText}>{t('result.measureAgain')}</ThemedText>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/')} activeOpacity={0.85}>
            <ThemedText style={styles.homeButtonText}>{t('result.home')}</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </ViewShot>
    </SafeAreaView>
  );
}

function MetricRow({ label, value, measured = false, originLabel, note, last }: { label: string; value: string; measured?: boolean; originLabel: string; note?: string; last?: boolean }) {
  return (
    <View style={[styles.metricRow, last && styles.metricRowLast]}>
      <View style={styles.metricLabelColumn}>
        <ThemedText numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.68} style={styles.metricLabel}>{label}</ThemedText>
        <View style={styles.metricBadgeRow}>
          <View style={[styles.metricBadge, measured ? styles.metricBadgeMeasured : styles.metricBadgeEstimated]}>
            <ThemedText style={[styles.metricBadgeText, measured ? styles.metricBadgeTextMeasured : styles.metricBadgeTextEstimated]}>{originLabel}</ThemedText>
          </View>
          {note ? <ThemedText numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={styles.metricNote}>{note}</ThemedText> : null}
        </View>
      </View>
      <ThemedText style={styles.metricValue}>{value}</ThemedText>
    </View>
  );
}

function GaugeBar({ label, value, maxValue, color, unit = 'J' }: { label: string; value: number; maxValue: number; color: string; unit?: string }) {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const fillPercent = maxValue > 0 ? Math.min(100, Math.max(0, (value / maxValue) * 100)) : 0;
  useEffect(() => {
    const animation = Animated.timing(animatedWidth, { toValue: fillPercent, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    animation.start();
    return () => animation.stop();
  }, [animatedWidth, fillPercent]);
  return (
    <View style={styles.gaugeContainer}>
      <View style={styles.gaugeHeader}>
        <ThemedText numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={styles.gaugeLabel}>{label}</ThemedText>
        <ThemedText style={styles.gaugeValueText}>{unit ? `${Math.round(value)} ${unit}` : Math.round(value)}</ThemedText>
      </View>
      <View style={styles.gaugeBackground}>
        <View style={[styles.gaugeTick, { left: '25%' }]} />
        <View style={[styles.gaugeTick, { left: '50%' }]} />
        <View style={[styles.gaugeTick, { left: '75%' }]} />
        <Animated.View style={[styles.gaugeFill, { width: animatedWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }), backgroundColor: color }]} />
      </View>
    </View>
  );
}
