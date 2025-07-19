#!/usr/bin/env node

/**
 * 🗓️ 扶養管理カレンダーアプリ - 完全統合版
 * TimeTree風シンプルUI + 自動シフト登録
 * OpenAI Vision API統合 (技術詳細は完全に隠蔽)
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// .envファイル読み込み
function loadEnv() {
    try {
        const envPath = path.join(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            const envData = fs.readFileSync(envPath, 'utf8');
            envData.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    process.env[key.trim()] = value.trim();
                }
            });
        }
    } catch (error) {
        console.error('環境変数読み込みエラー:', error);
    }
}
loadEnv();

const PORT = process.env.PORT || 9200;

// === データ管理 ===
const DATA_DIR = path.join(__dirname, 'calendar_data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

class CalendarDataManager {
    constructor() {
        this.userFile = path.join(DATA_DIR, 'user.json');
        this.shiftsFile = path.join(DATA_DIR, 'shifts.json');
        this.workplacesFile = path.join(DATA_DIR, 'workplaces.json');
        this.initializeData();
    }

    initializeData() {
        if (!fs.existsSync(this.userFile)) {
            this.saveUser({
                id: crypto.randomUUID(),
                name: '',
                setupCompleted: false,
                createdAt: new Date().toISOString()
            });
        }
        if (!fs.existsSync(this.shiftsFile)) {
            this.saveShifts([]);
        }
        if (!fs.existsSync(this.workplacesFile)) {
            this.saveWorkplaces([]);
        }
    }

    loadUser() {
        try {
            return JSON.parse(fs.readFileSync(this.userFile, 'utf8'));
        } catch {
            return null;
        }
    }

    saveUser(user) {
        fs.writeFileSync(this.userFile, JSON.stringify(user, null, 2));
    }

    loadShifts() {
        try {
            return JSON.parse(fs.readFileSync(this.shiftsFile, 'utf8'));
        } catch {
            return [];
        }
    }

    saveShifts(shifts) {
        fs.writeFileSync(this.shiftsFile, JSON.stringify(shifts, null, 2));
    }

    loadWorkplaces() {
        try {
            return JSON.parse(fs.readFileSync(this.workplacesFile, 'utf8'));
        } catch {
            return [];
        }
    }

    saveWorkplaces(workplaces) {
        fs.writeFileSync(this.workplacesFile, JSON.stringify(workplaces, null, 2));
    }

    addShift(shiftData) {
        const shifts = this.loadShifts();
        const newShift = {
            id: crypto.randomUUID(),
            ...shiftData,
            createdAt: new Date().toISOString()
        };
        shifts.push(newShift);
        this.saveShifts(shifts);
        return newShift;
    }
}

const dataManager = new CalendarDataManager();

// === OpenAI OCR処理 (ユーザーには見せない) ===
class ShiftOCRProcessor {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
    }

    async processShiftImage(imageBuffer, userName) {
        if (!this.apiKey) {
            // APIキーがない場合はデモデータ
            return this.getDemoShifts();
        }

        try {
            const base64Image = imageBuffer.toString('base64');
            
            // 1回目: 強化されたプロンプトで詳細分析
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4-vision-preview',
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: `シフト表画像を注意深く分析し、「${userName}」さんのシフトのみを正確に抽出してください。

**重要な注意点：**
1. **名前の確認**: 「${userName}」「${userName.charAt(0)}${userName.slice(1)}」「${userName.split('').join(' ')}」などの表記も含めて探してください
2. **表形式の理解**: 縦軸（日付）と横軸（時間/担当者）の関係を正確に読み取ってください
3. **時間表記**: 「9-17」「9:00-17:00」「09時〜17時」など様々な表記に対応してください
4. **日付認識**: 曜日、日付、月の情報を統合して正確な日付を判定してください

**出力フォーマット（必須）：**
JSON形式で以下のように返してください：
{
  "confidence": 0.85,
  "analysis": "画像から読み取った内容の説明",
  "shifts": [
    {
      "date": "2025-07-20",
      "startTime": "09:00",
      "endTime": "17:00",
      "workplace": "職場名",
      "confidence": 0.9,
      "notes": "認識の確信度や特記事項"
    }
  ]
}

**手順：**
1. まず画像全体を確認し、シフト表の構造を理解
2. ${userName}さんの名前を表から探す
3. 該当する行/列からシフト情報を抽出
4. 日付と時間を標準形式に変換
5. 信頼度を0-1で評価

他の人のシフトは絶対に含めないでください。`
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `data:image/jpeg;base64,${base64Image}`
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                console.error('OpenAI API Error:', response.status, response.statusText);
                return this.fallbackProcessing(imageBuffer, userName);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;
            console.log('OCR Response:', content);
            
            // JSONを抽出
            let jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                // コードブロック内を探す
                const codeBlockMatch = content.match(/\`\`\`json\s*([\s\S]*?)\s*\`\`\`/);
                if (codeBlockMatch) {
                    jsonMatch = [codeBlockMatch[1]];
                }
            }
            
            if (jsonMatch) {
                const jsonText = jsonMatch[1] || jsonMatch[0];
                const result = JSON.parse(jsonText);
                
                // 信頼度チェック
                if (result.confidence < 0.5) {
                    console.warn('Low confidence OCR result:', result.confidence);
                    return this.fallbackProcessing(imageBuffer, userName);
                }
                
                // データ検証
                const validShifts = this.validateShifts(result.shifts || []);
                return {
                    ...result,
                    shifts: validShifts,
                    needsReview: result.confidence < 0.8
                };
            }
            
            return this.fallbackProcessing(imageBuffer, userName);
            
        } catch (error) {
            console.error('OCRエラー:', error);
            return this.fallbackProcessing(imageBuffer, userName);
        }
    }

    // フォールバック処理（簡易版プロンプト）
    async fallbackProcessing(imageBuffer, userName) {
        try {
            const base64Image = imageBuffer.toString('base64');
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4-vision-preview',
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: `シンプルに：この画像から「${userName}」の勤務日、開始時間、終了時間を見つけて、以下の形式で返してください：
                                    {"shifts":[{"date":"2025-07-XX","startTime":"HH:MM","endTime":"HH:MM","workplace":"店名"}]}`
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: `data:image/jpeg;base64,${base64Image}`
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 800
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0].message.content;
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const result = JSON.parse(jsonMatch[0]);
                    return {
                        shifts: this.validateShifts(result.shifts || []),
                        confidence: 0.3,
                        needsReview: true,
                        analysis: "フォールバック処理による結果"
                    };
                }
            }
        } catch (error) {
            console.error('フォールバック処理エラー:', error);
        }
        
        return {
            shifts: this.getDemoShifts(),
            confidence: 0.1,
            needsReview: true,
            analysis: "デモデータを表示しています"
        };
    }

    // シフトデータ検証
    validateShifts(shifts) {
        return shifts.filter(shift => {
            // 基本的な検証
            if (!shift.date || !shift.startTime || !shift.endTime) return false;
            
            // 日付形式チェック
            const datePattern = /^\d{4}-\d{2}-\d{2}$/;
            if (!datePattern.test(shift.date)) return false;
            
            // 時間形式チェック
            const timePattern = /^\d{1,2}:\d{2}$/;
            if (!timePattern.test(shift.startTime) || !timePattern.test(shift.endTime)) return false;
            
            // 論理チェック（開始時間 < 終了時間）
            const start = new Date(`2000-01-01T${shift.startTime}`);
            const end = new Date(`2000-01-01T${shift.endTime}`);
            if (start >= end) return false;
            
            return true;
        }).map(shift => ({
            ...shift,
            workplace: shift.workplace || 'アルバイト先'
        }));
    }

    getDemoShifts() {
        // デモ用のシフトデータ
        const today = new Date();
        const shifts = [];
        
        for (let i = 0; i < 5; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i + 1);
            
            shifts.push({
                date: date.toISOString().split('T')[0],
                startTime: ['09:00', '13:00', '17:00'][i % 3],
                endTime: ['17:00', '21:00', '23:00'][i % 3],
                workplace: ['カフェ', 'レストラン', 'コンビニ'][i % 3]
            });
        }
        
        return shifts;
    }
}

const ocrProcessor = new ShiftOCRProcessor();

// === サーバー処理 ===
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // CORS設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // ルーティング
    if (pathname === '/') {
        serveCalendarApp(res);
    } else if (pathname === '/api/user') {
        handleUser(req, res);
    } else if (pathname === '/api/workplaces') {
        handleWorkplaces(req, res);
    } else if (pathname === '/api/shifts') {
        handleShifts(req, res);
    } else if (pathname === '/api/process-shift-image') {
        handleShiftImageProcessing(req, res);
    } else if (pathname === '/api/setup-complete') {
        handleSetupComplete(req, res);
    } else if (pathname === '/health') {
        sendJSON(res, { status: 'OK', app: 'Fuyou Calendar' });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

function serveCalendarApp(res) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>扶養管理カレンダー</title>
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f5f7fa;
            color: #333;
            line-height: 1.6;
        }
        
        /* ヘッダー */
        .header {
            background: white;
            padding: 15px 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .header-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .app-title {
            font-size: 20px;
            font-weight: 600;
            color: #333;
        }
        
        .earnings-badge {
            background: #4CAF50;
            color: white;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
        }
        
        /* メインコンテナ */
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        /* 初回セットアップ */
        .setup-container {
            max-width: 500px;
            margin: 60px auto;
            background: white;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            text-align: center;
            display: none;
        }
        
        .setup-container.active {
            display: block;
        }
        
        .setup-title {
            font-size: 24px;
            margin-bottom: 10px;
        }
        
        .setup-subtitle {
            color: #666;
            margin-bottom: 30px;
        }
        
        .form-group {
            margin-bottom: 20px;
            text-align: left;
        }
        
        .form-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #333;
        }
        
        .form-input {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.2s;
        }
        
        .form-input:focus {
            outline: none;
            border-color: #4CAF50;
        }
        
        .btn {
            background: #4CAF50;
            color: white;
            padding: 12px 32px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .btn:hover {
            background: #45a049;
        }
        
        .btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        
        /* カレンダーメイン */
        .calendar-container {
            display: none;
        }
        
        .calendar-container.active {
            display: block;
        }
        
        /* アップロードボタン */
        .upload-section {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .upload-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 32px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            transition: transform 0.2s;
            width: 100%;
            justify-content: center;
        }
        
        .upload-button:hover {
            transform: translateY(-2px);
        }
        
        .upload-icon {
            font-size: 24px;
        }
        
        /* カレンダー */
        .calendar {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .month-title {
            font-size: 20px;
            font-weight: 600;
        }
        
        .nav-buttons {
            display: flex;
            gap: 10px;
        }
        
        .nav-btn {
            background: #f0f0f0;
            border: none;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        
        .nav-btn:hover {
            background: #e0e0e0;
        }
        
        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
        }
        
        .day-header {
            padding: 10px;
            text-align: center;
            font-weight: 600;
            color: #666;
            font-size: 14px;
        }
        
        .calendar-day {
            aspect-ratio: 1;
            border: 1px solid #eee;
            padding: 8px;
            cursor: pointer;
            transition: background 0.2s;
            position: relative;
            min-height: 80px;
        }
        
        .calendar-day:hover {
            background: #f8f8f8;
        }
        
        .day-number {
            font-weight: 500;
            margin-bottom: 4px;
            font-size: 14px;
        }
        
        .day-number.today {
            background: #4CAF50;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
        }
        
        .shift-item {
            background: #e3f2fd;
            color: #1976D2;
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
            margin: 2px 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        /* メッセージ */
        .message {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            display: none;
            z-index: 1000;
        }
        
        .message.show {
            display: block;
            animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
            from {
                transform: translateX(-50%) translateY(100%);
                opacity: 0;
            }
            to {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }
        }
        
        /* ローディング */
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        }
        
        .loading-overlay.show {
            display: flex;
        }
        
        .loading-spinner {
            background: white;
            padding: 40px;
            border-radius: 16px;
            text-align: center;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #f0f0f0;
            border-top: 3px solid #4CAF50;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* OCR結果確認ダイアログ */
        .ocr-review-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 3000;
        }
        
        .ocr-review-overlay.show {
            display: flex;
        }
        
        .ocr-review-dialog {
            background: white;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        
        .ocr-review-header {
            background: #f8f9fa;
            padding: 20px;
            border-bottom: 1px solid #eee;
        }
        
        .ocr-review-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .ocr-confidence {
            font-size: 14px;
            color: #666;
        }
        
        .confidence-high { color: #4CAF50; }
        .confidence-medium { color: #FF9800; }
        .confidence-low { color: #f44336; }
        
        .ocr-review-body {
            padding: 20px;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .shift-review-item {
            background: #f5f5f5;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            border-left: 4px solid #4CAF50;
        }
        
        .shift-review-item.needs-attention {
            border-left-color: #FF9800;
            background: #fff8e1;
        }
        
        .shift-review-form {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12px;
            margin-top: 8px;
        }
        
        .shift-input {
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
        }
        
        .workplace-input {
            grid-column: 1 / -1;
        }
        
        .ocr-review-footer {
            background: #f8f9fa;
            padding: 20px;
            border-top: 1px solid #eee;
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }
        
        .btn-secondary {
            background: #6c757d;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        }
        
        .btn-primary {
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        }

        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .calendar-day {
                min-height: 60px;
                font-size: 12px;
            }
            
            .shift-item {
                font-size: 10px;
            }
            
            .ocr-review-dialog {
                width: 95%;
                max-height: 90vh;
            }
            
            .shift-review-form {
                grid-template-columns: 1fr;
            }
            
            .workplace-input {
                grid-column: 1;
            }
        }
    </style>
</head>
<body>
    <!-- ヘッダー -->
    <div class="header">
        <div class="header-content">
            <h1 class="app-title">扶養管理カレンダー</h1>
            <div class="earnings-badge" id="monthlyEarnings">今月: ¥0</div>
        </div>
    </div>

    <div class="container">
        <!-- 初回セットアップ -->
        <div class="setup-container" id="setupContainer">
            <h2 class="setup-title">👋 はじめまして！</h2>
            <p class="setup-subtitle">まず、お名前を教えてください</p>
            
            <div class="form-group">
                <label class="form-label">お名前</label>
                <input type="text" class="form-input" id="userName" placeholder="例: 田中太郎" autocomplete="name">
            </div>
            
            <div class="form-group">
                <label class="form-label">年齢</label>
                <input type="number" class="form-input" id="userAge" placeholder="例: 20" min="15" max="30">
            </div>
            
            <div class="form-group">
                <label class="form-label">目標収入限度額</label>
                <select class="form-input" id="targetLimit">
                    <option value="1230000">123万円（所得税の壁）</option>
                    <option value="1300000">130万円（社会保険の壁）</option>
                    <option value="1500000" selected>150万円（学生特例）</option>
                </select>
            </div>
            
            <button class="btn" onclick="completeSetup()" id="setupBtn">はじめる</button>
        </div>

        <!-- カレンダーメイン -->
        <div class="calendar-container" id="calendarContainer">
            <!-- シフト表アップロード -->
            <div class="upload-section">
                <button class="upload-button" onclick="document.getElementById('fileInput').click()">
                    <span class="upload-icon">📷</span>
                    <span>シフト表を撮影・アップロード</span>
                </button>
                <input type="file" id="fileInput" accept="image/*" style="display: none;" onchange="handleFileUpload(event)">
            </div>

            <!-- カレンダー -->
            <div class="calendar">
                <div class="calendar-header">
                    <h2 class="month-title" id="monthTitle">2025年1月</h2>
                    <div class="nav-buttons">
                        <button class="nav-btn" onclick="changeMonth(-1)">◀</button>
                        <button class="nav-btn" onclick="changeMonth(1)">▶</button>
                    </div>
                </div>
                
                <div class="calendar-grid">
                    <div class="day-header">日</div>
                    <div class="day-header">月</div>
                    <div class="day-header">火</div>
                    <div class="day-header">水</div>
                    <div class="day-header">木</div>
                    <div class="day-header">金</div>
                    <div class="day-header">土</div>
                </div>
                <div class="calendar-grid" id="calendarDays"></div>
            </div>
        </div>
    </div>

    <!-- メッセージ -->
    <div class="message" id="message"></div>
    
    <!-- ローディング -->
    <div class="loading-overlay" id="loadingOverlay">
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>シフト表を読み取っています...</p>
        </div>
    </div>

    <!-- OCR結果確認ダイアログ -->
    <div class="ocr-review-overlay" id="ocrReviewOverlay">
        <div class="ocr-review-dialog">
            <div class="ocr-review-header">
                <h3 class="ocr-review-title">シフト認識結果の確認</h3>
                <div class="ocr-confidence" id="ocrConfidenceText">認識精度: 85%</div>
            </div>
            <div class="ocr-review-body" id="ocrReviewBody">
                <!-- シフト確認項目がここに動的に追加される -->
            </div>
            <div class="ocr-review-footer">
                <button class="btn-secondary" onclick="cancelOCRReview()">キャンセル</button>
                <button class="btn-primary" onclick="confirmOCRReview()">シフトを登録</button>
            </div>
        </div>
    </div>

    <script>
        let currentDate = new Date();
        let userData = null;
        let shifts = [];

        // 初期化
        async function init() {
            const response = await fetch('/api/user');
            const data = await response.json();
            userData = data.user;
            
            if (userData && userData.setupCompleted) {
                document.getElementById('setupContainer').classList.remove('active');
                document.getElementById('calendarContainer').classList.add('active');
                await loadShifts();
                renderCalendar();
            } else {
                document.getElementById('setupContainer').classList.add('active');
            }
        }

        // セットアップ完了
        async function completeSetup() {
            const name = document.getElementById('userName').value.trim();
            const age = document.getElementById('userAge').value;
            const targetLimit = document.getElementById('targetLimit').value;
            
            if (!name || !age) {
                showMessage('名前と年齢を入力してください');
                return;
            }
            
            document.getElementById('setupBtn').disabled = true;
            
            const response = await fetch('/api/setup-complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, age: parseInt(age), targetLimit: parseInt(targetLimit) })
            });
            
            if (response.ok) {
                userData = await response.json();
                document.getElementById('setupContainer').classList.remove('active');
                document.getElementById('calendarContainer').classList.add('active');
                renderCalendar();
                showMessage('ようこそ、' + name + 'さん！');
            }
        }

        // シフト読み込み
        async function loadShifts() {
            const response = await fetch('/api/shifts');
            const data = await response.json();
            shifts = data.shifts || [];
            updateMonthlyEarnings();
        }

        // カレンダー描画
        function renderCalendar() {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            
            document.getElementById('monthTitle').textContent = year + '年' + (month + 1) + '月';
            
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay());
            
            const calendarDays = document.getElementById('calendarDays');
            calendarDays.innerHTML = '';
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            for (let i = 0; i < 42; i++) {
                const cellDate = new Date(startDate);
                cellDate.setDate(startDate.getDate() + i);
                
                const dayDiv = document.createElement('div');
                dayDiv.className = 'calendar-day';
                
                const dayNumber = document.createElement('div');
                dayNumber.className = 'day-number';
                dayNumber.textContent = cellDate.getDate();
                
                if (cellDate.getTime() === today.getTime()) {
                    dayNumber.classList.add('today');
                }
                
                if (cellDate.getMonth() !== month) {
                    dayNumber.style.color = '#ccc';
                }
                
                dayDiv.appendChild(dayNumber);
                
                // シフト表示
                const dateStr = cellDate.toISOString().split('T')[0];
                const dayShifts = shifts.filter(shift => shift.date === dateStr);
                
                dayShifts.forEach(shift => {
                    const shiftDiv = document.createElement('div');
                    shiftDiv.className = 'shift-item';
                    shiftDiv.textContent = shift.startTime + '-' + shift.endTime;
                    shiftDiv.title = shift.workplace || 'アルバイト';
                    dayDiv.appendChild(shiftDiv);
                });
                
                calendarDays.appendChild(dayDiv);
            }
        }

        // 月変更
        function changeMonth(direction) {
            currentDate.setMonth(currentDate.getMonth() + direction);
            renderCalendar();
        }

        // ファイルアップロード
        async function handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            if (!userData || !userData.name) {
                showMessage('先に初期設定を完了してください');
                return;
            }
            
            showLoading(true);
            
            const formData = new FormData();
            formData.append('image', file);
            formData.append('userName', userData.name);
            
            try {
                const response = await fetch('/api/process-shift-image', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (result.success && result.shifts && result.shifts.length > 0) {
                    // OCR結果の確認が必要かチェック
                    if (result.needsReview || result.confidence < 0.8) {
                        showOCRReview(result);
                    } else {
                        // 自動登録
                        await registerShifts(result.shifts);
                        showMessage(result.shifts.length + '件のシフトを自動登録しました！');
                    }
                } else {
                    showMessage('シフトが見つかりませんでした。もう一度お試しください。');
                }
            } catch (error) {
                showMessage('エラーが発生しました');
            } finally {
                showLoading(false);
                event.target.value = '';
            }
        }

        // 月間収入更新
        function updateMonthlyEarnings() {
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();
            
            const monthlyShifts = shifts.filter(shift => {
                const shiftDate = new Date(shift.date);
                return shiftDate.getMonth() === currentMonth && 
                       shiftDate.getFullYear() === currentYear;
            });
            
            // 簡易計算（時給1000円として）
            const totalHours = monthlyShifts.reduce((sum, shift) => {
                const start = new Date('2000-01-01T' + shift.startTime);
                const end = new Date('2000-01-01T' + shift.endTime);
                const hours = (end - start) / (1000 * 60 * 60);
                return sum + hours;
            }, 0);
            
            const earnings = Math.round(totalHours * 1000);
            document.getElementById('monthlyEarnings').textContent = 
                '今月: ¥' + earnings.toLocaleString();
        }

        // メッセージ表示
        function showMessage(text) {
            const messageEl = document.getElementById('message');
            messageEl.textContent = text;
            messageEl.classList.add('show');
            
            setTimeout(() => {
                messageEl.classList.remove('show');
            }, 3000);
        }

        // ローディング表示
        function showLoading(show) {
            const overlay = document.getElementById('loadingOverlay');
            if (show) {
                overlay.classList.add('show');
            } else {
                overlay.classList.remove('show');
            }
        }

        // OCR結果確認ダイアログ表示
        let pendingOCRResult = null;
        
        function showOCRReview(result) {
            pendingOCRResult = result;
            
            // 信頼度表示
            const confidenceText = document.getElementById('ocrConfidenceText');
            const confidence = Math.round((result.confidence || 0.5) * 100);
            let confidenceClass = 'confidence-low';
            
            if (confidence >= 80) confidenceClass = 'confidence-high';
            else if (confidence >= 60) confidenceClass = 'confidence-medium';
            
            confidenceText.textContent = `認識精度: ${confidence}%`;
            confidenceText.className = `ocr-confidence ${confidenceClass}`;
            
            // シフト一覧表示
            const reviewBody = document.getElementById('ocrReviewBody');
            reviewBody.innerHTML = '';
            
            if (result.analysis) {
                const analysisDiv = document.createElement('div');
                analysisDiv.innerHTML = `<p style="margin-bottom: 16px; color: #666; font-size: 14px;"><strong>認識内容:</strong> ${result.analysis}</p>`;
                reviewBody.appendChild(analysisDiv);
            }
            
            result.shifts.forEach((shift, index) => {
                const shiftDiv = document.createElement('div');
                const needsAttention = (shift.confidence || 0.5) < 0.7;
                
                shiftDiv.className = `shift-review-item ${needsAttention ? 'needs-attention' : ''}`;
                shiftDiv.innerHTML = `
                    <div style="margin-bottom: 8px;">
                        <strong>シフト ${index + 1}</strong>
                        ${needsAttention ? '<span style="color: #FF9800; font-size: 12px; margin-left: 8px;">要確認</span>' : ''}
                    </div>
                    <div class="shift-review-form">
                        <input type="date" class="shift-input" value="${shift.date}" data-field="date" data-index="${index}">
                        <input type="time" class="shift-input" value="${shift.startTime}" data-field="startTime" data-index="${index}">
                        <input type="time" class="shift-input" value="${shift.endTime}" data-field="endTime" data-index="${index}">
                        <input type="text" class="shift-input workplace-input" value="${shift.workplace || 'アルバイト先'}" data-field="workplace" data-index="${index}" placeholder="職場名">
                    </div>
                    ${shift.notes ? `<div style="font-size: 12px; color: #666; margin-top: 8px;">${shift.notes}</div>` : ''}
                `;
                reviewBody.appendChild(shiftDiv);
            });
            
            // ダイアログ表示
            document.getElementById('ocrReviewOverlay').classList.add('show');
        }
        
        // OCR確認キャンセル
        function cancelOCRReview() {
            document.getElementById('ocrReviewOverlay').classList.remove('show');
            pendingOCRResult = null;
        }
        
        // OCR確認完了
        async function confirmOCRReview() {
            if (!pendingOCRResult) return;
            
            // フォームから修正されたデータを取得
            const inputs = document.querySelectorAll('#ocrReviewBody .shift-input');
            const updatedShifts = [];
            
            pendingOCRResult.shifts.forEach((shift, index) => {
                const shiftData = { ...shift };
                
                inputs.forEach(input => {
                    if (parseInt(input.dataset.index) === index) {
                        shiftData[input.dataset.field] = input.value;
                    }
                });
                
                updatedShifts.push(shiftData);
            });
            
            // ダイアログを閉じる
            document.getElementById('ocrReviewOverlay').classList.remove('show');
            
            // シフト登録
            await registerShifts(updatedShifts);
            showMessage(updatedShifts.length + '件のシフトを登録しました！');
            
            pendingOCRResult = null;
        }
        
        // シフト登録（共通処理）
        async function registerShifts(shifts) {
            for (const shift of shifts) {
                await fetch('/api/shifts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(shift)
                });
            }
            
            await loadShifts();
            renderCalendar();
        }

        // 起動
        init();
    </script>
</body>
</html>
    `);
}

// === API処理 ===
async function handleUser(req, res) {
    const user = dataManager.loadUser();
    sendJSON(res, { user });
}

async function handleWorkplaces(req, res) {
    const workplaces = dataManager.loadWorkplaces();
    sendJSON(res, { workplaces });
}

async function handleShifts(req, res) {
    if (req.method === 'GET') {
        const shifts = dataManager.loadShifts();
        sendJSON(res, { shifts });
    } else if (req.method === 'POST') {
        const body = await parseBody(req);
        const newShift = dataManager.addShift(body);
        sendJSON(res, { success: true, shift: newShift });
    }
}

async function handleShiftImageProcessing(req, res) {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
        try {
            const buffer = Buffer.concat(chunks);
            
            // multipart/form-dataの簡易パース
            const boundary = req.headers['content-type'].split('boundary=')[1];
            const parts = buffer.toString('binary').split('--' + boundary);
            
            let imageBuffer = null;
            let userName = '';
            
            for (const part of parts) {
                if (part.includes('name="image"')) {
                    const dataStart = part.indexOf('\r\n\r\n') + 4;
                    const dataEnd = part.lastIndexOf('\r\n');
                    imageBuffer = Buffer.from(part.substring(dataStart, dataEnd), 'binary');
                }
                if (part.includes('name="userName"')) {
                    const dataStart = part.indexOf('\r\n\r\n') + 4;
                    const dataEnd = part.lastIndexOf('\r\n');
                    userName = part.substring(dataStart, dataEnd);
                }
            }
            
            if (!imageBuffer || !userName) {
                return sendJSON(res, { success: false, error: '必要なデータがありません' });
            }
            
            // OCR処理
            const ocrResult = await ocrProcessor.processShiftImage(imageBuffer, userName);
            
            // 結果の形式を統一
            const response = {
                success: true,
                shifts: ocrResult.shifts || ocrResult,
                confidence: ocrResult.confidence || 0.8,
                needsReview: ocrResult.needsReview || false,
                analysis: ocrResult.analysis || '',
                message: (ocrResult.shifts || ocrResult).length + '件のシフトを認識しました'
            };
            
            sendJSON(res, response);
            
        } catch (error) {
            console.error('画像処理エラー:', error);
            sendJSON(res, { success: false, error: 'シフト表の読み取りに失敗しました' });
        }
    });
}

async function handleSetupComplete(req, res) {
    const body = await parseBody(req);
    const user = dataManager.loadUser();
    
    const updatedUser = {
        ...user,
        name: body.name,
        age: body.age,
        targetLimit: body.targetLimit,
        setupCompleted: true,
        updatedAt: new Date().toISOString()
    };
    
    dataManager.saveUser(updatedUser);
    sendJSON(res, updatedUser);
}

// === ユーティリティ ===
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch {
                resolve({});
            }
        });
        req.on('error', reject);
    });
}

function sendJSON(res, data, status = 200) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

// === サーバー起動 ===
server.listen(PORT, '0.0.0.0', () => {
    console.log('\n🗓️ 扶養管理カレンダーアプリ 起動完了！\n');
    console.log('📱 アクセスURL: http://172.26.93.180:' + PORT);
    console.log('\n✅ シンプルで使いやすいUI');
    console.log('✅ シフト表撮影 → 自動カレンダー登録');
    console.log('✅ OpenAI Vision API統合');
    console.log('✅ 技術詳細は完全に隠蔽\n');
    
    if (process.env.OPENAI_API_KEY) {
        console.log('🤖 OpenAI API: 設定済み');
    } else {
        console.log('⚠️  OpenAI API: デモモード（.envファイルにAPIキーを設定してください）');
    }
});