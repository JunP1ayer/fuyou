import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateRequest, validateQuery, requireAuth } from '../middleware/validation';
import { CreateIncomeSchema, UpdateIncomeSchema, GetIncomesSchema } from '../types/api';
import { supabase } from '../utils/supabase';
import { FuyouCalculationService } from '../services/calculationService';

const router = Router();

// GET /api/incomes
router.get(
  '/',
  requireAuth,
  validateQuery(GetIncomesSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { page, limit, startDate, endDate, source } = req.query as any;

    let query = supabase
      .from('incomes')
      .select('*')
      .eq('user_id', userId)
      .order('income_date', { ascending: false });

    // Date range filtering
    if (startDate) {
      query = query.gte('income_date', startDate);
    }
    if (endDate) {
      query = query.lte('income_date', endDate);
    }

    // Source filtering
    if (source) {
      query = query.eq('source', source);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: incomes, error, count } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to retrieve incomes' }
      });
    }

    res.json({
      success: true,
      data: incomes,
      meta: {
        total: count,
        page,
        limit,
      },
    });
  })
);

// POST /api/incomes
router.post(
  '/',
  requireAuth,
  validateRequest(CreateIncomeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { amount, source, description, incomeDate } = req.body;

    const { data: income, error } = await supabase
      .from('incomes')
      .insert([
        {
          user_id: userId,
          amount,
          source,
          description,
          income_date: incomeDate,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to create income record' }
      });
    }

    res.status(201).json({
      success: true,
      data: income,
    });
  })
);

// GET /api/incomes/:id
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const incomeId = req.params.id;

    const { data: income, error } = await supabase
      .from('incomes')
      .select('*')
      .eq('id', incomeId)
      .eq('user_id', userId)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: { message: 'Income record not found' }
      });
    }

    res.json({
      success: true,
      data: income,
    });
  })
);

// PUT /api/incomes/:id
router.put(
  '/:id',
  requireAuth,
  validateRequest(UpdateIncomeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const incomeId = req.params.id;
    const updateData = req.body;

    // First check if the income belongs to the user
    const { data: existingIncome, error: fetchError } = await supabase
      .from('incomes')
      .select('id')
      .eq('id', incomeId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingIncome) {
      return res.status(404).json({
        success: false,
        error: { message: 'Income record not found' }
      });
    }

    const { data: income, error } = await supabase
      .from('incomes')
      .update(updateData)
      .eq('id', incomeId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to update income record' }
      });
    }

    res.json({
      success: true,
      data: income,
    });
  })
);

// DELETE /api/incomes/:id
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const incomeId = req.params.id;

    // First check if the income belongs to the user
    const { data: existingIncome, error: fetchError } = await supabase
      .from('incomes')
      .select('id')
      .eq('id', incomeId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingIncome) {
      return res.status(404).json({
        success: false,
        error: { message: 'Income record not found' }
      });
    }

    const { error } = await supabase
      .from('incomes')
      .delete()
      .eq('id', incomeId)
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to delete income record' }
      });
    }

    res.json({
      success: true,
      data: { message: 'Income record deleted successfully' },
    });
  })
);

// GET /api/incomes/stats/summary
router.get(
  '/stats/summary',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    // Get all incomes for the specified year
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data: incomes, error } = await supabase
      .from('incomes')
      .select('*')
      .eq('user_id', userId)
      .gte('income_date', startDate)
      .lte('income_date', endDate)
      .order('income_date', { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        error: { message: 'Failed to retrieve income statistics' }
      });
    }

    // Calculate comprehensive statistics
    const stats = FuyouCalculationService.calculateIncomeStats(incomes || [], year);

    // Calculate current month progress
    const currentMonth = new Date().getMonth() + 1;
    const currentMonthIncomes = incomes?.filter(income => {
      const incomeMonth = new Date(income.income_date).getMonth() + 1;
      return incomeMonth === currentMonth;
    }) || [];
    const currentMonthTotal = currentMonthIncomes.reduce((sum, income) => sum + income.amount, 0);

    // Get unique income sources
    const incomeSources = [...new Set(incomes?.map(income => income.source) || [])];

    // Recent incomes (last 5)
    const recentIncomes = incomes?.slice(-5).reverse() || [];

    res.json({
      success: true,
      data: {
        ...stats,
        currentMonthTotal,
        currentMonthCount: currentMonthIncomes.length,
        incomeSources,
        recentIncomes,
        year,
      },
    });
  })
);

export { router as incomeRoutes };