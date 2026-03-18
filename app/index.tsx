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
            전통무기 에너지 측정기
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            스마트폰으로 전통무기 에너지를 측정해보세요!
          </ThemedText>
        </ThemedView>

        {/* 선택 버튼들 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.selectionButton, styles.elementaryButton]}
            onPress={() => router.push("/measure" as any)}
          >
            <ThemedText style={styles.buttonTitle}>측정 시작하기</ThemedText>
            <ThemedText style={styles.buttonDescription}>
              스마트폰을 휘둘러 편곤, 봉, 철퇴의 에너지를 한 번에 잽니다!
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
