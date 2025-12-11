import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { fontScale, hp, moderateScale, wp } from "@/utils/responsive";
import { useRouter } from "expo-router";
import React from "react";
import {
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 헤더 */}
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            📱 Motion Meter
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            움직임과 에너지를 측정해보세요!
          </ThemedText>
        </ThemedView>

        {/* 선택 버튼들 */}
        <View style={styles.buttonContainer}>
          {/* 초등학생 버튼 */}
          <TouchableOpacity
            style={[styles.selectionButton, styles.elementaryButton]}
            onPress={() => router.push("/elementary")}
          >
            <ThemedText style={styles.buttonEmoji}>🎮</ThemedText>
            <ThemedText style={styles.buttonTitle}>초등학생</ThemedText>
            <ThemedText style={styles.buttonDescription}>
              쉽고 재미있게{"\n"}움직임을 측정해요!
            </ThemedText>
          </TouchableOpacity>

          {/* 중고등학생 버튼 */}
          <TouchableOpacity
            style={[styles.selectionButton, styles.secondaryButton]}
            onPress={() => router.push("/secondary")}
          >
            <ThemedText style={styles.buttonEmoji}>📐</ThemedText>
            <ThemedText style={styles.buttonTitle}>중·고등학생</ThemedText>
            <ThemedText style={styles.buttonDescription}>
              운동 에너지와{"\n"}물리 공식을 배워요!
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* 하단 정보 */}
        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            🔬 가속도계와 자이로스코프 센서로{"\n"}운동 에너지를 계산합니다
          </ThemedText>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#667eea",
  },
  container: {
    flex: 1,
    backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    justifyContent: "space-between",
    paddingVertical: hp(2),
  },
  header: {
    alignItems: "center",
    paddingHorizontal: wp(5),
    paddingTop: hp(4),
    paddingBottom: hp(2),
    backgroundColor: "transparent",
  },
  title: {
    color: "white",
    fontSize: fontScale(32),
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: moderateScale(8),
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: fontScale(16),
    textAlign: "center",
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: wp(5),
    gap: moderateScale(16),
  },
  selectionButton: {
    borderRadius: moderateScale(20),
    padding: moderateScale(24),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: moderateScale(6) },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(10),
    elevation: 8,
  },
  elementaryButton: {
    backgroundColor: "#FF9800",
  },
  secondaryButton: {
    backgroundColor: "#4A90E2",
  },
  buttonEmoji: {
    fontSize: fontScale(48),
    marginBottom: moderateScale(12),
  },
  buttonTitle: {
    color: "white",
    fontSize: fontScale(24),
    fontWeight: "bold",
    marginBottom: moderateScale(8),
    textAlign: "center",
  },
  buttonDescription: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: fontScale(14),
    textAlign: "center",
    lineHeight: fontScale(20),
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: wp(8),
    paddingBottom: hp(2),
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: fontScale(12),
    textAlign: "center",
    lineHeight: fontScale(18),
  },
});

