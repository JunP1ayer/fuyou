import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { loginDemo } from '../services/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  isStudent: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithDemo: () => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loginWithDemo = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await loginDemo();

      if (response.success && response.data) {
        const { token: newToken, user: newUser } = response.data;

        setUser(newUser);
        setToken(newToken);

        // Save to localStorage
        localStorage.setItem(
          'auth',
          JSON.stringify({
            user: newUser,
            token: newToken,
          })
        );
      } else {
        throw new Error(response.error?.message || 'Demo login failed');
      }
    } catch (error) {
      console.error('Demo login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for existing auth data on mount
    const checkAuth = async () => {
      try {
        const authData = localStorage.getItem('auth');
        if (authData) {
          const { user: savedUser, token: savedToken } = JSON.parse(authData);
          setUser(savedUser);
          setToken(savedToken);
          setLoading(false);
          return;
        }
        
        // If no auth data, auto-login with demo
        console.log('No auth found, performing auto demo login...');
        await loginWithDemo();
      } catch (error) {
        console.error('Error during auth check/demo login:', error);
        localStorage.removeItem('auth');
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (_email: string, _password: string): Promise<void> => {
    setLoading(true);
    try {
      // For now, this would call a real login API
      // const response = await loginWithCredentials(email, password);
      throw new Error('Regular login not implemented - use demo login');
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = (): void => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    loginWithDemo,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
