// 🤖 GPT-5専用シフト表解析API
export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    const { image, workerName, workplaceName } = req.body;

    // 入力検証
    if (!image) {
      return res.status(400).json({
        success: false,
        error: '画像データが必要です'
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key not configured'
      });
    }

    // GPT-5でシフト表を解析
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-5', // GPT-5を明示的に指定
        max_completion_tokens: 1000,
        temperature: 0.1,
        messages: [
          {
            role: 'system',
            content: `あなたはプロのシフト表解析AIです。
画像からシフト情報を正確に抽出し、以下のJSON形式で返してください：

{
  "success": true,
  "analysis": {
    "detectedWorkerName": "検出した作業者名",
    "workplaceDetected": "検出した職場名",
    "totalShiftsFound": 3
  },
  "shifts": [
    {
      "date": "2024-07-22",
      "startTime": "09:00",
      "endTime": "17:00",
      "confidence": 0.95
    }
  ],
  "warnings": ["警告メッセージがあれば"],
  "processingNotes": "解析過程の説明"
}

重要な解析ルール:
- 日付: YYYY-MM-DD形式（2024年として処理）
- 時間: HH:MM形式（24時間表記）
- ${workerName ? `指定作業者「${workerName}」に関連するシフトを優先抽出` : ''}
- ${workplaceName ? `職場「${workplaceName}」のシフトを対象` : ''}
- 不明な情報は推測せず、confidence値を下げる
- 複数のシフトがある場合は全て抽出`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `この画像はシフト表です。${workerName ? `作業者名: ${workerName}` : ''}${workplaceName ? ` / 職場: ${workplaceName}` : ''}\n\nシフト情報を正確に抽出してください。`
              },
              {
                type: 'image_url',
                image_url: {
                  url: image,
                  detail: 'high'
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('GPT-5 API Error:', {
        status: response.status,
        error: errorData
      });
      
      return res.status(response.status).json({
        success: false,
        error: `GPT-5 API エラー: ${response.status}`,
        details: errorData.substring(0, 500)
      });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    
    if (!content) {
      return res.status(500).json({
        success: false,
        error: 'GPT-5から応答を取得できませんでした'
      });
    }

    // JSON解析
    try {
      const analysisResult = JSON.parse(content);
      
      // 使用状況ログ
      console.log('GPT-5 Shift Analysis:', {
        timestamp: new Date().toISOString(),
        workerName,
        workplaceName,
        shiftsDetected: analysisResult.shifts?.length || 0,
        tokensUsed: result.usage?.total_tokens || 0
      });

      return res.status(200).json(analysisResult);
      
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      
      // JSONパース失敗時のフォールバック
      return res.status(200).json({
        success: false,
        error: 'GPT-5の応答をJSON形式で解析できませんでした',
        rawResponse: content.substring(0, 1000),
        fallbackAnalysis: {
          detectedContent: content.length > 0,
          possibleShiftData: content.includes('時') || content.includes(':'),
          needsManualReview: true
        }
      });
    }

  } catch (error) {
    console.error('Shift Analysis Error:', error);
    return res.status(500).json({
      success: false,
      error: '内部サーバーエラー',
      message: error.message
    });
  }
}