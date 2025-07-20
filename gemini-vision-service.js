// Google Gemini Vision API による シフト表解析サービス
class GeminiVisionService {
    constructor() {
        this.apiKey = null; // 設定から取得
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent';
        this.maxRetries = 3;
        this.retryDelay = 1000;
        
        // 設定から API キーを取得
        if (typeof window !== 'undefined' && window.FUYOU_CONFIG) {
            this.apiKey = window.FUYOU_CONFIG.api.gemini.apiKey;
        }
    }

    /**
     * 画像からシフト表データを抽出
     * @param {File} imageFile - アップロードされた画像ファイル
     * @returns {Promise<Object>} 解析されたシフトデータ
     */
    async analyzeShiftTable(imageFile) {
        try {
            if (!this.isAvailable()) {
                throw new Error('Gemini API キーが設定されていません。実際の解析にはAPIキーが必要です。');
            }

            // 画像品質チェック
            const qualityCheck = await this.checkImageQuality(imageFile);
            if (!qualityCheck.isAcceptable) {
                console.warn('画像品質に問題があります:', qualityCheck.issues);
            }

            // 画像をBase64エンコード
            const base64Image = await this.convertToBase64(imageFile);
            
            // Gemini Vision APIに送信
            const response = await this.callGeminiAPI(base64Image);
            
            // レスポンスを解析してシフトデータに変換
            const shiftData = this.parseGeminiResponse(response);
            
            return {
                success: true,
                shifts: shiftData,
                confidence: this.calculateConfidence(response),
                metadata: {
                    fileName: imageFile.name,
                    fileSize: imageFile.size,
                    processedAt: new Date().toISOString(),
                    provider: 'Gemini Pro Vision',
                    model: 'gemini-pro-vision',
                    qualityCheck: qualityCheck
                }
            };
        } catch (error) {
            console.error('Gemini解析エラー:', error);
            throw new Error(`Geminiでのシフト表解析に失敗しました: ${error.message}`);
        }
    }

    /**
     * 画像ファイルをBase64に変換
     */
    async convertToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // data:image/jpeg;base64, の部分を除去
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Gemini Vision APIを呼び出し
     */
    async callGeminiAPI(base64Image, retryCount = 0) {
        const prompt = this.getAnalysisPrompt();
        
        const payload = {
            contents: [
                {
                    parts: [
                        {
                            text: prompt
                        },
                        {
                            inline_data: {
                                mime_type: "image/jpeg",
                                data: base64Image
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.1,
                topK: 32,
                topP: 1,
                maxOutputTokens: 2048,
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH", 
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        };

        try {
            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                if (response.status === 429 && retryCount < this.maxRetries) {
                    // レート制限の場合はリトライ
                    await this.sleep(this.retryDelay * Math.pow(2, retryCount));
                    return this.callGeminiAPI(base64Image, retryCount + 1);
                }
                
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Gemini API Error: ${response.status} ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return this.processGeminiResponse(data);
        } catch (error) {
            if (retryCount < this.maxRetries) {
                await this.sleep(this.retryDelay);
                return this.callGeminiAPI(base64Image, retryCount + 1);
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

抽出すべき情報：
- 日付（YYYY-MM-DD形式）
- 開始時間（HH:MM形式、24時間表記）
- 終了時間（HH:MM形式、24時間表記）
- 勤務先名（店舗名、部署名など）
- 備考やメモ（休憩時間、特記事項など）

期待する出力形式：
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

重要な解析ルール：
1. 日付は必ずYYYY-MM-DD形式で出力
2. 時刻は24時間形式（HH:MM）で出力
3. 曖昧な情報は confidence を下げて報告
4. 読み取れない部分は null で明示
5. 手書きやかすれた文字も可能な限り推測
6. 複数の勤務先が混在している場合は workplaceName で区別
7. 休憩時間がある場合は notes に記載
8. 月と日の区切り、曜日の表記も参考にする
9. 表の罫線や色分けも活用する

画像を詳細に解析してシフト情報を抽出してください。
`;
    }

    /**
     * Geminiレスポンスを処理
     */
    processGeminiResponse(data) {
        try {
            if (!data.candidates || data.candidates.length === 0) {
                throw new Error('Geminiからの応答が不正です');
            }

            const candidate = data.candidates[0];
            if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
                throw new Error('Geminiからのコンテンツが空です');
            }

            const content = candidate.content.parts[0].text;
            
            // JSON部分を抽出
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('有効なJSONレスポンスが見つかりません');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            
            // バリデーション
            if (!parsed.shifts || !Array.isArray(parsed.shifts)) {
                throw new Error('無効なシフトデータ形式');
            }

            return {
                shifts: parsed.shifts,
                confidence: parsed.confidence || 0.8,
                metadata: parsed.metadata || {}
            };
        } catch (error) {
            throw new Error(`Geminiレスポンス解析エラー: ${error.message}`);
        }
    }

    /**
     * シフトレスポンスをアプリ用データに変換
     */
    parseGeminiResponse(response) {
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
                source: 'gemini_analysis',
                confidence: response.confidence || 0.8,
                needsReview: response.confidence < 0.7 || !shift.startTime || !shift.endTime
            };
        }).filter(shift => {
            // 基本的なバリデーション
            return shift.date && shift.startTime && shift.endTime;
        });
    }

    /**
     * 信頼度計算
     */
    calculateConfidence(response) {
        let confidence = response.confidence || 0.8;
        
        // 検出されたシフト数に基づく調整
        const shiftCount = response.shifts ? response.shifts.length : 0;
        if (shiftCount === 0) {
            confidence *= 0.3;
        } else if (shiftCount > 10) {
            confidence *= 0.9; // 大量検出は少し信頼度を下げる
        }
        
        // 不完全なデータの割合で調整
        const incompleteShifts = response.shifts ? response.shifts.filter(shift => 
            !shift.startTime || !shift.endTime || !shift.date
        ).length : 0;
        
        if (incompleteShifts > 0) {
            confidence *= Math.max(0.5, 1 - (incompleteShifts / shiftCount));
        }
        
        return Math.min(Math.max(confidence, 0.1), 1.0);
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
     * 利用可能性チェック
     */
    isAvailable() {
        return this.apiKey && this.apiKey !== null && this.apiKey.length > 0;
    }

    /**
     * 料金見積もり（概算）
     */
    estimateCost(imageFile) {
        // Gemini Pro Vision の料金体系に基づく概算
        const imageSize = imageFile.size;
        const imageCost = 0.0025; // 画像あたりの基本料金（概算）
        const textTokens = 2000; // 出力テキストトークン数の見積もり
        const textCost = (textTokens / 1000) * 0.00025; // テキスト生成料金
        
        const totalCostUSD = imageCost + textCost;
        
        return {
            imageCost: imageCost,
            textCost: textCost,
            totalCostUSD: totalCostUSD,
            estimatedCostJPY: Math.round(totalCostUSD * 150) // 概算為替レート
        };
    }

    /**
     * ユーティリティ: スリープ
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Gemini特有の機能: 複数画像解析
     */
    async analyzeMultipleImages(imageFiles) {
        const results = [];
        
        for (const file of imageFiles) {
            try {
                const result = await this.analyzeShiftTable(file);
                results.push(result);
            } catch (error) {
                console.error(`画像 ${file.name} の解析エラー:`, error);
                results.push({
                    success: false,
                    error: error.message,
                    fileName: file.name
                });
            }
        }
        
        return results;
    }

    /**
     * 画像品質チェック
     */
    async checkImageQuality(imageFile) {
        const maxSize = 20 * 1024 * 1024; // 20MB
        const minSize = 1024; // 1KB
        const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        
        const quality = {
            score: 1.0,
            issues: [],
            recommendations: [],
            isAcceptable: true
        };
        
        // ファイルサイズチェック
        if (imageFile.size > maxSize) {
            quality.score *= 0.7;
            quality.issues.push('ファイルサイズが大きすぎます');
            quality.recommendations.push('画像を圧縮してください');
        }
        
        if (imageFile.size < minSize) {
            quality.score *= 0.5;
            quality.issues.push('ファイルサイズが小さすぎます');
            quality.recommendations.push('より高解像度の画像を使用してください');
        }
        
        // ファイル形式チェック
        if (!supportedTypes.includes(imageFile.type)) {
            quality.score *= 0.3;
            quality.issues.push('サポートされていないファイル形式です');
            quality.recommendations.push('JPEG、PNG、WebP形式の画像を使用してください');
        }
        
        quality.isAcceptable = quality.score > 0.3;
        
        return quality;
    }

}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeminiVisionService;
}

if (typeof window !== 'undefined') {
    window.GeminiVisionService = GeminiVisionService;
}