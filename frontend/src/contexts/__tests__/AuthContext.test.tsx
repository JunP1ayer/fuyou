import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// Test component that uses the auth context
const TestComponent = () => {
  const { user, login, logout, loading } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? `User: ${user.fullName}` : 'No user'}</div>
      <button 
        data-testid="login" 
        onClick={() => login('test@example.com', 'password123')}
      >
        Login
      </button>
      <button data-testid="logout" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

const renderWithProvider = () => {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should provide initial auth state', () => {
    renderWithProvider();
    
    expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    expect(screen.getByTestId('user')).toHaveTextContent('No user');
  });

  it('should handle demo login', async () => {
    renderWithProvider();
    
    fireEvent.click(screen.getByTestId('login'));
    
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('User: Demo User');
    });
  });

  it('should handle logout', async () => {
    renderWithProvider();
    
    // Login first
    fireEvent.click(screen.getByTestId('login'));
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('User: Demo User');
    });
    
    // Then logout
    fireEvent.click(screen.getByTestId('logout'));
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
    });
  });

  it('should persist auth state in localStorage', async () => {
    renderWithProvider();
    
    fireEvent.click(screen.getByTestId('login'));
    
    await waitFor(() => {
      expect(localStorage.getItem('auth_token')).toBeTruthy();
      expect(localStorage.getItem('auth_user')).toBeTruthy();
    });
  });
});