import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CYBER_COLORS, NEON_GLOW, TEXT_GLOW } from "@/constants/theme";
import { fontScale, hp, wp } from "@/utils/responsive";
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
            <ThemedText style={styles.buttonTitle}>초등학생</ThemedText>
            <ThemedText style={styles.buttonDescription}>
              쉽고 재미있게 움직임을 측정해요!
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.selectionButton, styles.secondaryButton]}
            onPress={() => router.push("/secondary")}
          >
            <ThemedText style={styles.buttonTitle}>중·고등학생</ThemedText>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CYBER_COLORS.background.primary,
  },
  container: {
    flex: 1,
    backgroundColor: CYBER_COLORS.background.primary,
    justifyContent: 'space-between',
    paddingVertical: hp(1.5),
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(1),
    backgroundColor: 'transparent',
  },
  title: {
    color: CYBER_COLORS.text.primary,
    fontSize: fontScale(28),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: hp(0.5),
    ...TEXT_GLOW.strong,
  },
  subtitle: {
    color: CYBER_COLORS.text.secondary,
    fontSize: fontScale(14),
    textAlign: 'center',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: wp(5),
    gap: hp(2),
  },
  selectionButton: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: hp(2.5),
    paddingHorizontal: wp(5),
    alignItems: 'center',
  },
  elementaryButton: {
    backgroundColor: CYBER_COLORS.background.card,
    borderColor: CYBER_COLORS.neon.cyan,
    ...NEON_GLOW.cyan,
  },
  secondaryButton: {
    backgroundColor: CYBER_COLORS.background.card,
    borderColor: CYBER_COLORS.neon.magenta,
    shadowColor: '#FF00FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  buttonTitle: {
    color: CYBER_COLORS.text.primary,
    fontSize: fontScale(22),
    fontWeight: 'bold',
    marginBottom: hp(0.5),
    textAlign: 'center',
    ...TEXT_GLOW.cyan,
  },
  buttonDescription: {
    color: CYBER_COLORS.text.muted,
    fontSize: fontScale(13),
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: wp(5),
    paddingBottom: hp(1),
  },
  footerCard: {
    backgroundColor: CYBER_COLORS.background.card,
    borderWidth: 1,
    borderColor: CYBER_COLORS.neon.cyanDim,
    borderRadius: 10,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    ...NEON_GLOW.subtle,
  },
  footerText: {
    color: CYBER_COLORS.text.secondary,
    fontSize: fontScale(11),
    textAlign: 'center',
  },
});
