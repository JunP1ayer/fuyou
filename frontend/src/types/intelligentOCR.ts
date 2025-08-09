// インテリジェントOCR統合システム用型定義

export interface AIProvider {
  name: 'gemini' | 'openai' | 'vision';
  displayName: string;
  icon: React.ReactNode;
  description: string;
  priority: number;
  available: boolean;
  processingTime?: number;
  confidence?: number;
  status: 'idle' | 'processing' | 'completed' | 'failed';
}

export interface ProcessingSession {
  sessionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  uploadMethod: 'file' | 'drag' | 'clipboard' | 'camera';
  imagePreview?: string;
  startTime: number;
  processingOptions: {
    aiProviders: ('gemini' | 'openai' | 'vision')[];
    enableComparison: boolean;
    confidenceThreshold: number;
  };
}

export interface AIProcessingResult {
  provider: 'gemini' | 'openai' | 'vision';
  success: boolean;
  confidence: number;
  processingTime: number;
  shifts: OCRExtractedShift[];
  naturalLanguageMessage?: string;
  rawResponse?: Record<string, unknown>;
  error?: string;
}

export interface OCRExtractedShift {
  date: string;
  startTime: string;
  endTime: string;
  jobSourceName: string;
  hourlyRate: number;
  breakMinutes?: number;
  description?: string;
  isConfirmed: boolean;
  confidence?: number;
}

export interface ConflictData {
  field: string;
  values: Array<{
    provider: string;
    value: string | number | boolean;
    confidence: number;
  }>;
}

export interface ConsolidatedResult {
  recommendedShifts: OCRExtractedShift[];
  conflicts: ConflictData[];
  needsReview: boolean;
  overallConfidence: number;
}

export interface OCRProcessingResponse {
  sessionId: string;
  results: Record<string, AIProcessingResult>;
  consolidatedResult: ConsolidatedResult;
  processingTimeMs: number;
}

export interface UploadState {
  isDragging: boolean;
  isProcessing: boolean;
  selectedImage: File | null;
  imagePreview: string | null;
  uploadMethod: 'file' | 'drag' | 'clipboard' | 'camera' | null;
  progress: number;
}

export interface UserProfile {
  displayName?: string;
  shiftFilterName?: string;
  preferences: {
    defaultHourlyRate?: number;
    defaultBreakMinutes?: number;
    autoConfirmHighConfidence?: boolean;
    ocrConfidenceThreshold?: number;
  };
}

export interface IntelligentOCRConfig {
  maxFileSize: number;
  supportedFormats: string[];
  apiEndpoints: {
    process: string;
    uploadAndProcess: string;
    session: string;
    status: string;
  };
  aiProviderPriority: ('gemini' | 'openai' | 'vision')[];
}

export interface ProcessingStage {
  stage: 'upload' | 'processing' | 'results' | 'editing' | 'saving';
  title: string;
  description: string;
  progress: number;
  canGoBack: boolean;
  canSkip: boolean;
}

export interface EditableShift extends OCRExtractedShift {
  id: string;
  isEdited: boolean;
  originalData: OCRExtractedShift;
  validationErrors: string[];
}

export interface ComparisonView {
  enabled: boolean;
  selectedProviders: ('gemini' | 'openai' | 'vision')[];
  displayMode: 'side-by-side' | 'overlay' | 'tabbed';
  highlightConflicts: boolean;
}

export interface SmartSuggestion {
  type:
    | 'time_correction'
    | 'workplace_suggestion'
    | 'rate_adjustment'
    | 'break_optimization';
  message: string;
  originalValue: string | number | boolean;
  suggestedValue: string | number | boolean;
  confidence: number;
  reason: string;
  actionable: boolean;
}

export interface ProcessingAnalytics {
  totalProcessingTime: number;
  aiProviderPerformance: Record<
    string,
    {
      processingTime: number;
      confidence: number;
      successRate: number;
    }
  >;
  accuracyMetrics: {
    dateAccuracy: number;
    timeAccuracy: number;
    workplaceAccuracy: number;
  };
  userInteractionData: {
    correctionsMade: number;
    timeSpentEditing: number;
    satisfactionScore?: number;
  };
}
