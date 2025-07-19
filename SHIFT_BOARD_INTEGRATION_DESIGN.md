# 🎯 扶養管理特化型アプリ - シフトボード統合設計書

## 📊 2025年税制改正対応機能

### 🏛️ 新税制ルール実装
- **123万円の壁**: 基礎控除58万円 + 給与所得控除65万円
- **150万円の壁**: 19-22歳大学生の特定親族特別控除
- **130万円の壁**: 社会保険扶養限度額（変更なし）
- **段階的控除**: 160万円→51万円、170万円→31万円、188万円→0円

## 🎨 シフトボード優秀UI/UX要素の統合

### 📅 カレンダービュー強化
```typescript
// 扶養管理特化カレンダーコンポーネント
interface FuyouCalendarDay {
  date: Date;
  shifts: ShiftData[];
  dailyEarnings: number;
  monthlyTotal: number;
  yearlyTotal: number;
  fuyouStatus: 'safe' | 'warning' | 'danger' | 'exceeded';
  remainingCapacity: number; // 各限度額まで残り金額
}
```

### 🚨 リアルタイム限度額アラート
- **90%到達**: 黄色警告（例：110万円到達時）
- **95%到達**: オレンジ警告（例：117万円到達時）
- **100%到達**: 赤色アラート（限度額達成）
- **プッシュ通知**: 月末時点での年収予測アラート

### 💰 スマート給与計算エンジン
```typescript
interface SmartSalaryCalculator {
  // 基本計算
  hourlyRate: number;
  workHours: number;
  overtime: number;
  lateNightBonus: number;
  transportationCost: number;
  
  // 扶養管理特化
  yearlyProjection: number;
  fuyouLimitAnalysis: {
    type123: FuyouLimit; // 123万円の壁
    type130: FuyouLimit; // 130万円の壁  
    type150: FuyouLimit; // 150万円の壁（大学生）
  };
  
  // 最適化提案
  workingHoursOptimization: OptimizationSuggestion[];
}
```

## 🎯 独自機能 - 扶養管理特化

### 📈 年収プロジェクション
- **月別予測グラフ**: 現在のペースでの年収予測
- **シナリオ分析**: 「月に○時間増やすと年収はいくらになる？」
- **逆算機能**: 「123万円以内に収めるには月何時間まで？」

### 🎓 学生特化機能
- **年齢自動判定**: 19-22歳の大学生には150万円限度額を適用
- **学年管理**: 卒業予定日での扶養状況変化の事前アラート
- **長期休暇対応**: 夏休み・春休みでの収入集中管理

### 🏥 社会保険管理
- **130万円の壁**: 健康保険扶養からの脱退リスク表示
- **保険料試算**: 扶養を外れた場合の年間負担額計算
- **家族への影響**: 親の税負担変化の可視化

## 🚀 シフトボード風UI実装

### 📱 メイン画面設計
```typescript
// ダッシュボードレイアウト
interface FuyouDashboard {
  // 上部：現在の扶養状況（信号機形式）
  fuyouStatusIndicator: TrafficLightStatus;
  
  // 中央：カレンダービュー
  calendar: FuyouCalendar;
  
  // 下部：クイックアクション
  quickActions: {
    addShift: () => void;
    viewProjection: () => void;
    checkLimits: () => void;
    exportData: () => void;
  };
}
```

### 🎨 カラーシステム
```scss
// 扶養管理専用カラーパレット
$colors: (
  safe: #4CAF50,      // 緑：安全域
  warning: #FF9800,   // オレンジ：注意域
  danger: #F44336,    // 赤：危険域
  exceeded: #9C27B0,  // 紫：超過
  
  // シフトボード風
  primary: #2196F3,   // 青：メイン
  accent: #FFC107,    // 黄：アクセント
  background: #FAFAFA // グレー：背景
);
```

### 📊 ウィジェット対応
- **ホーム画面ウィジェット**: 今月の収入 / 年収予測 / 限度額残り
- **通知センター統合**: 重要なアラートを通知として表示

## 🔧 技術的統合仕様

### 🗄️ データ構造強化
```typescript
// 既存のShiftデータにFuyou管理を統合
interface EnhancedShift extends Shift {
  fuyouImpact: {
    dailyEarnings: number;
    monthlyProgress: number;
    yearlyProgress: number;
    limitRemainingDays: number; // 各限度額まで何日で到達？
  };
}
```

### 🔗 API拡張
```typescript
// 扶養管理特化API
interface FuyouManagementAPI {
  calculateYearlyProjection(shifts: Shift[]): Promise<YearlyProjection>;
  checkLimitStatus(userId: string): Promise<LimitStatus>;
  generateOptimizationSuggestions(currentIncome: number): Promise<Suggestion[]>;
  exportTaxDocument(year: number): Promise<TaxDocument>;
}
```

## 📱 Mobile-First設計

### 🌟 PWA対応
- **オフライン機能**: ネット接続なしでもシフト登録可能
- **プッシュ通知**: 限度額アラート・シフトリマインダー
- **アプリライク**: ネイティブアプリと同等のUX

### 🎚️ アクセシビリティ
- **音声読み上げ**: 限度額状況の音声案内
- **高コントラスト**: 扶養状況の視覚的区別を強化
- **大きなタップエリア**: シフト登録の簡単操作

## 🚀 実装優先順位

### Phase 1: Core Integration
1. ✅ 既存シフト管理機能の活用
2. 🆕 2025年税制ルール実装
3. 🆕 扶養限度額計算エンジン

### Phase 2: UI/UX Enhancement  
1. 🆕 シフトボード風カレンダーUI
2. 🆕 リアルタイムアラートシステム
3. 🆕 年収プロジェクション画面

### Phase 3: Advanced Features
1. 🆕 AI予測・最適化機能
2. 🆕 PWA・ウィジェット対応
3. 🆕 税務書類出力機能

## 🎖️ 競合優位性

| 機能 | 一般シフト管理アプリ | 本アプリ |
|------|---------------------|----------|
| 基本シフト管理 | ✅ | ✅ |
| 給与計算 | ✅ | ✅++ |
| 扶養管理 | ❌ | ✅ |
| 2025年税制対応 | ❌ | ✅ |
| 限度額アラート | ❌ | ✅ |
| 年収最適化 | ❌ | ✅ |
| 学生特化機能 | ❌ | ✅ |

**🏆 結論**: シフトボードの優秀なUX + 扶養管理特化 = 学生バイト市場でのNo.1ポジション獲得可能