import { ChevronLeftIcon, PlayIcon, StopIcon } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { compute, normalizeWeaponId, WEAPON_QUERY_VALUE } from '@/constants/physics';
import { SIMPLE_COLORS } from '@/constants/theme';
import { WEAPON_DISPLAY } from '@/constants/weapon-specs';
import { useI18n } from '@/i18n';
import { measureStyles as styles } from '@/styles/measure.styles';
import { fetchWeaponRank, uploadMeasurementResult } from '@/utils/firebase';
import { computePercentile, type PercentileResult } from '@/utils/percentile';
import { useEventListener } from 'expo';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Gyroscope } from 'expo-sensors';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type MeasurementState = 'ready' | 'measuring' | 'splash';

const GYRO_UPDATE_INTERVAL_MS = 20;
const SMOOTHING_WINDOW = 3;
const POST_VIDEO_WAIT_MS = 2000;

const unavailableRank: PercentileResult = {
  topPercent: null,
  total: 0,
  grade: null,
  status: 'unavailable',
};

function uploadSucceeded(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  return typeof value === 'object' && value !== null && 'ok' in value && value.ok === true;
}

export default function MeasureScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { weapon } = useLocalSearchParams<{ weapon: string }>();
  const selectedWeapon = normalizeWeaponId(weapon ?? 'pyeongon');
  const weaponColor = WEAPON_DISPLAY[selectedWeapon].color;
  // Firestore 전용 고정값과 화면 표시용 번역값을 분리한다.
  const weaponQueryValue = WEAPON_QUERY_VALUE[selectedWeapon];
  const weaponLabel = useMemo(() => t(`weapon.${selectedWeapon}`), [selectedWeapon, t]);
  const copy = useMemo(() => ({
    alert: t('common.alert'),
    back: t('common.back'),
    title: t('measure.title', { weapon: weaponLabel }),
    readyTitle: t('measure.readyTitle'),
    readyDescription: t('measure.readyDescription'),
    rankCaption: t('measure.rankCaption'),
    start: t('measure.start'),
    measuringTitle: t('measure.measuringTitle'),
    measuringDescription: t('measure.measuringDescription'),
    stop: t('measure.stop'),
    sensorUnavailable: t('measure.sensorUnavailable'),
    sensorStartError: t('measure.sensorStartError'),
  }), [t, weaponLabel]);

  const [measurementState, setMeasurementState] = useState<MeasurementState>('ready');
  const [maxAngularVelocity, setMaxAngularVelocity] = useState(0);
  const [currentAngularVelocity, setCurrentAngularVelocity] = useState(0);
  const maxRecordLabel = useMemo(
    () => t('measure.maxRecord', { value: maxAngularVelocity.toFixed(2) }),
    [maxAngularVelocity, t],
  );
  const gyroSubscriptionRef = useRef<ReturnType<typeof Gyroscope.addListener> | null>(null);
  const lastHapticMaxRef = useRef(0);
  const omegaWindowRef = useRef<number[]>([]);
  const maxAngularVelocityRef = useRef(0);
  const mountedRef = useRef(true);
  const runIdRef = useRef(0);
  const videoEndedRef = useRef(false);
  const rankResultRef = useRef<PercentileResult | null>(null);
  const uploadOkRef = useRef<boolean | null>(null);
  const measuredOmegaRef = useRef(0);
  const postVideoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trailSpin = useRef(new Animated.Value(0)).current;

  const player = useVideoPlayer(require('@/assets/download.mp4'), (videoPlayer) => {
    videoPlayer.loop = false;
  });

  const clearPostVideoTimer = useCallback(() => {
    if (postVideoTimerRef.current) {
      clearTimeout(postVideoTimerRef.current);
      postVideoTimerRef.current = null;
    }
  }, []);

  const goToRank = useCallback((rank: PercentileResult, uploadOk: boolean | null) => {
    if (!mountedRef.current) return;
    clearPostVideoTimer();
    runIdRef.current += 1;
    router.replace({
      pathname: '/rank',
      params: {
        weapon: selectedWeapon,
        omega: String(measuredOmegaRef.current),
        top: rank.topPercent === null ? '' : String(rank.topPercent),
        total: String(rank.total),
        status: rank.status,
        grade: rank.grade ?? '',
        uploadOk: uploadOk === null ? 'unknown' : String(uploadOk),
      },
    });
  }, [clearPostVideoTimer, router, selectedWeapon]);

  const tryFinishSplash = useCallback(() => {
    if (!mountedRef.current || !videoEndedRef.current) return;
    if (rankResultRef.current) {
      goToRank(rankResultRef.current, uploadOkRef.current);
      return;
    }
    clearPostVideoTimer();
    postVideoTimerRef.current = setTimeout(() => {
      if (mountedRef.current && !rankResultRef.current) goToRank(unavailableRank, uploadOkRef.current);
    }, POST_VIDEO_WAIT_MS);
  }, [clearPostVideoTimer, goToRank]);

  useEventListener(player, 'playToEnd', () => {
    videoEndedRef.current = true;
    tryFinishSplash();
  });

  useEffect(() => {
    mountedRef.current = true;
    Gyroscope.setUpdateInterval(GYRO_UPDATE_INTERVAL_MS);
    return () => {
      mountedRef.current = false;
      runIdRef.current += 1;
      clearPostVideoTimer();
      gyroSubscriptionRef.current?.remove();
      gyroSubscriptionRef.current = null;
    };
  }, [clearPostVideoTimer]);

  useEffect(() => {
    if (measurementState !== 'measuring') return;
    trailSpin.setValue(0);
    const loop = Animated.loop(Animated.timing(trailSpin, {
      toValue: 1,
      duration: 8000,
      easing: Easing.linear,
      useNativeDriver: true,
    }));
    loop.start();
    return () => loop.stop();
  }, [measurementState, trailSpin]);

  const startMeasurement = useCallback(async () => {
    try {
      setMaxAngularVelocity(0);
      setCurrentAngularVelocity(0);
      lastHapticMaxRef.current = 0;
      maxAngularVelocityRef.current = 0;
      omegaWindowRef.current = [];

      if (!(await Gyroscope.isAvailableAsync())) {
        Alert.alert(copy.alert, copy.sensorUnavailable);
        return;
      }
      if (!mountedRef.current) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const subscription = Gyroscope.addListener(({ x, y, z }) => {
        if (!mountedRef.current) return;
        const omegaRaw = Math.hypot(x, y, z);
        const window = omegaWindowRef.current;
        window.push(omegaRaw);
        if (window.length > SMOOTHING_WINDOW) window.shift();
        const omega = window.reduce((sum, value) => sum + value, 0) / window.length;
        setCurrentAngularVelocity(omega);

        if (omega > maxAngularVelocityRef.current) {
          maxAngularVelocityRef.current = omega;
          setMaxAngularVelocity(omega);
          if (omega > lastHapticMaxRef.current * 1.1) {
            lastHapticMaxRef.current = omega;
            Haptics.selectionAsync();
          }
        }
      });
      gyroSubscriptionRef.current = subscription;
      setMeasurementState('measuring');
    } catch {
      Alert.alert(copy.alert, copy.sensorStartError);
    }
  }, [copy.alert, copy.sensorStartError, copy.sensorUnavailable]);

  const stopMeasurement = useCallback(() => {
    gyroSubscriptionRef.current?.remove();
    gyroSubscriptionRef.current = null;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = compute(selectedWeapon, maxAngularVelocityRef.current);
    measuredOmegaRef.current = result.omega;
    videoEndedRef.current = false;
    rankResultRef.current = null;
    uploadOkRef.current = null;
    clearPostVideoTimer();
    const runId = ++runIdRef.current;

    setMeasurementState('splash');
    player.replay();

    void (async () => {
      // 내 기록이 비교 모집단에 먼저 포함돼 이중 계산되지 않도록 반드시 조회 후 업로드한다.
      const population = await fetchWeaponRank(weaponQueryValue, result.omega);
      const rank = computePercentile(population);
      if (!mountedRef.current || runId !== runIdRef.current) return;
      rankResultRef.current = rank;
      tryFinishSplash();

      const uploadResult = await uploadMeasurementResult({
        weapon: weaponQueryValue,
        omegaMax: result.omega,
        tipSpeed: result.tipSpeed,
        energy: result.energy,
        index: result.index,
      });
      if (!mountedRef.current || runId !== runIdRef.current) return;
      uploadOkRef.current = uploadSucceeded(uploadResult);
      tryFinishSplash();
    })();
  }, [clearPostVideoTimer, player, selectedWeapon, tryFinishSplash, weaponQueryValue]);

  const spin = trailSpin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        {measurementState !== 'splash' ? (
          <ThemedView style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeftIcon size={20} color={SIMPLE_COLORS.text.primary} />
              <ThemedText style={styles.backButtonText}>{copy.back}</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.title}>{copy.title}</ThemedText>
          </ThemedView>
        ) : null}

        {measurementState === 'ready' ? (
          <View style={styles.stateContainer}>
            <View style={styles.readyBox}>
              <ThemedText style={styles.readyTitle}>{copy.readyTitle}</ThemedText>
              <ThemedText style={styles.readyDescription}>{copy.readyDescription}</ThemedText>
              <ThemedText style={styles.rankCaption}>{copy.rankCaption}</ThemedText>
            </View>
            <TouchableOpacity activeOpacity={0.85} style={[styles.startButton, { backgroundColor: weaponColor }]} onPress={startMeasurement}>
              <PlayIcon size={20} color="#FFFDF8" />
              <ThemedText style={styles.startButtonText}>{copy.start}</ThemedText>
            </TouchableOpacity>
          </View>
        ) : null}

        {measurementState === 'measuring' ? (
          <View style={styles.stateContainer}>
            <View style={styles.measuringBox}>
              <ThemedText style={styles.measuringTitle}>{copy.measuringTitle}</ThemedText>
              <ThemedText style={styles.measuringDescription}>{copy.measuringDescription}</ThemedText>
            </View>
            <View style={styles.liveCenter}>
              <Animated.View style={[styles.trail, { transform: [{ rotate: spin }] }]} />
              <ThemedText style={styles.liveValue}>{currentAngularVelocity.toFixed(2)}</ThemedText>
              <ThemedText style={styles.liveUnit}>rad/s</ThemedText>
              <View style={styles.maxLine} />
              <ThemedText style={styles.maxRecord}>{maxRecordLabel}</ThemedText>
            </View>
            <TouchableOpacity style={styles.stopButton} onPress={stopMeasurement} activeOpacity={0.85}>
              <StopIcon size={18} color="#FFFDF8" />
              <ThemedText style={styles.stopButtonText}>{copy.stop}</ThemedText>
            </TouchableOpacity>
          </View>
        ) : null}
      </SafeAreaView>

      {measurementState === 'splash' ? (
        <View style={styles.splash}>
          <VideoView player={player} style={styles.splashVideo} contentFit="contain" nativeControls={false} />
        </View>
      ) : null}
    </>
  );
}
