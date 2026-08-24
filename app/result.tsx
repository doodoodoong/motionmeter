import { CameraIcon, RotateIcon } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { WeaponIcon } from '@/components/weapon-icons';
import { ENERGY_FULL_SCALE, INDEX_FULL_SCALE, compute, normalizeWeaponId } from '@/constants/physics';
import { RANK_PRESENTATION, SIMPLE_COLORS } from '@/constants/theme';
import { WEAPON_DISPLAY } from '@/constants/weapon-specs';
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
  const params = useLocalSearchParams<{ weapon?: string; omega?: string; top?: string; total?: string; status?: string; grade?: string; uploadOk?: string }>();
  const weapon = normalizeWeaponId(params.weapon ?? 'pyeongon');
  const omegaValue = Math.max(0, parseNumber(params.omega));
  const { omega, tipSpeed, energy, index } = compute(weapon, omegaValue);
  const weaponInfo = WEAPON_DISPLAY[weapon];
  const top = Math.min(100, Math.max(1, Math.round(parseNumber(params.top, 100))));
  const total = Math.max(0, Math.round(parseNumber(params.total)));
  const grade = GRADES.includes(params.grade as RankGrade) ? params.grade as RankGrade : null;
  const ranked = params.status === 'ok' && grade !== null;
  const config = RANK_PRESENTATION[grade ?? 'fallback'];
  const badgeLabel = ranked ? config.name : params.status === 'insufficient' ? '첫 기록' : '기록 완료';
  const rankCaption = ranked ? `상위 ${top}% · ${total.toLocaleString()}명 기준` : badgeLabel;
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
      Alert.alert('완료', '결과 화면이 갤러리에 저장되었어요');
    } catch (error) {
      console.error('캡쳐 오류:', error);
      Alert.alert('오류', '화면 저장에 실패했어요. 권한을 확인해주세요.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }} style={styles.viewShot}>
        <ScrollView style={styles.resultContainer} contentContainerStyle={styles.resultContent}>
          <View style={styles.resultHeaderRow}>
            <WeaponIcon weapon={weapon} size={60} />
            <View style={styles.headerCopy}>
              <ThemedText style={styles.resultHeaderLabel}>{weaponInfo.name} 측정 결과</ThemedText>
              <ThemedText style={[styles.rankCaption, { color: config.color }]}>{rankCaption}</ThemedText>
            </View>
            <View style={[styles.rankBadge, { borderColor: config.color }]}>
              <ThemedText style={[styles.rankBadgeText, { color: config.color }]}>{badgeLabel}</ThemedText>
            </View>
          </View>

          <View style={styles.heroValueBox}>
            <ThemedText style={styles.heroValueLabel}>상대 타격지수</ThemedText>
            <View style={styles.heroValueRow}>
              <ThemedText style={[styles.heroValue, { color: weaponInfo.color }]}>{Math.round(index)}</ThemedText>
            </View>
            <ThemedText style={styles.heroSubValue}>봉 10 rad/s = 100 기준</ThemedText>
          </View>

          <View style={styles.metricList}>
            <MetricRow label="측정 각속도" value={`${omega.toFixed(1)} rad/s`} origin="measured" note="본체 기준" />
            <MetricRow label="추정 끝속도" value={`${tipSpeed.toFixed(1)} m/s`} origin="estimated" note="환산계수 적용" />
            <MetricRow label="등가 운동에너지" value={`${Math.round(energy)} J`} origin="estimated" />
            <MetricRow label="상대 타격지수" value={`${Math.round(index)}`} origin="estimated" note="봉 10 rad/s = 100" last />
          </View>

          <GaugeBar label="상대 타격지수" value={index} maxValue={INDEX_FULL_SCALE} color={weaponInfo.color} unit="" />
          <GaugeBar label="등가 운동에너지" value={energy} maxValue={ENERGY_FULL_SCALE} color={weaponInfo.color} />

          <View style={styles.noticeBox}>
            <ThemedText style={styles.noticeText}>
              이 지수는 무기 비교를 위한 값이며 실제 타격력(N)이 아닙니다.
              측정된 것은 손잡이의 각속도이고, 끝속도는 계산으로 얻은 추정값입니다.
            </ThemedText>
          </View>
          {params.uploadOk === 'false' ? <ThemedText style={styles.uploadNotice}>기록을 서버에 저장하지 못했어요. 화면 결과는 그대로 확인할 수 있어요.</ThemedText> : null}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.actionButton} onPress={captureScreen} activeOpacity={0.85}>
              <CameraIcon size={18} color={SIMPLE_COLORS.text.primary} />
              <ThemedText style={styles.actionButtonText}>화면 저장</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.replace({ pathname: '/measure', params: { weapon } })} activeOpacity={0.85}>
              <RotateIcon size={18} color={SIMPLE_COLORS.text.primary} />
              <ThemedText style={styles.actionButtonText}>다시 측정</ThemedText>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/')} activeOpacity={0.85}>
            <ThemedText style={styles.homeButtonText}>처음으로</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </ViewShot>
    </SafeAreaView>
  );
}

function MetricRow({ label, value, origin, note, last }: { label: string; value: string; origin: 'measured' | 'estimated'; note?: string; last?: boolean }) {
  const isMeasured = origin === 'measured';
  return (
    <View style={[styles.metricRow, last && styles.metricRowLast]}>
      <View style={styles.metricLabelColumn}>
        <ThemedText style={styles.metricLabel}>{label}</ThemedText>
        <View style={styles.metricBadgeRow}>
          <View style={[styles.metricBadge, isMeasured ? styles.metricBadgeMeasured : styles.metricBadgeEstimated]}>
            <ThemedText style={[styles.metricBadgeText, isMeasured ? styles.metricBadgeTextMeasured : styles.metricBadgeTextEstimated]}>{isMeasured ? '실측' : '추정'}</ThemedText>
          </View>
          {note ? <ThemedText style={styles.metricNote}>{note}</ThemedText> : null}
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
        <ThemedText style={styles.gaugeLabel}>{label}</ThemedText>
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
