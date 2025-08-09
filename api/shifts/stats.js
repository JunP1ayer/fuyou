import { sendSuccess, sendError, sendAuthError, sendValidationError, handleCors } from '../_utils/response.js';
import { requireAuthOrDemo } from '../_utils/auth.js';
import { shiftService } from '../_services/shiftService.js';
import { z } from 'zod';

// Schema for query parameters
const StatsQuerySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

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
    
    // Validate query parameters
    const { year, month } = StatsQuerySchema.parse(req.query);
    
    const stats = await shiftService.getShiftStats(user.id, year, month);
    
    return sendSuccess(res, stats);
  } catch (error) {
    if (error.message.includes('Authentication')) {
      return sendAuthError(res, error.message);
    }
    if (error.name === 'ZodError') {
      return sendValidationError(res, 'Invalid query parameters', error.errors);
    }
    return sendError(res, error.message, 'STATS_ERROR', 500);
  }
}