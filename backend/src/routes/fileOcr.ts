import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { requireAuthOrDemo } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { aiFileAnalysisService } from '../services/aiFileAnalysisService';

const router = express.Router();

// ファイルアップロード設定
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/pdf',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('サポートされていないファイル形式です'));
    }
  },
});




// API エンドポイント

// 統合ファイル解析（OpenAI/Gemini使用）
router.post('/analyze', requireAuthOrDemo, upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'ファイルが選択されていません',
    });
  }

  try {
    // AIファイル解析サービスを使用
    const result = await aiFileAnalysisService.analyzeFile(req.file.path, req.file.originalname);
    
    // 結果を標準化
    const normalizedShifts = aiFileAnalysisService.normalizeShifts(result);
    
    // ファイル削除
    await fs.unlink(req.file.path);
    
    res.json({
      success: true,
      data: {
        type: 'ai-analysis',
        filename: req.file.originalname,
        shifts: normalizedShifts,
        confidence: result.confidence,
        provider: result.provider,
        metadata: {
          originalShiftsCount: result.shifts.length,
          analysisProvider: result.provider,
        },
      },
    });
  } catch (error: unknown) {
    // エラー時もファイル削除
    try {
      await fs.unlink(req.file.path);
    } catch {
      // Ignore file deletion errors
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'ファイル解析中にエラーが発生しました',
    });
  }
}));

// 画像専用エンドポイント（後方互換性）
router.post('/image', requireAuthOrDemo, upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'ファイルが選択されていません',
    });
  }

  try {
    // 画像の場合もAI解析を使用
    const result = await aiFileAnalysisService.analyzeFile(req.file.path, req.file.originalname);
    const normalizedShifts = aiFileAnalysisService.normalizeShifts(result);
    
    // ファイル削除
    await fs.unlink(req.file.path);
    
    res.json({
      success: true,
      data: {
        type: 'image',
        filename: req.file.originalname,
        shifts: normalizedShifts,
        confidence: result.confidence,
        provider: result.provider,
      },
    });
  } catch (error: unknown) {
    // エラー時もファイル削除
    try {
      await fs.unlink(req.file.path);
    } catch {
      // Ignore file deletion errors
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'OCR処理中にエラーが発生しました',
    });
  }
}));

// Excel解析（AI使用）
router.post('/excel', requireAuthOrDemo, upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'ファイルが選択されていません',
    });
  }

  try {
    const result = await aiFileAnalysisService.analyzeFile(req.file.path, req.file.originalname);
    const normalizedShifts = aiFileAnalysisService.normalizeShifts(result);
    
    // ファイル削除
    await fs.unlink(req.file.path);
    
    res.json({
      success: true,
      data: {
        type: 'excel',
        filename: req.file.originalname,
        shifts: normalizedShifts,
        confidence: result.confidence,
        provider: result.provider,
      },
    });
  } catch (error: unknown) {
    // エラー時もファイル削除
    try {
      await fs.unlink(req.file.path);
    } catch {
      // Ignore file deletion errors
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Excel解析中にエラーが発生しました',
    });
  }
}));

// CSV解析（AI使用）
router.post('/csv', requireAuthOrDemo, upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'ファイルが選択されていません',
    });
  }

  try {
    const result = await aiFileAnalysisService.analyzeFile(req.file.path, req.file.originalname);
    const normalizedShifts = aiFileAnalysisService.normalizeShifts(result);
    
    // ファイル削除
    await fs.unlink(req.file.path);
    
    res.json({
      success: true,
      data: {
        type: 'csv',
        filename: req.file.originalname,
        shifts: normalizedShifts,
        confidence: result.confidence,
        provider: result.provider,
      },
    });
  } catch (error: unknown) {
    // エラー時もファイル削除
    try {
      await fs.unlink(req.file.path);
    } catch {
      // Ignore file deletion errors
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'CSV解析中にエラーが発生しました',
    });
  }
}));

// PDF解析（AI使用）
router.post('/pdf', requireAuthOrDemo, upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'ファイルが選択されていません',
    });
  }

  try {
    const result = await aiFileAnalysisService.analyzeFile(req.file.path, req.file.originalname);
    const normalizedShifts = aiFileAnalysisService.normalizeShifts(result);
    
    // ファイル削除
    await fs.unlink(req.file.path);
    
    res.json({
      success: true,
      data: {
        type: 'pdf',
        filename: req.file.originalname,
        shifts: normalizedShifts,
        confidence: result.confidence,
        provider: result.provider,
      },
    });
  } catch (error: unknown) {
    // エラー時もファイル削除
    try {
      await fs.unlink(req.file.path);
    } catch {
      // Ignore file deletion errors
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'PDF解析中にエラーが発生しました',
    });
  }
}));

export default router;