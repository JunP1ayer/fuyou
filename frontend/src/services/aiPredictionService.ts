// 🧠 AI予測サービス - 高度な収入予測・シフト最適化

import { logger, LogCategory } from '../utils/logger';
import { useUnifiedStore } from '../store/unifiedStore';
import type { Shift, Workplace } from '../store/unifiedStore';

// AI予測結果の型定義
export interface IncomePrediction {
  monthly: {
    predicted: number;
    confidence: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    factors: string[];
  };
  yearly: {
    predicted: number;
    confidence: number;
    riskLevel: 'safe' | 'warning' | 'danger';
    recommendedActions: string[];
  };
  nextMonth: {
    suggestedShifts: SuggestedShift[];
    maxEarnings: number;
    optimalSchedule: OptimalSchedule;
  };
}

export interface SuggestedShift {
  date: string;
  startTime: string;
  endTime: string;
  workplaceId: string;
  expectedEarnings: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface OptimalSchedule {
  totalHours: number;
  totalEarnings: number;
  workLifeBalance: number; // 1-10スコア
  riskScore: number; // 扶養控除リスク 0-100%
  recommendations: {
    type: 'increase' | 'decrease' | 'maintain' | 'redistribute';
    message: string;
    impact: number;
  }[];
}

// 機械学習モデルのシミュレーション
class SimplePredictionModel {
  // 過去データに基づく線形回帰（簡略版）
  predictTrend(shifts: Shift[]): { slope: number; intercept: number; r2: number } {
    if (shifts.length < 3) {
      return { slope: 0, intercept: 0, r2: 0 };
    }

    // 月別収入データを準備
    const monthlyData = this.aggregateMonthlyEarnings(shifts);
    const n = monthlyData.length;
    
    if (n < 2) {
      return { slope: 0, intercept: 0, r2: 0 };
    }

    // 線形回帰計算
    const xMean = monthlyData.reduce((sum, _, i) => sum + i, 0) / n;
    const yMean = monthlyData.reduce((sum, d) => sum + d.earnings, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = i - xMean;
      const yDiff = monthlyData[i].earnings - yMean;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
    }
    
    const slope = denominator === 0 ? 0 : numerator / denominator;
    const intercept = yMean - slope * xMean;
    
    // R²値計算
    const yPred = monthlyData.map((_, i) => slope * i + intercept);
    const ssRes = monthlyData.reduce((sum, d, i) => sum + Math.pow(d.earnings - yPred[i], 2), 0);
    const ssTot = monthlyData.reduce((sum, d) => sum + Math.pow(d.earnings - yMean, 2), 0);
    const r2 = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);
    
    return { slope, intercept, r2: Math.max(0, r2) };
  }

  private aggregateMonthlyEarnings(shifts: Shift[]): { month: string; earnings: number }[] {
    const monthlyMap = new Map<string, number>();
    
    shifts.forEach(shift => {
      const date = new Date(shift.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + shift.totalEarnings);
    });
    
    return Array.from(monthlyMap.entries())
      .map(([month, earnings]) => ({ month, earnings }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  // 季節性パターンの検出
  detectSeasonality(shifts: Shift[]): {
    hasSeasonality: boolean;
    peakMonths: number[];
    lowMonths: number[];
    seasonalityStrength: number;
  } {
    const monthlyAvg = new Array(12).fill(0);
    const monthlyCount = new Array(12).fill(0);
    
    shifts.forEach(shift => {
      const month = new Date(shift.date).getMonth();
      monthlyAvg[month] += shift.totalEarnings;
      monthlyCount[month]++;
    });
    
    // 平均計算
    monthlyAvg.forEach((sum, i) => {
      monthlyAvg[i] = monthlyCount[i] > 0 ? sum / monthlyCount[i] : 0;
    });
    
    const overallAvg = monthlyAvg.reduce((sum, avg) => sum + avg, 0) / 12;
    const variance = monthlyAvg.reduce((sum, avg) => sum + Math.pow(avg - overallAvg, 2), 0) / 12;
    const seasonalityStrength = Math.sqrt(variance) / overallAvg;
    
    // ピーク月と低調月の特定
    const peakMonths = monthlyAvg
      .map((avg, i) => ({ month: i, avg }))
      .filter(item => item.avg > overallAvg * 1.2)
      .map(item => item.month);
      
    const lowMonths = monthlyAvg
      .map((avg, i) => ({ month: i, avg }))
      .filter(item => item.avg < overallAvg * 0.8)
      .map(item => item.month);
    
    return {
      hasSeasonality: seasonalityStrength > 0.2,
      peakMonths,
      lowMonths,
      seasonalityStrength,
    };
  }

  // ワークプレース別パフォーマンス分析
  analyzeWorkplacePerformance(shifts: Shift[], workplaces: Workplace[]): {
    workplaceId: string;
    name: string;
    avgHourlyRate: number;
    totalHours: number;
    totalEarnings: number;
    efficiency: number; // 時間あたりの効率性
    consistency: number; // 勤務の安定性
    growthRate: number; // 収入成長率
    recommendation: 'focus' | 'maintain' | 'reduce' | 'eliminate';
  }[] {
    return workplaces.map(workplace => {
      const workplaceShifts = shifts.filter(shift => shift.workplaceId === workplace.id);
      
      if (workplaceShifts.length === 0) {
        return {
          workplaceId: workplace.id,
          name: workplace.name,
          avgHourlyRate: workplace.defaultHourlyRate,
          totalHours: 0,
          totalEarnings: 0,
          efficiency: 0,
          consistency: 0,
          growthRate: 0,
          recommendation: 'eliminate' as const,
        };
      }
      
      const totalHours = workplaceShifts.reduce((sum, shift) => sum + shift.actualWorkMinutes / 60, 0);
      const totalEarnings = workplaceShifts.reduce((sum, shift) => sum + shift.totalEarnings, 0);
      const avgHourlyRate = totalEarnings / totalHours;
      
      // 効率性：時給の市場平均との比較
      const marketAverage = 1000; // 基準時給
      const efficiency = avgHourlyRate / marketAverage;
      
      // 一貫性：シフトの規則性
      const shiftsPerMonth = workplaceShifts.length / Math.max(1, this.getMonthSpan(workplaceShifts));
      const consistency = Math.min(1, shiftsPerMonth / 8); // 月8回を100%とする
      
      // 成長率：時給の変化率
      const recentShifts = workplaceShifts.slice(-5);
      const earlyShifts = workplaceShifts.slice(0, 5);
      const recentAvgRate = recentShifts.reduce((sum, s) => sum + s.hourlyRate, 0) / recentShifts.length;
      const earlyAvgRate = earlyShifts.reduce((sum, s) => sum + s.hourlyRate, 0) / earlyShifts.length;
      const growthRate = earlyAvgRate > 0 ? (recentAvgRate - earlyAvgRate) / earlyAvgRate : 0;
      
      // レコメンデーション
      let recommendation: 'focus' | 'maintain' | 'reduce' | 'eliminate';
      if (efficiency > 1.2 && consistency > 0.7) {
        recommendation = 'focus';
      } else if (efficiency > 0.9 && consistency > 0.5) {
        recommendation = 'maintain';
      } else if (efficiency > 0.7) {
        recommendation = 'reduce';
      } else {
        recommendation = 'eliminate';
      }
      
      return {
        workplaceId: workplace.id,
        name: workplace.name,
        avgHourlyRate,
        totalHours,
        totalEarnings,
        efficiency,
        consistency,
        growthRate,
        recommendation,
      };
    });
  }

  private getMonthSpan(shifts: Shift[]): number {
    if (shifts.length === 0) return 1;
    
    const dates = shifts.map(shift => new Date(shift.date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    return Math.max(1, (maxDate.getFullYear() - minDate.getFullYear()) * 12 + 
                     (maxDate.getMonth() - minDate.getMonth()) + 1);
  }
}

// AIサービスクラス
export class AIPredictionService {
  private model: SimplePredictionModel;
  private static instance: AIPredictionService;

  private constructor() {
    this.model = new SimplePredictionModel();
  }

  static getInstance(): AIPredictionService {
    if (!AIPredictionService.instance) {
      AIPredictionService.instance = new AIPredictionService();
    }
    return AIPredictionService.instance;
  }

  async predictIncome(
    shifts: Shift[], 
    workplaces: Workplace[], 
    targetLimits: { taxAnnual: number; socialAnnual: number }
  ): Promise<IncomePrediction> {
    const performanceTimer = logger.startPerformanceTimer('AI Income Prediction');
    
    try {
      // 1. トレンド分析
      const trend = this.model.predictTrend(shifts);
      const seasonality = this.model.detectSeasonality(shifts);
      const workplacePerformance = this.model.analyzeWorkplacePerformance(shifts, workplaces);
      
      // 2. 月間予測
      const currentMonthEarnings = this.getCurrentMonthEarnings(shifts);
      const monthlyPredicted = Math.max(0, trend.slope + trend.intercept);
      const monthlyConfidence = Math.min(0.95, Math.max(0.1, trend.r2));
      
      // 3. 年間予測
      const yearlyEarnings = this.getYearlyEarnings(shifts);
      const remainingMonths = 12 - new Date().getMonth();
      const yearlyPredicted = yearlyEarnings + (monthlyPredicted * remainingMonths);
      
      // 4. リスクレベル計算
      const riskLevel = this.calculateRiskLevel(yearlyPredicted, targetLimits.taxAnnual);
      
      // 5. 次月のシフト提案
      const suggestedShifts = this.generateShiftSuggestions(
        workplacePerformance, 
        monthlyPredicted,
        targetLimits
      );
      
      // 6. 最適スケジュール生成
      const optimalSchedule = this.generateOptimalSchedule(
        suggestedShifts,
        targetLimits,
        seasonality
      );
      
      const prediction: IncomePrediction = {
        monthly: {
          predicted: Math.round(monthlyPredicted),
          confidence: Math.round(monthlyConfidence * 100) / 100,
          trend: trend.slope > 50 ? 'increasing' : trend.slope < -50 ? 'decreasing' : 'stable',
          factors: this.identifyTrendFactors(trend, seasonality, workplacePerformance),
        },
        yearly: {
          predicted: Math.round(yearlyPredicted),
          confidence: Math.round(monthlyConfidence * 0.8 * 100) / 100, // 年間は確信度低下
          riskLevel,
          recommendedActions: this.generateRecommendations(riskLevel, yearlyPredicted, targetLimits),
        },
        nextMonth: {
          suggestedShifts: suggestedShifts.slice(0, 12), // 上位12件
          maxEarnings: suggestedShifts.reduce((sum, shift) => sum + shift.expectedEarnings, 0),
          optimalSchedule,
        },
      };
      
      performanceTimer();
      
      logger.info(LogCategory.API, 'Income prediction completed', {
        monthlyPredicted: prediction.monthly.predicted,
        yearlyPredicted: prediction.yearly.predicted,
        riskLevel: prediction.yearly.riskLevel,
        suggestedShiftsCount: prediction.nextMonth.suggestedShifts.length,
      });
      
      return prediction;
      
    } catch (error) {
      performanceTimer();
      logger.error(LogCategory.API, 'Income prediction failed', error as Error);
      throw error;
    }
  }

  private getCurrentMonthEarnings(shifts: Shift[]): number {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    return shifts
      .filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate.getFullYear() === currentYear && shiftDate.getMonth() === currentMonth;
      })
      .reduce((sum, shift) => sum + shift.totalEarnings, 0);
  }

  private getYearlyEarnings(shifts: Shift[]): number {
    const currentYear = new Date().getFullYear();
    
    return shifts
      .filter(shift => new Date(shift.date).getFullYear() === currentYear)
      .reduce((sum, shift) => sum + shift.totalEarnings, 0);
  }

  private calculateRiskLevel(predictedYearly: number, annualLimit: number): 'safe' | 'warning' | 'danger' {
    const ratio = predictedYearly / annualLimit;
    
    if (ratio > 0.95) return 'danger';
    if (ratio > 0.8) return 'warning';
    return 'safe';
  }

  private generateShiftSuggestions(
    workplacePerformance: any[],
    targetMonthly: number,
    limits: { taxAnnual: number; socialAnnual: number }
  ): SuggestedShift[] {
    const suggestions: SuggestedShift[] = [];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    // 高パフォーマンスのワークプレースを優先
    const topWorkplaces = workplacePerformance
      .filter(wp => wp.recommendation === 'focus' || wp.recommendation === 'maintain')
      .sort((a, b) => b.efficiency - a.efficiency);
    
    // 月の各週に対してシフトを提案
    for (let week = 0; week < 4; week++) {
      for (let day = 0; day < 7; day++) {
        if (suggestions.length >= 20) break; // 最大20件
        
        const date = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), week * 7 + day + 1);
        if (date.getMonth() !== nextMonth.getMonth()) continue;
        
        // 週末と平日で異なる提案
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const workplace = topWorkplaces[day % topWorkplaces.length];
        
        if (!workplace) continue;
        
        // シフト時間の提案
        const startHour = isWeekend ? 9 : 17; // 平日は夕方、週末は朝
        const duration = isWeekend ? 8 : 5; // 週末は長時間、平日は短時間
        
        const startTime = `${String(startHour).padStart(2, '0')}:00`;
        const endTime = `${String(startHour + duration).padStart(2, '0')}:00`;
        const expectedEarnings = workplace.avgHourlyRate * duration;
        
        suggestions.push({
          date: date.toISOString().split('T')[0],
          startTime,
          endTime,
          workplaceId: workplace.workplaceId,
          expectedEarnings,
          priority: workplace.recommendation === 'focus' ? 'high' : 'medium',
          reason: this.generateShiftReason(workplace, isWeekend, expectedEarnings),
        });
      }
    }
    
    return suggestions.sort((a, b) => {
      const priorityScore = { high: 3, medium: 2, low: 1 };
      return priorityScore[b.priority] - priorityScore[a.priority] || 
             b.expectedEarnings - a.expectedEarnings;
    });
  }

  private generateShiftReason(workplace: any, isWeekend: boolean, expectedEarnings: number): string {
    const reasons = [];
    
    if (workplace.efficiency > 1.2) {
      reasons.push(`高時給（¥${Math.round(workplace.avgHourlyRate)}）`);
    }
    
    if (workplace.consistency > 0.8) {
      reasons.push('安定した勤務先');
    }
    
    if (workplace.growthRate > 0.1) {
      reasons.push('時給上昇トレンド');
    }
    
    if (isWeekend) {
      reasons.push('週末の長時間勤務可能');
    }
    
    if (expectedEarnings > 5000) {
      reasons.push('高収入見込み');
    }
    
    return reasons.join('、') || '勤務推奨';
  }

  private generateOptimalSchedule(
    suggestedShifts: SuggestedShift[],
    limits: { taxAnnual: number; socialAnnual: number },
    seasonality: any
  ): OptimalSchedule {
    const totalHours = suggestedShifts.reduce((sum, shift) => {
      const start = new Date(`2000-01-01T${shift.startTime}`);
      const end = new Date(`2000-01-01T${shift.endTime}`);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);
    
    const totalEarnings = suggestedShifts.reduce((sum, shift) => sum + shift.expectedEarnings, 0);
    
    // ワークライフバランススコア（週40時間以下を推奨）
    const weeklyHours = totalHours / 4.33; // 月の週数
    const workLifeBalance = Math.max(1, Math.min(10, 10 - Math.max(0, weeklyHours - 40) / 5));
    
    // リスクスコア（年間限度額との関係）
    const yearlyProjection = totalEarnings * 12;
    const riskScore = Math.min(100, (yearlyProjection / limits.taxAnnual) * 100);
    
    return {
      totalHours: Math.round(totalHours * 10) / 10,
      totalEarnings: Math.round(totalEarnings),
      workLifeBalance: Math.round(workLifeBalance * 10) / 10,
      riskScore: Math.round(riskScore),
      recommendations: this.generateScheduleRecommendations(totalEarnings, riskScore, workLifeBalance),
    };
  }

  private generateScheduleRecommendations(
    totalEarnings: number, 
    riskScore: number, 
    workLifeBalance: number
  ): OptimalSchedule['recommendations'] {
    const recommendations = [];
    
    if (riskScore > 80) {
      recommendations.push({
        type: 'decrease' as const,
        message: '扶養控除限度額に近づいています。シフトを減らすことを検討してください。',
        impact: Math.round((100 - riskScore) * 0.1),
      });
    }
    
    if (workLifeBalance < 5) {
      recommendations.push({
        type: 'reduce' as const,
        message: 'ワークライフバランスが悪化しています。勤務時間の調整を推奨します。',
        impact: Math.round((5 - workLifeBalance) * 2),
      });
    }
    
    if (riskScore < 60 && workLifeBalance > 7) {
      recommendations.push({
        type: 'increase' as const,
        message: '余裕があります。収入を増やす機会があります。',
        impact: Math.round((60 - riskScore) * 0.1),
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'maintain' as const,
        message: '現在のペースが最適です。このまま継続してください。',
        impact: 0,
      });
    }
    
    return recommendations;
  }

  private identifyTrendFactors(trend: any, seasonality: any, workplacePerformance: any[]): string[] {
    const factors = [];
    
    if (Math.abs(trend.slope) > 100) {
      factors.push(trend.slope > 0 ? '収入増加トレンド継続中' : '収入減少トレンド');
    }
    
    if (seasonality.hasSeasonality) {
      const currentMonth = new Date().getMonth();
      if (seasonality.peakMonths.includes(currentMonth)) {
        factors.push('繁忙期の影響');
      } else if (seasonality.lowMonths.includes(currentMonth)) {
        factors.push('閑散期の影響');
      }
    }
    
    const focusWorkplaces = workplacePerformance.filter(wp => wp.recommendation === 'focus');
    if (focusWorkplaces.length > 0) {
      factors.push(`${focusWorkplaces.length}件の高効率職場`);
    }
    
    const eliminateWorkplaces = workplacePerformance.filter(wp => wp.recommendation === 'eliminate');
    if (eliminateWorkplaces.length > 0) {
      factors.push(`${eliminateWorkplaces.length}件の低効率職場`);
    }
    
    return factors.length > 0 ? factors : ['履歴データが不足'];
  }

  private generateRecommendations(
    riskLevel: 'safe' | 'warning' | 'danger',
    predicted: number,
    limits: { taxAnnual: number; socialAnnual: number }
  ): string[] {
    const recommendations = [];
    
    switch (riskLevel) {
      case 'danger':
        recommendations.push('⚠️ 扶養控除限度額を超過する可能性が高いです');
        recommendations.push('📉 シフトを減らすか時給の低い職場に変更を検討');
        recommendations.push('📋 税理士への相談を推奨');
        break;
        
      case 'warning':
        recommendations.push('⚡ 扶養控除限度額に近づいています');
        recommendations.push('📊 月間収入を¥' + Math.round((limits.taxAnnual - predicted) / 12) + '以下に調整');
        recommendations.push('📅 年末調整の準備を開始');
        break;
        
      case 'safe':
        recommendations.push('✅ 安全な収入範囲です');
        recommendations.push('💪 収入増加の余地があります（年間¥' + Math.round(limits.taxAnnual - predicted) + '）');
        recommendations.push('🎯 効率的な職場での勤務時間増加を検討');
        break;
    }
    
    return recommendations;
  }
}

// シングルトンインスタンスのエクスポート
export const aiPredictionService = AIPredictionService.getInstance();