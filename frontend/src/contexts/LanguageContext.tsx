// 🌍 言語管理コンテキスト

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import useI18nStore from '../store/i18nStore';
import { t as translate } from '../i18n';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  isLanguageSelected: boolean;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 翻訳データは `i18n/index.ts` に集約（動的辞書は `useI18n` で提供）

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { language: storeLang, setLanguage: setStoreLanguage } = useI18nStore();
  const [language, setLanguageState] = useState<string>(storeLang || 'ja');
  const [isLanguageSelected, setIsLanguageSelected] = useState(false); // 初期値をfalseに変更

  useEffect(() => {
    // ローカルストレージから言語設定を復元
    const savedLanguage = localStorage.getItem('app_language');
    const hasSelectedLanguage = localStorage.getItem('app_language_selected');
    
    if (savedLanguage) {
      setLanguageState(savedLanguage);
      setIsLanguageSelected(hasSelectedLanguage === 'true');
    } else {
      // デフォルト言語を設定
      localStorage.setItem('app_language', 'ja');
      setIsLanguageSelected(false); // まだ選択されていない
    }
  }, []);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    setStoreLanguage(lang as any);
    setIsLanguageSelected(true);
    localStorage.setItem('app_language', lang);
    localStorage.setItem('app_language_selected', 'true');
  };

  const t = (key: string, fallback?: string): string => {
    const text = translate(key);
    return text || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      isLanguageSelected,
      t,
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};