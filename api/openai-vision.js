// Vercel Serverless Function for OpenAI Vision API
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
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        debug: 'OPENAI_API_KEY environment variable is not set'
      });
    }
    
    // APIキーの形式チェック（sk-で始まる）
    if (!apiKey.startsWith('sk-')) {
      return res.status(500).json({ 
        error: 'Invalid OpenAI API key format',
        debug: `API key should start with 'sk-', got: ${apiKey.substring(0, 10)}...`
      });
    }

    // OpenAI API呼び出し
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5',
        max_tokens: 1000,
        messages: [
          {
            role: 'system',
            content: `あなたはアルバイトのシフト表を解析する専門AIです。
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
- 確実に読み取れない場合は該当項目を除外`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt || 'この画像からシフト情報を抽出してください。'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ]
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error('OpenAI API Error:', {
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        errorData: errorData
      });
      
      return res.status(openaiResponse.status).json({ 
        error: 'OpenAI API request failed',
        details: openaiResponse.statusText,
        status: openaiResponse.status,
        openai_error: errorData.substring(0, 500) // 最初の500文字のみ表示
      });
    }

    const result = await openaiResponse.json();
    
    // レスポンスから内容を抽出
    const content = result.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: 'No content received from OpenAI' });
    }

    // JSONパース試行
    try {
      const parsedContent = JSON.parse(content);
      
      // 使用状況をログ出力（監視用）
      console.log('OpenAI Vision API Usage:', {
        timestamp: new Date().toISOString(),
        tokens_used: result.usage?.total_tokens || 0,
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

// レート制限関数（将来の拡張用）
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