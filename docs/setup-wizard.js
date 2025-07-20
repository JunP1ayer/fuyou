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
                    <div class="wizard-buttons-right">
                        <button id="wizard-skip" class="wizard-btn secondary" style="margin-right: 8px; font-size: 12px;">スキップ</button>
                        <button id="wizard-next" class="wizard-btn primary">次へ</button>
                    </div>
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
                <div class="info-box new-2025">
                    <h3>🎉 2025年新制度</h3>
                    <p class="limit-amount">学生: 年収150万円まで</p>
                </div>
                
                <div class="input-group">
                    <label>あなたの状況を選択</label>
                    <select id="student-status" class="wizard-select">
                        <option value="student-19-22">🎓 学生（19-22歳）→ 150万円まで</option>
                        <option value="student-other">📚 学生（その他年齢）→ 123万円まで</option>
                        <option value="general">👤 一般（学生以外）→ 123万円まで</option>
                    </select>
                </div>
                
                <div class="input-group">
                    <label>目標年収（任意）</label>
                    <input type="number" id="target-income" class="wizard-input" 
                           placeholder="例: 1400000" />
                    <div class="income-suggestions">
                        <button type="button" class="suggestion-btn" onclick="document.getElementById('target-income').value='1230000'">123万円</button>
                        <button type="button" class="suggestion-btn" onclick="document.getElementById('target-income').value='1500000'">150万円</button>
                    </div>
                </div>
                
                <div class="tax-benefit-preview" id="tax-preview">
                    <h5>💰 節税効果予測</h5>
                    <div id="benefit-details">年収を入力すると詳細が表示されます</div>
                </div>
                
                <details class="detailed-info">
                    <summary>📊 詳細な制度説明を見る</summary>
                    <div class="limit-card">
                        <div class="limit-header">基本扶養控除</div>
                        <div class="limit-amount-small">年収123万円まで</div>
                        <div class="limit-desc">従来の扶養控除（38万円）</div>
                    </div>
                    <div class="limit-card special">
                        <div class="limit-header">🆕 特定親族特別控除</div>
                        <div class="limit-amount-small">年収123万円超〜150万円</div>
                        <div class="limit-desc">新制度！段階的に控除減額</div>
                    </div>
                    <div class="limit-card student">
                        <div class="limit-header">勤労学生控除</div>
                        <div class="limit-amount-small">年収150万円まで</div>
                        <div class="limit-desc">学生本人の所得税ゼロ</div>
                    </div>
                </details>
            </div>
        `;
        
        // 年収入力に応じてメリット表示を更新
        const targetIncomeInput = document.getElementById('target-income');
        const studentStatusSelect = document.getElementById('student-status');
        
        const updateBenefitPreview = () => {
            const income = parseInt(targetIncomeInput.value) || 0;
            const status = studentStatusSelect.value;
            const benefitDetails = document.getElementById('benefit-details');
            
            if (income === 0) {
                benefitDetails.innerHTML = '年収を入力すると詳細が表示されます';
                return;
            }
            
            let result = '';
            
            if (status === 'student-19-22') {
                if (income <= 1230000) {
                    result = `
                        <div class="benefit-good">
                            ✅ 親: 特定扶養控除 63万円<br>
                            ✅ 本人: 所得税・住民税 0円<br>
                            <strong>年間節税効果: 約19万円</strong>
                        </div>
                    `;
                } else if (income <= 1500000) {
                    const controlAmount = Math.max(0, 630000 - Math.floor((income - 1230000) * 0.4));
                    result = `
                        <div class="benefit-ok">
                            ✅ 親: 特定親族特別控除 ${Math.floor(controlAmount/10000)}万円<br>
                            ✅ 本人: 所得税・住民税 0円<br>
                            <strong>年間節税効果: 約${Math.floor(controlAmount*0.3/10000)}万円</strong>
                        </div>
                    `;
                } else {
                    result = `
                        <div class="benefit-warning">
                            ⚠️ 親: 扶養控除なし<br>
                            ⚠️ 本人: 所得税・住民税 発生<br>
                            <strong>税負担増加の可能性</strong>
                        </div>
                    `;
                }
            } else {
                if (income <= 1230000) {
                    result = `
                        <div class="benefit-good">
                            ✅ 親: 扶養控除 38万円<br>
                            ✅ 本人: 所得税・住民税 0円<br>
                            <strong>年間節税効果: 約11万円</strong>
                        </div>
                    `;
                } else {
                    result = `
                        <div class="benefit-warning">
                            ⚠️ 親: 扶養控除なし<br>
                            ⚠️ 本人: 所得税・住民税 発生<br>
                            <strong>税負担増加の可能性</strong>
                        </div>
                    `;
                }
            }
            
            benefitDetails.innerHTML = result;
        };
        
        targetIncomeInput.addEventListener('input', updateBenefitPreview);
        studentStatusSelect.addEventListener('change', updateBenefitPreview);
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
        
        document.getElementById('wizard-skip').addEventListener('click', () => {
            // スキップして次のステップまたは完了へ
            if (this.currentStep < this.steps.length - 1) {
                this.showStep(this.currentStep + 1);
            } else {
                this.close();
            }
        });

        document.getElementById('wizard-next').addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            try {
                if (this.currentStep < this.steps.length - 1) {
                    this.showStep(this.currentStep + 1);
                } else {
                    // 完了処理
                    await this.saveSettings();
                    this.close();
                }
            } catch (error) {
                console.error('ウィザード操作エラー:', error);
                // エラーが発生してもウィザードを強制的に進める
                try {
                    if (this.currentStep < this.steps.length - 1) {
                        this.showStep(this.currentStep + 1);
                    } else {
                        this.close();
                    }
                } catch (fallbackError) {
                    console.error('フォールバック処理も失敗:', fallbackError);
                    // 最終手段：ウィザードを強制終了
                    this.modal?.remove();
                    localStorage.setItem('fuyou_setup_completed', 'true');
                }
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
                max-height: 90vh;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                display: flex;
                flex-direction: column;
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
                padding: 20px 24px;
                min-height: 200px;
                max-height: calc(90vh - 200px);
                overflow-y: auto;
                flex: 1;
                -webkit-overflow-scrolling: touch;
            }

            .wizard-footer {
                padding: 16px 24px;
                display: flex;
                justify-content: space-between;
                border-top: 1px solid #eee;
                background: #f9f9f9;
                flex-shrink: 0;
                position: relative;
                z-index: 10;
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
            
            /* 2025年税制改正対応スタイル */
            .info-box.new-2025 {
                background: linear-gradient(135deg, #e8f5e9, #f3e5f5);
                border: 2px solid #4CAF50;
            }
            
            .tax-reform-highlight {
                text-align: center;
                padding: 16px;
            }
            
            .reform-title {
                font-size: 18px;
                font-weight: bold;
                color: #1976d2;
                margin-bottom: 8px;
            }
            
            .detailed-limits {
                margin: 20px 0;
            }
            
            .limit-card {
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                padding: 12px;
                margin: 8px 0;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .limit-card.special {
                border-color: #FF9800;
                background: #fff8e1;
            }
            
            .limit-card.student {
                border-color: #2196F3;
                background: #e3f2fd;
            }
            
            .limit-header {
                font-weight: bold;
                font-size: 14px;
                color: #333;
            }
            
            .limit-amount-small {
                font-size: 16px;
                font-weight: bold;
                color: #4CAF50;
                margin: 4px 0;
            }
            
            .limit-desc {
                font-size: 12px;
                color: #666;
            }
            
            .income-suggestions {
                margin-top: 8px;
            }
            
            .suggestion-btn {
                background: #f0f0f0;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 6px 12px;
                margin: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.3s;
            }
            
            .suggestion-btn:hover {
                background: #e0e0e0;
                border-color: #4CAF50;
            }
            
            .tax-benefit-preview {
                margin-top: 12px;
                padding: 12px;
                background: #f5f5f5;
                border-radius: 6px;
                font-size: 14px;
            }
            
            .benefit-good {
                background: #d1f2eb;
                color: #0e6b3a;
                padding: 12px;
                border-radius: 6px;
                border-left: 4px solid #28a745;
            }
            
            .benefit-ok {
                background: #fff3cd;
                color: #856404;
                padding: 12px;
                border-radius: 6px;
                border-left: 4px solid #ffc107;
            }
            
            .benefit-warning {
                background: #f8d7da;
                color: #721c24;
                padding: 12px;
                border-radius: 6px;
                border-left: 4px solid #dc3545;
            }
            
            .detailed-info {
                margin-top: 16px;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                overflow: hidden;
            }
            
            .detailed-info summary {
                padding: 12px 16px;
                background: #f5f5f5;
                cursor: pointer;
                font-weight: 500;
                user-select: none;
                outline: none;
            }
            
            .detailed-info summary:hover {
                background: #e9ecef;
            }
            
            .detailed-info[open] summary {
                border-bottom: 1px solid #e0e0e0;
            }

            .input-group {
                margin-bottom: 16px;
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
                    height: 100vh;
                    max-height: 100vh;
                    border-radius: 0;
                }
                
                .wizard-body {
                    max-height: calc(100vh - 180px);
                    padding: 16px 20px;
                }
                
                .wizard-header {
                    padding: 20px 24px 16px;
                }
                
                .wizard-footer {
                    padding: 12px 20px;
                }
                
                .input-group {
                    margin-bottom: 16px;
                }
                
                .suggestion-btn {
                    padding: 8px 12px;
                    font-size: 13px;
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