import { supabase } from '../utils/supabase';
import { logger } from '../utils/logger';

export interface FuyouLimit {
  type: string;
  amount: number;
  description: string;
  applicableConditions: string[];
}

export interface FuyouCalculationResult {
  currentIncome: number;
  applicableLimits: FuyouLimit[];
  recommendedLimit: FuyouLimit;
  remainingAmount: number;
  usageRate: number;
  monthlyTarget: number;
  riskLevel: 'safe' | 'caution' | 'danger';
  projectedYearEndIncome: number;
  monthsRemaining: number;
  alerts: string[];
}

export interface IncomeProjection {
  currentMonthly: number;
  projectedYearEnd: number;
  confidenceLevel: number;
  suggestions: string[];
}

// 2025年扶養制度の限度額定義
const FUYOU_LIMITS_2025: FuyouLimit[] = [
  {
    type: 'student_special',
    amount: 1500000, // 150万円（学生特定扶養控除）
    description: '学生特定扶養控除',
    applicableConditions: ['学生', '18-25歳', '親の扶養対象']
  },
  {
    type: 'basic_fuyou',
    amount: 1230000, // 123万円（基本扶養控除）
    description: '基本扶養控除',
    applicableConditions: ['親の扶養対象', '配偶者扶養なし']
  },
  {
    type: 'spouse_special',
    amount: 1600000, // 160万円（配偶者特別控除）
    description: '配偶者特別控除',
    applicableConditions: ['配偶者', '世帯主の扶養対象']
  },
  {
    type: 'social_insurance',
    amount: 1300000, // 130万円（社会保険扶養）
    description: '社会保険扶養（変更なし）',
    applicableConditions: ['健康保険扶養', '年金扶養']
  }
];

export class EnhancedCalculationService {
  
  async calculateEnhancedDeduction(
    userId: string, 
    year?: number,
    userProfile?: {
      isStudent: boolean;
      age: number;
      isMarried: boolean;
      hasSpouse: boolean;
    }
  ): Promise<FuyouCalculationResult> {
    try {
      const currentYear = year || new Date().getFullYear();
      
      // 年間収入を取得
      const currentIncome = await this.getCurrentYearIncome(userId, currentYear);
      
      // ユーザープロファイルに基づいて適用可能な限度額を決定
      const applicableLimits = this.getApplicableLimits(userProfile);
      
      // 推奨限度額を決定（最も有利なもの）
      const recommendedLimit = applicableLimits[0]; // 最初のものが最も高い限度額
      
      // 計算結果
      const remainingAmount = Math.max(0, recommendedLimit.amount - currentIncome);
      const usageRate = Math.min(1, currentIncome / recommendedLimit.amount);
      
      // 月別の目標計算
      const currentMonth = new Date().getMonth() + 1;
      const monthsRemaining = 12 - currentMonth;
      const monthlyTarget = monthsRemaining > 0 ? remainingAmount / monthsRemaining : 0;
      
      // 年末予測収入計算
      const projectedYearEndIncome = await this.calculateProjectedIncome(userId, currentYear);
      
      // リスクレベル判定
      const riskLevel = this.calculateRiskLevel(usageRate, projectedYearEndIncome / recommendedLimit.amount);
      
      // アラート生成
      const alerts = this.generateAlerts(currentIncome, recommendedLimit, projectedYearEndIncome, monthsRemaining);
      
      return {
        currentIncome,
        applicableLimits,
        recommendedLimit,
        remainingAmount,
        usageRate,
        monthlyTarget,
        riskLevel,
        projectedYearEndIncome,
        monthsRemaining,
        alerts
      };
      
    } catch (error) {
      logger.error('Enhanced calculation error:', error);
      throw new Error('扶養計算でエラーが発生しました');
    }
  }
  
  private async getCurrentYearIncome(userId: string, year: number): Promise<number> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    const { data: incomes, error } = await supabase
      .from('incomes')
      .select('amount')
      .eq('user_id', userId)
      .gte('income_date', startDate)
      .lte('income_date', endDate);
    
    if (error) {
      logger.error('Income fetch error:', error);
      return 0;
    }
    
    return (incomes || []).reduce((total, income) => total + income.amount, 0);
  }
  
  private getApplicableLimits(userProfile?: {
    isStudent: boolean;
    age: number;
    isMarried: boolean;
    hasSpouse: boolean;
  }): FuyouLimit[] {
    
    // デフォルトプロファイル（学生を想定）
    const profile = userProfile || {
      isStudent: true,
      age: 20,
      isMarried: false,
      hasSpouse: false
    };
    
    let applicable: FuyouLimit[] = [];
    
    // 学生特定扶養控除（最優先）
    if (profile.isStudent && profile.age >= 18 && profile.age <= 25) {
      applicable.push(FUYOU_LIMITS_2025.find(l => l.type === 'student_special')!);
    }
    
    // 配偶者特別控除
    if (profile.isMarried && profile.hasSpouse) {
      applicable.push(FUYOU_LIMITS_2025.find(l => l.type === 'spouse_special')!);
    }
    
    // 基本扶養控除
    applicable.push(FUYOU_LIMITS_2025.find(l => l.type === 'basic_fuyou')!);
    
    // 社会保険扶養（常に適用可能だが制限が厳しい）
    applicable.push(FUYOU_LIMITS_2025.find(l => l.type === 'social_insurance')!);
    
    // 限度額の高い順にソート
    return applicable.sort((a, b) => b.amount - a.amount);
  }
  
  private async calculateProjectedIncome(userId: string, year: number): Promise<number> {
    const currentMonth = new Date().getMonth() + 1;
    
    // 過去3ヶ月の平均月収を計算
    const { data: recentIncomes, error } = await supabase
      .from('incomes')
      .select('amount, income_date')
      .eq('user_id', userId)
      .gte('income_date', `${year}-${String(Math.max(1, currentMonth - 2)).padStart(2, '0')}-01`)
      .lt('income_date', `${year}-${String(currentMonth + 1).padStart(2, '0')}-01`);
    
    if (error || !recentIncomes || recentIncomes.length === 0) {
      // データがない場合は現在の収入をベースに予測
      const currentIncome = await this.getCurrentYearIncome(userId, year);
      return currentMonth > 0 ? (currentIncome / currentMonth) * 12 : currentIncome;
    }
    
    // 月別収入を集計
    const monthlyIncomes = new Map<number, number>();
    
    for (const income of recentIncomes) {
      const month = new Date(income.income_date).getMonth() + 1;
      monthlyIncomes.set(month, (monthlyIncomes.get(month) || 0) + income.amount);
    }
    
    // 平均月収を計算
    const avgMonthlyIncome = Array.from(monthlyIncomes.values())
      .reduce((sum, amount) => sum + amount, 0) / monthlyIncomes.size;
    
    // 年末までの予測
    const currentIncome = await this.getCurrentYearIncome(userId, year);
    const monthsRemaining = 12 - currentMonth;
    
    return currentIncome + (avgMonthlyIncome * monthsRemaining);
  }
  
  private calculateRiskLevel(
    currentUsageRate: number, 
    projectedUsageRate: number
  ): 'safe' | 'caution' | 'danger' {
    
    // 予測使用率を基準にリスクレベルを判定
    if (projectedUsageRate <= 0.7) {
      return 'safe';
    } else if (projectedUsageRate <= 0.9) {
      return 'caution';
    } else {
      return 'danger';
    }
  }
  
  private generateAlerts(
    currentIncome: number,
    recommendedLimit: FuyouLimit,
    projectedIncome: number,
    monthsRemaining: number
  ): string[] {
    const alerts: string[] = [];
    
    const currentUsageRate = currentIncome / recommendedLimit.amount;
    const projectedUsageRate = projectedIncome / recommendedLimit.amount;
    
    // 現在の使用率アラート
    if (currentUsageRate > 0.8) {
      alerts.push(`現在の収入が扶養限度額の${Math.round(currentUsageRate * 100)}%に達しています`);
    }
    
    // 予測超過アラート
    if (projectedUsageRate > 1.0) {
      const excessAmount = projectedIncome - recommendedLimit.amount;
      alerts.push(`このペースでは年末に${Math.round(excessAmount).toLocaleString()}円超過の可能性があります`);
    }
    
    // 月次目標アラート
    if (monthsRemaining > 0) {
      const monthlyLimit = (recommendedLimit.amount - currentIncome) / monthsRemaining;
      if (monthlyLimit < 50000) {
        alerts.push(`残り${monthsRemaining}ヶ月で月平均${Math.round(monthlyLimit).toLocaleString()}円以下に抑える必要があります`);
      }
    }
    
    // 制度変更お知らせ
    if (recommendedLimit.type === 'student_special') {
      alerts.push('2025年から学生特定扶養控除が150万円に拡大されました！');
    }
    
    return alerts;
  }
  
  // 労働時間最適化提案
  async generateWorkingOptimization(
    userId: string,
    hourlyRate: number = 1000 // デフォルト時給
  ): Promise<{
    maxMonthlyHours: number;
    maxMonthlyIncome: number;
    recommendations: string[];
  }> {
    
    const calculation = await this.calculateEnhancedDeduction(userId);
    const monthlyLimit = calculation.monthlyTarget;
    const maxMonthlyHours = Math.floor(monthlyLimit / hourlyRate);
    
    const recommendations: string[] = [];
    
    if (maxMonthlyHours < 40) {
      recommendations.push('週1-2回のシフトがおすすめです');
    } else if (maxMonthlyHours < 80) {
      recommendations.push('週2-3回のシフトで働けます');
    } else {
      recommendations.push('週3-4回のシフトも可能です');
    }
    
    if (calculation.riskLevel === 'caution') {
      recommendations.push('今月はシフトを少し減らすことをおすすめします');
    } else if (calculation.riskLevel === 'danger') {
      recommendations.push('今月は新たなシフトを入れないことをおすすめします');
    }
    
    return {
      maxMonthlyHours,
      maxMonthlyIncome: monthlyLimit,
      recommendations
    };
  }
  
  // バイト先別分析
  async analyzeIncomeBySource(userId: string, year?: number): Promise<{
    bySource: Array<{
      source: string;
      amount: number;
      percentage: number;
      riskContribution: number;
    }>;
    totalIncome: number;
    diversificationScore: number;
  }> {
    
    const currentYear = year || new Date().getFullYear();
    const startDate = `${currentYear}-01-01`;
    const endDate = `${currentYear}-12-31`;
    
    const { data: incomes, error } = await supabase
      .from('incomes')
      .select('amount, source')
      .eq('user_id', userId)
      .gte('income_date', startDate)
      .lte('income_date', endDate);
    
    if (error || !incomes) {
      throw new Error('収入データの取得に失敗しました');
    }
    
    // バイト先別に集計
    const sourceMap = new Map<string, number>();
    let totalIncome = 0;
    
    for (const income of incomes) {
      sourceMap.set(income.source, (sourceMap.get(income.source) || 0) + income.amount);
      totalIncome += income.amount;
    }
    
    // 結果を生成
    const bySource = Array.from(sourceMap.entries()).map(([source, amount]) => ({
      source,
      amount,
      percentage: totalIncome > 0 ? amount / totalIncome : 0,
      riskContribution: amount // リスク貢献度（後で使用）
    })).sort((a, b) => b.amount - a.amount);
    
    // 多様化スコア計算（収入源の分散度）
    const diversificationScore = bySource.length > 1 
      ? 1 - Math.max(...bySource.map(s => s.percentage))
      : 0;
    
    return {
      bySource,
      totalIncome,
      diversificationScore
    };
  }
}