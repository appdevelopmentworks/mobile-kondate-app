'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMealStore } from '../../lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import MobileLayout from '../../components/layout/MobileLayout';
import { 
  Clock, 
  Users, 
  Heart, 
  ShoppingCart, 
  ChefHat, 
  Home, 
  RefreshCw,
  Star,
  Flame,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { sampleRecipes } from '../../lib/sample-data';
import type { MealSuggestion, Recipe } from '../../lib/types';

// 献立のバリエーションパターンを定義
const mealPatterns = {
  1: [
    [0], // 肉じゃがのみ
    [4], // 親子丼のみ
    [1], // 鮭の塩焼きのみ
  ],
  2: [
    [0, 3], // 肉じゃが + ほうれん草のお浸し
    [4, 2], // 親子丼 + 味噌汁
    [1, 3], // 鮭の塩焼き + ほうれん草のお浸し
  ],
  3: [
    [0, 3, 2], // 肉じゃが + ほうれん草のお浸し + 味噌汁
    [4, 3, 2], // 親子丼 + ほうれん草のお浸し + 味噌汁
    [1, 0, 2], // 鮭の塩焼き + 肉じゃが + 味噌汁
  ],
  4: [
    [0, 1, 3, 2], // 肉じゃが + 鮭の塩焼き + ほうれん草のお浸し + 味噌汁
    [4, 1, 3, 2], // 親子丼 + 鮭の塩焼き + ほうれん草のお浸し + 味噌汁
    [0, 4, 3, 2], // 肉じゃが + 親子丼 + ほうれん草のお浸し + 味噌汁
  ],
};

export default function ResultPage() {
  const router = useRouter();
  const { formData, addToHistory, toggleFavorite, favorites, setLoading, isLoading } = useMealStore();
  const [mealSuggestion, setMealSuggestion] = useState<MealSuggestion | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    // フォームデータに基づいて献立を生成
    generateMealSuggestion();
  }, [generateMealSuggestion]);

  const generateMealSuggestion = useCallback(() => {
    const dishCount = formData.dishCount || 3;
    const patterns = mealPatterns[dishCount as keyof typeof mealPatterns] || mealPatterns[3];
    
    // ランダムにパターンを選択
    const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
    const selectedRecipes: Recipe[] = randomPattern.map(index => sampleRecipes[index]);

    // 総カロリーと調理時間を計算
    const totalCalories = selectedRecipes.reduce((sum, recipe) => sum + recipe.nutrition.calories, 0);
    const totalTime = Math.max(...selectedRecipes.map(recipe => recipe.cookingTime));

    // 買い物リストを生成
    const shoppingList = generateShoppingList(selectedRecipes);

    // 調理スケジュールを生成
    const cookingSchedule = generateCookingSchedule(selectedRecipes);

    const suggestion: MealSuggestion = {
      id: `meal-${Date.now()}`,
      title: getMealTitle(),
      description: getMealDescription(),
      recipes: selectedRecipes,
      totalTime,
      totalCalories,
      shoppingList,
      cookingSchedule,
      createdAt: new Date(),
    };

    setMealSuggestion(suggestion);
    setLoading(false);
    setIsRegenerating(false);

    // 履歴に追加
    addToHistory(suggestion);
  }, [formData, addToHistory]);

  const getMealTitle = () => {
    const mealTypeMap = {
      breakfast: '朝食',
      lunch: '昼食', 
      dinner: '夕食',
      bento: 'お弁当',
      party: 'おもてなし'
    };
    
    const mealTypeName = mealTypeMap[formData.mealType || 'dinner'];
    const nutritionMap = {
      balanced: 'バランス',
      protein: 'タンパク質重視',
      vegetable: '野菜たっぷり',
      light: 'あっさり'
    };
    
    const nutritionName = nutritionMap[formData.nutritionBalance || 'balanced'];
    
    // バリエーションのためにランダムな要素を追加
    const variations = ['', 'おすすめ', '人気', '定番', '家庭の'];
    const variation = variations[Math.floor(Math.random() * variations.length)];
    
    return `${variation}${nutritionName}の${mealTypeName}セット`.replace(/^の/, '');
  };

  const getMealDescription = () => {
    const servings = formData.servings || 2;
    const time = formData.cookingTime === 'unlimited' ? 'じっくり' : `${formData.cookingTime}分`;
    return `${servings}人分・調理時間${time}で作れる献立です`;
  };

  const generateShoppingList = (recipes: Recipe[]) => {
    const ingredients = new Map();
    
    recipes.forEach(recipe => {
      recipe.ingredients.forEach(ingredient => {
        if (ingredients.has(ingredient.name)) {
          // 同じ食材がある場合は数量を合計（簡易実装）
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

  const handleToggleFavorite = () => {
    if (mealSuggestion) {
      toggleFavorite(mealSuggestion.id);
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleCreateNew = async () => {
    setIsRegenerating(true);
    
    // 少し遅延を入れてローディング感を演出
    setTimeout(() => {
      generateMealSuggestion();
    }, 800);
  };

  if ((isLoading || !mealSuggestion) && !isRegenerating) {
    return (
      <MobileLayout title="献立作成中" showBack={true}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-4"
            >
              <ChefHat className="w-16 h-16 text-pink-500" />
            </motion.div>
            <p className="text-gray-700 font-medium">美味しい献立を作成中...</p>
          </motion.div>
        </div>
      </MobileLayout>
    );
  }

  const isFavorite = mealSuggestion ? favorites.includes(mealSuggestion.id) : false;

  return (
    <MobileLayout title="献立完成！" showBack={true} showBottomNav={false}>
      <div className="px-4 py-6 space-y-6">
        <AnimatePresence mode="wait">
          {isRegenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center min-h-[60vh]"
            >
              <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 mx-auto mb-4"
                >
                  <RefreshCw className="w-16 h-16 text-pink-500" />
                </motion.div>
                <p className="text-gray-700 font-medium">新しい献立を考え中...</p>
                <p className="text-gray-600 text-sm mt-1">少々お待ちください</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* ヘッダー */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
              >
                <div className="text-6xl mb-4">🎉</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  {mealSuggestion?.title}
                </h1>
                <p className="text-gray-600">{mealSuggestion?.description}</p>
              </motion.div>

              {/* サマリー情報 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl p-6 shadow-lg"
              >
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <Clock className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-lg font-bold">{mealSuggestion?.totalTime}分</p>
                    <p className="text-sm text-white/80">調理時間</p>
                  </div>
                  <div>
                    <Flame className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-lg font-bold">{mealSuggestion?.totalCalories}</p>
                    <p className="text-sm text-white/80">kcal</p>
                  </div>
                  <div>
                    <Users className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-lg font-bold">{formData.servings}人分</p>
                    <p className="text-sm text-white/80">分量</p>
                  </div>
                </div>
              </motion.div>

              {/* レシピ一覧 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-pink-500" />
                  今日の献立
                </h2>
                <div className="space-y-3">
                  {mealSuggestion?.recipes.map((recipe, index) => (
                    <motion.div
                      key={recipe.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">{recipe.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {recipe.cookingTime}分
                            </span>
                            <span className="flex items-center gap-1">
                              <Flame className="w-4 h-4" />
                              {recipe.nutrition.calories}kcal
                            </span>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                              {recipe.difficulty === 'easy' ? '簡単' : recipe.difficulty === 'medium' ? '普通' : '上級'}
                            </span>
                          </div>
                        </div>
                        <div className="text-2xl">
                          {recipe.category === 'main' ? '🍖' : 
                           recipe.category === 'side' ? '🥬' : 
                           recipe.category === 'soup' ? '🍲' : '🍽️'}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* 買い物リスト */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4"
              >
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-green-500" />
                  買い物リスト
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {mealSuggestion?.shoppingList.slice(0, 8).map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-gray-300" />
                      <span className="text-gray-700">{item.ingredient}</span>
                      <span className="text-gray-500 text-xs">{item.amount}</span>
                    </div>
                  ))}
                </div>
                {(mealSuggestion?.shoppingList.length || 0) > 8 && (
                  <p className="text-center text-gray-500 text-sm mt-3">
                    他 {(mealSuggestion?.shoppingList.length || 0) - 8} 品
                  </p>
                )}
              </motion.div>

              {/* 調理スケジュール */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4"
              >
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  調理スケジュール
                </h3>
                <div className="space-y-2">
                  {mealSuggestion?.cookingSchedule.slice(0, 6).map((schedule, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono min-w-[50px]">
                        {schedule.time}
                      </span>
                      <span className="text-gray-700 flex-1">{schedule.task}</span>
                      <span className="text-gray-500 text-xs">{schedule.recipeName}</span>
                    </div>
                  ))}
                </div>
                {(mealSuggestion?.cookingSchedule.length || 0) > 6 && (
                  <p className="text-center text-gray-500 text-sm mt-3">
                    他 {(mealSuggestion?.cookingSchedule.length || 0) - 6} ステップ
                  </p>
                )}
              </motion.div>

              {/* アクションボタン */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                {/* お気に入り登録 */}
                <button
                  onClick={handleToggleFavorite}
                  className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-semibold transition-all duration-200 shadow-lg ${
                    isFavorite
                      ? 'bg-pink-500 text-white'
                      : 'bg-white/90 backdrop-blur-sm border-2 border-pink-500 text-pink-500 hover:bg-white'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                  <span>{isFavorite ? 'お気に入り登録済み' : 'お気に入りに登録'}</span>
                </button>

                {/* 新しい献立を作成 */}
                <button
                  onClick={handleCreateNew}
                  disabled={isRegenerating}
                  className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-semibold transition-all duration-200 shadow-lg ${
                    isRegenerating
                      ? 'bg-gray-200/90 backdrop-blur-sm text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 active:scale-95'
                  }`}
                >
                  <RefreshCw className={`w-5 h-5 ${isRegenerating ? 'animate-spin' : ''}`} />
                  <span>{isRegenerating ? '生成中...' : '他の献立を見る'}</span>
                </button>

                {/* ホームに戻る */}
                <button
                  onClick={handleGoHome}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-white/90 backdrop-blur-sm text-gray-700 font-semibold rounded-2xl hover:bg-white active:scale-95 transition-all duration-200 shadow-lg"
                >
                  <Home className="w-5 h-5" />
                  <span>ホームに戻る</span>
                </button>
              </motion.div>

              {/* 調理のヒント */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-br from-yellow-100/90 to-orange-100/90 backdrop-blur-sm border border-yellow-200/60 rounded-2xl p-4 shadow-lg"
              >
                <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  調理のコツ
                </h3>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>• 同時進行で効率よく調理しましょう</p>
                  <p>• 煮込み料理は最初に始めるのがおすすめ</p>
                  <p>• 野菜の下ごしらえは事前に済ませておくと楽です</p>
                </div>
              </motion.div>

              {/* 底部スペース */}
              <div className="h-8"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}
