// OCR機能のフロントエンド型定義

// OCR API レスポンス型
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
    details?: unknown;
  };
  metadata?: {
    processingTimeMs: number;
    apiCallCount: number;
    estimatedCost: number;
  };
}

// OCR使用状況統計型
export interface OCRUsageStats {
  success: boolean;
  data?: {
    userId: string;
    currentHourUsage: number;
    currentDayUsage: number;
    currentMonthUsage: number;
    limits: {
      hourly: number;
      per15min: number;
      monthly: number;
    };
    lastReset: string;
  };
}

// 抽出されたシフト情報型
export interface ExtractedShiftData {
  date?: string;
  startTime?: string;
  endTime?: string;
  hourlyRate?: number;
  location?: string;
  confidence: number;
}

// OCR処理結果統合型
export interface OCRResult {
  extractedText: string;
  confidence: number;
  shifts: ExtractedShiftData[];
  extractionMethod: 'ocr' | 'template' | 'manual';
  needsReview: boolean;
  suggestedEdits?: Array<{
    field: string;
    originalValue: string;
    suggestedValue: string;
    confidence: number;
  }>;
}

// 画像アップロード状態型
export interface ImageUploadState {
  file: File | null;
  preview: string | null;
  uploading: boolean;
  progress: number;
  error: string | null;
}

// OCR処理フロー状態
export interface OCRProcessingState {
  step: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  message: string;
  result?: OCRResult;
  error?: string;
}

// 画像入力ソース型
export type ImageInputSource = 'camera' | 'file' | 'drag-drop';

// カメラ設定型
export interface CameraSettings {
  facingMode: 'environment' | 'user';
  width: number;
  height: number;
  quality: number;
}

// OCR設定型
export interface OCRSettings {
  autoDetectShifts: boolean;
  confidenceThreshold: number;
  enableSuggestions: boolean;
  preprocessImage: boolean;
}
