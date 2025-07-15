export interface User {
  id: string;
  email: string;
  fullName: string;
  isStudent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthToken {
  token: string;
  refreshToken?: string;
  expiresIn: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  isStudent: boolean;
}

export interface AuthResponse {
  success: boolean;
  data?: AuthToken;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}
