// 🔗 統合API サービス - バックエンド連携

import type { Shift, Workplace } from '../types/simple';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    this.loadToken();
  }

  private loadToken() {
    try {
      const auth = localStorage.getItem('auth');
      if (auth) {
        const authData = JSON.parse(auth);
        this.token = authData.token;
      }
    } catch (error) {
      console.warn('Failed to load auth token:', error);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      defaultHeaders.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: {
            message: data.error?.message || `HTTP ${response.status}`,
            code: data.error?.code || response.status.toString(),
          },
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Network error',
          code: 'NETWORK_ERROR',
        },
      };
    }
  }

  // 公開ユーティリティ（自由に叩ける汎用エンドポイント）
  public async send<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, options);
  }

  public async postJson<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) });
  }

  public async putJson<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) });
  }

  public async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // 認証
  async loginDemo(): Promise<ApiResponse<{ user: any; token: string }>> {
    return this.request('/demo/login', { method: 'POST' });
  }

  // シフト管理
  async getShifts(): Promise<ApiResponse<Shift[]>> {
    return this.request('/shifts');
  }

  async createShift(shift: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Shift>> {
    return this.request('/shifts', {
      method: 'POST',
      body: JSON.stringify(shift),
    });
  }

  async updateShift(id: string, shift: Partial<Shift>): Promise<ApiResponse<Shift>> {
    return this.request(`/shifts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(shift),
    });
  }

  async deleteShift(id: string): Promise<ApiResponse<void>> {
    return this.request(`/shifts/${id}`, { method: 'DELETE' });
  }

  // バイト先管理
  async getWorkplaces(): Promise<ApiResponse<Workplace[]>> {
    return this.request('/job-sources');
  }

  async createWorkplace(workplace: Omit<Workplace, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Workplace>> {
    return this.request('/job-sources', {
      method: 'POST',
      body: JSON.stringify(workplace),
    });
  }

  async updateWorkplace(id: string, workplace: Partial<Workplace>): Promise<ApiResponse<Workplace>> {
    return this.request(`/job-sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workplace),
    });
  }

  async deleteWorkplace(id: string): Promise<ApiResponse<void>> {
    return this.request(`/job-sources/${id}`, { method: 'DELETE' });
  }

  // 統計・計算
  async getMonthlyStats(year: number, month: number): Promise<ApiResponse<any>> {
    return this.request(`/shifts/stats?year=${year}&month=${month}`);
  }

  async getProjections(): Promise<ApiResponse<any>> {
    return this.request('/shifts/projection');
  }

  // 扶養計算
  async calculateFuyou(earnings: number, country: string = 'JP'): Promise<ApiResponse<any>> {
    return this.request('/calculations/fuyou', {
      method: 'POST',
      body: JSON.stringify({ earnings, country }),
    });
  }

  // OCR機能
  async processOCR(formData: FormData): Promise<ApiResponse<any>> {
    return this.request('/intelligent-ocr/upload-and-process', {
      method: 'POST',
      body: formData,
      headers: {}, // FormDataの場合はContent-Typeを自動設定
    });
  }

  // データ同期
  async syncShifts(shifts: Shift[]): Promise<ApiResponse<Shift[]>> {
    return this.request('/shifts/bulk', {
      method: 'POST',
      body: JSON.stringify({ shifts }),
    });
  }

  async syncWorkplaces(workplaces: Workplace[]): Promise<ApiResponse<Workplace[]>> {
    return this.request('/job-sources/bulk', {
      method: 'POST',
      body: JSON.stringify({ workplaces }),
    });
  }

  // リアルタイム更新用
  async getLastUpdated(): Promise<ApiResponse<{ shifts: string; workplaces: string }>> {
    return this.request('/sync/last-updated');
  }
}

// シングルトンインスタンス
export const apiService = new ApiService();

// 便利な型エクスポート
export type { ApiResponse };