// Simple API service without external dependencies for now
const API_BASE_URL = 'http://localhost:3001/api';

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
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: {
    email: string;
    password: string;
    fullName: string;
    isStudent: boolean;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
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
}

export const apiService = new ApiService(API_BASE_URL);
