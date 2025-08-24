'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileLayout from '@/components/layout/MobileLayout';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Moon, 
  Globe, 
  Shield, 
  Info, 
  ChevronRight,
  Smartphone,
  Database,
  Key,
  Download,
  Upload,
  RotateCcw,
  Eye,
  EyeOff,
  Package,
  AlertCircle,
  CheckCircle,
  Activity,
  Cpu,
  Zap,
  Star,
  RefreshCw
} from 'lucide-react';
import { useSettingsStore, useApiKeyStore } from '@/lib/settings-store';
import { checkAIProviderStatus } from '@/lib/meal-generation';
import { testProviderConnection, testMealGeneration, testImageRecognition, APITestResult } from '@/lib/api/api-test';
import ApiTestPanel from '@/components/settings/ApiTestPanel';
import NotificationSettings from '@/components/settings/NotificationSettings';
import CacheManager from '@/components/settings/CacheManager';
import UsageStatistics from '@/components/settings/UsageStatistics';

export default function SettingsPage() {
  const router = useRouter();
  const {
    darkMode,
    notifications,
    offlineMode,
    language,
    defaultServings,
    defaultCookingTime,
    toggleNotifications,
    toggleDarkMode,
    toggleOfflineMode,
    updateSettings,
    exportSettings,
    importSettings,
    resetSettings
  } = useSettingsStore();

  const {
    keys,
    setApiKey,
    getApiKey,
    clearAllKeys,
    setPreferredProvider,
    getPreferredProvider
  } = useApiKeyStore();

  const [showApiKeys, setShowApiKeys] = useState(false);
  const [apiKeyInputs, setApiKeyInputs] = useState({
    groqApiKey: '',
    geminiApiKey: '',
    huggingfaceApiKey: '',
    togetherApiKey: '',
    anthropicApiKey: '',
    openaiApiKey: '',
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  const [aiProviderStatus, setAiProviderStatus] = useState<{
    available: boolean;
    providers: {
      mealGeneration: number;
      imageRecognition: number;
    };
    recommendations: {
      mealGeneration?: string;
      imageRecognition?: string;
    };
  } | null>(null);
  const [isCheckingProviders, setIsCheckingProviders] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, APITestResult>>({});
  const [isTestingProvider, setIsTestingProvider] = useState<string | null>(null);
  const [preferredProviders, setPreferredProviders] = useState({
    mealGeneration: '',
    imageRecognition: '',
  });

  // 新機能の表示状態
  const [showApiTestPanel, setShowApiTestPanel] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showCacheManager, setShowCacheManager] = useState(false);
  const [showUsageStats, setShowUsageStats] = useState(false);

  // 通知設定
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: notifications,
    mealReminders: true,
    favoriteUpdates: false,
    weeklyPlanning: true,
    soundEnabled: true,
    vibrationEnabled: true,
    reminderTime: '18:00',
  });

  // 初期化時にAPIキーを読み込み
  useEffect(() => {
    setApiKeyInputs({
      groqApiKey: getApiKey('groqApiKey'),
      geminiApiKey: getApiKey('geminiApiKey'),
      huggingfaceApiKey: getApiKey('huggingfaceApiKey'),
      togetherApiKey: getApiKey('togetherApiKey'),
      anthropicApiKey: getApiKey('anthropicApiKey'),
      openaiApiKey: getApiKey('openaiApiKey'),
    });

    // 優先プロバイダー設定を読み込み
    setPreferredProviders({
      mealGeneration: getPreferredProvider('mealGeneration'),
      imageRecognition: getPreferredProvider('imageRecognition'),
    });

    // AIプロバイダーの状態をチェック
    checkProviderStatus();
  }, [getApiKey, getPreferredProvider]);

  const checkProviderStatus = async () => {
    setIsCheckingProviders(true);
    try {
      const status = await checkAIProviderStatus();
      setAiProviderStatus(status);
      console.log('🔍 AIプロバイダー状態:', status);
    } catch (error) {
      console.error('AIプロバイダー状態確認エラー:', error);
    } finally {
      setIsCheckingProviders(false);
    }
  };

  const handleApiKeyChange = (provider: keyof typeof apiKeyInputs, value: string) => {
    setApiKeyInputs(prev => ({ ...prev, [provider]: value }));
  };

  const handleApiKeySave = async (provider: keyof typeof apiKeyInputs) => {
    const key = apiKeyInputs[provider];
    console.log(`🔑 APIキー保存: ${provider}`, { keyLength: key.length, hasKey: !!key });
    
    if (provider === 'groqApiKey') {
      console.log('🎯 Groq APIキー詳細保存情報:', {
        keyPreview: key ? `${key.substring(0, 15)}...` : 'なし',
        keyLength: key.length,
        isValidFormat: key.startsWith('gsk_') || key.startsWith('sk-'),
        timestamp: new Date().toISOString()
      });
    }
    
    setApiKey(provider, key);
    
    // 保存確認のため即座に取得してみる
    const savedKey = getApiKey(provider);
    console.log(`✅ APIキー保存確認: ${provider}`, { savedKeyLength: savedKey.length, matches: savedKey === key });
    
    setShowSuccessMessage(`${getProviderName(provider)}のAPIキーを保存しました`);
    setTimeout(() => setShowSuccessMessage(''), 3000);
    
    // APIキー保存後にプロバイダー状態を再確認
    console.log('🔄 プロバイダー状態を再確認中...');
    // 少し待ってから状態を更新（ストアの更新を確実にするため）
    setTimeout(async () => {
      await checkProviderStatus();
    }, 100);
  };

  const getProviderName = (provider: string) => {
    const names: Record<string, string> = {
      groqApiKey: 'Groq',
      geminiApiKey: 'Gemini',
      huggingfaceApiKey: 'HuggingFace',
      togetherApiKey: 'Together AI',
      anthropicApiKey: 'Anthropic',
      openaiApiKey: 'OpenAI'
    };
    return names[provider] || provider;
  };

  const getProviderCapabilities = (provider: string) => {
    const capabilities: Record<string, { meal: boolean; vision: boolean; quality: string }> = {
      groqApiKey: { meal: true, vision: true, quality: 'very-high' },
      geminiApiKey: { meal: true, vision: true, quality: 'very-high' },
      huggingfaceApiKey: { meal: true, vision: true, quality: 'medium' },
      togetherApiKey: { meal: true, vision: false, quality: 'high' },
      anthropicApiKey: { meal: true, vision: true, quality: 'very-high' },
      openaiApiKey: { meal: true, vision: true, quality: 'very-high' }
    };
    return capabilities[provider] || { meal: false, vision: false, quality: 'unknown' };
  };

  const handlePreferredProviderChange = (service: 'mealGeneration' | 'imageRecognition', provider: string) => {
    console.log(`🎯 優先プロバイダー変更: ${service} -> ${provider}`);
    setPreferredProvider(service, provider);
    setPreferredProviders(prev => ({ ...prev, [service]: provider }));
    setShowSuccessMessage(`${service === 'mealGeneration' ? '献立生成' : '画像認識'}の優先プロバイダーを${getProviderName(provider)}に設定しました`);
    setTimeout(() => setShowSuccessMessage(''), 3000);
  };

  const handleExportSettings = () => {
    const settingsJson = exportSettings();
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mobile-kondate-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    setShowSuccessMessage('設定をエクスポートしました');
    setTimeout(() => setShowSuccessMessage(''), 3000);
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const success = importSettings(content);
      if (success) {
        setShowSuccessMessage('設定をインポートしました');
        // インポート後にAPIキーを再読み込み
        setApiKeyInputs({
          groqApiKey: getApiKey('groqApiKey'),
          geminiApiKey: getApiKey('geminiApiKey'),
          huggingfaceApiKey: getApiKey('huggingfaceApiKey'),
          togetherApiKey: getApiKey('togetherApiKey'),
          anthropicApiKey: getApiKey('anthropicApiKey'),
          openaiApiKey: getApiKey('openaiApiKey'),
        });
        await checkProviderStatus();
      } else {
        setShowSuccessMessage('設定のインポートに失敗しました');
      }
      setTimeout(() => setShowSuccessMessage(''), 3000);
    };
    reader.readAsText(file);
  };

  const handleResetSettings = async () => {
    if (confirm('すべての設定をリセットしますか？この操作は元に戻せません。')) {
      resetSettings();
      clearAllKeys();
      setApiKeyInputs({
        groqApiKey: '',
        geminiApiKey: '',
        huggingfaceApiKey: '',
        togetherApiKey: '',
        anthropicApiKey: '',
        openaiApiKey: '',
      });
      setAiProviderStatus(null);
      setShowSuccessMessage('設定をリセットしました');
      setTimeout(() => setShowSuccessMessage(''), 3000);
    }
  };

  // API テスト関数
  const handleTestProvider = async (provider: string, testType: 'connection' | 'meal' | 'vision') => {
    try {
      // APIキーを取得
      const apiKey = getApiKey(provider as any);
      if (!apiKey) {
        return {
          success: false,
          message: 'APIキーが設定されていません',
          responseTime: 0
        };
      }

      switch (testType) {
        case 'connection':
          const result = await testProviderConnection(provider, apiKey);
          return {
            success: result.success,
            message: result.error || (result.success ? '接続成功' : '接続失敗'),
            responseTime: result.responseTime || 0
          };
        case 'meal':
          const mealResult = await testMealGeneration(provider);
          return {
            success: mealResult.success,
            message: mealResult.error || (mealResult.success ? '献立生成成功' : '献立生成失敗'),
            responseTime: 0 // testMealGeneration doesn't return responseTime
          };
        case 'vision':
          const visionResult = await testImageRecognition(provider);
          return {
            success: visionResult.success,
            message: visionResult.error || (visionResult.success ? '画像認識成功' : '画像認識失敗'),
            responseTime: 0 // testImageRecognition doesn't return responseTime
          };
        default:
          throw new Error('不明なテストタイプ');
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'テストに失敗しました'
      };
    }
  };

  // 通知設定更新
  const handleNotificationSettingsUpdate = (newSettings: any) => {
    setNotificationSettings(newSettings);
    updateSettings({ notifications: newSettings.enabled });
  };

  const settingsGroups = [
    {
      title: 'AI プロバイダー設定',
      items: [
        {
          icon: Activity,
          label: 'プロバイダー状態',
          value: aiProviderStatus ? (
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                aiProviderStatus.available ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-sm">
                {aiProviderStatus.available 
                  ? `${aiProviderStatus.providers.mealGeneration + aiProviderStatus.providers.imageRecognition}個有効`
                  : '無効'
                }
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-500" />
              <span className="text-sm">確認中...</span>
            </div>
          ),
          action: () => checkProviderStatus(),
          type: 'button' as const,
        },
        {
          icon: Key,
          label: 'APIキー管理',
          value: `${Object.values(apiKeyInputs).filter(key => key).length}/6 設定済み`,
          action: () => setShowApiKeys(!showApiKeys),
          type: 'button' as const,
        },
        {
          icon: Zap,
          label: 'API接続テスト',
          value: 'プロバイダー動作確認',
          action: () => setShowApiTestPanel(!showApiTestPanel),
          type: 'button' as const,
        },
      ]
    },
    {
      title: 'アプリ設定',
      items: [
        {
          icon: Bell,
          label: 'プッシュ通知',
          value: notifications,
          action: toggleNotifications,
          type: 'toggle' as const,
        },
        {
          icon: Bell,
          label: '通知設定詳細',
          value: '通知カテゴリ・タイミング',
          action: () => setShowNotificationSettings(!showNotificationSettings),
          type: 'button' as const,
        },
        {
          icon: Moon,
          label: 'ダークモード',
          value: darkMode,
          action: toggleDarkMode,
          type: 'toggle' as const,
        },
        {
          icon: Globe,
          label: '言語設定',
          value: language === 'ja' ? '日本語' : 'English',
          action: () => updateSettings({ language: language === 'ja' ? 'en' : 'ja' }),
          type: 'button' as const,
        },
        {
          icon: Database,
          label: 'オフラインモード',
          value: offlineMode,
          action: toggleOfflineMode,
          type: 'toggle' as const,
        },
      ]
    },
    {
      title: 'デフォルト設定',
      items: [
        {
          icon: Package,
          label: '食材在庫管理',
          value: '冷蔵庫の中身を管理',
          action: () => router.push('/inventory'),
          type: 'button' as const,
        },
        {
          icon: Smartphone,
          label: 'デフォルト人数',
          value: `${defaultServings}人分`,
          action: () => {
            const servings = prompt('デフォルトの人数を入力してください', defaultServings.toString());
            if (servings && !isNaN(Number(servings))) {
              updateSettings({ defaultServings: Number(servings) });
            }
          },
          type: 'button' as const,
        },
        {
          icon: Smartphone,
          label: 'デフォルト調理時間',
          value: `${defaultCookingTime}分`,
          action: () => {
            const time = prompt('デフォルトの調理時間を入力してください（分）', defaultCookingTime.toString());
            if (time && !isNaN(Number(time))) {
              updateSettings({ defaultCookingTime: time });
            }
          },
          type: 'button' as const,
        },
      ]
    },
    {
      title: 'データ管理',
      items: [
        {
          icon: Database,
          label: 'キャッシュ管理',
          value: 'ストレージ使用量確認',
          action: () => setShowCacheManager(!showCacheManager),
          type: 'button' as const,
        },
        {
          icon: Download,
          label: '設定をエクスポート',
          value: 'JSON形式で保存',
          action: handleExportSettings,
          type: 'button' as const,
        },
        {
          icon: Upload,
          label: '設定をインポート',
          value: 'JSONファイルから復元',
          action: () => document.getElementById('import-input')?.click(),
          type: 'button' as const,
        },
        {
          icon: RotateCcw,
          label: '設定をリセット',
          value: 'すべて初期化',
          action: handleResetSettings,
          type: 'button' as const,
          danger: true,
        },
      ]
    },
    {
      title: '統計・分析',
      items: [
        {
          icon: Activity,
          label: '使用統計',
          value: 'アプリの利用状況',
          action: () => setShowUsageStats(!showUsageStats),
          type: 'button' as const,
        },
      ]
    },
    {
      title: 'アプリ情報',
      items: [
        {
          icon: Info,
          label: 'バージョン',
          value: '1.2.0',
          type: 'display' as const,
        },
        {
          icon: Shield,
          label: 'プライバシーポリシー',
          value: '',
          action: () => window.open('/privacy', '_blank'),
          type: 'button' as const,
        },
      ]
    }
  ];

  return (
    <MobileLayout title="設定">
      <div className="px-4 py-6 space-y-6">
        {/* 成功メッセージ */}
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-green-800 text-sm">{showSuccessMessage}</span>
          </motion.div>
        )}

        {/* AIプロバイダー詳細状態 */}
        {aiProviderStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                <Cpu className="w-5 h-5" />
                AI機能状態
              </h3>
              <button
                onClick={checkProviderStatus}
                disabled={isCheckingProviders}
                className="text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isCheckingProviders ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-gray-900">献立生成</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {aiProviderStatus.providers.mealGeneration}
                </div>
                <div className="text-xs text-gray-600">プロバイダー利用可能</div>
                {aiProviderStatus.recommendations.mealGeneration && (
                  <div className="mt-2 flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs text-gray-700">
                      推奨: {aiProviderStatus.recommendations.mealGeneration}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-gray-900">画像認識</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {aiProviderStatus.providers.imageRecognition}
                </div>
                <div className="text-xs text-gray-600">プロバイダー利用可能</div>
                {aiProviderStatus.recommendations.imageRecognition && (
                  <div className="mt-2 flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs text-gray-700">
                      推奨: {aiProviderStatus.recommendations.imageRecognition}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-xs text-blue-700">
              {aiProviderStatus.available 
                ? 'AI機能が正常に利用できます'
                : 'APIキーを設定してAI機能を有効にしてください'
              }
            </div>
          </motion.div>
        )}

        {/* APIキー設定パネル */}
        {showApiKeys && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Key className="w-5 h-5" />
                APIキー設定
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                各プロバイダーのAPIキーを設定してAI機能を有効にできます。APIキー保存後、機能別の優先プロバイダーを選択できます。
              </p>
            </div>
            
            <div className="divide-y divide-gray-100">
              {Object.entries(apiKeyInputs).map(([provider, value]) => {
                const capabilities = getProviderCapabilities(provider);
                const isConfigured = !!value;
                
                return (
                  <div key={provider} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          isConfigured ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        <div>
                          <div className="font-medium text-gray-900">
                            {getProviderName(provider)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            {capabilities.meal && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                献立生成
                              </span>
                            )}
                            {capabilities.vision && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                                画像認識
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded ${
                              capabilities.quality === 'very-high' ? 'bg-purple-100 text-purple-700' :
                              capabilities.quality === 'high' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {capabilities.quality === 'very-high' ? '最高品質' :
                               capabilities.quality === 'high' ? '高品質' : '標準品質'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="password"
                        value={value}
                        onChange={(e) => handleApiKeyChange(provider as keyof typeof apiKeyInputs, e.target.value)}
                        placeholder={`${getProviderName(provider)} APIキーを入力`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => handleApiKeySave(provider as keyof typeof apiKeyInputs)}
                        disabled={!value}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                      >
                        保存
                      </button>
                    </div>
                    
                    {/* 優先プロバイダー選択オプション */}
                    {isConfigured && (
                      <div className="mt-3 space-y-2">
                        <div className="text-sm font-medium text-gray-700">このプロバイダーを優先使用する機能:</div>
                        <div className="flex gap-2">
                          {capabilities.meal && (
                            <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                              <input
                                type="radio"
                                name={`${provider}_meal`}
                                checked={preferredProviders.mealGeneration === provider}
                                onChange={() => handlePreferredProviderChange('mealGeneration', provider)}
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium text-gray-700">献立生成</span>
                              <Zap className="w-3 h-3 text-blue-500" />
                            </label>
                          )}
                          {capabilities.vision && (
                            <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                              <input
                                type="radio"
                                name={`${provider}_vision`}
                                checked={preferredProviders.imageRecognition === provider}
                                onChange={() => handlePreferredProviderChange('imageRecognition', provider)}
                                className="text-green-600 focus:ring-green-500"
                              />
                              <span className="text-sm font-medium text-gray-700">画像認識</span>
                              <Eye className="w-3 h-3 text-green-500" />
                            </label>
                          )}
                        </div>
                        
                        {/* 現在の設定表示 */}
                        <div className="text-xs text-gray-500 border-t border-gray-100 pt-2 mt-2">
                          {preferredProviders.mealGeneration === provider && capabilities.meal && (
                            <span className="inline-flex items-center gap-1 mr-3">
                              <Zap className="w-3 h-3 text-blue-500" />
                              献立生成で優先使用中
                            </span>
                          )}
                          {preferredProviders.imageRecognition === provider && capabilities.vision && (
                            <span className="inline-flex items-center gap-1">
                              <Eye className="w-3 h-3 text-green-500" />
                              画像認識で優先使用中
                            </span>
                          )}
                          {preferredProviders.mealGeneration !== provider && preferredProviders.imageRecognition !== provider && (
                            <span className="text-gray-400">優先使用されていません</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <div className="font-medium mb-1">APIキーについて</div>
                  <ul className="text-xs space-y-1">
                    <li>• APIキーはローカルに安全に保存されます</li>
                    <li>• 機能別に優先プロバイダーを指定できます（献立生成・画像認識）</li>
                    <li>• 優先設定がない場合は最適なプロバイダーが自動選択されます</li>
                    <li>• APIキーは暗号化されてブラウザに保存されます</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* API テストパネル */}
        {showApiTestPanel && (
          <ApiTestPanel 
            providers={Object.entries(apiKeyInputs)
              .filter(([_, key]) => key)
              .map(([provider, key]) => ({
                key: provider,
                name: getProviderName(provider),
                hasKey: !!key,
                capabilities: getProviderCapabilities(provider)
              }))}
            onTestProvider={handleTestProvider}
          />
        )}

        {/* 通知設定詳細 */}
        {showNotificationSettings && (
          <NotificationSettings 
            settings={notificationSettings}
            onUpdate={handleNotificationSettingsUpdate}
          />
        )}

        {/* キャッシュ管理 */}
        {showCacheManager && <CacheManager />}

        {/* 使用統計 */}
        {showUsageStats && <UsageStatistics />}

        {/* 設定グループ */}
        {settingsGroups.map((group, groupIndex) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{group.title}</h3>
            </div>
            
            <div className="divide-y divide-gray-100">
              {group.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className={`p-4 flex items-center justify-between ${
                    item.type === 'button' ? 'hover:bg-gray-50 cursor-pointer' : ''
                  } ${(item as any).danger ? 'hover:bg-red-50' : ''}`}
                  onClick={item.type === 'button' ? item.action : undefined}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-5 h-5 ${
                      (item as any).danger ? 'text-red-600' : 'text-gray-600'
                    }`} />
                    <span className={`font-medium ${
                      (item as any).danger ? 'text-red-900' : 'text-gray-900'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {item.type === 'toggle' ? (
                      <button
                        onClick={item.action}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          item.value ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          item.value ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    ) : item.type === 'button' ? (
                      <>
                        <span className="text-sm text-gray-600">{item.value}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </>
                    ) : (
                      <span className="text-sm text-gray-600">{item.value}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* 隠しファイル入力 */}
        <input
          id="import-input"
          type="file"
          accept=".json"
          onChange={handleImportSettings}
          className="hidden"
        />
      </div>
    </MobileLayout>
  );
}
