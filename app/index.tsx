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
            style={[styles.selectionButton, styles.elementaryButton, { backgroundColor: '#5AC8FA', marginBottom: 15 }]}
            onPress={() => router.push({ pathname: "/measure", params: { weapon: 'flail' } })}
          >
            <ThemedText style={styles.buttonTitle}>편곤 측정하기</ThemedText>
            <ThemedText style={styles.buttonDescription}>스마트폰을 휘둘러 편곤의 에너지를 측정합니다!</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.selectionButton, styles.elementaryButton, { backgroundColor: '#4CD964', marginBottom: 15 }]}
            onPress={() => router.push({ pathname: "/measure", params: { weapon: 'staff' } })}
          >
            <ThemedText style={styles.buttonTitle}>봉 측정하기</ThemedText>
            <ThemedText style={styles.buttonDescription}>스마트폰을 휘둘러 봉의 에너지를 측정합니다!</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.selectionButton, styles.elementaryButton, { backgroundColor: '#FF9500' }]}
            onPress={() => router.push({ pathname: "/measure", params: { weapon: 'mace' } })}
          >
            <ThemedText style={styles.buttonTitle}>철퇴 측정하기</ThemedText>
            <ThemedText style={styles.buttonDescription}>스마트폰을 휘둘러 철퇴의 에너지를 측정합니다!</ThemedText>
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
