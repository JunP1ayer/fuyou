/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type {
  User,
  AuthContextType,
  RegisterRequest,
  AuthResponse,
} from '../types/auth';
import { apiService } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...initialState,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
      } catch {
        // Invalid stored data, clear it
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = (await apiService.login(
        email,
        password
      )) as AuthResponse;

      if (response.success && response.data) {
        const { user, token } = response.data;

        // Store auth data
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(user));

        dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = (await apiService.register(data)) as AuthResponse;

      if (response.success && response.data) {
        const { user, token } = response.data;

        // Store auth data
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(user));

        dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      throw error;
    }
  };

  const logout = async () => {
    if (state.token) {
      try {
        await apiService.logout(state.token);
      } catch (error) {
        // Continue with logout even if API call fails
        console.error('Logout API call failed:', error);
      }
    }

    // Clear stored data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');

    dispatch({ type: 'AUTH_LOGOUT' });
  };

  const contextValue: AuthContextType = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
