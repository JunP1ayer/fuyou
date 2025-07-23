import type {
  Shift,
  CreateShiftData,
  UpdateShiftData,
  ShiftStats,
  EarningsProjection,
} from '../types/shift';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Get token from localStorage if available
const getAuthToken = (): string | null => {
  try {
    const authData = localStorage.getItem('auth');
    if (authData) {
      const { token } = JSON.parse(authData);
      return token;
    }
  } catch (error) {
    console.error('Error reading auth token:', error);
  }
  return null;
};

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit & { token?: string } = {}
): Promise<{ success: boolean; data?: T; error?: any }> {
  const { token, ...fetchOptions } = options;
  const authToken = token || getAuthToken();
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...fetchOptions.headers,
      },
    });

    const result = await response.json();

    // Handle specific error status codes
    if (response.status === 409) {
      // Time conflict error
      return {
        success: false,
        error: {
          code: 'TIME_CONFLICT',
          message: result.error?.message || 'Shift time conflict detected',
          conflictingShifts: result.error?.conflictingShifts,
        },
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: result.error || { message: 'An error occurred' },
      };
    }

    return result;
  } catch (error) {
    console.error('API call error:', error);
    return {
      success: false,
      error: { message: 'Network error or server unavailable' },
    };
  }
}

// Demo authentication
export const loginDemo = async (): Promise<{ success: boolean; data?: { token: string; user: any }; error?: any }> => {
  return apiCall<{ token: string; user: any }>('/demo/login', {
    method: 'POST',
  });
};

// Shift API functions
export const createShift = async (shiftData: CreateShiftData): Promise<{ success: boolean; data?: Shift; error?: any }> => {
  return apiCall<Shift>('/shifts', {
    method: 'POST',
    body: JSON.stringify(shiftData),
  });
};

export const getShifts = async (filters?: {
  startDate?: string;
  endDate?: string;
  jobSourceId?: string;
  isConfirmed?: boolean;
}): Promise<{ success: boolean; data?: Shift[]; error?: any }> => {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.jobSourceId) params.append('jobSourceId', filters.jobSourceId);
  if (filters?.isConfirmed !== undefined) {
    params.append('isConfirmed', filters.isConfirmed.toString());
  }

  const queryString = params.toString();
  const endpoint = queryString ? `/shifts?${queryString}` : '/shifts';

  return apiCall<Shift[]>(endpoint);
};

export const updateShift = async (shiftId: string, shiftData: UpdateShiftData): Promise<{ success: boolean; data?: Shift; error?: any }> => {
  return apiCall<Shift>(`/shifts/${shiftId}`, {
    method: 'PUT',
    body: JSON.stringify(shiftData),
  });
};

export const deleteShift = async (shiftId: string): Promise<{ success: boolean; error?: any }> => {
  return apiCall(`/shifts/${shiftId}`, {
    method: 'DELETE',
  });
};

export const getShiftStats = async (year?: number, month?: number): Promise<{ success: boolean; data?: ShiftStats; error?: any }> => {
  const params = new URLSearchParams();
  if (year) params.append('year', year.toString());
  if (month) params.append('month', month.toString());

  const queryString = params.toString();
  const endpoint = queryString ? `/shifts/stats?${queryString}` : '/shifts/stats';

  return apiCall<ShiftStats>(endpoint);
};

export const getEarningsProjection = async (): Promise<{ success: boolean; data?: EarningsProjection; error?: any }> => {
  return apiCall<EarningsProjection>('/shifts/projection');
};

// API Service - Mock implementation for demo
export const apiService = {
  // Existing methods
  async getEnhancedCalculation(_token: string) {
    // Mock API response for demo - token unused in demo mode
    return {
      success: true,
      data: {
        currentIncome: 650000,
        monthlyTarget: 80000,
        applicableLimits: [
          {
            type: 'student_dependent',
            amount: 1500000,
            description: '学生特定扶養控除（150万円）',
          },
        ],
        recommendedLimit: {
          type: 'student_dependent',
          amount: 1500000,
          description: '学生特定扶養控除（150万円）',
        },
        remainingAmount: 850000,
        usageRate: 0.43,
        projectedYearEndIncome: 960000,
        riskLevel: 'safe',
        alerts: [],
      },
    };
  },

  async uploadCSV(_file: File, _token?: string) {
    // Mock CSV upload with proper structure - parameters unused in demo mode
    return {
      success: true,
      totalTransactions: 25,
      incomeTransactions: [
        {
          date: '2024-01-15',
          description: 'アルバイト給与',
          amount: 85000,
          source: 'UFJ銀行',
          confidence: 0.95,
        },
      ],
      errors: [],
      bankType: 'UFJ',
      data: {
        message: 'CSV処理が完了しました',
        processedRows: 25,
      },
    };
  },

  // Shift-related methods
  async createShift(data: CreateShiftData, token?: string) {
    return apiCall<Shift>('/shifts', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  },

  async getShifts(
    filters?: {
      startDate?: string;
      endDate?: string;
      jobSourceId?: string;
      isConfirmed?: boolean;
    },
    token?: string
  ) {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.jobSourceId) params.append('jobSourceId', filters.jobSourceId);
    if (filters?.isConfirmed !== undefined) {
      params.append('isConfirmed', filters.isConfirmed.toString());
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/shifts?${queryString}` : '/shifts';

    return apiCall<Shift[]>(endpoint, { token });
  },

  async getShiftById(shiftId: string, token?: string) {
    return apiCall<Shift>(`/shifts/${shiftId}`, { token });
  },

  async updateShift(shiftId: string, data: UpdateShiftData, token?: string) {
    return apiCall<Shift>(`/shifts/${shiftId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    });
  },

  async deleteShift(shiftId: string, token?: string) {
    return apiCall<{ message: string }>(`/shifts/${shiftId}`, {
      method: 'DELETE',
      token,
    });
  },

  async confirmShift(shiftId: string, token?: string) {
    return apiCall<Shift>(`/shifts/${shiftId}/confirm`, {
      method: 'POST',
      token,
    });
  },

  async getShiftStats(year?: number, month?: number, token?: string) {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/shifts/stats?${queryString}` : '/shifts/stats';

    return apiCall<ShiftStats>(endpoint, { token });
  },

  async getEarningsProjection(token?: string) {
    return apiCall<EarningsProjection>('/shifts/projection', { token });
  },

  async createBulkShifts(shifts: CreateShiftData[], token?: string) {
    return apiCall<Shift[]>('/shifts/bulk', {
      method: 'POST',
      body: JSON.stringify({ shifts }),
      token,
    });
  },
};
