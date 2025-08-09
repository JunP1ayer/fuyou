import { sendSuccess, sendError, sendAuthError, sendNotFound, handleCors } from '../../lib/_utils/response.js';
import { requireAuthOrDemo } from '../../lib/_utils/auth.js';
import { supabaseAdmin } from '../../lib/_utils/supabase.js';

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  }

  try {
    // Authenticate user
    const user = await requireAuthOrDemo(req);
    
    const { id } = req.query;

    const { data, error } = await supabaseAdmin
      .from('job_sources')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return sendNotFound(res, 'バイト先が見つかりません');
    }

    return sendSuccess(res, data);
  } catch (error) {
    if (error.message.includes('Authentication')) {
      return sendAuthError(res, error.message);
    }
    return sendError(res, error.message, 'GET_JOB_SOURCE_ERROR', 500);
  }
}