// 🔐 認証コンテキスト

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import type { 
  User, 
  AuthContextType, 
  LoginCredentials, 
  SignupCredentials,
  AuthError 
} from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // 認証状態の初期化
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        
        if (isMounted) {
          setUser(currentUser);
          setInitialized(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMounted) {
          setUser(null);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // 認証状態の変更を監視
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      if (isMounted) {
        setUser(user);
        if (!initialized) {
          setInitialized(true);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // ログイン
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setLoading(true);
      const user = await authService.login(credentials);
      
      // ステート更新は onAuthStateChange で自動的に処理される
      
      toast.success(`お帰りなさい、${user.name}さん！`, {
        duration: 3000,
        icon: '👋',
      });
    } catch (error) {
      const authError = error as AuthError;
      toast.error(authError.message, {
        duration: 4000,
        icon: '❌',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 新規登録
  const signup = async (credentials: SignupCredentials): Promise<void> => {
    try {
      setLoading(true);
      const user = await authService.signup(credentials);
      
      // ステート更新は onAuthStateChange で自動的に処理される
      
      toast.success(`ようこそ、${user.name}さん！\nアカウントが作成されました。`, {
        duration: 4000,
        icon: '🎉',
      });
    } catch (error) {
      const authError = error as AuthError;
      toast.error(authError.message, {
        duration: 4000,
        icon: '❌',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ログアウト
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      
      toast.success('ログアウトしました', {
        duration: 2000,
        icon: '👋',
      });
    } catch (error) {
      const authError = error as AuthError;
      toast.error(authError.message, {
        duration: 3000,
        icon: '❌',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // プロフィール更新
  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    try {
      setLoading(true);
      const updatedUser = await authService.updateProfile(updates);
      setUser(updatedUser);
      
      toast.success('プロフィールを更新しました', {
        duration: 2000,
        icon: '✅',
      });
    } catch (error) {
      const authError = error as AuthError;
      toast.error(authError.message, {
        duration: 3000,
        icon: '❌',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // パスワードリセット
  const resetPassword = async (email: string): Promise<void> => {
    try {
      setLoading(true);
      await authService.resetPassword(email);
      
      toast.success('パスワードリセットメールを送信しました', {
        duration: 4000,
        icon: '📧',
      });
    } catch (error) {
      const authError = error as AuthError;
      toast.error(authError.message, {
        duration: 4000,
        icon: '❌',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    initialized,
    login,
    signup,
    logout,
    updateProfile,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// カスタムフック
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// 認証ガードフック
export const useRequireAuth = (): User => {
  const { user, loading, initialized } = useAuth();
  
  if (!initialized || loading) {
    throw new Error('Authentication is loading');
  }
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
};