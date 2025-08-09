import { sendSuccess, sendError, sendAuthError, handleCors } from '../_utils/response.js';
import { requireAuthOrDemo } from '../_utils/auth.js';
import { shiftService } from '../_services/shiftService.js';

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
    
    const projection = await shiftService.getEarningsProjection(user.id);
    
    return sendSuccess(res, projection);
  } catch (error) {
    if (error.message.includes('Authentication')) {
      return sendAuthError(res, error.message);
    }
    return sendError(res, error.message, 'PROJECTION_ERROR', 500);
  }
}