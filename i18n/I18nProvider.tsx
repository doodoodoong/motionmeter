import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { en } from '@/locales/en';
import { ko } from '@/locales/ko';
import type { Language, MessageKey } from '@/i18n/types';

const LANGUAGE_STORAGE_KEY = '@motionmeter/language';
const Localization = require('expo-localization') as {
  getLocales: () => { languageCode?: string | null }[];
};

type I18nContextValue = {
  language: Language;
  hydrated: boolean;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);
const catalogs = { ko, en } as const;

function deviceLanguage(): Language {
  try {
    const languageCode = Localization.getLocales()[0]?.languageCode;
    if (languageCode === 'ko') return 'ko';
    return typeof languageCode === 'string' && languageCode.length > 0 ? 'en' : 'ko';
  } catch {
    return 'ko';
  }
}

export function I18nProvider({ children }: React.PropsWithChildren) {
  const [language, setLanguageState] = useState<Language>('ko');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        const nextLanguage = storedLanguage === 'ko' || storedLanguage === 'en'
          ? storedLanguage
          : deviceLanguage();
        if (active) setLanguageState(nextLanguage);
      } catch {
        if (active) setLanguageState(deviceLanguage());
      } finally {
        if (active) setHydrated(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // 저장 실패해도 이번 세션의 언어 전환은 유지한다. 다음 실행 때 폴백될 뿐이다.
    }
  }, []);

  const t = useCallback((key: MessageKey, params?: Record<string, string | number>) => {
    const message = (catalogs[language] as Record<string, string>)[key];
    if (typeof message !== 'string') return String(key);
    if (!params) return message;

    return message.replace(/\{([^{}]+)\}/g, (placeholder, name: string) => (
      Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : placeholder
    ));
  }, [language]);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    hydrated,
    setLanguage,
    t,
  }), [hydrated, language, setLanguage, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within an I18nProvider');
  return context;
}
