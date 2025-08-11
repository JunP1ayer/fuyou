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
        console.log('🔐 Auth initialization started');
        const currentUser = await authService.getCurrentUser();
        console.log('🔐 Current user:', currentUser);
        
        if (isMounted) {
          setUser(currentUser);
          setInitialized(true);
          console.log('🔐 Auth initialized with user:', currentUser?.email);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMounted) {
          setUser(null);
          setInitialized(true);
          console.log('🔐 Auth initialized without user');
        }
      }
    };

    initializeAuth();

    // 認証状態の変更を監視
    const { data: { subscription } } = authService.onAuthStateChange((newUser) => {
      if (isMounted) {
        console.log('🔄 Auth state changed to:', newUser?.email || 'null');
        
        // 現在のユーザーと異なる場合のみ更新
        setUser(prevUser => {
          if (prevUser?.id !== newUser?.id) {
            console.log('🔄 User state actually changed');
            return newUser;
          }
          return prevUser;
        });
        
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
      console.log('🔐 Login attempt for:', credentials.email);
      console.log('🔐 Current user state before login:', user?.email);
      
      const loginUser = await authService.login(credentials);
      console.log('🔐 Login successful, user:', loginUser);
      
      // 即座にユーザー状態を更新
      setUser(loginUser);
      console.log('🔐 User state updated to:', loginUser.email);
      
      // 本番環境での強制デバッグ
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        console.log('🚨 PRODUCTION DEBUG: Login completed, user set to:', loginUser.email);
        setTimeout(() => {
          console.log('🚨 PRODUCTION DEBUG: User state after 1s:', user?.email);
          console.log('🚨 PRODUCTION DEBUG: Auth context user:', loginUser);
        }, 1000);
      }
      
      // 少し待ってから再度確認
      setTimeout(() => {
        console.log('🔐 User state after timeout:', user?.email);
      }, 1000);
      
      toast.success(`お帰りなさい、${loginUser.name}さん！`, {
        duration: 3000,
        icon: '👋',
      });
    } catch (error) {
      console.error('🔐 Login failed:', error);
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
      console.log('🎆 Signup attempt for:', credentials.email);
      console.log('🎆 Current user state before signup:', user?.email);
      
      const signupUser = await authService.signup(credentials);
      console.log('🎆 Signup successful, user:', signupUser);
      
      // 即座にユーザー状態を更新
      setUser(signupUser);
      console.log('🎆 User state updated to:', signupUser.email);
      
      // 少し待ってから再度確認
      setTimeout(() => {
        console.log('🎆 User state after timeout:', user?.email);
      }, 1000);
      
      toast.success(`ようこそ、${signupUser.name}さん！\nアカウントが作成されました。`, {
        duration: 4000,
        icon: '🎉',
      });
    } catch (error) {
      console.error('🎆 Signup failed:', error);
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