# ESLint設定エラーに関する相談

## 現在の状況
OCR機能実装が完了し、GitHubへのプッシュ前の品質チェックを行っています。
しかし、`npm run lint`実行時に以下のエラーが発生しました。

## エラー内容
```
ESLint couldn't find the config "@typescript-eslint/recommended" to extend from.
```

## 現在の.eslintrc.js
```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  // ...
};
```

## 質問事項

1. **必要なパッケージのインストール**
   - どのパッケージが不足していて、何をインストールすべきでしょうか？
   - `@typescript-eslint/parser`と`@typescript-eslint/eslint-plugin`の両方が必要でしょうか？

2. **package.jsonの確認**
   - devDependenciesに追加すべきパッケージとバージョンを教えてください
   - 現在のTypeScript/ESLintバージョンとの互換性も考慮してください

3. **代替案**
   - ESLintを一時的にスキップして、後で修正する方法はありますか？
   - `--no-verify`オプションでコミットすることのリスクは？

4. **推奨される解決策**
   - 最も簡単で確実な解決方法は何でしょうか？

## 目的
- コード品質を保ちながら、OCR機能をGitHubにプッシュしたい
- 今後の開発でもESLintが正常に動作するようにしたい