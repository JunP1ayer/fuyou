// Vercel Serverless Function for Gemini Vision API
export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS リクエスト（プリフライト）の処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST以外は拒否
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, prompt } = req.body;

    // 基本バリデーション
    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    // 環境変数からAPIキーを取得
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    // base64データからmimeTypeとdataを分離
    const base64Match = image.match(/^data:([^;]+);base64,(.+)$/);
    if (!base64Match) {
      return res.status(400).json({ error: 'Invalid base64 image format' });
    }

    const mimeType = base64Match[1];
    const base64Data = base64Match[2];

    // Gemini API呼び出し
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `あなたはアルバイトのシフト表を解析する専門AIです。
画像からシフト情報を抽出し、以下のJSON形式で出力してください：

{
  "success": true,
  "shifts": [
    {
      "date": "2024-07-22",
      "startTime": "09:00",
      "endTime": "17:00",
      "jobName": "推定されるバイト先名",
      "notes": "特記事項があれば"
    }
  ],
  "confidence": 0.95,
  "detectedText": "認識されたテキスト全体"
}

重要な指示：
- 日付は必ずYYYY-MM-DD形式
- 時間は必ずHH:MM形式（24時間表記）
- バイト先名が不明の場合は"バイト先"とする
- 曖昧な情報は confidence を下げる
- 確実に読み取れない場合は該当項目を除外

${prompt || 'この画像からシフト情報を抽出してください。'}`
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1000,
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error('Gemini API Error:', errorData);
      return res.status(geminiResponse.status).json({ 
        error: 'Gemini API request failed',
        details: geminiResponse.statusText
      });
    }

    const result = await geminiResponse.json();
    
    // レスポンスから内容を抽出
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      return res.status(500).json({ error: 'No content received from Gemini' });
    }

    // JSONパース試行
    try {
      // Geminiは時々```json```で囲むので、それを除去
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsedContent = JSON.parse(cleanContent);
      
      // 使用状況をログ出力（監視用）
      console.log('Gemini Vision API Usage:', {
        timestamp: new Date().toISOString(),
        prompt_tokens: result.usageMetadata?.promptTokenCount || 0,
        candidates_tokens: result.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: result.usageMetadata?.totalTokenCount || 0,
        shifts_detected: parsedContent.shifts?.length || 0,
        confidence: parsedContent.confidence || 0
      });

      return res.status(200).json(parsedContent);
      
    } catch (parseError) {
      // JSONパースに失敗した場合、テキストとして返す
      console.error('JSON Parse Error:', parseError);
      console.error('Raw AI Response:', content);
      
      // テキストから可能な限りシフト情報を抽出
      const fallbackResult = extractShiftsFromText(content);
      
      return res.status(200).json({
        success: fallbackResult.shifts.length > 0,
        error: fallbackResult.shifts.length === 0 ? 'Failed to parse AI response as JSON' : null,
        rawResponse: content,
        shifts: fallbackResult.shifts,
        confidence: 0.3, // 低い信頼度
        note: 'JSONパース失敗のためテキスト解析で代替'
      });
    }

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}

// レート制限チェック（将来の拡張用）
function checkRateLimit(req) {
  // IPベースの簡易レート制限
  // 実装は省略（Redis等を使用して実装）
  return true;
}

// フォールバック用テキスト解析関数
function extractShiftsFromText(text) {
  const shifts = [];
  
  try {
    // 日付パターン（様々な形式に対応）
    const datePatterns = [
      /(\d{4}-\d{2}-\d{2})/g,  // YYYY-MM-DD
      /(\d{1,2}\/\d{1,2})/g,   // M/D or MM/DD
      /(\d{1,2}月\d{1,2}日)/g  // M月D日
    ];
    
    // 時間パターン
    const timePatterns = [
      /(\d{1,2}:\d{2})/g,      // HH:MM
      /(\d{1,2}時\d{0,2}分?)/g // H時MM分
    ];
    
    const lines = text.split('\n');
    let currentDate = null;
    
    for (const line of lines) {
      // 日付を検索
      for (const pattern of datePatterns) {
        const dateMatch = line.match(pattern);
        if (dateMatch) {
          currentDate = normalizeDate(dateMatch[0]);
          break;
        }
      }
      
      // 時間を検索
      const times = [];
      for (const pattern of timePatterns) {
        const timeMatches = line.match(pattern);
        if (timeMatches) {
          times.push(...timeMatches.map(t => normalizeTime(t)));
        }
      }
      
      // シフトデータを構築
      if (currentDate && times.length >= 2) {
        shifts.push({
          date: currentDate,
          startTime: times[0],
          endTime: times[1],
          jobName: "バイト先",
          notes: "テキスト解析による推定"
        });
      }
    }
    
  } catch (error) {
    console.error('Text extraction error:', error);
  }
  
  return { shifts };
}

// 日付正規化
function normalizeDate(dateStr) {
  if (dateStr.includes('-')) {
    return dateStr; // すでにYYYY-MM-DD形式
  }
  
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    const year = new Date().getFullYear();
    return `${year}-${month}-${day}`;
  }
  
  if (dateStr.includes('月')) {
    const monthMatch = dateStr.match(/(\d{1,2})月/);
    const dayMatch = dateStr.match(/(\d{1,2})日/);
    if (monthMatch && dayMatch) {
      const month = monthMatch[1].padStart(2, '0');
      const day = dayMatch[1].padStart(2, '0');
      const year = new Date().getFullYear();
      return `${year}-${month}-${day}`;
    }
  }
  
  return dateStr;
}

// 時間正規化
function normalizeTime(timeStr) {
  if (timeStr.includes(':')) {
    return timeStr; // すでにHH:MM形式
  }
  
  if (timeStr.includes('時')) {
    const hourMatch = timeStr.match(/(\d{1,2})時/);
    const minuteMatch = timeStr.match(/(\d{1,2})分/);
    if (hourMatch) {
      const hour = hourMatch[1].padStart(2, '0');
      const minute = minuteMatch ? minuteMatch[1].padStart(2, '0') : '00';
      return `${hour}:${minute}`;
    }
  }
  
  return timeStr;
}