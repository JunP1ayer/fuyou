import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { ocrService } from '../services/ocrService';
import { uploadConfig, validateImageFile } from '../middleware/uploadMiddleware';
import { requireAuth } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// OCR専用レート制限 (コスト管理)
const ocrRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 10, // 15分間に10回まで
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'OCR機能の利用制限に達しました。15分後に再試行してください。',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// より厳しいユーザー別制限 (IPベース)
const userOcrLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 20, // 1時間に20回まで
  message: {
    success: false,
    error: {
      code: 'USER_LIMIT_EXCEEDED', 
      message: '1時間あたりのOCR利用制限に達しました。有料プランで制限を解除できます。',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/ocr/upload
 * 画像をアップロードしてOCR処理を実行
 */
router.post(
  '/upload',
  ocrRateLimit,
  userOcrLimit,
  requireAuth,
  uploadConfig.single('image'), // 'image'フィールドで1ファイル受信
  validateImageFile,
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE',
            message: 'ファイルがアップロードされていません。',
          },
        });
      }

      console.log(`OCR処理開始 - ユーザー: ${req.user?.id}, ファイルサイズ: ${req.file.size} bytes`);

      // OCR処理実行
      const result = await ocrService.extractTextFromImage(req.file.buffer);

      // 処理結果のログ
      console.log(`OCR処理完了 - 成功: ${result.success}, 処理時間: ${Date.now() - startTime}ms`);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(422).json(result); // Unprocessable Entity
      }

    } catch (error: any) {
      console.error('OCR API エラー:', error);
      
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'サーバー内部エラーが発生しました。しばらく時間をおいてから再試行してください。',
        },
        metadata: {
          processingTimeMs: Date.now() - startTime,
          apiCallCount: 0,
          estimatedCost: 0,
        },
      });
    }
  })
);

/**
 * GET /api/ocr/usage
 * OCR API使用状況を取得
 */
router.get(
  '/usage',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const usage = ocrService.getUsageStats();
    
    res.json({
      success: true,
      data: {
        ...usage,
        userId: req.user?.id,
        limits: {
          hourly: 20,
          per15min: 10,
          monthly: 1000,
        },
      },
    });
  })
);

/**
 * POST /api/ocr/test
 * OCR機能のテスト用エンドポイント (開発環境のみ)
 */
if (process.env.NODE_ENV === 'development') {
  router.post(
    '/test',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      res.json({
        success: true,
        data: {
          message: 'OCR API is working!',
          timestamp: new Date().toISOString(),
          user: req.user?.id,
          environment: process.env.NODE_ENV,
        },
      });
    })
  );
}

export default router;