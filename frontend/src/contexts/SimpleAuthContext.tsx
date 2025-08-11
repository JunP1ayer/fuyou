// 🔐 シンプル認証コンテキスト
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

export const SimpleAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
      console.log('🔐 Auth state change:', event, session?.user?.email || 'none');
      
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || 'ユーザー',
        });
      } else {
        setUser(null);
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
        },
      });

      if (error) {
        console.error('🔐 Signup error:', error);
        throw new Error(toFriendlyAuthMessage(error));
      }

      console.log('🔐 Signup success:', data.user?.email);
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
    } catch (error) {
      console.error('🔐 Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SimpleAuthContext.Provider value={{ user, loading, login, signup, logout }}>
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