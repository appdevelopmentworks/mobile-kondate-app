# モバイル献立アプリ

スマートフォンに最適化された和食献立プランナーのPWAアプリケーションです。

## 🚀 特徴

- **スマホファースト設計**: 片手操作に最適化されたUI
- **PWA対応**: インストール可能、オフライン対応
- **7ステップフォーム**: 条件を入力して最適な献立を提案
- **献立管理**: 履歴、お気に入り機能
- **調理サポート**: 時系列の調理手順、買い物リスト

## 📱 主な機能

### 献立作成
- 食事の種類（朝食/昼食/夕食/お弁当/おもてなし）
- 人数・調理時間の設定
- 使いたい食材の選択
- アレルギー・苦手食材の登録
- 栄養バランス・難易度の指定
- 品数・予算の設定

### 献立結果
- レシピ詳細表示
- 時系列調理スケジュール
- チェック可能な買い物リスト
- 栄養情報の可視化

### データ管理
- 献立履歴の保存
- お気に入り機能
- ローカルストレージでのデータ永続化

## 🛠️ 技術スタック

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **State**: Zustand
- **Icons**: Lucide React
- **PWA**: next-pwa

## 📦 インストール

```bash
# リポジトリのクローン
git clone [repository-url]
cd mobile-kondate-app

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

## 🚀 使用方法

### 開発環境

```bash
# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# プロダクションサーバーの起動
npm run start

# コードチェック
npm run lint
```

### PWAとしてインストール

1. `npm run build && npm run start` でプロダクションビルドを起動
2. スマートフォンのブラウザでアクセス
3. ブラウザメニューから「ホーム画面に追加」を選択

## 📁 プロジェクト構造

```
mobile-kondate-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── meal-form/          # 献立作成フォーム
│   │   ├── result/             # 献立結果表示
│   │   ├── history/            # 履歴
│   │   ├── favorites/          # お気に入り
│   │   └── settings/           # 設定
│   ├── components/             # Reactコンポーネント
│   │   ├── ui/                 # 基本UIコンポーネント
│   │   ├── forms/              # フォームステップ
│   │   ├── meal/               # 献立関連
│   │   └── layout/             # レイアウト
│   ├── lib/                    # ユーティリティ
│   │   ├── types.ts            # 型定義
│   │   ├── store.ts            # Zustand store
│   │   ├── utils.ts            # ヘルパー関数
│   │   └── sample-data.ts      # サンプルデータ
│   └── styles/                 # スタイルシート
├── public/                     # 静的ファイル
│   └── manifest.json           # PWAマニフェスト
└── package.json
```

## 🎨 デザイン原則

### スマホ最適化
- 最小タッチターゲット: 44px
- 片手操作範囲: 画面下部2/3
- スワイプ対応
- 大きめのボタンとテキスト

### パフォーマンス
- 画面遷移: 0.3秒以内
- Progressive Enhancement
- オフライン対応

## 📝 今後の実装予定

### Phase 2
- [ ] AI/LLM連携による献立生成
- [ ] レシピのカスタマイズ機能
- [ ] 栄養士監修レシピの追加

### Phase 3
- [ ] カメラによる食材認識
- [ ] 冷蔵庫管理機能
- [ ] 家族間での献立共有

### Phase 4
- [ ] 買い物リストの外部アプリ連携
- [ ] カレンダー機能
- [ ] SNSシェア機能

## 🤝 コントリビュート

プルリクエストは歓迎です。大きな変更の場合は、まずissueを開いて変更内容について議論してください。

## 📄 ライセンス

[MIT](https://choosealicense.com/licenses/mit/)

## 👥 作成者

Mobile Kondate App Team

## 🙏 謝辞

- 和食レシピデータの提供元
- UIデザインの参考資料
- テストユーザーの皆様
