import express from 'express';
import { requireAuthOrDemo } from '../middleware/validation';
import { validateSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { userProfileService } from '../services/userProfileService';
import { UpdateUserProfileSchema, type UpdateUserProfileRequest, type ApiResponse, type UserProfile } from '../types/api';

const router = express.Router();

/**
 * GET /api/user-profile
 * ユーザープロフィール取得
 */
router.get(
  '/',
  requireAuthOrDemo,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = req.user!.id;

    try {
      const profile = await userProfileService.getUserProfile(userId);
      
      const response: ApiResponse<UserProfile> = {
        success: true,
        data: profile,
      };

      res.status(200).json(response);
    } catch (error: unknown) {
      console.error('Failed to get user profile:', error);
      
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'プロフィール情報の取得に失敗しました',
          code: 'PROFILE_FETCH_FAILED',
          details: (error as Error).message,
        },
      };

      res.status(500).json(response);
    }
  })
);

/**
 * PUT /api/user-profile
 * ユーザープロフィール更新
 */
router.put(
  '/',
  requireAuthOrDemo,
  validateSchema(UpdateUserProfileSchema),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = req.user!.id;
    const updateData: UpdateUserProfileRequest = req.body;

    console.log(`Updating user profile for user: ${userId}`);
    console.log('Update data:', updateData);

    try {
      const updatedProfile = await userProfileService.updateUserProfile(userId, updateData);
      
      const response: ApiResponse<UserProfile> = {
        success: true,
        data: updatedProfile,
      };

      res.status(200).json(response);
    } catch (error: unknown) {
      console.error('Failed to update user profile:', error);
      
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'プロフィール情報の更新に失敗しました',
          code: 'PROFILE_UPDATE_FAILED',
          details: (error as Error).message,
        },
      };

      res.status(500).json(response);
    }
  })
);

/**
 * POST /api/user-profile/initialize
 * 初回プロフィール設定
 */
router.post(
  '/initialize',
  requireAuthOrDemo,
  validateSchema(UpdateUserProfileSchema),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = req.user!.id;
    const profileData: UpdateUserProfileRequest = req.body;

    console.log(`Initializing user profile for user: ${userId}`);

    try {
      const profile = await userProfileService.initializeUserProfile(userId, profileData);
      
      const response: ApiResponse<UserProfile> = {
        success: true,
        data: profile,
      };

      res.status(201).json(response);
    } catch (error: unknown) {
      console.error('Failed to initialize user profile:', error);
      
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'プロフィール初期化に失敗しました',
          code: 'PROFILE_INIT_FAILED',
          details: (error as Error).message,
        },
      };

      res.status(500).json(response);
    }
  })
);

/**
 * GET /api/user-profile/shift-filter-name
 * シフトフィルタリング用の名前取得（OCR処理用）
 */
router.get(
  '/shift-filter-name',
  requireAuthOrDemo,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = req.user!.id;

    try {
      const shiftFilterName = await userProfileService.getShiftFilterName(userId);
      
      const response: ApiResponse<{ shiftFilterName: string | null }> = {
        success: true,
        data: { shiftFilterName },
      };

      res.status(200).json(response);
    } catch (error: unknown) {
      console.error('Failed to get shift filter name:', error);
      
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'シフトフィルタ名の取得に失敗しました',
          code: 'SHIFT_FILTER_NAME_FAILED',
          details: (error as Error).message,
        },
      };

      res.status(500).json(response);
    }
  })
);

export default router;