import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateRequest, requireAuth } from '../middleware/validation';
import { CalculateDeductionSchema, ProjectIncomeSchema } from '../types/api';
import { FuyouCalculationService } from '../services/calculationService';
import { supabase } from '../utils/supabase';

const router = Router();

// POST /api/calculations/deduction
router.post(
  '/deduction',
  requireAuth,
  validateRequest(CalculateDeductionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { year, includeProjections } = req.body;

    // ユーザーの基本情報取得
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('is_student, created_at')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      return res.status(404).json({
        success: false,
        error: { message: 'User profile not found' }
      });
    }

    // 指定年の収入データ取得
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    const { data: incomes, error: incomeError } = await supabase
      .from('incomes')
      .select('*')
      .eq('user_id', userId)
      .gte('income_date', startDate)
      .lte('income_date', endDate)
      .order('income_date', { ascending: true });

    if (incomeError) {
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to retrieve income data' }
      });
    }

    // 総収入計算
    const totalIncome = incomes?.reduce((sum, income) => sum + income.amount, 0) || 0;
    
    // 年齢計算（簡易的に現在年齢を使用）
    const age = 20; // TODO: ユーザープロフィールに生年月日を追加して正確な年齢を計算
    
    // 現在の月（年末予測用）
    const currentMonth = new Date().getMonth() + 1;
    const calculationMonth = year === new Date().getFullYear() ? currentMonth : 12;

    // 扶養計算実行
    const calculation = FuyouCalculationService.calculateFuyouStatus({
      totalIncome,
      age,
      isStudent: userProfile.is_student,
      year,
      currentMonth: calculationMonth,
    });

    // 収入統計計算
    const incomeStats = FuyouCalculationService.calculateIncomeStats(incomes || [], year);

    res.json({
      success: true,
      data: {
        calculation,
        incomeStats,
        includeProjections,
      },
    });
  })
);

// GET /api/calculations/tax-brackets
router.get(
  '/tax-brackets',
  asyncHandler(async (req: Request, res: Response) => {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    // 税制区分情報を返す
    const taxBrackets = {
      year,
      brackets: [
        {
          name: 'basic_limit',
          description: '基本扶養控除限度額',
          amount: year >= 2025 ? 1230000 : 1030000,
          applicableAge: '16歳以上',
        },
        {
          name: 'special_limit_student',
          description: '特定親族特別控除（学生）',
          amount: year >= 2025 ? 1500000 : 1030000,
          applicableAge: '19-22歳の学生',
        },
        {
          name: 'resident_tax',
          description: '住民税課税最低限',
          amount: year >= 2026 ? 1100000 : 1000000,
          note: '2026年から110万円に変更',
        },
        {
          name: 'social_insurance_106',
          description: '社会保険の壁（106万円）',
          amount: 1060000,
          note: '勤務先の社会保険加入対象',
        },
        {
          name: 'social_insurance_130',
          description: '社会保険の壁（130万円）',
          amount: 1300000,
          note: '扶養から外れ、国民健康保険等の加入が必要',
        },
      ],
    };

    res.json({
      success: true,
      data: taxBrackets,
    });
  })
);

// POST /api/calculations/projection
router.post(
  '/projection',
  requireAuth,
  validateRequest(ProjectIncomeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { targetAmount, projectionMonths = 12 } = req.body;

    // 過去の収入データから傾向を分析
    const { data: recentIncomes, error } = await supabase
      .from('incomes')
      .select('*')
      .eq('user_id', userId)
      .gte('income_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order('income_date', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to retrieve income data for projection' }
      });
    }

    // 月平均収入計算
    const totalRecentIncome = recentIncomes?.reduce((sum, income) => sum + income.amount, 0) || 0;
    const monthsOfData = Math.min(3, Math.max(1, (recentIncomes?.length || 1) / 4)); // 概算
    const averageMonthlyIncome = totalRecentIncome / monthsOfData;

    // 将来予測
    const projectedIncome = averageMonthlyIncome * projectionMonths;
    
    // 目標金額との比較
    const projectionAnalysis = {
      averageMonthlyIncome: Math.round(averageMonthlyIncome),
      projectedIncome: Math.round(projectedIncome),
      targetAmount: targetAmount || 1230000,
      projectionMonths,
      isOnTrack: targetAmount ? projectedIncome <= targetAmount : true,
      recommendedMonthlyLimit: targetAmount ? Math.floor(targetAmount / projectionMonths) : null,
      adjustmentNeeded: targetAmount && projectedIncome > targetAmount 
        ? Math.round((projectedIncome - targetAmount) / projectionMonths)
        : 0,
    };

    res.json({
      success: true,
      data: projectionAnalysis,
    });
  })
);

export { router as calculationRoutes };