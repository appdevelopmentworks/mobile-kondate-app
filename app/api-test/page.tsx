'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { testProviderConnection, testMealGeneration, testImageRecognition } from '@/lib/api/api-test';
import { useApiKeyStore } from '@/lib/settings-store';
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Eye,
  Zap,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function APITestPage() {
  const router = useRouter();
  const { getApiKey, setApiKey } = useApiKeyStore();
  
  const [geminiApiKey, setGeminiApiKey] = useState(getApiKey('geminiApiKey') || '');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingMeal, setIsTestingMeal] = useState(false);
  const [isTestingImage, setIsTestingImage] = useState(false);
  const [testResults, setTestResults] = useState<any>({});
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleSaveApiKey = () => {
    setApiKey('geminiApiKey', geminiApiKey);
    addLog('✅ Gemini APIキーを保存しました');
  };

  const handleTestConnection = async () => {
    if (!geminiApiKey) {
      addLog('❌ APIキーを入力してください');
      return;
    }

    setIsTestingConnection(true);
    addLog('🔍 Gemini API接続テスト開始...');

    try {
      const result = await testProviderConnection('geminiApiKey', geminiApiKey);
      setTestResults((prev: any) => ({ ...prev, connection: result }));
      
      if (result.success) {
        addLog(`✅ 接続テスト成功! (${result.responseTime}ms)`);
      } else {
        addLog(`❌ 接続テスト失敗: ${result.error}`);
      }
    } catch (error) {
      addLog(`❌ 接続テストエラー: ${error instanceof Error ? error.message : 'エラー'}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleTestMealGeneration = async () => {
    setIsTestingMeal(true);
    addLog('🍽️ 献立生成テスト開始...');

    try {
      const result = await testMealGeneration('geminiApiKey');
      setTestResults((prev: any) => ({ ...prev, meal: result }));
      
      if (result.success) {
        addLog(`✅ 献立生成テスト成功! ${result.suggestion?.length || 0}件の献立を生成`);
      } else {
        addLog(`❌ 献立生成テスト失敗: ${result.error}`);
      }
    } catch (error) {
      addLog(`❌ 献立生成テストエラー: ${error instanceof Error ? error.message : 'エラー'}`);
    } finally {
      setIsTestingMeal(false);
    }
  };

  const handleTestImageRecognition = async () => {
    setIsTestingImage(true);
    addLog('🖼️ 画像認識テスト開始...');

    try {
      const result = await testImageRecognition('geminiApiKey');
      setTestResults((prev: any) => ({ ...prev, image: result }));
      
      if (result.success) {
        addLog(`✅ 画像認識テスト成功! ${result.ingredients?.length || 0}個の食材を認識`);
      } else {
        addLog(`❌ 画像認識テスト失敗: ${result.error}`);
      }
    } catch (error) {
      addLog(`❌ 画像認識テストエラー: ${error instanceof Error ? error.message : 'エラー'}`);
    } finally {
      setIsTestingImage(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setTestResults({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/settings')}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gemini API テスト</h1>
            <p className="text-gray-600">Gemini APIの接続と機能をテストします</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* コントロールパネル */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              設定とテスト
            </h2>

            {/* APIキー入力 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gemini APIキー
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy... で始まるAPIキーを入力"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSaveApiKey}
                  disabled={!geminiApiKey}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
                >
                  保存
                </button>
              </div>
            </div>

            {/* テストボタン */}
            <div className="space-y-3">
              <button
                onClick={handleTestConnection}
                disabled={!geminiApiKey || isTestingConnection}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-600 text-white rounded-lg disabled:opacity-50 hover:bg-green-700 transition-colors"
              >
                {isTestingConnection ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Activity className="w-4 h-4" />
                )}
                {isTestingConnection ? '接続テスト中...' : 'API接続テスト'}
              </button>

              <button
                onClick={handleTestMealGeneration}
                disabled={!geminiApiKey || isTestingMeal}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition-colors"
              >
                {isTestingMeal ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {isTestingMeal ? '献立生成テスト中...' : '献立生成テスト'}
              </button>

              <button
                onClick={handleTestImageRecognition}
                disabled={!geminiApiKey || isTestingImage}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 text-white rounded-lg disabled:opacity-50 hover:bg-purple-700 transition-colors"
              >
                {isTestingImage ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {isTestingImage ? '画像認識テスト中...' : '画像認識テスト'}
              </button>

              <button
                onClick={clearLogs}
                className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ログをクリア
              </button>
            </div>

            {/* テスト結果サマリー */}
            {Object.keys(testResults).length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">テスト結果サマリー</h3>
                <div className="space-y-2 text-sm">
                  {testResults.connection && (
                    <div className={`flex items-center gap-2 ${
                      testResults.connection.success ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {testResults.connection.success ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      API接続: {testResults.connection.success ? '成功' : '失敗'}
                    </div>
                  )}
                  {testResults.meal && (
                    <div className={`flex items-center gap-2 ${
                      testResults.meal.success ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {testResults.meal.success ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      献立生成: {testResults.meal.success ? '成功' : '失敗'}
                    </div>
                  )}
                  {testResults.image && (
                    <div className={`flex items-center gap-2 ${
                      testResults.image.success ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {testResults.image.success ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      画像認識: {testResults.image.success ? '成功' : '失敗'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {/* ログパネル */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              実行ログ
            </h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500">
                  ログが表示されます...
                  <br />
                  ブラウザの開発者ツール（F12）でより詳細なログを確認できます。
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* 説明 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-white rounded-lg shadow-lg p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            使い方とトラブルシューティング
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">📋 テスト手順</h3>
              <ol className="list-decimal list-inside space-y-1">
                <li>Gemini APIキーを入力して保存</li>
                <li>「API接続テスト」で基本的な接続を確認</li>
                <li>「献立生成テスト」でAI献立機能をテスト</li>
                <li>「画像認識テスト」でAI画像認識機能をテスト</li>
              </ol>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">🔧 トラブルシューティング</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>APIキーが正しく入力されているか確認</li>
                <li>ネットワーク接続を確認</li>
                <li>APIの利用制限や課金状況を確認</li>
                <li>ブラウザのコンソール（F12）で詳細なエラーを確認</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
