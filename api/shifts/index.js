import { sendSuccess, sendCreated, sendError, sendAuthError, sendNotFound, sendValidationError, handleCors } from '../../lib/_utils/response.js';
import { requireAuthOrDemo } from '../../lib/_utils/auth.js';
import { shiftService } from '../../lib/_services/shiftService.js';
import { z } from 'zod';

// Shift validation schemas
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

const UpdateShiftSchema = CreateShiftSchema.partial();

const GetShiftsSchema = z.object({
  startDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid start date format'
  ).optional(),
  endDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid end date format'
  ).optional(),
  jobSourceId: z.string().uuid().optional(),
  isConfirmed: z.coerce.boolean().optional(),
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
        return await handleGetShifts(req, res, user.id);
      case 'POST':
        return await handleCreateShift(req, res, user.id);
      case 'PUT':
        return await handleUpdateShift(req, res, user.id);
      case 'DELETE':
        return await handleDeleteShift(req, res, user.id);
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

async function handleGetShifts(req, res, userId) {
  try {
    // Validate query parameters
    const filters = GetShiftsSchema.parse(req.query);
    
    const shifts = await shiftService.getShifts(userId, filters);
    
    return sendSuccess(res, shifts);
  } catch (error) {
    if (error.name === 'ZodError') {
      return sendValidationError(res, 'Invalid query parameters', error.errors);
    }
    return sendError(res, error.message, 'GET_SHIFTS_ERROR', 500);
  }
}

async function handleCreateShift(req, res, userId) {
  try {
    // Validate request body
    const shiftData = CreateShiftSchema.parse(req.body);
    
    const shift = await shiftService.createShift(userId, shiftData);
    
    return sendCreated(res, shift);
  } catch (error) {
    if (error.name === 'ZodError') {
      return sendValidationError(res, 'Validation failed', error.errors);
    }
    if (error.message.includes('Time conflict')) {
      return sendError(res, error.message, 'TIME_CONFLICT', 409);
    }
    return sendError(res, error.message, 'CREATE_SHIFT_ERROR', 500);
  }
}

async function handleUpdateShift(req, res, userId) {
  try {
    // Get shift ID from query parameter or body
    const shiftId = req.query.id || req.body.id;
    
    if (!shiftId) {
      return sendValidationError(res, 'Shift ID is required');
    }
    
    // Validate request body
    const updateData = UpdateShiftSchema.parse(req.body);
    
    const shift = await shiftService.updateShift(userId, shiftId, updateData);
    
    return sendSuccess(res, shift);
  } catch (error) {
    if (error.name === 'ZodError') {
      return sendValidationError(res, 'Validation failed', error.errors);
    }
    if (error.message.includes('not found')) {
      return sendNotFound(res, 'Shift not found');
    }
    if (error.message.includes('Time conflict')) {
      return sendError(res, error.message, 'TIME_CONFLICT', 409);
    }
    return sendError(res, error.message, 'UPDATE_SHIFT_ERROR', 500);
  }
}

async function handleDeleteShift(req, res, userId) {
  try {
    // Get shift ID from query parameter or body
    const shiftId = req.query.id || req.body.id;
    
    if (!shiftId) {
      return sendValidationError(res, 'Shift ID is required');
    }
    
    await shiftService.deleteShift(userId, shiftId);
    
    return sendSuccess(res, { message: 'Shift deleted successfully' });
  } catch (error) {
    if (error.message.includes('not found')) {
      return sendNotFound(res, 'Shift not found');
    }
    return sendError(res, error.message, 'DELETE_SHIFT_ERROR', 500);
  }
}