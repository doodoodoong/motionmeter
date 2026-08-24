import { LanguageToggle } from "@/components/language-toggle";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BongIcon, PyeongonIcon } from "@/components/weapon-icons";
import { SIMPLE_COLORS } from "@/constants/theme";
import { useI18n } from "@/i18n";
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
  const { t } = useI18n();
  const pyeongonLabel = t('weapon.pyeongon');
  const staffLabel = t('weapon.staff');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 헤더 */}
        <ThemedView style={styles.header}>
          <View style={styles.languageToggleRow}>
            <LanguageToggle />
          </View>
          <View style={styles.heroRow}>
            <PyeongonIcon size={92} />
            <BongIcon size={92} />
          </View>
          <ThemedText type="title" style={styles.title}>
            {t('home.title')}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {t('home.subtitle1')}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {t('home.subtitle2')}
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
              <ThemedText style={styles.buttonTitle}>{t('home.measureWeapon', { weapon: pyeongonLabel })}</ThemedText>
            </View>
            <ThemedText style={styles.buttonDescription}>{t('home.measureDescription', { weapon: pyeongonLabel })}</ThemedText>
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
              <ThemedText style={styles.buttonTitle}>{t('home.measureWeapon', { weapon: staffLabel })}</ThemedText>
            </View>
            <ThemedText style={styles.buttonDescription}>{t('home.measureDescription', { weapon: staffLabel })}</ThemedText>
          </TouchableOpacity>
        </View>

        {/* 하단 정보 — 카드 대신 절제된 캡션 */}
        <View style={styles.footer}>
          <ThemedText style={styles.footerLabel}>{t('home.footerLabel')}</ThemedText>
          <ThemedText style={styles.footerText}>
            {t('home.footerText')}
          </ThemedText>
        </View>
      </View>
    </SafeAreaView>
  );
}
