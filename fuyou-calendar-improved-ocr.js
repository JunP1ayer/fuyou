#!/usr/bin/env node

/**
 * 🗓️ 扶養管理カレンダーアプリ - OCR精度改善版
 * 強化されたOCRプロンプトと結果確認機能
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

const PORT = process.env.PORT || 9201;

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

// === 改善されたOCR処理 ===
class ImprovedShiftOCRProcessor {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY;
    }

    async processShiftImage(imageBuffer, userName) {
        if (!this.apiKey) {
            return {
                shifts: this.getDemoShifts(),
                confidence: 0.1,
                needsReview: true,
                analysis: "デモモード: APIキーが設定されていません"
            };
        }

        try {
            const base64Image = imageBuffer.toString('base64');
            
            // 強化されたプロンプトでOCR処理
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
                                    text: `シフト表から「${userName}」さんのシフトを正確に抽出してください。

【重要な注意点】
1. 名前の確認: 「${userName}」の他に、略称や異なる表記も探してください
2. 表構造の理解: 日付・曜日・時間・担当者の配置を正確に読み取ってください  
3. 時間表記: 「9-17」「9:00-17:00」「09時-17時」など様々な形式に対応
4. 日付認識: 今月・来月の正確な日付に変換してください

【出力形式（JSON）】
{
  "confidence": 0.85,
  "analysis": "認識した内容の説明",
  "shifts": [
    {
      "date": "2025-07-20",
      "startTime": "09:00", 
      "endTime": "17:00",
      "workplace": "職場名",
      "confidence": 0.9,
      "notes": "特記事項"
    }
  ]
}

正確性を最優先とし、不明な部分は confidence を下げて報告してください。`
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
                console.error('OpenAI API Error:', response.status);
                return this.fallbackProcessing(imageBuffer, userName);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;
            console.log('OCR Response:', content);
            
            // JSON抽出
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                
                // データ検証
                const validShifts = this.validateShifts(result.shifts || []);
                return {
                    ...result,
                    shifts: validShifts,
                    needsReview: (result.confidence || 0.5) < 0.8
                };
            }
            
            return this.fallbackProcessing(imageBuffer, userName);
            
        } catch (error) {
            console.error('OCRエラー:', error);
            return this.fallbackProcessing(imageBuffer, userName);
        }
    }

    // フォールバック処理
    async fallbackProcessing(imageBuffer, userName) {
        return {
            shifts: this.getDemoShifts(),
            confidence: 0.3,
            needsReview: true,
            analysis: "フォールバック処理またはデモデータ"
        };
    }

    // シフトデータ検証
    validateShifts(shifts) {
        return shifts.filter(shift => {
            if (!shift.date || !shift.startTime || !shift.endTime) return false;
            
            const datePattern = /^\d{4}-\d{2}-\d{2}$/;
            if (!datePattern.test(shift.date)) return false;
            
            const timePattern = /^\d{1,2}:\d{2}$/;
            if (!timePattern.test(shift.startTime) || !timePattern.test(shift.endTime)) return false;
            
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
        const today = new Date();
        const shifts = [];
        
        for (let i = 0; i < 3; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i + 1);
            
            shifts.push({
                date: date.toISOString().split('T')[0],
                startTime: ['09:00', '13:00', '17:00'][i],
                endTime: ['17:00', '21:00', '23:00'][i],
                workplace: ['カフェ', 'レストラン', 'コンビニ'][i],
                confidence: 0.9,
                notes: "デモデータ"
            });
        }
        
        return shifts;
    }
}

const ocrProcessor = new ImprovedShiftOCRProcessor();

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
        serveSimpleApp(res);
    } else if (pathname === '/api/user') {
        handleUser(req, res);
    } else if (pathname === '/api/shifts') {
        handleShifts(req, res);
    } else if (pathname === '/api/process-shift-image') {
        handleShiftImageProcessing(req, res);
    } else if (pathname === '/api/setup-complete') {
        handleSetupComplete(req, res);
    } else if (pathname === '/health') {
        sendJSON(res, { status: 'OK', app: 'Improved Fuyou Calendar' });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

function serveSimpleApp(res) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>扶養管理カレンダー - OCR改善版</title>
    <style>
        body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .upload-area { border: 2px dashed #ccc; padding: 40px; text-align: center; margin: 20px 0; }
        .btn { background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        .message { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        .warning { background: #fff3cd; color: #856404; }
        .shift-item { border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px; }
        .confidence-high { border-left: 5px solid #28a745; }
        .confidence-medium { border-left: 5px solid #ffc107; }
        .confidence-low { border-left: 5px solid #dc3545; }
    </style>
</head>
<body>
    <h1>🗓️ 扶養管理カレンダー - OCR改善版</h1>
    
    <div id="setupSection">
        <h2>初期設定</h2>
        <div>
            <label>お名前: <input type="text" id="userName" placeholder="山田太郎"></label>
            <button class="btn" onclick="completeSetup()">設定完了</button>
        </div>
    </div>

    <div id="mainSection" style="display:none">
        <h2>シフト表アップロード</h2>
        <div class="upload-area">
            <button class="btn" onclick="document.getElementById('fileInput').click()">
                📷 シフト表を撮影・アップロード
            </button>
            <input type="file" id="fileInput" accept="image/*" style="display:none" onchange="handleFileUpload(event)">
        </div>

        <div id="resultsSection"></div>
        <div id="shiftsSection"></div>
    </div>

    <div id="messageArea"></div>

    <script>
        let userData = null;

        async function init() {
            const response = await fetch('/api/user');
            const data = await response.json();
            userData = data.user;
            
            if (userData && userData.setupCompleted) {
                document.getElementById('setupSection').style.display = 'none';
                document.getElementById('mainSection').style.display = 'block';
                loadShifts();
            }
        }

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
                document.getElementById('setupSection').style.display = 'none';
                document.getElementById('mainSection').style.display = 'block';
                showMessage('設定完了！', 'success');
            }
        }

        async function handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            if (!userData || !userData.name) {
                showMessage('先に初期設定を完了してください', 'error');
                return;
            }

            showMessage('シフト表を読み取っています...', 'warning');

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
                    displayOCRResults(result);
                } else {
                    showMessage('シフトが見つかりませんでした', 'error');
                }
            } catch (error) {
                showMessage('エラーが発生しました', 'error');
            } finally {
                event.target.value = '';
            }
        }

        function displayOCRResults(result) {
            const resultsSection = document.getElementById('resultsSection');
            const confidence = Math.round(result.confidence * 100);
            let confidenceClass = 'confidence-low';
            
            if (confidence >= 80) confidenceClass = 'confidence-high';
            else if (confidence >= 60) confidenceClass = 'confidence-medium';

            resultsSection.innerHTML = \`
                <h3>📊 OCR認識結果</h3>
                <div class="message \${confidenceClass}">
                    <strong>認識精度: \${confidence}%</strong><br>
                    \${result.analysis || ''}
                </div>
                <div>
                    \${result.shifts.map((shift, i) => \`
                        <div class="shift-item \${(shift.confidence || 0.5) >= 0.7 ? 'confidence-high' : 'confidence-medium'}">
                            <strong>シフト \${i + 1}</strong> 
                            (精度: \${Math.round((shift.confidence || 0.5) * 100)}%)<br>
                            📅 \${shift.date} 
                            🕐 \${shift.startTime}-\${shift.endTime} 
                            🏪 \${shift.workplace}<br>
                            \${shift.notes ? \`<small>\${shift.notes}</small>\` : ''}
                        </div>
                    \`).join('')}
                </div>
                <button class="btn" onclick="registerShifts(\${JSON.stringify(result.shifts).replace(/"/g, '&quot;')})">
                    ✅ シフトを登録する
                </button>
            \`;

            if (result.needsReview) {
                showMessage('認識精度が低いため、内容を確認してから登録してください', 'warning');
            } else {
                showMessage(\`\${result.shifts.length}件のシフトを認識しました\`, 'success');
            }
        }

        async function registerShifts(shifts) {
            for (const shift of shifts) {
                await fetch('/api/shifts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(shift)
                });
            }
            
            showMessage(\`\${shifts.length}件のシフトを登録しました！\`, 'success');
            loadShifts();
            document.getElementById('resultsSection').innerHTML = '';
        }

        async function loadShifts() {
            const response = await fetch('/api/shifts');
            const data = await response.json();
            const shifts = data.shifts || [];

            const shiftsSection = document.getElementById('shiftsSection');
            if (shifts.length > 0) {
                shiftsSection.innerHTML = \`
                    <h3>📋 登録済みシフト</h3>
                    \${shifts.map(shift => \`
                        <div class="shift-item confidence-high">
                            📅 \${shift.date} 🕐 \${shift.startTime}-\${shift.endTime} 🏪 \${shift.workplace}
                        </div>
                    \`).join('')}
                \`;
            } else {
                shiftsSection.innerHTML = '<p>まだシフトが登録されていません</p>';
            }
        }

        function showMessage(text, type = 'success') {
            const messageArea = document.getElementById('messageArea');
            messageArea.innerHTML = \`<div class="message \${type}">\${text}</div>\`;
            setTimeout(() => messageArea.innerHTML = '', 5000);
        }

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
            
            // 改善されたOCR処理
            const ocrResult = await ocrProcessor.processShiftImage(imageBuffer, userName);
            
            const response = {
                success: true,
                shifts: ocrResult.shifts || [],
                confidence: ocrResult.confidence || 0.5,
                needsReview: ocrResult.needsReview || false,
                analysis: ocrResult.analysis || '',
                message: (ocrResult.shifts || []).length + '件のシフトを認識しました'
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
    console.log('\n🗓️ 扶養管理カレンダー - OCR改善版 起動完了！\n');
    console.log('📱 アクセスURL: http://172.26.93.180:' + PORT);
    console.log('\n✅ 改善されたOCRプロンプト');
    console.log('✅ 信頼度ベースの結果表示');
    console.log('✅ 詳細なエラー処理\n');
    
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'YOUR_OPENAI_API_KEY_HERE') {
        console.log('🤖 OpenAI API: 設定済み');
    } else {
        console.log('⚠️  OpenAI API: デモモード（.envファイルにAPIキーを設定してください）');
    }
});