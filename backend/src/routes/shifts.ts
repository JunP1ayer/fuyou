import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateSchema, requireAuth } from '../middleware/validation';
import { CreateShiftSchema, UpdateShiftSchema, GetShiftsSchema } from '../types/api';
import { shiftService } from '../services/shiftService';

const router = Router();

// GET /api/shifts - Get shifts with optional filters
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const filters = req.query;
    
    const shifts = await shiftService.getShifts(userId, filters);
    
    res.json({
      success: true,
      data: shifts,
    });
  })
);

// GET /api/shifts/stats - Get shift statistics
router.get(
  '/stats',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    
    const stats = await shiftService.getShiftStats(userId, year, month);
    
    res.json({
      success: true,
      data: stats,
    });
  })
);

// POST /api/shifts - Create a new shift
router.post(
  '/',
  requireAuth,
  validateSchema(CreateShiftSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const shiftData = req.body;
    
    const shift = await shiftService.createShift(userId, shiftData);
    
    res.status(201).json({
      success: true,
      data: shift,
    });
  })
);

// PUT /api/shifts/:id - Update a shift
router.put(
  '/:id',
  requireAuth,
  validateSchema(UpdateShiftSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const shiftId = req.params.id;
    const updateData = req.body;
    
    const shift = await shiftService.updateShift(userId, shiftId, updateData);
    
    res.json({
      success: true,
      data: shift,
    });
  })
);

// DELETE /api/shifts/:id - Delete a shift
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const shiftId = req.params.id;
    
    await shiftService.deleteShift(userId, shiftId);
    
    res.json({
      success: true,
      message: 'Shift deleted successfully',
    });
  })
);

// POST /api/shifts/:id/confirm - Confirm a shift
router.post(
  '/:id/confirm',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const shiftId = req.params.id;
    
    const shift = await shiftService.updateShift(userId, shiftId, { isConfirmed: true });
    
    res.json({
      success: true,
      data: shift,
    });
  })
);

// GET /api/shifts/projection - Get earnings projection based on shifts
router.get(
  '/projection',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    const projection = await shiftService.getEarningsProjection(userId);
    
    res.json({
      success: true,
      data: projection,
    });
  })
);

// POST /api/shifts/bulk - Create multiple shifts (useful for recurring shifts)
router.post(
  '/bulk',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { shifts } = req.body;
    
    if (!Array.isArray(shifts)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Shifts must be an array' },
      });
    }
    
    const createdShifts = [];
    for (const shiftData of shifts) {
      try {
        const shift = await shiftService.createShift(userId, shiftData);
        createdShifts.push(shift);
      } catch (error) {
        console.error('Failed to create shift:', error);
        // Continue with other shifts even if one fails
      }
    }
    
    res.status(201).json({
      success: true,
      data: createdShifts,
    });
  })
);

// GET /api/shifts/:id - Get a specific shift (must be last to avoid conflicts)
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const shiftId = req.params.id;
    
    const shift = await shiftService.getShiftById(userId, shiftId);
    
    res.json({
      success: true,
      data: shift,
    });
  })
);

export { router as shiftRoutes };