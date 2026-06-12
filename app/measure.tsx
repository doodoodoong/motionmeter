import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { WEAPON_SPECS } from "@/constants/weapon-specs";
import { measureStyles as styles } from "@/styles/measure.styles";
import { useEventListener } from "expo";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Gyroscope } from "expo-sensors";
import { useVideoPlayer, VideoView } from "expo-video";
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
import { uploadMeasurementResult } from "@/utils/firebase";

type MeasurementState = 'ready' | 'measuring' | 'splash' | 'result';

export default function MeasureScreen() {
  const router = useRouter();
  const { weapon } = useLocalSearchParams<{ weapon: string }>();
  const selectedWeapon = (weapon as 'flail' | 'staff') || 'flail';
  
  const [measurementState, setMeasurementState] = useState<MeasurementState>('ready');
  
  const [gyroSubscription, setGyroSubscription] = useState<any>(null);
  const gyroSubscriptionRef = useRef<any>(null);
  
  const [maxAngularVelocity, setMaxAngularVelocity] = useState(0);
  const [currentAngularVelocity, setCurrentAngularVelocity] = useState(0);

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

    let rotationalFactor = 1;
    if (selectedWeapon === 'flail') { rotationalFactor = 3.64; }
    else if (selectedWeapon === 'staff') { rotationalFactor = 1.78; }
    
    const rotationalEnergy = rotationalFactor * (maxAngularVelocity ** 2);

    let weaponKorean = "편곤";
    if (selectedWeapon === 'staff') weaponKorean = "봉";

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
        <View style={[styles.readyBox, styles.infantryBox]}>
          <View style={styles.titleRow}>
            <ThemedText style={styles.readyEmoji}>📱</ThemedText>
            <ThemedText style={styles.readyTitle}>측정 준비</ThemedText>
          </View>
          <ThemedText style={styles.readyDescription}>
            스마트폰을 손에 꼭 쥐고 강하게 휘둘러보세요!{'\n'}
            선택한 무기의 파괴력을 측정합니다.
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
    // Calculate energy based on factor
    const weaponInfo = WEAPON_SPECS[selectedWeapon];
    const energy = weaponInfo.factor * maxAngularVelocity;

    // Calculate rotational kinetic energy
    let rotationalFactor = 1;
    let color = "#5AC8FA";
    if (selectedWeapon === 'flail') { rotationalFactor = 3.64; color = "#5AC8FA"; }
    else if (selectedWeapon === 'staff') { rotationalFactor = 1.78; color = "#4CD964"; }
    
    const rotationalEnergy = rotationalFactor * (maxAngularVelocity ** 2);

    const energyWidth = 100;
    const rotationalWidth = 100;

    return (
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }} style={styles.viewShot}>
        <ScrollView style={styles.resultContainer} contentContainerStyle={styles.resultContent}>
          <ThemedText style={styles.finalTitle}>평균충격력 측정 결과</ThemedText>

          <View style={{ backgroundColor: 'rgba(0,0,0,0.05)', padding: 15, borderRadius: 12, marginBottom: 20, alignItems: 'center' }}>
            <ThemedText style={{ fontSize: 16, marginBottom: 5 }}>측정된 최대 회전속도</ThemedText>
            <ThemedText type="title" style={{ fontSize: 28, fontWeight: 'bold' }}>{maxAngularVelocity.toFixed(2)} rad/s</ThemedText>
          </View>

          {/* Selected Weapon Gauge */}
          <GaugeBar label={weaponInfo.name} energy={energy} targetWidth={energyWidth} color={color} />

          <View style={{ marginTop: 20, marginBottom: 10, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
          
          <ThemedText style={[styles.finalTitle, { marginTop: 10 }]}>회전운동에너지</ThemedText>

          {/* Selected Weapon Rotational Gauge */}
          <GaugeBar label={weaponInfo.name} energy={rotationalEnergy} targetWidth={rotationalWidth} color={color} />

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
