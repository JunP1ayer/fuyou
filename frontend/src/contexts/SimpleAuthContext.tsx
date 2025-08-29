// 🔐 シンプル認証コンテキスト
import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { simpleSupabase } from '../lib/simpleSupabase';
import { toFriendlyAuthMessage, isEmailNotConfirmed } from '../lib/authErrorMapper';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface SimpleAuthContextType {
  user: User | null;
  loading: boolean;
  showEmailConfirmation: boolean;
  registeredEmail: string;
  showExistingUserConfirm: boolean;
  existingUserEmail: string;
  existingUserPassword: string;
  setShowEmailConfirmation: (show: boolean) => void;
  setRegisteredEmail: (email: string) => void;
  setShowExistingUserConfirm: (show: boolean) => void;
  setExistingUserEmail: (email: string) => void;
  setExistingUserPassword: (password: string) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<{ needsEmailConfirmation: boolean; isExistingUser?: boolean }>;
  logout: () => Promise<void>;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

export const SimpleAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // デバッグ: 状態変化を追跡
  React.useEffect(() => {
    console.log('🔍 AuthContext: showEmailConfirmation changed to:', showEmailConfirmation);
  }, [showEmailConfirmation]);

  React.useEffect(() => {
    console.log('🔍 AuthContext: registeredEmail changed to:', registeredEmail);
  }, [registeredEmail]);
  const [showExistingUserConfirm, setShowExistingUserConfirm] = useState(false);
  const [existingUserEmail, setExistingUserEmail] = useState('');
  const [existingUserPassword, setExistingUserPassword] = useState('');
  const lastAuthEventRef = useRef<{ key: string; ts: number } | null>(null);

  // 初期化
  useEffect(() => {
    console.log('🔐 Simple Auth initializing...');
    
    const initAuth = async () => {
      try {
        const { data: { session } } = await simpleSupabase.auth.getSession();
        console.log('🔐 Initial session:', session?.user?.email || 'none');
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.name || 'ユーザー',
          });
        }
      } catch (error) {
        console.error('🔐 Auth init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 認証状態変更を監視
    const { data: { subscription } } = simpleSupabase.auth.onAuthStateChange((event, session) => {
      const userId = session?.user?.id ?? 'none';
      const key = `${event}:${userId}`;
      const now = Date.now();

      // 短時間に同一イベントが集中する場合は無視（開発のStrictModeや内部リフレッシュ対策）
      if (lastAuthEventRef.current && lastAuthEventRef.current.key === key && now - lastAuthEventRef.current.ts < 1000) {
        return;
      }
      lastAuthEventRef.current = { key, ts: now };

      // ログ出力（デバッグ用）
      console.log('🔐 ===== AUTH STATE CHANGE =====');
      console.log('🔐 Event:', event);
      console.log('🔐 User email:', session?.user?.email || 'none');
      console.log('🔐 User confirmed:', session?.user?.email_confirmed_at || 'not confirmed');
      console.log('🔐 ================================');

      // TEMPORARY: サインアップ直後のSIGNED_INイベントを無視してメール確認を優先
      if (event === 'SIGNED_IN' && session?.user && !session.user.email_confirmed_at) {
        console.log('⚠️ IGNORING SIGNED_IN for unconfirmed user - keeping email confirmation flow');
        return;
      }

      if (session?.user) {
        // 同一ユーザーであれば不要な再設定を避ける
        setUser((prev) => {
          if (prev && prev.id === session.user!.id) {
            console.log('🔐 Same user - skipping update');
            return prev;
          }
          console.log('🔐 Setting new user:', session.user!.email);
          return {
            id: session.user!.id,
            email: session.user!.email!,
            name: session.user!.user_metadata?.name || 'ユーザー',
          };
        });
      } else {
        if (user !== null) {
          console.log('🔐 Clearing user');
          setUser(null);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ログイン
  const login = async (email: string, password: string) => {
    console.log('🔐 Login attempt:', email);
    setLoading(true);

    // 簡易バックオフ（最大3回、100ms, 300ms, 700ms）
    const delays = [100, 300, 700];

    try {
      for (let i = 0; i < delays.length; i += 1) {
        const { data, error } = await simpleSupabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (!error) {
          console.log('🔐 Login success:', data.user?.email);
          return;
        }

        // メール未確認はリトライせず即時返却
        if (isEmailNotConfirmed(error)) {
          throw new Error(toFriendlyAuthMessage(error));
        }

        // 最終試行で失敗したらエラーを投げる
        if (i === delays.length - 1) {
          throw new Error(toFriendlyAuthMessage(error));
        }

        await new Promise((r) => setTimeout(r, delays[i]));
      }
    } catch (error) {
      console.error('🔐 Login failed:', error);
      throw error instanceof Error ? error : new Error(toFriendlyAuthMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // 新規登録
  const signup = async (email: string, password: string, name: string) => {
    console.log('🔐 Signup attempt:', email);
    setLoading(true);
    
    try {
      const { data, error } = await simpleSupabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('🔐 Signup error:', error);
        
        // メール送信エラーを適切に処理
        if (error.message?.includes('Error sending confirmation email')) {
          // エラーメッセージを分かりやすく変換
          throw new Error('メール送信に失敗しました。しばらく待ってから再度お試しください。Supabaseの無料プランをご利用の場合、3時間あたり4通までの制限があります。');
        }
        
        throw new Error(toFriendlyAuthMessage(error));
      }

      console.log('🔐 ===== SIGNUP DEBUG =====');
      console.log('🔐 Signup success for email:', data.user?.email);
      console.log('🔐 User object:', JSON.stringify(data.user, null, 2));
      console.log('🔐 Session object:', JSON.stringify(data.session, null, 2));
      console.log('🔐 email_confirmed_at:', data.user?.email_confirmed_at);
      console.log('🔐 Session exists:', !!data.session);
      console.log('🔐 User confirmed:', data.user?.email_confirmed_at !== null);
      console.log('🔐 confirmation_sent_at:', data.user?.confirmation_sent_at);
      console.log('🔐 emailRedirectTo:', `${window.location.origin}/auth/callback`);
      console.log('🔐 identities length:', data.user?.identities?.length || 0);
      
      // 既存ユーザーかどうかを判定
      // identitiesが空配列の場合、既存ユーザーで確認メールは送信されない
      const isExistingUser = data.user?.identities?.length === 0;
      
      // 開発環境でのメール確認スキップ（環境変数で制御）
      const skipEmailVerification = import.meta.env.VITE_SKIP_EMAIL_VERIFICATION === 'true' && 
                                   import.meta.env.VITE_APP_ENV === 'development';
      
      if (skipEmailVerification) {
        console.warn('⚠️ DEVELOPMENT MODE: Email verification is skipped. DO NOT use in production!');
      }
      
      // メール確認が必要かどうかの判定を強化
      // 1. 既存ユーザーでない場合
      // 2. メール確認がまだ完了していない場合
      // 3. セッションが作成されていない場合（メール確認待ち）
      // 4. 開発環境でスキップ設定がない場合
      const needsEmailConfirmation = !skipEmailVerification &&
                                   !isExistingUser && 
                                   !data.user?.email_confirmed_at &&
                                   !data.session;
      
      console.log('🔐 isExistingUser:', isExistingUser);
      console.log('🔐 Final decision - needs email confirmation:', needsEmailConfirmation);
      console.log('🔐 ===== END DEBUG =====');
      
      return { 
        needsEmailConfirmation,
        isExistingUser 
      };
    } catch (error) {
      console.error('🔐 Signup failed:', error);
      throw error instanceof Error ? error : new Error(toFriendlyAuthMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // ログアウト
  const logout = async () => {
    console.log('🔐 Logout');
    setLoading(true);
    
    try {
      const { error } = await simpleSupabase.auth.signOut();
      if (error) throw new Error(toFriendlyAuthMessage(error));
      
      // ログアウト後の状態をリセット
      console.log('🔐 Logout successful - resetting auth states');
      setUser(null); // ユーザー状態を明示的にクリア
      setShowEmailConfirmation(false);
      setRegisteredEmail('');
      setShowExistingUserConfirm(false);
      setExistingUserEmail('');
      setExistingUserPassword('');
      
    } catch (error) {
      console.error('🔐 Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SimpleAuthContext.Provider value={{ 
      user, 
      loading, 
      showEmailConfirmation, 
      registeredEmail,
      showExistingUserConfirm,
      existingUserEmail,
      existingUserPassword,
      setShowEmailConfirmation, 
      setRegisteredEmail,
      setShowExistingUserConfirm,
      setExistingUserEmail,
      setExistingUserPassword,
      login, 
      signup, 
      logout 
    }}>
      {children}
    </SimpleAuthContext.Provider>
  );
};

export const useSimpleAuth = () => {
  const context = useContext(SimpleAuthContext);
  if (!context) {
    throw new Error('useSimpleAuth must be used within SimpleAuthProvider');
  }
  return context;
};