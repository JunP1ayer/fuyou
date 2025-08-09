import { sendSuccess, sendCreated, sendError, sendAuthError, sendNotFound, sendValidationError, handleCors } from '../../lib/_utils/response.js';
import { requireAuthOrDemo } from '../../lib/_utils/auth.js';
import { supabaseAdmin } from '../../lib/_utils/supabase.js';
import { z } from 'zod';

// Job Source validation schemas
const CreateJobSourceSchema = z.object({
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

const UpdateJobSourceSchema = CreateJobSourceSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) {
    return;
  }

  try {
    // Authenticate user
    const user = await requireAuthOrDemo(req);

    switch (req.method) {
      case 'GET':
        return await handleGetJobSources(req, res, user.id);
      case 'POST':
        return await handleCreateJobSource(req, res, user.id);
      case 'PUT':
        return await handleUpdateJobSource(req, res, user.id);
      case 'DELETE':
        return await handleDeleteJobSource(req, res, user.id);
      default:
        return sendError(res, 'Method not allowed', 'METHOD_NOT_ALLOWED', 405);
    }
  } catch (error) {
    if (error.message.includes('Authentication')) {
      return sendAuthError(res, error.message);
    }
    return sendError(res, error.message, 'INTERNAL_ERROR', 500);
  }
}

async function handleGetJobSources(req, res, userId) {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    
    let query = supabaseAdmin
      .from('job_sources')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      return sendError(res, 'バイト先の取得に失敗しました', 'DATABASE_ERROR', 500, error.message);
    }

    return sendSuccess(res, data, { total: data.length });
  } catch (error) {
    return sendError(res, error.message, 'GET_JOB_SOURCES_ERROR', 500);
  }
}

async function handleCreateJobSource(req, res, userId) {
  try {
    // Validate request body
    const jobSourceData = CreateJobSourceSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('job_sources')
      .insert({
        user_id: userId,
        name: jobSourceData.name,
        category: jobSourceData.category,
        hourly_rate: jobSourceData.hourlyRate,
        expected_monthly_hours: jobSourceData.expectedMonthlyHours,
        bank_account_info: jobSourceData.bankAccountInfo,
      })
      .select()
      .single();

    if (error) {
      return sendError(res, 'バイト先の作成に失敗しました', 'DATABASE_ERROR', 500, error.message);
    }

    return sendCreated(res, data);
  } catch (error) {
    if (error.name === 'ZodError') {
      return sendValidationError(res, 'Validation failed', error.errors);
    }
    return sendError(res, error.message, 'CREATE_JOB_SOURCE_ERROR', 500);
  }
}

async function handleUpdateJobSource(req, res, userId) {
  try {
    // Get job source ID from query parameter or body
    const jobSourceId = req.query.id || req.body.id;
    
    if (!jobSourceId) {
      return sendValidationError(res, 'Job source ID is required');
    }

    // Validate request body
    const updateData = UpdateJobSourceSchema.parse(req.body);

    // Check if job source exists
    const { data: existingSource, error: checkError } = await supabaseAdmin
      .from('job_sources')
      .select('id')
      .eq('id', jobSourceId)
      .eq('user_id', userId)
      .single();

    if (checkError || !existingSource) {
      return sendNotFound(res, 'バイト先が見つかりません');
    }

    const { data, error } = await supabaseAdmin
      .from('job_sources')
      .update({
        name: updateData.name,
        category: updateData.category,
        hourly_rate: updateData.hourlyRate,
        expected_monthly_hours: updateData.expectedMonthlyHours,
        bank_account_info: updateData.bankAccountInfo,
        is_active: updateData.isActive,
      })
      .eq('id', jobSourceId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return sendError(res, 'バイト先の更新に失敗しました', 'DATABASE_ERROR', 500, error.message);
    }

    return sendSuccess(res, data);
  } catch (error) {
    if (error.name === 'ZodError') {
      return sendValidationError(res, 'Validation failed', error.errors);
    }
    return sendError(res, error.message, 'UPDATE_JOB_SOURCE_ERROR', 500);
  }
}

async function handleDeleteJobSource(req, res, userId) {
  try {
    // Get job source ID from query parameter or body
    const jobSourceId = req.query.id || req.body.id;
    
    if (!jobSourceId) {
      return sendValidationError(res, 'Job source ID is required');
    }

    // Check if job source exists
    const { data: existingSource, error: checkError } = await supabaseAdmin
      .from('job_sources')
      .select('id')
      .eq('id', jobSourceId)
      .eq('user_id', userId)
      .single();

    if (checkError || !existingSource) {
      return sendNotFound(res, 'バイト先が見つかりません');
    }

    // Logical delete (set is_active = false)
    const { data, error } = await supabaseAdmin
      .from('job_sources')
      .update({ is_active: false })
      .eq('id', jobSourceId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return sendError(res, 'バイト先の削除に失敗しました', 'DATABASE_ERROR', 500, error.message);
    }

    return sendSuccess(res, data);
  } catch (error) {
    return sendError(res, error.message, 'DELETE_JOB_SOURCE_ERROR', 500);
  }
}