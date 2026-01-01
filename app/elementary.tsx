import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { FLAIL_SPECS, FlailType } from "@/constants/flail-specs";
import { elementaryStyles as styles } from "@/styles/elementary.styles";
import { uploadMeasurementResult } from "@/utils/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { Accelerometer, Gyroscope } from "expo-sensors";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
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

interface MeasurementResult {
  maxEnergy: number;
  maxAngularVelocity: number;
  maxAcceleration: number;
}

type MeasurementState = 
  | 'infantry_ready' 
  | 'infantry_measuring' 
  | 'infantry_result'
  | 'cavalry_ready' 
  | 'cavalry_measuring' 
  | 'cavalry_result'
  | 'final_result';

export default function ElementaryScreen() {
  const router = useRouter();
  const [measurementState, setMeasurementState] = useState<MeasurementState>('infantry_ready');
  
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

  // 각 편곤 측정 결과 저장
  const [infantryResult, setInfantryResult] = useState<MeasurementResult | null>(null);
  const [cavalryResult, setCavalryResult] = useState<MeasurementResult | null>(null);

  // 현재 측정 중인 편곤 타입
  const [currentFlailType, setCurrentFlailType] = useState<FlailType>('infantry');

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

  const startMeasurement = useCallback(async (flailType: FlailType) => {
    if (!isCalibrated) {
      Alert.alert("알림", "먼저 영점 맞추기를 완료해주세요!");
      return;
    }

    const spec = FLAIL_SPECS[flailType];
    setCurrentFlailType(flailType);

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
        const v_tip = omega * spec.totalLength;
        const energy = (1 / 2) * spec.mass * v_tip * v_tip;
        
        setAngularVelocity(omega);
        setKineticEnergy(energy);
        setMaxAngularVelocity((prev) => Math.max(prev, omega));
        setMaxEnergy((prev) => Math.max(prev, energy));
      });
      gyroSubscriptionRef.current = newGyroSubscription;
      setGyroSubscription(newGyroSubscription);

      setMeasurementState(flailType === 'infantry' ? 'infantry_measuring' : 'cavalry_measuring');
    } catch (error) {
      Alert.alert("알림", "센서를 시작하는데 문제가 생겼어요.");
    }
  }, [isCalibrated]);

  const stopMeasurement = async () => {
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

    // 결과 저장
    const result: MeasurementResult = {
      maxEnergy,
      maxAngularVelocity,
      maxAcceleration,
    };

    // Firebase에 자동 업로드
    const uploadSuccess = await uploadMeasurementResult('elementary', currentFlailType, {
      maxEnergy,
      maxAngularVelocity,
    });
    
    if (uploadSuccess) {
      console.log('초중등용 측정 결과 Firebase 업로드 완료');
    }

    if (currentFlailType === 'infantry') {
      setInfantryResult(result);
      setMeasurementState('infantry_result');
    } else {
      setCavalryResult(result);
      setMeasurementState('cavalry_result');
    }
  };

  const proceedToCavalry = () => {
    setMaxAcceleration(0);
    setMaxAngularVelocity(0);
    setMaxEnergy(0);
    setMeasurementState('cavalry_ready');
  };

  const showFinalResult = () => {
    setMeasurementState('final_result');
  };

  const resetAll = () => {
    setInfantryResult(null);
    setCavalryResult(null);
    setMaxAcceleration(0);
    setMaxAngularVelocity(0);
    setMaxEnergy(0);
    setMeasurementState('infantry_ready');
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
            let calibrationDone = false;
            const tempSubscription = Accelerometer.addListener((accelerometerData) => {
              if (calibrationDone) return;
              setTimeout(() => {
                if (calibrationDone) return;
                calibrationDone = true;
                tempSubscription.remove();
                const offset = { x: accelerometerData.x, y: accelerometerData.y, z: accelerometerData.z };
                setGravityOffset(offset);
                setIsCalibrated(true);
                AsyncStorage.setItem("gravityOffset", JSON.stringify(offset));
                Alert.alert("완료!", "영점 맞추기가 끝났어요!");
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
    if (value < 0.5) return "조금 있어요";
    if (value < 2) return "꽤 있어요!";
    if (value < 5) return "많이 있어요!";
    if (value < 10) return "아주 많아요!!";
    return "엄청나요!!!";
  };

  const renderReadyScreen = (flailType: FlailType) => {
    const spec = FLAIL_SPECS[flailType];
    const isInfantry = flailType === 'infantry';
    
    return (
      <View style={styles.stateContainer}>
        <View style={[styles.readyBox, isInfantry ? styles.infantryBox : styles.cavalryBox]}>
          <View style={styles.titleRow}>
            <ThemedText style={styles.readyEmoji}>{isInfantry ? '🗡️' : '🐎'}</ThemedText>
            <ThemedText style={styles.readyTitle}>{spec.name}</ThemedText>
          </View>
          <ThemedText style={styles.readyDescription}>
            {isInfantry ? '1단계: 보병용 편곤을 측정해요!' : '2단계: 마상용 편곤을 측정해요!'}
          </ThemedText>
          <View style={styles.specBox}>
            <ThemedText style={styles.specText}>
              길이: {(spec.totalLength * 100).toFixed(1)}cm | 무게: {spec.mass}kg
            </ThemedText>
          </View>
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
          <TouchableOpacity 
            style={[styles.startButton, isInfantry ? styles.infantryButton : styles.cavalryButton]} 
            onPress={() => startMeasurement(flailType)}
          >
            <ThemedText style={styles.startButtonText}>▶️ 측정 시작</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderMeasuringScreen = (flailType: FlailType) => {
    const spec = FLAIL_SPECS[flailType];
    const isInfantry = flailType === 'infantry';

    return (
      <View style={styles.stateContainer}>
        <View style={[styles.measuringBox, isInfantry ? styles.infantryMeasuring : styles.cavalryMeasuring]}>
          <ThemedText style={styles.measuringTitle}>🌀 {spec.name} 측정 중...</ThemedText>
          <ThemedText style={styles.measuringDescription}>편곤을 힘차게 휘둘러보세요!</ThemedText>
        </View>

        <View style={styles.liveDataBox}>
          <View style={styles.liveDataRow}>
            <ThemedText style={styles.liveDataLabel}>현재 에너지</ThemedText>
            <ThemedText style={styles.liveDataValue}>{kineticEnergy.toFixed(2)} J</ThemedText>
          </View>
          <View style={styles.liveDataRow}>
            <ThemedText style={styles.liveDataLabel}>최대 에너지</ThemedText>
            <ThemedText style={styles.liveDataValueMax}>{maxEnergy.toFixed(2)} J</ThemedText>
          </View>
        </View>

        <TouchableOpacity style={styles.stopButton} onPress={stopMeasurement}>
          <ThemedText style={styles.stopButtonText}>⏹️ 측정 완료</ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  const renderResultScreen = (flailType: FlailType) => {
    const spec = FLAIL_SPECS[flailType];
    const isInfantry = flailType === 'infantry';
    const result = isInfantry ? infantryResult : cavalryResult;

    if (!result) return null;

    return (
      <ScrollView style={styles.resultContainer} contentContainerStyle={styles.resultContent}>
        <ThemedText style={styles.resultTitle}>
          {isInfantry ? '🗡️' : '🐎'} {spec.name} 결과
        </ThemedText>

        <View style={[styles.resultMainCard, isInfantry ? styles.infantryResult : styles.cavalryResultCard]}>
          <ThemedText style={styles.resultEnergyValue}>{result.maxEnergy.toFixed(2)}</ThemedText>
          <ThemedText style={styles.resultEnergyUnit}>줄 (J)</ThemedText>
          <ThemedText style={styles.resultEnergyLevel}>{getEnergyLevel(result.maxEnergy)}</ThemedText>
        </View>

        <View style={styles.resultDetailsCard}>
          <View style={styles.resultRow}>
            <ThemedText style={styles.resultDetailLabel}>최대 회전속도</ThemedText>
            <ThemedText style={styles.resultDetailValue}>{result.maxAngularVelocity.toFixed(2)} rad/s</ThemedText>
          </View>
          <View style={styles.resultRow}>
            <ThemedText style={styles.resultDetailLabel}>최대 가속도</ThemedText>
            <ThemedText style={styles.resultDetailValue}>{result.maxAcceleration.toFixed(2)} m/s²</ThemedText>
          </View>
        </View>

        {isInfantry ? (
          <TouchableOpacity style={styles.nextButton} onPress={proceedToCavalry}>
            <ThemedText style={styles.nextButtonText}>🐎 마상용 편곤 측정하기 →</ThemedText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.finalButton} onPress={showFinalResult}>
            <ThemedText style={styles.finalButtonText}>📊 최종 결과 보기</ThemedText>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  };

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

  const renderFinalResultScreen = () => {
    if (!infantryResult || !cavalryResult) return null;

    const winner = infantryResult.maxEnergy >= cavalryResult.maxEnergy ? 'infantry' : 'cavalry';

    return (
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }} style={styles.viewShot}>
        <ScrollView style={styles.resultContainer} contentContainerStyle={styles.resultContent}>
          <ThemedText style={styles.finalTitle}>🎉 최종 측정 결과</ThemedText>

          {/* 보병용 편곤 결과 */}
          <View style={[styles.comparisonCard, winner === 'infantry' && styles.winnerCard]}>
            {winner === 'infantry' && <ThemedText style={styles.winnerBadge}>👑 최대!</ThemedText>}
            <View style={styles.comparisonHeader}>
              <ThemedText style={styles.comparisonEmoji}>🗡️</ThemedText>
              <ThemedText style={styles.comparisonTitle}>보병용 편곤</ThemedText>
            </View>
            <ThemedText style={styles.comparisonEnergy}>{infantryResult.maxEnergy.toFixed(2)} J</ThemedText>
            <ThemedText style={styles.comparisonSpec}>
              길이: {(FLAIL_SPECS.infantry.totalLength * 100).toFixed(1)}cm | 무게: {FLAIL_SPECS.infantry.mass}kg
            </ThemedText>
          </View>

          {/* 마상용 편곤 결과 */}
          <View style={[styles.comparisonCard, winner === 'cavalry' && styles.winnerCard]}>
            {winner === 'cavalry' && <ThemedText style={styles.winnerBadge}>👑 최대!</ThemedText>}
            <View style={styles.comparisonHeader}>
              <ThemedText style={styles.comparisonEmoji}>🐎</ThemedText>
              <ThemedText style={styles.comparisonTitle}>마상용 편곤</ThemedText>
            </View>
            <ThemedText style={styles.comparisonEnergy}>{cavalryResult.maxEnergy.toFixed(2)} J</ThemedText>
            <ThemedText style={styles.comparisonSpec}>
              길이: {(FLAIL_SPECS.cavalry.totalLength * 100).toFixed(1)}cm | 무게: {FLAIL_SPECS.cavalry.mass}kg
            </ThemedText>
          </View>

          {/* 에너지 차이 */}
          <View style={styles.differenceCard}>
            <ThemedText style={styles.differenceLabel}>에너지 차이</ThemedText>
            <ThemedText style={styles.differenceValue}>
              {Math.abs(infantryResult.maxEnergy - cavalryResult.maxEnergy).toFixed(2)} J
            </ThemedText>
          </View>

          <View style={styles.formulaCard}>
            <ThemedText style={styles.formulaTitle}>💡 에너지 공식</ThemedText>
            <ThemedText style={styles.formulaText}>E = ½ × 무게 × (회전속도 × 길이)²</ThemedText>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.captureButton} onPress={captureScreen}>
              <ThemedText style={styles.captureButtonText}>📷 캡쳐하기</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.retryButton} onPress={resetAll}>
              <ThemedText style={styles.retryButtonText}>🔄 처음부터</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ViewShot>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>← 돌아가기</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.title}>편곤 에너지 측정기</ThemedText>
      </ThemedView>

      {measurementState === 'infantry_ready' && renderReadyScreen('infantry')}
      {measurementState === 'infantry_measuring' && renderMeasuringScreen('infantry')}
      {measurementState === 'infantry_result' && renderResultScreen('infantry')}
      {measurementState === 'cavalry_ready' && renderReadyScreen('cavalry')}
      {measurementState === 'cavalry_measuring' && renderMeasuringScreen('cavalry')}
      {measurementState === 'cavalry_result' && renderResultScreen('cavalry')}
      {measurementState === 'final_result' && renderFinalResultScreen()}
    </SafeAreaView>
  );
}
