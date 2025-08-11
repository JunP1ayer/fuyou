import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { ocrService } from '../services/ocrService';
import { naturalLanguageOCRService } from '../services/naturalLanguageOCRService';
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

    } catch (error: unknown) {
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
 * POST /api/ocr/natural-language
 * 画像をアップロードしてChatGPT風の自然言語OCR処理を実行
 */
router.post(
  '/natural-language',
  ocrRateLimit,
  userOcrLimit,
  requireAuth,
  uploadConfig.single('image'),
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

      const userName = req.body.userName || req.user?.fullName;
      console.log(`自然言語OCR処理開始 - ユーザー: ${req.user?.id} (${userName}), ファイルサイズ: ${req.file.size} bytes`);

      // Step 1: 従来のOCR処理でテキスト抽出
      const ocrResult = await ocrService.extractTextFromImage(req.file.buffer);
      
      if (!ocrResult.success || !ocrResult.data?.extractedText) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'OCR_FAILED',
            message: '画像からテキストを抽出できませんでした。',
          },
          metadata: {
            processingTimeMs: Date.now() - startTime,
          },
        });
      }

      // Step 2: 自然言語変換処理
      const naturalLanguageResult = await naturalLanguageOCRService.processOCRText(
        ocrResult.data.extractedText,
        userName
      );

      const totalProcessingTime = Date.now() - startTime;
      console.log(`自然言語OCR処理完了 - シフト抽出数: ${naturalLanguageResult.extractedShifts.length}, 処理時間: ${totalProcessingTime}ms`);

      res.status(200).json({
        success: true,
        data: {
          naturalLanguageMessage: naturalLanguageResult.naturalLanguageMessage,
          extractedShifts: naturalLanguageResult.extractedShifts,
          confidence: naturalLanguageResult.confidence,
          needsReview: naturalLanguageResult.needsReview,
          originalOCRText: ocrResult.data.extractedText, // デバッグ用
        },
        metadata: {
          processingTimeMs: totalProcessingTime,
          ocrProcessingTimeMs: ocrResult.metadata?.processingTimeMs || 0,
          nlpProcessingTimeMs: naturalLanguageResult.processingTimeMs,
          extractedShiftCount: naturalLanguageResult.extractedShifts.length,
          apiCallCount: ocrResult.metadata?.apiCallCount || 0,
          estimatedCost: ocrResult.metadata?.estimatedCost || 0,
        },
      });

    } catch (error: unknown) {
      console.error('自然言語OCR API エラー:', error);
      
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
 * GET /api/ocr/debug
 * OCR設定の詳細デバッグ情報 (開発環境のみ)
 */
if (process.env.NODE_ENV === 'development') {
  router.get(
    '/debug',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const openaiKeySet = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-openai-api-key-here';
      const googleKeySet = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      
      res.json({
        success: true,
        data: {
          message: 'OCR Debug Information',
          timestamp: new Date().toISOString(),
          user: req.user?.id,
          environment: process.env.NODE_ENV,
          apiConfiguration: {
            openaiApiKey: {
              configured: !!process.env.OPENAI_API_KEY,
              isPlaceholder: process.env.OPENAI_API_KEY === 'sk-your-openai-api-key-here',
              isValid: openaiKeySet,
              length: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
            },
            googleVisionKey: {
              configured: !!googleKeySet,
              path: googleKeySet || 'Not set',
            },
          },
          warnings: [
            ...(!openaiKeySet ? ['OpenAI API キーが設定されていません。フォールバックモードで動作します。'] : []),
            ...(!googleKeySet ? ['Google Cloud Vision API認証ファイルが設定されていません。'] : []),
          ],
        },
      });
    })
  );

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