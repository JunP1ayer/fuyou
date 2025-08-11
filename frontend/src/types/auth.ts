// 🔐 認証関連の型定義

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthError {
  message: string;
  field?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// フォームバリデーションルール
export interface ValidationRules {
  name: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  email: {
    required: boolean;
    pattern: RegExp;
  };
  password: {
    required: boolean;
    minLength: number;
    maxLength: number;
    requireUppercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
  };
}

export const VALIDATION_RULES: ValidationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    required: true,
    minLength: 8,
    maxLength: 100,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: false,
  },
};

// 認証エラーメッセージ
export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'メールアドレスまたはパスワードが正しくありません',
  EMAIL_ALREADY_EXISTS: 'このメールアドレスは既に登録されています',
  WEAK_PASSWORD: 'パスワードが弱すぎます。8文字以上で大文字・数字を含めてください',
  INVALID_EMAIL: '有効なメールアドレスを入力してください',
  PASSWORDS_DO_NOT_MATCH: 'パスワードが一致しません',
  NETWORK_ERROR: 'ネットワークエラーが発生しました。再度お試しください',
  UNKNOWN_ERROR: '予期しないエラーが発生しました',
} as const;

export type AuthErrorType = keyof typeof AUTH_ERROR_MESSAGES;