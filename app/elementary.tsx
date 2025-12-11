import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { fontScale, hp, moderateScale, SCREEN_WIDTH, wp } from "@/utils/responsive";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { LineChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";

interface AccelerationData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

interface GyroscopeData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

interface GravityOffset {
  x: number;
  y: number;
  z: number;
}


export default function ElementaryScreen() {
  const router = useRouter();
  const [data, setData] = useState<AccelerationData>({
    x: 0,
    y: 0,
    z: 0,
    timestamp: 0,
  });
  const [gyroData, setGyroData] = useState<GyroscopeData>({
    x: 0,
    y: 0,
    z: 0,
    timestamp: 0,
  });
  const [subscription, setSubscription] = useState<any>(null);
  const [gyroSubscription, setGyroSubscription] = useState<any>(null);
  const subscriptionRef = useRef<any>(null);
  const gyroSubscriptionRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedData, setRecordedData] = useState<AccelerationData[]>([]);
  const [maxAcceleration, setMaxAcceleration] = useState(0);
  const [graphData, setGraphData] = useState<number[]>([]);
  const [gravityOffset, setGravityOffset] = useState<GravityOffset>({
    x: 0,
    y: 0,
    z: 0,
  });
  const [isCalibrated, setIsCalibrated] = useState(false);

  // 각속도 및 운동에너지 상태
  const [angularVelocity, setAngularVelocity] = useState<number>(0);
  const [kineticEnergy, setKineticEnergy] = useState<number>(0);

  // 기본 설정값 (초등학생용 - 고정값 사용)
  const DEFAULT_MASS = 0.5; // 타격부 질량 (kg)
  const DEFAULT_RADIUS = 0.3; // 회전반경 (m)

  // ref를 사용하여 최신 값 참조 (closure 문제 방지)
  const gravityOffsetRef = useRef<GravityOffset>(gravityOffset);
  const isRecordingRef = useRef<boolean>(isRecording);

  // ref 업데이트
  useEffect(() => {
    gravityOffsetRef.current = gravityOffset;
  }, [gravityOffset]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    // 센서 업데이트 간격 설정
    Accelerometer.setUpdateInterval(100);
    Gyroscope.setUpdateInterval(100);

    // 저장된 세션 불러오기
    loadSavedSettings();

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
      if (gyroSubscriptionRef.current) {
        gyroSubscriptionRef.current.remove();
      }
    };
  }, []);

  const loadSavedSettings = async () => {
    try {
      // 저장된 중력 오프셋 불러오기
      const savedOffset = await AsyncStorage.getItem("gravityOffset");
      if (savedOffset) {
        setGravityOffset(JSON.parse(savedOffset));
        setIsCalibrated(true);
      }
    } catch (error) {
      console.error("설정 불러오기 실패:", error);
    }
  };

  const _subscribe = useCallback(async () => {
    try {
      // 기존 리스너가 있으면 먼저 제거
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      if (gyroSubscriptionRef.current) {
        gyroSubscriptionRef.current.remove();
        gyroSubscriptionRef.current = null;
      }

      // 가속도계 센서 사용 가능 여부 확인
      const isAccelerometerAvailable = await Accelerometer.isAvailableAsync();
      if (!isAccelerometerAvailable) {
        Alert.alert("알림", "📱 이 기기에서는 움직임 센서를 사용할 수 없어요.");
        return;
      }

      // 자이로스코프 센서 사용 가능 여부 확인
      const isGyroscopeAvailable = await Gyroscope.isAvailableAsync();
      if (!isGyroscopeAvailable) {
        Alert.alert("알림", "📱 이 기기에서는 회전 센서를 사용할 수 없어요.");
        return;
      }

      const newSubscription = Accelerometer.addListener((accelerometerData) => {
        const newData = {
          x: accelerometerData.x,
          y: accelerometerData.y,
          z: accelerometerData.z,
          timestamp: Date.now(),
        };
        setData(newData);

        // 중력 보정된 가속도 계산 (ref 사용)
        const offset = gravityOffsetRef.current;
        const correctedX = newData.x - offset.x;
        const correctedY = newData.y - offset.y;
        const correctedZ = newData.z - offset.z;

        // 최대 가속도 계산 (중력 보정 후)
        const magnitude = Math.sqrt(
          correctedX ** 2 + correctedY ** 2 + correctedZ ** 2
        );
        setMaxAcceleration((prev) => Math.max(prev, magnitude));

        // 그래프 데이터 업데이트 (최대 50개 데이터 포인트 유지)
        setGraphData((prev) => {
          const newGraphData = [...prev, magnitude];
          return newGraphData.length > 50
            ? newGraphData.slice(-50)
            : newGraphData;
        });

        // 기록 중이면 데이터 저장 (ref 사용)
        if (isRecordingRef.current) {
          setRecordedData((prev) => [...prev, newData]);
        }
      });
      setSubscription(newSubscription);
      subscriptionRef.current = newSubscription;

      // 자이로스코프 리스너 추가
      const newGyroSubscription = Gyroscope.addListener((gyroscopeData) => {
        const newGyroData = {
          x: gyroscopeData.x,
          y: gyroscopeData.y,
          z: gyroscopeData.z,
          timestamp: Date.now(),
        };
        setGyroData(newGyroData);

        // 각속도 크기 계산 (rad/s)
        const omega = Math.sqrt(
          newGyroData.x ** 2 + newGyroData.y ** 2 + newGyroData.z ** 2
        );
        setAngularVelocity(omega);

        // 운동 에너지 계산: E = ½ × m × r² × ω²
        const energy = (1 / 2) * DEFAULT_MASS * DEFAULT_RADIUS * DEFAULT_RADIUS * omega * omega;
        setKineticEnergy(energy);
      });
      setGyroSubscription(newGyroSubscription);
      gyroSubscriptionRef.current = newGyroSubscription;
    } catch (error) {
      console.error("센서 시작 오류:", error);
      Alert.alert("알림", "😢 센서를 시작하는데 문제가 생겼어요.");
    }
  }, []);

  const _unsubscribe = () => {
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
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      Alert.alert(
        "🎉 기록 완료!",
        `총 ${recordedData.length}개의 데이터를 기록했어요!`
      );
    } else {
      setRecordedData([]);
      setMaxAcceleration(0);
      setIsRecording(true);
    }
  };

  const resetData = () => {
    setMaxAcceleration(0);
    setRecordedData([]);
    setGraphData([]);
    setData({ x: 0, y: 0, z: 0, timestamp: 0 });
  };

  const calibrateGravity = async () => {
    if (!subscription || !gyroSubscription) {
      Alert.alert("알림", "📱 먼저 '측정 시작' 버튼을 눌러주세요!");
      return;
    }

    Alert.alert(
      "🎯 영점 맞추기",
      "핸드폰을 평평한 곳에 놓고 3초만 가만히 있어주세요!",
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "시작!",
          onPress: () => {
            setTimeout(() => {
              // 현재 가속도 값을 중력 오프셋으로 설정
              const offset = {
                x: data.x,
                y: data.y,
                z: data.z,
              };

              setGravityOffset(offset);
              setIsCalibrated(true);

              // AsyncStorage에 저장
              AsyncStorage.setItem("gravityOffset", JSON.stringify(offset));

              Alert.alert("✅ 완료!", "영점 맞추기가 끝났어요!");
            }, 3000);
          },
        },
      ]
    );
  };

  // 중력 보정된 합성 가속도 계산
  const correctedX = data.x - gravityOffset.x;
  const correctedY = data.y - gravityOffset.y;
  const correctedZ = data.z - gravityOffset.z;
  const magnitude = Math.sqrt(
    correctedX ** 2 + correctedY ** 2 + correctedZ ** 2
  );

  // 움직임 세기를 간단한 레벨로 변환 (0-5)
  const getMovementLevel = (value: number): string => {
    if (value < 0.1) return "🌙 아주 조용해요";
    if (value < 0.5) return "🚶 살살 움직여요";
    if (value < 1.0) return "🏃 빠르게 움직여요";
    if (value < 2.0) return "💨 아주 빠르게!";
    return "🚀 엄청 빠르게!!";
  };

  const getRotationLevel = (value: number): string => {
    if (value < 0.5) return "🎯 거의 안 돌아요";
    if (value < 1.0) return "🔄 천천히 돌아요";
    if (value < 2.0) return "🌀 빠르게 돌아요";
    return "🌪️ 엄청 빠르게 돌아요!";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* 헤더 */}
        <ThemedView style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>← 돌아가기</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            🎮 움직임 측정기
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            📱 핸드폰을 움직여서 측정해보세요!
          </ThemedText>
        </ThemedView>

        {/* 컨트롤 버튼 */}
        <ThemedView style={styles.controlPanel}>
          <TouchableOpacity
            style={[
              styles.button,
              subscription ? styles.stopButton : styles.startButton,
            ]}
            onPress={subscription ? _unsubscribe : _subscribe}
          >
            <ThemedText style={styles.buttonText}>
              {subscription ? "⏹️ 측정 멈추기" : "▶️ 측정 시작"}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              isRecording ? styles.recordingButton : styles.recordButton,
            ]}
            onPress={toggleRecording}
            disabled={!subscription}
          >
            <ThemedText style={styles.buttonText}>
              {isRecording ? "⏸️ 기록 멈추기" : "🔴 기록 시작"}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={resetData}
          >
            <ThemedText style={styles.buttonText}>🔄 초기화</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              isCalibrated ? styles.calibratedButton : styles.calibrateButton,
            ]}
            onPress={calibrateGravity}
          >
            <ThemedText style={styles.buttonText}>
              {isCalibrated ? "✅ 영점 완료" : "🎯 영점 맞추기"}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* 움직임 세기 표시 */}
        <ThemedView style={styles.movementContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            📊 움직임 세기
          </ThemedText>

          <View style={styles.movementLevelBox}>
            <ThemedText style={styles.movementLevelText}>
              {getMovementLevel(magnitude)}
            </ThemedText>
            <ThemedText style={styles.movementValueSmall}>
              {magnitude.toFixed(2)}
            </ThemedText>
          </View>

          <View style={styles.dataRow}>
            <ThemedText style={styles.dataLabel}>🏆 최고 기록:</ThemedText>
            <ThemedText style={[styles.dataValue, styles.maxValue]}>
              {maxAcceleration.toFixed(2)}
            </ThemedText>
          </View>

          {isRecording && (
            <View style={styles.dataRow}>
              <ThemedText style={[styles.dataLabel, styles.recordingText]}>
                🔴 기록 중... ({recordedData.length}개)
              </ThemedText>
            </View>
          )}
        </ThemedView>

        {/* 회전 속도 표시 */}
        <ThemedView style={styles.rotationContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            🔄 회전 속도
          </ThemedText>

          <View style={styles.movementLevelBox}>
            <ThemedText style={styles.movementLevelText}>
              {getRotationLevel(angularVelocity)}
            </ThemedText>
            <ThemedText style={styles.movementValueSmall}>
              {angularVelocity.toFixed(2)}
            </ThemedText>
          </View>
        </ThemedView>

        {/* 운동에너지 표시 */}
        <ThemedView style={styles.energyContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            ⚡ 움직임 힘 (에너지)
          </ThemedText>

          <View style={styles.movementLevelBox}>
            <ThemedText style={styles.movementLevelText}>
              {kineticEnergy < 0.01 ? "💤 거의 없어요" :
               kineticEnergy < 0.1 ? "🔋 조금 있어요" :
               kineticEnergy < 0.5 ? "⚡ 꽤 있어요!" :
               kineticEnergy < 1.0 ? "💪 많이 있어요!" :
               "🔥 엄청 많아요!!"}
            </ThemedText>
            <ThemedText style={styles.energyValue}>
              {kineticEnergy.toFixed(3)}
            </ThemedText>
            <ThemedText style={styles.energyUnit}>줄 (J)</ThemedText>
          </View>

          <View style={styles.formulaBox}>
            <ThemedText style={styles.formulaLabel}>💡 에너지 공식:</ThemedText>
            <ThemedText style={styles.formulaText}>
              움직임 힘 = ½ × 무게 × 거리² × 속도²
            </ThemedText>
          </View>
        </ThemedView>

        {/* 실시간 그래프 */}
        {graphData.length > 0 && (
          <ThemedView style={styles.graphContainer}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              📈 실시간 그래프
            </ThemedText>
            <LineChart
              data={{
                labels: graphData.map((_, index) =>
                  index % 10 === 0 ? `${index}` : ""
                ),
                datasets: [
                  {
                    data: graphData,
                    color: (opacity = 1) => `rgba(255, 159, 67, ${opacity})`,
                    strokeWidth: 3,
                  },
                ],
              }}
              width={SCREEN_WIDTH - wp(15)}
              height={200}
              chartConfig={{
                backgroundColor: "#FFF8E1",
                backgroundGradientFrom: "#FFF8E1",
                backgroundGradientTo: "#FFECB3",
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "5",
                  strokeWidth: "2",
                  stroke: "#FF9800",
                },
              }}
              bezier
              style={styles.chart}
            />
          </ThemedView>
        )}

        {/* 상세 데이터 (숨김 가능) */}
        <ThemedView style={styles.detailContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            🔬 자세한 정보
          </ThemedText>
          
          <View style={styles.dataRow}>
            <ThemedText style={styles.dataLabel}>↔️ 좌우 움직임:</ThemedText>
            <ThemedText style={styles.dataValue}>
              {correctedX.toFixed(2)}
            </ThemedText>
          </View>
          
          <View style={styles.dataRow}>
            <ThemedText style={styles.dataLabel}>↕️ 위아래 움직임:</ThemedText>
            <ThemedText style={styles.dataValue}>
              {correctedY.toFixed(2)}
            </ThemedText>
          </View>
          
          <View style={styles.dataRow}>
            <ThemedText style={styles.dataLabel}>🔄 앞뒤 움직임:</ThemedText>
            <ThemedText style={styles.dataValue}>
              {correctedZ.toFixed(2)}
            </ThemedText>
          </View>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF8E1",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFF8E1",
    paddingBottom: hp(2),
  },
  header: {
    padding: moderateScale(20),
    alignItems: "center",
    backgroundColor: "#FF9800",
    marginBottom: moderateScale(12),
    borderBottomLeftRadius: moderateScale(20),
    borderBottomRightRadius: moderateScale(20),
  },
  backButton: {
    position: "absolute",
    left: moderateScale(12),
    top: moderateScale(12),
    padding: moderateScale(6),
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: moderateScale(10),
  },
  backButtonText: {
    color: "white",
    fontSize: fontScale(14),
    fontWeight: "bold",
  },
  title: {
    color: "white",
    fontSize: fontScale(26),
    fontWeight: "bold",
    marginBottom: moderateScale(6),
    marginTop: moderateScale(16),
  },
  subtitle: {
    color: "white",
    fontSize: fontScale(15),
    opacity: 0.95,
  },
  controlPanel: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    padding: moderateScale(10),
    marginBottom: moderateScale(10),
    marginHorizontal: wp(2),
    gap: moderateScale(6),
  },
  button: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(12),
    minWidth: wp(40),
    marginVertical: moderateScale(4),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  startButton: {
    backgroundColor: "#4CAF50",
  },
  stopButton: {
    backgroundColor: "#F44336",
  },
  recordButton: {
    backgroundColor: "#2196F3",
  },
  recordingButton: {
    backgroundColor: "#E91E63",
  },
  resetButton: {
    backgroundColor: "#9E9E9E",
  },
  calibrateButton: {
    backgroundColor: "#FF5722",
  },
  calibratedButton: {
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: fontScale(13),
  },
  movementContainer: {
    marginHorizontal: wp(4),
    marginVertical: moderateScale(8),
    padding: moderateScale(16),
    borderRadius: moderateScale(16),
    backgroundColor: "#FFECB3",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rotationContainer: {
    marginHorizontal: wp(4),
    marginVertical: moderateScale(8),
    padding: moderateScale(16),
    borderRadius: moderateScale(16),
    backgroundColor: "#E3F2FD",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  movementLevelBox: {
    backgroundColor: "white",
    borderRadius: moderateScale(14),
    padding: moderateScale(16),
    alignItems: "center",
    marginBottom: moderateScale(12),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  movementLevelText: {
    fontSize: fontScale(16),
    fontWeight: "bold",
    color: "#333",
    marginBottom: moderateScale(6),
    textAlign: "center",
  },
  movementValue: {
    fontSize: fontScale(28),
    fontWeight: "bold",
    color: "#FF9800",
  },
  movementValueSmall: {
    fontSize: fontScale(24),
    fontWeight: "bold",
    color: "#FF9800",
  },
  graphContainer: {
    marginHorizontal: wp(4),
    marginVertical: moderateScale(8),
    padding: moderateScale(16),
    borderRadius: moderateScale(16),
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  detailContainer: {
    marginHorizontal: wp(4),
    marginVertical: moderateScale(8),
    padding: moderateScale(16),
    borderRadius: moderateScale(16),
    backgroundColor: "#F3E5F5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: moderateScale(24),
  },
  sectionTitle: {
    fontSize: fontScale(18),
    fontWeight: "bold",
    marginBottom: moderateScale(12),
    color: "#333",
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: moderateScale(10),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  dataLabel: {
    fontSize: fontScale(15),
    color: "#555",
    fontWeight: "500",
    flex: 1,
  },
  dataValue: {
    fontSize: fontScale(16),
    fontWeight: "bold",
    color: "#333",
  },
  maxValue: {
    color: "#F44336",
    fontSize: fontScale(18),
  },
  recordingText: {
    color: "#E91E63",
    fontWeight: "bold",
    fontSize: fontScale(15),
  },
  chart: {
    marginVertical: moderateScale(6),
    borderRadius: moderateScale(14),
  },
  energyContainer: {
    marginHorizontal: wp(4),
    marginVertical: moderateScale(8),
    padding: moderateScale(16),
    borderRadius: moderateScale(16),
    backgroundColor: "#E8F5E9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  energyValue: {
    fontSize: fontScale(24),
    fontWeight: "bold",
    color: "#4CAF50",
  },
  energyUnit: {
    fontSize: fontScale(12),
    color: "#666",
    marginTop: moderateScale(3),
  },
  formulaBox: {
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    marginTop: moderateScale(8),
  },
  formulaLabel: {
    fontSize: fontScale(12),
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: moderateScale(3),
  },
  formulaText: {
    fontSize: fontScale(12),
    color: "#555",
    textAlign: "center",
  },
});
