import { sendSuccess, sendError, sendAuthError, sendNotFound, handleCors } from '../../_utils/response.js';
import { requireAuthOrDemo } from '../../_utils/auth.js';
import { shiftService } from '../../_services/shiftService.js';

export default async function handler(req, res) {
  // Handle CORS
  if (handleCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 'METHOD_NOT_ALLOWED', 405);
  }

  try {
    // Authenticate user
    const user = await requireAuthOrDemo(req);
    
    const { id: shiftId } = req.query;
    
    if (!shiftId) {
      return sendError(res, 'Shift ID is required', 'MISSING_SHIFT_ID', 400);
    }
    
    const shift = await shiftService.updateShift(user.id, shiftId, { isConfirmed: true });
    
    return sendSuccess(res, shift);
  } catch (error) {
    if (error.message.includes('Authentication')) {
      return sendAuthError(res, error.message);
    }
    if (error.message.includes('not found')) {
      return sendNotFound(res, 'Shift not found');
    }
    return sendError(res, error.message, 'CONFIRM_SHIFT_ERROR', 500);
  }
}