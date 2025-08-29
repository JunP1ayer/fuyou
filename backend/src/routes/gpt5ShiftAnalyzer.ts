// 🤖 GPT-5 シフト表解析エンドポイント

import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { z } from 'zod';
import { validateSchema } from '../middleware/validation';

const router = Router();

// OPTIONSリクエスト（プリフライト）に対応
router.options('/', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

// リクエストスキーマ
const gpt5AnalysisSchema = z.object({
  image: z.string().min(1, '画像データが必要です'),
  workerName: z.string().optional(),
  workplaceName: z.string().optional()
});

// GPT-5シフト解析エンドポイント
router.post('/', validateSchema(gpt5AnalysisSchema), asyncHandler(async (req, res) => {
  // CORSヘッダー設定
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  const { image, workerName, workplaceName } = req.body;

  // OpenAI API Key確認
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'OpenAI API key not configured'
    });
  }

  try {
    // OpenAI Responses API を使用（dynamic importでESM互換）
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey });
    // 既定を gpt-5 に。必要に応じて OPENAI_GPT_MODEL で上書き可（例: gpt-5.1）
    const model = process.env.OPENAI_GPT_MODEL || 'gpt-5';
    console.log(`🤖 Using GPT model: ${model}`);

    const systemPrompt = `あなたはプロのシフト表解析AIです。画像からシフト情報を正確に抽出し、厳格に次のJSONのみを返してください（説明やコードフェンスは禁止）：

{
  "success": true,
  "analysis": {
    "detectedWorkerName": "検出した作業者名",
    "workplaceDetected": "検出した職場名",
    "totalShiftsFound": 3
  },
  "shifts": [
    { "date": "YYYY-MM-DD", "startTime": "HH:MM", "endTime": "HH:MM", "confidence": 0.95 }
  ],
  "warnings": ["警告メッセージがあれば"],
  "processingNotes": "解析過程の説明"
}

重要な解析ルール:
- 日付は YYYY-MM-DD 形式（年が明示されない場合は現在年）
- 時間は 24時間表記 HH:MM
- ${workerName ? `指定作業者「${workerName}」を優先` : '特定作業者の指定なし'}
- ${workplaceName ? `職場「${workplaceName}」を対象` : '特定職場の指定なし'}
- 不明な情報は推測しない（confidenceを下げる）
- 複数のシフトはすべて抽出
- 出力はJSONのみで、説明や追加テキストは禁止`;

    const userText = `この画像はシフト表です。${workerName ? `作業者名: ${workerName}` : ''}${workplaceName ? ` / 職場: ${workplaceName}` : ''}`;

    const aiResponse = await client.responses.create({
      model,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: systemPrompt },
            { type: 'input_text', text: userText },
            { type: 'input_image', image_url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`, detail: 'high' },
          ],
        },
      ],
      max_output_tokens: 1500,
      temperature: 0.1,
    });

    const outputText = (aiResponse.output_text as string) || '';
    if (!outputText) {
      return res.status(500).json({ success: false, error: 'AI応答が空でした' });
    }

    // JSON抽出（コードフェンスや余計な前後を除去）
    const extractJson = (text: string): string | null => {
      const fenced = text.replace(/^```[a-zA-Z]*\n|```$/g, '').trim();
      const match = fenced.match(/\{[\s\S]*\}/);
      return match ? match[0] : null;
    };

    const jsonString = extractJson(outputText) || outputText;

    try {
      const analysisResult = JSON.parse(jsonString);

      console.log('Shift Analysis (Responses API):', {
        timestamp: new Date().toISOString(),
        workerName,
        workplaceName,
        shiftsDetected: analysisResult.shifts?.length || 0,
      });

      return res.status(200).json(analysisResult);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return res.status(200).json({
        success: false,
        error: 'AI応答のJSON解析に失敗しました',
        rawResponse: outputText.substring(0, 1000),
        fallbackAnalysis: {
          detectedContent: outputText.length > 0,
          possibleShiftData: outputText.includes('時') || outputText.includes(':'),
          needsManualReview: true,
        },
      });
    }

  } catch (error) {
    console.error('GPT-5 Shift Analysis Error:', error);
    return res.status(500).json({
      success: false,
      error: '内部サーバーエラー',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

export { router as gpt5ShiftAnalyzerRoutes };