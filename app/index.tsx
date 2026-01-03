import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { homeStyles as styles } from "@/styles/home.styles";
import { useRouter } from "expo-router";
import React from "react";
import {
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
            편곤 에너지 측정기
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            움직임과 에너지를 측정해보세요!
          </ThemedText>
        </ThemedView>

        {/* 선택 버튼들 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.selectionButton, styles.elementaryButton]}
            onPress={() => router.push("/elementary")}
          >
            <ThemedText style={styles.buttonTitle}>초등,중학생</ThemedText>
            <ThemedText style={styles.buttonDescription}>
              쉽고 재미있게 움직임을 측정해요!
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.selectionButton, styles.secondaryButton]}
            onPress={() => router.push("/secondary")}
          >
            <ThemedText style={styles.buttonTitle}>고등학생,일반</ThemedText>
            <ThemedText style={styles.buttonDescription}>
              운동 에너지와 물리 공식을 배워요!
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* 하단 정보 */}
        <View style={styles.footer}>
          <View style={styles.footerCard}>
            <ThemedText style={styles.footerText}>
              🔬 가속도계와 자이로스코프 센서로 운동 에너지를 계산합니다
            </ThemedText>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
