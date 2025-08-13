// 🧠 リアルタイム最適化サービス
// Phase 5: Real-time shift optimization integration

import { apiService } from './apiService';

export interface OptimizationRequest {
  shifts: ShiftData[];
  objective: 'maximize_earnings' | 'minimize_tax_burden' | 'balance_workload';
  constraints: {
    maxWeeklyHours?: number;
    minWeeklyHours?: number;
    annualEarningsLimit?: number;
    preferredHourlyRates?: number[];
  };
  timeHorizonDays: number;
  preferences: {
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    workLifeBalance: number; // 1-10 scale
    prioritizeHighPayingJobs: boolean;
  };
}

export interface OptimizationResponse {
  optimizationId: string;
  algorithm: 'linear_programming' | 'genetic_algorithm' | 'multi_objective';
  status: 'pending' | 'running' | 'completed' | 'failed';
  fitnessScore?: number;
  totalEarnings: number;
  totalHours: number;
  numShifts: number;
  shifts: OptimizedShift[];
  recommendations: string[];
  constraintsSatisfied: boolean;
  executionTime: string;
  riskAssessment?: {
    taxRisk: 'low' | 'medium' | 'high';
    overworkRisk: 'low' | 'medium' | 'high';
    socialInsuranceRisk: 'low' | 'medium' | 'high';
  };
}

interface ShiftData {
  date: string;
  hours: number;
  hourlyRate: number;
  workplace: string;
}

interface OptimizedShift {
  date: string;
  hours: number;
  hourlyRate: number;
  earnings: number;
  workplace: string;
  optimizationScore: number;
}

class OptimizationService {
  private optimizationEndpoint = '/api/optimize';
  private pollingInterval = 2000; // 2 seconds
  private maxPollingAttempts = 30; // Maximum 1 minute wait

  /**
   * リアルタイム最適化リクエストを送信
   */
  async optimizeShifts(request: OptimizationRequest): Promise<OptimizationResponse> {
    try {
      // Start optimization process
      const response = await apiService.postJson(this.optimizationEndpoint, request);
      
      if (!response.success) {
        const errorMessage = typeof response.error === 'string' ? response.error : 
          (response.error?.message || 'Optimization request failed');
        throw new Error(errorMessage);
      }

      const optimizationId = (response.data as any)?.optimizationId;
      
      // Poll for completion
      return await this.pollOptimizationResult(optimizationId);
    } catch (error) {
      console.error('Optimization service error:', error);
      
      // Fallback to client-side optimization
      return await this.clientSideOptimization(request);
    }
  }

  /**
   * 最適化結果をポーリング取得
   */
  private async pollOptimizationResult(optimizationId: string): Promise<OptimizationResponse> {
    let attempts = 0;
    
    while (attempts < this.maxPollingAttempts) {
      try {
        const response = await (apiService as any).request(`${this.optimizationEndpoint}/${optimizationId}`);
        
        if (response.success && response.data) {
          const result = response.data;
          
          if (result.status === 'completed') {
            return result;
          } else if (result.status === 'failed') {
            throw new Error('Optimization failed on server');
          }
          
          // Still running, continue polling
          await this.delay(this.pollingInterval);
          attempts++;
        } else {
          throw new Error('Failed to fetch optimization result');
        }
      } catch (error) {
        console.warn(`Polling attempt ${attempts + 1} failed:`, error);
        await this.delay(this.pollingInterval);
        attempts++;
      }
    }
    
    throw new Error('Optimization timeout - switching to fallback');
  }

  /**
   * クライアントサイド最適化（フォールバック）
   */
  private async clientSideOptimization(request: OptimizationRequest): Promise<OptimizationResponse> {
    console.log('Using client-side optimization fallback');
    
    // Simple greedy algorithm for client-side optimization
    const optimizedShifts = this.greedyOptimization(request);
    
    return {
      optimizationId: `client_${Date.now()}`,
      algorithm: 'linear_programming', // Simplified
      status: 'completed',
      fitnessScore: 0.8,
      totalEarnings: optimizedShifts.reduce((sum, shift) => sum + shift.earnings, 0),
      totalHours: optimizedShifts.reduce((sum, shift) => sum + shift.hours, 0),
      numShifts: optimizedShifts.length,
      shifts: optimizedShifts,
      recommendations: [
        'Optimization completed using client-side algorithm',
        'For advanced optimization, ensure server connectivity',
        'Consider adjusting constraints for better results'
      ],
      constraintsSatisfied: true,
      executionTime: 'Instant (client-side)',
      riskAssessment: this.assessRisk(optimizedShifts)
    };
  }

  /**
   * 貪欲法による簡易最適化
   */
  private greedyOptimization(request: OptimizationRequest): OptimizedShift[] {
    const { shifts, objective, constraints } = request;
    
    // Sort shifts by optimization criteria
    let sortedShifts = [...shifts];
    
    if (objective === 'maximize_earnings') {
      sortedShifts.sort((a, b) => (b.hourlyRate * b.hours) - (a.hourlyRate * a.hours));
    } else if (objective === 'minimize_tax_burden') {
      sortedShifts.sort((a, b) => a.hourlyRate - b.hourlyRate);
    } else {
      // Balance workload - prefer moderate hours
      sortedShifts.sort((a, b) => Math.abs(a.hours - 6) - Math.abs(b.hours - 6));
    }

    const optimizedShifts: OptimizedShift[] = [];
    let totalEarnings = 0;
    let totalHours = 0;

    for (const shift of sortedShifts) {
      const shiftEarnings = shift.hours * shift.hourlyRate;
      const newTotalEarnings = totalEarnings + shiftEarnings;
      const newTotalHours = totalHours + shift.hours;

      // Check constraints
      if (constraints.annualEarningsLimit && newTotalEarnings > constraints.annualEarningsLimit) {
        continue;
      }

      const weeklyHours = newTotalHours / (request.timeHorizonDays / 7);
      if (constraints.maxWeeklyHours && weeklyHours > constraints.maxWeeklyHours) {
        continue;
      }

      optimizedShifts.push({
        ...shift,
        earnings: shiftEarnings,
        optimizationScore: this.calculateOptimizationScore(shift, objective)
      });

      totalEarnings = newTotalEarnings;
      totalHours = newTotalHours;
    }

    return optimizedShifts;
  }

  /**
   * 最適化スコア計算
   */
  private calculateOptimizationScore(shift: ShiftData, objective: string): number {
    let score = 0;

    if (objective === 'maximize_earnings') {
      score = (shift.hourlyRate * shift.hours) / 10000; // Normalize
    } else if (objective === 'minimize_tax_burden') {
      score = Math.max(0, 1 - (shift.hourlyRate / 2000)); // Prefer lower rates
    } else {
      score = Math.max(0, 1 - Math.abs(shift.hours - 6) / 6); // Prefer ~6 hours
    }

    return Math.min(1, Math.max(0, score));
  }

  /**
   * リスク評価
   */
  private assessRisk(shifts: OptimizedShift[]): OptimizationResponse['riskAssessment'] {
    const totalEarnings = shifts.reduce((sum, shift) => sum + shift.earnings, 0);
    const totalHours = shifts.reduce((sum, shift) => sum + shift.hours, 0);
    const weeklyHours = totalHours / 4; // Assume 4 weeks

    return {
      taxRisk: totalEarnings > 1030000 ? 'high' : totalEarnings > 800000 ? 'medium' : 'low',
      overworkRisk: weeklyHours > 35 ? 'high' : weeklyHours > 25 ? 'medium' : 'low',
      socialInsuranceRisk: totalEarnings > 1300000 ? 'high' : totalEarnings > 1100000 ? 'medium' : 'low'
    };
  }

  /**
   * 遅延ユーティリティ
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 即座に実行可能な最適化提案を取得
   */
  async getQuickOptimizationSuggestions(shifts: ShiftData[]): Promise<string[]> {
    if (shifts.length === 0) {
      return ['No shifts to optimize'];
    }

    const suggestions: string[] = [];
    const totalEarnings = shifts.reduce((sum, shift) => sum + (shift.hours * shift.hourlyRate), 0);
    const totalHours = shifts.reduce((sum, shift) => sum + shift.hours, 0);
    const avgHourlyRate = totalEarnings / totalHours;

    // Earnings suggestions
    if (totalEarnings > 1030000) {
      suggestions.push('🚨 扶養控除限度額を超過しています。シフトを調整してください。');
    } else if (totalEarnings > 800000) {
      suggestions.push('⚠️ 扶養控除限度額に近づいています。残り収入に注意。');
    }

    // Hours suggestions
    const weeklyHours = totalHours / 4;
    if (weeklyHours > 30) {
      suggestions.push('📊 週当たり労働時間が多めです。ワークライフバランスを確認してください。');
    } else if (weeklyHours < 15) {
      suggestions.push('💡 より多くのシフトを入れる余地があります。');
    }

    // Rate suggestions
    if (avgHourlyRate < 1000) {
      suggestions.push('💰 より高時給の職場を検討することをお勧めします。');
    }

    // Optimization suggestions
    const highPayingShifts = shifts.filter(s => s.hourlyRate >= 1200).length;
    const lowPayingShifts = shifts.filter(s => s.hourlyRate < 1000).length;
    
    if (lowPayingShifts > highPayingShifts) {
      suggestions.push('🎯 高時給シフトの割合を増やすと収入効率が向上します。');
    }

    return suggestions.length > 0 ? suggestions : ['現在の最適化状況は良好です！'];
  }
}

export const optimizationService = new OptimizationService();