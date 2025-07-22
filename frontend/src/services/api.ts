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
};
