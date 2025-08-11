import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SupportedLanguage = 'ja' | 'en' | 'de';
export type SupportedCountry = 'JP' | 'UK' | 'DE';

interface I18nState {
  language: SupportedLanguage;
  country: SupportedCountry;
  setLanguage: (lang: SupportedLanguage) => void;
  setCountry: (country: SupportedCountry) => void;
}

const detectLanguage = (): SupportedLanguage => {
  if (typeof navigator !== 'undefined') {
    const lang = (navigator.language || 'ja').slice(0, 2);
    if (lang === 'en' || lang === 'de') return lang;
  }
  return 'ja';
};

const detectCountry = (): SupportedCountry => {
  // 簡易推定（将来はIP/手動選択で上書き）
  const lang = detectLanguage();
  if (lang === 'de') return 'DE';
  if (lang === 'en') return 'UK';
  return 'JP';
};

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      language: detectLanguage(),
      country: detectCountry(),
      setLanguage: (language) => set({ language }),
      setCountry: (country) => set({ country }),
    }),
    { name: 'i18n-store' }
  )
);

export default useI18nStore;


