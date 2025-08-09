#!/bin/bash
# 最適化サービスの依存関係インストールスクリプト

echo "🔧 最適化サービスのセットアップを開始します..."
echo ""
echo "このスクリプトは以下のコマンドを実行します："
echo "1. sudo apt update"
echo "2. sudo apt install -y python3-pip python3-venv"
echo "3. python3 -m venv venv"
echo "4. source venv/bin/activate && pip install -r requirements.txt"
echo ""
echo "⚠️  管理者パスワードが必要です"
echo ""

# システムパッケージのインストール
echo "📦 システムパッケージをインストールしています..."
sudo apt update
sudo apt install -y python3-pip python3-venv python3-dev

# 仮想環境の作成
echo "🐍 Python仮想環境を作成しています..."
python3 -m venv venv

# 依存関係のインストール
echo "📚 Python依存関係をインストールしています..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "✅ セットアップが完了しました！"
echo ""
echo "🚀 サービスを起動するには："
echo "   source venv/bin/activate"
echo "   python start_dev.py"
echo "または"
echo "   source venv/bin/activate"
echo "   uvicorn main:app --reload --host 0.0.0.0 --port 8000"