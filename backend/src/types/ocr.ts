// OCR機能の型定義
import { z } from 'zod';

// OCRリクエストの型
export const OCRUploadSchema = z.object({
  userId: z.string().uuid(),
  imageSize: z.number().max(5 * 1024 * 1024), // 5MB制限
  imageType: z.enum(['image/jpeg', 'image/png', 'image/jpg']),
});

// OCRレスポンスの型
export interface OCRResponse {
  success: boolean;
  data?: {
    extractedText: string;
    confidence: number;
    boundingBoxes?: Array<{
      text: string;
      confidence: number;
      vertices: Array<{ x: number; y: number }>;
    }>;
    suggestions?: {
      possibleDates?: string[];
      possibleTimes?: string[];
      possibleAmounts?: string[];
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    processingTimeMs: number;
    apiCallCount: number;
    estimatedCost: number;
  };
}

// シフト情報抽出結果の型
export interface ExtractedShiftData {
  shifts: Array<{
    date?: string;
    startTime?: string;
    endTime?: string;
    hourlyRate?: number;
    location?: string;
    confidence: number;
  }>;
  extractionMethod: 'ocr' | 'template' | 'manual';
  needsReview: boolean;
}

export type OCRUploadRequest = z.infer<typeof OCRUploadSchema>;