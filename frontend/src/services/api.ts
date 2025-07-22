// API Service - Mock implementation for demo
export const apiService = {
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

  // Shift API methods
  async getShifts(_token: string, _filters?: { startDate?: string; endDate?: string }) {
    // Mock shifts API - will be replaced with real API calls
    return {
      success: true,
      data: []
    };
  },

  async createShift(_token: string, shiftData: Record<string, unknown>) {
    // Mock create shift API
    return {
      success: true,
      data: {
        id: `shift_${Date.now()}`,
        ...shiftData
      }
    };
  },

  async updateShift(_token: string, _shiftId: string, updateData: Record<string, unknown>) {
    // Mock update shift API
    return {
      success: true,
      data: {
        id: _shiftId,
        ...updateData
      }
    };
  },

  async deleteShift(_token: string, _shiftId: string) {
    // Mock delete shift API
    return {
      success: true,
      message: 'Shift deleted successfully'
    };
  },

  async getShiftStats(_token: string, _year?: number, _month?: number) {
    // Mock shift statistics API
    return {
      success: true,
      data: {
        totalHours: 0,
        totalEarnings: 0,
        shiftCount: 0,
        avgHours: 0
      }
    };
  },

  async getShiftProjection(_token: string) {
    // Mock earnings projection API
    return {
      success: true,
      data: {
        projectedMonthlyEarnings: 0,
        projectedYearlyEarnings: 0,
        fuyouRiskAssessment: 'safe'
      }
    };
  }
};
