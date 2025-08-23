'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Zap,
  Eye,
  RefreshCw
} from 'lucide-react';

interface TestResult {
  status: 'pending' | 'testing' | 'success' | 'error';
  message: string;
  responseTime?: number;
  timestamp?: Date;
}

interface ApiTestPanelProps {
  providers: Array<{
    key: string;
    name: string;
    hasKey: boolean;
    capabilities: {
      meal: boolean;
      vision: boolean;
    };
  }>;
  onTestProvider: (provider: string, testType: 'connection' | 'meal' | 'vision') => Promise<{
    success: boolean;
    message: string;
    responseTime?: number;
  }>;
}

export default function ApiTestPanel({ providers, onTestProvider }: ApiTestPanelProps) {
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [isTestingAll, setIsTestingAll] = useState(false);

  const runSingleTest = useCallback(async (
    provider: string, 
    testType: 'connection' | 'meal' | 'vision'
  ) => {
    const testKey = `${provider}-${testType}`;
    
    setTestResults(prev => ({
      ...prev,
      [testKey]: {
        status: 'testing',
        message: 'テスト実行中...',
        timestamp: new Date()
      }
    }));

    try {
      const startTime = Date.now();
      const result = await onTestProvider(provider, testType);
      const responseTime = Date.now() - startTime;

      setTestResults(prev => ({
        ...prev,
        [testKey]: {
          status: result.success ? 'success' : 'error',
          message: result.message,
          responseTime: result.responseTime || responseTime,
          timestamp: new Date()
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testKey]: {
          status: 'error',
          message: error instanceof Error ? error.message : 'テストに失敗しました',
          timestamp: new Date()
        }
      }));
    }
  }, [onTestProvider]);

  const runAllTests = useCallback(async () => {
    setIsTestingAll(true);
    
    const validProviders = providers.filter(p => p.hasKey);
    
    for (const provider of validProviders) {
      // 接続テスト
      await runSingleTest(provider.key, 'connection');
      
      // 機能テスト
      if (provider.capabilities.meal) {
        await runSingleTest(provider.key, 'meal');
      }
      if (provider.capabilities.vision) {
        await runSingleTest(provider.key, 'vision');
      }
      
      // 少し待機（API制限対策）
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setIsTestingAll(false);
  }, [providers, runSingleTest]);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'testing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'testing':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const validProviders = providers.filter(p => p.hasKey);

  if (validProviders.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <div>
            <h4 className="font-medium text-amber-900">APIテストを実行できません</h4>
            <p className="text-sm text-amber-700 mt-1">
              APIキーを設定してからテストを実行してください
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="bg-white border border-gray-200 rounded-lg overflow-hidden"
    >
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              API接続テスト
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              設定済みAPIキーの動作確認を行います
            </p>
          </div>
          <button
            onClick={runAllTests}
            disabled={isTestingAll}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Activity className={`w-4 h-4 ${isTestingAll ? 'animate-pulse' : ''}`} />
            {isTestingAll ? 'テスト実行中...' : '全てテスト'}
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {validProviders.map((provider) => (
          <div key={provider.key} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="font-medium text-gray-900">{provider.name}</span>
              </div>
            </div>

            <div className="space-y-3">
              {/* 接続テスト */}
              <div className={`border rounded-lg p-3 ${getStatusColor(testResults[`${provider.key}-connection`]?.status || 'pending')}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults[`${provider.key}-connection`]?.status || 'pending')}
                    <span className="text-sm font-medium">接続テスト</span>
                  </div>
                  <button
                    onClick={() => runSingleTest(provider.key, 'connection')}
                    disabled={testResults[`${provider.key}-connection`]?.status === 'testing'}
                    className="px-3 py-1 bg-white border border-gray-300 rounded text-xs hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    テスト
                  </button>
                </div>
                {testResults[`${provider.key}-connection`] && (
                  <div className="text-xs space-y-1">
                    <p className="text-gray-700">
                      {testResults[`${provider.key}-connection`].message}
                    </p>
                    {testResults[`${provider.key}-connection`].responseTime && (
                      <p className="text-gray-500">
                        応答時間: {testResults[`${provider.key}-connection`].responseTime}ms
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 献立生成テスト */}
              {provider.capabilities.meal && (
                <div className={`border rounded-lg p-3 ${getStatusColor(testResults[`${provider.key}-meal`]?.status || 'pending')}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults[`${provider.key}-meal`]?.status || 'pending')}
                      <Zap className="w-3 h-3 text-blue-500" />
                      <span className="text-sm font-medium">献立生成テスト</span>
                    </div>
                    <button
                      onClick={() => runSingleTest(provider.key, 'meal')}
                      disabled={testResults[`${provider.key}-meal`]?.status === 'testing'}
                      className="px-3 py-1 bg-white border border-gray-300 rounded text-xs hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      テスト
                    </button>
                  </div>
                  {testResults[`${provider.key}-meal`] && (
                    <div className="text-xs space-y-1">
                      <p className="text-gray-700">
                        {testResults[`${provider.key}-meal`].message}
                      </p>
                      {testResults[`${provider.key}-meal`].responseTime && (
                        <p className="text-gray-500">
                          応答時間: {testResults[`${provider.key}-meal`].responseTime}ms
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 画像認識テスト */}
              {provider.capabilities.vision && (
                <div className={`border rounded-lg p-3 ${getStatusColor(testResults[`${provider.key}-vision`]?.status || 'pending')}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResults[`${provider.key}-vision`]?.status || 'pending')}
                      <Eye className="w-3 h-3 text-green-500" />
                      <span className="text-sm font-medium">画像認識テスト</span>
                    </div>
                    <button
                      onClick={() => runSingleTest(provider.key, 'vision')}
                      disabled={testResults[`${provider.key}-vision`]?.status === 'testing'}
                      className="px-3 py-1 bg-white border border-gray-300 rounded text-xs hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      テスト
                    </button>
                  </div>
                  {testResults[`${provider.key}-vision`] && (
                    <div className="text-xs space-y-1">
                      <p className="text-gray-700">
                        {testResults[`${provider.key}-vision`].message}
                      </p>
                      {testResults[`${provider.key}-vision`].responseTime && (
                        <p className="text-gray-500">
                          応答時間: {testResults[`${provider.key}-vision`].responseTime}ms
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <div className="text-xs text-gray-600">
          <p className="font-medium mb-1">テスト内容</p>
          <ul className="space-y-1">
            <li>• <strong>接続テスト</strong>: APIキーの有効性確認</li>
            <li>• <strong>献立生成テスト</strong>: 実際の献立生成機能テスト</li>
            <li>• <strong>画像認識テスト</strong>: サンプル画像での認識機能テスト</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}