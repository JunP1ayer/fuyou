import { sendSuccess, sendError, sendAuthError, sendNotFound, handleCors } from '../../lib/_utils/response.js';
import { requireAuthOrDemo } from '../../lib/_utils/auth.js';
import { shiftService } from '../../lib/_services/shiftService.js';

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) {
    return;
  }

  try {
    // Authenticate user
    const user = await requireAuthOrDemo(req);
    
    const { id: shiftId } = req.query;
    
    if (!shiftId) {
      return sendError(res, 'Shift ID is required', 'MISSING_SHIFT_ID', 400);
    }
    
    // Handle GET request - get single shift
    if (req.method === 'GET') {
      const shift = await shiftService.getShiftById(user.id, shiftId);
      return sendSuccess(res, shift);
    }
    
    // Handle POST request to confirm shift (replaces /confirm endpoint)
    if (req.method === 'POST') {
      const shift = await shiftService.updateShift(user.id, shiftId, { isConfirmed: true });
      return sendSuccess(res, shift);
    }
    
    return sendError(res, 'Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  } catch (error) {
    if (error.message.includes('Authentication')) {
      return sendAuthError(res, error.message);
    }
    if (error.message.includes('not found')) {
      return sendNotFound(res, 'Shift not found');
    }
    return sendError(res, error.message, 'SHIFT_OPERATION_ERROR', 500);
  }
}