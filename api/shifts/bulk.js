import { sendCreated, sendError, sendAuthError, sendValidationError, handleCors } from '../_utils/response.js';
import { requireAuthOrDemo } from '../_utils/auth.js';
import { shiftService } from '../_services/shiftService.js';
import { z } from 'zod';

// Shift validation schema
const CreateShiftSchema = z.object({
  jobSourceId: z.string().uuid().optional(),
  jobSourceName: z.string().min(1, 'Job source name is required'),
  date: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid date format'
  ),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  hourlyRate: z.number().positive('Hourly rate must be positive'),
  breakMinutes: z.number().int().min(0).default(0),
  description: z.string().optional(),
  isConfirmed: z.boolean().default(false),
});

const BulkCreateSchema = z.object({
  shifts: z.array(CreateShiftSchema).min(1, 'At least one shift is required'),
});

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
    
    // Validate request body
    const { shifts } = BulkCreateSchema.parse(req.body);
    
    const result = await shiftService.bulkCreateShifts(user.id, shifts);
    
    return sendCreated(res, result.savedShifts, {
      savedCount: result.savedCount,
      skippedCount: result.skippedCount,
      skippedShifts: result.skippedShifts
    });
  } catch (error) {
    if (error.message.includes('Authentication')) {
      return sendAuthError(res, error.message);
    }
    if (error.name === 'ZodError') {
      return sendValidationError(res, 'Validation failed', error.errors);
    }
    return sendError(res, error.message, 'BULK_CREATE_ERROR', 500);
  }
}