import { CameraIcon, ChevronLeftIcon, PlayIcon, RotateIcon, StopIcon } from "@/components/icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { WeaponIcon } from "@/components/weapon-icons";
import { SIMPLE_COLORS } from "@/constants/theme";
import { WEAPON_SPECS } from "@/constants/weapon-specs";
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

export default function MeasureScreen() {
  const router = useRouter();
  const { weapon } = useLocalSearchParams<{ weapon: string }>();
  const selectedWeapon = (weapon as 'flail' | 'staff') || 'flail';
  const weaponColor = selectedWeapon === 'staff' ? SIMPLE_COLORS.weapon.staff : SIMPLE_COLORS.weapon.flail;
  const weaponKorean = selectedWeapon === 'staff' ? '봉' : '편곤';

  const [measurementState, setMeasurementState] = useState<MeasurementState>('ready');

  const [gyroSubscription, setGyroSubscription] = useState<any>(null);
  const gyroSubscriptionRef = useRef<any>(null);
  const lastHapticMaxRef = useRef(0);

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
    Gyroscope.setUpdateInterval(100);

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

      const isGyroscopeAvailable = await Gyroscope.isAvailableAsync();

      if (!isGyroscopeAvailable) {
        Alert.alert("알림", "이 기기에서는 자이로스코프 센서를 사용할 수 없어요.");
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const newGyroSubscription = Gyroscope.addListener((gyroscopeData) => {
        const omega = Math.sqrt(gyroscopeData.x ** 2 + gyroscopeData.y ** 2 + gyroscopeData.z ** 2);
        setCurrentAngularVelocity(omega);
        setMaxAngularVelocity((prev) => {
          if (omega > prev) {
            // 최대값을 10% 이상 갱신할 때만 햅틱 (매 프레임 금지)
            if (omega > lastHapticMaxRef.current * 1.1) {
              lastHapticMaxRef.current = omega;
              Haptics.selectionAsync();
            }
            return omega;
          }
          return prev;
        });
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

    let rotationalFactor = 1;
    if (selectedWeapon === 'flail') { rotationalFactor = 3.64; }
    else if (selectedWeapon === 'staff') { rotationalFactor = 1.78; }

    const rotationalEnergy = rotationalFactor * (maxAngularVelocity ** 2);

    await uploadMeasurementResult({
      weapon: weaponKorean,
      maxAngularVelocity: maxAngularVelocity,
      rotationalEnergy: rotationalEnergy
    });

    setMeasurementState('splash');
    player.replay();
  };

  const resetAll = () => {
    setMaxAngularVelocity(0);
    setCurrentAngularVelocity(0);
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
    const weaponInfo = WEAPON_SPECS[selectedWeapon];
    const energy = weaponInfo.factor * maxAngularVelocity;

    let rotationalFactor = selectedWeapon === 'staff' ? 1.78 : 3.64;
    const rotationalEnergy = rotationalFactor * (maxAngularVelocity ** 2);

    return (
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }} style={styles.viewShot}>
        <ScrollView style={styles.resultContainer} contentContainerStyle={styles.resultContent}>
          {/* 인증 카드 헤더 */}
          <View style={styles.resultHeaderRow}>
            <WeaponIcon weapon={selectedWeapon} size={60} />
            <View style={{ marginLeft: 12 }}>
              <ThemedText style={styles.resultHeaderLabel}>{weaponKorean} 측정 결과</ThemedText>
              <ThemedText style={styles.resultHeaderSub}>MotionMeter</ThemedText>
            </View>
          </View>

          {/* 최상위 수치: 회전운동에너지 */}
          <View style={styles.heroValueBox}>
            <ThemedText style={styles.heroValueLabel}>회전운동에너지</ThemedText>
            <View style={styles.heroValueRow}>
              <ThemedText style={[styles.heroValue, { color: weaponColor }]}>{Math.round(rotationalEnergy)}</ThemedText>
              <ThemedText style={styles.heroValueUnit}>J</ThemedText>
            </View>
            <ThemedText style={styles.heroSubValue}>최대 회전속도 {maxAngularVelocity.toFixed(2)} rad/s</ThemedText>
          </View>

          <GaugeBar label="회전운동에너지" energy={rotationalEnergy} color={weaponColor} />
          <GaugeBar label={`${weaponInfo.name} 평균충격력`} energy={energy} color={weaponColor} />

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

// 게이지 바 — 6~8px 직선 트랙 + 놋쇠 눈금 3개 (25/50/75%)
function GaugeBar({ label, energy, color }: { label: string, energy: number, color: string }) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: 100,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={styles.gaugeContainer}>
      <View style={styles.gaugeHeader}>
        <ThemedText style={styles.gaugeLabel}>{label}</ThemedText>
        <ThemedText style={styles.gaugeValueText}>{Math.round(energy)} J</ThemedText>
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
