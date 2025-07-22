import { useState, useCallback } from 'react';

// Mock authentication hook for demo purposes
export const useAuth = () => {
  const [token, setToken] = useState<string | null>('demo-token-12345');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [user, setUser] = useState<{
    id: string;
    email: string;
    name: string;
  } | null>({
    id: 'demo-user',
    email: 'demo@example.com',
    name: 'デモユーザー',
  });

  const login = useCallback(async (_email: string, _password: string) => {
    // Mock login - parameters unused in demo mode
    setToken('demo-token-12345');
    setIsAuthenticated(true);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  return {
    token,
    isAuthenticated,
    user,
    login,
    logout,
  };
};
