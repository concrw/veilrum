import { useMemo } from 'react';
import { useLanguageContext } from '../contexts/LanguageContext';
import { locales } from '../constants/locales';
import type { TranslationFunction } from '../constants/types';

export const useTranslation = () => {
  const { language, isLoading } = useLanguageContext();

  const translations = useMemo(() => {
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
        return value.replace(/\{([^}]+)\}/g, (match, paramKey) => {
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
export const useButtonTranslations = () => {
  const { translations } = useTranslation();
  return translations.buttons;
};

export const useLabelTranslations = () => {
  const { translations } = useTranslation();
  return translations.labels;
};

export const usePlaceholderTranslations = () => {
  const { translations } = useTranslation();
  return translations.placeholders;
};

export const useMessageTranslations = () => {
  const { translations } = useTranslation();
  return translations.messages;
};

export const useNavigationTranslations = () => {
  const { translations } = useTranslation();
  return translations.navigation;
};

export const useKeywordTranslations = () => {
  const { translations } = useTranslation();
  return translations.keywords;
};

export const usePersonaTranslations = () => {
  const { translations } = useTranslation();
  return translations.persona;
};

export const useAuthTranslations = () => {
  const { translations } = useTranslation();
  return translations.auth;
};

export const useErrorTranslations = () => {
  const { translations } = useTranslation();
  return translations.errors;
};