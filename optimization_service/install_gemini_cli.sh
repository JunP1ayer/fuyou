#!/bin/bash
# Google Gemini CLI インストールスクリプト

echo "🚀 Google Gemini CLI のインストールを開始します..."
echo ""
echo "このスクリプトは以下のコマンドを実行します："
echo "  sudo npm install -g @google/gemini-cli"
echo ""
echo "⚠️  管理者パスワードが必要です"
echo ""

# Gemini CLIのインストール
sudo npm install -g @google/gemini-cli

# インストール確認
if command -v gemini &> /dev/null; then
    echo ""
    echo "✅ Gemini CLI が正常にインストールされました！"
    echo ""
    echo "バージョン情報："
    gemini --version
    echo ""
    echo "使用方法："
    echo "  gemini --help"
else
    echo ""
    echo "❌ インストールに失敗した可能性があります"
    echo "手動でインストールしてください："
    echo "  sudo npm install -g @google/gemini-cli"
fi