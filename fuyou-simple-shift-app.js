#!/usr/bin/env node

/**
 * 🗓️ シンプルシフト管理アプリ
 * ChatGPT風のシンプルOCR + シフトボード風編集
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

const PORT = process.env.PORT || 9300;

// === データ管理 ===
const DATA_DIR = path.join(__dirname, 'calendar_data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

class SimpleDataManager {
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
            this.saveWorkplaces([
                {
                    id: crypto.randomUUID(),
                    name: 'アルバイト先',
                    type: 'その他',
                    isDefault: true,
                    createdAt: new Date().toISOString()
                }
            ]);
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
        fs.writeFileSync(this.userFile, JSON.stringify(user, null, 2), 'utf8');
    }

    loadShifts() {
        try {
            return JSON.parse(fs.readFileSync(this.shiftsFile, 'utf8'));
        } catch {
            return [];
        }
    }

    saveShifts(shifts) {
        fs.writeFileSync(this.shiftsFile, JSON.stringify(shifts, null, 2), 'utf8');
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

    updateShift(id, updates) {
        const shifts = this.loadShifts();
        const index = shifts.findIndex(s => s.id === id);
        if (index !== -1) {
            shifts[index] = { ...shifts[index], ...updates, updatedAt: new Date().toISOString() };
            this.saveShifts(shifts);
            return shifts[index];
        }
        return null;
    }

    deleteShift(id) {
        const shifts = this.loadShifts();
        const filtered = shifts.filter(s => s.id !== id);
        this.saveShifts(filtered);
        return true;
    }

    // === バイト先管理メソッド ===
    loadWorkplaces() {
        try {
            return JSON.parse(fs.readFileSync(this.workplacesFile, 'utf8'));
        } catch {
            return [];
        }
    }

    saveWorkplaces(workplaces) {
        fs.writeFileSync(this.workplacesFile, JSON.stringify(workplaces, null, 2), 'utf8');
    }

    addWorkplace(workplaceData) {
        const workplaces = this.loadWorkplaces();
        const newWorkplace = {
            id: crypto.randomUUID(),
            ...workplaceData,
            createdAt: new Date().toISOString()
        };
        workplaces.push(newWorkplace);
        this.saveWorkplaces(workplaces);
        return newWorkplace;
    }

    updateWorkplace(id, updates) {
        const workplaces = this.loadWorkplaces();
        const index = workplaces.findIndex(w => w.id === id);
        if (index !== -1) {
            workplaces[index] = { ...workplaces[index], ...updates, updatedAt: new Date().toISOString() };
            this.saveWorkplaces(workplaces);
            return workplaces[index];
        }
        return null;
    }

    deleteWorkplace(id) {
        const workplaces = this.loadWorkplaces();
        const filtered = workplaces.filter(w => w.id !== id);
        this.saveWorkplaces(filtered);
        return true;
    }

    getWorkplaceById(id) {
        const workplaces = this.loadWorkplaces();
        return workplaces.find(w => w.id === id);
    }

    getDefaultWorkplace() {
        const workplaces = this.loadWorkplaces();
        return workplaces.find(w => w.isDefault) || workplaces[0];
    }
}

const dataManager = new SimpleDataManager();

// === ChatGPT風シンプルOCR ===
class ChatGPTStyleOCR {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
    }

    async processShiftImage(imageBuffer, userName, workplaceName = '', workplaceId = '') {
        if (!this.apiKey || this.apiKey === 'YOUR_OPENAI_API_KEY_HERE') {
            return this.getDemoResponse(userName, workplaceName);
        }

        try {
            const base64Image = imageBuffer.toString('base64');
            
            // 2段階処理：まず画像の内容を確認
            const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: `このシフト表を詳しく分析してください。

**STEP1: 画像内容の確認**
- この画像にはどんな内容が含まれていますか？
- シフト表ですか？スケジュール表ですか？
- どのような形式（表形式、リスト形式など）ですか？

**STEP2: 名前の検索**
「${userName}」さんを探してください。以下のバリエーションも含めて：
- ${userName}
- ${userName.split('').join(' ')} (文字間にスペース)
- ${userName.substring(0, userName.length-1)} (名前部分のみ)
- ${userName.charAt(0)}${userName.slice(1)} (漢字/ひらがな変換)
- 姓だけ、名前だけの表記

**STEP3: 見つかった名前とシフト情報**
見つかった場合は詳細に報告してください。
見つからない場合は、画像に含まれている他の名前を教えてください。

回答形式：
\`\`\`
【画像内容】
(画像の説明)

【名前検索結果】
検索対象: ${userName}
発見した名前: (見つかった名前、または「見つかりません」)
その他の名前: (画像内の他の名前一覧)

【シフト情報】
(見つかった場合はシフト詳細、見つからない場合は理由)
\`\`\``
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
                    max_tokens: 1000
                })
            });

            if (!analysisResponse.ok) {
                const errorText = await analysisResponse.text();
                console.error('OpenAI API エラー (分析段階):', {
                    status: analysisResponse.status,
                    statusText: analysisResponse.statusText,
                    error: errorText
                });
                return {
                    message: `❌ OpenAI API エラーが発生しました\n\nエラー詳細:\nステータス: ${analysisResponse.status}\n内容: ${errorText}\n\n⚠️ APIキーまたはモデル設定を確認してください。`,
                    shifts: [],
                    success: false,
                    apiError: true,
                    debugInfo: {
                        status: analysisResponse.status,
                        error: errorText
                    }
                };
            }

            const analysisData = await analysisResponse.json();
            const analysisResult = analysisData.choices[0].message.content;
            console.log('画像分析結果:', analysisResult);

            // 分析結果から名前が見つかったかチェック
            const foundName = this.extractFoundName(analysisResult, userName);
            const otherNames = this.extractOtherNames(analysisResult);

            if (!foundName) {
                // 名前が見つからない場合の詳細メッセージ
                const message = `${userName}さんのお名前がシフト表で見つかりませんでした。

📋 **画像分析結果**
${analysisResult}

🔍 **他に見つかった名前**
${otherNames.length > 0 ? otherNames.join(', ') : 'なし'}

💡 **確認してください**
- お名前の表記は正しいですか？
- 姓だけ、名前だけで記載されていませんか？
- ニックネームや略称で記載されていませんか？`;

                return {
                    message: message,
                    shifts: [],
                    success: false,
                    debugInfo: {
                        analysisResult,
                        foundName: null,
                        otherNames
                    }
                };
            }

            // 名前が見つかった場合、シフト情報を抽出
            const extractResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: `「${foundName}」さんのシフト情報を正確に抽出してください。

前回の分析で「${foundName}」という名前を確認しました。
この名前に対応するシフト情報（日付、時間、場所）を詳しく教えてください。

親しみやすい言葉で回答してください：
「お疲れさまです！${foundName}さんのシフトを確認しました。
[具体的なシフト情報]
この内容で間違いありませんか？」`
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
                    max_tokens: 500
                })
            });

            if (!extractResponse.ok) {
                const errorText = await extractResponse.text();
                console.error('OpenAI API エラー (抽出段階):', {
                    status: extractResponse.status,
                    statusText: extractResponse.statusText,
                    error: errorText
                });
                return {
                    message: `❌ OpenAI API エラーが発生しました (抽出段階)\n\nエラー詳細:\nステータス: ${extractResponse.status}\n内容: ${errorText}\n\n⚠️ APIキーまたはモデル設定を確認してください。`,
                    shifts: [],
                    success: false,
                    apiError: true,
                    debugInfo: {
                        analysisResult,
                        foundName,
                        otherNames,
                        extractError: {
                            status: extractResponse.status,
                            error: errorText
                        }
                    }
                };
            }

            const extractData = await extractResponse.json();
            const aiResponse = extractData.choices[0].message.content;
            
            // 自然言語から構造化データを抽出
            const parsedShifts = this.parseNaturalLanguage(aiResponse, foundName, workplaceName);
            
            return {
                message: aiResponse,
                shifts: parsedShifts,
                success: parsedShifts.length > 0,
                debugInfo: {
                    analysisResult,
                    foundName,
                    otherNames,
                    extractResult: aiResponse
                }
            };
            
        } catch (error) {
            console.error('OCR処理で重大なエラー:', error);
            return {
                message: `❌ OCR処理で重大なエラーが発生しました\n\nエラー詳細:\n${error.message}\n\n🔧 解決策:\n1. ネットワーク接続を確認\n2. 画像ファイルが正しい形式か確認\n3. OpenAI APIキーが有効か確認`,
                shifts: [],
                success: false,
                criticalError: true,
                debugInfo: {
                    errorMessage: error.message,
                    errorStack: error.stack
                }
            };
        }
    }

    // 分析結果から見つかった名前を抽出
    extractFoundName(analysisText, targetName) {
        const lines = analysisText.split('\n');
        for (const line of lines) {
            if (line.includes('発見した名前') || line.includes('見つかった名前')) {
                if (!line.includes('見つかりません') && !line.includes('見当たりません')) {
                    // 名前が含まれているかチェック
                    const match = line.match(/[:：]\s*(.+)/);
                    if (match && match[1].trim() !== '') {
                        return match[1].trim();
                    }
                }
            }
        }
        return null;
    }

    // 他の名前を抽出
    extractOtherNames(analysisText) {
        const names = [];
        const lines = analysisText.split('\n');
        for (const line of lines) {
            if (line.includes('その他の名前') || line.includes('他の名前')) {
                const match = line.match(/[:：]\s*(.+)/);
                if (match && match[1].trim() !== '' && !match[1].includes('なし')) {
                    names.push(...match[1].split(/[、,]/).map(n => n.trim()));
                }
            }
        }
        return names;
    }

    // 自然言語から構造化データを抽出
    parseNaturalLanguage(text, userName, workplaceName = 'アルバイト先') {
        const shifts = [];
        
        // 日付と時間のパターンを検索
        const shiftPattern = /(\d{1,2})月(\d{1,2})日[（(]([月火水木金土日])[）)]\s*(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})\s*([^\n]*)/g;
        let match;
        
        while ((match = shiftPattern.exec(text)) !== null) {
            const month = parseInt(match[1]);
            const day = parseInt(match[2]);
            const startHour = match[4].padStart(2, '0');
            const startMin = match[5];
            const endHour = match[6].padStart(2, '0');
            const endMin = match[7];
            const workplace = match[8]?.replace(/勤務$/, '').trim() || workplaceName;
            
            // 今年の日付を生成
            const year = new Date().getFullYear();
            const date = new Date(year, month - 1, day);
            
            shifts.push({
                date: date.toISOString().split('T')[0],
                startTime: `${startHour}:${startMin}`,
                endTime: `${endHour}:${endMin}`,
                workplace: workplace
            });
        }
        
        return shifts;
    }

    getDemoResponse(userName, workplaceName = 'アルバイト先') {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const dayAfter = new Date(today);
        dayAfter.setDate(today.getDate() + 2);

        const demoShifts = [
            {
                date: tomorrow.toISOString().split('T')[0],
                startTime: '09:00',
                endTime: '17:00',
                workplace: workplaceName || 'カフェ'
            },
            {
                date: dayAfter.toISOString().split('T')[0],
                startTime: '13:00',
                endTime: '21:00',
                workplace: workplaceName || 'レストラン'
            }
        ];

        const formatDate = (dateStr) => {
            const date = new Date(dateStr);
            const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
            return `${date.getMonth() + 1}月${date.getDate()}日(${weekdays[date.getDay()]})`;
        };

        const message = `お疲れさまです！${userName}さんの${workplaceName || 'バイト先'}シフトを確認しました。
${formatDate(demoShifts[0].date)} ${demoShifts[0].startTime}-${demoShifts[0].endTime} ${demoShifts[0].workplace}勤務
${formatDate(demoShifts[1].date)} ${demoShifts[1].startTime}-${demoShifts[1].endTime} ${demoShifts[1].workplace}勤務
この内容で間違いありませんか？`;

        return {
            message: message,
            shifts: demoShifts,
            success: true,
            isDemo: true
        };
    }
}

const ocrProcessor = new ChatGPTStyleOCR();

// === サーバー処理 ===
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // CORS設定（UTF-8サポート）
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept-Charset');
    res.setHeader('Accept-Charset', 'utf-8');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // ルーティング
    if (pathname === '/') {
        serveApp(res);
    } else if (pathname === '/api/user') {
        handleUser(req, res);
    } else if (pathname === '/api/shifts') {
        handleShifts(req, res);
    } else if (pathname === '/api/shifts/update') {
        handleShiftUpdate(req, res);
    } else if (pathname === '/api/shifts/delete') {
        handleShiftDelete(req, res);
    } else if (pathname === '/api/workplaces') {
        handleWorkplaces(req, res);
    } else if (pathname === '/api/workplaces/update') {
        handleWorkplaceUpdate(req, res);
    } else if (pathname === '/api/workplaces/delete') {
        handleWorkplaceDelete(req, res);
    } else if (pathname === '/api/ocr/simple') {
        handleSimpleOCR(req, res);
    } else if (pathname === '/api/setup-complete') {
        handleSetupComplete(req, res);
    } else if (pathname === '/health') {
        sendJSON(res, { status: 'OK', app: 'Simple Shift Manager' });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

function serveApp(res) {
    res.writeHead(200, { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
    });
    res.end(`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🗓️ シンプルシフト管理</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f5f7fa;
            color: #333;
            line-height: 1.6;
        }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        
        .header {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            text-align: center;
        }
        
        .app-title { font-size: 24px; font-weight: 600; color: #333; margin-bottom: 10px; }
        .app-subtitle { color: #666; }
        
        .setup-section {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            text-align: center;
            margin-bottom: 20px;
        }
        
        .setup-section.hidden { display: none; }
        
        .form-group { margin-bottom: 20px; }
        .form-input {
            width: 100%;
            max-width: 300px;
            padding: 12px 16px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
        }
        
        .btn {
            background: #4CAF50;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .btn:hover { background: #45a049; }
        .btn:disabled { background: #ccc; cursor: not-allowed; }
        
        .ocr-section {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        
        .upload-area {
            border: 2px dashed #4CAF50;
            padding: 40px;
            text-align: center;
            border-radius: 8px;
            transition: background 0.2s;
        }
        
        .upload-area:hover { background: #f8f9fa; }
        
        .upload-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 32px;
            border: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 10px;
        }
        
        .ai-response {
            background: #e3f2fd;
            border: 1px solid #2196F3;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            display: none;
        }
        
        .ai-response.show { display: block; }
        
        .ai-message {
            font-size: 16px;
            white-space: pre-line;
            margin-bottom: 20px;
        }
        
        .action-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        
        .calendar-section {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
            margin-top: 20px;
        }
        
        .day-header {
            padding: 10px;
            text-align: center;
            font-weight: 600;
            background: #f5f5f5;
            color: #666;
        }
        
        .calendar-day {
            min-height: 100px;
            border: 1px solid #eee;
            padding: 8px;
            background: white;
            cursor: pointer;
            transition: background 0.2s;
            position: relative;
        }
        
        .calendar-day:hover { background: #f8f9fa; }
        .calendar-day.has-shift { background: #e8f5e8; }
        
        .day-number {
            font-weight: 500;
            margin-bottom: 4px;
        }
        
        .shift-info {
            font-size: 12px;
            background: #4CAF50;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            margin: 2px 0;
        }
        
        .edit-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        
        .edit-modal.show { display: flex; }
        
        .modal-content {
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 400px;
            width: 90%;
        }
        
        .message {
            padding: 12px 20px;
            border-radius: 8px;
            margin: 10px 0;
            text-align: center;
        }
        
        .message.success { background: #d4edda; color: #155724; }
        .message.error { background: #f8d7da; color: #721c24; }
        .message.warning { background: #fff3cd; color: #856404; }
        
        @media (max-width: 768px) {
            .container { padding: 10px; }
            .calendar-day { min-height: 80px; font-size: 14px; }
            .upload-button { font-size: 16px; padding: 12px 24px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="app-title">🗓️ シンプルシフト管理</h1>
            <p class="app-subtitle">ChatGPT風OCR + シフトボード風編集</p>
        </div>

        <!-- 初期設定 -->
        <div id="setupSection" class="setup-section">
            <h2>👋 はじめまして！</h2>
            <p>まず、お名前を教えてください</p>
            <div class="form-group">
                <input type="text" id="userName" class="form-input" placeholder="例: 松浦淳" autocomplete="name">
            </div>
            <button class="btn" onclick="completeSetup()">はじめる</button>
        </div>

        <!-- メインアプリ -->
        <div id="mainApp" class="hidden">
            <!-- OCRセクション -->
            <div class="ocr-section">
                <h2>📷 シフト表読み取り</h2>
                
                <!-- バイト先選択 -->
                <div class="workplace-selector" style="margin-bottom: 20px;">
                    <label for="workplaceSelect" style="display: block; margin-bottom: 8px; font-weight: 600;">🏢 バイト先を選択</label>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <select id="workplaceSelect" class="form-input" style="flex: 1;">
                            <option value="">バイト先を選択...</option>
                        </select>
                        <button class="btn" onclick="openWorkplaceManager()" style="background: #2196F3; padding: 8px 16px;">
                            ⚙️ 管理
                        </button>
                    </div>
                </div>

                <div class="upload-area">
                    <button class="upload-button" onclick="document.getElementById('fileInput').click()">
                        📸 シフト表を撮影
                    </button>
                    <input type="file" id="fileInput" accept="image/*" style="display:none" onchange="handleImageUpload(event)">
                    <p style="margin-top: 10px; color: #666;">シフト表の写真を撮って、AIが自動で読み取ります</p>
                </div>

                <!-- AI応答 -->
                <div id="aiResponse" class="ai-response">
                    <div id="aiMessage" class="ai-message"></div>
                    
                    <!-- デバッグ情報（名前が見つからない場合のみ表示） -->
                    <div id="debugInfo" class="debug-info" style="display: none;">
                        <details>
                            <summary style="cursor: pointer; color: #666; font-size: 14px;">🔍 詳細情報を表示</summary>
                            <div id="debugContent" style="margin-top: 10px; font-size: 12px; color: #555; background: #f8f9fa; padding: 10px; border-radius: 4px; white-space: pre-line;"></div>
                        </details>
                    </div>
                    
                    <div class="action-buttons">
                        <button class="btn" id="confirmBtn" onclick="confirmShifts()">✅ この通りです</button>
                        <button class="btn" onclick="editShifts()" style="background: #FF9800;">✏️ 修正します</button>
                        <button class="btn" onclick="cancelOCR()" style="background: #757575;">❌ キャンセル</button>
                    </div>
                </div>
            </div>

            <!-- カレンダーセクション -->
            <div class="calendar-section">
                <h2>📅 シフトカレンダー</h2>
                <div class="calendar-grid">
                    <div class="day-header">日</div>
                    <div class="day-header">月</div>
                    <div class="day-header">火</div>
                    <div class="day-header">水</div>
                    <div class="day-header">木</div>
                    <div class="day-header">金</div>
                    <div class="day-header">土</div>
                </div>
                <div id="calendarGrid" class="calendar-grid"></div>
            </div>
        </div>

        <!-- 編集モーダル -->
        <div id="editModal" class="edit-modal">
            <div class="modal-content">
                <h3>シフト編集</h3>
                <div class="form-group">
                    <label>日付</label>
                    <input type="date" id="editDate" class="form-input">
                </div>
                <div class="form-group">
                    <label>開始時間</label>
                    <input type="time" id="editStartTime" class="form-input">
                </div>
                <div class="form-group">
                    <label>終了時間</label>
                    <input type="time" id="editEndTime" class="form-input">
                </div>
                <div class="form-group">
                    <label>バイト先</label>
                    <select id="editWorkplaceId" class="form-input">
                        <option value="">バイト先を選択...</option>
                    </select>
                </div>
                <div class="action-buttons">
                    <button class="btn" onclick="saveShiftEdit()">💾 保存</button>
                    <button class="btn" onclick="deleteShift()" style="background: #f44336;">🗑️ 削除</button>
                    <button class="btn" onclick="closeEditModal()" style="background: #757575;">❌ キャンセル</button>
                </div>
            </div>
        </div>

        <!-- バイト先管理モーダル -->
        <div id="workplaceModal" class="edit-modal">
            <div class="modal-content" style="max-width: 600px;">
                <h3>🏢 バイト先管理</h3>
                
                <!-- 新規バイト先追加 -->
                <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4>新規バイト先追加</h4>
                    <div class="form-group">
                        <label>バイト先名</label>
                        <input type="text" id="newWorkplaceName" class="form-input" placeholder="例: スターバックス渋谷店">
                    </div>
                    <div class="form-group">
                        <label>種類</label>
                        <select id="newWorkplaceType" class="form-input">
                            <option value="カフェ">カフェ</option>
                            <option value="レストラン">レストラン</option>
                            <option value="居酒屋">居酒屋</option>
                            <option value="コンビニ">コンビニ</option>
                            <option value="小売店">小売店</option>
                            <option value="塾・家庭教師">塾・家庭教師</option>
                            <option value="その他">その他</option>
                        </select>
                    </div>
                    <button class="btn" onclick="addNewWorkplace()">➕ 追加</button>
                </div>

                <!-- 既存バイト先リスト -->
                <div>
                    <h4>既存のバイト先</h4>
                    <div id="workplaceList" style="max-height: 300px; overflow-y: auto;">
                        <!-- 動的に生成 -->
                    </div>
                </div>

                <div class="action-buttons" style="margin-top: 20px;">
                    <button class="btn" onclick="closeWorkplaceModal()" style="background: #757575;">✅ 完了</button>
                </div>
            </div>
        </div>

        <div id="messageArea"></div>
    </div>

    <script>
        let userData = null;
        let shifts = [];
        let workplaces = [];
        let pendingShifts = [];
        let currentEditShift = null;

        // 初期化
        async function init() {
            const response = await fetch('/api/user');
            const data = await response.json();
            userData = data.user;
            
            if (userData && userData.setupCompleted) {
                document.getElementById('setupSection').classList.add('hidden');
                document.getElementById('mainApp').classList.remove('hidden');
                await loadShifts();
                await loadWorkplaces();
                renderCalendar();
                updateWorkplaceSelect();
            }
        }

        // セットアップ完了
        async function completeSetup() {
            const name = document.getElementById('userName').value.trim();
            if (!name) {
                showMessage('名前を入力してください', 'error');
                return;
            }

            const response = await fetch('/api/setup-complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, setupCompleted: true })
            });

            if (response.ok) {
                userData = await response.json();
                document.getElementById('setupSection').classList.add('hidden');
                document.getElementById('mainApp').classList.remove('hidden');
                await loadWorkplaces();
                updateWorkplaceSelect();
                showMessage('ようこそ、' + name + 'さん！', 'success');
                renderCalendar();
            }
        }

        // 画像アップロード処理
        async function handleImageUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            // バイト先選択チェック
            const selectedWorkplaceId = document.getElementById('workplaceSelect').value;
            if (!selectedWorkplaceId) {
                showMessage('まずバイト先を選択してください', 'error');
                return;
            }

            const selectedWorkplace = workplaces.find(w => w.id === selectedWorkplaceId);
            showMessage(selectedWorkplace.name + 'のシフト表を読み取っています...', 'warning');

            const formData = new FormData();
            formData.append('image', file);
            formData.append('userName', userData.name);
            formData.append('workplaceId', selectedWorkplaceId);
            formData.append('workplaceName', selectedWorkplace.name);

            try {
                const response = await fetch('/api/ocr/simple', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success && result.shifts.length > 0) {
                    pendingShifts = result.shifts;
                    document.getElementById('aiMessage').textContent = result.message;
                    document.getElementById('aiResponse').classList.add('show');
                    document.getElementById('debugInfo').style.display = 'none';
                    document.getElementById('confirmBtn').style.display = 'inline-block';
                    showMessage('AIがシフトを読み取りました！', 'success');
                } else {
                    // 名前が見つからない場合
                    document.getElementById('aiMessage').textContent = result.message;
                    document.getElementById('aiResponse').classList.add('show');
                    document.getElementById('confirmBtn').style.display = 'none';
                    
                    // デバッグ情報を表示
                    if (result.debugInfo) {
                        document.getElementById('debugInfo').style.display = 'block';
                        const debugContent = '画像分析の詳細結果：\n\n' +
                            result.debugInfo.analysisResult + '\n\n' +
                            '検索した名前: ' + userData.name + '\n' +
                            '見つかった名前: ' + (result.debugInfo.foundName || 'なし') + '\n' +
                            'その他の名前: ' + (result.debugInfo.otherNames?.join(', ') || 'なし');
                        document.getElementById('debugContent').textContent = debugContent;
                    }
                    
                    showMessage('名前が見つかりませんでした。詳細情報を確認してください。', 'warning');
                }
            } catch (error) {
                showMessage('エラーが発生しました', 'error');
            } finally {
                event.target.value = '';
            }
        }

        // OCR結果の確認
        async function confirmShifts() {
            const selectedWorkplaceId = document.getElementById('workplaceSelect').value;
            const selectedWorkplace = workplaces.find(w => w.id === selectedWorkplaceId);
            
            for (const shift of pendingShifts) {
                // バイト先情報を追加
                const shiftWithWorkplace = {
                    ...shift,
                    workplaceId: selectedWorkplaceId,
                    workplace: selectedWorkplace.name
                };
                
                await fetch('/api/shifts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(shiftWithWorkplace)
                });
            }

            await loadShifts();
            renderCalendar();
            document.getElementById('aiResponse').classList.remove('show');
            showMessage(selectedWorkplace.name + 'のシフト' + pendingShifts.length + '件を登録しました！', 'success');
            pendingShifts = [];
        }

        // OCR結果の編集
        function editShifts() {
            document.getElementById('aiResponse').classList.remove('show');
            showMessage('カレンダーで直接編集できます', 'warning');
        }

        // OCRキャンセル
        function cancelOCR() {
            document.getElementById('aiResponse').classList.remove('show');
            pendingShifts = [];
        }

        // シフト読み込み
        async function loadShifts() {
            const response = await fetch('/api/shifts');
            const data = await response.json();
            shifts = data.shifts || [];
        }

        // === バイト先管理関数 ===
        
        // バイト先読み込み
        async function loadWorkplaces() {
            const response = await fetch('/api/workplaces');
            const data = await response.json();
            workplaces = data.workplaces || [];
        }

        // バイト先選択ドロップダウン更新
        function updateWorkplaceSelect() {
            const select = document.getElementById('workplaceSelect');
            select.innerHTML = '<option value="">バイト先を選択...</option>';
            
            workplaces.forEach(workplace => {
                const option = document.createElement('option');
                option.value = workplace.id;
                option.textContent = workplace.name + ' (' + workplace.type + ')';
                if (workplace.isDefault) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        }

        // バイト先管理モーダルを開く
        function openWorkplaceManager() {
            updateWorkplaceList();
            document.getElementById('workplaceModal').classList.add('show');
        }

        // バイト先管理モーダルを閉じる
        function closeWorkplaceModal() {
            document.getElementById('workplaceModal').classList.remove('show');
            document.getElementById('newWorkplaceName').value = '';
            document.getElementById('newWorkplaceType').value = 'カフェ';
        }

        // 新規バイト先追加
        async function addNewWorkplace() {
            const name = document.getElementById('newWorkplaceName').value.trim();
            const type = document.getElementById('newWorkplaceType').value;
            
            if (!name) {
                showMessage('バイト先名を入力してください', 'error');
                return;
            }

            try {
                const response = await fetch('/api/workplaces', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, type })
                });

                if (response.ok) {
                    await loadWorkplaces();
                    updateWorkplaceSelect();
                    updateWorkplaceList();
                    document.getElementById('newWorkplaceName').value = '';
                    showMessage(name + 'を追加しました', 'success');
                } else {
                    showMessage('バイト先の追加に失敗しました', 'error');
                }
            } catch (error) {
                showMessage('エラーが発生しました', 'error');
            }
        }

        // バイト先リスト更新
        function updateWorkplaceList() {
            const listContainer = document.getElementById('workplaceList');
            listContainer.innerHTML = '';
            
            if (workplaces.length === 0) {
                listContainer.innerHTML = '<p style="color: #666; text-align: center;">バイト先がありません</p>';
                return;
            }

            workplaces.forEach(workplace => {
                const item = document.createElement('div');
                item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid #eee; margin-bottom: 8px; border-radius: 4px;';
                
                const info = document.createElement('div');
                info.innerHTML = '<strong>' + workplace.name + '</strong><br>' +
                    '<small style="color: #666;">' + workplace.type + (workplace.isDefault ? ' (デフォルト)' : '') + '</small>';
                
                const actions = document.createElement('div');
                actions.style.cssText = 'display: flex; gap: 8px;';
                
                if (!workplace.isDefault) {
                    const setDefaultBtn = document.createElement('button');
                    setDefaultBtn.textContent = '🏠 デフォルト';
                    setDefaultBtn.className = 'btn';
                    setDefaultBtn.style.cssText = 'background: #FF9800; font-size: 12px; padding: 4px 8px;';
                    setDefaultBtn.onclick = () => setDefaultWorkplace(workplace.id);
                    actions.appendChild(setDefaultBtn);
                    
                    const deleteBtn = document.createElement('button');
                    deleteBtn.textContent = '🗑️';
                    deleteBtn.className = 'btn';
                    deleteBtn.style.cssText = 'background: #f44336; font-size: 12px; padding: 4px 8px;';
                    deleteBtn.onclick = () => deleteWorkplace(workplace.id, workplace.name);
                    actions.appendChild(deleteBtn);
                }
                
                item.appendChild(info);
                item.appendChild(actions);
                listContainer.appendChild(item);
            });
        }

        // デフォルトバイト先設定
        async function setDefaultWorkplace(id) {
            try {
                // 全てのバイト先のデフォルトを解除
                for (const workplace of workplaces) {
                    if (workplace.isDefault) {
                        await fetch('/api/workplaces/update', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: workplace.id, isDefault: false })
                        });
                    }
                }

                // 選択されたバイト先をデフォルトに設定
                await fetch('/api/workplaces/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, isDefault: true })
                });

                await loadWorkplaces();
                updateWorkplaceSelect();
                updateWorkplaceList();
                showMessage('デフォルトバイト先を設定しました', 'success');
            } catch (error) {
                showMessage('エラーが発生しました', 'error');
            }
        }

        // バイト先削除
        async function deleteWorkplace(id, name) {
            if (!confirm(name + 'を削除しますか？関連するシフトデータは残ります。')) {
                return;
            }

            try {
                const response = await fetch('/api/workplaces/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });

                if (response.ok) {
                    await loadWorkplaces();
                    updateWorkplaceSelect();
                    updateWorkplaceList();
                    showMessage(name + 'を削除しました', 'success');
                } else {
                    showMessage('バイト先の削除に失敗しました', 'error');
                }
            } catch (error) {
                showMessage('エラーが発生しました', 'error');
            }
        }

        // カレンダー描画
        function renderCalendar() {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth();
            
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay());
            
            const calendarGrid = document.getElementById('calendarGrid');
            calendarGrid.innerHTML = '';
            
            for (let i = 0; i < 42; i++) {
                const cellDate = new Date(startDate);
                cellDate.setDate(startDate.getDate() + i);
                
                const dayDiv = document.createElement('div');
                dayDiv.className = 'calendar-day';
                
                const dateStr = cellDate.toISOString().split('T')[0];
                const dayShifts = shifts.filter(shift => shift.date === dateStr);
                
                if (dayShifts.length > 0) {
                    dayDiv.classList.add('has-shift');
                }
                
                let shiftsHtml = '';
                dayShifts.forEach(shift => {
                    const workplace = workplaces.find(w => w.id === shift.workplaceId) || { name: shift.workplace || 'アルバイト先' };
                    shiftsHtml += '<div class="shift-info" onclick="openEditModal(\'' + shift.id + '\')" title="' + workplace.name + '">' +
                        shift.startTime + '-' + shift.endTime + '<br>' +
                        '<small style="font-size: 10px; opacity: 0.8;">' + workplace.name + '</small>' +
                        '</div>';
                });
                
                dayDiv.innerHTML = '<div class="day-number">' + cellDate.getDate() + '</div>' + shiftsHtml;
                
                // 空の日をクリックで新規シフト追加
                if (dayShifts.length === 0) {
                    dayDiv.onclick = () => openEditModal(null, dateStr);
                }
                
                calendarGrid.appendChild(dayDiv);
            }
        }

        // 編集モーダル開く
        function openEditModal(shiftId, date = null) {
            currentEditShift = shiftId ? shifts.find(s => s.id === shiftId) : null;
            
            // バイト先選択肢を更新
            updateEditWorkplaceSelect();
            
            if (currentEditShift) {
                document.getElementById('editDate').value = currentEditShift.date;
                document.getElementById('editStartTime').value = currentEditShift.startTime;
                document.getElementById('editEndTime').value = currentEditShift.endTime;
                document.getElementById('editWorkplaceId').value = currentEditShift.workplaceId || '';
            } else {
                document.getElementById('editDate').value = date || '';
                document.getElementById('editStartTime').value = '09:00';
                document.getElementById('editEndTime').value = '17:00';
                // デフォルトバイト先を選択
                const defaultWorkplace = workplaces.find(w => w.isDefault);
                document.getElementById('editWorkplaceId').value = defaultWorkplace ? defaultWorkplace.id : '';
            }
            
            document.getElementById('editModal').classList.add('show');
        }

        // 編集モーダルのバイト先選択更新
        function updateEditWorkplaceSelect() {
            const select = document.getElementById('editWorkplaceId');
            select.innerHTML = '<option value="">バイト先を選択...</option>';
            
            workplaces.forEach(workplace => {
                const option = document.createElement('option');
                option.value = workplace.id;
                option.textContent = workplace.name + ' (' + workplace.type + ')';
                select.appendChild(option);
            });
        }

        // 編集モーダル閉じる
        function closeEditModal() {
            document.getElementById('editModal').classList.remove('show');
            currentEditShift = null;
        }

        // シフト保存
        async function saveShiftEdit() {
            const workplaceId = document.getElementById('editWorkplaceId').value;
            const selectedWorkplace = workplaces.find(w => w.id === workplaceId);
            
            if (!workplaceId || !selectedWorkplace) {
                showMessage('バイト先を選択してください', 'error');
                return;
            }

            const shiftData = {
                date: document.getElementById('editDate').value,
                startTime: document.getElementById('editStartTime').value,
                endTime: document.getElementById('editEndTime').value,
                workplaceId: workplaceId,
                workplace: selectedWorkplace.name
            };

            if (!shiftData.date || !shiftData.startTime || !shiftData.endTime) {
                showMessage('すべての項目を入力してください', 'error');
                return;
            }

            try {
                if (currentEditShift) {
                    // 更新
                    await fetch('/api/shifts/update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: currentEditShift.id, ...shiftData })
                    });
                    showMessage('シフトを更新しました', 'success');
                } else {
                    // 新規作成
                    await fetch('/api/shifts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(shiftData)
                    });
                    showMessage('シフトを追加しました', 'success');
                }

                await loadShifts();
                renderCalendar();
                closeEditModal();
            } catch (error) {
                showMessage('エラーが発生しました', 'error');
            }
        }

        // シフト削除
        async function deleteShift() {
            if (!currentEditShift) return;

            if (confirm('このシフトを削除しますか？')) {
                try {
                    await fetch('/api/shifts/delete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: currentEditShift.id })
                    });

                    await loadShifts();
                    renderCalendar();
                    closeEditModal();
                    showMessage('シフトを削除しました', 'success');
                } catch (error) {
                    showMessage('エラーが発生しました', 'error');
                }
            }
        }

        // メッセージ表示
        function showMessage(text, type = 'success') {
            const messageArea = document.getElementById('messageArea');
            messageArea.innerHTML = '<div class="message ' + type + '">' + text + '</div>';
            setTimeout(() => messageArea.innerHTML = '', 4000);
        }

        // 初期化実行
        init();
    </script>
</body>
</html>`);
}

// === API処理 ===
async function handleUser(req, res) {
    const user = dataManager.loadUser();
    sendJSON(res, { user });
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

async function handleShiftUpdate(req, res) {
    const body = await parseBody(req);
    const { id, ...updates } = body;
    const updatedShift = dataManager.updateShift(id, updates);
    
    if (updatedShift) {
        sendJSON(res, { success: true, shift: updatedShift });
    } else {
        sendJSON(res, { success: false, error: 'シフトが見つかりません' }, 404);
    }
}

async function handleShiftDelete(req, res) {
    const body = await parseBody(req);
    const success = dataManager.deleteShift(body.id);
    sendJSON(res, { success });
}

// === バイト先管理API ===
async function handleWorkplaces(req, res) {
    if (req.method === 'GET') {
        const workplaces = dataManager.loadWorkplaces();
        sendJSON(res, { workplaces });
    } else if (req.method === 'POST') {
        const body = await parseBody(req);
        const newWorkplace = dataManager.addWorkplace(body);
        sendJSON(res, { success: true, workplace: newWorkplace });
    }
}

async function handleWorkplaceUpdate(req, res) {
    const body = await parseBody(req);
    const { id, ...updates } = body;
    const updatedWorkplace = dataManager.updateWorkplace(id, updates);
    
    if (updatedWorkplace) {
        sendJSON(res, { success: true, workplace: updatedWorkplace });
    } else {
        sendJSON(res, { success: false, error: 'バイト先が見つかりません' }, 404);
    }
}

async function handleWorkplaceDelete(req, res) {
    const body = await parseBody(req);
    const success = dataManager.deleteWorkplace(body.id);
    sendJSON(res, { success });
}

async function handleSimpleOCR(req, res) {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
        try {
            const buffer = Buffer.concat(chunks);
            
            // multipart/form-dataの簡易パース（UTF-8対応）
            const boundary = req.headers['content-type'].split('boundary=')[1];
            const parts = buffer.toString('binary').split('--' + boundary);
            
            let imageBuffer = null;
            let userName = '';
            let workplaceId = '';
            let workplaceName = '';
            
            for (const part of parts) {
                if (part.includes('name="image"')) {
                    const dataStart = part.indexOf('\r\n\r\n') + 4;
                    const dataEnd = part.lastIndexOf('\r\n');
                    imageBuffer = Buffer.from(part.substring(dataStart, dataEnd), 'binary');
                }
                if (part.includes('name="userName"')) {
                    const dataStart = part.indexOf('\r\n\r\n') + 4;
                    const dataEnd = part.lastIndexOf('\r\n');
                    // UTF-8エンコーディングで正しくデコード
                    const userNameBinary = part.substring(dataStart, dataEnd);
                    userName = Buffer.from(userNameBinary, 'binary').toString('utf8');
                }
                if (part.includes('name="workplaceId"')) {
                    const dataStart = part.indexOf('\r\n\r\n') + 4;
                    const dataEnd = part.lastIndexOf('\r\n');
                    workplaceId = part.substring(dataStart, dataEnd);
                }
                if (part.includes('name="workplaceName"')) {
                    const dataStart = part.indexOf('\r\n\r\n') + 4;
                    const dataEnd = part.lastIndexOf('\r\n');
                    const workplaceNameBinary = part.substring(dataStart, dataEnd);
                    workplaceName = Buffer.from(workplaceNameBinary, 'binary').toString('utf8');
                }
            }
            
            if (!imageBuffer || !userName) {
                return sendJSON(res, { success: false, error: '必要なデータがありません' });
            }
            
            // ChatGPT風シンプルOCR処理
            const result = await ocrProcessor.processShiftImage(imageBuffer, userName, workplaceName, workplaceId);
            sendJSON(res, result);
            
        } catch (error) {
            console.error('OCR処理エラー:', error);
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
        req.on('data', chunk => body += chunk.toString('utf8'));
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                console.error('JSON parse error:', error, 'Body:', body);
                resolve({});
            }
        });
        req.on('error', reject);
    });
}

function sendJSON(res, data, status = 200) {
    res.writeHead(status, { 
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache'
    });
    res.end(JSON.stringify(data, null, 0));
}

// === サーバー起動 ===
server.listen(PORT, '0.0.0.0', () => {
    console.log('\n🗓️ シンプルシフト管理アプリ 起動完了！\n');
    console.log('📱 アクセスURL: http://172.26.93.180:' + PORT);
    console.log('\n✅ ChatGPT風シンプルOCR');
    console.log('✅ シフトボード風編集機能');
    console.log('✅ 3ステップ簡単フロー\n');
    
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'YOUR_OPENAI_API_KEY_HERE') {
        console.log('🤖 OpenAI API: 設定済み');
    } else {
        console.log('⚠️  OpenAI API: デモモード');
    }
    
    console.log('🌐 エンコーディング: UTF-8');
    console.log('📱 WSL2環境対応済み\n');
});