// Simple API service without external dependencies for now
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://172.26.93.180:3001/api';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'API request failed');
      }

      return data;
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error('Unknown error occurred');
    }
  }

  // Authentication endpoints
  async login(email: string, password: string) {
    // Try demo login first for easier access
    try {
      // Check if we have stored user info from previous registration
      const storedUserData = localStorage.getItem(`user_${email}`);
      let userInfo: { fullName?: string; isStudent?: boolean } = {};

      if (storedUserData) {
        try {
          userInfo = JSON.parse(storedUserData);
        } catch (error) {
          console.warn('Failed to parse stored user data:', error);
        }
      }

      return await this.request('/demo/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          fullName: userInfo.fullName,
          isStudent: userInfo.isStudent,
        }),
      });
    } catch {
      // If demo login fails, try regular auth
      return this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    }
  }

  async register(data: {
    email: string;
    password: string;
    fullName: string;
    isStudent: boolean;
  }) {
    // Store user info for future logins
    const userInfo = {
      fullName: data.fullName,
      isStudent: data.isStudent,
      registeredAt: new Date().toISOString(),
    };
    localStorage.setItem(`user_${data.email}`, JSON.stringify(userInfo));

    // Use demo login for registration to avoid Supabase issues
    return await this.request('/demo/login', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        fullName: data.fullName,
        isStudent: data.isStudent,
      }),
    });
  }

  async getCurrentUser(token: string) {
    return this.request('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async logout(token: string) {
    return this.request('/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Shift management endpoints
  async getShifts(token: string, filters?: Record<string, unknown>) {
    const queryParams = filters ? new URLSearchParams(filters as Record<string, string>).toString() : '';
    const endpoint = `/shifts${queryParams ? `?${queryParams}` : ''}`;
    
    return this.request(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async createShift(token: string, shiftData: Record<string, unknown>) {
    return this.request('/shifts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(shiftData),
    });
  }

  async updateShift(token: string, shiftId: string, shiftData: Record<string, unknown>) {
    return this.request(`/shifts/${shiftId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(shiftData),
    });
  }

  async deleteShift(token: string, shiftId: string) {
    return this.request(`/shifts/${shiftId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getShiftStats(token: string, year?: number, month?: number) {
    const queryParams = new URLSearchParams();
    if (year) queryParams.append('year', year.toString());
    if (month) queryParams.append('month', month.toString());
    
    const endpoint = `/shifts/stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return this.request(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async confirmShift(token: string, shiftId: string) {
    return this.request(`/shifts/${shiftId}/confirm`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async createBulkShifts(token: string, shifts: Record<string, unknown>[]) {
    return this.request('/shifts/bulk', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ shifts }),
    });
  }

  async getShiftProjection(token: string) {
    return this.request('/shifts/projection', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Income endpoints
  async getIncomes(token: string, params?: Record<string, string>) {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request(`/incomes${queryString}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async createIncome(
    token: string,
    data: {
      amount: number;
      source: string;
      description?: string;
      incomeDate: string;
    }
  ) {
    return this.request('/incomes', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async updateIncome(
    token: string,
    id: string,
    data: Partial<{
      amount: number;
      source: string;
      description: string;
      incomeDate: string;
    }>
  ) {
    return this.request(`/incomes/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async deleteIncome(token: string, id: string) {
    return this.request(`/incomes/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getIncomeStats(token: string, year?: number) {
    const queryString = year ? `?year=${year}` : '';
    return this.request(`/incomes/stats/summary${queryString}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Calculation endpoints
  async calculateDeduction(
    token: string,
    year?: number,
    includeProjections = false
  ) {
    return this.request('/calculations/deduction', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ year, includeProjections }),
    });
  }

  async getTaxBrackets(year?: number) {
    const queryString = year ? `?year=${year}` : '';
    return this.request(`/calculations/tax-brackets${queryString}`);
  }

  async projectIncome(
    token: string,
    targetAmount?: number,
    projectionMonths = 12
  ) {
    return this.request('/calculations/projection', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ targetAmount, projectionMonths }),
    });
  }

  // Enhanced calculation endpoints
  async getEnhancedCalculation(token?: string, year?: number) {
    const queryString = year ? `?year=${year}` : '';
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    return this.request(`/calculations/enhanced${queryString}`, {
      headers,
    });
  }

  async getWorkingOptimization(token?: string, hourlyRate?: number) {
    const queryString = hourlyRate ? `?hourlyRate=${hourlyRate}` : '';
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    return this.request(`/calculations/working-optimization${queryString}`, {
      headers,
    });
  }

  async getIncomeAnalysis(token?: string, year?: number) {
    const queryString = year ? `?year=${year}` : '';
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    return this.request(`/calculations/income-analysis${queryString}`, {
      headers,
    });
  }

  // Recent incomes for dashboard
  async getRecentIncomes(token: string, limit?: number) {
    const queryString = limit ? `?limit=${limit}` : '';
    return this.request(`/incomes/recent${queryString}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Alerts endpoints
  async getAlerts(token: string) {
    return this.request('/alerts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async markAlertAsRead(token: string, alertId: string) {
    return this.request(`/alerts/${alertId}/read`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async dismissAlert(token: string, alertId: string) {
    return this.request(`/alerts/${alertId}/dismiss`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // CSV endpoints
  async uploadCSV(file: File) {
    const formData = new FormData();
    formData.append('csvFile', file);

    const url = `${this.baseURL}/csv/upload`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'CSV upload failed');
    }

    return data;
  }

  async getCSVHistory() {
    return this.request('/csv/history');
  }

  async getCSVStats() {
    return this.request('/csv/stats');
  }
}

export const apiService = new ApiService(API_BASE_URL);
