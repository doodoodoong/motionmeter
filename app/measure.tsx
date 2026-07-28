import { CameraIcon, ChevronLeftIcon, PlayIcon, RotateIcon, StopIcon } from "@/components/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { WeaponIcon } from "@/components/weapon-icons";
import { SIMPLE_COLORS } from "@/constants/theme";
import {
  ENERGY_FULL_SCALE,
  INDEX_FULL_SCALE,
  compute,
  normalizeWeaponId,
} from "@/constants/physics";
import { WEAPON_DISPLAY } from "@/constants/weapon-specs";
import { measureStyles as styles } from "@/styles/measure.styles";
import { useEventListener } from "expo";
import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Gyroscope } from "expo-sensors";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";
import { uploadMeasurementResult } from "@/utils/firebase";

type MeasurementState = 'ready' | 'measuring' | 'splash' | 'result';

/** 자이로 표본 주기 (ms) — 50Hz */
const GYRO_UPDATE_INTERVAL_MS = 20;

/** 이동평균 창 크기 (표본 수) — 단일 표본 스파이크 억제 */
const SMOOTHING_WINDOW = 3;

export default function MeasureScreen() {
  const router = useRouter();
  const { weapon } = useLocalSearchParams<{ weapon: string }>();
  const selectedWeapon = normalizeWeaponId(weapon ?? 'pyeongon');
  const weaponColor = WEAPON_DISPLAY[selectedWeapon].color;
  const weaponKorean = WEAPON_DISPLAY[selectedWeapon].name;

  const [measurementState, setMeasurementState] = useState<MeasurementState>('ready');

  const [gyroSubscription, setGyroSubscription] = useState<any>(null);
  const gyroSubscriptionRef = useRef<any>(null);
  const lastHapticMaxRef = useRef(0);
  /** 3점 이동평균용 최근 표본 버퍼 (rad/s) */
  const omegaWindowRef = useRef<number[]>([]);
  /** 업로드에 사용할 최대 각속도 — state 반영 지연과 무관하게 항상 최신값 */
  const maxAngularVelocityRef = useRef(0);

  const [maxAngularVelocity, setMaxAngularVelocity] = useState(0);
  const [currentAngularVelocity, setCurrentAngularVelocity] = useState(0);

  // 측정 중 회전 궤적 (저속, 항상 같은 속도로 절제)
  const trailSpin = useRef(new Animated.Value(0)).current;

  const player = useVideoPlayer(require("@/assets/download.mp4"), player => {
    player.loop = false;
  });

  useEventListener(player, 'playToEnd', () => {
    if (measurementState === 'splash') {
      setMeasurementState('result');
    }
  });

  useEffect(() => {
    // 스윙의 순간 최대 각속도를 놓치지 않도록 50Hz(20ms)로 표본을 받는다.
    // 100ms(10Hz)에서는 최고 속도 구간이 표본 사이로 빠져나간다.
    Gyroscope.setUpdateInterval(GYRO_UPDATE_INTERVAL_MS);

    return () => {
      if (gyroSubscriptionRef.current) gyroSubscriptionRef.current.remove();
    };
  }, []);

  // 측정 중에만 회전 궤적 애니메이션
  useEffect(() => {
    if (measurementState === 'measuring') {
      trailSpin.setValue(0);
      const loop = Animated.loop(
        Animated.timing(trailSpin, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loop.start();
      return () => loop.stop();
    }
  }, [measurementState]);

  const startMeasurement = useCallback(async () => {
    try {
      setMaxAngularVelocity(0);
      setCurrentAngularVelocity(0);
      lastHapticMaxRef.current = 0;
      maxAngularVelocityRef.current = 0;
      omegaWindowRef.current = [];

      const isGyroscopeAvailable = await Gyroscope.isAvailableAsync();

      if (!isGyroscopeAvailable) {
        Alert.alert("알림", "이 기기에서는 자이로스코프 센서를 사용할 수 없어요.");
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // 각속도 산출 방식
      //  1) 자이로스코프 3축(x, y, z)은 각각 해당 축 기준 회전 각속도(rad/s)다.
      //  2) 스윙 축이 고정되지 않으므로 3축을 벡터 합성해 각속도 크기를 구한다.
      //     |ω| = √(ωx² + ωy² + ωz²) — Math.hypot으로 오버플로 없이 계산.
      //  3) 단일 표본 스파이크(센서 노이즈)를 최댓값으로 오인하지 않도록
      //     최근 3표본(=60ms) 이동평균을 취한 뒤 그 최댓값을 측정값으로 삼는다.
      //  4) 여기서 얻는 값은 손잡이(본체)의 각속도이며, 보조체 끝속도가 아니다.
      const newGyroSubscription = Gyroscope.addListener((gyroscopeData) => {
        const omegaRaw = Math.hypot(gyroscopeData.x, gyroscopeData.y, gyroscopeData.z);

        const window = omegaWindowRef.current;
        window.push(omegaRaw);
        if (window.length > SMOOTHING_WINDOW) window.shift();
        const omega = window.reduce((sum, v) => sum + v, 0) / window.length;

        setCurrentAngularVelocity(omega);

        if (omega > maxAngularVelocityRef.current) {
          maxAngularVelocityRef.current = omega;
          setMaxAngularVelocity(omega);

          // 최대값을 10% 이상 갱신할 때만 햅틱 (매 표본 금지)
          if (omega > lastHapticMaxRef.current * 1.1) {
            lastHapticMaxRef.current = omega;
            Haptics.selectionAsync();
          }
        }
      });
      gyroSubscriptionRef.current = newGyroSubscription;
      setGyroSubscription(newGyroSubscription);

      setMeasurementState('measuring');
    } catch (error) {
      Alert.alert("알림", "센서를 시작하는데 문제가 생겼어요.");
    }
  }, []);

  const stopMeasurement = async () => {
    if (gyroSubscriptionRef.current) {
      gyroSubscriptionRef.current.remove();
      gyroSubscriptionRef.current = null;
      setGyroSubscription(null);
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = compute(selectedWeapon, maxAngularVelocityRef.current);

    await uploadMeasurementResult({
      weapon: weaponKorean,
      omegaMax: result.omega,
      tipSpeed: result.tipSpeed,
      energy: result.energy,
      index: result.index,
    });

    setMeasurementState('splash');
    player.replay();
  };

  const resetAll = () => {
    setMaxAngularVelocity(0);
    setCurrentAngularVelocity(0);
    maxAngularVelocityRef.current = 0;
    omegaWindowRef.current = [];
    setMeasurementState('ready');
  };

  const renderReadyScreen = () => {
    return (
      <View style={styles.stateContainer}>
        <View style={styles.readyBox}>
          <ThemedText style={styles.readyTitle}>측정 준비</ThemedText>
          <ThemedText style={styles.readyDescription}>
            간단한 스트레칭 후 측정 시작 버튼을 눌러주세요
          </ThemedText>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.startButton, { backgroundColor: weaponColor }]}
          onPress={startMeasurement}
        >
          <PlayIcon size={20} color="#FFFDF8" />
          <ThemedText style={styles.startButtonText}>측정 시작</ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMeasuringScreen = () => {
    const spin = trailSpin.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={styles.stateContainer}>
        <View style={styles.measuringBox}>
          <ThemedText style={styles.measuringTitle}>측정 중</ThemedText>
          <ThemedText style={styles.measuringDescription}>
            스마트폰을 힘차게 휘두른 뒤 측정 완료를 눌러주세요
          </ThemedText>
        </View>

        {/* 중앙 실시간 수치 + 회전 궤적 */}
        <View style={styles.liveCenter}>
          <Animated.View style={[styles.trail, { transform: [{ rotate: spin }] }]} />
          <ThemedText style={styles.liveValue}>{currentAngularVelocity.toFixed(2)}</ThemedText>
          <ThemedText style={styles.liveUnit}>rad/s</ThemedText>
          <View style={styles.maxLine} />
          <ThemedText style={styles.maxRecord}>
            최대 {maxAngularVelocity.toFixed(2)} rad/s
          </ThemedText>
        </View>

        <TouchableOpacity style={styles.stopButton} onPress={stopMeasurement} activeOpacity={0.85}>
          <StopIcon size={18} color="#FFFDF8" />
          <ThemedText style={styles.stopButtonText}>측정 완료</ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSplashScreen = () => {
    return (
      <View style={{ flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'black', zIndex: 999 }}>
        <VideoView
          player={player}
          style={{ flex: 1, width: '100%', height: '100%' }}
          contentFit="contain"
          nativeControls={false}
        />
      </View>
    );
  };

  const viewShotRef = useRef<ViewShot>(null);

  const captureScreen = async () => {
    try {
      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();

        try {
          await MediaLibrary.saveToLibraryAsync(uri);
          Alert.alert('완료', '결과 화면이 갤러리에 저장되었어요');
        } catch (saveError) {
          const { status } = await MediaLibrary.getPermissionsAsync();
          if (status !== 'granted') {
             const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();
             if (newStatus === 'granted') {
                await MediaLibrary.saveToLibraryAsync(uri);
                Alert.alert('완료', '결과 화면이 갤러리에 저장되었어요');
                return;
             }
          }
          throw saveError;
        }
      }
    } catch (error) {
      console.error('캡쳐 오류:', error);
      Alert.alert('오류', '화면 저장에 실패했어요. 권한을 확인해주세요.');
    }
  };

  const renderResultScreen = () => {
    const { omega, tipSpeed, energy, index } = compute(selectedWeapon, maxAngularVelocity);

    return (
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }} style={styles.viewShot}>
        <ScrollView style={styles.resultContainer} contentContainerStyle={styles.resultContent}>
          {/* 인증 카드 헤더 */}
          <View style={styles.resultHeaderRow}>
            <WeaponIcon weapon={selectedWeapon} size={60} />
            <View style={{ marginLeft: 12 }}>
              <ThemedText style={styles.resultHeaderLabel}>{weaponKorean} 측정 결과</ThemedText>
            </View>
          </View>

          {/* 최상위 수치: 상대 타격지수 */}
          <View style={styles.heroValueBox}>
            <ThemedText style={styles.heroValueLabel}>상대 타격지수</ThemedText>
            <View style={styles.heroValueRow}>
              <ThemedText style={[styles.heroValue, { color: weaponColor }]}>{Math.round(index)}</ThemedText>
            </View>
            <ThemedText style={styles.heroSubValue}>봉 10 rad/s = 100 기준</ThemedText>
          </View>

          {/* 4개 표시 항목 — 실측/추정 구분 */}
          <View style={styles.metricList}>
            <MetricRow
              label="측정 각속도"
              value={`${omega.toFixed(1)} rad/s`}
              origin="measured"
              note="본체 기준"
            />
            <MetricRow
              label="추정 끝속도"
              value={`${tipSpeed.toFixed(1)} m/s`}
              origin="estimated"
              note="환산계수 적용"
            />
            <MetricRow
              label="등가 운동에너지"
              value={`${Math.round(energy)} J`}
              origin="estimated"
            />
            <MetricRow
              label="상대 타격지수"
              value={`${Math.round(index)}`}
              origin="estimated"
              note="봉 10 rad/s = 100"
              last
            />
          </View>

          <GaugeBar label="상대 타격지수" value={index} maxValue={INDEX_FULL_SCALE} color={weaponColor} unit="" />
          <GaugeBar label="등가 운동에너지" value={energy} maxValue={ENERGY_FULL_SCALE} color={weaponColor} />

          {/* 해석 한계 고정 안내 */}
          <View style={styles.noticeBox}>
            <ThemedText style={styles.noticeText}>
              이 지수는 무기 비교를 위한 값이며 실제 타격력(N)이 아닙니다.
              측정된 것은 손잡이의 각속도이고, 끝속도는 계산으로 얻은 추정값입니다.
            </ThemedText>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.captureButton} onPress={captureScreen} activeOpacity={0.85}>
              <CameraIcon size={18} color={SIMPLE_COLORS.text.primary} />
              <ThemedText style={styles.captureButtonText}>화면 저장</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.retryButton} onPress={resetAll} activeOpacity={0.85}>
              <RotateIcon size={18} color={SIMPLE_COLORS.text.primary} />
              <ThemedText style={styles.retryButtonText}>다시 측정</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ViewShot>
    );
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        {measurementState !== 'splash' && (
          <ThemedView style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeftIcon size={20} color={SIMPLE_COLORS.text.primary} />
              <ThemedText style={styles.backButtonText}>돌아가기</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.title}>{weaponKorean} 측정</ThemedText>
          </ThemedView>
        )}

        {measurementState === 'ready' && renderReadyScreen()}
        {measurementState === 'measuring' && renderMeasuringScreen()}
        {measurementState === 'result' && renderResultScreen()}
      </SafeAreaView>
      {measurementState === 'splash' && renderSplashScreen()}
    </>
  );
}

// 측정값 한 줄 — 실측(measured) / 추정(estimated) 출처를 배지로 구분
function MetricRow({
  label,
  value,
  origin,
  note,
  last,
}: {
  label: string;
  value: string;
  origin: 'measured' | 'estimated';
  note?: string;
  last?: boolean;
}) {
  const isMeasured = origin === 'measured';

  return (
    <View style={[styles.metricRow, last && styles.metricRowLast]}>
      <View style={styles.metricLabelColumn}>
        <ThemedText style={styles.metricLabel}>{label}</ThemedText>
        <View style={styles.metricBadgeRow}>
          <View style={[styles.metricBadge, isMeasured ? styles.metricBadgeMeasured : styles.metricBadgeEstimated]}>
            <ThemedText
              style={[
                styles.metricBadgeText,
                isMeasured ? styles.metricBadgeTextMeasured : styles.metricBadgeTextEstimated,
              ]}
            >
              {isMeasured ? '실측' : '추정'}
            </ThemedText>
          </View>
          {note ? <ThemedText style={styles.metricNote}>{note}</ThemedText> : null}
        </View>
      </View>
      <ThemedText style={styles.metricValue}>{value}</ThemedText>
    </View>
  );
}

// 게이지 바 — 6~8px 직선 트랙 + 놋쇠 눈금 3개 (25/50/75%)
function GaugeBar({ label, value, maxValue, color, unit = 'J' }: { label: string, value: number, maxValue: number, color: string, unit?: string }) {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const fillPercent = maxValue > 0 ? Math.min(100, Math.max(0, (value / maxValue) * 100)) : 0;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: fillPercent,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [fillPercent]);

  return (
    <View style={styles.gaugeContainer}>
      <View style={styles.gaugeHeader}>
        <ThemedText style={styles.gaugeLabel}>{label}</ThemedText>
        <ThemedText style={styles.gaugeValueText}>{unit ? `${Math.round(value)} ${unit}` : Math.round(value)}</ThemedText>
      </View>
      <View style={styles.gaugeBackground}>
        {/* 놋쇠 눈금 3개 */}
        <View style={[styles.gaugeTick, { left: '25%' }]} />
        <View style={[styles.gaugeTick, { left: '50%' }]} />
        <View style={[styles.gaugeTick, { left: '75%' }]} />
        <Animated.View
          style={[
            styles.gaugeFill,
            {
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}
