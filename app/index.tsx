import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Accelerometer, Gyroscope } from "expo-sensors";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
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

const screenWidth = Dimensions.get("window").width;

export default function MotionMeterScreen() {
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

  // 운동 에너지 계산을 위한 상태
  const [mHead, setMHead] = useState<string>(""); // 타격부 질량 (kg)
  const [rHead, setRHead] = useState<string>(""); // 회전반경 (m)
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

  // 운동 에너지 계산 (m_head와 r_head가 입력되었을 때)
  useEffect(() => {
    const m = parseFloat(mHead) || 0;
    const r = parseFloat(rHead) || 0;
    if (m > 0 && r > 0 && angularVelocity > 0) {
      const energy = (1 / 2) * m * r * r * angularVelocity * angularVelocity;
      setKineticEnergy(energy);
    } else {
      setKineticEnergy(0);
    }
  }, [mHead, rHead, angularVelocity]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Motion Meter
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            운동 에너지 계산기 (E = ½ × m × r² × ω²)
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
              타격부 질량 (m_head, kg):
            </ThemedText>
            <TextInput
              style={styles.input}
              value={mHead}
              onChangeText={setMHead}
              placeholder="예: 0.5"
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputRow}>
            <ThemedText style={styles.inputLabel}>
              회전반경 (r_head, m):
            </ThemedText>
            <TextInput
              style={styles.input}
              value={rHead}
              onChangeText={setRHead}
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
                  E = ½ × {parseFloat(mHead) || 0} × ({parseFloat(rHead) || 0})²
                  × ({angularVelocity.toFixed(4)})²
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
              width={Math.min(screenWidth - 60, 350)}
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
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#4A90E2",
    marginBottom: 15,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    color: "white",
    fontSize: 16,
    opacity: 0.9,
  },
  controlPanel: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    padding: 15,
    marginBottom: 20,
    marginHorizontal: 10,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 85,
    marginVertical: 3,
    marginHorizontal: 2,
    alignItems: "center",
    flex: 1,
    maxWidth: 120,
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
    fontSize: 14,
  },
  dataContainer: {
    marginHorizontal: 15,
    marginVertical: 10,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsContainer: {
    marginHorizontal: 15,
    marginVertical: 10,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  graphContainer: {
    marginHorizontal: 15,
    marginVertical: 10,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionsContainer: {
    marginHorizontal: 15,
    marginVertical: 10,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyContainer: {
    marginHorizontal: 15,
    marginVertical: 10,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dataLabel: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  dataValue: {
    fontSize: 16,
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
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  historyText: {
    fontSize: 14,
    color: "#666",
    fontFamily: "monospace",
  },
  sessionItem: {
    padding: 12,
    marginVertical: 4,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  sessionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  energyContainer: {
    marginHorizontal: 15,
    marginVertical: 10,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  inputLabel: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
    flex: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#f9f9f9",
    marginLeft: 10,
  },
  energyResultContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: "#4CAF50",
  },
  energyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#4CAF50",
  },
  omegaValue: {
    color: "#2196F3",
  },
  energyValue: {
    color: "#4CAF50",
    fontSize: 18,
  },
  formulaContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: "#f0f7ff",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  formulaText: {
    fontSize: 14,
    color: "#333",
    fontFamily: "monospace",
    marginVertical: 2,
  },
});

