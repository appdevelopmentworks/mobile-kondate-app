'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileLayout from '../../components/layout/MobileLayout';
import { useMealStore } from '../../lib/store';
import { motion } from 'framer-motion';
import { 
  Flame,
  Activity,
  Heart,
  Zap,
  Target,
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart,
  Info,
  Award,
  AlertCircle
} from 'lucide-react';
import type { MealSuggestion, Recipe, NutritionInfo } from '../../lib/types';

interface NutritionTarget {
  calories: { min: number; max: number; unit: string };
  protein: { min: number; max: number; unit: string };
  fat: { min: number; max: number; unit: string };
  carbohydrates: { min: number; max: number; unit: string };
  fiber: { min: number; max: number; unit: string };
  salt: { min: number; max: number; unit: string };
}

interface NutritionAnalysis {
  score: number;
  balance: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
  highlights: string[];
  concerns: string[];
}

export default function NutritionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { history } = useMealStore();
  
  const [currentMeal, setCurrentMeal] = useState<MealSuggestion | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [viewMode, setViewMode] = useState<'meal' | 'recipe'>('meal');
  const [nutritionTargets] = useState<NutritionTarget>({
    calories: { min: 1800, max: 2200, unit: 'kcal' },
    protein: { min: 60, max: 80, unit: 'g' },
    fat: { min: 40, max: 70, unit: 'g' },
    carbohydrates: { min: 200, max: 300, unit: 'g' },
    fiber: { min: 20, max: 30, unit: 'g' },
    salt: { min: 0, max: 8, unit: 'g' }
  });

  // URLパラメータからレシピIDを取得
  const recipeId = searchParams.get('recipe');

  // 初回読み込み時に最新の献立を取得
  useEffect(() => {
    if (history.length > 0) {
      const latestMeal = history[0];
      setCurrentMeal(latestMeal);
      
      // レシピIDが指定されている場合は該当レシピを設定
      if (recipeId) {
        const foundRecipe = latestMeal.recipes.find(r => r.id === recipeId);
        if (foundRecipe) {
          setSelectedRecipe(foundRecipe);
          setViewMode('recipe');
        }
      }
    }
  }, [history, recipeId]);

  // 栄養価分析
  const analyzeNutrition = (nutrition: NutritionInfo): NutritionAnalysis => {
    const scores = {
      calories: calculateScore(nutrition.calories, nutritionTargets.calories),
      protein: calculateScore(nutrition.protein, nutritionTargets.protein),
      fat: calculateScore(nutrition.fat, nutritionTargets.fat),
      carbohydrates: calculateScore(nutrition.carbohydrates, nutritionTargets.carbohydrates),
      fiber: calculateScore(nutrition.fiber, nutritionTargets.fiber),
      salt: calculateScore(nutrition.salt, nutritionTargets.salt, true) // 塩分は少ない方が良い
    };

    const averageScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.values(scores).length;
    
    const balance = averageScore >= 85 ? 'excellent' :
                   averageScore >= 70 ? 'good' :
                   averageScore >= 50 ? 'fair' : 'poor';

    const recommendations: string[] = [];
    const highlights: string[] = [];
    const concerns: string[] = [];

    // 個別のアドバイス
    if (scores.protein >= 80) highlights.push('タンパク質が豊富です');
    else if (scores.protein < 50) {
      concerns.push('タンパク質が不足しています');
      recommendations.push('肉類、魚類、豆類を追加してみてください');
    }

    if (scores.fiber >= 80) highlights.push('食物繊維がたっぷり摂れます');
    else if (scores.fiber < 50) {
      concerns.push('食物繊維が不足しています');
      recommendations.push('野菜や全粒穀物を増やしてみてください');
    }

    if (scores.salt < 30) highlights.push('塩分控えめで健康的です');
    else if (scores.salt > 70) {
      concerns.push('塩分が多めです');
      recommendations.push('調味料の量を調整してみてください');
    }

    return {
      score: Math.round(averageScore),
      balance,
      recommendations,
      highlights,
      concerns
    };
  };

  const calculateScore = (value: number, target: { min: number; max: number }, inverse = false): number => {
    if (inverse) {
      // 塩分など、少ない方が良い栄養素
      if (value <= target.min) return 100;
      if (value >= target.max) return 0;
      return Math.max(0, 100 - ((value - target.min) / (target.max - target.min)) * 100);
    } else {
      // 適正範囲内が100点
      if (value >= target.min && value <= target.max) return 100;
      if (value < target.min) return Math.max(0, (value / target.min) * 100);
      return Math.max(0, 100 - ((value - target.max) / target.max) * 50);
    }
  };

  // 表示する栄養情報を取得
  const getCurrentNutrition = (): NutritionInfo | null => {
    if (viewMode === 'recipe' && selectedRecipe) {
      return selectedRecipe.nutrition;
    } else if (viewMode === 'meal' && currentMeal) {
      return {
        calories: currentMeal.totalCalories,
        protein: currentMeal.recipes.reduce((sum, r) => sum + r.nutrition.protein, 0),
        fat: currentMeal.recipes.reduce((sum, r) => sum + r.nutrition.fat, 0),
        carbohydrates: currentMeal.recipes.reduce((sum, r) => sum + r.nutrition.carbohydrates, 0),
        fiber: currentMeal.recipes.reduce((sum, r) => sum + r.nutrition.fiber, 0),
        salt: currentMeal.recipes.reduce((sum, r) => sum + r.nutrition.salt, 0)
      };
    }
    return null;
  };

  const currentNutrition = getCurrentNutrition();
  const analysis = currentNutrition ? analyzeNutrition(currentNutrition) : null;

  if (!currentMeal) {
    return (
      <MobileLayout title="栄養分析" showBack>
        <div className="text-center py-16">
          <PieChart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">献立データがありません</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="栄養分析" showBack>
      <div className="px-4 py-6 space-y-6">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">栄養分析</h2>
              <p className="text-emerald-100">バランスの良い食事を心がけましょう</p>
            </div>
          </div>
          
          {/* モード切替 */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('meal')}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
                viewMode === 'meal'
                  ? 'bg-white text-emerald-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              献立全体
            </button>
            <button
              onClick={() => setViewMode('recipe')}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
                viewMode === 'recipe'
                  ? 'bg-white text-emerald-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              個別レシピ
            </button>
          </div>
        </div>

        {/* レシピ選択（レシピモード時） */}
        {viewMode === 'recipe' && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">レシピを選択</h3>
            <div className="space-y-2">
              {currentMeal.recipes.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => setSelectedRecipe(recipe)}
                  className={`w-full p-3 rounded-xl text-left transition-colors ${
                    selectedRecipe?.id === recipe.id
                      ? 'bg-emerald-100 border-2 border-emerald-300'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{recipe.name}</span>
                    <span className="text-sm text-gray-600">{recipe.nutrition.calories}kcal</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 栄養スコア */}
        {analysis && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">栄養スコア</h3>
                <p className="text-gray-600">
                  {viewMode === 'meal' ? '献立全体' : selectedRecipe?.name}の栄養バランス
                </p>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold mb-1 ${
                  analysis.balance === 'excellent' ? 'text-green-600' :
                  analysis.balance === 'good' ? 'text-blue-600' :
                  analysis.balance === 'fair' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {analysis.score}
                </div>
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">点</span>
                </div>
              </div>
            </div>

            {/* バランス評価 */}
            <div className={`p-4 rounded-2xl mb-6 ${
              analysis.balance === 'excellent' ? 'bg-green-50 border border-green-200' :
              analysis.balance === 'good' ? 'bg-blue-50 border border-blue-200' :
              analysis.balance === 'fair' ? 'bg-yellow-50 border border-yellow-200' : 
              'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Target className={`w-5 h-5 ${
                  analysis.balance === 'excellent' ? 'text-green-600' :
                  analysis.balance === 'good' ? 'text-blue-600' :
                  analysis.balance === 'fair' ? 'text-yellow-600' : 'text-red-600'
                }`} />
                <span className={`font-semibold ${
                  analysis.balance === 'excellent' ? 'text-green-800' :
                  analysis.balance === 'good' ? 'text-blue-800' :
                  analysis.balance === 'fair' ? 'text-yellow-800' : 'text-red-800'
                }`}>
                  {analysis.balance === 'excellent' ? '優秀' :
                   analysis.balance === 'good' ? '良好' :
                   analysis.balance === 'fair' ? '普通' : '要改善'}
                </span>
              </div>
              <p className={`text-sm ${
                analysis.balance === 'excellent' ? 'text-green-700' :
                analysis.balance === 'good' ? 'text-blue-700' :
                analysis.balance === 'fair' ? 'text-yellow-700' : 'text-red-700'
              }`}>
                {analysis.balance === 'excellent' ? 'とてもバランスの良い栄養価です！' :
                 analysis.balance === 'good' ? '栄養バランスは良好です。' :
                 analysis.balance === 'fair' ? '栄養バランスはまずまずです。' : '栄養バランスの改善が必要です。'}
              </p>
            </div>

            {/* ハイライト */}
            {analysis.highlights.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  栄養のポイント
                </h4>
                <div className="space-y-2">
                  {analysis.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2" />
                      <p className="text-sm text-green-700">{highlight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 注意点 */}
            {analysis.concerns.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-orange-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  注意点
                </h4>
                <div className="space-y-2">
                  {analysis.concerns.map((concern, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mt-2" />
                      <p className="text-sm text-orange-700">{concern}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 改善提案 */}
            {analysis.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  改善提案
                </h4>
                <div className="space-y-2">
                  {analysis.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2" />
                      <p className="text-sm text-blue-700">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 詳細栄養情報 */}
        {currentNutrition && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              栄養成分詳細
            </h3>

            <div className="space-y-6">
              {[
                {
                  key: 'calories',
                  label: 'カロリー',
                  value: currentNutrition.calories,
                  unit: 'kcal',
                  target: nutritionTargets.calories,
                  color: 'red',
                  icon: Flame
                },
                {
                  key: 'protein',
                  label: 'タンパク質',
                  value: currentNutrition.protein,
                  unit: 'g',
                  target: nutritionTargets.protein,
                  color: 'blue',
                  icon: Zap
                },
                {
                  key: 'fat',
                  label: '脂質',
                  value: currentNutrition.fat,
                  unit: 'g',
                  target: nutritionTargets.fat,
                  color: 'yellow',
                  icon: Activity
                },
                {
                  key: 'carbohydrates',
                  label: '炭水化物',
                  value: currentNutrition.carbohydrates,
                  unit: 'g',
                  target: nutritionTargets.carbohydrates,
                  color: 'green',
                  icon: Activity
                },
                {
                  key: 'fiber',
                  label: '食物繊維',
                  value: currentNutrition.fiber,
                  unit: 'g',
                  target: nutritionTargets.fiber,
                  color: 'emerald',
                  icon: Activity
                },
                {
                  key: 'salt',
                  label: '塩分',
                  value: currentNutrition.salt,
                  unit: 'g',
                  target: nutritionTargets.salt,
                  color: 'gray',
                  icon: Activity
                }
              ].map((nutrient) => {
                const Icon = nutrient.icon;
                const score = calculateScore(
                  nutrient.value, 
                  nutrient.target, 
                  nutrient.key === 'salt'
                );
                const percentage = (nutrient.value / nutrient.target.max) * 100;

                return (
                  <div key={nutrient.key} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 text-${nutrient.color}-500`} />
                        <span className="font-medium text-gray-900">{nutrient.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900">
                          {nutrient.value}{nutrient.unit}
                        </span>
                        <div className="text-xs text-gray-500">
                          目標: {nutrient.target.min}-{nutrient.target.max}{nutrient.unit}
                        </div>
                      </div>
                    </div>

                    {/* プログレスバー */}
                    <div className="relative">
                      <div className={`w-full bg-${nutrient.color}-100 rounded-full h-3`}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(percentage, 100)}%` }}
                          transition={{ duration: 1, delay: 0.2 }}
                          className={`bg-${nutrient.color}-500 h-3 rounded-full`}
                        />
                      </div>
                      
                      {/* 目標範囲のマーカー */}
                      <div className="absolute top-0 w-full h-3">
                        <div 
                          className="absolute h-3 bg-gray-300 opacity-30"
                          style={{
                            left: `${(nutrient.target.min / nutrient.target.max) * 100}%`,
                            width: `${((nutrient.target.max - nutrient.target.min) / nutrient.target.max) * 100}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* スコア */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {percentage.toFixed(1)}% (目標値に対して)
                      </span>
                      <span className={`font-medium ${
                        score >= 85 ? 'text-green-600' :
                        score >= 70 ? 'text-blue-600' :
                        score >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        スコア: {Math.round(score)}点
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 栄養情報の説明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-medium text-blue-800 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5" />
            栄養バランスについて
          </h3>
          <div className="space-y-3 text-sm text-blue-700">
            <p>• 栄養スコアは、各栄養素の摂取量が目標範囲内にどれだけ近いかを100点満点で評価します。</p>
            <p>• バランスの良い食事は、すべての栄養素をバランスよく摂取することが大切です。</p>
            <p>• 塩分は控えめに、食物繊維は多めに摂ることを心がけましょう。</p>
            <p>• 目標値は一般的な成人の推奨量を参考にしています。個人の健康状態に応じて調整してください。</p>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}