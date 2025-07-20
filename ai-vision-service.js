// OpenAI Vision API による シフト表解析サービス
class AIVisionService {
    constructor() {
        // 実際のAPIキーは設定ファイルから自動取得
        this.apiKey = null;
        this.apiUrl = 'https://api.openai.com/v1/chat/completions';
        this.maxRetries = 3;
        this.retryDelay = 1000;
        
        // 設定から API キーを取得
        this.initializeAPIKey();
    }
    
    initializeAPIKey() {
        if (typeof window !== 'undefined' && window.FUYOU_CONFIG) {
            this.apiKey = window.FUYOU_CONFIG.api.openai.apiKey;
            console.log('OpenAI APIキーを設定から取得しました');
        }
    }

    /**
     * 画像からシフト表データを抽出
     * @param {File} imageFile - アップロードされた画像ファイル
     * @returns {Promise<Object>} 解析されたシフトデータ
     */
    async analyzeShiftTable(imageFile) {
        try {
            // 画像をBase64エンコード
            const base64Image = await this.convertToBase64(imageFile);
            
            // OpenAI Vision APIに送信
            const response = await this.callVisionAPI(base64Image);
            
            // レスポンスを解析してシフトデータに変換
            const shiftData = this.parseShiftResponse(response);
            
            return {
                success: true,
                shifts: shiftData,
                confidence: response.confidence || 0.8,
                metadata: {
                    fileName: imageFile.name,
                    fileSize: imageFile.size,
                    processedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('AI解析エラー:', error);
            throw new Error(`シフト表の解析に失敗しました: ${error.message}`);
        }
    }

    /**
     * 画像ファイルをBase64に変換
     */
    async convertToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * OpenAI Vision APIを呼び出し
     */
    async callVisionAPI(base64Image, retryCount = 0) {
        const payload = {
            model: "gpt-4o", // 最新のビジョンモデル
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: this.getAnalysisPrompt()
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`,
                                detail: "high"
                            }
                        }
                    ]
                }
            ],
            max_tokens: 2000,
            temperature: 0.1 // 一貫性を重視
        };

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                if (response.status === 429 && retryCount < this.maxRetries) {
                    // レート制限の場合はリトライ
                    await this.sleep(this.retryDelay * Math.pow(2, retryCount));
                    return this.callVisionAPI(base64Image, retryCount + 1);
                }
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return this.processAPIResponse(data);
        } catch (error) {
            if (retryCount < this.maxRetries) {
                await this.sleep(this.retryDelay);
                return this.callVisionAPI(base64Image, retryCount + 1);
            }
            throw error;
        }
    }

    /**
     * 画像解析用のプロンプト
     */
    getAnalysisPrompt() {
        return `
あなたは日本のアルバイト・パートタイムのシフト表を解析する専門AIです。
アップロードされた画像からシフト情報を正確に抽出し、以下のJSON形式で回答してください。

期待する出力形式:
{
    "shifts": [
        {
            "date": "YYYY-MM-DD",
            "startTime": "HH:MM",
            "endTime": "HH:MM", 
            "workplaceName": "勤務先名",
            "notes": "備考やメモ（あれば）"
        }
    ],
    "confidence": 0.0-1.0,
    "metadata": {
        "detectedTableType": "シフト表の種類",
        "totalShiftsFound": 数値,
        "analysisNotes": "解析時の注意点や不明な点"
    }
}

重要な解析ルール:
1. 日付は必ずYYYY-MM-DD形式で出力
2. 時刻は24時間形式（HH:MM）で出力
3. 曖昧な情報は confidence を下げて報告
4. 読み取れない部分は null で明示
5. 手書きやかすれた文字も可能な限り推測
6. 複数の勤務先が混在している場合は workplaceName で区別
7. 休憩時間がある場合は notes に記載

画像を解析してシフト情報を抽出してください。
`;
    }

    /**
     * APIレスポンスを処理
     */
    processAPIResponse(data) {
        try {
            const content = data.choices[0].message.content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            
            if (!jsonMatch) {
                throw new Error('有効なJSONレスポンスが見つかりません');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            
            // バリデーション
            if (!parsed.shifts || !Array.isArray(parsed.shifts)) {
                throw new Error('無効なシフトデータ形式');
            }

            return parsed;
        } catch (error) {
            throw new Error(`レスポンス解析エラー: ${error.message}`);
        }
    }

    /**
     * シフトレスポンスをアプリ用データに変換
     */
    parseShiftResponse(response) {
        return response.shifts.map(shift => {
            // 時間計算
            const hours = this.calculateHours(shift.startTime, shift.endTime);
            
            return {
                date: shift.date,
                startTime: shift.startTime,
                endTime: shift.endTime,
                workplaceName: shift.workplaceName || '不明な勤務先',
                hours: hours,
                notes: shift.notes || '',
                source: 'ai_analysis',
                confidence: response.confidence || 0.8,
                needsReview: response.confidence < 0.7 || !shift.startTime || !shift.endTime
            };
        }).filter(shift => {
            // 基本的なバリデーション
            return shift.date && shift.startTime && shift.endTime;
        });
    }

    /**
     * 時間計算ユーティリティ
     */
    calculateHours(startTime, endTime) {
        if (!startTime || !endTime) return 0;
        
        try {
            const start = new Date(`2000-01-01T${startTime}`);
            const end = new Date(`2000-01-01T${endTime}`);
            
            if (end <= start) {
                // 日をまたぐ場合
                const nextDay = new Date(`2000-01-02T${endTime}`);
                return (nextDay - start) / (1000 * 60 * 60);
            }
            
            return (end - start) / (1000 * 60 * 60);
        } catch (error) {
            console.warn('時間計算エラー:', error);
            return 0;
        }
    }

    /**
     * 画像プリプロセシング（品質向上）
     */
    async preprocessImage(file) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // リサイズ（最大1024px）
                const maxSize = 1024;
                let { width, height } = img;
                
                if (width > maxSize || height > maxSize) {
                    const ratio = Math.min(maxSize / width, maxSize / height);
                    width *= ratio;
                    height *= ratio;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // 画質向上
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
                
                // 新しいファイルとして出力
                canvas.toBlob(resolve, 'image/jpeg', 0.9);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * 料金見積もり（概算）
     */
    estimateCost(imageFile) {
        // GPT-4o Vision pricing (概算)
        const baseTokens = 1000; // ベーストークン
        const imageTokens = Math.ceil(imageFile.size / 1000); // 簡易計算
        const totalTokens = baseTokens + imageTokens;
        
        // $0.005 per 1K tokens (入力) + $0.015 per 1K tokens (出力)の概算
        const estimatedCost = (totalTokens / 1000) * 0.005 + 0.015;
        
        return {
            tokens: totalTokens,
            estimatedCostUSD: estimatedCost,
            estimatedCostJPY: Math.round(estimatedCost * 150) // 概算為替レート
        };
    }

    /**
     * ユーティリティ: スリープ
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 利用可能性チェック
     */
    isAvailable() {
        return this.apiKey && this.apiKey.startsWith('sk-');
    }


    /**
     * Gemini API連携（代替プロバイダー）
     */
    async analyzeWithGemini(imageFile) {
        if (this.geminiService && this.geminiService.isAvailable()) {
            return await this.geminiService.analyzeShiftTable(imageFile);
        } else {
            throw new Error('Gemini API が設定されていません。実際の解析にはAPIキーが必要です。');
        }
    }

    /**
     * 複数AI プロバイダー対応
     */
    async analyzeWithMultipleProviders(imageFile) {
        const config = window.FUYOU_CONFIG || {};
        const providers = [];
        
        // 設定に基づいてプロバイダーの優先順位を決定
        if (config.api?.openai?.enabled && this.isAvailable()) {
            providers.push('openai');
        }
        
        if (config.api?.gemini?.enabled && this.geminiService?.isAvailable()) {
            providers.push('gemini');
        }
        
        if (providers.length === 0) {
            throw new Error('利用可能なAI APIがありません。OpenAIまたはGemini APIキーを設定してください。');
        }
        
        let lastError = null;
        const attemptResults = [];
        
        for (const provider of providers) {
            try {
                console.log(`${provider} プロバイダーで解析を試行中...`);
                
                let result;
                switch (provider) {
                    case 'openai':
                        result = await this.analyzeShiftTable(imageFile);
                        break;
                    case 'gemini':
                        result = await this.analyzeWithGemini(imageFile);
                        break;
                }
                
                if (result && result.success) {
                    // 成功した場合、プロバイダー情報を追加
                    result.metadata.provider = provider;
                    result.metadata.attemptResults = attemptResults;
                    return result;
                }
                
            } catch (error) {
                console.warn(`${provider} プロバイダーで失敗:`, error.message);
                attemptResults.push({
                    provider,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                lastError = error;
                continue;
            }
        }
        
        throw lastError || new Error('すべてのAIプロバイダーで解析に失敗しました');
    }

    /**
     * Gemini Service の初期化と連携
     */
    initializeGeminiService() {
        try {
            if (typeof GeminiVisionService !== 'undefined') {
                this.geminiService = new GeminiVisionService();
                console.log('Gemini Vision Service 初期化完了');
                return true;
            } else {
                console.warn('Gemini Vision Service が利用できません - スクリプトが読み込まれていない可能性があります');
                
                // フォールバックとして遅延初期化を試行
                setTimeout(() => {
                    if (typeof GeminiVisionService !== 'undefined') {
                        this.geminiService = new GeminiVisionService();
                        console.log('Gemini Vision Service 遅延初期化完了');
                    }
                }, 100);
                return false;
            }
        } catch (error) {
            console.error('Gemini Service 初期化エラー:', error);
            return false;
        }
    }

    /**
     * 画像品質の事前チェック
     */
    async checkImageQuality(imageFile) {
        const maxSize = 20 * 1024 * 1024; // 20MB
        const minSize = 1024; // 1KB
        const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        
        const issues = [];
        const recommendations = [];
        let score = 1.0;
        
        // ファイルサイズチェック
        if (imageFile.size > maxSize) {
            score *= 0.7;
            issues.push('ファイルサイズが大きすぎます (>20MB)');
            recommendations.push('画像を圧縮してください');
        }
        
        if (imageFile.size < minSize) {
            score *= 0.5;
            issues.push('ファイルサイズが小さすぎます (<1KB)');
            recommendations.push('より高解像度の画像を使用してください');
        }
        
        // ファイル形式チェック
        if (!supportedTypes.includes(imageFile.type)) {
            score *= 0.3;
            issues.push(`サポートされていないファイル形式: ${imageFile.type}`);
            recommendations.push('JPEG、PNG、WebP、GIF形式の画像を使用してください');
        }
        
        // ファイル名から推測される品質
        const fileName = imageFile.name.toLowerCase();
        if (fileName.includes('screenshot') || fileName.includes('スクショ')) {
            score *= 0.9;
            recommendations.push('スクリーンショットよりも元の画像の方が解析精度が高くなります');
        }
        
        return {
            score,
            issues,
            recommendations,
            isAcceptable: score > 0.3
        };
    }

    /**
     * プロバイダー比較分析
     */
    async compareProviders(imageFile) {
        const results = {};
        const providers = ['openai', 'gemini'];
        
        for (const provider of providers) {
            try {
                const startTime = Date.now();
                let result;
                
                switch (provider) {
                    case 'openai':
                        if (this.isAvailable()) {
                            result = await this.analyzeShiftTable(imageFile);
                        }
                        break;
                    case 'gemini':
                        if (this.geminiService?.isAvailable()) {
                            result = await this.geminiService.analyzeShiftTable(imageFile);
                        }
                        break;
                }
                
                if (result) {
                    results[provider] = {
                        success: true,
                        shifts: result.shifts,
                        confidence: result.confidence,
                        processingTime: Date.now() - startTime,
                        cost: this.estimateCost(imageFile)
                    };
                }
                
            } catch (error) {
                results[provider] = {
                    success: false,
                    error: error.message,
                    processingTime: Date.now() - startTime
                };
            }
        }
        
        return results;
    }
}

// エクスポート（モジュール環境用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIVisionService;
}

// グローバル変数として定義（ブラウザ環境用）
if (typeof window !== 'undefined') {
    window.AIVisionService = AIVisionService;
}