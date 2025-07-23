import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  useEffect(() => {
    // Check for existing auth data on mount
    const checkAuth = () => {
      try {
        const authData = localStorage.getItem('auth');
        if (authData) {
          const { user: savedUser, token: savedToken } = JSON.parse(authData);
          setUser(savedUser);
          setToken(savedToken);
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
        localStorage.removeItem('auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
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

  const loginWithDemo = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await loginDemo();
      
      if (response.success && response.data) {
        const { token: newToken, user: newUser } = response.data;
        
        setUser(newUser);
        setToken(newToken);
        
        // Save to localStorage
        localStorage.setItem('auth', JSON.stringify({
          user: newUser,
          token: newToken,
        }));
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};