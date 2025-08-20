'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileLayout from '../../../components/layout/MobileLayout';
import { useMealStore } from '../../../lib/store';
import { generateMealSuggestion, checkMealGenerationStatus } from '../../../lib/meal-generation';
import { useApiKeyStore } from '../../../lib/settings-store';
import { sampleRecipes } from '../../../lib/sample-data';
import type { MealSuggestion, Recipe } from '../../../lib/types';
import { 
  Sparkles, 
  Clock, 
  Users, 
  Heart,
  Loader2,
  Sun,
  Moon,
  Sunrise,
  ChefHat
} from 'lucide-react';

interface QuickPreferences {
  mealType: '朝食' | '昼食' | '夕食' | 'auto';
  servings: number;
  dietaryRestrictions: string[];
  preferredStyle: '和食' | '洋食' | '中華' | 'mixed';
}

// 献立のバリエーションパターンを定義
const quickMealPatterns = {
  朝食: [
    [1], // 鮭の塩焼きのみ
    [1, 2], // 鮭の塩焼き + 味噌汁
  ],
  昼食: [
    [4], // 親子丼のみ
    [4, 3], // 親子丼 + ほうれん草のお浸し
  ],
  夕食: [
    [0, 3, 2], // 肉じゃが + ほうれん草のお浸し + 味噌汁
    [4, 3, 2], // 親子丼 + ほうれん草のお浸し + 味噌汁
    [1, 0, 2], // 鮭の塩焼き + 肉じゃが + 味噌汁
  ],
};

export default function QuickMealPage() {
  const router = useRouter();
  const { addToHistory, setGeneratedSuggestion } = useMealStore();
  const { getApiKey, getPreferredProvider } = useApiKeyStore();
  const [preferences, setPreferences] = useState<QuickPreferences>({
    mealType: 'auto',
    servings: 2,
    dietaryRestrictions: [],
    preferredStyle: '和食'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<{
    groqApiAvailable: boolean;
    status: 'ready' | 'api-only' | 'mock-only';
    message: string;
  } | null>(null);

  // コンポーネントマウント時にAPI状態をチェック
  React.useEffect(() => {
    const checkAPIStatus = async () => {
      const status = await checkMealGenerationStatus();
      setApiStatus(status);
      
      // 詳細なAPIキー状態確認
      const availableKeys = {
        groq: getApiKey('groqApiKey'),
        gemini: getApiKey('geminiApiKey'),
        openai: getApiKey('openaiApiKey'),
        anthropic: getApiKey('anthropicApiKey'),
        huggingface: getApiKey('huggingfaceApiKey'),
        together: getApiKey('togetherApiKey'),
      };
      
      const preferredProvider = getPreferredProvider('mealGeneration');
      
      console.log('🔍 [おまかせ献立] APIキー状態チェック:', {
        status,
        availableKeys: Object.entries(availableKeys).reduce((acc, [key, val]) => {
          acc[key] = !!val ? `設定済み(${val.length}文字)` : '未設定';
          return acc;
        }, {} as Record<string, string>),
        preferredProvider: preferredProvider || 'auto',
        timestamp: new Date().toISOString()
      });
    };
    
    checkAPIStatus();
  }, [getApiKey, getPreferredProvider]);

  const mealTypeOptions = [
    { value: 'auto' as const, label: '自動選択', icon: Sparkles, description: '時間に応じて自動で選択' },
    { value: '朝食' as const, label: '朝食', icon: Sunrise, description: '朝の時間にピッタリ' },
    { value: '昼食' as const, label: '昼食', icon: Sun, description: 'お昼の時間にピッタリ' },
    { value: '夕食' as const, label: '夕食', icon: Moon, description: '夜の時間にピッタリ' }
  ];

  const servingOptions = [1, 2, 3, 4, 5, 6];

  const dietaryOptions = [
    { value: 'vegetarian', label: 'ベジタリアン', emoji: '🥬' },
    { value: 'no-seafood', label: '魚介類なし', emoji: '🚫🐟' },
    { value: 'low-salt', label: '減塩', emoji: '🧂' },
    { value: 'low-calorie', label: 'ヘルシー', emoji: '🥗' }
  ];

  const styleOptions = [
    { value: '和食' as const, label: '和食', emoji: '🍱', description: '日本の伝統的な料理' },
    { value: '洋食' as const, label: '洋食', emoji: '🍝', description: '西洋風の料理' },
    { value: '中華' as const, label: '中華', emoji: '🥢', description: '中国風の料理' },
    { value: 'mixed' as const, label: 'ミックス', emoji: '🌍', description: '様々な国の料理' }
  ];

  const handleDietaryRestrictionToggle = (restriction: string) => {
    setPreferences(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction]
    }));
  };

  // スタイルに応じた食材を推定する関数
  const generateStyleBasedIngredients = (style: '和食' | '洋食' | '中華' | 'mixed', mealType: '朝食' | '昼食' | '夕食'): string[] => {
    const styleIngredients = {
      '和食': {
        '朝食': ['米', '味器汁', '無地', 'のり', '卵', '納豆', 'しゃけ', 'キュウリ'],
        '昼食': ['うどん', 'てんぷら', '麏肉', 'ネギ', 'しいたけ', 'うどんつゆ', '七味唐进子'],
        '夕食': ['米', '鯛', 'だいこん', 'しょうゆ', 'しょうが', 'キャベツ', 'ニンジン', 'じゃがいも']
      },
      '洋食': {
        '朝食': ['パン', '卵', 'ベーコン', 'トマト', 'レタス', 'バター', '牛乳', 'ジャム'],
        '昼食': ['パスタ', '鶏胸肉', 'トマトソース', 'オリーブオイル', 'ニンニク', 'バジル', 'チーズ'],
        '夕食': ['牛肉', 'じゃがいも', 'ニンジン', 'タマネギ', 'マッシュルーム', 'ワイン', 'バター']
      },
      '中華': {
        '朝食': ['お粥', '卵', '青菜', 'ザーサイ', 'しょうが', 'ごま油', '青ねぎ'],
        '昼食': ['ラーメン', 'チャーシュー', '豚肉', 'キャベツ', 'にんにく', 'もやし', 'めんま'],
        '夕食': ['鯛肉', 'ピーマン', 'タケノコ', 'ニンジン', 'しょうゆ', 'おいすたーソース', 'ひき肉']
      },
      'mixed': {
        '朝食': ['卵', 'パン', '米', '野菜', '果物', 'ヨーグルト', 'ハム'],
        '昼食': ['鯛肉', '野菜', '米', 'パスタ', 'トマト', 'キャベツ', 'タマネギ'],
        '夕食': ['肉類', '魚', '野菜', '米', 'ジャガイモ', 'ニンジン', 'タマネギ']
      }
    };

    return styleIngredients[style][mealType] || styleIngredients['mixed'][mealType];
  };


  const getCurrentTimeBasedMealType = (): '朝食' | '昼食' | '夕食' => {
    const hour = new Date().getHours();
    if (hour < 10) return '朝食';
    if (hour < 15) return '昼食';
    return '夕食';
  };

  const generateLocalMealSuggestion = (): MealSuggestion => {
    // 食事タイプを決定
    const mealType = preferences.mealType === 'auto' 
      ? getCurrentTimeBasedMealType() 
      : preferences.mealType;

    // パターンを選択
    const patterns = quickMealPatterns[mealType] || quickMealPatterns['夕食'];
    const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
    const selectedRecipes: Recipe[] = randomPattern.map(index => sampleRecipes[index]);

    // 総カロリーと調理時間を計算
    const totalCalories = selectedRecipes.reduce((sum, recipe) => sum + recipe.nutrition.calories, 0);
    const totalTime = Math.max(...selectedRecipes.map(recipe => recipe.cookingTime));

    // 買い物リストを生成
    const shoppingList = generateShoppingList(selectedRecipes);

    // 調理スケジュールを生成
    const cookingSchedule = generateCookingSchedule(selectedRecipes);

    // スタイルに応じたタイトル生成
    const stylePrefix = preferences.preferredStyle === 'mixed' ? '' : `${preferences.preferredStyle}の`;
    
    return {
      id: `quick-meal-${Date.now()}`,
      title: `${stylePrefix}おまかせ${mealType}`,
      description: `${preferences.servings}人分・約${totalTime}分で作れるおまかせ献立です`,
      recipes: selectedRecipes,
      totalTime,
      totalCalories,
      servings: preferences.servings,
      tags: ['おまかせ', stylePrefix.replace('の', ''), mealType],
      shoppingList,
      cookingSchedule,
      createdAt: new Date(),
    };
  };

  const generateShoppingList = (recipes: Recipe[]) => {
    interface ShoppingItem {
      ingredient: string;
      amount: string;
      checked: boolean;
    }
    
    const ingredients = new Map<string, ShoppingItem>();
    
    recipes.forEach(recipe => {
      recipe.ingredients.forEach(ingredient => {
        if (ingredients.has(ingredient.name)) {
          const existing = ingredients.get(ingredient.name)!;
          ingredients.set(ingredient.name, {
            ingredient: ingredient.name,
            amount: `${existing.amount} + ${ingredient.amount}`,
            checked: false
          });
        } else {
          ingredients.set(ingredient.name, {
            ingredient: ingredient.name,
            amount: ingredient.amount + (ingredient.unit || ''),
            checked: false
          });
        }
      });
    });
    
    return Array.from(ingredients.values());
  };

  const generateCookingSchedule = (recipes: Recipe[]) => {
    interface ScheduleItem {
      time: string;
      task: string;
      recipeId: string;
      recipeName: string;
    }
    
    const schedule: ScheduleItem[] = [];
    let currentTime = 0;
    
    recipes.forEach(recipe => {
      recipe.steps.forEach((step, index) => {
        schedule.push({
          time: `${Math.floor(currentTime / 60)}:${(currentTime % 60).toString().padStart(2, '0')}`,
          task: step.description,
          recipeId: recipe.id,
          recipeName: recipe.name
        });
        currentTime += step.duration || 5;
      });
    });
    
    return schedule;
  };

  const handleGenerateMeal = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      console.log('🚀 [おまかせ献立] AI献立生成開始...', { preferences });
      
      // 優先プロバイダーを取得
      const preferredProvider = getPreferredProvider('mealGeneration');
      const availableKeys = {
        groqApiKey: getApiKey('groqApiKey'),
        geminiApiKey: getApiKey('geminiApiKey'),
        openaiApiKey: getApiKey('openaiApiKey'),
        anthropicApiKey: getApiKey('anthropicApiKey'),
        huggingfaceApiKey: getApiKey('huggingfaceApiKey'),
        togetherApiKey: getApiKey('togetherApiKey'),
      };
      
      // 使用可能なAPIキーがあるか確認
      const hasAnyApiKey = Object.values(availableKeys).some(key => !!key);
      
      console.log('🔑 [おまかせ献立] APIキー状態確認:', {
        preferredProvider: preferredProvider || 'auto',
        hasAnyApiKey,
        availableProviders: Object.entries(availableKeys)
          .filter(([_, key]) => !!key)
          .map(([provider, key]) => ({
            provider,
            keyLength: key.length,
            keyPreview: `${key.substring(0, 8)}...`
          })),
        timestamp: new Date().toISOString()
      });
      
      if (!hasAnyApiKey) {
        console.warn('⚠️ APIキーが設定されていません。モックデータで生成します。');
        const mealData = generateLocalMealSuggestion();
        addToHistory(mealData);
        router.push('/result');
        return;
      }
      
      // 食材をスタイルに応じて推定
      const mealType = preferences.mealType === 'auto' 
        ? getCurrentTimeBasedMealType() 
        : preferences.mealType;
      
      // AI献立生成リクエストを構築
      const mealPreferences = {
        ingredients: generateStyleBasedIngredients(preferences.preferredStyle, mealType),
        servings: preferences.servings,
        cookingTime: '45', // 文字列形式
        mealType: mealType === '朝食' ? 'breakfast' as const : 
                 mealType === '昼食' ? 'lunch' as const : 'dinner' as const,
        avoidIngredients: preferences.dietaryRestrictions,
        allergies: [],
        nutritionBalance: 'balanced' as const,
        difficulty: 'easy' as const,
        dishCount: 3,
        budget: 'standard' as const,
      };
      
      console.log('🍴 [おまかせ献立] AI献立生成リクエスト詳細:', {
        ingredients: mealPreferences.ingredients,
        servings: mealPreferences.servings,
        mealType: mealPreferences.mealType,
        preferredStyle: preferences.preferredStyle,
        preferredProvider: preferredProvider || 'auto',
        timestamp: new Date().toISOString()
      });
      
      // 実際のAPI呼び出し開始時刻を記録
      const apiStartTime = Date.now();
      console.log('📡 [おまかせ献立] AI API呼び出し開始...', { startTime: apiStartTime });
      
      // 新しいAI統合システムで献立生成
      const result = await generateMealSuggestion(mealPreferences, preferredProvider);
      
      const apiEndTime = Date.now();
      const apiDuration = apiEndTime - apiStartTime;
      
      console.log('📊 [おまかせ献立] AI APIレスポンス詳細:', {
        success: result.success,
        provider: result.provider,
        duration: `${apiDuration}ms`,
        hasError: !!result.error,
        error: result.error,
        hasSuggestion: !!result.suggestion,
        recipeCount: result.suggestion?.recipes?.length || 0
      });
      
      // レスポンスの詳細ログ
      if (result.success && result.suggestion) {
        console.log('🍽️ [おまかせ献立] 生成された献立詳細:', {
          title: result.suggestion.title,
          description: result.suggestion.description,
          totalTime: result.suggestion.totalTime,
          servings: result.suggestion.servings,
          recipes: result.suggestion.recipes.map(recipe => ({
            name: recipe.name,
            cookingTime: recipe.cookingTime,
            difficulty: recipe.difficulty
          }))
        });
      }
      
      if (result.success && result.suggestion) {
        console.log(`✅ [おまかせ献立] AI献立生成成功! プロバイダー: ${result.provider}`);
        
        // プロバイダー情報を献立タイトルに追加
        const providerEmoji = result.provider === 'Gemini' ? '💎' : 
                             result.provider === 'Groq' ? '🚀' :
                             result.provider === 'OpenAI' ? '🧠' :
                             result.provider === 'Anthropic' ? '🤖' : '✨';
        
        result.suggestion.title = `${providerEmoji} ${result.suggestion.title}`;
        
        // AI生成献立として保存し、履歴にも追加
        console.log('📋 [おまかせ献立] AI生成献立をストアに保存:', result.suggestion);
        setGeneratedSuggestion(result.suggestion);
        addToHistory(result.suggestion);
        
        // 結果ページに遷移
        router.push('/result');
        
      } else {
        console.warn('⚠️ [おまかせ献立] AI生成失敗、モックデータにフォールバック:', result.error);
        
        // フォールバック: モックデータで献立を生成
        const mockMealData = generateLocalMealSuggestion();
        mockMealData.title = `🎭 サンプル${mockMealData.title}`;
        addToHistory(mockMealData);
        router.push('/result');
      }
      
    } catch (error) {
      console.error('❌ 献立生成エラー:', error);
      
      // エラーの詳細をログ出力
      if (error instanceof Error) {
        console.error('エラー詳細:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      
      // エラー時もモックデータでフォールバック
      try {
        const mealData = generateLocalMealSuggestion();
        mealData.title = `🎭 サンプル${mealData.title}`;
        addToHistory(mealData);
        router.push('/result');
      } catch (fallbackError) {
        console.error('❌ フォールバックも失敗:', fallbackError);
        setError('献立の生成中にエラーが発生しました。もう一度お試しください。');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <MobileLayout 
      title="おまかせ献立" 
      showBack={true} 
      showBottomNav={false}
      onBack={() => router.push('/')}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-cyan-400 to-blue-600 p-4">
        <div className="max-w-md mx-auto">
          {/* 説明セクション */}
          <div className="text-center mb-8 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <div className="text-6xl mb-4">✨</div>
            <p className="text-gray-600 mb-3">
              簡単な設定で美味しい献立を提案します
            </p>
            
            {/* API状態表示 */}
            {apiStatus && (
              <div className={`mt-4 p-3 rounded-xl ${
                apiStatus.status === 'ready' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  {apiStatus.status === 'ready' ? (
                    <>
                      <span className="text-green-600">🤖</span>
                      <span className="text-sm font-medium text-green-800">AI利用可能</span>
                    </>
                  ) : (
                    <>
                      <span className="text-yellow-600">🎭</span>
                      <span className="text-sm font-medium text-yellow-800">モックデータで生成</span>
                    </>
                  )}
                </div>
                <p className={`text-xs ${
                  apiStatus.status === 'ready' ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {apiStatus.message}
                </p>
                
                {/* デバッグ情報表示 */}
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                    🔍 デバッグ情報を表示
                  </summary>
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono">
                    <div className="space-y-1">
                      <div>優先プロバイダー: {getPreferredProvider('mealGeneration') || 'Auto'}</div>
                      <div>Gemini: {getApiKey('geminiApiKey') ? `設定済み (${getApiKey('geminiApiKey').substring(0, 8)}...)` : '未設定'}</div>
                      <div>Groq: {getApiKey('groqApiKey') ? `設定済み (${getApiKey('groqApiKey').substring(0, 8)}...)` : '未設定'}</div>
                      <div>OpenAI: {getApiKey('openaiApiKey') ? `設定済み (${getApiKey('openaiApiKey').substring(0, 8)}...)` : '未設定'}</div>
                      <div>ステータス: {apiStatus.status}</div>
                      <div>タイムスタンプ: {new Date().toLocaleString()}</div>
                    </div>
                  </div>
                </details>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* 食事の種類 */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-500" />
                食事の種類
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {mealTypeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setPreferences(prev => ({ ...prev, mealType: option.value }))}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        preferences.mealType === option.value
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-blue-200'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-2 ${
                        preferences.mealType === option.value ? 'text-blue-500' : 'text-gray-400'
                      }`} />
                      <p className="text-sm font-medium text-gray-800">{option.label}</p>
                      <p className="text-xs text-gray-500">{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 人数 */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-500" />
                人数
              </h2>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {servingOptions.map((num) => (
                  <button
                    key={num}
                    onClick={() => setPreferences(prev => ({ ...prev, servings: num }))}
                    className={`min-w-[60px] h-12 rounded-full font-bold transition-all ${
                      preferences.servings === num
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/70 text-gray-600 hover:bg-blue-100'
                    }`}
                  >
                    {num}人
                  </button>
                ))}
              </div>
            </div>

            {/* 料理のスタイル */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <Heart className="w-5 h-5 mr-2 text-blue-500" />
                料理のスタイル
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {styleOptions.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => setPreferences(prev => ({ ...prev, preferredStyle: style.value }))}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      preferences.preferredStyle === style.value
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-blue-200'
                    }`}
                  >
                    <div className="text-2xl mb-2">{style.emoji}</div>
                    <p className="text-sm font-medium text-gray-800">{style.label}</p>
                    <p className="text-xs text-gray-500">{style.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 食事制限（オプション） */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <ChefHat className="w-5 h-5 mr-2 text-blue-500" />
                食事制限（オプション）
              </h2>
              <div className="flex flex-wrap gap-2">
                {dietaryOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleDietaryRestrictionToggle(option.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      preferences.dietaryRestrictions.includes(option.value)
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/70 text-gray-600 hover:bg-blue-100'
                    }`}
                  >
                    {option.emoji} {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* エラーメッセージ */}
            {error && (
              <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 rounded-2xl p-4 shadow-lg">
                <p className="text-red-600 text-sm font-medium">❌ {error}</p>
              </div>
            )}

            {/* 生成ボタン */}
            <div className="pt-4">
              <button
                onClick={handleGenerateMeal}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-lg py-4 rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                    {apiStatus?.status === 'ready' ? 'AIで献立生成中...' : '献立を生成中...'}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Sparkles className="w-6 h-6 mr-2" />
                    {apiStatus?.status === 'ready' ? 'AIでおまかせ献立を作成' : 'おまかせ献立を作成'}
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}