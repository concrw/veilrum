import { useMemo } from 'react';
import { useLanguageContext } from '@/context/LanguageContext';
import { locales } from '@/i18n';
import type { TranslationFunction, LocaleResource } from '@/i18n/types';

export const useTranslation = () => {
  const { language, isLoading } = useLanguageContext();

  const translations: LocaleResource = useMemo(() => {
    return locales[language];
  }, [language]);

  const t: TranslationFunction = useMemo(() => {
    return (key: string, params?: Record<string, string | number>) => {
      // Navigate through nested object using dot notation
      const keys = key.split('.');
      let value: unknown = translations;

      for (const k of keys) {
        if (value && typeof value === 'object' && k in (value as Record<string, unknown>)) {
          value = (value as Record<string, unknown>)[k];
        } else {
          console.warn(`Translation key not found: ${key}`);
          return key; // Return the key if translation is not found
        }
      }

      if (typeof value !== 'string') {
        console.warn(`Translation value is not a string: ${key}`);
        return key;
      }

      // Replace parameters in the string
      if (params) {
        return value.replace(/\{([^}]+)\}/g, (match: string, paramKey: string) => {
          return params[paramKey]?.toString() || match;
        });
      }

      return value;
    };
  }, [translations]);

  return {
    t,
    language,
    isLoading,
    translations,
  };
};

// Convenience hooks for specific sections
export const useCommonTranslations = () => {
  const { translations } = useTranslation();
  return translations.common;
};

export const useNavTranslations = () => {
  const { translations } = useTranslation();
  return translations.nav;
};

export const useAuthTranslations = () => {
  const { translations } = useTranslation();
  return translations.auth;
};

export const useOnboardingTranslations = () => {
  const { translations } = useTranslation();
  return translations.onboarding;
};

export const useVentTranslations = () => {
  const { translations } = useTranslation();
  return translations.vent;
};

export const useDigTranslations = () => {
  const { translations } = useTranslation();
  return translations.dig;
};

export const useSetTranslations = () => {
  const { translations } = useTranslation();
  return translations.set;
};

export const useGetTranslations = () => {
  const { translations } = useTranslation();
  return translations.get;
};

export const useMeTranslations = () => {
  const { translations } = useTranslation();
  return translations.me;
};

export const useCrisisTranslations = () => {
  const { translations } = useTranslation();
  return translations.crisis;
};

export const useErrorTranslations = () => {
  const { translations } = useTranslation();
  return translations.errors;
};
