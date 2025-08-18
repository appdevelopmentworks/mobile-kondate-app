'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  Sparkles,
  Clock,
  Users,
  ChevronRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import MobileLayout from '../../components/layout/MobileLayout';
import CameraIngredientRecognition from '../../components/camera/CameraIngredientRecognition';
import { useMealStore } from '../../lib/store';
import {
  IngredientRecognitionResult,
  RecognizedIngredient,
} from '../../lib/types';
import { generateMockRecognitionResult, recognizeIngredients } from '../../lib/camera/ingredient-recognition';

export default function CameraRecognitionPage() {
  const router = useRouter();
  const { resetForm, updateFormData } = useMealStore();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [recognizedIngredients, setRecognizedIngredients] = useState<RecognizedIngredient[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleBack = () => {
    router.push('/');
  };

  const handleOpenCamera = () => {
    setIsCameraOpen(true);
  };

  const handleIngredientsRecognized = useCallback((ingredients: string[]) => {
    // 文字列の配列をRecognizedIngredient配列に変換
    const recognizedItems: RecognizedIngredient[] = ingredients.map((name, index) => ({
      name,
      confidence: 0.9 - index * 0.02, // 順序に応じて信頼度を調整
      category: 'other' as const,
      quantity: '適量',
      freshness: 'fresh' as const,
    }));
    
    // 既存の食材リストに追加（重複除去）
    setRecognizedIngredients(prevIngredients => {
      const existingNames = prevIngredients.map(item => item.name.toLowerCase());
      const newIngredients = recognizedItems.filter(
        item => !existingNames.includes(item.name.toLowerCase())
      );
      
      // コンソールログのみでアラートなし
      if (newIngredients.length > 0) {
        const totalAfterAdd = prevIngredients.length + newIngredients.length;
        const duplicateCount = recognizedItems.length - newIngredients.length;
        
        console.log(`✅ ${newIngredients.length}個の新しい食材を追加しました！`, {
          added: newIngredients.map(item => item.name),
          totalCount: totalAfterAdd,
          duplicateCount
        });
      } else {
        console.log(`ℹ️ 認識した食材はすべて既にリストにあります`, {
          totalCount: prevIngredients.length
        });
      }
      
      return [...prevIngredients, ...newIngredients];
    });
    
    setShowResult(true);
  }, []);

  const handleGenerateMeal = () => {
    // 認識した食材をフォームデータに設定
    resetForm();
    updateFormData({ 
      ingredients: recognizedIngredients.map(item => item.name)
    });
    
    // 献立生成フォームに遷移
    router.push('/meal-form');
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

  const handleEditIngredients = () => {
    // 認識した食材をフォームデータに設定
    resetForm();
    updateFormData({ 
      ingredients: recognizedIngredients.map(item => item.name)
    });
    
    // 食材編集できるフォームに遷移
    router.push('/meal-form?edit=ingredients');
  };

  const handleSaveIngredients = () => {
    // 認識した食材を保存
    const savedIngredients = {
      timestamp: new Date().toISOString(),
      ingredients: recognizedIngredients,
      source: 'camera_recognition',
      id: Date.now().toString()
    };
    
    try {
      // ローカルストレージが利用可能かチェック
      if (typeof window !== 'undefined' && window.localStorage) {
        const existingSaved = JSON.parse(localStorage.getItem('savedIngredientLists') || '[]');
        existingSaved.push(savedIngredients);
        
        // 古いデータを制限（最大20件）
        if (existingSaved.length > 20) {
          existingSaved.splice(0, existingSaved.length - 20);
        }
        
        localStorage.setItem('savedIngredientLists', JSON.stringify(existingSaved));
        
        // コンソールログのみでアラートなし
        console.log('🎉 食材リストを保存しました:', savedIngredients);
      } else {
        // ローカルストレージが利用できない場合
        console.warn('ローカルストレージが利用できません');
      }
    } catch (error) {
      console.error('保存エラー:', error);
    }
  };

  const handleAddIngredients = () => {
    // 認識した食材をメイン食材リストに追加
    const ingredientNames = recognizedIngredients.map(item => item.name);
    
    // グローバル状態やローカルストレージに保存
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const existingIngredients = JSON.parse(localStorage.getItem('mainIngredientList') || '[]');
        const combinedIngredients = [...existingIngredients, ...ingredientNames];
        
        // 重複除去
        const uniqueIngredients = Array.from(new Set(combinedIngredients));
        
        localStorage.setItem('mainIngredientList', JSON.stringify(uniqueIngredients));
        
        // コンソールログのみでアラートなし
        console.log('✅ 食材をメインリストに追加:', {
          added: ingredientNames,
          totalCount: uniqueIngredients.length
        });
      } else {
        console.warn('ローカルストレージが利用できません');
      }
    } catch (error) {
      console.error('食材追加エラー:', error);
    }
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  const handleRetry = () => {
    setRecognizedIngredients([]);
    setShowResult(false);
    setIsCameraOpen(true);
  };

  const handleDemoRecognition = async () => {
    setIsProcessing(true);
    
    try {
      console.log('🎭 デモ機能: Groq APIで実際の食材認識をテスト中...');
      
      // テスト用のサンプル从翴集を作成 (シンプルな食材の絵)
      const testImageBase64 = await createTestFoodImage();
      
      if (testImageBase64) {
        // 実際にGroq APIで認識を実行
        const result = await recognizeIngredients(testImageBase64);
        
        if (result.success && result.ingredients.length > 0) {
          setRecognizedIngredients(result.ingredients);
        } else {
          // APIが失敗した場合はモックデータを使用
          console.log('🎭 APIテスト失敗、モックデータを使用');
          const mockResult = generateMockRecognitionResult();
          setRecognizedIngredients(mockResult.ingredients);
        }
      } else {
        // テスト画像作成失敗の場合はモックデータを使用
        console.log('🎭 テスト画像作成失敗、モックデータを使用');
        const mockResult = generateMockRecognitionResult();
        setRecognizedIngredients(mockResult.ingredients);
      }
      
      setShowResult(true);
    } catch (error) {
      console.error('🎭 デモ認識エラー:', error);
      // エラー時はモックデータを使用
      const mockResult = generateMockRecognitionResult();
      setRecognizedIngredients(mockResult.ingredients);
      setShowResult(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // テスト用の食材画像を作成
  const createTestFoodImage = async (): Promise<string | null> => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      canvas.width = 400;
      canvas.height = 300;
      
      // 背景を白に
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // シンプルな食材の絵を描画
      // トマト(赤い丸)
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(120, 100, 40, 0, 2 * Math.PI);
      ctx.fill();
      
      // タマネギ(黄色い丸)
      ctx.fillStyle = '#ffd93d';
      ctx.beginPath();
      ctx.arc(280, 100, 35, 0, 2 * Math.PI);
      ctx.fill();
      
      // ニンジン(オレンジの長方形)
      ctx.fillStyle = '#ff8c42';
      ctx.fillRect(80, 180, 80, 20);
      
      // キャベツ(緑の丸)
      ctx.fillStyle = '#51cf66';
      ctx.beginPath();
      ctx.arc(280, 200, 30, 0, 2 * Math.PI);
      ctx.fill();
      
      // 文字で食材名を追加
      ctx.fillStyle = '#333333';
      ctx.font = '16px Arial';
      ctx.fillText('トマト', 90, 160);
      ctx.fillText('タマネギ', 250, 160);
      ctx.fillText('ニンジン', 90, 250);
      ctx.fillText('キャベツ', 250, 250);
      
      // base64で出力
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const base64 = dataUrl.split(',')[1];
      
      console.log('🎨 テスト画像作成成功:', {
        size: `${canvas.width}x${canvas.height}`,
        dataSize: `${base64.length} chars`
      });
      
      return base64;
    } catch (error) {
      console.error('🎨 テスト画像作成エラー:', error);
      return null;
    }
  };

  return (
    <MobileLayout 
      title="カメラで食材認識" 
      showBack={true} 
      onBack={handleBack}
      showBottomNav={false}
    >
      <div className="px-4 py-6 space-y-6 pb-safe">
        {!showResult ? (
          /* 初期画面 */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* ヘッダー */}
            <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="text-6xl mb-4">📸</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                食材を認識して献立提案
              </h1>
              <p className="text-gray-600 text-sm">
                カメラで撮影した食材から最適な献立を提案します
              </p>
            </div>

            {/* 使い方説明 */}
            <div className="bg-blue-50/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
              <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                使い方
              </h3>
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex items-start gap-2">
                  <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                  <span>食材を明るい場所に置いて撮影してください</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                  <span>Groq APIのmeta-llamaモデルが食材を認識します</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                  <span>認識した食材から献立を提案します</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-purple-200 text-purple-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">!</span>
                  <span className="text-purple-700">「Groq APIテスト」で実際のAI認識を体験できます</span>
                </div>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="space-y-4">
              <button
                onClick={handleOpenCamera}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg active:scale-95 transition-all duration-200"
              >
                <div className="flex items-center justify-center gap-3">
                  <Camera className="w-6 h-6" />
                  <span className="text-xl font-bold">カメラで撮影</span>
                </div>
                <p className="text-white/90 text-sm mt-2">
                  食材を撮影して認識開始
                </p>
              </button>

              <button
                onClick={handleDemoRecognition}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white p-4 rounded-2xl shadow-lg active:scale-95 transition-all duration-200 disabled:opacity-50"
              >
                <div className="flex items-center justify-center gap-2">
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Groq API認識中...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Groq APIテスト</span>
                    </>
                  )}
                </div>
                {!isProcessing && (
                  <p className="text-white/80 text-xs mt-1">
                    実際のGroq APIで食材認識をテスト
                  </p>
                )}
              </button>
            </div>

            {/* 注意事項 */}
            <div className="bg-yellow-50/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">ご注意</p>
                  <ul className="space-y-1 text-xs">
                    <li>• 明るい場所で撮影してください</li>
                    <li>• 食材が明確に写るようにしてください</li>
                    <li>• 認識精度は食材や環境により変わります</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* 認識結果画面 */
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* 結果ヘッダー */}
              <div className="text-center bg-green-50/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg relative z-10">
                <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
                <h2 className="text-lg font-bold text-gray-800 mb-1">
                  {recognizedIngredients.length >= 10 ? 'たくさんの' : recognizedIngredients.length}個の食材を認識しました
                </h2>
                
                {/* 食材数に応じたメッセージ */}
                {recognizedIngredients.length >= 8 ? (
                  <div className="mb-2">
                    <p className="text-green-700 text-sm font-medium">🎉 豊富な食材で素晴らしい献立が作れそうです！</p>
                    <p className="text-gray-600 text-xs">スクロールして全ての食材を確認してください</p>
                  </div>
                ) : recognizedIngredients.length >= 5 ? (
                  <div className="mb-2">
                    <p className="text-green-700 text-sm font-medium">🍳 ちょうど良い量の食材ですね！</p>
                    <p className="text-gray-600 text-xs">以下のオプションから選んでください</p>
                  </div>
                ) : (
                  <div className="mb-2">
                    <p className="text-green-700 text-sm font-medium">✨ シンプルで美味しい料理が作れます！</p>
                    <p className="text-gray-600 text-xs">以下のオプションから選んでください</p>
                  </div>
                )}
                
                <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
                  <span>🚀 即座に作成</span>
                  <span>•</span>
                  <span>✏️ 編集・追加</span>
                  <span>•</span>
                  <span>💾 保存</span>
                </div>
              </div>

              {/* 認識された食材リスト（スクロール対応） */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden relative z-10">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800 flex items-center justify-between">
                    <span>認識した食材</span>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {recognizedIngredients.length}件
                    </span>
                  </h3>
                </div>
                
                {/* スクロール可能な食材リスト */}
                <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div className="p-4 space-y-3">
                    {recognizedIngredients.map((ingredient, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors touch-manipulation"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">
                            {ingredient.category === 'vegetable' ? '🥬' :
                             ingredient.category === 'meat' ? '🥩' :
                             ingredient.category === 'fish' ? '🐟' :
                             ingredient.category === 'dairy' ? '🥛' :
                             ingredient.category === 'grain' ? '🌾' : '🍽️'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-800 truncate">{ingredient.name}</p>
                            {ingredient.quantity && (
                              <p className="text-xs text-gray-600">{ingredient.quantity}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs text-gray-500 block">
                            {Math.round(ingredient.confidence * 100)}%
                          </span>
                          {ingredient.freshness === 'fresh' && (
                            <div className="text-xs text-green-600">新鮮</div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* スクロールヒント */}
                {recognizedIngredients.length > 4 && (
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-100">
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex items-center gap-1 text-blue-600">
                        <span className="text-sm animate-bounce">↕️</span>
                        <span className="text-xs font-medium">スクロールして全て確認</span>
                      </div>
                      <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                        {recognizedIngredients.length > 8 ? '多数の食材' : `${recognizedIngredients.length}件`}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 推定調理情報（コンパクト版） */}
              <div className="bg-blue-50/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg relative z-10">
                <h3 className="font-semibold text-blue-800 mb-2 text-sm">調理情報</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/70 rounded-lg p-2">
                    <Clock className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs text-blue-800">調理時間</p>
                    <p className="text-xs font-bold text-blue-900">30-45分</p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-2">
                    <Users className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs text-blue-800">推奨人数</p>
                    <p className="text-xs font-bold text-blue-900">2-3人分</p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-2">
                    <Sparkles className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs text-blue-800">料理数</p>
                    <p className="text-xs font-bold text-blue-900">3-4品</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 固定ナビゲーションバー */}
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl p-4 space-y-3 shadow-lg relative z-20">
              {/* プログレス表示 */}
              <div className="flex items-center justify-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="w-8 h-0.5 bg-green-500 rounded-full"></div>
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div className="w-8 h-0.5 bg-gray-300"></div>
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-xs font-bold">3</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center mb-3">
                <p className="text-sm font-bold text-gray-800">ステップ 2: 次のアクションを選択</p>
                <p className="text-xs text-gray-500">🎉 {recognizedIngredients.length}個の食材を認識完了！どう活用しますか？</p>
                
                {/* 食材を追加ボタン */}
                <div className="mt-3 mb-4">
                  <button
                    onClick={handleAddIngredients}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-bold transition-all duration-200 active:scale-95 shadow-lg border-2 border-transparent hover:border-green-300"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      <span>食材を追加 ({recognizedIngredients.length}個)</span>
                    </div>
                    <div className="text-xs text-white/80 mt-1">
                      メイン食材リストに追加して保存
                    </div>
                  </button>
                </div>
                
                {/* クイックアクションヒント */}
                <div className="mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-700">
                    ⚡ おすすめ: 「おまかせで即座に作成」で素早く献立を取得
                  </p>
                </div>
              </div>

              {/* メイン遷移ボタン */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleGenerateMeal}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl shadow-lg active:scale-95 transition-all duration-200 border-2 border-transparent hover:border-green-300"
                >
                  <div className="flex flex-col items-center gap-1">
                    <Sparkles className="w-6 h-6" />
                    <span className="text-xs font-bold">条件指定で</span>
                    <span className="text-xs font-bold">献立作成</span>
                  </div>
                  <div className="text-xs text-white/80 mt-1">詳細設定可能</div>
                </button>

                <button
                  onClick={handleQuickMeal}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 rounded-xl shadow-lg active:scale-95 transition-all duration-200 border-2 border-transparent hover:border-blue-300 relative overflow-hidden"
                >
                  <div className="flex flex-col items-center gap-1">
                    <ChevronRight className="w-6 h-6" />
                    <span className="text-xs font-bold">おまかせで</span>
                    <span className="text-xs font-bold">即座に作成</span>
                  </div>
                  <div className="text-xs text-white/80 mt-1">ワンクリック</div>
                  
                  {/* おすすめバッジ */}
                  <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full font-bold">
                    推奨
                  </div>
                </button>
              </div>

              {/* サブ機能ボタン */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleEditIngredients}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-2 rounded-lg shadow-lg active:scale-95 transition-all duration-200"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-sm">✏️</span>
                      <span className="text-xs font-medium">編集・追加</span>
                    </div>
                  </button>

                  <button
                    onClick={handleSaveIngredients}
                    className="bg-gradient-to-r from-purple-500 to-violet-500 text-white p-2 rounded-lg shadow-lg active:scale-95 transition-all duration-200"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-sm">💾</span>
                      <span className="text-xs font-medium">保存</span>
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleRetry}
                    className="bg-white/90 backdrop-blur-sm text-gray-700 p-2 rounded-lg shadow-lg active:scale-95 transition-all duration-200 border border-gray-200"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Camera className="w-3 h-3" />
                      <span className="text-xs">再度撮影</span>
                    </div>
                  </button>

                  <button
                    onClick={handleBackToHome}
                    className="bg-gray-100 text-gray-700 p-2 rounded-lg shadow-lg active:scale-95 transition-all duration-200"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <ArrowLeft className="w-3 h-3" />
                      <span className="text-xs">ホームに戻る</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* カメラ認識モーダル */}
      <CameraIngredientRecognition
        isOpen={isCameraOpen}
        onIngredientsRecognized={handleIngredientsRecognized}
        onClose={() => setIsCameraOpen(false)}
      />
    </MobileLayout>
  );
}
