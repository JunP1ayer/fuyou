import OpenAI from 'openai';
import type { CreateShiftRequest } from '../types/api';

export interface NaturalLanguageOCRResult {
  naturalLanguageMessage: string;
  extractedShifts: CreateShiftRequest[];
  confidence: number;
  needsReview: boolean;
  processingTimeMs: number;
}

export interface ShiftExtractionData {
  date: string;
  startTime: string;
  endTime: string;
  workplace?: string;
  hourlyRate?: number;
  confidence?: number;
  notes?: string;
}

export class NaturalLanguageOCRService {
  private openai: OpenAI | null = null;
  private readonly fallbackMode: boolean;

  constructor() {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      console.log(`OpenAI API Key status: ${apiKey ? 'SET' : 'NOT_SET'}`);
      
      if (apiKey && apiKey !== 'YOUR_OPENAI_API_KEY_HERE') {
        this.openai = new OpenAI({
          apiKey: apiKey,
        });
        this.fallbackMode = false;
        console.log('OpenAI API initialized successfully');
      } else {
        this.fallbackMode = true;
        console.log('OpenAI API key not configured, using fallback mode');
      }
    } catch (error) {
      console.error('Failed to initialize OpenAI:', error);
      this.fallbackMode = true;
    }
  }

  /**
   * OCRテキストを自然言語とシフトデータに変換
   */
  async processOCRText(
    ocrText: string,
    userName?: string
  ): Promise<NaturalLanguageOCRResult> {
    const startTime = Date.now();

    try {
      if (this.fallbackMode || !this.openai) {
        return this.fallbackProcessing(ocrText, startTime, userName);
      }

      // GPT-4を使用した自然言語変換
      const result = await this.processWithGPT4(ocrText, userName);
      const processingTimeMs = Date.now() - startTime;

      return {
        ...result,
        processingTimeMs,
      };
    } catch (error) {
      console.error('Natural language OCR processing failed:', error);
      return this.fallbackProcessing(ocrText, startTime, userName);
    }
  }

  /**
   * GPT-4oを使用した処理
   */
  private async processWithGPT4(
    ocrText: string,
    userName?: string
  ): Promise<Omit<NaturalLanguageOCRResult, 'processingTimeMs'>> {
    const prompt = this.generateNaturalLanguagePrompt(ocrText, userName);

    try {
      const model = process.env.OPENAI_GPT_MODEL || 'gpt-5';
      console.log(`Calling OpenAI API with ${model}...`);
      const response = await this.openai!.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'あなたは親切で正確なシフト管理アシスタントです。OCRで抽出されたテキストから、ユーザーのシフト情報を分析し、自然で親しみやすい日本語で結果を返してください。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.3, // 一貫性を重視
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('GPT-4o response is empty');
      }

      console.log('OpenAI API response received successfully');
      return this.parseGPT4Response(content);
    } catch (error) {
      console.error('GPT-4o API call failed:', error);
      throw error;
    }
  }

  /**
   * GPT-4o用プロンプト生成
   */
  private generateNaturalLanguagePrompt(ocrText: string, userName?: string): string {
    const userNameText = userName ? `「${userName}」さん` : 'ユーザー';
    
    return `
シフト表のOCRテキストから、${userNameText}のシフト情報を抽出し、自然な日本語で結果を返してください。

OCRテキスト:
${ocrText}

出力形式（JSON）:
{
  "naturalLanguageMessage": "親しみやすい挨拶とシフト情報、確認を求める文章",
  "shifts": [
    {
      "date": "YYYY-MM-DD",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "workplace": "勤務場所",
      "hourlyRate": 1000,
      "confidence": 0.9,
      "notes": "特記事項"
    }
  ],
  "confidence": 0.8,
  "needsReview": false
}

自然言語メッセージの例:
「お疲れさまです！シフト表を確認しました。
${userNameText}の今月のシフトは以下の通りです：

📅 7月20日(土) 9:00-17:00 カフェ勤務
📅 7月21日(日) 13:00-21:00 レストラン勤務

この内容で間違いありませんか？」

シフト情報が見つからない場合:
「申し訳ございません。${userNameText}のシフト情報が明確に読み取れませんでした。
画像が不鮮明だった可能性があります。
もう一度お試しいただくか、手動で入力していただけますでしょうか？」

注意点:
- 日付は今年の年を含めて正確に
- 時間は24時間形式
- 勤務場所が不明な場合は「アルバイト先」
- 信頼度は0-1の範囲で設定
- シフトが見つからない場合はshifts配列を空にしてneedsReviewをtrue
`;
  }

  /**
   * GPT-4レスポンスの解析
   */
  private parseGPT4Response(
    content: string
  ): Omit<NaturalLanguageOCRResult, 'processingTimeMs'> {
    try {
      // JSONの抽出
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in GPT-4 response');
      }

      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      
      // バリデーションと変換
      const shifts: CreateShiftRequest[] = Array.isArray((parsed as Record<string, unknown>).shifts)
        ? ((parsed as Record<string, unknown>).shifts as Array<Record<string, unknown>>).map((shift) => {
            const s = shift as Record<string, unknown>;
            const date = typeof s.date === 'string' ? s.date : '';
            const startTime = typeof s.startTime === 'string' ? s.startTime : '';
            const endTime = typeof s.endTime === 'string' ? s.endTime : '';
            const workplace = typeof s.workplace === 'string' ? s.workplace : 'アルバイト先';
            const hourlyRate = typeof s.hourlyRate === 'number' ? s.hourlyRate : 1000;
            const confidence = typeof s.confidence === 'number' ? s.confidence : 0.5;
            return {
              date,
              startTime,
              endTime,
              jobSourceName: workplace,
              hourlyRate,
              breakMinutes: 60,
              autoBreak6Hours: true,
              autoBreak8Hours: true,
              overtimeEnabled: true,
              description: `OCR自動登録 (信頼度: ${Math.round(confidence * 100)}%)`,
              isConfirmed: confidence > 0.8,
            };
          })
        : [];

      return {
        naturalLanguageMessage: (parsed.naturalLanguageMessage as string) || 'シフト情報を処理しました。',
        extractedShifts: shifts,
        confidence: (parsed.confidence as number) || 0.5,
        needsReview: (parsed.needsReview as boolean) !== false,
      };
    } catch (error) {
      console.error('Failed to parse GPT-4 response:', error);
      throw new Error('GPT-4 response parsing failed');
    }
  }

  /**
   * フォールバック処理（GPT-4が使用できない場合）
   */
  private fallbackProcessing(
    ocrText: string,
    startTime: number,
    userName?: string
  ): NaturalLanguageOCRResult {
    console.log('Using fallback OCR processing');

    // シンプルなテキスト解析
    const shifts = this.extractShiftsFromText(ocrText);
    const userNameText = userName ? `${userName}さん` : 'あなた';

    let naturalLanguageMessage: string;

    if (shifts.length === 0) {
      naturalLanguageMessage = `申し訳ございません。${userNameText}のシフト情報が明確に読み取れませんでした。

画像が不鮮明だった可能性があります。
もう一度お試しいただくか、手動で入力していただけますでしょうか？`;
    } else {
      const shiftList = shifts.map(shift => {
        const date = new Date(shift.date);
        const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
        return `📅 ${date.getMonth() + 1}月${date.getDate()}日(${dayOfWeek}) ${shift.startTime}-${shift.endTime} ${shift.jobSourceName}`;
      }).join('\n');

      naturalLanguageMessage = `お疲れさまです！シフト表を確認しました。
${userNameText}のシフト情報を読み取りました：

${shiftList}

この内容で間違いありませんか？

※ フォールバック処理により抽出されました。詳細をご確認ください。`;
    }

    return {
      naturalLanguageMessage,
      extractedShifts: shifts,
      confidence: shifts.length > 0 ? 0.6 : 0.1, // フォールバック処理は信頼度低め
      needsReview: true, // フォールバック処理は常に要確認
      processingTimeMs: Date.now() - startTime,
    };
  }

  /**
   * テキストからシフトデータを抽出（フォールバック用）
   */
  private extractShiftsFromText(text: string): CreateShiftRequest[] {
    const shifts: CreateShiftRequest[] = [];
    const lines = text.split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        // 日付パターンの検出
        const dateMatch = line.match(/(\d{1,2})\/(\d{1,2})|(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (dateMatch) {
          // 時間パターンの検出
          const timeMatch = line.match(/(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})/);
          if (timeMatch) {
            const currentYear = new Date().getFullYear();
            let dateStr: string;

            if (dateMatch[3]) {
              // YYYY-MM-DD形式
              dateStr = `${dateMatch[3]}-${dateMatch[4].padStart(2, '0')}-${dateMatch[5].padStart(2, '0')}`;
            } else {
              // MM/DD形式
              dateStr = `${currentYear}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
            }

            const shift: CreateShiftRequest = {
              date: dateStr,
              startTime: `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`,
              endTime: `${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`,
              jobSourceName: this.extractWorkplace(line) || 'アルバイト先',
              hourlyRate: this.extractHourlyRate(line) || 1000,
              breakMinutes: 60,
              autoBreak6Hours: true,
              autoBreak8Hours: true,
              overtimeEnabled: true,
              description: 'OCR自動登録（フォールバック処理）',
              isConfirmed: false,
            };

            // 基本的なバリデーション
            if (this.isValidShift(shift)) {
              shifts.push(shift);
            }
          }
        }
      } catch (error) {
        console.error('Error parsing line:', line, error);
        // 個別の行でエラーが発生しても処理を続行
      }
    }

    return shifts;
  }

  /**
   * 勤務場所を抽出
   */
  private extractWorkplace(text: string): string | null {
    const workplacePatterns = [
      /(カフェ|コーヒー)/i,
      /(レストラン|飲食)/i,
      /(コンビニ|コンビニエンス)/i,
      /(店|ショップ)/i,
      /(本店|支店)/i,
      /(新宿|渋谷|池袋|中央|南口|北口|西口|東口)/i,
    ];

    for (const pattern of workplacePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return null;
  }

  /**
   * 時給を抽出
   */
  private extractHourlyRate(text: string): number | null {
    const ratePattern = /(\d{3,4})円/;
    const match = text.match(ratePattern);
    
    if (match) {
      const rate = parseInt(match[1]);
      // 妥当な時給の範囲チェック
      if (rate >= 800 && rate <= 3000) {
        return rate;
      }
    }

    return null;
  }

  /**
   * シフトデータの妥当性チェック
   */
  private isValidShift(shift: CreateShiftRequest): boolean {
    try {
      // 日付の妥当性
      const date = new Date(shift.date);
      if (isNaN(date.getTime())) {
        return false;
      }

      // 時間の妥当性
      const timePattern = /^\d{2}:\d{2}$/;
      if (!timePattern.test(shift.startTime) || !timePattern.test(shift.endTime)) {
        return false;
      }

      // 開始時間 < 終了時間
      const start = new Date(`2000-01-01T${shift.startTime}`);
      const end = new Date(`2000-01-01T${shift.endTime}`);
      if (start >= end) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}

// シングルトンインスタンス
export const naturalLanguageOCRService = new NaturalLanguageOCRService();