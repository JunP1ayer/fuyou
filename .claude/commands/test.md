# /test コマンド

React Testing Library + Jest を使用したテスト生成コマンド

## 使用方法

```
/test ComponentName
/test Button
/test LoginForm
```

## 実行内容

### 1. テストファイル生成

指定されたコンポーネントに対して、以下の内容を含むテストファイルを生成します：

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import ComponentName from './ComponentName';

const theme = createTheme();

const MockedComponent = (props: any) => (
  <ThemeProvider theme={theme}>
    <ComponentName {...props} />
  </ThemeProvider>
);

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<MockedComponent />);
    // コンポーネントが正しくレンダリングされることを確認
  });

  it('handles user interactions', () => {
    render(<MockedComponent />);
    // ユーザーインタラクションのテスト
  });

  it('displays correct content', () => {
    render(<MockedComponent />);
    // 表示内容のテスト
  });
});
```

### 2. テスト要件

- **Accessibility**: アクセシビリティを考慮したテスト
- **Material-UI**: MUIコンポーネントとの統合テスト
- **TypeScript**: 型安全性を保ったテスト
- **User Events**: 実際のユーザー操作をシミュレート

### 3. テストパターン

- **Rendering Tests**: コンポーネントの正常な描画
- **Interaction Tests**: クリック、入力などのイベント
- **Props Tests**: propsの変更による動作確認
- **State Tests**: 状態変更のテスト
- **Async Tests**: 非同期処理のテスト

### 4. 追加セットアップ

```bash
cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### 5. 実行方法

```bash
cd frontend
npm test
```

## 扶養アプリ特有のテストケース

- 収入入力フォームのバリデーション
- 扶養限度額計算の正確性
- ダッシュボードの表示内容
- アラート機能の動作
- 銀行連携のモック
