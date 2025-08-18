'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMealStore } from '../../../lib/store';
import { generateMeals, checkMealGenerationStatus } from '../../../lib/meal-generation';
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
  const { addToHistory } = useMealStore();
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

  // コンポーネントマウント時にGroq API状態をチェック
  React.useEffect(() => {
    const status = checkMealGenerationStatus();
    setApiStatus(status);
    console.log('🔍 Groq API状態チェック:', status);
  }, []);

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

  // Groq APIのレスポンスをMealSuggestion形式に変換
  const convertGroqResponseToMealSuggestion = (
    apiResponse: any,
    preferences: QuickPreferences,
    mealType: '朝食' | '昼食' | '夕食'
  ): MealSuggestion => {
    // Groq APIのレスポンスをRecipe形式に変換
    const recipes: Recipe[] = apiResponse.meals.map((meal: any, index: number) => ({
      id: `groq-meal-${Date.now()}-${index}`,
      name: meal.name,
      description: `${meal.category} - ${meal.difficulty}レベル`,
      ingredients: meal.ingredients.map((ing: string, i: number) => ({
        name: ing,
        amount: `適量`,
        unit: '',
        category: 'other' as const
      })),
      steps: meal.instructions.map((instruction: string, i: number) => ({
        order: i + 1,
        description: instruction,
        duration: Math.ceil(meal.cookingTime / meal.instructions.length),
        temperature: undefined,
        tips: meal.tips && meal.tips[i] ? [meal.tips[i]] : []
      })),
      cookingTime: meal.cookingTime,
      difficulty: meal.difficulty as 'easy' | 'medium' | 'hard',
      servings: meal.servings,
      nutrition: {
        calories: Math.round(300 + Math.random() * 200), // 仮のカロリー
        protein: Math.round(15 + Math.random() * 15),
        carbs: Math.round(30 + Math.random() * 20),
        fat: Math.round(10 + Math.random() * 15)
      },
      tags: [meal.category, meal.difficulty, preferences.preferredStyle],
      imageUrl: '',
      createdAt: new Date(),
      category: meal.category as 'main' | 'side' | 'soup' | 'rice' | 'dessert'
    }));

    // 総カロリーと調理時間を計算
    const totalCalories = recipes.reduce((sum, recipe) => sum + recipe.nutrition.calories, 0);
    const totalTime = Math.max(...recipes.map(recipe => recipe.cookingTime));

    // 買い物リストを生成
    const shoppingList = generateShoppingList(recipes);

    // 調理スケジュールを生成
    const cookingSchedule = generateCookingSchedule(recipes);

    // スタイルに応じたタイトル生成
    const stylePrefix = preferences.preferredStyle === 'mixed' ? 'AI推奨' : `${preferences.preferredStyle}`;
    
    return {
      id: `groq-quick-meal-${Date.now()}`,
      title: `${stylePrefix}${mealType}セット`,
      description: `${preferences.servings}人分・約${totalTime}分で作れるGroq AIが推奨する献立です`,
      recipes,
      totalTime,
      totalCalories,
      shoppingList,
      cookingSchedule,
      createdAt: new Date(),
    };
  };

  const getCurrentTimeBasedMealType = (): '朝食' | '昼食' | '夕食' => {
    const hour = new Date().getHours();
    if (hour < 10) return '朝食';
    if (hour < 15) return '昼食';
    return '夕食';
  };

  const generateMealSuggestion = (): MealSuggestion => {
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
      console.log('🚀 Groq APIでおまかせ献立生成開始...', { preferences });
      
      // APIキーの状態を詳細にチェック
      const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
      console.log('🔑 APIキー確認:', {
        hasApiKey: !!apiKey,
        keyLength: apiKey?.length || 0,
        keyPrefix: apiKey?.substring(0, 4) || 'なし',
        envVarExists: typeof process.env.NEXT_PUBLIC_GROQ_API_KEY !== 'undefined'
      });
      
      if (!apiKey) {
        console.warn('⚠️ APIキーが設定されていません。モックデータで生成します。');
        const mealData = generateMealSuggestion();
        addToHistory(mealData);
        router.push('/result');
        return;
      }
      
      // 食材をスタイルに応じて推定
      const mealType = preferences.mealType === 'auto' 
        ? getCurrentTimeBasedMealType() 
        : preferences.mealType;
      
      // Groq APIのリクエストを構築
      const mealRequest = {
        ingredients: generateStyleBasedIngredients(preferences.preferredStyle, mealType),
        servings: preferences.servings,
        cookingTime: 45,
        mealType: mealType === '朝食' ? 'breakfast' as const : 
                 mealType === '昼食' ? 'lunch' as const : 'dinner' as const,
        dietaryRestrictions: preferences.dietaryRestrictions,
        preferences: [`${preferences.preferredStyle}で作りたい`],
        difficulty: 'medium' as const,
        cuisine: preferences.preferredStyle === 'mixed' ? '和洋中問わず' : preferences.preferredStyle
      };
      
      console.log('🍴 Groq APIリクエスト詳細:', {
        ingredients: mealRequest.ingredients,
        servings: mealRequest.servings,
        mealType: mealRequest.mealType,
        cuisine: mealRequest.cuisine,
        timestamp: new Date().toISOString()
      });
      
      // 実際のAPI呼び出し開始時刻を記録
      const apiStartTime = Date.now();
      console.log('📡 Groq API呼び出し開始...', { startTime: apiStartTime });
      
      // Groq APIで献立生成
      const apiResponse = await generateMeals(mealRequest);
      
      const apiEndTime = Date.now();
      const apiDuration = apiEndTime - apiStartTime;
      
      console.log('📊 Groq APIレスポンス詳細:', {
        success: apiResponse.success,
        source: apiResponse.source,
        duration: `${apiDuration}ms`,
        mealsCount: apiResponse.meals?.length || 0,
        error: apiResponse.error,
        hasRawResponse: !!apiResponse.rawResponse,
        rawResponseLength: apiResponse.rawResponse?.length || 0
      });
      
      // レスポンスの詳細ログ
      if (apiResponse.meals && apiResponse.meals.length > 0) {
        console.log('🍽️ 生成された献立一覧:');
        apiResponse.meals.forEach((meal, index) => {
          console.log(`  ${index + 1}. ${meal.name}`, {
            category: meal.category,
            difficulty: meal.difficulty,
            cookingTime: meal.cookingTime,
            ingredientsCount: meal.ingredients.length,
            instructionsCount: meal.instructions.length
          });
        });
      }
      
      if (apiResponse.success && apiResponse.meals && apiResponse.meals.length > 0) {
        if (apiResponse.source === 'groq-api') {
          console.log('✅ Groq API献立生成成功! 実際のAI生成献立を使用');
          
          // APIの生レスポンスも表示（デバッグ用）
          if (apiResponse.rawResponse) {
            console.log('📄 Groq API生レスポンス（最初の500文字）:');
            console.log(apiResponse.rawResponse.substring(0, 500) + '...');
          }
        } else {
          console.log('🎭 モックデータで献立生成（Groq API未利用）');
        }
        
        // Groq APIのレスポンスをMealSuggestion形式に変換
        const mealData = convertGroqResponseToMealSuggestion(apiResponse, preferences, mealType);
        
        // 生成された献立にソース情報を追加
        mealData.title = `${apiResponse.source === 'groq-api' ? '🤖 AI生成' : '🎭 サンプル'}${mealData.title}`;
        
        // 履歴に追加
        addToHistory(mealData);
        
        // 結果ページに遷移
        router.push('/result');
        
      } else {
        console.warn('⚠️ Groq API失敗、モックデータにフォールバック:', apiResponse.error);
        
        // フォールバック: モックデータで献立を生成
        const mealData = generateMealSuggestion();
        mealData.title = `🎭 サンプル${mealData.title}`;
        addToHistory(mealData);
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
        const mealData = generateMealSuggestion();
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
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-cyan-400 to-blue-600 p-4">
      <div className="max-w-md mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <div className="text-6xl mb-4">✨</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            おまかせ献立
          </h1>
          <p className="text-gray-600 mb-3">
            簡単な設定で美味しい献立を提案します
          </p>
          
          {/* Groq API状態表示 */}
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
                    <span className="text-sm font-medium text-green-800">Groq AI利用可能</span>
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
                    <div>APIキー: {process.env.NEXT_PUBLIC_GROQ_API_KEY ? 
                      `設定済み (${process.env.NEXT_PUBLIC_GROQ_API_KEY.substring(0, 8)}...)` : 
                      '未設定'
                    }</div>
                    <div>環境変数: NEXT_PUBLIC_GROQ_API_KEY</div>
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
                  {apiStatus?.status === 'ready' ? 'Groq AIで献立生成中...' : '献立を生成中...'}
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Sparkles className="w-6 h-6 mr-2" />
                  {apiStatus?.status === 'ready' ? 'Groq AIでおまかせ献立を作成' : 'おまかせ献立を作成'}
                </div>
              )}
            </button>
          </div>

          {/* 戻るボタン */}
          <div className="text-center">
            <button
              onClick={() => router.push('/')}
              className="text-white font-medium underline hover:text-white/80 transition-colors"
            >
              ← ホームに戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
