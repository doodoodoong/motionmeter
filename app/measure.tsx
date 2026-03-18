import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { WEAPON_SPECS } from "@/constants/weapon-specs";
import { measureStyles as styles } from "@/styles/measure.styles";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { Gyroscope } from "expo-sensors";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";
import { Video, ResizeMode } from "expo-av";

type MeasurementState = 'ready' | 'measuring' | 'splash' | 'result';

export default function MeasureScreen() {
  const router = useRouter();
  const [measurementState, setMeasurementState] = useState<MeasurementState>('ready');
  
  const [gyroSubscription, setGyroSubscription] = useState<any>(null);
  const gyroSubscriptionRef = useRef<any>(null);
  
  const [maxAngularVelocity, setMaxAngularVelocity] = useState(0);
  const [currentAngularVelocity, setCurrentAngularVelocity] = useState(0);

  useEffect(() => {
    Gyroscope.setUpdateInterval(100);

    return () => {
      if (gyroSubscriptionRef.current) gyroSubscriptionRef.current.remove();
    };
  }, []);

  const startMeasurement = useCallback(async () => {
    try {
      setMaxAngularVelocity(0);
      setCurrentAngularVelocity(0);

      const isGyroscopeAvailable = await Gyroscope.isAvailableAsync();
      
      if (!isGyroscopeAvailable) {
        Alert.alert("알림", "이 기기에서는 자이로스코프 센서를 사용할 수 없어요.");
        return;
      }

      const newGyroSubscription = Gyroscope.addListener((gyroscopeData) => {
        const omega = Math.sqrt(gyroscopeData.x ** 2 + gyroscopeData.y ** 2 + gyroscopeData.z ** 2);
        setCurrentAngularVelocity(omega);
        setMaxAngularVelocity((prev) => Math.max(prev, omega));
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

    setMeasurementState('splash');
  };

  const resetAll = () => {
    setMaxAngularVelocity(0);
    setCurrentAngularVelocity(0);
    setMeasurementState('ready');
  };

  const renderReadyScreen = () => {
    return (
      <View style={styles.stateContainer}>
        <View style={[styles.readyBox, styles.infantryBox]}>
          <View style={styles.titleRow}>
            <ThemedText style={styles.readyEmoji}>📱</ThemedText>
            <ThemedText style={styles.readyTitle}>측정 준비</ThemedText>
          </View>
          <ThemedText style={styles.readyDescription}>
            스마트폰을 손에 꼭 쥐고 강하게 휘둘러보세요!{'\n'}
            한 번의 휘두름으로 세 가지 무기의 파괴력을 측정합니다.
          </ThemedText>
        </View>

        <TouchableOpacity 
          style={[styles.startButton, styles.infantryButton]} 
          onPress={startMeasurement}
        >
          <ThemedText style={styles.startButtonText}>▶️ 측정 시작</ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMeasuringScreen = () => {
    // 임시로 현재 각속도를 표시
    return (
      <View style={styles.stateContainer}>
        <View style={[styles.measuringBox, styles.infantryMeasuring]}>
          <ThemedText style={styles.measuringTitle}>🌀 측정 중...</ThemedText>
          <ThemedText style={styles.measuringDescription}>스마트폰을 힘차게 휘둘러보세요!</ThemedText>
        </View>

        <View style={styles.liveDataBox}>
          <View style={styles.liveDataRow}>
            <ThemedText style={styles.liveDataLabel}>현재 회전속도</ThemedText>
            <ThemedText style={styles.liveDataValue}>{currentAngularVelocity.toFixed(2)} rad/s</ThemedText>
          </View>
          <View style={styles.liveDataRow}>
            <ThemedText style={styles.liveDataLabel}>최대 회전속도 기록</ThemedText>
            <ThemedText style={styles.liveDataValueMax}>{maxAngularVelocity.toFixed(2)} rad/s</ThemedText>
          </View>
        </View>

        <TouchableOpacity style={styles.stopButton} onPress={stopMeasurement}>
          <ThemedText style={styles.stopButtonText}>⏹️ 측정 완료</ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSplashScreen = () => {
    return (
      <View style={{ flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'black', zIndex: 999 }}>
        <Video
          source={require("@/assets/download.mov")}
          style={{ flex: 1, width: '100%', height: '100%' }}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping={false}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded && status.didJustFinish) {
              setMeasurementState('result');
            }
          }}
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
          Alert.alert('완료!', '결과 화면이 갤러리에 저장되었어요!');
        } catch (saveError) {
          const { status } = await MediaLibrary.getPermissionsAsync();
          if (status !== 'granted') {
             const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();
             if (newStatus === 'granted') {
                await MediaLibrary.saveToLibraryAsync(uri);
                Alert.alert('완료!', '결과 화면이 갤러리에 저장되었어요!');
                return;
             }
          }
          throw saveError;
        }
      }
    } catch (error) {
      console.error('캡쳐 오류:', error);
      Alert.alert('오류', '화면 캡쳐에 실패했어요. 권한을 확인해주세요.');
    }
  };

  const renderResultScreen = () => {
    // Calculatate energies based on factors
    const flailEnergy = WEAPON_SPECS.flail.factor * maxAngularVelocity;
    const staffEnergy = WEAPON_SPECS.staff.factor * maxAngularVelocity;
    const maceEnergy = WEAPON_SPECS.mace.factor * maxAngularVelocity;

    // Calculate rotational kinetic energies
    const flailRotationalEnergy = 3.64 * (maxAngularVelocity ** 2);
    const staffRotationalEnergy = 1.78 * (maxAngularVelocity ** 2);
    const maceRotationalEnergy = 1.45 * (maxAngularVelocity ** 2);

    // Find the max energy to scale the bars (baseline max is at least flail as it has highest factor)
    const maxEnergyValue = Math.max(flailEnergy, staffEnergy, maceEnergy, 100);

    const flailWidth = Math.min((flailEnergy / maxEnergyValue) * 100, 100);
    const staffWidth = Math.min((staffEnergy / maxEnergyValue) * 100, 100);
    const maceWidth = Math.min((maceEnergy / maxEnergyValue) * 100, 100);

    const maxRotationalEnergyValue = Math.max(flailRotationalEnergy, staffRotationalEnergy, maceRotationalEnergy, 100);
    const flailRotationalWidth = Math.min((flailRotationalEnergy / maxRotationalEnergyValue) * 100, 100);
    const staffRotationalWidth = Math.min((staffRotationalEnergy / maxRotationalEnergyValue) * 100, 100);
    const maceRotationalWidth = Math.min((maceRotationalEnergy / maxRotationalEnergyValue) * 100, 100);

    return (
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }} style={styles.viewShot}>
        <ScrollView style={styles.resultContainer} contentContainerStyle={styles.resultContent}>
          <ThemedText style={styles.finalTitle}>무기별 평균충격량 비교 측정 결과</ThemedText>

          <View style={{ backgroundColor: 'rgba(0,0,0,0.05)', padding: 15, borderRadius: 12, marginBottom: 20, alignItems: 'center' }}>
            <ThemedText style={{ fontSize: 16, marginBottom: 5 }}>측정된 최대 회전속도</ThemedText>
            <ThemedText type="title" style={{ fontSize: 28, fontWeight: 'bold' }}>{maxAngularVelocity.toFixed(2)} rad/s</ThemedText>
          </View>

          {/* 편곤 Gauge */}
          <GaugeBar label={WEAPON_SPECS.flail.name} energy={flailEnergy} targetWidth={flailWidth} color="#5AC8FA" />

          {/* 봉 Gauge */}
          <GaugeBar label={WEAPON_SPECS.staff.name} energy={staffEnergy} targetWidth={staffWidth} color="#4CD964" />

          {/* 철퇴 Gauge */}
          <GaugeBar label={WEAPON_SPECS.mace.name} energy={maceEnergy} targetWidth={maceWidth} color="#FF9500" />

          <View style={{ marginTop: 20, marginBottom: 10, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          
          <ThemedText style={[styles.finalTitle, { marginTop: 10 }]}>무기별 회전운동에너지 비교</ThemedText>

          {/* 편곤 Rotational Gauge */}
          <GaugeBar label={WEAPON_SPECS.flail.name} energy={flailRotationalEnergy} targetWidth={flailRotationalWidth} color="#5AC8FA" />

          {/* 봉 Rotational Gauge */}
          <GaugeBar label={WEAPON_SPECS.staff.name} energy={staffRotationalEnergy} targetWidth={staffRotationalWidth} color="#4CD964" />

          {/* 철퇴 Rotational Gauge */}
          <GaugeBar label={WEAPON_SPECS.mace.name} energy={maceRotationalEnergy} targetWidth={maceRotationalWidth} color="#FF9500" />

          <View style={[styles.buttonRow, {marginTop: 40}]}>
            <TouchableOpacity style={styles.captureButton} onPress={captureScreen}>
              <ThemedText style={styles.captureButtonText}>📷 화면 저장하기</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.retryButton} onPress={resetAll}>
              <ThemedText style={styles.retryButtonText}>🔄 다시 측정하기</ThemedText>
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
              <ThemedText style={styles.backButtonText}>← 돌아가기</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.title}>에너지 측정</ThemedText>
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

// 추출된 GaugeBar 컴포넌트
function GaugeBar({ label, energy, targetWidth, color }: { label: string, energy: number, targetWidth: number, color: string }) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: targetWidth,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [targetWidth]);

  return (
    <View style={styles.gaugeContainer}>
      <View style={styles.gaugeHeader}>
        <ThemedText style={styles.gaugeLabel}>{label}</ThemedText>
        <ThemedText style={styles.gaugeValueText}>{Math.round(energy)} J</ThemedText>
      </View>
      <View style={styles.gaugeBackground}>
        <Animated.View 
          style={[
            styles.gaugeFill, 
            { 
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%']
              }), 
              backgroundColor: color 
            }
          ]} 
        />
      </View>
    </View>
  );
}
