import { ImageAnnotatorClient } from '@google-cloud/vision';
import { OCRResponse, ExtractedShiftData } from '../types/ocr';

class OCRService {
  private client: ImageAnnotatorClient;
  private apiCallCount = 0;
  private totalCost = 0;

  constructor() {
    this.client = new ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  }

  /**
   * 画像からテキストを抽出 (Google Vision API使用)
   */
  async extractTextFromImage(imageBuffer: Buffer): Promise<OCRResponse> {
    const startTime = Date.now();
    
    try {
      // API呼び出し制限チェック
      if (this.apiCallCount >= 1000) { // 月次制限例
        throw new Error('API_LIMIT_EXCEEDED');
      }

      // Google Vision API呼び出し
      const [result] = await this.client.documentTextDetection({
        image: { content: imageBuffer },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        imageContext: {
          languageHints: ['ja', 'en'], // 日本語と英語を優先
        },
      });

      this.apiCallCount++;
      this.totalCost += 0.0015; // $1.50 per 1000 requests

      const detections = result.textAnnotations;
      if (!detections || detections.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_TEXT_DETECTED',
            message: 'テキストを検出できませんでした。画像がはっきりと写っているか確認してください。',
          },
          metadata: {
            processingTimeMs: Date.now() - startTime,
            apiCallCount: this.apiCallCount,
            estimatedCost: this.totalCost,
          },
        };
      }

      // メインテキストと詳細情報を抽出
      const fullText = detections[0].description || '';
      const boundingBoxes = detections.slice(1).map(detection => ({
        text: detection.description || '',
        confidence: 0.8, // Google Visionは信頼度を直接提供しないため推定値
        vertices: detection.boundingPoly?.vertices?.map(vertex => ({
          x: vertex.x || 0,
          y: vertex.y || 0,
        })) || [],
      }));

      // シフト関連情報の推測
      const suggestions = this.extractShiftSuggestions(fullText);

      return {
        success: true,
        data: {
          extractedText: fullText,
          confidence: this.calculateOverallConfidence(boundingBoxes),
          boundingBoxes,
          suggestions,
        },
        metadata: {
          processingTimeMs: Date.now() - startTime,
          apiCallCount: this.apiCallCount,
          estimatedCost: this.totalCost,
        },
      };

    } catch (error: any) {
      console.error('OCR processing error:', error);
      
      return {
        success: false,
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: this.getErrorMessage(error),
          details: process.env.NODE_ENV === 'development' ? error : undefined,
        },
        metadata: {
          processingTimeMs: Date.now() - startTime,
          apiCallCount: this.apiCallCount,
          estimatedCost: this.totalCost,
        },
      };
    }
  }

  /**
   * 画像処理のメインメソッド（IntelligentOCRService用）
   */
  async processImage(imageBuffer: Buffer): Promise<OCRResponse> {
    return this.extractTextFromImage(imageBuffer);
  }

  /**
   * テキストからシフト関連情報を推測
   */
  private extractShiftSuggestions(text: string): {
    possibleDates?: string[];
    possibleTimes?: string[];
    possibleAmounts?: string[];
  } {
    const suggestions: any = {};

    // 日付パターンの検出
    const datePatterns = [
      /(\d{1,2})[\/\-月](\d{1,2})[日]?/g,
      /(\d{4})[\/\-年](\d{1,2})[\/\-月](\d{1,2})[日]?/g,
    ];
    
    const dates: string[] = [];
    datePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        dates.push(match[0]);
      }
    });
    
    if (dates.length > 0) {
      suggestions.possibleDates = [...new Set(dates)];
    }

    // 時間パターンの検出
    const timePatterns = [
      /(\d{1,2}):(\d{2})/g,
      /(\d{1,2})時(\d{2})?分?/g,
      /(午前|午後)(\d{1,2})[時:]?(\d{2})?/g,
    ];

    const times: string[] = [];
    timePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        times.push(match[0]);
      }
    });

    if (times.length > 0) {
      suggestions.possibleTimes = [...new Set(times)];
    }

    // 金額パターンの検出 (時給等)
    const amountPattern = /(\d+)円/g;
    const amounts: string[] = [];
    let match;
    while ((match = amountPattern.exec(text)) !== null) {
      amounts.push(match[0]);
    }

    if (amounts.length > 0) {
      suggestions.possibleAmounts = [...new Set(amounts)];
    }

    return suggestions;
  }

  /**
   * 全体的な信頼度を計算
   */
  private calculateOverallConfidence(boundingBoxes: any[]): number {
    if (boundingBoxes.length === 0) return 0;
    
    // 簡単な信頼度計算 (実際のプロジェクトでは更に複雑なロジック)
    const avgConfidence = boundingBoxes.reduce((sum, box) => sum + box.confidence, 0) / boundingBoxes.length;
    return Math.round(avgConfidence * 100) / 100;
  }

  /**
   * エラーメッセージの生成
   */
  private getErrorMessage(error: any): string {
    switch (error.code) {
      case 'PERMISSION_DENIED':
        return 'Google Cloud Vision APIの認証に失敗しました。設定を確認してください。';
      case 'QUOTA_EXCEEDED':
        return 'API利用制限に達しました。しばらく時間をおいてから再試行してください。';
      case 'INVALID_ARGUMENT':
        return '画像形式が不正です。JPEG、PNG形式の画像をアップロードしてください。';
      case 'API_LIMIT_EXCEEDED':
        return '月次API制限に達しました。来月まで待つか、有料プランにアップグレードしてください。';
      default:
        return '画像の処理中にエラーが発生しました。画像を確認して再試行してください。';
    }
  }

  /**
   * API使用状況の取得
   */
  getUsageStats() {
    return {
      apiCallCount: this.apiCallCount,
      estimatedCost: this.totalCost,
      remainingCalls: Math.max(0, 1000 - this.apiCallCount),
    };
  }

  /**
   * 使用状況のリセット (月初等に呼び出し)
   */
  resetUsageStats() {
    this.apiCallCount = 0;
    this.totalCost = 0;
  }
}

export const ocrService = new OCRService();