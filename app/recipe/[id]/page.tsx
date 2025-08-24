'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Clock,
  Users,
  ChefHat,
  Heart,
  Share2,
  CheckCircle,
  Circle,
  ArrowLeft,
  Timer,
  Utensils,
  FlameKindling,
  AlertTriangle,
  Star,
  BookOpen,
  ShoppingCart,
  Play,
  MessageSquare,
  Edit,
  Lightbulb,
  BarChart3
} from 'lucide-react';
import MobileLayout from '@/components/layout/MobileLayout';
import { useMealStore } from '@/lib/store';
import { useReviewStore } from '@/lib/review-store';
import { sampleRecipes } from '@/lib/sample-data';
import type { Recipe } from '@/lib/types';

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { favorites, toggleFavorite } = useMealStore();
  const { getReviewsByRecipe, getAverageRating } = useReviewStore();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentTimer, setCurrentTimer] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps' | 'nutrition' | 'reviews'>('ingredients');

  const recipeId = params.id as string;
  const isFavorite = recipe ? favorites.includes(recipe.id) : false;

  // レシピデータを取得
  useEffect(() => {
    const foundRecipe = sampleRecipes.find(r => r.id === recipeId);
    if (foundRecipe) {
      setRecipe(foundRecipe);
    } else {
      // レシピが見つからない場合は前のページに戻る
      router.back();
    }
  }, [recipeId, router]);

  // ステップの完了状態を切り替え
  const toggleStepCompletion = (stepOrder: number) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepOrder)) {
        newSet.delete(stepOrder);
      } else {
        newSet.add(stepOrder);
      }
      return newSet;
    });
  };

  // タイマー開始
  const startTimer = (duration: number) => {
    setCurrentTimer(duration * 60); // 分を秒に変換
    setIsTimerRunning(true);
  };

  // タイマー効果
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning && currentTimer !== null && currentTimer > 0) {
      interval = setInterval(() => {
        setCurrentTimer(prev => {
          if (prev === null || prev <= 1) {
            setIsTimerRunning(false);
            // タイマー終了時の通知（実際のアプリではプッシュ通知）
            alert('タイマーが終了しました！');
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, currentTimer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!recipe) {
    return (
      <MobileLayout title="レシピ詳細">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ChefHat className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">レシピを読み込み中...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }

  const difficultyConfig = {
    easy: { label: '簡単', color: 'text-green-600', bg: 'bg-green-100' },
    medium: { label: '普通', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    hard: { label: '難しい', color: 'text-red-600', bg: 'bg-red-100' }
  };

  const difficulty = difficultyConfig[recipe.difficulty] || difficultyConfig.easy;
  const completionRate = Math.round((completedSteps.size / recipe.steps.length) * 100);

  return (
    <MobileLayout title={recipe.name} showBack>
      <div className="h-full flex flex-col">
        {/* ヒーローセクション */}
        <div className="relative bg-gradient-to-br from-orange-400 to-red-500 text-white p-6">
          {/* タイトルとアクション */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{recipe.name}</h1>
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => recipe && toggleFavorite(recipe.id)}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-full transition-colors"
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 統計情報 */}
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <Clock className="w-5 h-5 mx-auto mb-1" />
              <div className="text-sm font-medium">{recipe.cookingTime}分</div>
              <div className="text-xs opacity-80">調理時間</div>
            </div>
            <div>
              <Users className="w-5 h-5 mx-auto mb-1" />
              <div className="text-sm font-medium">{recipe.servings}人分</div>
              <div className="text-xs opacity-80">分量</div>
            </div>
            <div>
              <ChefHat className="w-5 h-5 mx-auto mb-1" />
              <div className={`text-sm font-medium px-2 py-1 rounded ${difficulty.bg} ${difficulty.color}`}>
                {difficulty.label}
              </div>
            </div>
            <div>
              <Star className="w-5 h-5 mx-auto mb-1" />
              <div className="text-sm font-medium">{recipe.nutrition.calories}</div>
              <div className="text-xs opacity-80">kcal</div>
            </div>
          </div>

          {/* 進捗バー */}
          {completedSteps.size > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>調理進捗</span>
                <span>{completionRate}% 完了</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* タイマー表示 */}
        {isTimerRunning && currentTimer !== null && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-500 text-white p-3 text-center"
          >
            <div className="flex items-center justify-center gap-2">
              <Timer className="w-5 h-5" />
              <span className="text-lg font-mono">{formatTime(currentTimer)}</span>
              <button
                onClick={() => setIsTimerRunning(false)}
                className="ml-4 px-3 py-1 bg-white/20 rounded text-sm"
              >
                停止
              </button>
            </div>
          </motion.div>
        )}

        {/* タブナビゲーション */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex">
            {[
              { key: 'ingredients', label: '材料', icon: ShoppingCart },
              { key: 'steps', label: '手順', icon: BookOpen },
              { key: 'nutrition', label: '栄養', icon: FlameKindling },
              { key: 'reviews', label: 'レビュー', icon: MessageSquare }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors ${
                    activeTab === tab.key
                      ? 'text-orange-600 border-b-2 border-orange-600'
                      : 'text-gray-600 hover:text-orange-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* タブコンテンツ */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'ingredients' && (
            <div className="p-4 space-y-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">材料 ({recipe.servings}人分)</h2>
              <div className="space-y-3">
                {recipe.ingredients.map((ingredient, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-orange-400 rounded-full" />
                      <span className="font-medium text-gray-900">
                        {ingredient.name}
                      </span>
                      {ingredient.optional && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          お好みで
                        </span>
                      )}
                    </div>
                    <span className="text-gray-600">
                      {ingredient.amount}{ingredient.unit && ` ${ingredient.unit}`}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'steps' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">調理手順</h2>
                <div className="text-sm text-gray-600">
                  {completedSteps.size}/{recipe.steps.length} 完了
                </div>
              </div>
              
              <div className="space-y-4">
                {recipe.steps.map((step, index) => {
                  const isCompleted = completedSteps.has(step.order);
                  return (
                    <motion.div
                      key={step.order}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isCompleted
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleStepCompletion(step.order)}
                          className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isCompleted
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300 hover:border-green-400'
                          }`}
                        >
                          {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                        </button>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">
                              ステップ {step.order}
                            </h3>
                            <div className="flex items-center gap-2">
                              {step.duration && step.duration > 0 && (
                                <>
                                  <span className="text-sm text-gray-600">
                                    {step.duration}分
                                  </span>
                                  <button
                                    onClick={() => step.duration && startTimer(step.duration)}
                                    disabled={isTimerRunning}
                                    className="p-1 bg-blue-100 text-blue-600 rounded disabled:opacity-50"
                                  >
                                    <Play className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <p className={`text-gray-700 ${isCompleted ? 'line-through opacity-60' : ''}`}>
                            {step.description}
                          </p>
                          
                          {step.tips && (
                            <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                                <p className="text-sm text-yellow-800">{step.tips}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'nutrition' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">栄養情報 (1人分)</h2>
                <button
                  onClick={() => router.push(`/nutrition?recipe=${recipeId}`)}
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1 hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors"
                >
                  詳細分析
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'カロリー', value: recipe.nutrition.calories, unit: 'kcal', color: 'text-red-600', bg: 'bg-red-50' },
                  { label: 'たんぱく質', value: recipe.nutrition.protein, unit: 'g', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: '脂質', value: recipe.nutrition.fat, unit: 'g', color: 'text-yellow-600', bg: 'bg-yellow-50' },
                  { label: '炭水化物', value: recipe.nutrition.carbohydrates, unit: 'g', color: 'text-green-600', bg: 'bg-green-50' },
                  { label: '食物繊維', value: recipe.nutrition.fiber, unit: 'g', color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: '塩分', value: recipe.nutrition.salt, unit: 'g', color: 'text-gray-600', bg: 'bg-gray-50' }
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-xl ${item.bg}`}
                  >
                    <div className={`text-2xl font-bold ${item.color} mb-1`}>
                      {item.value}{item.unit}
                    </div>
                    <div className="text-sm text-gray-600">{item.label}</div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <h3 className="font-semibold text-blue-900 mb-2">栄養バランス</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">たんぱく質</span>
                    <div className="flex-1 mx-3 bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min((recipe.nutrition.protein / 20) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-blue-700">
                      {Math.round((recipe.nutrition.protein / 20) * 100)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">脂質</span>
                    <div className="flex-1 mx-3 bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min((recipe.nutrition.fat / 15) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-blue-700">
                      {Math.round((recipe.nutrition.fat / 15) * 100)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">炭水化物</span>
                    <div className="flex-1 mx-3 bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min((recipe.nutrition.carbohydrates / 60) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-blue-700">
                      {Math.round((recipe.nutrition.carbohydrates / 60) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="p-4 space-y-6">
              <ReviewsTab recipeId={recipeId} recipeName={recipe.name} />
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );

  // レビューズタブコンポーネント
  function ReviewsTab({ recipeId, recipeName }: { recipeId: string; recipeName: string }) {
    const reviews = getReviewsByRecipe(recipeId);
    const averageRating = getAverageRating(recipeId);

    return (
      <div className="space-y-6">
        {/* レビューサマリー */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">レビューサマリー</h2>
              <p className="text-gray-600">このレシピの評価</p>
            </div>
            <button
              onClick={() => router.push(`/recipe/${recipeId}/review`)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors"
            >
              <Edit className="w-4 h-4" />
              レビューを書く
            </button>
          </div>

          {reviews.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Star className="w-6 h-6 text-yellow-500 fill-current" />
                  <span className="text-2xl font-bold text-gray-900">
                    {averageRating.toFixed(1)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">平均評価</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {reviews.length}
                </div>
                <p className="text-sm text-gray-600">レビュー数</p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {Math.round((reviews.filter(r => r.wouldMakeAgain).length / reviews.length) * 100)}%
                </div>
                <p className="text-sm text-gray-600">リピート率</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-4">まだレビューがありません</p>
              <p className="text-sm text-gray-400">
                このレシピを作ったら、ぜひレビューを書いてみてください！
              </p>
            </div>
          )}
        </div>

        {/* レビュー一覧 */}
        {reviews.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">みんなのレビュー</h3>
            
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                {/* レビューヘッダー */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        review.difficulty === 'easier' ? 'bg-green-100 text-green-800' :
                        review.difficulty === 'harder' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {review.difficulty === 'easier' ? '簡単だった' :
                         review.difficulty === 'harder' ? '難しかった' : '予想通り'}
                      </span>
                      
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        review.taste === 'excellent' ? 'bg-purple-100 text-purple-800' :
                        review.taste === 'very_good' ? 'bg-blue-100 text-blue-800' :
                        review.taste === 'good' ? 'bg-green-100 text-green-800' :
                        review.taste === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {review.taste === 'excellent' ? '最高' :
                         review.taste === 'very_good' ? 'とても良い' :
                         review.taste === 'good' ? '良い' :
                         review.taste === 'fair' ? 'まあまあ' : '残念'}
                      </span>

                      {review.wouldMakeAgain && (
                        <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-xs font-medium">
                          リピート確定
                        </span>
                      )}
                    </div>
                  </div>

                  {review.actualCookingTime && (
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {review.actualCookingTime}分
                    </div>
                  )}
                </div>

                {/* レビュー内容 */}
                {review.notes && (
                  <div className="mb-4">
                    <p className="text-gray-700 leading-relaxed">{review.notes}</p>
                  </div>
                )}

                {review.improvements && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-1">
                      <Lightbulb className="w-4 h-4" />
                      改善点・コツ
                    </h4>
                    <p className="text-sm text-yellow-700">{review.improvements}</p>
                  </div>
                )}

                {/* タグ */}
                {review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {review.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }
}