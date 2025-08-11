// Vercel Serverless Function for GPT-5 Chat API - 扶養管理専用チャット

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
    const { message, context = 'general' } = req.body;

    // 基本バリデーション
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    // 環境変数からAPIキーを取得
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // 扶養管理専用のシステムプロンプト
    const systemPrompt = `あなたは扶養管理の専門AIアシスタントです。日本の税制、扶養控除、学生のアルバイトに関する質問に丁寧にお答えします。

【専門分野】
- 扶養控除（103万円、130万円、150万円の壁）
- 学生特例（勤労学生控除）
- 年収予測とアドバイス
- 社会保険と税金の違い
- 最新の税制改正情報
- シフト管理と収入計算

【回答の特徴】
- 正確で実用的な情報を提供
- 具体例を交えてわかりやすく説明
- 必要に応じて計算例も提示
- 学生向けに親しみやすい文章で回答
- 絵文字を適度に使用してフレンドリーに

現在の日付: ${new Date().toLocaleDateString('ja-JP')}
税制: 2025年度版対応`;

    // GPT-5 API呼び出し
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5',
        max_tokens: 1500,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      
      // 特定のエラーハンドリング
      if (openaiResponse.status === 429) {
        return res.status(429).json({ 
          error: 'API使用量制限に達しています。しばらく待ってから再度お試しください。',
          code: 'RATE_LIMIT'
        });
      }
      
      if (openaiResponse.status === 401) {
        return res.status(500).json({ 
          error: 'API認証エラーが発生しました。',
          code: 'AUTH_ERROR'
        });
      }
      
      return res.status(500).json({ 
        error: 'GPT-5 APIの呼び出しに失敗しました。',
        code: 'API_ERROR'
      });
    }

    const responseData = await openaiResponse.json();
    
    if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
      return res.status(500).json({ 
        error: 'GPT-5からの応答が不正です。',
        code: 'INVALID_RESPONSE'
      });
    }

    const assistantResponse = responseData.choices[0].message.content;

    // 成功レスポンス
    return res.status(200).json({
      success: true,
      response: assistantResponse,
      model: 'gpt-5',
      timestamp: new Date().toISOString(),
      usage: responseData.usage || {}
    });

  } catch (error) {
    console.error('GPT-5 Chat API error:', error);
    
    return res.status(500).json({
      error: 'サーバー内部エラーが発生しました。しばらく待ってから再度お試しください。',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}