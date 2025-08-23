'use client';

import { motion } from 'framer-motion';
import MobileLayout from '@/components/layout/MobileLayout';
import { 
  Shield, 
  Eye, 
  Lock, 
  Database, 
  Globe, 
  UserX, 
  Cookie,
  Smartphone,
  Server,
  AlertTriangle
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  const sections = [
    {
      icon: Shield,
      title: '個人情報の保護',
      content: [
        'このアプリはあなたのプライバシーを最優先に考えています。',
        '収集される個人情報は最小限に留め、すべてローカルに保存されます。',
        '外部サーバーへの個人情報送信は、明示的な同意なしには行いません。'
      ]
    },
    {
      icon: Database,
      title: '収集される情報',
      content: [
        '• アプリの設定情報（言語、通知設定等）',
        '• 献立作成履歴（ローカル保存のみ）',
        '• お気に入りレシピ（ローカル保存のみ）',
        '• 使用統計（匿名化、ローカル保存のみ）',
        '• APIキー（暗号化してセッション保存）'
      ]
    },
    {
      icon: Lock,
      title: 'データの保存と暗号化',
      content: [
        '設定データはブラウザのローカルストレージに保存されます。',
        'APIキーは暗号化されてセッションストレージに保存されます。',
        '献立履歴とお気に入りはローカルのIndexedDBに保存されます。',
        'すべてのデータは端末内にのみ保存され、外部に送信されません。'
      ]
    },
    {
      icon: Server,
      title: 'AI サービスの利用',
      content: [
        'AI機能（献立生成・画像認識）使用時、以下の情報が外部AIプロバイダーに送信されます：',
        '• 献立生成: 指定した食材名、条件（匿名）',
        '• 画像認識: アップロードした食材画像（匿名）',
        '利用するAIプロバイダー: Groq、Gemini、HuggingFace、Together AI、Anthropic等',
        'これらの情報は匿名で送信され、個人を特定する情報は含まれません。'
      ]
    },
    {
      icon: Eye,
      title: 'アナリティクスとトラッキング',
      content: [
        'このアプリでは以下のトラッキングは行いません：',
        '• GoogleアナリティクスやFacebookピクセルなどの外部トラッキング',
        '• 広告配信のためのデータ収集',
        '• 位置情報の取得',
        '使用統計はすべてローカルで計算され、外部に送信されません。'
      ]
    },
    {
      icon: Cookie,
      title: 'Cookie とストレージ',
      content: [
        'このアプリは以下の技術を使用してデータを保存します：',
        '• LocalStorage: アプリ設定、ユーザー設定',
        '• SessionStorage: APIキー（セッション中のみ）',
        '• IndexedDB: 献立履歴、お気に入り',
        '• Service Worker Cache: アプリファイルのキャッシュ',
        '第三者Cookieは使用していません。'
      ]
    },
    {
      icon: Smartphone,
      title: 'デバイス権限',
      content: [
        'このアプリが要求する権限：',
        '• カメラ: 食材の画像認識機能のみに使用',
        '• 通知: リマインダーや更新通知のみに使用',
        '• ストレージ: アプリデータの保存のみに使用',
        'これらの権限は該当機能でのみ使用され、他の目的では使用されません。'
      ]
    },
    {
      icon: Globe,
      title: '国際データ転送',
      content: [
        'AI機能利用時、データは以下の地域のサーバーに送信される可能性があります：',
        '• 米国（OpenAI、Anthropic、HuggingFace）',
        '• 米国（Google - Gemini）',
        '• 米国（Together AI、Groq）',
        'これらのサービスはそれぞれのプライバシーポリシーに従って運営されています。'
      ]
    },
    {
      icon: UserX,
      title: 'データの削除',
      content: [
        'あなたのデータを削除する方法：',
        '• 設定画面から「設定をリセット」を実行',
        '• ブラウザの設定からサイトデータを削除',
        '• アプリをアンインストール（PWAの場合）',
        'データ削除後は復元できません。事前にエクスポート機能をご利用ください。'
      ]
    },
    {
      icon: AlertTriangle,
      title: 'セキュリティ',
      content: [
        'データセキュリティのための対策：',
        '• すべての通信はHTTPS暗号化',
        '• APIキーは暗号化して保存',
        '• 最小権限の原則に基づく設計',
        '• 定期的なセキュリティ見直し',
        'セキュリティ上の問題を発見した場合は速やかにご報告ください。'
      ]
    }
  ];

  return (
    <MobileLayout title="プライバシーポリシー" showBack={true}>
      <div className="px-4 py-6 space-y-6">
        {/* ヘッダー */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6"
        >
          <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            プライバシーポリシー
          </h1>
          <p className="text-gray-600">
            あなたのプライバシーと情報セキュリティについて
          </p>
          <div className="text-sm text-gray-500 mt-4">
            最終更新日: 2025年8月23日
          </div>
        </motion.div>

        {/* 重要な概要 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <h2 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            重要なポイント
          </h2>
          <ul className="text-blue-800 text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span><strong>データはすべてローカル保存</strong> - 外部サーバーへの保存はありません</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span><strong>AI機能は匿名</strong> - 個人を特定する情報は送信されません</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span><strong>トラッキング無し</strong> - 広告やアナリティクスのトラッキングはありません</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span><strong>いつでも削除可能</strong> - 設定からすべてのデータを削除できます</span>
            </li>
          </ul>
        </motion.div>

        {/* 詳細セクション */}
        {sections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.05 }}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <section.icon className="w-5 h-5 text-gray-600" />
                {section.title}
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {section.content.map((text, textIndex) => (
                  <p key={textIndex} className="text-gray-700 text-sm leading-relaxed">
                    {text}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        ))}

        {/* お問い合わせ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gray-50 border border-gray-200 rounded-lg p-6"
        >
          <h3 className="font-semibold text-gray-900 mb-3">お問い合わせ</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              このプライバシーポリシーについてご質問がある場合、または
              プライバシーに関する懸念がある場合は、以下の方法でお問い合わせください：
            </p>
            <div className="bg-white rounded p-3 mt-3">
              <p className="font-medium">開発チーム</p>
              <p className="text-gray-600">mobile-kondate-app@example.com</p>
            </div>
          </div>
        </motion.div>

        {/* 変更履歴 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white border border-gray-200 rounded-lg p-4"
        >
          <h3 className="font-semibold text-gray-900 mb-3">変更履歴</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-700">初回作成</span>
              <span className="text-gray-500">2025年8月23日</span>
            </div>
          </div>
        </motion.div>

        {/* 底部余白 */}
        <div className="h-16"></div>
      </div>
    </MobileLayout>
  );
}