# 📋 アプリストアリリース チェックリスト

## 🚀 リリース前最終チェック

### ✅ 開発環境セットアップ
- [ ] **Java JDK 17+** インストール完了
- [ ] **Android Studio** インストール完了  
- [ ] **Android SDK** 最新版（API 34）
- [ ] **Xcode** インストール完了（iOS用、macOS必須）
- [ ] **環境変数** (JAVA_HOME, ANDROID_HOME) 設定完了

### ✅ アプリビルド準備
- [ ] フロントエンドビルド成功: `cd frontend && npm run build`
- [ ] TypeScriptコンパイル成功: `npm run typecheck` 
- [ ] ESLint チェック成功: `npm run lint`
- [ ] Capacitor sync完了: `npx cap sync`
- [ ] PWA本番デプロイ完了: https://fuyou-mrrkzfsdo-junp1ayers-projects.vercel.app

## 📱 Google Play Store リリース

### 🎯 必要な準備物
- [ ] **512x512px アプリアイコン** (PNG, 1MB以下)
- [ ] **スクリーンショット** 8枚 (1080x1920px)
- [ ] **機能画像** 1枚 (1024x500px, オプション)
- [ ] **プライバシーポリシーURL**: https://fuyou-mrrkzfsdo-junp1ayers-projects.vercel.app/legal
- [ ] **利用規約URL**: https://fuyou-mrrkzfsdo-junp1ayers-projects.vercel.app/terms

### 🔨 ビルド手順
```bash
# 1. 開発者アカウント登録
# Google Play Console: https://play.google.com/console/

# 2. キーストア作成（初回のみ）
cd frontend/android
keytool -genkey -v -keystore fuyou-release-key.keystore -name fuyou-key -keyalg RSA -keysize 2048 -validity 10000

# 3. リリースビルド作成
./gradlew bundleRelease

# 4. AABファイル確認
# 場所: app/build/outputs/bundle/release/app-release.aab
```

### 📊 Google Play Console設定
- [ ] **アプリ名**: 扶養カレンダー
- [ ] **パッケージ名**: com.fuyou.management  
- [ ] **カテゴリ**: 仕事効率化
- [ ] **コンテンツレーティング**: 全年齢対象
- [ ] **価格**: 無料
- [ ] **配信地域**: 日本（初期）→ 全世界（段階的）

### 🛡️ セキュリティ・プライバシー
- [ ] **暗号化使用**: なし（ITSAppUsesNonExemptEncryption: false）
- [ ] **ターゲット年齢**: 全年齢
- [ ] **個人情報収集**: なし（完全ローカル保存）
- [ ] **広告**: なし（初期版）
- [ ] **アプリ内購入**: なし（初期版）

## 🍎 Apple App Store リリース

### 🎯 必要な準備物  
- [ ] **1024x1024px アプリアイコン** (PNG)
- [ ] **スクリーンショット** iPhone/iPad各サイズ（最大10枚ずつ）
- [ ] **アプリプレビュー動画** (オプション、15-30秒)
- [ ] **Apple Developer アカウント** ($99/年)

### 🔨 ビルド手順
```bash
# 1. Apple Developer登録
# https://developer.apple.com/

# 2. Certificates & Provisioning Profiles作成
# Xcode → Preferences → Accounts

# 3. iOS向けビルド（macOS必須）
cd frontend
npx cap open ios
# Xcode でアーカイブ → App Store Connect へアップロード
```

### 📊 App Store Connect設定
- [ ] **アプリ名**: 扶養カレンダー
- [ ] **Bundle ID**: com.fuyou.management
- [ ] **主カテゴリ**: ファイナンス
- [ ] **年齢制限**: 4+
- [ ] **価格**: 無料
- [ ] **配信地域**: 日本 → アジア太平洋 → 全世界

### 🔒 App Privacy設定
- [ ] **データ収集**: なし
- [ ] **データトラッキング**: なし  
- [ ] **サードパーティ広告**: なし
- [ ] **App Transport Security**: HTTPS強制

## 🧪 テスト配信

### 🔄 段階的リリース

#### Google Play Store
1. **内部テスト** (1-2週間)
   - [ ] 内部テスタ 5-10名
   - [ ] 基本機能テスト
   - [ ] UI/UX確認

2. **クローズドテスト** (1-2週間) 
   - [ ] ベータテスタ 50-100名
   - [ ] 異なるデバイスでテスト
   - [ ] フィードバック収集

3. **本番リリース** (段階的配信)
   - [ ] 20%配信 (1週間)
   - [ ] 50%配信 (1週間) 
   - [ ] 100%配信

#### Apple App Store
1. **TestFlight** (1-2週間)
   - [ ] 内部テスタ 25名
   - [ ] 外部テスタ 100名
   - [ ] iOS各バージョンでテスト

2. **App Store審査**
   - [ ] 審査提出
   - [ ] 審査通過（1-7日）
   - [ ] リリース日設定

## 📈 リリース後モニタリング

### 📊 重要な指標
- [ ] **ダウンロード数** 追跡
- [ ] **ユーザーレビュー** 監視
- [ ] **クラッシュレポート** 確認
- [ ] **パフォーマンス** 測定

### 🔧 サポート体制
- [ ] **バグレポート** 対応窓口: support@fuyou-app.com
- [ ] **ユーザーサポート** FAQ準備
- [ ] **アップデート** 計画（月1-2回）
- [ ] **機能追加** ロードマップ作成

## ⚠️ リリース前最終確認事項

### 🔍 機能テスト
- [ ] **シフト登録・編集** 正常動作
- [ ] **収入計算・予測** 正確性確認  
- [ ] **扶養限度額警告** 適切なタイミング
- [ ] **多言語切替** 全言語確認
- [ ] **オフライン機能** データ保存確認

### 🎨 UI/UX確認
- [ ] **レスポンシブデザイン** 全画面サイズ対応
- [ ] **ダークモード** 対応確認
- [ ] **アクセシビリティ** VoiceOver/TalkBack対応
- [ ] **パフォーマンス** 読み込み速度確認

### 📝 法的・コンプライアンス
- [ ] **プライバシーポリシー** 最新版確認
- [ ] **利用規約** 法的要件満たす
- [ ] **免責事項** 適切な記載
- [ ] **著作権表示** 正確な記載

### 🔐 セキュリティ
- [ ] **データ暗号化** ローカル保存
- [ ] **通信暗号化** HTTPS完全対応
- [ ] **認証情報** 安全な管理
- [ ] **脆弱性スキャン** 実施済み

## 🎉 リリース完了後のタスク

### 📢 マーケティング
- [ ] **プレスリリース** 作成・配信
- [ ] **SNS告知** Twitter, Instagram等
- [ ] **ウェブサイト更新** ダウンロードリンク追加
- [ ] **ブログ記事** リリース記念投稿

### 📊 分析・改善
- [ ] **ユーザー行動分析** 実装
- [ ] **A/Bテスト** 計画策定  
- [ ] **フィードバック収集** 仕組み構築
- [ ] **次期バージョン** 企画開始

---

## 🚨 緊急時対応

### 🐛 クリティカル障害発生時
1. **即座にロールバック** 可能な場合
2. **ホットフィックス** 緊急パッチリリース
3. **ユーザー通知** アプリ内・ウェブサイトで告知
4. **根本原因分析** 再発防止策検討

### 📱 ストア審査却下時
1. **却下理由の詳細分析**
2. **必要な修正の実施**  
3. **再審査申請**
4. **審査ガイドライン再確認**

**🎯 目標リリース日**: 2024年12月末  
**📞 緊急連絡先**: support@fuyou-app.com

このチェックリストに従って、品質の高いアプリリリースを実現してください！