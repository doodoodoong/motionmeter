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
    TextInput,
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

export default function SecondaryScreen() {
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
  const [savedSessions, setSavedSessions] = useState<string[]>([]);
  const [gravityOffset, setGravityOffset] = useState<GravityOffset>({
    x: 0,
    y: 0,
    z: 0,
  });
  const [isCalibrated, setIsCalibrated] = useState(false);

  // 운동 에너지 계산을 위한 상태 (새로운 역학 모델 수식: E_simple = (1/2) × m_eff × (ω × L_tot)²)
  const [mEff, setMEff] = useState<string>(""); // 유효 질량 m_eff (kg) = m_s + a × m_c
  const [lTot, setLTot] = useState<string>(""); // 전체 길이 L_tot (m) = L_m + L_c + L_s
  const [angularVelocity, setAngularVelocity] = useState<number>(0); // 각속도 (rad/s)
  const [kineticEnergy, setKineticEnergy] = useState<number>(0); // 운동 에너지 (J)

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
    Accelerometer.setUpdateInterval(100); // 100ms마다 업데이트
    Gyroscope.setUpdateInterval(100); // 100ms마다 업데이트

    // 저장된 세션 불러오기
    loadSavedSessions();

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
      if (gyroSubscriptionRef.current) {
        gyroSubscriptionRef.current.remove();
      }
    };
  }, []); // 빈 배열로 변경하여 마운트 시 한 번만 실행

  const loadSavedSessions = async () => {
    try {
      const sessions = await AsyncStorage.getItem("savedSessions");
      if (sessions) {
        setSavedSessions(JSON.parse(sessions));
      }

      // 저장된 중력 오프셋 불러오기
      const savedOffset = await AsyncStorage.getItem("gravityOffset");
      if (savedOffset) {
        setGravityOffset(JSON.parse(savedOffset));
        setIsCalibrated(true);
      }
    } catch (error) {
      console.error("저장된 세션 불러오기 실패:", error);
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
        Alert.alert("오류", "가속도계 센서를 사용할 수 없습니다.");
        return;
      }

      // 자이로스코프 센서 사용 가능 여부 확인
      const isGyroscopeAvailable = await Gyroscope.isAvailableAsync();
      if (!isGyroscopeAvailable) {
        Alert.alert("오류", "자이로스코프 센서를 사용할 수 없습니다.");
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
      });
      setGyroSubscription(newGyroSubscription);
      gyroSubscriptionRef.current = newGyroSubscription;
    } catch (error) {
      console.error("센서 구독 오류:", error);
      Alert.alert("오류", "센서를 시작하는 중 오류가 발생했습니다.");
    }
  }, []); // 빈 배열 - 함수는 한 번만 생성

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
        "기록 완료",
        `총 ${recordedData.length}개의 데이터가 기록되었습니다.`
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
      Alert.alert("알림", "먼저 측정을 시작해주세요.");
      return;
    }

    Alert.alert(
      "중력 캘리브레이션",
      "핸드폰을 평평한 곳에 놓고 움직이지 마세요. 3초 후 자동으로 캘리브레이션이 시작됩니다.",
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "시작",
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

              Alert.alert("캘리브레이션 완료", "중력 보정이 완료되었습니다.");
            }, 3000);
          },
        },
      ]
    );
  };

  const saveCurrentSession = async () => {
    if (recordedData.length === 0) {
      Alert.alert("알림", "저장할 데이터가 없습니다.");
      return;
    }

    try {
      const sessionName = `세션_${new Date().toLocaleString()}`;
      const sessionData = {
        name: sessionName,
        data: recordedData,
        maxAcceleration,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(
        `session_${Date.now()}`,
        JSON.stringify(sessionData)
      );

      const updatedSessions = [...savedSessions, sessionName];
      setSavedSessions(updatedSessions);
      await AsyncStorage.setItem(
        "savedSessions",
        JSON.stringify(updatedSessions)
      );

      Alert.alert("저장 완료", `${sessionName}이 저장되었습니다.`);
    } catch (error) {
      console.error("세션 저장 실패:", error);
      Alert.alert("오류", "데이터 저장에 실패했습니다.");
    }
  };

  const loadSession = async (sessionName: string) => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const sessionKey = keys.find((key) => key.startsWith("session_"));

      if (sessionKey) {
        const sessionData = await AsyncStorage.getItem(sessionKey);
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          if (parsed.name === sessionName) {
            setRecordedData(parsed.data);
            setMaxAcceleration(parsed.maxAcceleration);
            Alert.alert("불러오기 완료", `${sessionName}을 불러왔습니다.`);
          }
        }
      }
    } catch (error) {
      console.error("세션 불러오기 실패:", error);
      Alert.alert("오류", "데이터 불러오기에 실패했습니다.");
    }
  };

  // 중력 보정된 합성 가속도 계산
  const correctedX = data.x - gravityOffset.x;
  const correctedY = data.y - gravityOffset.y;
  const correctedZ = data.z - gravityOffset.z;
  const magnitude = Math.sqrt(
    correctedX ** 2 + correctedY ** 2 + correctedZ ** 2
  );

  // 운동 에너지 계산 (단순 수식): E_simple = (1/2) × m_eff × (ω × L_tot)²
  useEffect(() => {
    const m = parseFloat(mEff) || 0; // 유효 질량 m_eff
    const L = parseFloat(lTot) || 0; // 전체 길이 L_tot
    if (m > 0 && L > 0 && angularVelocity > 0) {
      const v_tip = angularVelocity * L; // 보조체 끝속도 v_tip = ω × L_tot
      const energy = (1 / 2) * m * v_tip * v_tip;
      setKineticEnergy(energy);
    } else {
      setKineticEnergy(0);
    }
  }, [mEff, lTot, angularVelocity]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <ThemedView style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>← 처음으로</ThemedText>
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            Motion Meter
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            운동 에너지 계산기 (E = ½ × m_eff × (ω × L_tot)²)
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.controlPanel}>
          <TouchableOpacity
            style={[
              styles.button,
              subscription ? styles.stopButton : styles.startButton,
            ]}
            onPress={subscription ? _unsubscribe : _subscribe}
          >
            <ThemedText style={styles.buttonText}>
              {subscription ? "측정 중지" : "측정 시작"}
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
              {isRecording ? "기록 중지" : "기록 시작"}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={resetData}
          >
            <ThemedText style={styles.buttonText}>데이터 초기화</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={saveCurrentSession}
            disabled={recordedData.length === 0}
          >
            <ThemedText style={styles.buttonText}>현재 세션 저장</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              isCalibrated ? styles.calibratedButton : styles.calibrateButton,
            ]}
            onPress={calibrateGravity}
          >
            <ThemedText style={styles.buttonText}>
              {isCalibrated ? "중력 보정됨" : "중력 캘리브레이션"}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* 운동 에너지 계산 입력 섹션 */}
        <ThemedView style={styles.energyContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            운동 에너지 계산 설정
          </ThemedText>

          <View style={styles.inputRow}>
            <ThemedText style={styles.inputLabel}>
              유효 질량 (m_eff, kg):
            </ThemedText>
            <TextInput
              style={styles.input}
              value={mEff}
              onChangeText={setMEff}
              placeholder="예: 0.5"
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputRow}>
            <ThemedText style={styles.inputLabel}>
              전체 길이 (L_tot, m):
            </ThemedText>
            <TextInput
              style={styles.input}
              value={lTot}
              onChangeText={setLTot}
              placeholder="예: 0.3"
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.energyResultContainer}>
            <ThemedText type="subtitle" style={styles.energyTitle}>
              계산 결과
            </ThemedText>

            <View style={styles.dataRow}>
              <ThemedText style={styles.dataLabel}>각속도 (ω):</ThemedText>
              <ThemedText style={[styles.dataValue, styles.omegaValue]}>
                {angularVelocity.toFixed(4)} rad/s
              </ThemedText>
            </View>

            <View style={styles.dataRow}>
              <ThemedText style={styles.dataLabel}>운동 에너지 (E):</ThemedText>
              <ThemedText style={[styles.dataValue, styles.energyValue]}>
                {kineticEnergy.toFixed(4)} J
              </ThemedText>
            </View>

            {kineticEnergy > 0 && (
              <View style={styles.formulaContainer}>
                <ThemedText style={styles.formulaText}>
                  E = ½ × {parseFloat(mEff) || 0} × ({angularVelocity.toFixed(4)} × {parseFloat(lTot) || 0})²
                </ThemedText>
                <ThemedText style={styles.formulaText}>
                  v_tip = {(angularVelocity * (parseFloat(lTot) || 0)).toFixed(4)} m/s
                </ThemedText>
                <ThemedText style={styles.formulaText}>
                  E = {kineticEnergy.toFixed(4)} J
                </ThemedText>
              </View>
            )}
          </View>
        </ThemedView>

        {/* 자이로스코프 데이터 섹션 */}
        <ThemedView style={styles.dataContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            자이로스코프 데이터 (각속도)
          </ThemedText>

          <View style={styles.dataRow}>
            <ThemedText style={styles.dataLabel}>X축 각속도:</ThemedText>
            <ThemedText style={styles.dataValue}>
              {gyroData.x.toFixed(4)} rad/s
            </ThemedText>
          </View>

          <View style={styles.dataRow}>
            <ThemedText style={styles.dataLabel}>Y축 각속도:</ThemedText>
            <ThemedText style={styles.dataValue}>
              {gyroData.y.toFixed(4)} rad/s
            </ThemedText>
          </View>

          <View style={styles.dataRow}>
            <ThemedText style={styles.dataLabel}>Z축 각속도:</ThemedText>
            <ThemedText style={styles.dataValue}>
              {gyroData.z.toFixed(4)} rad/s
            </ThemedText>
          </View>

          <View style={styles.dataRow}>
            <ThemedText style={styles.dataLabel}>합성 각속도 (|ω|):</ThemedText>
            <ThemedText style={[styles.dataValue, styles.omegaValue]}>
              {angularVelocity.toFixed(4)} rad/s
            </ThemedText>
          </View>
        </ThemedView>

        <ThemedView style={styles.dataContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            실시간 가속도 데이터
          </ThemedText>

          <View style={styles.dataRow}>
            <ThemedText style={styles.dataLabel}>X축 (원본):</ThemedText>
            <ThemedText style={styles.dataValue}>
              {data.x.toFixed(3)} m/s²
            </ThemedText>
          </View>

          <View style={styles.dataRow}>
            <ThemedText style={styles.dataLabel}>Y축 (원본):</ThemedText>
            <ThemedText style={styles.dataValue}>
              {data.y.toFixed(3)} m/s²
            </ThemedText>
          </View>

          <View style={styles.dataRow}>
            <ThemedText style={styles.dataLabel}>Z축 (원본):</ThemedText>
            <ThemedText style={styles.dataValue}>
              {data.z.toFixed(3)} m/s²
            </ThemedText>
          </View>

          {isCalibrated && (
            <>
              <View style={styles.dataRow}>
                <ThemedText style={styles.dataLabel}>X축 (보정):</ThemedText>
                <ThemedText style={[styles.dataValue, styles.correctedValue]}>
                  {(data.x - gravityOffset.x).toFixed(3)} m/s²
                </ThemedText>
              </View>

              <View style={styles.dataRow}>
                <ThemedText style={styles.dataLabel}>Y축 (보정):</ThemedText>
                <ThemedText style={[styles.dataValue, styles.correctedValue]}>
                  {(data.y - gravityOffset.y).toFixed(3)} m/s²
                </ThemedText>
              </View>

              <View style={styles.dataRow}>
                <ThemedText style={styles.dataLabel}>Z축 (보정):</ThemedText>
                <ThemedText style={[styles.dataValue, styles.correctedValue]}>
                  {(data.z - gravityOffset.z).toFixed(3)} m/s²
                </ThemedText>
              </View>
            </>
          )}

          <View style={styles.dataRow}>
            <ThemedText style={styles.dataLabel}>합성 가속도:</ThemedText>
            <ThemedText style={[styles.dataValue, styles.magnitudeValue]}>
              {magnitude.toFixed(3)} m/s²
            </ThemedText>
          </View>
        </ThemedView>

        <ThemedView style={styles.statsContainer}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            통계
          </ThemedText>

          <View style={styles.dataRow}>
            <ThemedText style={styles.dataLabel}>최대 가속도:</ThemedText>
            <ThemedText style={[styles.dataValue, styles.maxValue]}>
              {maxAcceleration.toFixed(3)} m/s²
            </ThemedText>
          </View>

          <View style={styles.dataRow}>
            <ThemedText style={styles.dataLabel}>기록된 데이터:</ThemedText>
            <ThemedText style={styles.dataValue}>
              {recordedData.length}개
            </ThemedText>
          </View>

          {isRecording && (
            <View style={styles.dataRow}>
              <ThemedText style={[styles.dataLabel, styles.recordingText]}>
                ● 기록 중...
              </ThemedText>
            </View>
          )}
        </ThemedView>

        {graphData.length > 0 && (
          <ThemedView style={styles.graphContainer}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              실시간 가속도 그래프
            </ThemedText>
            <LineChart
              data={{
                labels: graphData.map((_, index) =>
                  index % 10 === 0 ? `${index}` : ""
                ),
                datasets: [
                  {
                    data: graphData,
                    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                    strokeWidth: 2,
                  },
                ],
              }}
              width={SCREEN_WIDTH - wp(15)}
              height={220}
              yAxisSuffix=" m/s²"
              chartConfig={{
                backgroundColor: "#ffffff",
                backgroundGradientFrom: "#ffffff",
                backgroundGradientTo: "#ffffff",
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "4",
                  strokeWidth: "2",
                  stroke: "#4CAF50",
                },
              }}
              bezier
              style={styles.chart}
            />
          </ThemedView>
        )}

        {savedSessions.length > 0 && (
          <ThemedView style={styles.sessionsContainer}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              저장된 세션
            </ThemedText>
            {savedSessions.map((sessionName, index) => (
              <TouchableOpacity
                key={index}
                style={styles.sessionItem}
                onPress={() => loadSession(sessionName)}
              >
                <ThemedText style={styles.sessionText}>
                  {sessionName}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
        )}

        {recordedData.length > 0 && (
          <ThemedView style={styles.historyContainer}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              최근 기록 (최대 10개)
            </ThemedText>
            {recordedData.slice(-10).map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <ThemedText style={styles.historyText}>
                  {new Date(item.timestamp).toLocaleTimeString()}: X:
                  {item.x.toFixed(2)} Y:{item.y.toFixed(2)} Z:
                  {item.z.toFixed(2)}
                </ThemedText>
              </View>
            ))}
          </ThemedView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingBottom: hp(2),
  },
  header: {
    padding: moderateScale(16),
    alignItems: "center",
    backgroundColor: "#4A90E2",
    marginBottom: moderateScale(12),
  },
  backButton: {
    position: "absolute",
    left: moderateScale(12),
    top: moderateScale(12),
    padding: moderateScale(6),
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: moderateScale(8),
    zIndex: 1,
  },
  backButtonText: {
    color: "white",
    fontSize: fontScale(12),
    fontWeight: "bold",
  },
  title: {
    color: "white",
    fontSize: fontScale(24),
    fontWeight: "bold",
    marginBottom: moderateScale(4),
    marginTop: moderateScale(12),
  },
  subtitle: {
    color: "white",
    fontSize: fontScale(13),
    opacity: 0.9,
  },
  controlPanel: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    padding: moderateScale(10),
    marginBottom: moderateScale(12),
    marginHorizontal: wp(2),
    gap: moderateScale(4),
  },
  button: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(8),
    minWidth: wp(28),
    marginVertical: moderateScale(2),
    alignItems: "center",
  },
  startButton: {
    backgroundColor: "#4CAF50",
  },
  stopButton: {
    backgroundColor: "#F44336",
  },
  recordButton: {
    backgroundColor: "#FF9800",
  },
  recordingButton: {
    backgroundColor: "#E91E63",
  },
  resetButton: {
    backgroundColor: "#9E9E9E",
  },
  saveButton: {
    backgroundColor: "#2196F3",
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
    fontSize: fontScale(11),
  },
  dataContainer: {
    marginHorizontal: wp(4),
    marginVertical: moderateScale(8),
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsContainer: {
    marginHorizontal: wp(4),
    marginVertical: moderateScale(8),
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  graphContainer: {
    marginHorizontal: wp(4),
    marginVertical: moderateScale(8),
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionsContainer: {
    marginHorizontal: wp(4),
    marginVertical: moderateScale(8),
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyContainer: {
    marginHorizontal: wp(4),
    marginVertical: moderateScale(8),
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: fontScale(15),
    fontWeight: "bold",
    marginBottom: moderateScale(12),
    color: "#333",
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: moderateScale(6),
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dataLabel: {
    fontSize: fontScale(13),
    color: "#666",
    fontWeight: "500",
    flex: 1,
  },
  dataValue: {
    fontSize: fontScale(13),
    fontWeight: "bold",
    color: "#333",
  },
  magnitudeValue: {
    color: "#4CAF50",
  },
  maxValue: {
    color: "#F44336",
  },
  correctedValue: {
    color: "#4CAF50",
  },
  recordingText: {
    color: "#E91E63",
    fontWeight: "bold",
  },
  historyItem: {
    paddingVertical: moderateScale(4),
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  historyText: {
    fontSize: fontScale(11),
    color: "#666",
    fontFamily: "monospace",
  },
  sessionItem: {
    padding: moderateScale(10),
    marginVertical: moderateScale(3),
    backgroundColor: "#f8f9fa",
    borderRadius: moderateScale(8),
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  sessionText: {
    fontSize: fontScale(14),
    color: "#333",
    fontWeight: "500",
  },
  chart: {
    marginVertical: moderateScale(6),
    borderRadius: moderateScale(14),
  },
  energyContainer: {
    marginHorizontal: wp(4),
    marginVertical: moderateScale(8),
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputRow: {
    flexDirection: "column",
    paddingVertical: moderateScale(8),
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  inputLabel: {
    fontSize: fontScale(13),
    color: "#666",
    fontWeight: "500",
    marginBottom: moderateScale(6),
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    fontSize: fontScale(14),
    color: "#333",
    backgroundColor: "#f9f9f9",
  },
  energyResultContainer: {
    marginTop: moderateScale(12),
    paddingTop: moderateScale(12),
    borderTopWidth: 2,
    borderTopColor: "#4CAF50",
  },
  energyTitle: {
    fontSize: fontScale(15),
    fontWeight: "bold",
    marginBottom: moderateScale(12),
    color: "#4CAF50",
  },
  omegaValue: {
    color: "#2196F3",
  },
  energyValue: {
    color: "#4CAF50",
    fontSize: fontScale(15),
  },
  formulaContainer: {
    marginTop: moderateScale(12),
    padding: moderateScale(10),
    backgroundColor: "#f0f7ff",
    borderRadius: moderateScale(8),
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  formulaText: {
    fontSize: fontScale(11),
    color: "#333",
    fontFamily: "monospace",
    marginVertical: moderateScale(2),
  },
});

