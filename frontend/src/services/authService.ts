// 🔐 Supabase認証サービス

import { createClient } from '@supabase/supabase-js';
import type { 
  User, 
  LoginCredentials, 
  SignupCredentials, 
  AuthError
} from '../types/auth';
import { AUTH_ERROR_MESSAGES, VALIDATION_RULES } from '../types/auth';

// Supabaseクライアント初期化
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// バリデーション関数
export const validateCredentials = {
  name: (name: string): string | null => {
    if (!name.trim()) return '名前は必須です';
    if (name.trim().length < VALIDATION_RULES.name.minLength) {
      return `名前は${VALIDATION_RULES.name.minLength}文字以上で入力してください`;
    }
    if (name.trim().length > VALIDATION_RULES.name.maxLength) {
      return `名前は${VALIDATION_RULES.name.maxLength}文字以下で入力してください`;
    }
    return null;
  },

  email: (email: string): string | null => {
    if (!email.trim()) return 'メールアドレスは必須です';
    if (!VALIDATION_RULES.email.pattern.test(email)) {
      return '有効なメールアドレスを入力してください';
    }
    return null;
  },

  password: (password: string): string | null => {
    if (!password) return 'パスワードは必須です';
    if (password.length < VALIDATION_RULES.password.minLength) {
      return `パスワードは${VALIDATION_RULES.password.minLength}文字以上で入力してください`;
    }
    if (password.length > VALIDATION_RULES.password.maxLength) {
      return `パスワードは${VALIDATION_RULES.password.maxLength}文字以下で入力してください`;
    }
    if (VALIDATION_RULES.password.requireUppercase && !/[A-Z]/.test(password)) {
      return 'パスワードには大文字を含めてください';
    }
    if (VALIDATION_RULES.password.requireNumbers && !/\d/.test(password)) {
      return 'パスワードには数字を含めてください';
    }
    return null;
  },

  confirmPassword: (password: string, confirmPassword: string): string | null => {
    if (password !== confirmPassword) {
      return 'パスワードが一致しません';
    }
    return null;
  },
};

// エラーメッセージ変換
const transformAuthError = (error: any): AuthError => {
  const message = error.message?.toLowerCase() || '';

  if (message.includes('invalid credentials') || message.includes('invalid login')) {
    return { message: AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS };
  }
  
  if (message.includes('user already registered') || message.includes('email already exists')) {
    return { message: AUTH_ERROR_MESSAGES.EMAIL_ALREADY_EXISTS };
  }

  if (message.includes('password') && message.includes('weak')) {
    return { message: AUTH_ERROR_MESSAGES.WEAK_PASSWORD };
  }

  if (message.includes('email') && message.includes('invalid')) {
    return { message: AUTH_ERROR_MESSAGES.INVALID_EMAIL };
  }

  if (message.includes('network') || message.includes('fetch')) {
    return { message: AUTH_ERROR_MESSAGES.NETWORK_ERROR };
  }

  return { message: error.message || AUTH_ERROR_MESSAGES.UNKNOWN_ERROR };
};

export const authService = {
  // 現在のユーザーを取得
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      if (!user) return null;

      // プロフィール情報を取得
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('Profile fetch error:', profileError);
      }

      return {
        id: user.id,
        email: user.email!,
        name: profile?.name || user.user_metadata?.name || 'ユーザー',
        avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url,
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // ログイン
  login: async (credentials: LoginCredentials): Promise<User> => {
    try {
      // バリデーション
      const emailError = validateCredentials.email(credentials.email);
      if (emailError) throw new Error(emailError);

      const passwordError = validateCredentials.password(credentials.password);
      if (passwordError) throw new Error(passwordError);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email.trim(),
        password: credentials.password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('ログインに失敗しました');

      // プロフィール情報を取得
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', data.user.id)
        .single();

      return {
        id: data.user.id,
        email: data.user.email!,
        name: profile?.name || data.user.user_metadata?.name || 'ユーザー',
        avatar_url: profile?.avatar_url || data.user.user_metadata?.avatar_url,
        created_at: data.user.created_at,
        updated_at: data.user.updated_at || data.user.created_at,
      };
    } catch (error) {
      throw transformAuthError(error);
    }
  },

  // 新規登録
  signup: async (credentials: SignupCredentials): Promise<User> => {
    try {
      // バリデーション
      const nameError = validateCredentials.name(credentials.name);
      if (nameError) throw new Error(nameError);

      const emailError = validateCredentials.email(credentials.email);
      if (emailError) throw new Error(emailError);

      const passwordError = validateCredentials.password(credentials.password);
      if (passwordError) throw new Error(passwordError);

      const confirmPasswordError = validateCredentials.confirmPassword(
        credentials.password, 
        credentials.confirmPassword
      );
      if (confirmPasswordError) throw new Error(confirmPasswordError);

      const { data, error } = await supabase.auth.signUp({
        email: credentials.email.trim(),
        password: credentials.password,
        options: {
          data: {
            name: credentials.name.trim(),
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('アカウント作成に失敗しました');

      // プロフィールテーブルにレコード作成
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            name: credentials.name.trim(),
            email: credentials.email.trim(),
          },
        ]);

      if (profileError) {
        console.warn('Profile creation error:', profileError);
      }

      return {
        id: data.user.id,
        email: data.user.email!,
        name: credentials.name.trim(),
        avatar_url: data.user.user_metadata?.avatar_url,
        created_at: data.user.created_at,
        updated_at: data.user.updated_at || data.user.created_at,
      };
    } catch (error) {
      throw transformAuthError(error);
    }
  },

  // ログアウト
  logout: async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      throw transformAuthError(error);
    }
  },

  // プロフィール更新
  updateProfile: async (updates: Partial<User>): Promise<User> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('認証されていません');

      // プロフィールテーブルを更新
      const { data, error } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          avatar_url: updates.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: user.id,
        email: user.email!,
        name: data.name,
        avatar_url: data.avatar_url,
        created_at: user.created_at,
        updated_at: data.updated_at,
      };
    } catch (error) {
      throw transformAuthError(error);
    }
  },

  // パスワードリセット
  resetPassword: async (email: string): Promise<void> => {
    try {
      const emailError = validateCredentials.email(email);
      if (emailError) throw new Error(emailError);

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    } catch (error) {
      throw transformAuthError(error);
    }
  },

  // 認証状態の変更を監視
  onAuthStateChange: (callback: (user: User | null) => void) => {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await authService.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  },
};