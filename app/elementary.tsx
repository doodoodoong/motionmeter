import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CYBER_COLORS, CYBER_STYLES, NEON_GLOW, TEXT_GLOW } from "@/constants/theme";
import { fontScale, hp, wp } from "@/utils/responsive";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { Accelerometer, Gyroscope } from "expo-sensors";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";

interface GravityOffset {
  x: number;
  y: number;
  z: number;
}

type MeasurementState = 'ready' | 'measuring' | 'result';

export default function ElementaryScreen() {
  const router = useRouter();
  const [measurementState, setMeasurementState] = useState<MeasurementState>('ready');
  
  const [subscription, setSubscription] = useState<any>(null);
  const [gyroSubscription, setGyroSubscription] = useState<any>(null);
  const subscriptionRef = useRef<any>(null);
  const gyroSubscriptionRef = useRef<any>(null);
  
  const [maxAcceleration, setMaxAcceleration] = useState(0);
  const [maxAngularVelocity, setMaxAngularVelocity] = useState(0);
  const [maxEnergy, setMaxEnergy] = useState(0);
  
  const [gravityOffset, setGravityOffset] = useState<GravityOffset>({ x: 0, y: 0, z: 0 });
  const [isCalibrated, setIsCalibrated] = useState(false);

  const [angularVelocity, setAngularVelocity] = useState<number>(0);
  const [kineticEnergy, setKineticEnergy] = useState<number>(0);

  const DEFAULT_M_EFF = 0.5;
  const DEFAULT_L_TOT = 0.3;

  const gravityOffsetRef = useRef<GravityOffset>(gravityOffset);

  useEffect(() => {
    gravityOffsetRef.current = gravityOffset;
  }, [gravityOffset]);

  useEffect(() => {
    Accelerometer.setUpdateInterval(100);
    Gyroscope.setUpdateInterval(100);
    loadSavedSettings();

    return () => {
      if (subscriptionRef.current) subscriptionRef.current.remove();
      if (gyroSubscriptionRef.current) gyroSubscriptionRef.current.remove();
    };
  }, []);

  const loadSavedSettings = async () => {
    try {
      const savedOffset = await AsyncStorage.getItem("gravityOffset");
      if (savedOffset) {
        setGravityOffset(JSON.parse(savedOffset));
        setIsCalibrated(true);
      }
    } catch (error) {
      console.error("설정 불러오기 실패:", error);
    }
  };

  const startMeasurement = useCallback(async () => {
    if (!isCalibrated) {
      Alert.alert("알림", "먼저 영점 맞추기를 완료해주세요!");
      return;
    }

    try {
      setMaxAcceleration(0);
      setMaxAngularVelocity(0);
      setMaxEnergy(0);

      const isAccelerometerAvailable = await Accelerometer.isAvailableAsync();
      const isGyroscopeAvailable = await Gyroscope.isAvailableAsync();
      
      if (!isAccelerometerAvailable || !isGyroscopeAvailable) {
        Alert.alert("알림", "이 기기에서는 센서를 사용할 수 없어요.");
        return;
      }

      const newSubscription = Accelerometer.addListener((accelerometerData) => {
        const offset = gravityOffsetRef.current;
        const correctedX = accelerometerData.x - offset.x;
        const correctedY = accelerometerData.y - offset.y;
        const correctedZ = accelerometerData.z - offset.z;
        const magnitude = Math.sqrt(correctedX ** 2 + correctedY ** 2 + correctedZ ** 2);
        setMaxAcceleration((prev) => Math.max(prev, magnitude));
      });
      subscriptionRef.current = newSubscription;
      setSubscription(newSubscription);

      const newGyroSubscription = Gyroscope.addListener((gyroscopeData) => {
        const omega = Math.sqrt(gyroscopeData.x ** 2 + gyroscopeData.y ** 2 + gyroscopeData.z ** 2);
        const v_tip = omega * DEFAULT_L_TOT;
        const energy = (1 / 2) * DEFAULT_M_EFF * v_tip * v_tip;
        
        setAngularVelocity(omega);
        setKineticEnergy(energy);
        setMaxAngularVelocity((prev) => Math.max(prev, omega));
        setMaxEnergy((prev) => Math.max(prev, energy));
      });
      gyroSubscriptionRef.current = newGyroSubscription;
      setGyroSubscription(newGyroSubscription);

      setMeasurementState('measuring');
    } catch (error) {
      Alert.alert("알림", "센서를 시작하는데 문제가 생겼어요.");
    }
  }, [isCalibrated]);

  const stopMeasurement = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
      setSubscription(null);
    }
    if (gyroSubscriptionRef.current) {
      gyroSubscriptionRef.current.remove();
      gyroSubscriptionRef.current = null;
      setGyroSubscription(null);
    }
    setMeasurementState('result');
  };

  const resetMeasurement = () => {
    setMaxAcceleration(0);
    setMaxAngularVelocity(0);
    setMaxEnergy(0);
    setMeasurementState('ready');
  };

  const calibrateGravity = async () => {
    try {
      const isAccelerometerAvailable = await Accelerometer.isAvailableAsync();
      if (!isAccelerometerAvailable) {
        Alert.alert("알림", "이 기기에서는 센서를 사용할 수 없어요.");
        return;
      }

      Alert.alert("영점 맞추기", "핸드폰을 평평한 곳에 놓고 3초만 기다려주세요!", [
        { text: "취소", style: "cancel" },
        {
          text: "시작",
          onPress: async () => {
            const tempSubscription = Accelerometer.addListener((accelerometerData) => {
              setTimeout(() => {
                const offset = { x: accelerometerData.x, y: accelerometerData.y, z: accelerometerData.z };
                setGravityOffset(offset);
                setIsCalibrated(true);
                AsyncStorage.setItem("gravityOffset", JSON.stringify(offset));
                Alert.alert("완료!", "영점 맞추기가 끝났어요!");
                tempSubscription.remove();
              }, 3000);
            });
          },
        },
      ]);
    } catch (error) {
      console.error("캘리브레이션 오류:", error);
    }
  };

  const getEnergyLevel = (value: number): string => {
    if (value < 0.01) return "거의 없어요";
    if (value < 0.1) return "조금 있어요";
    if (value < 0.5) return "꽤 있어요!";
    if (value < 1.0) return "많이 있어요!";
    return "엄청 많아요!!";
  };

  const renderReadyScreen = () => (
    <View style={styles.stateContainer}>
      <View style={styles.readyBox}>
        <ThemedText style={styles.readyTitle}>⚡ 측정 준비</ThemedText>
        <ThemedText style={styles.readyDescription}>
          편곤을 준비하고 측정 시작 버튼을 눌러주세요!
        </ThemedText>
      </View>

      {!isCalibrated && (
        <View style={styles.calibrationRequired}>
          <ThemedText style={styles.calibrationTitle}>⚠️ 먼저 영점을 맞춰주세요!</ThemedText>
          <TouchableOpacity style={styles.calibrateButton} onPress={calibrateGravity}>
            <ThemedText style={styles.calibrateButtonText}>🎯 영점 맞추기</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {isCalibrated && (
        <TouchableOpacity style={styles.startButton} onPress={startMeasurement}>
          <ThemedText style={styles.startButtonText}>▶️ 측정 시작</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderMeasuringScreen = () => (
    <View style={styles.stateContainer}>
      <View style={styles.measuringBox}>
        <ThemedText style={styles.measuringTitle}>🌀 측정 중...</ThemedText>
        <ThemedText style={styles.measuringDescription}>편곤을 힘차게 휘둘러보세요!</ThemedText>
      </View>

      <View style={styles.liveDataBox}>
        <View style={styles.liveDataRow}>
          <ThemedText style={styles.liveDataLabel}>현재 에너지</ThemedText>
          <ThemedText style={styles.liveDataValue}>{kineticEnergy.toFixed(3)} J</ThemedText>
        </View>
        <View style={styles.liveDataRow}>
          <ThemedText style={styles.liveDataLabel}>최대 에너지</ThemedText>
          <ThemedText style={styles.liveDataValueMax}>{maxEnergy.toFixed(3)} J</ThemedText>
        </View>
      </View>

      <TouchableOpacity style={styles.stopButton} onPress={stopMeasurement}>
        <ThemedText style={styles.stopButtonText}>⏹️ 측정 완료</ThemedText>
      </TouchableOpacity>
    </View>
  );

  const viewShotRef = useRef<ViewShot>(null);

  const captureScreen = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('알림', '갤러리 접근 권한이 필요합니다.');
        return;
      }

      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('완료!', '결과 화면이 갤러리에 저장되었어요!');
      }
    } catch (error) {
      console.error('캡쳐 오류:', error);
      Alert.alert('오류', '화면 캡쳐에 실패했어요.');
    }
  };

  const renderResultScreen = () => (
    <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }} style={styles.viewShot}>
      <ScrollView style={styles.resultContainer} contentContainerStyle={styles.resultContent}>
        <ThemedText style={styles.resultTitle}>🎉 측정 결과</ThemedText>

        <View style={styles.resultMainCard}>
          <ThemedText style={styles.resultEnergyValue}>{maxEnergy.toFixed(3)}</ThemedText>
          <ThemedText style={styles.resultEnergyUnit}>줄 (J)</ThemedText>
          <ThemedText style={styles.resultEnergyLevel}>{getEnergyLevel(maxEnergy)}</ThemedText>
        </View>

        <View style={styles.resultDetailsCard}>
          <View style={styles.resultRow}>
            <ThemedText style={styles.resultDetailLabel}>최대 회전속도</ThemedText>
            <ThemedText style={styles.resultDetailValue}>{maxAngularVelocity.toFixed(2)} rad/s</ThemedText>
          </View>
          <View style={styles.resultRow}>
            <ThemedText style={styles.resultDetailLabel}>최대 가속도</ThemedText>
            <ThemedText style={styles.resultDetailValue}>{maxAcceleration.toFixed(2)} m/s²</ThemedText>
          </View>
        </View>

        <View style={styles.formulaCard}>
          <ThemedText style={styles.formulaTitle}>💡 에너지 공식</ThemedText>
          <ThemedText style={styles.formulaText}>E = ½ × 무게 × (회전속도 × 길이)²</ThemedText>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.captureButton} onPress={captureScreen}>
            <ThemedText style={styles.captureButtonText}>📷 캡쳐하기</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.retryButton} onPress={resetMeasurement}>
            <ThemedText style={styles.retryButtonText}>🔄 다시 측정</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ViewShot>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>← 돌아가기</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.title}>편곤 에너지 측정기</ThemedText>
      </ThemedView>

      {measurementState === 'ready' && renderReadyScreen()}
      {measurementState === 'measuring' && renderMeasuringScreen()}
      {measurementState === 'result' && renderResultScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CYBER_COLORS.background.primary,
  },
  header: {
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CYBER_COLORS.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: CYBER_COLORS.neon.cyanDim,
  },
  backButton: {
    position: 'absolute',
    left: wp(3),
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(2),
    backgroundColor: CYBER_COLORS.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CYBER_COLORS.neon.cyanDim,
  },
  backButtonText: {
    color: CYBER_COLORS.neon.cyan,
    fontSize: fontScale(12),
    fontWeight: 'bold',
  },
  title: {
    color: CYBER_COLORS.text.primary,
    fontSize: fontScale(18),
    fontWeight: 'bold',
    ...TEXT_GLOW.cyan,
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(4),
  },
  readyBox: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: hp(3),
    paddingHorizontal: wp(4),
    backgroundColor: CYBER_COLORS.background.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: CYBER_COLORS.neon.cyan,
    ...NEON_GLOW.cyan,
    marginBottom: hp(2),
  },
  readyTitle: {
    fontSize: fontScale(22),
    fontWeight: 'bold',
    color: CYBER_COLORS.text.primary,
    marginBottom: hp(1),
    ...TEXT_GLOW.cyan,
  },
  readyDescription: {
    fontSize: fontScale(14),
    color: CYBER_COLORS.text.secondary,
    textAlign: 'center',
  },
  calibrationRequired: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    backgroundColor: 'rgba(255, 184, 0, 0.15)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: CYBER_COLORS.status.warning,
    marginBottom: hp(2),
  },
  calibrationTitle: {
    fontSize: fontScale(14),
    fontWeight: 'bold',
    color: CYBER_COLORS.status.warning,
    marginBottom: hp(1),
  },
  calibrateButton: {
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(5),
    backgroundColor: 'rgba(255, 184, 0, 0.2)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CYBER_COLORS.status.warning,
  },
  calibrateButtonText: {
    fontSize: fontScale(14),
    fontWeight: 'bold',
    color: CYBER_COLORS.status.warning,
  },
  startButton: {
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(10),
    ...CYBER_STYLES.successButton,
    borderRadius: 14,
  },
  startButtonText: {
    fontSize: fontScale(18),
    fontWeight: 'bold',
    color: CYBER_COLORS.text.primary,
  },
  measuringBox: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: hp(3),
    paddingHorizontal: wp(4),
    backgroundColor: CYBER_COLORS.background.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: CYBER_COLORS.neon.magenta,
    shadowColor: '#FF00FF',
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: hp(2),
  },
  measuringTitle: {
    fontSize: fontScale(22),
    fontWeight: 'bold',
    color: CYBER_COLORS.neon.magenta,
    marginBottom: hp(1),
  },
  measuringDescription: {
    fontSize: fontScale(14),
    color: CYBER_COLORS.text.secondary,
    textAlign: 'center',
  },
  liveDataBox: {
    width: '100%',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    backgroundColor: CYBER_COLORS.background.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CYBER_COLORS.neon.cyanDim,
    marginBottom: hp(2),
  },
  liveDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(0.8),
  },
  liveDataLabel: {
    fontSize: fontScale(13),
    color: CYBER_COLORS.text.muted,
  },
  liveDataValue: {
    fontSize: fontScale(14),
    fontWeight: 'bold',
    color: CYBER_COLORS.text.primary,
  },
  liveDataValueMax: {
    fontSize: fontScale(16),
    fontWeight: 'bold',
    color: CYBER_COLORS.neon.cyan,
    ...TEXT_GLOW.cyan,
  },
  stopButton: {
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(10),
    ...CYBER_STYLES.dangerButton,
    borderRadius: 14,
  },
  stopButtonText: {
    fontSize: fontScale(18),
    fontWeight: 'bold',
    color: CYBER_COLORS.text.primary,
  },
  resultContainer: {
    flex: 1,
  },
  resultContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
    paddingBottom: hp(4),
  },
  resultTitle: {
    fontSize: fontScale(22),
    fontWeight: 'bold',
    color: CYBER_COLORS.text.primary,
    textAlign: 'center',
    marginBottom: hp(2),
    ...TEXT_GLOW.cyan,
  },
  resultMainCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: hp(22),
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    backgroundColor: CYBER_COLORS.background.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: CYBER_COLORS.neon.cyan,
    ...NEON_GLOW.cyan,
    marginBottom: hp(2),
  },
  resultLabel: {
    fontSize: fontScale(12),
    color: CYBER_COLORS.text.muted,
    marginBottom: hp(0.5),
  },
  resultEnergyValue: {
    fontSize: fontScale(42),
    fontWeight: 'bold',
    color: CYBER_COLORS.neon.cyan,
    marginTop: hp(1),
    lineHeight: fontScale(50),
  },
  resultEnergyUnit: {
    fontSize: fontScale(14),
    color: CYBER_COLORS.text.secondary,
    marginBottom: hp(1),
  },
  resultEnergyLevel: {
    fontSize: fontScale(16),
    fontWeight: 'bold',
    color: CYBER_COLORS.text.primary,
  },
  resultDetailsCard: {
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    backgroundColor: CYBER_COLORS.background.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CYBER_COLORS.neon.cyanDim,
    marginBottom: hp(2),
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(0.8),
    borderBottomWidth: 1,
    borderBottomColor: CYBER_COLORS.neon.cyanDim,
  },
  resultDetailLabel: {
    fontSize: fontScale(13),
    color: CYBER_COLORS.text.muted,
  },
  resultDetailValue: {
    fontSize: fontScale(14),
    fontWeight: 'bold',
    color: CYBER_COLORS.text.primary,
  },
  formulaCard: {
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    backgroundColor: CYBER_COLORS.background.secondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: CYBER_COLORS.neon.cyanDim,
    marginBottom: hp(2),
    alignItems: 'center',
  },
  formulaTitle: {
    fontSize: fontScale(13),
    fontWeight: 'bold',
    color: CYBER_COLORS.neon.cyan,
    marginBottom: hp(0.5),
  },
  formulaText: {
    fontSize: fontScale(12),
    color: CYBER_COLORS.text.secondary,
  },
  retryButton: {
    flex: 1,
    paddingVertical: hp(1.5),
    alignItems: 'center',
    ...CYBER_STYLES.neonButton,
    borderRadius: 14,
  },
  retryButtonText: {
    fontSize: fontScale(14),
    fontWeight: 'bold',
    color: CYBER_COLORS.text.primary,
  },
  viewShot: {
    flex: 1,
    backgroundColor: CYBER_COLORS.background.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: wp(3),
    marginTop: hp(1),
  },
  captureButton: {
    flex: 1,
    paddingVertical: hp(1.5),
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 0, 0.2)',
    borderWidth: 1,
    borderColor: CYBER_COLORS.status.warning,
    borderRadius: 14,
  },
  captureButtonText: {
    fontSize: fontScale(14),
    fontWeight: 'bold',
    color: CYBER_COLORS.status.warning,
  },
});
