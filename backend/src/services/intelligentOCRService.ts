import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import type { 
  OCRProcessingSession, 
  AIProcessingResult, 
  ConsolidatedOCRResult,
  CreateShiftRequest,
  OCRProcessingResponse 
} from '../types/api';
import { ocrService } from './ocrService';
import { naturalLanguageOCRService } from './naturalLanguageOCRService';

/**
 * インテリジェントOCR統合サービス
 * 複数のAIプロバイダを並列処理し、結果を統合・比較する
 */
export class IntelligentOCRService {
  private geminiClient: GoogleGenerativeAI | null = null;
  private openaiClient: OpenAI | null = null;
  private sessionStorage: Map<string, OCRProcessingSession> = new Map();

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    // Gemini AI初期化
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      this.geminiClient = new GoogleGenerativeAI(geminiApiKey);
      console.log('Gemini AI client initialized');
    }

    // OpenAI初期化
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (openaiApiKey && openaiApiKey !== 'YOUR_OPENAI_API_KEY_HERE') {
      this.openaiClient = new OpenAI({ apiKey: openaiApiKey });
      console.log('OpenAI client initialized');
    }
  }

  /**
   * 統合OCR処理のメインエントリーポイント
   */
  async processImage(
    imageData: string,
    userId: string,
    userName?: string,
    options?: {
      aiProviders?: ('gemini' | 'openai' | 'vision')[];
      enableComparison?: boolean;
      confidenceThreshold?: number;
    }
  ): Promise<OCRProcessingResponse> {
    const startTime = Date.now();
    const sessionId = uuidv4();

    // セッション作成
    const session: OCRProcessingSession = {
      sessionId,
      userId,
      userName,
      uploadMethod: 'file', // デフォルト、後で設定可能
      imageData,
      processingOptions: {
        aiProviders: options?.aiProviders || ['gemini', 'openai', 'vision'],
        enableComparison: options?.enableComparison ?? true,
        confidenceThreshold: options?.confidenceThreshold ?? 0.7,
      },
      status: 'processing',
      createdAt: new Date().toISOString(),
    };

    this.sessionStorage.set(sessionId, session);

    try {
      // 並列AI処理
      const results = await this.processWithMultipleAI(imageData, userName, session.processingOptions.aiProviders);
      
      // 結果統合
      const consolidatedResult = this.consolidateResults(results, session.processingOptions.confidenceThreshold);

      // セッション完了
      session.status = 'completed';
      this.sessionStorage.set(sessionId, session);

      return {
        sessionId,
        results,
        consolidatedResult,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      session.status = 'failed';
      this.sessionStorage.set(sessionId, session);
      throw error;
    }
  }

  /**
   * 複数AIでの並列処理
   */
  private async processWithMultipleAI(
    imageData: string,
    userName?: string,
    providers: ('gemini' | 'openai' | 'vision')[] = ['gemini', 'openai', 'vision']
  ): Promise<Record<string, AIProcessingResult>> {
    const results: Record<string, AIProcessingResult> = {};

    // 並列処理のPromise配列
    const processingPromises = providers.map(async (provider) => {
      const startTime = Date.now();
      
      try {
        let shifts: CreateShiftRequest[] = [];
        let naturalLanguageMessage: string | undefined;
        let rawResponse: any;

        switch (provider) {
          case 'gemini':
            if (this.geminiClient) {
              const geminiResult = await this.processWithGemini(imageData, userName);
              shifts = geminiResult.shifts;
              naturalLanguageMessage = geminiResult.naturalLanguageMessage;
              rawResponse = geminiResult.rawResponse;
            } else {
              throw new Error('Gemini client not initialized');
            }
            break;

          case 'openai':
            if (this.openaiClient) {
              const openaiResult = await this.processWithOpenAI(imageData, userName);
              shifts = openaiResult.shifts;
              naturalLanguageMessage = openaiResult.naturalLanguageMessage;
              rawResponse = openaiResult.rawResponse;
            } else {
              throw new Error('OpenAI client not initialized');
            }
            break;

          case 'vision':
            const visionResult = await this.processWithGoogleVision(imageData, userName);
            shifts = visionResult.shifts;
            naturalLanguageMessage = visionResult.naturalLanguageMessage;
            rawResponse = visionResult.rawResponse;
            break;
        }

        results[provider] = {
          provider,
          success: true,
          confidence: this.calculateConfidence(shifts, provider),
          processingTime: Date.now() - startTime,
          shifts,
          naturalLanguageMessage,
          rawResponse,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results[provider] = {
          provider,
          success: false,
          confidence: 0,
          processingTime: Date.now() - startTime,
          shifts: [],
          error: errorMessage,
        };
      }
    });

    // 全ての処理完了を待機
    await Promise.allSettled(processingPromises);

    return results;
  }

  /**
   * Gemini AIでの処理
   */
  private async processWithGemini(imageData: string, userName?: string) {
    if (!this.geminiClient) {
      throw new Error('Gemini client not available');
    }

    const model = this.geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = this.generateShiftExtractionPrompt(userName);
    
    // Base64データからバイナリデータを抽出
    const imageBuffer = Buffer.from(imageData.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg'
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    return this.parseAIResponse(text, 'gemini');
  }

  /**
   * OpenAI GPT-4oでの処理
   */
  private async processWithOpenAI(imageData: string, userName?: string) {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not available');
    }

    const prompt = this.generateShiftExtractionPrompt(userName);

    const response = await this.openaiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageData } }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    const text = response.choices[0]?.message?.content || '';
    
    return this.parseAIResponse(text, 'openai');
  }

  /**
   * Google Cloud Visionでの処理
   */
  private async processWithGoogleVision(imageData: string, userName?: string) {
    // 既存のOCRサービスを活用
    const buffer = Buffer.from(imageData.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
    
    // Google Vision OCRでテキスト抽出
    const visionResult = await ocrService.processImage(buffer);
    
    if (!visionResult.success || !visionResult.data) {
      throw new Error('Google Vision OCR failed');
    }

    // 自然言語処理サービスでシフト抽出
    const nlpResult = await naturalLanguageOCRService.processOCRText(
      visionResult.data.extractedText,
      userName
    );

    return {
      shifts: nlpResult.extractedShifts,
      naturalLanguageMessage: nlpResult.naturalLanguageMessage,
      rawResponse: {
        visionResult: visionResult.data,
        nlpResult,
      },
    };
  }

  /**
   * シフト抽出用プロンプト生成
   */
  private generateShiftExtractionPrompt(userName?: string): string {
    const userFilter = userName ? `特に「${userName}」の名前に関連するシフトを優先的に抽出してください。` : '';
    
    return `
この画像はシフト表です。以下の情報を抽出してJSON形式で返してください。
${userFilter}

抽出する情報:
- 日付 (YYYY-MM-DD形式)
- 開始時間 (HH:MM形式)
- 終了時間 (HH:MM形式)
- 勤務場所/職場名
- 時給 (数値のみ)

出力形式（JSON）:
{
  "naturalLanguageMessage": "親しみやすい結果説明文",
  "shifts": [
    {
      "date": "2024-07-20",
      "startTime": "09:00",
      "endTime": "17:00",
      "jobSourceName": "カフェ店舗",
      "hourlyRate": 1000,
      "breakMinutes": 60,
      "description": "OCR自動登録",
      "isConfirmed": false
    }
  ],
  "confidence": 0.85
}

注意点:
- 日付は今年（${new Date().getFullYear()}年）として処理
- 時間は24時間形式
- 勤務場所が不明な場合は「アルバイト先」
- 時給が読み取れない場合は1000を設定
- シフトが見つからない場合はshifts配列を空にする
- 信頼度は抽出精度に基づいて0-1で設定
`;
  }

  /**
   * AI応答の解析
   */
  private parseAIResponse(text: string, provider: string) {
    try {
      // JSONの抽出
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(`No JSON found in ${provider} response`);
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // CreateShiftRequest形式に変換
      const shifts: CreateShiftRequest[] = (parsed.shifts || []).map((shift: any) => ({
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        jobSourceName: shift.jobSourceName || shift.workplace || 'アルバイト先',
        hourlyRate: shift.hourlyRate || 1000,
        breakMinutes: shift.breakMinutes || 60,
        description: shift.description || `OCR自動登録 (${provider})`,
        isConfirmed: false,
      }));

      return {
        shifts,
        naturalLanguageMessage: parsed.naturalLanguageMessage,
        rawResponse: parsed,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to parse ${provider} response:`, error);
      return {
        shifts: [],
        naturalLanguageMessage: `${provider}での解析に失敗しました。`,
        rawResponse: { error: errorMessage, originalText: text },
      };
    }
  }

  /**
   * 結果の信頼度計算
   */
  private calculateConfidence(shifts: CreateShiftRequest[], provider: string): number {
    if (shifts.length === 0) return 0;

    let confidence = 0.5; // ベース信頼度

    // プロバイダー別の信頼度調整
    switch (provider) {
      case 'gemini':
        confidence += 0.3; // Geminiは高精度
        break;
      case 'openai':
        confidence += 0.25; // OpenAIも高精度
        break;
      case 'vision':
        confidence += 0.2; // Visionは標準
        break;
    }

    // シフトデータの完全性チェック
    for (const shift of shifts) {
      if (shift.date && shift.startTime && shift.endTime && shift.jobSourceName) {
        confidence += 0.1;
      }
      if (shift.hourlyRate && shift.hourlyRate > 800) {
        confidence += 0.05;
      }
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * 複数AI結果の統合
   */
  private consolidateResults(
    results: Record<string, AIProcessingResult>,
    confidenceThreshold: number
  ): ConsolidatedOCRResult {
    const successfulResults = Object.values(results).filter(r => r.success && r.shifts.length > 0);
    
    if (successfulResults.length === 0) {
      return {
        recommendedShifts: [],
        conflicts: [],
        needsReview: true,
        overallConfidence: 0,
      };
    }

    // 最高信頼度の結果を基準とする
    const bestResult = successfulResults.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );

    // 矛盾検出（複数結果がある場合）
    const conflicts = this.detectConflicts(successfulResults);

    // 統合結果
    const recommendedShifts = bestResult.shifts;
    const overallConfidence = this.calculateOverallConfidence(successfulResults);
    const needsReview = overallConfidence < confidenceThreshold || conflicts.length > 0;

    return {
      recommendedShifts,
      conflicts,
      needsReview,
      overallConfidence,
    };
  }

  /**
   * 結果間の矛盾検出
   */
  private detectConflicts(results: AIProcessingResult[]) {
    const conflicts: ConsolidatedOCRResult['conflicts'] = [];
    
    if (results.length < 2) return conflicts;

    // シフト数の矛盾
    const shiftCounts = results.map(r => r.shifts.length);
    if (Math.max(...shiftCounts) - Math.min(...shiftCounts) > 1) {
      conflicts.push({
        field: 'shiftCount',
        values: results.map(r => ({
          provider: r.provider,
          value: r.shifts.length,
          confidence: r.confidence,
        })),
      });
    }

    // 時間の矛盾（同じ日付のシフトがある場合）
    const dateGroups: Record<string, Array<{ provider: string; shift: CreateShiftRequest; confidence: number }>> = {};
    
    results.forEach(result => {
      result.shifts.forEach(shift => {
        if (!dateGroups[shift.date]) {
          dateGroups[shift.date] = [];
        }
        dateGroups[shift.date].push({
          provider: result.provider,
          shift,
          confidence: result.confidence,
        });
      });
    });

    // 各日付で時間の矛盾をチェック
    Object.entries(dateGroups).forEach(([date, shifts]) => {
      if (shifts.length > 1) {
        const startTimes = [...new Set(shifts.map(s => s.shift.startTime))];
        const endTimes = [...new Set(shifts.map(s => s.shift.endTime))];
        
        if (startTimes.length > 1) {
          conflicts.push({
            field: `startTime_${date}`,
            values: shifts.map(s => ({
              provider: s.provider,
              value: s.shift.startTime,
              confidence: s.confidence,
            })),
          });
        }
        
        if (endTimes.length > 1) {
          conflicts.push({
            field: `endTime_${date}`,
            values: shifts.map(s => ({
              provider: s.provider,
              value: s.shift.endTime,
              confidence: s.confidence,
            })),
          });
        }
      }
    });

    return conflicts;
  }

  /**
   * 全体的な信頼度計算
   */
  private calculateOverallConfidence(results: AIProcessingResult[]): number {
    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length === 0) return 0;

    const avgConfidence = successfulResults.reduce((sum, r) => sum + r.confidence, 0) / successfulResults.length;
    
    // 複数結果の一致度を考慮
    const consensusBonus = successfulResults.length > 1 ? 0.1 : 0;
    
    return Math.min(avgConfidence + consensusBonus, 1.0);
  }

  /**
   * セッション情報取得
   */
  getSession(sessionId: string): OCRProcessingSession | undefined {
    return this.sessionStorage.get(sessionId);
  }

  /**
   * セッション削除（メモリ管理）
   */
  cleanupSession(sessionId: string): void {
    this.sessionStorage.delete(sessionId);
  }
}

// シングルトンインスタンス
export const intelligentOCRService = new IntelligentOCRService();