import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BongIcon, PyeongonIcon } from "@/components/weapon-icons";
import { SIMPLE_COLORS } from "@/constants/theme";
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
          <View style={styles.heroRow}>
            <PyeongonIcon size={92} />
            <BongIcon size={92} />
          </View>
          <ThemedText type="title" style={styles.title}>
            상대 타격지수 측정기
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            스마트폰을 휘둘러 상대 타격지수를 측정해보세요
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            같은 무기를 고른 참가자들과 기록을 겨뤄보세요
          </ThemedText>
        </ThemedView>

        {/* 선택 버튼들 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.selectionButton, { backgroundColor: SIMPLE_COLORS.weapon.flail, marginBottom: 14 }]}
            onPress={() => router.push({ pathname: "/measure", params: { weapon: 'pyeongon' } })}
          >
            <View style={styles.buttonTitleRow}>
              <View style={styles.buttonIconWrapper}>
                <PyeongonIcon size={28} />
              </View>
              <ThemedText style={styles.buttonTitle}>편곤 측정하기</ThemedText>
            </View>
            <ThemedText style={styles.buttonDescription}>스마트폰을 휘둘러 편곤의 상대 타격지수를 측정합니다</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.selectionButton, { backgroundColor: SIMPLE_COLORS.weapon.staff }]}
            onPress={() => router.push({ pathname: "/measure", params: { weapon: 'staff' } })}
          >
            <View style={styles.buttonTitleRow}>
              <View style={styles.buttonIconWrapper}>
                <BongIcon size={28} />
              </View>
              <ThemedText style={styles.buttonTitle}>봉 측정하기</ThemedText>
            </View>
            <ThemedText style={styles.buttonDescription}>스마트폰을 휘둘러 봉의 상대 타격지수를 측정합니다</ThemedText>
          </TouchableOpacity>
        </View>

        {/* 하단 정보 — 카드 대신 절제된 캡션 */}
        <View style={styles.footer}>
          <ThemedText style={styles.footerLabel}>측정 원리</ThemedText>
          <ThemedText style={styles.footerText}>
            자이로스코프로 손잡이의 각속도를 측정해 봉 기준 상대 타격지수를 계산합니다
          </ThemedText>
        </View>
      </View>
    </SafeAreaView>
  );
}
