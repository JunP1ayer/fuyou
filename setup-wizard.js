// 扶養プロ - 初期設定ウィザード
class SetupWizard {
    constructor() {
        this.currentStep = 0;
        this.steps = [
            {
                title: 'ようこそ！扶養プロへ',
                description: '学生バイトの扶養管理を簡単に',
                action: this.showWelcome.bind(this)
            },
            {
                title: '扶養限度額の確認',
                description: '2025年の新制度に対応',
                action: this.setupFuyouLimits.bind(this)
            },
            {
                title: 'AI機能について',
                description: '完全無料でシフト表を自動読み取り',
                action: this.showAIFeatures.bind(this)
            },
            {
                title: 'サンプルで試してみる',
                description: '実際の使い方を体験',
                action: this.showDemo.bind(this)
            }
        ];
    }

    async start() {
        // 初回起動チェック
        const hasCompletedSetup = localStorage.getItem('fuyou_setup_completed');
        if (hasCompletedSetup) {
            return false;
        }

        this.showModal();
        return true;
    }

    showModal() {
        const modal = document.createElement('div');
        modal.className = 'setup-wizard-modal';
        modal.innerHTML = `
            <div class="wizard-overlay"></div>
            <div class="wizard-content">
                <div class="wizard-header">
                    <h2 id="wizard-title"></h2>
                    <p id="wizard-description"></p>
                </div>
                <div class="wizard-body" id="wizard-body">
                    <!-- Dynamic content -->
                </div>
                <div class="wizard-footer">
                    <button id="wizard-back" class="wizard-btn secondary">戻る</button>
                    <button id="wizard-next" class="wizard-btn primary">次へ</button>
                </div>
                <div class="wizard-progress">
                    ${this.steps.map((_, i) => `<span class="progress-dot" data-step="${i}"></span>`).join('')}
                </div>
            </div>
        `;

        // スタイル追加
        this.addStyles();

        document.body.appendChild(modal);
        this.modal = modal;
        this.bindEvents();
        this.showStep(0);
    }

    showStep(stepIndex) {
        this.currentStep = stepIndex;
        const step = this.steps[stepIndex];
        
        document.getElementById('wizard-title').textContent = step.title;
        document.getElementById('wizard-description').textContent = step.description;
        
        // プログレス更新
        document.querySelectorAll('.progress-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i <= stepIndex);
        });

        // ボタン状態更新
        document.getElementById('wizard-back').style.display = stepIndex === 0 ? 'none' : 'block';
        document.getElementById('wizard-next').textContent = 
            stepIndex === this.steps.length - 1 ? '始める' : '次へ';

        // ステップ内容表示
        step.action();
    }

    showWelcome() {
        const body = document.getElementById('wizard-body');
        body.innerHTML = `
            <div class="welcome-content">
                <div class="feature-list">
                    <div class="feature-item">
                        <span class="feature-icon">📊</span>
                        <span>扶養限度額を自動管理</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">📸</span>
                        <span>シフト表を撮影するだけ</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">🎯</span>
                        <span>最適な働き方を提案</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">🔔</span>
                        <span>限度額接近を事前通知</span>
                    </div>
                </div>
            </div>
        `;
    }

    setupFuyouLimits() {
        const config = window.FUYOU_CONFIG || {};
        const body = document.getElementById('wizard-body');
        body.innerHTML = `
            <div class="limits-setup">
                <div class="info-box">
                    <h3>2025年 扶養控除限度額</h3>
                    <p class="limit-amount">¥1,030,000</p>
                    <p class="limit-note">年間収入がこの金額を超えると扶養から外れます</p>
                </div>
                
                <div class="input-group">
                    <label>あなたの状況を選択</label>
                    <select id="student-status" class="wizard-select">
                        <option value="student">学生（勤労学生控除あり）</option>
                        <option value="general">一般</option>
                    </select>
                </div>
                
                <div class="input-group">
                    <label>目標年収（任意）</label>
                    <input type="number" id="target-income" class="wizard-input" 
                           placeholder="例: 1000000" />
                    <small>扶養内で最大限稼ぎたい場合は 1030000 と入力</small>
                </div>
            </div>
        `;
    }

    showAIFeatures() {
        const body = document.getElementById('wizard-body');
        body.innerHTML = `
            <div class="ai-features">
                <div class="feature-highlight">
                    <h4>🎉 完全無料AI機能</h4>
                    <p>扶養プロでは、すべてのAI機能を無料で提供しています！</p>
                </div>
                
                <div class="ai-feature-list">
                    <div class="ai-feature-item">
                        <span class="feature-icon">📸</span>
                        <div class="feature-content">
                            <h5>シフト表画像解析</h5>
                            <p>写真を撮るだけで自動的にシフトデータを抽出</p>
                        </div>
                    </div>
                    
                    <div class="ai-feature-item">
                        <span class="feature-icon">🤖</span>
                        <div class="feature-content">
                            <h5>OpenAI GPT-4o搭載</h5>
                            <p>最新の画像認識AIで高精度な文字認識</p>
                        </div>
                    </div>
                    
                    <div class="ai-feature-item">
                        <span class="feature-icon">⚡</span>
                        <div class="feature-content">
                            <h5>即座にデータ化</h5>
                            <p>手作業でのデータ入力は一切不要</p>
                        </div>
                    </div>
                    
                    <div class="ai-feature-item">
                        <span class="feature-icon">♾️</span>
                        <div class="feature-content">
                            <h5>無制限利用</h5>
                            <p>回数制限なし、すべて無料でご利用いただけます</p>
                        </div>
                    </div>
                </div>
                
                <div class="ready-message">
                    <p>✅ AI機能は既に利用可能です</p>
                    <p>📱 次の画面でさっそく試してみましょう！</p>
                </div>
            </div>
        `;
    }

    showDemo() {
        const body = document.getElementById('wizard-body');
        body.innerHTML = `
            <div class="demo-section">
                <h3>🎉 設定完了！</h3>
                <p>早速使ってみましょう</p>
                
                <div class="demo-options">
                    <button class="demo-btn" onclick="wizardInstance.startWithSample()">
                        <span class="demo-icon">📋</span>
                        <span>サンプルデータで試す</span>
                    </button>
                    
                    <button class="demo-btn" onclick="wizardInstance.startWithPhoto()">
                        <span class="demo-icon">📸</span>
                        <span>シフト表を撮影する</span>
                    </button>
                    
                    <button class="demo-btn" onclick="wizardInstance.startManual()">
                        <span class="demo-icon">✏️</span>
                        <span>手動で入力する</span>
                    </button>
                </div>
            </div>
        `;
    }

    async saveSettings() {
        const settings = {
            studentStatus: document.getElementById('student-status')?.value || 'student',
            targetIncome: document.getElementById('target-income')?.value || '',
            enableAI: true, // 常にAI機能有効
            setupCompleted: true,
            completedAt: new Date().toISOString()
        };

        // AI機能は常に有効（APIキーは既に設定済み）
        // ユーザーによる設定は不要

        localStorage.setItem('fuyou_setup_completed', 'true');
        localStorage.setItem('fuyou_user_settings', JSON.stringify(settings));

        return settings;
    }

    // デモアクション
    startWithSample() {
        this.close();
        // サンプルデータ読み込み
        if (window.loadSampleData) {
            window.loadSampleData();
        }
    }

    startWithPhoto() {
        this.close();
        // カメラ起動
        document.querySelector('[data-tab="ai-analysis"]')?.click();
    }

    startManual() {
        this.close();
        // 手動入力画面へ
        document.querySelector('[data-tab="calendar"]')?.click();
    }

    bindEvents() {
        document.getElementById('wizard-back').addEventListener('click', () => {
            if (this.currentStep > 0) {
                this.showStep(this.currentStep - 1);
            }
        });

        document.getElementById('wizard-next').addEventListener('click', async () => {
            if (this.currentStep < this.steps.length - 1) {
                this.showStep(this.currentStep + 1);
            } else {
                // 完了処理
                await this.saveSettings();
                this.close();
            }
        });

        // オーバーレイクリックで閉じない
        document.querySelector('.wizard-overlay').addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    close() {
        this.modal?.remove();
        // メインアプリに通知
        if (window.onSetupComplete) {
            window.onSetupComplete();
        }
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .setup-wizard-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .wizard-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(8px);
            }

            .wizard-content {
                position: relative;
                background: white;
                border-radius: 16px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }

            .wizard-header {
                padding: 24px;
                text-align: center;
                border-bottom: 1px solid #eee;
            }

            .wizard-header h2 {
                margin: 0 0 8px;
                font-size: 24px;
                color: #333;
            }

            .wizard-header p {
                margin: 0;
                color: #666;
                font-size: 14px;
            }

            .wizard-body {
                padding: 32px 24px;
                min-height: 300px;
                overflow-y: auto;
            }

            .wizard-footer {
                padding: 16px 24px;
                display: flex;
                justify-content: space-between;
                border-top: 1px solid #eee;
                background: #f9f9f9;
            }

            .wizard-btn {
                padding: 10px 24px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.3s;
            }

            .wizard-btn.primary {
                background: #4CAF50;
                color: white;
            }

            .wizard-btn.primary:hover {
                background: #45a049;
            }

            .wizard-btn.secondary {
                background: #e0e0e0;
                color: #666;
            }

            .wizard-progress {
                position: absolute;
                bottom: 16px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 8px;
            }

            .progress-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #ddd;
                transition: all 0.3s;
            }

            .progress-dot.active {
                background: #4CAF50;
                transform: scale(1.2);
            }

            /* ステップ別スタイル */
            .feature-list {
                display: grid;
                gap: 16px;
            }

            .feature-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
                background: #f0f7ff;
                border-radius: 12px;
            }

            .feature-icon {
                font-size: 24px;
            }

            .info-box {
                background: #e8f5e9;
                padding: 20px;
                border-radius: 12px;
                text-align: center;
                margin-bottom: 24px;
            }

            .limit-amount {
                font-size: 32px;
                font-weight: bold;
                color: #2e7d32;
                margin: 8px 0;
            }

            .input-group {
                margin-bottom: 20px;
            }

            .input-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: #333;
            }

            .wizard-input,
            .wizard-select {
                width: 100%;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 16px;
            }

            .wizard-input:focus,
            .wizard-select:focus {
                outline: none;
                border-color: #4CAF50;
            }

            .api-toggle {
                margin: 16px 0;
            }

            .api-key-section {
                margin-top: 16px;
                padding: 16px;
                background: #f5f5f5;
                border-radius: 8px;
            }

            .demo-options {
                display: grid;
                gap: 12px;
                margin-top: 24px;
            }

            .demo-btn {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
                background: white;
                border: 2px solid #e0e0e0;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s;
            }

            .demo-btn:hover {
                border-color: #4CAF50;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            .demo-icon {
                font-size: 32px;
            }

            @media (max-width: 600px) {
                .wizard-content {
                    width: 100%;
                    height: 100%;
                    max-height: 100%;
                    border-radius: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// グローバルインスタンス
const wizardInstance = new SetupWizard();

// 自動起動
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            wizardInstance.start();
        }, 500);
    });
}

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SetupWizard;
}