// 🌍 国際化フック - 多言語対応UI

import { useMemo, useState, useEffect } from 'react';
import useI18nStore, { SupportedLanguage } from '../store/i18nStore';

// 翻訳辞書の型定義
type TranslationDictionary = Record<string, string>;

// 各言語の翻訳を動的インポート
const translations: Record<SupportedLanguage, () => Promise<TranslationDictionary>> = {
  ja: () => import('../locales/ja.json').then(m => m.default as TranslationDictionary),
  en: () => import('../locales/en.json').then(m => m.default as TranslationDictionary),
  de: () => import('../locales/de.json').then(m => m.default as TranslationDictionary),
  da: () => import('../locales/da.json').then(m => m.default as TranslationDictionary),
  fi: () => import('../locales/fi.json').then(m => m.default as TranslationDictionary),
  no: () => import('../locales/no.json').then(m => m.default as TranslationDictionary),
};

// キャッシュされた翻訳
const cachedTranslations: Partial<Record<SupportedLanguage, TranslationDictionary>> = {};

// 翻訳取得関数
const getTranslations = async (language: SupportedLanguage): Promise<TranslationDictionary> => {
  if (cachedTranslations[language]) {
    return cachedTranslations[language]!;
  }

  try {
    const translationDict = await translations[language]();
    
    cachedTranslations[language] = translationDict;
    return translationDict;
  } catch (error) {
    console.warn(`Failed to load translations for ${language}, falling back to Japanese`);
    
    // フォールバック: 日本語を使用
    if (language !== 'ja') {
      return getTranslations('ja');
    }
    
    // 最終フォールバック: 空のオブジェクト
    return {};
  }
};

export function useI18n() {
  const { language, country, setLanguage, setCountry } = useI18nStore();
  const [translations, setTranslations] = useState<TranslationDictionary>({});
  const [isLoading, setIsLoading] = useState(true);

  // 翻訳を非同期でロード
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    getTranslations(language)
      .then(translationData => {
        if (!isCancelled) {
          setTranslations(translationData);
          setIsLoading(false);
        }
      })
      .catch(async error => {
        if (isCancelled) return;
        console.error(`Failed to load translations for ${language}:`, error);
        const fallback = language !== 'ja' ? await getTranslations('ja') : {};
        setTranslations(fallback);
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [language]);

  // 翻訳関数
  const t = useMemo(() => {
    return (key: string, fallback?: string): string => {
      const translation = translations[key];
      
      if (translation) {
        return translation;
      }

      // ローディング中はフォールバックを返す
      if (isLoading && fallback) {
        return fallback;
      }

      // キーが見つからない場合のフォールバック処理
      if (fallback) {
        return fallback;
      }

      // デバッグモードでは警告を表示
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Translation missing for key: ${key} (language: ${language})`);
      }

      // 最終フォールバック: キーをそのまま返す
      return key;
    };
  }, [translations, isLoading, language]);

  // 通貨フォーマット
  const formatCurrency = useMemo(() => {
    const currencyMappings = {
      JP: { currency: 'JPY', locale: 'ja-JP' },
      UK: { currency: 'GBP', locale: 'en-GB' },
      DE: { currency: 'EUR', locale: 'de-DE' },
      DK: { currency: 'DKK', locale: 'da-DK' },
      FI: { currency: 'EUR', locale: 'fi-FI' },
      NO: { currency: 'NOK', locale: 'nb-NO' },
      AT: { currency: 'EUR', locale: 'de-AT' },
      PL: { currency: 'PLN', locale: 'pl-PL' },
      HU: { currency: 'HUF', locale: 'hu-HU' },
    };

    const { currency, locale } = currencyMappings[country] || currencyMappings.JP;

    return (amount: number): string => {
      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount);
      } catch (error) {
        // フォールバック: 基本的な数値フォーマット
        return `${currency} ${amount.toLocaleString()}`;
      }
    };
  }, [country]);

  // 日付フォーマット
  const formatDate = useMemo(() => {
    const localeMappings = {
      ja: 'ja-JP',
      en: 'en-GB',
      de: 'de-DE',
      da: 'da-DK',
      fi: 'fi-FI',
      no: 'nb-NO',
    };

    const locale = localeMappings[language] || 'ja-JP';

    return (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      try {
        return dateObj.toLocaleDateString(locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          ...options,
        });
      } catch (error) {
        return dateObj.toLocaleDateString();
      }
    };
  }, [language]);

  // 数値フォーマット
  const formatNumber = useMemo(() => {
    const localeMappings = {
      ja: 'ja-JP',
      en: 'en-GB',
      de: 'de-DE', 
      da: 'da-DK',
      fi: 'fi-FI',
      no: 'nb-NO',
    };

    const locale = localeMappings[language] || 'ja-JP';

    return (number: number, options?: Intl.NumberFormatOptions): string => {
      try {
        return new Intl.NumberFormat(locale, options).format(number);
      } catch (error) {
        return number.toString();
      }
    };
  }, [language]);

  return {
    language,
    country,
    setLanguage,
    setCountry,
    t,
    formatCurrency,
    formatDate,
    formatNumber,
    isLoading, // ローディング状態を公開
  };
}

export default useI18n;