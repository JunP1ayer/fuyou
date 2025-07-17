import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateSchema } from '../middleware/validation';
import { RegisterSchema, LoginSchema, ChangePasswordSchema } from '../types/api';
import { authService } from '../services/authService';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  validateSchema(RegisterSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      data: result,
      message: 'User registered successfully',
    });
  })
);

// POST /api/auth/login
router.post(
  '/login',
  validateSchema(LoginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    res.json({
      success: true,
      data: result,
      message: 'Login successful',
    });
  })
);

// POST /api/auth/logout
router.post(
  '/logout',
  asyncHandler(async (req: Request, res: Response) => {
    // Since we're using stateless JWT, logout is handled client-side
    res.json({
      success: true,
      message: 'Logout successful',
    });
  })
);

// GET /api/auth/me
router.get(
  '/me',
  asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getCurrentUser(req);
    res.json({
      success: true,
      data: user,
    });
  })
);

// POST /api/auth/change-password
router.post(
  '/change-password',
  validateSchema(ChangePasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await authService.changePassword(req, req.body);
    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  })
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.refreshToken(req);
    res.json({
      success: true,
      data: result,
      message: 'Token refreshed successfully',
    });
  })
);

export { router as authRoutes };