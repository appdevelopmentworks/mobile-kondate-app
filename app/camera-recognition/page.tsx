'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Sparkles,
  Clock,
  Users,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Settings,
  Eye,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import MobileLayout from '../../components/layout/MobileLayout';
import CameraIngredientRecognition from '../../components/camera/CameraIngredientRecognition';
import { useMealStore } from '../../lib/store';
import {
  IngredientRecognitionResult,
  RecognizedIngredient,
} from '../../lib/types';
import { 
  recognizeIngredients, 
  checkVisionProviderStatus,
  generateMockRecognitionResult 
} from '../../lib/camera/ingredient-recognition';
import { generateMealSuggestion } from '../../lib/meal-generation';

export default function CameraRecognitionPage() {
  const router = useRouter();
  const { resetForm, updateFormData, setGeneratedSuggestion, addToHistory } = useMealStore();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [recognizedIngredients, setRecognizedIngredients] = useState<RecognizedIngredient[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [aiProviderStatus, setAiProviderStatus] = useState<{
    available: boolean;
    providers: Array<{ name: string; hasApiKey: boolean; accuracy: string }>;
    recommended?: string;
  } | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | undefined>();
  const [showProviderSelector, setShowProviderSelector] = useState(false);
  const [lastRecognitionInfo, setLastRecognitionInfo] = useState<{
    provider?: string;
    confidence?: number;
    processingTime?: number;
  }>({});

  // AI プロバイダーの状態を確認
  useEffect(() => {
    const checkProviders = async () => {
      try {
        const status = await checkVisionProviderStatus();
        setAiProviderStatus(status);
        console.log('🔍 ビジョンプロバイダー状態:', status);
        
        if (status.recommended) {
          setSelectedProvider(status.recommended);
          console.log('🎯 推奨プロバイダー:', status.recommended);
        }
      } catch (error) {
        console.error('プロバイダー状態確認エラー:', error);
      }
    };

    checkProviders();
  }, []);

  const handleBack = () => {
    router.push('/');
  };

  const handleOpenCamera = () => {
    setIsCameraOpen(true);
  };

  const handleIngredientsRecognized = useCallback(async (
    ingredientsOrImageData: string[] | string
  ) => {
    setIsProcessing(true);
    
    try {
      let recognitionResult: IngredientRecognitionResult;

      if (Array.isArray(ingredientsOrImageData)) {
        // 従来の文字列配列形式（後方互換性）
        console.log('📝 手動入力モード:', ingredientsOrImageData);
        
        const recognizedItems: RecognizedIngredient[] = ingredientsOrImageData.map((name, index) => ({
          name,
          confidence: 0.9 - index * 0.02,
          category: 'other' as const,
          quantity: '適量',
          freshness: 'fresh' as const,
        }));
        
        recognitionResult = {
          success: true,
          ingredients: recognizedItems,
          confidence: 0.85,
          processingTime: 500,
          provider: '手動入力',
        };
      } else {
        // 画像データの場合、AI認識を実行
        console.log('🔍 AI画像認識開始:', { 
          provider: selectedProvider || 'auto',
          imageSize: ingredientsOrImageData.length,
          providersAvailable: aiProviderStatus?.providers.length || 0
        });

        // プロバイダー名をAPIキー名に変換
        const providerMap: Record<string, string> = {
          'OpenAI': 'openaiApiKey',
          'Anthropic': 'anthropicApiKey',
          'Gemini': 'geminiApiKey',
          'Together AI': 'togetherApiKey',
          'HuggingFace': 'huggingfaceApiKey',
        };

        const preferredProvider = selectedProvider ? providerMap[selectedProvider] : undefined;
        recognitionResult = await recognizeIngredients(ingredientsOrImageData, preferredProvider);
      }

      console.log('✅ 食材認識完了:', {
        success: recognitionResult.success,
        ingredientCount: recognitionResult.ingredients.length,
        provider: recognitionResult.provider,
        confidence: recognitionResult.confidence,
        processingTime: recognitionResult.processingTime,
        ingredients: recognitionResult.ingredients.map(i => `${i.name}(${(i.confidence * 100).toFixed(1)}%)`)
      });

      // 認識情報を保存
      setLastRecognitionInfo({
        provider: recognitionResult.provider,
        confidence: recognitionResult.confidence,
        processingTime: recognitionResult.processingTime,
      });

      // 既存の食材リストに追加（重複除去）
      setRecognizedIngredients(prevIngredients => {
        const existingNames = prevIngredients.map(item => item.name.toLowerCase());
        const newIngredients = recognitionResult.ingredients.filter(
          item => !existingNames.includes(item.name.toLowerCase())
        );
        
        if (newIngredients.length > 0) {
          const totalAfterAdd = prevIngredients.length + newIngredients.length;
          const duplicateCount = recognitionResult.ingredients.length - newIngredients.length;
          
          console.log(`📋 ${newIngredients.length}個の新しい食材を追加:`, {
            added: newIngredients.map(item => item.name),
            totalCount: totalAfterAdd,
            duplicateCount
          });
        } else {
          console.log('ℹ️ 認識した食材はすべて既にリストにあります');
        }
        
        return [...prevIngredients, ...newIngredients];
      });
      
      setShowResult(true);
      setIsCameraOpen(false);

    } catch (error) {
      console.error('❌ 食材認識エラー:', error);
      
      // エラー時はモックデータを使用
      const fallbackResult = generateMockRecognitionResult();
      setRecognizedIngredients(fallbackResult.ingredients);
      setLastRecognitionInfo({
        provider: fallbackResult.provider,
        confidence: fallbackResult.confidence,
        processingTime: fallbackResult.processingTime,
      });
      setShowResult(true);
      setIsCameraOpen(false);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedProvider, aiProviderStatus]);

  const handleGenerateMeal = async () => {
    if (recognizedIngredients.length === 0) {
      alert('食材が認識されていません。カメラで食材を撮影してください。');
      return;
    }

    try {
      setIsProcessing(true);
      console.log('🚀 [カメラ認識] AI献立生成開始:', recognizedIngredients.map(item => item.name));
      
      // 認識した食材をストアに設定
      const ingredientNames = recognizedIngredients.map(item => item.name);
      
      // フォームデータをリセットして認識した食材を設定
      resetForm();
      updateFormData({
        ingredients: ingredientNames,
        servings: 2,
        cookingTime: '30',
        mealType: 'dinner',
        difficulty: 'easy'
      });

      console.log('✅ [カメラ認識] 認識食材でフォームデータ設定完了:', {
        ingredients: ingredientNames,
        count: ingredientNames.length
      });
      
      // AI献立生成を実行
      const mealPreferences = {
        ingredients: ingredientNames,
        servings: 2,
        cookingTime: '30', // 文字列形式
        mealType: 'dinner' as const,
        avoidIngredients: [],
        allergies: [],
        nutritionBalance: 'balanced' as const,
        difficulty: 'easy' as const,
        dishCount: 3,
        budget: 'standard' as const,
      };

      console.log('🍴 [カメラ認識] AI献立生成リクエスト:', mealPreferences);
      
      // 実際のAI生成を実行 - より強力なキャッシュバスティング付き
      const uniqueTimestamp = Date.now();
      const randomSeed = Math.floor(Math.random() * 10000);
      const requestId = `camera-${uniqueTimestamp}-${randomSeed}`;
      
      const enhancedMealPreferences = {
        ...mealPreferences,
        avoidIngredients: [
          ...mealPreferences.avoidIngredients,
          `カメラ認識による生成 ${requestId}`,
          `時刻${uniqueTimestamp}の新しい発想で`,
          `ランダムシード${randomSeed}`,
          '前回とは全く違うレシピで',
          'カメラ認識食材を活用した創作料理',
          `生成時刻: ${new Date().toISOString()}`,
          '毎回異なる料理を提案してください'
        ],
      };
      
      const result = await generateMealSuggestion(enhancedMealPreferences);
      
      if (result.success && result.suggestion) {
        console.log('✅ [カメラ認識] AI献立生成成功！');
        
        // カメラ認識由来の献立であることを明示
        result.suggestion.title = `📷 ${result.suggestion.title}`;
        result.suggestion.description = `カメラで認識した食材から生成: ${result.suggestion.description}`;
        
        // 生成された献立をストアに設定
        setGeneratedSuggestion(result.suggestion);
        addToHistory(result.suggestion);
        
        // 結果ページに遷移
        router.push('/result');
      } else {
        console.warn('⚠️ [カメラ認識] AI生成失敗、通常フローで処理:', result.error);
        // 結果ページでAI生成を再試行
        router.push('/result');
      }
      
    } catch (error) {
      console.error('❌ [カメラ認識] 献立生成エラー:', error);
      // エラーが発生しても結果ページで再試行
      router.push('/result');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickMeal = () => {
    // 認識した食材をフォームデータに設定
    resetForm();
    updateFormData({ 
      ingredients: recognizedIngredients.map(item => item.name)
    });
    
    // おまかせ献立フォームに遷移
    router.push('/meal-form/quick');
  };

  const handleAddIngredients = () => {
    // 認識した食材を食材選択ページに送る
    if (recognizedIngredients.length > 0) {
      const ingredientNames = recognizedIngredients.map(item => item.name);
      const ingredientsParam = encodeURIComponent(ingredientNames.join(','));
      router.push(`/ingredients?ingredients=${ingredientsParam}`);
    }
  };

  const handleClearIngredients = () => {
    setRecognizedIngredients([]);
    setShowResult(false);
    setLastRecognitionInfo({});
  };

  const handleProviderChange = (providerName: string) => {
    setSelectedProvider(providerName);
    setShowProviderSelector(false);
    console.log('🔄 プロバイダー変更:', providerName);
  };

  return (
    <MobileLayout title="食材認識" showBack={true} onBack={handleBack}>
      <div className="px-4 py-6">
        {/* プロバイダー選択パネル */}
        {aiProviderStatus && aiProviderStatus.available && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-blue-900 flex items-center">
                <Cpu className="w-4 h-4 mr-2" />
                AI認識プロバイダー
              </h3>
              <button
                onClick={() => setShowProviderSelector(!showProviderSelector)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
            
            <div className="text-sm text-blue-700">
              使用中: <span className="font-medium">{selectedProvider || 'Auto'}</span>
              {lastRecognitionInfo.confidence && (
                <span className="ml-2 text-blue-600">
                  (信頼度: {(lastRecognitionInfo.confidence * 100).toFixed(1)}%)
                </span>
              )}
            </div>
            
            {showProviderSelector && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 space-y-2"
              >
                {aiProviderStatus.providers.map((provider, index) => (
                  <button
                    key={provider.name}
                    onClick={() => handleProviderChange(provider.name)}
                    className={`w-full text-left p-2 rounded border transition-colors ${
                      selectedProvider === provider.name
                        ? 'bg-blue-100 border-blue-300 text-blue-900'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{provider.name}</span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                        精度: {provider.accuracy}
                      </span>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* メインコンテンツ */}
        <AnimatePresence mode="wait">
          {!showResult ? (
            // カメラ起動前の画面
            <motion.div
              key="camera-intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="mb-8">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-12 h-12 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  食材を撮影しよう
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  冷蔵庫の中や食材をカメラで撮影すると、
                  <br />
                  AIが自動で食材を認識します
                </p>
              </div>

              {/* 使い方の説明 */}
              <div className="bg-gray-50 rounded-lg p-4 mb-8 text-left">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-gray-600" />
                  使い方のコツ
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    食材を明るい場所で撮影してください
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    複数の食材を一度に撮影できます
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    ピントを合わせてブレないように注意
                  </li>
                </ul>
              </div>

              <button
                onClick={handleOpenCamera}
                disabled={isProcessing}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    AI認識中...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 mr-2" />
                    カメラを起動
                  </>
                )}
              </button>

              {!aiProviderStatus?.available && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center text-yellow-800 text-sm">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    AIプロバイダーが設定されていません。サンプル認識を使用します。
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            // 認識結果表示画面
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* 認識完了ヘッダー */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-lg">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {recognizedIngredients.length}個の食材を認識しました
                  </h2>
                  <p className="text-orange-600 font-medium flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    シンプルで美味しい料理が作れます！
                  </p>
                  <p className="text-gray-600 text-sm mt-2">以下のオプションから選んでください</p>
                </div>
                
                {/* 認識情報 */}
                {lastRecognitionInfo.provider && (
                  <div className="text-center text-xs text-gray-500 border-t border-gray-100 pt-3 mt-3">
                    {lastRecognitionInfo.provider} • {lastRecognitionInfo.processingTime}ms
                    {lastRecognitionInfo.confidence && (
                      <> • 信頼度: {(lastRecognitionInfo.confidence * 100).toFixed(1)}%</>
                    )}
                  </div>
                )}
              </div>

              {/* ステップ進行表示 */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 mb-6 shadow-lg">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div className="w-12 h-0.5 bg-gray-300"></div>
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div className="w-12 h-0.5 bg-gray-300"></div>
                  <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                </div>
                <h3 className="text-center font-semibold text-gray-900 mb-1">
                  ステップ2: 次のアクションを選択
                </h3>
                <p className="text-center text-sm text-gray-600">
                  📝 {recognizedIngredients.length}個の食材を認識完了！どう活用しますか？
                </p>
              </div>

              {/* 認識された食材リスト */}
              <div className="bg-white rounded-lg border border-gray-200 mb-6">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 flex items-center justify-between">
                    認識された食材
                    <button
                      onClick={handleClearIngredients}
                      className="text-sm text-red-600 hover:text-red-800 transition-colors"
                    >
                      クリア
                    </button>
                  </h3>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {recognizedIngredients.map((ingredient, index) => (
                      <motion.div
                        key={`${ingredient.name}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-blue-600 font-semibold text-sm">
                              {ingredient.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {ingredient.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {ingredient.quantity} • 信頼度: {(ingredient.confidence * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            ingredient.freshness === 'fresh' ? 'bg-green-100 text-green-700' :
                            ingredient.freshness === 'good' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {ingredient.freshness === 'fresh' ? '新鮮' :
                             ingredient.freshness === 'good' ? '良好' : '要注意'}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="space-y-3">
                {/* メイングリッド - 2x2レイアウト */}
                <div className="grid grid-cols-2 gap-3">
                  {/* 条件指定で献立作成 */}
                  <button
                    onClick={handleAddIngredients}
                    disabled={recognizedIngredients.length === 0}
                    className="bg-green-500 text-white py-6 px-4 rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-2"
                  >
                    <Sparkles className="w-6 h-6" />
                    <div className="text-center">
                      <div className="font-semibold">条件指定で</div>
                      <div className="font-semibold">献立作成</div>
                      <div className="text-xs opacity-90 mt-1">詳細設定可能</div>
                    </div>
                  </button>

                  {/* おまかせで即座に作成 */}
                  <button
                    onClick={handleGenerateMeal}
                    disabled={isProcessing || recognizedIngredients.length === 0}
                    className="bg-blue-500 text-white py-6 px-4 rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-2 relative"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-6 h-6 animate-spin" />
                        <div className="text-center">
                          <div className="font-semibold">生成中...</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-6 h-6" />
                        <div className="text-center">
                          <div className="font-semibold">おまかせで</div>
                          <div className="font-semibold">即座に作成</div>
                          <div className="text-xs opacity-90 mt-1">ワンクリック</div>
                        </div>
                        <div className="absolute top-2 right-2 bg-orange-400 text-white text-xs px-2 py-1 rounded-full">
                          推奨
                        </div>
                      </>
                    )}
                  </button>
                </div>

                {/* サブアクション */}
                <div className="grid grid-cols-2 gap-3">
                  {/* 編集・追加 */}
                  <button
                    onClick={handleOpenCamera}
                    className="bg-orange-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    <span>編集・追加</span>
                  </button>

                  {/* 保存 */}
                  <button
                    onClick={handleQuickMeal}
                    disabled={recognizedIngredients.length === 0}
                    className="bg-purple-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>保存</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* カメラコンポーネント */}
        <AnimatePresence>
          {isCameraOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black"
            >
              <CameraIngredientRecognition
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onIngredientsRecognized={handleIngredientsRecognized}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}
