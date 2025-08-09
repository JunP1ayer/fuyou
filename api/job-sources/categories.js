import { sendSuccess, sendError, sendAuthError, handleCors } from '../../lib/_utils/response.js';
import { requireAuthOrDemo } from '../../lib/_utils/auth.js';

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
    
    const categories = [
      { value: 'part_time_job', label: 'アルバイト' },
      { value: 'temporary_work', label: '短期バイト' },
      { value: 'freelance', label: 'フリーランス' },
      { value: 'scholarship', label: '奨学金' },
      { value: 'family_support', label: '家族からの支援' },
      { value: 'other', label: 'その他' },
    ];

    return sendSuccess(res, categories);
  } catch (error) {
    if (error.message.includes('Authentication')) {
      return sendAuthError(res, error.message);
    }
    return sendError(res, error.message, 'CATEGORIES_ERROR', 500);
  }
}