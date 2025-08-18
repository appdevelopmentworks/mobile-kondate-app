'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMealStore } from '../../../lib/store';
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
    const ingredients = new Map();
    
    recipes.forEach(recipe => {
      recipe.ingredients.forEach(ingredient => {
        if (ingredients.has(ingredient.name)) {
          const existing = ingredients.get(ingredient.name);
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
    const schedule = [];
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
      console.log('おまかせ献立生成開始...', { preferences });
      
      // 少し遅延を入れてローディング感を演出
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // クライアントサイドで献立を生成
      const mealData = generateMealSuggestion();
      console.log('生成された献立:', mealData);
      
      // 履歴に追加
      addToHistory(mealData);
      
      // 結果ページに遷移
      router.push('/result');
      
    } catch (error) {
      console.error('Error generating meal:', error);
      setError('献立の生成中にエラーが発生しました。もう一度お試しください。');
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
          <p className="text-gray-600">
            簡単な設定で美味しい献立を提案します
          </p>
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
                  献立を生成中...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Sparkles className="w-6 h-6 mr-2" />
                  おまかせ献立を作成
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
