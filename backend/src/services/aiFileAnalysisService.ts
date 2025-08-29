import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';

// OpenAI設定
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Gemini設定（Google AI SDK使用）
interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

export interface AnalysisResult {
  shifts: Array<{
    date: string;
    startTime: string;
    endTime: string;
    jobSourceName: string;
    isConfirmed: boolean;
    notes?: string;
  }>;
  confidence: number;
  provider: 'openai' | 'gemini';
  originalFileName: string;
}

class AIFileAnalysisService {
  /**
   * OpenAI Chat APIを使用してファイルを解析（simplified approach）
   */
  async analyzeWithOpenAI(filePath: string, originalFileName: string): Promise<AnalysisResult> {
    try {
      logger.info('OpenAI Chat API analysis started', { originalFileName });

      // ファイルが画像の場合のみ、Chat APIで直接処理
      const fileData = await fs.readFile(filePath);
      const base64Data = fileData.toString('base64');
      const mimeType = this.getMimeType(originalFileName);

      if (!mimeType.startsWith('image/')) {
        throw new Error('OpenAI Chat API supports only image files for direct analysis');
      }

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_GPT_MODEL || 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `シフト表画像を解析して、以下のJSON形式でシフト情報を抽出してください：

{
  "shifts": [
    {
      "date": "2024-01-15",
      "startTime": "09:00", 
      "endTime": "17:00",
      "jobSourceName": "店舗名",
      "notes": "備考"
    }
  ],
  "confidence": 0.95
}

注意事項：
- 日付はYYYY-MM-DD形式
- 時間は24時間表記（HH:MM）
- confidence は0.0-1.0の範囲`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`
                }
              }
            ]
          }
        ],
        max_tokens: 1500
      });

      const responseText = response.choices[0]?.message?.content || '';
      
      // JSONパース
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const result = JSON.parse(jsonMatch[0]);

      logger.info('OpenAI analysis completed', { 
        shiftsFound: result.shifts?.length || 0,
        confidence: result.confidence 
      });

      return {
        shifts: result.shifts || [],
        confidence: result.confidence || 0.8,
        provider: 'openai',
        originalFileName,
      };

    } catch (error) {
      logger.error('OpenAI analysis failed', { error, originalFileName });
      throw new Error(`OpenAI解析エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gemini APIを使用してファイルを解析
   */
  async analyzeWithGemini(filePath: string, originalFileName: string): Promise<AnalysisResult> {
    try {
      logger.info('Gemini API analysis started', { originalFileName });

      const fileData = await fs.readFile(filePath);
      const base64Data = fileData.toString('base64');
      const mimeType = this.getMimeType(originalFileName);

      const prompt = `
あなたはシフト表を解析する専門のAIです。
提供されたファイルからシフト情報を抽出してください。

抽出すべき情報：
1. 日付（YYYY-MM-DD形式）
2. 開始時間（HH:MM形式）
3. 終了時間（HH:MM形式）
4. 勤務先名（可能な限り）
5. 備考（特記事項があれば）

以下のJSON形式でのみ回答してください：

{
  "shifts": [
    {
      "date": "2024-01-15",
      "startTime": "09:00",
      "endTime": "17:00",
      "jobSourceName": "コンビニ",
      "notes": "特記事項があれば"
    }
  ],
  "confidence": 0.95
}

注意事項：
- 不明な情報は空文字にしてください
- 日付は必ずYYYY-MM-DD形式
- 時間は24時間表記（HH:MM）
- confidence は 0.0-1.0 の範囲で確信度を示してください
      `;

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=' + process.env.GEMINI_API_KEY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 32,
            topP: 1,
            maxOutputTokens: 4096,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as GeminiResponse;
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini');
      }

      const responseText = data.candidates[0].content.parts[0].text;

      // JSONパース
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }

      const result = JSON.parse(jsonMatch[0]);

      logger.info('Gemini analysis completed', { 
        shiftsFound: result.shifts?.length || 0,
        confidence: result.confidence 
      });

      return {
        shifts: result.shifts || [],
        confidence: result.confidence || 0.8,
        provider: 'gemini',
        originalFileName,
      };

    } catch (error) {
      logger.error('Gemini analysis failed', { error, originalFileName });
      throw new Error(`Gemini解析エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 自動選択してファイルを解析（OpenAI優先、失敗時はGemini）
   */
  async analyzeFile(filePath: string, originalFileName: string): Promise<AnalysisResult> {
    // OpenAIを優先して試行
    if (process.env.OPENAI_API_KEY) {
      try {
        return await this.analyzeWithOpenAI(filePath, originalFileName);
      } catch (error) {
        logger.warn('OpenAI analysis failed, trying Gemini', { error });
      }
    }

    // Geminiで試行
    if (process.env.GEMINI_API_KEY) {
      try {
        return await this.analyzeWithGemini(filePath, originalFileName);
      } catch (error) {
        logger.error('Both OpenAI and Gemini analysis failed', { error });
        throw error;
      }
    }

    throw new Error('No AI API keys configured');
  }

  /**
   * ファイル拡張子からMIMEタイプを取得
   */
  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls': 'application/vnd.ms-excel',
      '.csv': 'text/csv',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * 結果を標準化（既存のシフト形式に合わせる）
   */
  normalizeShifts(result: AnalysisResult) {
    return result.shifts.map(shift => ({
      ...shift,
      isConfirmed: false, // AI解析結果は未確定として扱う
      jobSourceName: shift.jobSourceName || 'AI解析',
    }));
  }
}

export const aiFileAnalysisService = new AIFileAnalysisService();