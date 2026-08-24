import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useI18n, type Language } from '@/i18n';
import { homeStyles as styles } from '@/styles/home.styles';

const OPTIONS: readonly Language[] = ['ko', 'en'];

export function LanguageToggle() {
  const { language, setLanguage, t } = useI18n();

  const selectLanguage = useCallback((nextLanguage: Language) => {
    void Haptics.selectionAsync();
    if (nextLanguage === language) return;
    void setLanguage(nextLanguage);
  }, [language, setLanguage]);

  return (
    <View style={styles.languageToggle}>
      {OPTIONS.map((option) => {
        const selected = language === option;
        return (
          <Pressable
            key={option}
            accessibilityLabel={t(option === 'ko' ? 'a11y.selectKorean' : 'a11y.selectEnglish')}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            hitSlop={4}
            onPress={() => selectLanguage(option)}
            style={[styles.languageOption, selected && styles.languageOptionSelected]}
          >
            <Text style={[styles.languageOptionText, selected && styles.languageOptionTextSelected]}>
              {option.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
