import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../utils/supabase';
import { requireAuth, validateSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Job Source validation schemas
export const CreateJobSourceSchema = z.object({
  name: z.string().min(1, 'バイト先名は必須です').max(255, 'バイト先名は255文字以内で入力してください'),
  category: z.enum(['part_time_job', 'temporary_work', 'freelance', 'scholarship', 'family_support', 'other'], {
    errorMap: () => ({ message: '有効なカテゴリを選択してください' })
  }),
  hourlyRate: z.number().min(0, '時給は0以上で入力してください').optional(),
  expectedMonthlyHours: z.number().int().min(0, '予想月間労働時間は0以上で入力してください').optional(),
  bankAccountInfo: z.object({
    bankName: z.string().optional(),
    accountType: z.string().optional(),
    accountNumber: z.string().optional(),
  }).optional(),
});

export const UpdateJobSourceSchema = CreateJobSourceSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateJobSourceData = z.infer<typeof CreateJobSourceSchema>;
export type UpdateJobSourceData = z.infer<typeof UpdateJobSourceSchema>;

/**
 * GET /api/job-sources
 * バイト先一覧取得
 */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const includeInactive = req.query.includeInactive === 'true';
    
    const query = supabase
      .from('job_sources')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'バイト先の取得に失敗しました',
          details: error.message,
        },
      });
    }

    res.json({
      success: true,
      data,
      meta: {
        total: data.length,
      },
    });
  })
);

/**
 * GET /api/job-sources/:id
 * 特定のバイト先取得
 */
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('job_sources')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'バイト先が見つかりません',
        },
      });
    }

    res.json({
      success: true,
      data,
    });
  })
);

/**
 * POST /api/job-sources
 * バイト先新規作成
 */
router.post(
  '/',
  requireAuth,
  validateSchema(CreateJobSourceSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const jobSourceData: CreateJobSourceData = req.body;

    const { data, error } = await supabase
      .from('job_sources')
      .insert({
        user_id: req.user!.id,
        name: jobSourceData.name,
        category: jobSourceData.category,
        hourly_rate: jobSourceData.hourlyRate,
        expected_monthly_hours: jobSourceData.expectedMonthlyHours,
        bank_account_info: jobSourceData.bankAccountInfo,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'バイト先の作成に失敗しました',
          details: error.message,
        },
      });
    }

    res.status(201).json({
      success: true,
      data,
    });
  })
);

/**
 * PUT /api/job-sources/:id
 * バイト先更新
 */
router.put(
  '/:id',
  requireAuth,
  validateSchema(UpdateJobSourceSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData: UpdateJobSourceData = req.body;

    // バイト先の存在確認
    const { data: existingSource, error: checkError } = await supabase
      .from('job_sources')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (checkError || !existingSource) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'バイト先が見つかりません',
        },
      });
    }

    const { data, error } = await supabase
      .from('job_sources')
      .update({
        name: updateData.name,
        category: updateData.category,
        hourly_rate: updateData.hourlyRate,
        expected_monthly_hours: updateData.expectedMonthlyHours,
        bank_account_info: updateData.bankAccountInfo,
        is_active: updateData.isActive,
      })
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'バイト先の更新に失敗しました',
          details: error.message,
        },
      });
    }

    res.json({
      success: true,
      data,
    });
  })
);

/**
 * DELETE /api/job-sources/:id
 * バイト先削除（論理削除）
 */
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // バイト先の存在確認
    const { data: existingSource, error: checkError } = await supabase
      .from('job_sources')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (checkError || !existingSource) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'バイト先が見つかりません',
        },
      });
    }

    // 論理削除（is_active = false）
    const { data, error } = await supabase
      .from('job_sources')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'バイト先の削除に失敗しました',
          details: error.message,
        },
      });
    }

    res.json({
      success: true,
      data,
    });
  })
);

/**
 * GET /api/job-sources/categories
 * 利用可能なカテゴリ一覧取得
 */
router.get(
  '/meta/categories',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const categories = [
      { value: 'part_time_job', label: 'アルバイト' },
      { value: 'temporary_work', label: '短期バイト' },
      { value: 'freelance', label: 'フリーランス' },
      { value: 'scholarship', label: '奨学金' },
      { value: 'family_support', label: '家族からの支援' },
      { value: 'other', label: 'その他' },
    ];

    res.json({
      success: true,
      data: categories,
    });
  })
);

export default router;