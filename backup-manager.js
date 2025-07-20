// 扶養プロ - データバックアップ・復元管理
class BackupManager {
    constructor() {
        this.backupInterval = null;
        this.autoBackupEnabled = true;
        this.maxBackups = 10;
        this.compressionEnabled = true;
        
        // 対応するデータソース
        this.dataSources = [
            'shifts',
            'workplaces', 
            'fuyou_calculations',
            'user_settings',
            'ai_scan_history'
        ];
        
        this.init();
    }

    init() {
        // 自動バックアップ設定の読み込み
        const config = window.FUYOU_CONFIG?.data?.backup;
        if (config) {
            this.autoBackupEnabled = config.enabled;
            this.maxBackups = config.maxBackups || 10;
        }
        
        // 自動バックアップの開始
        if (this.autoBackupEnabled) {
            this.startAutoBackup();
        }
        
        // 手動バックアップボタンの設定
        this.setupBackupUI();
        
        // 復元機能の準備
        this.setupRestoreUI();
    }

    // 完全バックアップの作成
    async createFullBackup(includeAIHistory = false) {
        try {
            const backupData = {
                version: '1.0',
                createdAt: new Date().toISOString(),
                platform: navigator.platform,
                appVersion: window.APP_VERSION || '1.0.0',
                data: {}
            };

            // 各データソースからデータを収集
            for (const source of this.dataSources) {
                if (source === 'ai_scan_history' && !includeAIHistory) {
                    continue; // AIスキャン履歴は除外オプション
                }
                
                const data = await this.exportDataSource(source);
                if (data) {
                    backupData.data[source] = data;
                }
            }

            // データの整合性チェック
            const integrity = await this.calculateIntegrity(backupData);
            backupData.integrity = integrity;

            // 圧縮（オプション）
            const finalData = this.compressionEnabled ? 
                await this.compressData(backupData) : 
                backupData;

            // ローカルストレージに保存
            await this.saveBackupToStorage(finalData);

            // 使用状況記録
            if (window.trackFeature) {
                window.trackFeature('backup_create', {
                    dataSources: this.dataSources.length,
                    compressed: this.compressionEnabled,
                    includeAI: includeAIHistory
                });
            }

            return {
                success: true,
                backup: finalData,
                size: this.calculateBackupSize(finalData)
            };

        } catch (error) {
            console.error('バックアップ作成エラー:', error);
            this.notifyError('バックアップの作成に失敗しました', error);
            return { success: false, error: error.message };
        }
    }

    // データソースからのエクスポート
    async exportDataSource(sourceName) {
        switch (sourceName) {
            case 'shifts':
                return this.exportShifts();
            case 'workplaces':
                return this.exportWorkplaces();
            case 'fuyou_calculations':
                return this.exportFuyouCalculations();
            case 'user_settings':
                return this.exportUserSettings();
            case 'ai_scan_history':
                return this.exportAIScanHistory();
            default:
                return null;
        }
    }

    exportShifts() {
        try {
            const shifts = JSON.parse(localStorage.getItem('shifts') || '[]');
            return {
                count: shifts.length,
                data: shifts,
                lastUpdated: localStorage.getItem('shifts_last_updated')
            };
        } catch (error) {
            console.error('シフトデータエクスポートエラー:', error);
            return null;
        }
    }

    exportWorkplaces() {
        try {
            const workplaces = JSON.parse(localStorage.getItem('workplaces') || '[]');
            return {
                count: workplaces.length,
                data: workplaces
            };
        } catch (error) {
            console.error('勤務先データエクスポートエラー:', error);
            return null;
        }
    }

    exportFuyouCalculations() {
        try {
            const calculations = JSON.parse(localStorage.getItem('fuyou_calculations') || '[]');
            return {
                count: calculations.length,
                data: calculations
            };
        } catch (error) {
            console.error('扶養計算データエクスポートエラー:', error);
            return null;
        }
    }

    exportUserSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('fuyou_user_settings') || '{}');
            // APIキーなどの機密情報は除外
            const sanitizedSettings = { ...settings };
            delete sanitizedSettings.apiKeys;
            
            return sanitizedSettings;
        } catch (error) {
            console.error('設定データエクスポートエラー:', error);
            return null;
        }
    }

    exportAIScanHistory() {
        try {
            const history = JSON.parse(localStorage.getItem('ai_scan_history') || '[]');
            // 画像データは除外し、メタデータのみ
            const sanitizedHistory = history.map(item => ({
                timestamp: item.timestamp,
                provider: item.provider,
                success: item.success,
                confidence: item.confidence,
                shiftsFound: item.shiftsFound
            }));
            
            return {
                count: sanitizedHistory.length,
                data: sanitizedHistory
            };
        } catch (error) {
            console.error('AIスキャン履歴エクスポートエラー:', error);
            return null;
        }
    }

    // バックアップの復元
    async restoreFromBackup(backupData, options = {}) {
        try {
            // バックアップデータの検証
            const validation = await this.validateBackup(backupData);
            if (!validation.isValid) {
                throw new Error(`無効なバックアップファイル: ${validation.error}`);
            }

            // 圧縮データの展開
            const data = backupData.compressed ? 
                await this.decompressData(backupData) : 
                backupData;

            // 現在のデータのバックアップ（復元前）
            if (options.createPreRestoreBackup !== false) {
                await this.createFullBackup();
            }

            // データソースごとに復元
            const results = {};
            for (const [sourceName, sourceData] of Object.entries(data.data)) {
                if (options.excludeSources?.includes(sourceName)) {
                    continue;
                }
                
                try {
                    await this.restoreDataSource(sourceName, sourceData);
                    results[sourceName] = { success: true };
                } catch (error) {
                    results[sourceName] = { success: false, error: error.message };
                }
            }

            // 復元完了通知
            this.notifyRestoreComplete(results);

            // 使用状況記録
            if (window.trackFeature) {
                window.trackFeature('backup_restore', {
                    sources: Object.keys(results).length,
                    success: Object.values(results).filter(r => r.success).length
                });
            }

            return { success: true, results };

        } catch (error) {
            console.error('復元エラー:', error);
            this.notifyError('データの復元に失敗しました', error);
            return { success: false, error: error.message };
        }
    }

    // データソースの復元
    async restoreDataSource(sourceName, sourceData) {
        switch (sourceName) {
            case 'shifts':
                localStorage.setItem('shifts', JSON.stringify(sourceData.data));
                if (sourceData.lastUpdated) {
                    localStorage.setItem('shifts_last_updated', sourceData.lastUpdated);
                }
                break;
            case 'workplaces':
                localStorage.setItem('workplaces', JSON.stringify(sourceData.data));
                break;
            case 'fuyou_calculations':
                localStorage.setItem('fuyou_calculations', JSON.stringify(sourceData.data));
                break;
            case 'user_settings':
                localStorage.setItem('fuyou_user_settings', JSON.stringify(sourceData));
                break;
            case 'ai_scan_history':
                localStorage.setItem('ai_scan_history', JSON.stringify(sourceData.data));
                break;
        }
    }

    // ファイルとしてエクスポート
    async exportToFile(filename = null) {
        const backup = await this.createFullBackup(true);
        if (!backup.success) {
            throw new Error('バックアップの作成に失敗しました');
        }

        const defaultFilename = `fuyou-backup-${new Date().toISOString().slice(0, 10)}.json`;
        const finalFilename = filename || defaultFilename;

        const blob = new Blob([JSON.stringify(backup.backup, null, 2)], {
            type: 'application/json'
        });

        // ダウンロード
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFilename;
        a.click();
        URL.revokeObjectURL(url);

        return { success: true, filename: finalFilename, size: blob.size };
    }

    // ファイルからのインポート
    async importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const backupData = JSON.parse(e.target.result);
                    const result = await this.restoreFromBackup(backupData);
                    resolve(result);
                } catch (error) {
                    reject(new Error(`ファイルの読み込みエラー: ${error.message}`));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('ファイルの読み込みに失敗しました'));
            };
            
            reader.readAsText(file);
        });
    }

    // Google Drive バックアップ（将来機能）
    async backupToGoogleDrive() {
        // Google Drive API integration placeholder
        throw new Error('Google Drive バックアップは今後実装予定です');
    }

    // 自動バックアップの管理
    startAutoBackup() {
        const interval = window.FUYOU_CONFIG?.data?.backup?.interval || 24 * 60 * 60 * 1000; // 24時間
        
        this.backupInterval = setInterval(async () => {
            try {
                await this.createFullBackup();
                console.log('自動バックアップ完了');
            } catch (error) {
                console.error('自動バックアップエラー:', error);
            }
        }, interval);
    }

    stopAutoBackup() {
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
            this.backupInterval = null;
        }
    }

    // バックアップの一覧取得
    getBackupList() {
        try {
            const backups = JSON.parse(localStorage.getItem('fuyou_backups') || '[]');
            return backups.map(backup => ({
                id: backup.id,
                createdAt: backup.createdAt,
                size: this.calculateBackupSize(backup),
                sourcesCount: Object.keys(backup.data || {}).length,
                version: backup.version
            }));
        } catch (error) {
            console.error('バックアップ一覧取得エラー:', error);
            return [];
        }
    }

    // バックアップの削除
    deleteBackup(backupId) {
        try {
            const backups = JSON.parse(localStorage.getItem('fuyou_backups') || '[]');
            const filtered = backups.filter(backup => backup.id !== backupId);
            localStorage.setItem('fuyou_backups', JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('バックアップ削除エラー:', error);
            return false;
        }
    }

    // ユーティリティ関数
    calculateBackupSize(backupData) {
        const str = JSON.stringify(backupData);
        return new Blob([str]).size;
    }

    async calculateIntegrity(data) {
        const str = JSON.stringify(data);
        const msgUint8 = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async validateBackup(backupData) {
        try {
            // 基本構造の確認
            if (!backupData.version || !backupData.createdAt || !backupData.data) {
                return { isValid: false, error: '必要なフィールドが不足しています' };
            }

            // 整合性チェック
            if (backupData.integrity) {
                const expectedIntegrity = await this.calculateIntegrity({
                    ...backupData,
                    integrity: undefined
                });
                
                if (expectedIntegrity !== backupData.integrity) {
                    return { isValid: false, error: 'データの整合性チェックに失敗しました' };
                }
            }

            return { isValid: true };
        } catch (error) {
            return { isValid: false, error: error.message };
        }
    }

    async saveBackupToStorage(backupData) {
        const backups = JSON.parse(localStorage.getItem('fuyou_backups') || '[]');
        
        // 新しいバックアップにIDを付与
        backupData.id = Date.now().toString();
        
        // バックアップリストに追加
        backups.push(backupData);
        
        // 最大数を超えた場合、古いものを削除
        if (backups.length > this.maxBackups) {
            backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            backups.splice(this.maxBackups);
        }
        
        localStorage.setItem('fuyou_backups', JSON.stringify(backups));
    }

    // 圧縮・展開（簡易実装）
    async compressData(data) {
        // 実際の実装では LZ-string やその他の圧縮ライブラリを使用
        return {
            ...data,
            compressed: true,
            originalSize: this.calculateBackupSize(data)
        };
    }

    async decompressData(compressedData) {
        // 実際の展開処理
        return {
            ...compressedData,
            compressed: false
        };
    }

    // UI セットアップ
    setupBackupUI() {
        // バックアップボタンがある場合のイベント設定
        const backupBtn = document.getElementById('backup-btn');
        if (backupBtn) {
            backupBtn.addEventListener('click', async () => {
                try {
                    await this.exportToFile();
                    this.showNotification('バックアップファイルをダウンロードしました', 'success');
                } catch (error) {
                    this.showNotification('バックアップに失敗しました', 'error');
                }
            });
        }
    }

    setupRestoreUI() {
        // 復元ファイル選択のイベント設定
        const restoreInput = document.getElementById('restore-input');
        if (restoreInput) {
            restoreInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        await this.importFromFile(file);
                        this.showNotification('データを復元しました', 'success');
                        // ページリロードで反映
                        setTimeout(() => location.reload(), 1000);
                    } catch (error) {
                        this.showNotification('復元に失敗しました', 'error');
                    }
                }
            });
        }
    }

    // 通知
    showNotification(message, type = 'info') {
        // 既存の通知システムとの連携
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    notifyError(message, error) {
        console.error(message, error);
        this.showNotification(message, 'error');
    }

    notifyRestoreComplete(results) {
        const successful = Object.values(results).filter(r => r.success).length;
        const total = Object.keys(results).length;
        
        this.showNotification(
            `データ復元完了: ${successful}/${total} 成功`,
            successful === total ? 'success' : 'warning'
        );
    }
}

// グローバルインスタンス
const backupManager = new BackupManager();

// 便利なショートカット関数
window.createBackup = () => backupManager.exportToFile();
window.getBackupList = () => backupManager.getBackupList();

// エクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackupManager;
}