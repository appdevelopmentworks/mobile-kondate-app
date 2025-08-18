#!/bin/bash

echo "📱 モバイル献立アプリのセットアップを開始します..."

# Node.jsのバージョン確認
echo "Node.jsバージョンを確認中..."
node --version

# npmのバージョン確認
echo "npmバージョンを確認中..."
npm --version

# 依存関係のインストール
echo "📦 依存関係をインストール中..."
npm install

# ビルド
echo "🔨 アプリケーションをビルド中..."
npm run build

# 開発サーバーの起動
echo "🚀 開発サーバーを起動します..."
echo "ブラウザで http://localhost:3000 を開いてください"
npm run dev
