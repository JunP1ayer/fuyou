import express from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuthOrDemo } from '../middleware/validation';
import { validateSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { uploadConfig } from '../middleware/uploadMiddleware';
import { intelligentOCRService } from '../services/intelligentOCRService';
import { shiftService } from '../services/shiftService';
import { OCRProcessingSchema, type OCRProcessingRequest, type ApiResponse, type OCRProcessingResponse } from '../types/api';

const router = express.Router();

// レート制限設定
const intelligentOCRRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分間
  max: 5, // 5回まで（高負荷処理のため制限強化）
  message: {
    success: false,
    error: {
      message: 'インテリジェントOCR処理のレート制限に達しました。15分後に再試行してください。',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const userOCRLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 10, // 10回まで
  keyGenerator: (req: express.Request) => req.user?.id || req.ip || 'anonymous',
  message: {
    success: false,
    error: {
      message: 'ユーザー毎のOCR処理制限に達しました。1時間後に再試行してください。',
      code: 'USER_RATE_LIMIT_EXCEEDED',
    },
  },
});

/**
 * POST /api/intelligent-ocr/process
 * インテリジェントOCR処理（複数AI統合）
 */
router.post(
  '/process',
  intelligentOCRRateLimit,
  userOCRLimit,
  requireAuthOrDemo,
  validateSchema(OCRProcessingSchema),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { image, userName, processingOptions }: OCRProcessingRequest = req.body;
    const userId = req.user!.id;

    console.log(`Starting intelligent OCR processing for user: ${userId}`);
    console.log(`Processing options:`, processingOptions);

    try {
      const startTime = Date.now();

      // インテリジェントOCR処理実行
      const result = await intelligentOCRService.processImage(
        image,
        userId,
        userName,
        processingOptions
      );

      const processingTime = Date.now() - startTime;
      console.log(`Intelligent OCR processing completed in ${processingTime}ms`);
      console.log(`Session ID: ${result.sessionId}`);
      console.log(`AI Results:`, Object.keys(result.results));
      console.log(`Consolidated shifts: ${result.consolidatedResult.recommendedShifts.length}`);
      console.log(`Conflicts detected: ${result.consolidatedResult.conflicts.length}`);

      const response: ApiResponse<OCRProcessingResponse> = {
        success: true,
        data: result,
        meta: {
          total: result.consolidatedResult.recommendedShifts.length,
        },
      };

      res.status(200).json(response);
    } catch (error: any) {
      console.error('Intelligent OCR processing failed:', error);

      const response: ApiResponse = {
        success: false,
        error: {
          message: 'インテリジェントOCR処理に失敗しました',
          code: 'INTELLIGENT_OCR_FAILED',
          details: {
            originalError: error.message,
            userId,
            timestamp: new Date().toISOString(),
          },
        },
      };

      res.status(500).json(response);
    }
  })
);

/**
 * POST /api/intelligent-ocr/upload-and-process
 * ファイルアップロードとインテリジェントOCR処理を統合
 */
router.post(
  '/upload-and-process',
  intelligentOCRRateLimit,
  userOCRLimit,
  requireAuthOrDemo,
  uploadConfig.single('image'),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    if (!req.file) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: '画像ファイルが提供されていません',
          code: 'NO_FILE_PROVIDED',
        },
      };
      return res.status(400).json(response);
    }

    const userId = req.user!.id;
    const userName = req.body.userName;
    const processingOptions = req.body.processingOptions ? JSON.parse(req.body.processingOptions) : undefined;
    const autoSave = req.body.autoSave === 'true' || req.body.autoSave === true;

    console.log(`Processing uploaded file for user: ${userId}`);
    console.log(`File size: ${req.file.size} bytes, MIME type: ${req.file.mimetype}`);

    try {
      // ファイルをBase64に変換
      const imageData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

      const startTime = Date.now();

      // インテリジェントOCR処理実行
      const result = await intelligentOCRService.processImage(
        imageData,
        userId,
        userName,
        processingOptions
      );

      const processingTime = Date.now() - startTime;
      console.log(`File processing completed in ${processingTime}ms`);

      let savedShifts: any[] = [];
      let saveMetaData = {};

      // Auto-save if requested
      if (autoSave && result.consolidatedResult.recommendedShifts.length > 0) {
        console.log(`Auto-saving ${result.consolidatedResult.recommendedShifts.length} shifts...`);
        try {
          const bulkResult = await shiftService.bulkCreateShifts(userId, result.consolidatedResult.recommendedShifts);
          savedShifts = bulkResult.savedShifts;
          saveMetaData = {
            savedCount: bulkResult.savedCount,
            skippedCount: bulkResult.skippedCount,
            skippedShifts: bulkResult.skippedShifts
          };
          console.log(`Auto-save completed: ${bulkResult.savedCount} saved, ${bulkResult.skippedCount} skipped`);
        } catch (saveError) {
          console.error('Auto-save failed:', saveError);
        }
      }

      const response: ApiResponse<OCRProcessingResponse> = {
        success: true,
        data: {
          ...result,
          savedShifts: savedShifts
        },
        meta: {
          total: result.consolidatedResult.recommendedShifts.length,
          autoSave,
          ...saveMetaData
        },
      };

      res.status(200).json(response);
    } catch (error: any) {
      console.error('File processing failed:', error);

      const response: ApiResponse = {
        success: false,
        error: {
          message: 'ファイル処理に失敗しました',
          code: 'FILE_PROCESSING_FAILED',
          details: {
            originalError: error.message,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
          },
        },
      };

      res.status(500).json(response);
    }
  })
);

/**
 * GET /api/intelligent-ocr/session/:sessionId
 * セッション情報取得
 */
router.get(
  '/session/:sessionId',
  requireAuthOrDemo,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { sessionId } = req.params;
    const userId = req.user!.id;

    const session = intelligentOCRService.getSession(sessionId);

    if (!session) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'セッションが見つかりません',
          code: 'SESSION_NOT_FOUND',
        },
      };
      return res.status(404).json(response);
    }

    // セッションの所有者確認
    if (session.userId !== userId) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'セッションへのアクセス権限がありません',
          code: 'UNAUTHORIZED_SESSION_ACCESS',
        },
      };
      return res.status(403).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: {
        sessionId: session.sessionId,
        status: session.status,
        processingOptions: session.processingOptions,
        createdAt: session.createdAt,
      },
    };

    res.status(200).json(response);
  })
);

/**
 * DELETE /api/intelligent-ocr/session/:sessionId
 * セッション削除（メモリ管理）
 */
router.delete(
  '/session/:sessionId',
  requireAuthOrDemo,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { sessionId } = req.params;
    const userId = req.user!.id;

    const session = intelligentOCRService.getSession(sessionId);

    if (!session) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'セッションが見つかりません',
          code: 'SESSION_NOT_FOUND',
        },
      };
      return res.status(404).json(response);
    }

    // セッションの所有者確認
    if (session.userId !== userId) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'セッションの削除権限がありません',
          code: 'UNAUTHORIZED_SESSION_DELETE',
        },
      };
      return res.status(403).json(response);
    }

    // セッション削除
    intelligentOCRService.cleanupSession(sessionId);

    const response: ApiResponse = {
      success: true,
      data: {
        message: 'セッションが削除されました',
        sessionId,
      },
    };

    res.status(200).json(response);
  })
);

/**
 * GET /api/intelligent-ocr/status
 * AI プロバイダーの利用可能状況確認
 */
router.get(
  '/status',
  requireAuthOrDemo,
  asyncHandler(async (req: express.Request, res: express.Response) => {
      const providers = {
      gemini: {
        available: !!process.env.GEMINI_API_KEY,
        description: 'Google Gemini AI - 高精度画像解析',
      },
      openai: {
        available: !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'YOUR_OPENAI_API_KEY_HERE'),
          description: `OpenAI ${process.env.OPENAI_GPT_MODEL || 'gpt-5'} - 自然言語/画像理解`,
      },
      vision: {
        available: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
        description: 'Google Cloud Vision API - OCR専門',
      },
    };

    const response: ApiResponse = {
      success: true,
      data: {
        providers,
        recommendedOrder: ['gemini', 'openai', 'vision'],
        timestamp: new Date().toISOString(),
      },
    };

    res.status(200).json(response);
  })
);

export default router;