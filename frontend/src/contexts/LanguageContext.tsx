// 🌍 言語管理コンテキスト

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  isLanguageSelected: boolean;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 翻訳データ
const translations = {
  ja: {
    'app.name': '扶養管理カレンダー',
    'app.description': '学生向け扶養控除管理システム',
    'auth.login': 'ログイン',
    'auth.signup': '新規登録',
    'auth.email': 'メールアドレス',
    'auth.password': 'パスワード',
    'auth.confirmPassword': 'パスワード（確認）',
    'auth.name': 'お名前',
    'auth.forgotPassword': 'パスワードを忘れた方',
    'auth.createAccount': 'アカウント作成',
    'auth.loginButton': 'ログイン',
    'auth.passwordHelper': '8文字以上、大文字・数字を含む',
    'auth.agreement': 'により、利用規約とプライバシーポリシーに同意するものとします',
    'loading.starting': 'アプリを起動しています...',
    'loading.authenticating': '認証情報を確認しています...',
    'loading.processing': '処理中です...',
  },
  en: {
    'app.name': 'Dependent Management Calendar',
    'app.description': 'Tax dependent management system for students',
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.name': 'Full Name',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.createAccount': 'Create Account',
    'auth.loginButton': 'Sign In',
    'auth.passwordHelper': '8+ characters with uppercase and numbers',
    'auth.agreement': 'By proceeding, you agree to our Terms and Privacy Policy',
    'loading.starting': 'Starting application...',
    'loading.authenticating': 'Checking authentication...',
    'loading.processing': 'Processing...',
  },
  ko: {
    'app.name': '부양 관리 캘린더',
    'app.description': '학생을 위한 부양 공제 관리 시스템',
    'auth.login': '로그인',
    'auth.signup': '회원가입',
    'auth.email': '이메일 주소',
    'auth.password': '비밀번호',
    'auth.confirmPassword': '비밀번호 확인',
    'auth.name': '이름',
    'auth.forgotPassword': '비밀번호를 잊으셨나요?',
    'auth.createAccount': '계정 만들기',
    'auth.loginButton': '로그인',
    'auth.passwordHelper': '8자 이상, 대문자 및 숫자 포함',
    'auth.agreement': '계속 진행하면 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다',
    'loading.starting': '앱을 시작하는 중...',
    'loading.authenticating': '인증 정보를 확인하는 중...',
    'loading.processing': '처리 중...',
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<string>('');
  const [isLanguageSelected, setIsLanguageSelected] = useState(false);

  useEffect(() => {
    // ローカルストレージから言語設定を復元
    const savedLanguage = localStorage.getItem('app_language');
    if (savedLanguage && translations[savedLanguage as keyof typeof translations]) {
      setLanguageState(savedLanguage);
      setIsLanguageSelected(true);
    }
  }, []);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    setIsLanguageSelected(true);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string, fallback?: string): string => {
    if (!language || !translations[language as keyof typeof translations]) {
      return fallback || key;
    }
    
    const langTranslations = translations[language as keyof typeof translations];
    return langTranslations[key as keyof typeof langTranslations] || fallback || key;
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