import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import type { Express } from 'express';

// セキュアなファイルアップロード設定
const storage = multer.memoryStorage(); // メモリ保存（ファイルを残さない）

// ファイル検証関数
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // MIME型の検証
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('対応していないファイル形式です。JPEG、PNG形式をアップロードしてください。'));
  }
};

// Multer設定
export const uploadConfig = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB制限
    files: 1, // 1ファイルのみ
  },
});

// ファイル検証ミドルウェア
export const validateImageFile = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'NO_FILE',
        message: 'ファイルがアップロードされていません。',
      },
    });
  }

  // ファイルサイズの追加検証
  if (req.file.size > 5 * 1024 * 1024) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'ファイルサイズが大きすぎます。5MB以下のファイルをアップロードしてください。',
      },
    });
  }

  // ファイル形式の追加検証
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: '対応していないファイル形式です。JPEG、PNG形式をアップロードしてください。',
      },
    });
  }

  next();
};