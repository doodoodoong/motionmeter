import { PaperParticles } from '@/components/rank/PaperParticles';
import { RadialRays } from '@/components/rank/RadialRays';
import { RankCountUp } from '@/components/rank/RankCountUp';
import { RankGauge } from '@/components/rank/RankGauge';
import { RankStamp } from '@/components/rank/RankStamp';
import { compute, normalizeWeaponId } from '@/constants/physics';
import { RANK_PRESENTATION, type RankPresentationKey } from '@/constants/theme';
import type { RankGrade } from '@/utils/percentile';
import { rankStyles as styles } from '@/styles/rank.styles';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { cancelAnimation, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const GRADES: readonly RankGrade[] = ['jangwon', 'geupje', 'sungnyeon', 'suryeon'];

function finiteNumber(value: string | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function performHaptic(kind: 'heavy' | 'medium' | 'light' | 'success') {
  if (kind === 'success') return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  const stylesByKind = {
    heavy: Haptics.ImpactFeedbackStyle.Heavy,
    medium: Haptics.ImpactFeedbackStyle.Medium,
    light: Haptics.ImpactFeedbackStyle.Light,
  } as const;
  return Haptics.impactAsync(stylesByKind[kind]);
}

export default function RankScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    weapon?: string; omega?: string; top?: string; total?: string; status?: string; grade?: string; uploadOk?: string;
  }>();
  const weapon = normalizeWeaponId(params.weapon ?? 'pyeongon');
  const omega = Math.max(0, finiteNumber(params.omega));
  const physicalResult = compute(weapon, omega);
  const topPercent = Math.min(100, Math.max(1, Math.round(finiteNumber(params.top, 100))));
  const total = Math.max(0, Math.round(finiteNumber(params.total)));
  const status = params.status === 'ok' || params.status === 'insufficient' ? params.status : 'unavailable';
  const grade = GRADES.includes(params.grade as RankGrade) ? params.grade as RankGrade : null;
  const presentationKey: RankPresentationKey = status === 'ok' && grade ? grade : 'fallback';
  const config = RANK_PRESENTATION[presentationKey];
  const showPercentile = status === 'ok' && grade !== null;
  const stampLabel = status === 'insufficient' ? '첫 기록' : status === 'unavailable' ? '기록 완료' : config.name;
  const encouragement = status === 'unavailable'
    ? '기록을 멋지게 남겼어요. 다음 도전도 기대할게요!'
    : config.encouragement;

  const progress = useSharedValue(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [buttonEnabled, setButtonEnabled] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.05, 0.14], [0.72, 0.48, 0], 'clamp'),
    transform: [{ scaleX: interpolate(progress.value, [0, 0.14], [1, 0.06], 'clamp') }],
  }));

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!active) return;
      setReducedMotion(enabled);
      if (enabled) {
        cancelAnimation(progress);
        progress.value = 1;
        setButtonEnabled(true);
        return;
      }

      progress.value = withTiming(1, { duration: 1800 });
      timersRef.current.push(setTimeout(() => setButtonEnabled(true), 1800));
      config.haptics.forEach((haptic, index) => {
        timersRef.current.push(setTimeout(() => { void performHaptic(haptic); }, 650 + index * 130));
      });
    });

    return () => {
      active = false;
      cancelAnimation(progress);
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [config.haptics, progress]);

  const openResult = () => {
    if (!buttonEnabled) return;
    router.replace({ pathname: '/result', params: { ...params, weapon, omega: String(omega) } });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        {Array.from({ length: 12 }, (_, index) => <View key={index} style={[styles.textureLine, { top: `${index * 9}%` }]} />)}
        <Animated.View pointerEvents="none" style={[styles.flash, { backgroundColor: config.flashColor }, flashStyle]} />
        <RadialRays count={reducedMotion ? Math.min(4, config.rayCount) : config.rayCount} color={config.color} progress={progress} />
        <PaperParticles count={config.particleCount} color={config.color} progress={progress} reducedMotion={reducedMotion} />

        <View style={styles.content}>
          <Text style={styles.eyebrow}>오늘의 무예 등급</Text>
          <View style={styles.arena}>
            {showPercentile ? (
              <View style={styles.gaugeLayer}>
                <RankGauge topPercent={topPercent} color={config.color} progress={progress} double={config.doubleGauge} />
              </View>
            ) : null}
            <View style={styles.mainCopy}>
              {showPercentile ? <RankCountUp topPercent={topPercent} color={config.color} progress={progress} /> : (
                <Text style={styles.fallbackTitle}>{status === 'insufficient' ? '첫 기록이 등록됐어요' : '측정을 완료했어요'}</Text>
              )}
              {showPercentile ? <Text style={styles.population}>총 {total.toLocaleString()}명 중</Text> : null}
              <Text style={styles.indexCaption}>상대 타격지수 {Math.round(physicalResult.index)}</Text>
              <View style={styles.stampSpacing}>
                <RankStamp config={config} progress={progress} label={stampLabel} reducedMotion={reducedMotion} />
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.encouragement}>{encouragement}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              disabled={!buttonEnabled}
              activeOpacity={0.82}
              onPress={openResult}
              style={[styles.detailButton, { borderColor: config.color, backgroundColor: `${config.color}22` }, !buttonEnabled && styles.detailButtonDisabled]}
            >
              <Text style={[styles.detailButtonText, { color: config.color }]}>결과 자세히 보기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
