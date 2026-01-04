import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { FLAIL_SPECS, FlailType } from "@/constants/flail-specs";
import { secondaryStyles as styles } from "@/styles/secondary.styles";
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
  maxVTip: number;
}

type MeasurementState = 
  | 'infantry_ready' 
  | 'infantry_measuring' 
  | 'infantry_result'
  | 'cavalry_ready' 
  | 'cavalry_measuring' 
  | 'cavalry_result'
  | 'final_result';

export default function SecondaryScreen() {
  const router = useRouter();
  const [measurementState, setMeasurementState] = useState<MeasurementState>('infantry_ready');
  
  const [subscription, setSubscription] = useState<any>(null);
  const [gyroSubscription, setGyroSubscription] = useState<any>(null);
  const subscriptionRef = useRef<any>(null);
  const gyroSubscriptionRef = useRef<any>(null);
  
  const [maxAcceleration, setMaxAcceleration] = useState(0);
  const [maxAngularVelocity, setMaxAngularVelocity] = useState(0);
  const [maxEnergy, setMaxEnergy] = useState(0);
  const [maxVTip, setMaxVTip] = useState(0);
  
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
      Alert.alert("알림", "먼저 중력 캘리브레이션을 완료해주세요!");
      return;
    }

    const spec = FLAIL_SPECS[flailType];
    setCurrentFlailType(flailType);

    try {
      setMaxAcceleration(0);
      setMaxAngularVelocity(0);
      setMaxEnergy(0);
      setMaxVTip(0);

      const isAccelerometerAvailable = await Accelerometer.isAvailableAsync();
      const isGyroscopeAvailable = await Gyroscope.isAvailableAsync();
      
      if (!isAccelerometerAvailable || !isGyroscopeAvailable) {
        Alert.alert("오류", "센서를 사용할 수 없습니다.");
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
        setMaxVTip((prev) => Math.max(prev, v_tip));
      });
      gyroSubscriptionRef.current = newGyroSubscription;
      setGyroSubscription(newGyroSubscription);

      setMeasurementState(flailType === 'infantry' ? 'infantry_measuring' : 'cavalry_measuring');
    } catch (error) {
      Alert.alert("오류", "센서를 시작하는 중 오류가 발생했습니다.");
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
      maxVTip,
    };

    // Firebase에 자동 업로드
    const uploadSuccess = await uploadMeasurementResult('secondary', currentFlailType, {
      maxEnergy,
      maxAngularVelocity,
    });
    
    if (uploadSuccess) {
      console.log('고등일반용 측정 결과 Firebase 업로드 완료');
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
    setMaxVTip(0);
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
    setMaxVTip(0);
    setMeasurementState('infantry_ready');
  };

  const calibrateGravity = async () => {
    try {
      const isAccelerometerAvailable = await Accelerometer.isAvailableAsync();
      if (!isAccelerometerAvailable) {
        Alert.alert("오류", "센서를 사용할 수 없습니다.");
        return;
      }

      Alert.alert("중력 캘리브레이션", "핸드폰을 평평한 곳에 놓고 3초 동안 기다려주세요.", [
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
                Alert.alert("완료", "중력 보정이 완료되었습니다.");
              }, 3000);
            });
          },
        },
      ]);
    } catch (error) {
      console.error("캘리브레이션 오류:", error);
    }
  };

  const renderReadyScreen = (flailType: FlailType) => {
    const spec = FLAIL_SPECS[flailType];
    const isInfantry = flailType === 'infantry';
    
    return (
      <ScrollView style={styles.readyContainer} contentContainerStyle={styles.readyContent}>
        <View style={[styles.readyBox, isInfantry ? styles.infantryBox : styles.cavalryBox]}>
          <View style={styles.titleRow}>
            <ThemedText style={styles.readyEmoji}>{isInfantry ? '🗡️' : '🐎'}</ThemedText>
            <ThemedText style={styles.readyTitle}>{spec.name}</ThemedText>
          </View>
          <ThemedText style={styles.readyDescription}>
            {isInfantry ? '1단계: 보병용 편곤 에너지 측정' : '2단계: 마상용 편곤 에너지 측정'}
          </ThemedText>
        </View>

        <View style={styles.specCard}>
          <ThemedText style={styles.specCardTitle}>📐 {spec.name} 물리 특성</ThemedText>
          
          <View style={styles.specRow}>
            <ThemedText style={styles.specLabel}>본체 길이</ThemedText>
            <ThemedText style={styles.specValue}>{(spec.bodyLength * 100).toFixed(0)} cm</ThemedText>
          </View>
          <View style={styles.specRow}>
            <ThemedText style={styles.specLabel}>보조체 길이</ThemedText>
            <ThemedText style={styles.specValue}>{(spec.headLength * 100).toFixed(0)} cm</ThemedText>
          </View>
          <View style={styles.specRow}>
            <ThemedText style={styles.specLabel}>연결부 길이</ThemedText>
            <ThemedText style={styles.specValue}>{(spec.linkLength * 100).toFixed(1)} cm</ThemedText>
          </View>
          <View style={styles.specDivider} />
          <View style={styles.specRow}>
            <ThemedText style={styles.specLabel}>전체 길이 (L_tot)</ThemedText>
            <ThemedText style={styles.specValueHighlight}>{(spec.totalLength * 100).toFixed(1)} cm</ThemedText>
          </View>
          <View style={styles.specRow}>
            <ThemedText style={styles.specLabel}>총 질량 (m)</ThemedText>
            <ThemedText style={styles.specValueHighlight}>{spec.mass} kg</ThemedText>
          </View>
        </View>

        {!isCalibrated ? (
          <View style={styles.calibrationRequired}>
            <ThemedText style={styles.calibrationTitle}>⚠️ 중력 캘리브레이션이 필요합니다</ThemedText>
            <TouchableOpacity style={styles.calibrateButton} onPress={calibrateGravity}>
              <ThemedText style={styles.calibrateButtonText}>🎯 중력 캘리브레이션</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.calibrationDone}>
            <ThemedText style={styles.calibrationDoneText}>✅ 중력 보정 완료</ThemedText>
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
      </ScrollView>
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
            <ThemedText style={styles.liveDataLabel}>현재 각속도 (ω)</ThemedText>
            <ThemedText style={styles.liveDataValue}>{angularVelocity.toFixed(4)} rad/s</ThemedText>
          </View>
          <View style={styles.liveDataRow}>
            <ThemedText style={styles.liveDataLabel}>현재 에너지</ThemedText>
            <ThemedText style={styles.liveDataValue}>{kineticEnergy.toFixed(4)} J</ThemedText>
          </View>
          <View style={styles.liveDataDivider} />
          <View style={styles.liveDataRow}>
            <ThemedText style={styles.liveDataLabel}>최대 에너지</ThemedText>
            <ThemedText style={styles.liveDataValueMax}>{maxEnergy.toFixed(4)} J</ThemedText>
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

        <View style={[styles.resultMainCard, isInfantry ? styles.infantryResultCard : styles.cavalryResultCard]}>
          <ThemedText style={styles.resultEnergyValue}>{result.maxEnergy.toFixed(4)}</ThemedText>
          <ThemedText style={styles.resultEnergyUnit}>J (줄)</ThemedText>
        </View>

        <View style={styles.resultDetailsCard}>
          <ThemedText style={styles.resultSectionTitle}>측정값</ThemedText>
          <View style={styles.resultRow}>
            <ThemedText style={styles.resultDetailLabel}>최대 회전속도 (ω_max)</ThemedText>
            <ThemedText style={styles.resultDetailValue}>{result.maxAngularVelocity.toFixed(4)} rad/s</ThemedText>
          </View>
          <View style={styles.resultRow}>
            <ThemedText style={styles.resultDetailLabel}>최대 끝속도 (v_tip)</ThemedText>
            <ThemedText style={styles.resultDetailValue}>{result.maxVTip.toFixed(4)} m/s</ThemedText>
          </View>
          <View style={styles.resultRow}>
            <ThemedText style={styles.resultDetailLabel}>최대 가속도</ThemedText>
            <ThemedText style={styles.resultDetailValue}>{result.maxAcceleration.toFixed(4)} m/s²</ThemedText>
          </View>
        </View>

        <View style={styles.formulaCard}>
          <ThemedText style={styles.formulaTitle}>📐 에너지 계산</ThemedText>
          <ThemedText style={styles.formulaText}>운동에너지 = 0.5 × 무게 × (속도)²</ThemedText>
          <ThemedText style={styles.formulaText}>운동에너지 = 0.5 × {spec.mass} × ({result.maxVTip.toFixed(4)})²</ThemedText>
          <ThemedText style={styles.formulaResult}>결과 = {result.maxEnergy.toFixed(4)} J</ThemedText>
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
      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();
        
        try {
          await MediaLibrary.saveToLibraryAsync(uri);
          Alert.alert('완료!', '결과 화면이 갤러리에 저장되었습니다.');
        } catch (saveError) {
           // 권한 문제로 실패했을 경우
           const { status } = await MediaLibrary.getPermissionsAsync();
           if (status !== 'granted') {
              const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();
              if (newStatus === 'granted') {
                 await MediaLibrary.saveToLibraryAsync(uri);
                 Alert.alert('완료!', '결과 화면이 갤러리에 저장되었습니다.');
                 return;
              }
           }
           throw saveError;
        }
      }
    } catch (error) {
      console.error('캡쳐 오류:', error);
      Alert.alert('오류', '화면 캡쳐에 실패했습니다. 갤러리 권한을 확인해주세요.');
    }
  };

  const renderFinalResultScreen = () => {
    if (!infantryResult || !cavalryResult) return null;

    const winner = infantryResult.maxEnergy >= cavalryResult.maxEnergy ? 'infantry' : 'cavalry';
    const infantrySpec = FLAIL_SPECS.infantry;
    const cavalrySpec = FLAIL_SPECS.cavalry;

    return (
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }} style={styles.viewShot}>
        <ScrollView style={styles.resultContainer} contentContainerStyle={styles.resultContent}>
          <ThemedText style={styles.finalTitle}>📊 최종 측정 결과</ThemedText>

          {/* 보병용 편곤 결과 */}
          <View style={[styles.comparisonCard, winner === 'infantry' && styles.winnerCard]}>
            {winner === 'infantry' && <ThemedText style={styles.winnerBadge}>👑 최대 에너지</ThemedText>}
            <View style={styles.comparisonHeader}>
              <ThemedText style={styles.comparisonEmoji}>🗡️</ThemedText>
              <ThemedText style={styles.comparisonTitle}>{infantrySpec.name}</ThemedText>
            </View>
            <ThemedText style={styles.comparisonEnergy}>{infantryResult.maxEnergy.toFixed(4)} J</ThemedText>
            <View style={styles.comparisonDetails}>
              <ThemedText style={styles.comparisonDetailText}>
                ω = {infantryResult.maxAngularVelocity.toFixed(4)} rad/s
              </ThemedText>
              <ThemedText style={styles.comparisonDetailText}>
                v = {infantryResult.maxVTip.toFixed(4)} m/s
              </ThemedText>
            </View>
            <ThemedText style={styles.comparisonSpec}>
              L = {(infantrySpec.totalLength * 100).toFixed(1)}cm | m = {infantrySpec.mass}kg
            </ThemedText>
          </View>

          {/* 마상용 편곤 결과 */}
          <View style={[styles.comparisonCard, winner === 'cavalry' && styles.winnerCard]}>
            {winner === 'cavalry' && <ThemedText style={styles.winnerBadge}>👑 최대 에너지</ThemedText>}
            <View style={styles.comparisonHeader}>
              <ThemedText style={styles.comparisonEmoji}>🐎</ThemedText>
              <ThemedText style={styles.comparisonTitle}>{cavalrySpec.name}</ThemedText>
            </View>
            <ThemedText style={styles.comparisonEnergy}>{cavalryResult.maxEnergy.toFixed(4)} J</ThemedText>
            <View style={styles.comparisonDetails}>
              <ThemedText style={styles.comparisonDetailText}>
                ω = {cavalryResult.maxAngularVelocity.toFixed(4)} rad/s
              </ThemedText>
              <ThemedText style={styles.comparisonDetailText}>
                v = {cavalryResult.maxVTip.toFixed(4)} m/s
              </ThemedText>
            </View>
            <ThemedText style={styles.comparisonSpec}>
              L = {(cavalrySpec.totalLength * 100).toFixed(1)}cm | m = {cavalrySpec.mass}kg
            </ThemedText>
          </View>

          {/* 에너지 차이 분석 */}
          <View style={styles.analysisCard}>
            <ThemedText style={styles.analysisTitle}>⚡ 에너지 분석</ThemedText>
            <View style={styles.analysisRow}>
              <ThemedText style={styles.analysisLabel}>에너지 차이</ThemedText>
              <ThemedText style={styles.analysisValue}>
                {Math.abs(infantryResult.maxEnergy - cavalryResult.maxEnergy).toFixed(4)} J
              </ThemedText>
            </View>
            <View style={styles.analysisRow}>
              <ThemedText style={styles.analysisLabel}>에너지 비율</ThemedText>
              <ThemedText style={styles.analysisValue}>
                {(infantryResult.maxEnergy / cavalryResult.maxEnergy).toFixed(2)} : 1
              </ThemedText>
            </View>
          </View>

          <View style={styles.formulaCard}>
            <ThemedText style={styles.formulaTitle}>📐 운동 에너지 공식</ThemedText>
            <ThemedText style={styles.formulaText}>운동에너지 = 0.5 × 무게 × (속도)²</ThemedText>
            <ThemedText style={styles.formulaText}>속도 = 회전속도 × 길이</ThemedText>
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
          <ThemedText style={styles.backButtonText}>← 처음으로</ThemedText>
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
