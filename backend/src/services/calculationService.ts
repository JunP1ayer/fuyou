import { IncomeResponse } from '../types/api';

// 2025年税制改正対応の扶養控除計算サービス
export class FuyouCalculationService {
  // 2025年税制改正後の基準
  private static readonly TAX_BRACKETS_2025 = {
    BASIC_LIMIT: 1230000,          // 123万円（基礎控除48万円→58万円 + 給与所得控除55万円→65万円）
    SPECIAL_LIMIT_STUDENT: 1500000, // 150万円（特定親族特別控除）
    GRADUATED_REDUCTION_START: 1500000, // 150万円
    GRADUATED_REDUCTION_END: 1880000,   // 188万円
    RESIDENT_TAX_2025: 1000000,    // 100万円（2025年まで）
    RESIDENT_TAX_2026: 1100000,    // 110万円（2026年から）
    SOCIAL_INSURANCE_106: 1060000,  // 106万円の壁
    SOCIAL_INSURANCE_130: 1300000,  // 130万円の壁
  };

  // 年齢による扶養控除種類の判定
  private static readonly AGE_BRACKETS = {
    GENERAL_MIN: 16,               // 一般扶養控除
    SPECIAL_MIN: 19,               // 特定扶養控除
    SPECIAL_MAX: 22,               // 特定扶養控除上限
    ELDERLY_MIN: 70,               // 老人扶養控除
  };

  /**
   * 扶養控除計算のメイン関数
   */
  static calculateFuyouStatus(params: {
    totalIncome: number;
    age: number;
    isStudent: boolean;
    year: number;
    currentMonth?: number;
  }) {
    const { totalIncome, age, isStudent, year, currentMonth = 12 } = params;

    // 年齢による扶養控除種類の判定
    const dependentType = this.getDependentType(age);
    
    // 適用される限度額の決定
    const applicableLimit = this.getApplicableLimit(age, isStudent, year);
    
    // 扶養控除額の計算
    const deductionAmount = this.calculateDeductionAmount(totalIncome, applicableLimit, dependentType);
    
    // 住民税の判定
    const residentTaxStatus = this.calculateResidentTaxStatus(totalIncome, year);
    
    // 社会保険の判定
    const socialInsuranceStatus = this.calculateSocialInsuranceStatus(totalIncome);
    
    // 年末予測（月次収入がある場合）
    const yearEndProjection = currentMonth < 12 
      ? this.projectYearEndIncome(totalIncome, currentMonth)
      : totalIncome;

    // アラート判定
    const alerts = this.generateAlerts(totalIncome, applicableLimit, yearEndProjection);

    return {
      totalIncome,
      applicableLimit,
      remainingAmount: Math.max(0, applicableLimit - totalIncome),
      deductionAmount,
      dependentType,
      isEligibleForDeduction: totalIncome <= applicableLimit,
      overageAmount: Math.max(0, totalIncome - applicableLimit),
      residentTaxStatus,
      socialInsuranceStatus,
      yearEndProjection,
      alerts,
      calculationDate: new Date().toISOString(),
      taxYear: year,
    };
  }

  /**
   * 年齢による扶養控除種類の判定
   */
  private static getDependentType(age: number): string {
    if (age < this.AGE_BRACKETS.GENERAL_MIN) return 'ineligible';
    if (age >= this.AGE_BRACKETS.ELDERLY_MIN) return 'elderly';
    if (age >= this.AGE_BRACKETS.SPECIAL_MIN && age <= this.AGE_BRACKETS.SPECIAL_MAX) return 'special';
    return 'general';
  }

  /**
   * 適用される限度額の決定（2025年税制改正対応）
   */
  private static getApplicableLimit(age: number, isStudent: boolean, year: number): number {
    // 2025年以降の新制度
    if (year >= 2025) {
      // 19-22歳の学生は特定親族特別控除で150万円まで
      if (isStudent && age >= this.AGE_BRACKETS.SPECIAL_MIN && age <= this.AGE_BRACKETS.SPECIAL_MAX) {
        return this.TAX_BRACKETS_2025.SPECIAL_LIMIT_STUDENT;
      }
      // その他は123万円
      return this.TAX_BRACKETS_2025.BASIC_LIMIT;
    }
    
    // 2024年以前は103万円
    return 1030000;
  }

  /**
   * 扶養控除額の計算（段階的減額対応）
   */
  private static calculateDeductionAmount(income: number, limit: number, dependentType: string): number {
    // 基本控除額
    const baseDeduction = this.getBaseDeductionAmount(dependentType);
    
    // 限度額以下の場合は満額控除
    if (income <= limit) {
      return baseDeduction;
    }
    
    // 150万円～188万円の段階的減額（特定親族特別控除の場合）
    if (limit === this.TAX_BRACKETS_2025.SPECIAL_LIMIT_STUDENT) {
      return this.calculateGraduatedReduction(income, baseDeduction);
    }
    
    // 限度額超過の場合は控除なし
    return 0;
  }

  /**
   * 段階的減額の計算（150万円～188万円）
   */
  private static calculateGraduatedReduction(income: number, baseDeduction: number): number {
    const { GRADUATED_REDUCTION_START, GRADUATED_REDUCTION_END } = this.TAX_BRACKETS_2025;
    
    if (income <= GRADUATED_REDUCTION_START) {
      return baseDeduction;
    }
    
    if (income >= GRADUATED_REDUCTION_END) {
      return 0;
    }
    
    // 線形減額計算
    const reductionRange = GRADUATED_REDUCTION_END - GRADUATED_REDUCTION_START;
    const incomeOverStart = income - GRADUATED_REDUCTION_START;
    const reductionRatio = incomeOverStart / reductionRange;
    
    return Math.round(baseDeduction * (1 - reductionRatio));
  }

  /**
   * 基本控除額の取得
   */
  private static getBaseDeductionAmount(dependentType: string): number {
    switch (dependentType) {
      case 'special': return 630000;   // 特定扶養控除 63万円
      case 'elderly': return 580000;   // 老人扶養控除 58万円
      case 'general': return 380000;   // 一般扶養控除 38万円
      default: return 0;
    }
  }

  /**
   * 住民税ステータスの計算
   */
  private static calculateResidentTaxStatus(income: number, year: number) {
    const threshold = year >= 2026 
      ? this.TAX_BRACKETS_2025.RESIDENT_TAX_2026 
      : this.TAX_BRACKETS_2025.RESIDENT_TAX_2025;
    
    return {
      threshold,
      isSubject: income > threshold,
      estimatedTax: income > threshold ? this.estimateResidentTax(income, threshold) : 0,
    };
  }

  /**
   * 住民税の概算計算
   */
  private static estimateResidentTax(income: number, threshold: number): number {
    const taxableIncome = income - threshold;
    // 住民税率約10%（所得割）+ 均等割約5000円
    return Math.round(taxableIncome * 0.1 + 5000);
  }

  /**
   * 社会保険ステータスの計算
   */
  private static calculateSocialInsuranceStatus(income: number) {
    return {
      wall106: {
        threshold: this.TAX_BRACKETS_2025.SOCIAL_INSURANCE_106,
        isSubject: income > this.TAX_BRACKETS_2025.SOCIAL_INSURANCE_106,
        description: '勤務先の社会保険加入対象',
      },
      wall130: {
        threshold: this.TAX_BRACKETS_2025.SOCIAL_INSURANCE_130,
        isSubject: income > this.TAX_BRACKETS_2025.SOCIAL_INSURANCE_130,
        description: '扶養から外れ、国民健康保険・国民年金加入必要',
      },
    };
  }

  /**
   * 年末収入予測
   */
  private static projectYearEndIncome(currentIncome: number, currentMonth: number): number {
    const monthlyAverage = currentIncome / currentMonth;
    return Math.round(monthlyAverage * 12);
  }

  /**
   * アラート生成
   */
  private static generateAlerts(currentIncome: number, limit: number, projectedIncome: number) {
    const alerts: Array<{type: string, message: string, severity: 'low' | 'medium' | 'high'}> = [];
    
    // 現在収入による警告
    const currentRatio = currentIncome / limit;
    if (currentRatio > 0.9) {
      alerts.push({
        type: 'income_limit_warning',
        message: '扶養限度額の90%を超過しています',
        severity: 'high'
      });
    } else if (currentRatio > 0.8) {
      alerts.push({
        type: 'income_limit_caution',
        message: '扶養限度額の80%に達しています',
        severity: 'medium'
      });
    }
    
    // 年末予測による警告
    if (projectedIncome > limit) {
      alerts.push({
        type: 'year_end_projection_warning',
        message: '現在のペースでは年末に扶養限度額を超過する見込みです',
        severity: 'high'
      });
    }
    
    // 社会保険の壁に関する警告
    if (currentIncome > this.TAX_BRACKETS_2025.SOCIAL_INSURANCE_106) {
      alerts.push({
        type: 'social_insurance_106_warning',
        message: '106万円の壁を超過しました（勤務先の社会保険加入対象）',
        severity: 'medium'
      });
    }
    
    if (currentIncome > this.TAX_BRACKETS_2025.SOCIAL_INSURANCE_130) {
      alerts.push({
        type: 'social_insurance_130_warning',
        message: '130万円の壁を超過しました（扶養から外れます）',
        severity: 'high'
      });
    }
    
    return alerts;
  }

  /**
   * 年間収入統計の計算
   */
  static calculateIncomeStats(incomes: IncomeResponse[], year: number) {
    const yearIncomes = incomes.filter(income => 
      new Date(income.incomeDate).getFullYear() === year
    );
    
    const totalIncome = yearIncomes.reduce((sum, income) => sum + income.amount, 0);
    
    const monthlyBreakdown = this.calculateMonthlyBreakdown(yearIncomes);
    const sourceBreakdown = this.calculateSourceBreakdown(yearIncomes);
    
    return {
      totalIncome,
      averageMonthlyIncome: totalIncome / 12,
      incomeCount: yearIncomes.length,
      monthlyBreakdown,
      sourceBreakdown,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * 月別収入分析
   */
  private static calculateMonthlyBreakdown(incomes: IncomeResponse[]) {
    const monthly = new Array(12).fill(0);
    
    incomes.forEach(income => {
      const month = new Date(income.incomeDate).getMonth();
      monthly[month] += income.amount;
    });
    
    return monthly.map((amount, index) => ({
      month: index + 1,
      amount,
      monthName: new Date(2024, index).toLocaleDateString('ja-JP', { month: 'long' })
    }));
  }

  /**
   * 収入源別分析
   */
  private static calculateSourceBreakdown(incomes: IncomeResponse[]) {
    return incomes.reduce((acc, income) => {
      acc[income.source] = (acc[income.source] || 0) + income.amount;
      return acc;
    }, {} as Record<string, number>);
  }
}