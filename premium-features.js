// 扶養プロ - プレミアム機能管理システム
class PremiumFeatures {
    constructor() {
        this.isPremium = false;
        this.premiumFeatures = {
            // AI機能拡張
            unlimited_ai_scans: {
                name: 'AI解析無制限',
                description: 'シフト表の画像解析回数制限なし',
                free_limit: 5,
                icon: '🤖'
            },
            
            // 複数勤務先管理
            unlimited_workplaces: {
                name: '勤務先無制限登録',
                description: '複数のバイト先を無制限に管理',
                free_limit: 1,
                icon: '🏢'
            },
            
            // 高度な分析機能
            advanced_analytics: {
                name: '詳細分析レポート',
                description: '月次・年次の詳細な収入分析',
                free_limit: 0,
                icon: '📊'
            },
            
            // 最適化エンジン
            smart_optimization: {
                name: 'スマート最適化',
                description: 'AI powered 最適なシフト提案',
                free_limit: 0,
                icon: '🎯'
            },
            
            // データ管理
            cloud_backup: {
                name: 'クラウドバックアップ',
                description: 'Google Drive自動バックアップ',
                free_limit: 0,
                icon: '☁️'
            },
            
            // 通知機能
            smart_notifications: {
                name: 'スマート通知',
                description: '扶養限度額の詳細なアラート設定',
                free_limit: 0,
                icon: '🔔'
            },
            
            // データエクスポート
            advanced_export: {
                name: '高度なエクスポート',
                description: 'Excel、PDF、税務署形式での出力',
                free_limit: 0,
                icon: '📄'
            },
            
            // サポート
            priority_support: {
                name: '優先サポート',
                description: '24時間以内の問い合わせ対応',
                free_limit: 0,
                icon: '🚀'
            }
        };
        
        this.usage = {};
        this.trialPeriod = 7; // 7日間トライアル
        
        this.init();
    }

    init() {
        // プレミアム状態の確認
        this.checkPremiumStatus();
        
        // 使用量の読み込み
        this.loadUsageData();
        
        // UIの更新
        this.updateUI();
        
        // 使用量のリセット（月次）
        this.checkUsageReset();
    }

    checkPremiumStatus() {
        const premiumData = JSON.parse(localStorage.getItem('premium_status') || '{}');
        
        if (premiumData.subscribed) {
            const expiryDate = new Date(premiumData.expiryDate);
            this.isPremium = expiryDate > new Date();
            
            if (!this.isPremium && premiumData.subscribed) {
                // 期限切れの処理
                this.handleSubscriptionExpiry();
            }
        }
        
        // トライアル期間の確認
        if (!this.isPremium && premiumData.trialStarted) {
            const trialStart = new Date(premiumData.trialStarted);
            const trialEnd = new Date(trialStart.getTime() + this.trialPeriod * 24 * 60 * 60 * 1000);
            this.isPremium = new Date() < trialEnd;
            this.isTrialUser = this.isPremium;
        }
    }

    loadUsageData() {
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const stored = localStorage.getItem(`usage_${currentMonth}`);
        this.usage = stored ? JSON.parse(stored) : {};
        
        // 初期化
        for (const feature in this.premiumFeatures) {
            if (!this.usage[feature]) {
                this.usage[feature] = 0;
            }
        }
    }

    saveUsageData() {
        const currentMonth = new Date().toISOString().slice(0, 7);
        localStorage.setItem(`usage_${currentMonth}`, JSON.stringify(this.usage));
    }

    // 機能の使用可能性チェック
    canUseFeature(featureName) {
        if (this.isPremium) {
            return { allowed: true, reason: 'premium' };
        }
        
        const feature = this.premiumFeatures[featureName];
        if (!feature) {
            return { allowed: false, reason: 'unknown_feature' };
        }
        
        const currentUsage = this.usage[featureName] || 0;
        const limit = feature.free_limit;
        
        if (limit === 0) {
            return { 
                allowed: false, 
                reason: 'premium_only',
                message: `${feature.name}はプレミアム機能です`
            };
        }
        
        if (currentUsage >= limit) {
            return { 
                allowed: false, 
                reason: 'limit_exceeded',
                message: `${feature.name}の月間制限（${limit}回）に達しました`,
                current: currentUsage,
                limit: limit
            };
        }
        
        return { 
            allowed: true, 
            reason: 'within_limit',
            remaining: limit - currentUsage
        };
    }

    // 機能使用の記録
    recordUsage(featureName) {
        const check = this.canUseFeature(featureName);
        if (!check.allowed && check.reason !== 'premium') {
            throw new Error(check.message || '機能を使用できません');
        }
        
        if (!this.isPremium) {
            this.usage[featureName] = (this.usage[featureName] || 0) + 1;
            this.saveUsageData();
        }
        
        // 使用量追跡
        if (window.trackFeature) {
            window.trackFeature('premium_feature_use', {
                feature: featureName,
                isPremium: this.isPremium,
                usage: this.usage[featureName]
            });
        }
        
        // 制限接近の警告
        this.checkUsageWarnings(featureName);
    }

    checkUsageWarnings(featureName) {
        if (this.isPremium) return;
        
        const feature = this.premiumFeatures[featureName];
        const usage = this.usage[featureName];
        const limit = feature.free_limit;
        
        if (limit > 0) {
            const remaining = limit - usage;
            
            if (remaining === 1) {
                this.showUpgradePrompt(`${feature.name}の残り使用回数: ${remaining}回`);
            } else if (remaining === 0) {
                this.showUpgradePrompt(`${feature.name}の制限に達しました。プレミアムで無制限利用！`);
            }
        }
    }

    // プレミアム機能の詳細取得
    getFeatureDetails(featureName) {
        const feature = this.premiumFeatures[featureName];
        if (!feature) return null;
        
        const usage = this.usage[featureName] || 0;
        const canUse = this.canUseFeature(featureName);
        
        return {
            ...feature,
            currentUsage: usage,
            canUse: canUse.allowed,
            reason: canUse.reason,
            remaining: canUse.remaining,
            isPremiumFeature: feature.free_limit === 0
        };
    }

    // 全機能の状態取得
    getAllFeaturesStatus() {
        const status = {};
        
        for (const [featureName, feature] of Object.entries(this.premiumFeatures)) {
            status[featureName] = this.getFeatureDetails(featureName);
        }
        
        return {
            isPremium: this.isPremium,
            isTrialUser: this.isTrialUser || false,
            features: status
        };
    }

    // トライアル開始
    startTrial() {
        if (this.isPremium || this.hasTrialUsed()) {
            return { success: false, reason: 'already_used' };
        }
        
        const trialData = {
            trialStarted: new Date().toISOString(),
            subscribed: false
        };
        
        localStorage.setItem('premium_status', JSON.stringify(trialData));
        this.isPremium = true;
        this.isTrialUser = true;
        
        this.updateUI();
        this.showTrialStartedNotification();
        
        if (window.trackFeature) {
            window.trackFeature('trial_started', {});
        }
        
        return { success: true, trialPeriod: this.trialPeriod };
    }

    hasTrialUsed() {
        const premiumData = JSON.parse(localStorage.getItem('premium_status') || '{}');
        return !!premiumData.trialStarted;
    }

    // サブスクリプション処理（模擬）
    async purchasePremium(plan = 'monthly') {
        // 実際の決済処理はここに実装
        // Stripe, PayPal, App Store等との連携
        
        const plans = {
            monthly: {
                price: 480,
                duration: 30,
                name: '月額プラン'
            },
            yearly: {
                price: 4800,
                duration: 365,
                name: '年額プラン'
            }
        };
        
        const selectedPlan = plans[plan];
        if (!selectedPlan) {
            throw new Error('無効なプランです');
        }
        
        // 模擬決済処理
        const paymentResult = await this.processPayment(selectedPlan);
        
        if (paymentResult.success) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + selectedPlan.duration);
            
            const premiumData = {
                subscribed: true,
                plan: plan,
                purchaseDate: new Date().toISOString(),
                expiryDate: expiryDate.toISOString(),
                price: selectedPlan.price
            };
            
            localStorage.setItem('premium_status', JSON.stringify(premiumData));
            this.isPremium = true;
            this.isTrialUser = false;
            
            this.updateUI();
            this.showPurchaseSuccessNotification(selectedPlan);
            
            if (window.trackFeature) {
                window.trackFeature('premium_purchased', {
                    plan: plan,
                    price: selectedPlan.price
                });
            }
            
            return { success: true, plan: selectedPlan };
        }
        
        throw new Error(paymentResult.error || '決済に失敗しました');
    }

    // 模擬決済処理
    async processPayment(plan) {
        // 実際の決済サービスとの連携を想定
        return new Promise((resolve) => {
            setTimeout(() => {
                // 90%の確率で成功
                const success = Math.random() > 0.1;
                resolve({
                    success,
                    error: success ? null : '決済処理でエラーが発生しました'
                });
            }, 1000);
        });
    }

    // UIの更新
    updateUI() {
        // プレミアムバッジの表示
        this.updatePremiumBadge();
        
        // 機能制限の表示
        this.updateFeatureLimits();
        
        // アップグレードボタンの表示
        this.updateUpgradeButtons();
    }

    updatePremiumBadge() {
        const badge = document.querySelector('.premium-badge');
        if (badge) {
            if (this.isPremium) {
                badge.textContent = this.isTrialUser ? '🔥 トライアル中' : '⭐ プレミアム';
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    updateFeatureLimits() {
        for (const [featureName, feature] of Object.entries(this.premiumFeatures)) {
            const limitDisplay = document.querySelector(`[data-feature-limit="${featureName}"]`);
            if (limitDisplay) {
                const details = this.getFeatureDetails(featureName);
                
                if (this.isPremium) {
                    limitDisplay.textContent = '無制限';
                    limitDisplay.className = 'feature-limit premium';
                } else if (details.canUse) {
                    limitDisplay.textContent = `${details.remaining}回 残り`;
                    limitDisplay.className = 'feature-limit normal';
                } else {
                    limitDisplay.textContent = '制限到達';
                    limitDisplay.className = 'feature-limit exceeded';
                }
            }
        }
    }

    updateUpgradeButtons() {
        const upgradeButtons = document.querySelectorAll('.upgrade-button');
        upgradeButtons.forEach(btn => {
            if (this.isPremium) {
                btn.style.display = 'none';
            } else {
                btn.style.display = 'block';
            }
        });
    }

    // プレミアム紹介モーダル
    showUpgradeModal() {
        const modal = document.createElement('div');
        modal.className = 'premium-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>⭐ 扶養プロ プレミアム</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="premium-features-grid">
                        ${this.generateFeaturesHTML()}
                    </div>
                    <div class="pricing-section">
                        <div class="pricing-plans">
                            <div class="plan monthly">
                                <h3>月額プラン</h3>
                                <div class="price">¥480<span>/月</span></div>
                                <button onclick="premium.purchasePremium('monthly')" class="purchase-btn">
                                    今すぐ始める
                                </button>
                            </div>
                            <div class="plan yearly recommended">
                                <div class="recommendation-badge">おすすめ</div>
                                <h3>年額プラン</h3>
                                <div class="price">¥4,800<span>/年</span></div>
                                <div class="savings">2ヶ月分お得！</div>
                                <button onclick="premium.purchasePremium('yearly')" class="purchase-btn">
                                    年額で始める
                                </button>
                            </div>
                        </div>
                    </div>
                    ${!this.hasTrialUsed() ? `
                    <div class="trial-section">
                        <button onclick="premium.startTrial()" class="trial-btn">
                            🔥 7日間無料トライアル
                        </button>
                        <p>クレジットカード不要</p>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        this.addModalStyles();
        document.body.appendChild(modal);
        
        // イベント設定
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('.modal-overlay').addEventListener('click', () => {
            modal.remove();
        });
    }

    generateFeaturesHTML() {
        return Object.entries(this.premiumFeatures)
            .map(([key, feature]) => `
                <div class="premium-feature-item">
                    <span class="feature-icon">${feature.icon}</span>
                    <div class="feature-info">
                        <h4>${feature.name}</h4>
                        <p>${feature.description}</p>
                    </div>
                </div>
            `).join('');
    }

    // 通知
    showUpgradePrompt(message) {
        if (window.showNotification) {
            window.showNotification(message, 'info', {
                action: {
                    text: 'アップグレード',
                    callback: () => this.showUpgradeModal()
                }
            });
        }
    }

    showTrialStartedNotification() {
        if (window.showNotification) {
            window.showNotification(
                '🔥 7日間プレミアム トライアル開始！',
                'success'
            );
        }
    }

    showPurchaseSuccessNotification(plan) {
        if (window.showNotification) {
            window.showNotification(
                `⭐ ${plan.name} へのアップグレードが完了しました！`,
                'success'
            );
        }
    }

    // 使用量のリセット
    checkUsageReset() {
        const lastReset = localStorage.getItem('usage_last_reset');
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        if (!lastReset || lastReset !== currentMonth) {
            // 月が変わった場合、使用量をリセット
            this.usage = {};
            for (const feature in this.premiumFeatures) {
                this.usage[feature] = 0;
            }
            
            this.saveUsageData();
            localStorage.setItem('usage_last_reset', currentMonth);
        }
    }

    handleSubscriptionExpiry() {
        this.isPremium = false;
        this.isTrialUser = false;
        
        // 期限切れ通知
        if (window.showNotification) {
            window.showNotification(
                'プレミアムプランの有効期限が切れました',
                'warning',
                {
                    action: {
                        text: '更新する',
                        callback: () => this.showUpgradeModal()
                    }
                }
            );
        }
        
        this.updateUI();
    }

    addModalStyles() {
        if (document.getElementById('premium-modal-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'premium-modal-styles';
        style.textContent = `
            .premium-modal {
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

            .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(8px);
            }

            .modal-content {
                position: relative;
                background: white;
                border-radius: 16px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            }

            .modal-header {
                padding: 24px;
                text-align: center;
                border-bottom: 1px solid #eee;
                position: relative;
            }

            .modal-close {
                position: absolute;
                top: 16px;
                right: 16px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
            }

            .premium-features-grid {
                display: grid;
                gap: 16px;
                padding: 24px;
            }

            .premium-feature-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
                background: #f8f9ff;
                border-radius: 12px;
            }

            .feature-icon {
                font-size: 24px;
            }

            .pricing-plans {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
                padding: 24px;
            }

            .plan {
                border: 2px solid #e0e0e0;
                border-radius: 12px;
                padding: 24px;
                text-align: center;
                position: relative;
            }

            .plan.recommended {
                border-color: #4CAF50;
                transform: scale(1.05);
            }

            .recommendation-badge {
                position: absolute;
                top: -10px;
                left: 50%;
                transform: translateX(-50%);
                background: #4CAF50;
                color: white;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
            }

            .price {
                font-size: 32px;
                font-weight: bold;
                color: #4CAF50;
                margin: 16px 0;
            }

            .price span {
                font-size: 16px;
                color: #666;
            }

            .purchase-btn {
                background: #4CAF50;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 16px;
                cursor: pointer;
                width: 100%;
            }

            .trial-section {
                text-align: center;
                padding: 24px;
                border-top: 1px solid #eee;
            }

            .trial-btn {
                background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
                color: white;
                border: none;
                padding: 16px 32px;
                border-radius: 12px;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                margin-bottom: 8px;
            }

            @media (max-width: 600px) {
                .pricing-plans {
                    grid-template-columns: 1fr;
                }
                
                .plan.recommended {
                    transform: none;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// グローバルインスタンス
const premium = new PremiumFeatures();

// 便利なショートカット関数
window.checkFeature = (feature) => premium.canUseFeature(feature);
window.useFeature = (feature) => premium.recordUsage(feature);
window.showUpgradeModal = () => premium.showUpgradeModal();

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PremiumFeatures;
}