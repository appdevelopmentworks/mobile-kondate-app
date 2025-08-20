'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, 
  Loader2, 
  Clock, 
  Users, 
  Flame, 
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useMealStore } from '@/lib/store';
import { AIServiceManager } from '@/lib/api/ai-service-manager';
import { useApiKeyStore } from '@/lib/settings-store';
import MobileLayout from '@/components/layout/MobileLayout';

interface GeneratedMeal {
  id: string;
  title: string;
  description: string;
  recipes: {
    name: string;
    category: string;
    cookingTime: number;
    difficulty: string;
    ingredients: string[];
    instructions: string[];
    calories?: number;
  }[];
  totalTime: number;
  totalCalories: number;
  servings: number;
  tips?: string[];
}

export default function GeneratePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addMeal } = useMealStore();
  const apiKeyStore = useApiKeyStore();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMeal, setGeneratedMeal] = useState<GeneratedMeal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recognizedIngredients, setRecognizedIngredients] = useState<string[]>([]);

  // URL パラメータから食材を取得
  useEffect(() => {
    const ingredientsParam = searchParams.get('ingredients');
    if (ingredientsParam) {
      const ingredients = decodeURIComponent(ingredientsParam).split(',');
      setRecognizedIngredients(ingredients);
      
      // 自動で献立生成を開始
      generateMeal(ingredients);
    } else {
      // 食材が指定されていない場合はホームに戻る
      router.push('/');
    }
  }, [searchParams, router]);

  const generateMeal = async (ingredients: string[]) => {
    if (ingredients.length === 0) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedMeal(null);

    try {
      console.log('🍳 献立生成開始:', ingredients);

      const aiService = new AIServiceManager(apiKeyStore);
      
      // 献立生成リクエストを構築
      const prompt = `
以下の食材を使って、美味しい献立を提案してください：
食材: ${ingredients.join(', ')}

以下のJSON形式で回答してください：
{
  "title": "献立のタイトル",
  "description": "献立の簡単な説明",
  "recipes": [
    {
      "name": "料理名",
      "category": "main/side/soup",
      "cookingTime": 調理時間（分）,
      "difficulty": "easy/medium/hard",
      "ingredients": ["必要な食材リスト"],
      "instructions": ["調理手順1", "調理手順2", ...],
      "calories": カロリー（概算）
    }
  ],
  "totalTime": 総調理時間（分）,
  "totalCalories": 総カロリー,
  "servings": 何人分,
  "tips": ["調理のコツやアドバイス"]
}

※ 指定された食材を中心に使い、一般的な調味料や基本食材は適宜追加してください
※ 実際に作りやすく、栄養バランスの良い献立を提案してください
`;

      const result = await aiService.generateMealPlan({
        prompt: prompt,
        maxTokens: 2000
      });

      if (result.success && result.content) {
        // JSON レスポンスをパース
        let mealData;
        try {
          // マークダウンのコードブロックを除去
          const cleanContent = result.content
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
          
          mealData = JSON.parse(cleanContent);
        } catch (parseError) {
          console.error('JSON パースエラー:', parseError);
          throw new Error('献立データの解析に失敗しました');
        }

        // IDと作成日時を追加
        const generatedMeal: GeneratedMeal = {
          id: `meal_${Date.now()}`,
          ...mealData
        };

        setGeneratedMeal(generatedMeal);
        console.log('✅ 献立生成成功:', generatedMeal);

      } else {
        throw new Error(result.error || '献立の生成に失敗しました');
      }

    } catch (err) {
      console.error('❌ 献立生成エラー:', err);
      setError(err instanceof Error ? err.message : '献立生成中にエラーが発生しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveMeal = () => {
    if (generatedMeal) {
      // ストアに保存（型を合わせて変換）
      const mealToSave = {
        id: generatedMeal.id,
        title: generatedMeal.title,
        description: generatedMeal.description,
        recipes: generatedMeal.recipes.map(recipe => ({
          id: `${generatedMeal.id}_${recipe.name}`,
          name: recipe.name,
          category: recipe.category as 'main' | 'side' | 'soup' | 'salad' | 'other',
          cookingTime: recipe.cookingTime,
          difficulty: recipe.difficulty as 'easy' | 'medium' | 'hard',
          servings: generatedMeal.servings,
          ingredients: recipe.ingredients.map(ing => ({
            name: ing,
            amount: '適量',
            unit: '',
            optional: false
          })),
          steps: recipe.instructions.map((instruction, index) => ({
            order: index + 1,
            description: instruction,
            duration: Math.round(recipe.cookingTime / recipe.instructions.length),
            tips: ''
          })),
          nutrition: {
            calories: recipe.calories || 0,
            protein: 0,
            fat: 0,
            carbohydrates: 0,
            fiber: 0,
            salt: 0
          },
          tags: [recipe.category, recipe.difficulty],
          imageUrl: ''
        })),
        totalTime: generatedMeal.totalTime,
        totalCalories: generatedMeal.totalCalories,
        servings: generatedMeal.servings,
        tags: generatedMeal.tips || ['AI生成'],
        shoppingList: [],
        cookingSchedule: [],
        createdAt: new Date()
      };

      addMeal(mealToSave);
      router.push('/');
    }
  };

  const handleRegenerate = () => {
    generateMeal(recognizedIngredients);
  };

  return (
    <MobileLayout title="献立生成">
      <div className="h-full bg-gradient-to-br from-orange-50 to-pink-50">
        {/* 食材表示ヘッダー */}
        {recognizedIngredients.length > 0 && (
          <div className="p-4 bg-white/90 backdrop-blur-sm border-b border-orange-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-gray-900">認識された食材</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {recognizedIngredients.map((ingredient, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 p-4">
          <AnimatePresence mode="wait">
            {/* 生成中 */}
            {isGenerating && (
              <motion.div
                key="generating"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center h-96"
              >
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center mb-6">
                    <ChefHat className="w-10 h-10 text-white" />
                  </div>
                  
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
                  
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    献立を考えています...
                  </h2>
                  <p className="text-gray-600 text-sm">
                    認識された食材を使って<br />
                    美味しい献立を作成中です
                  </p>
                </div>
              </motion.div>
            )}

            {/* エラー */}
            {error && !isGenerating && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-8"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg">
                  <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    献立生成エラー
                  </h2>
                  <p className="text-red-600 text-sm mb-6">
                    {error}
                  </p>
                  
                  <div className="space-y-3">
                    <button
                      onClick={handleRegenerate}
                      className="w-full bg-orange-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      再生成する
                    </button>
                    
                    <button
                      onClick={() => router.push('/')}
                      className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                    >
                      ホームに戻る
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 生成結果 */}
            {generatedMeal && !isGenerating && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* 献立タイトル */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
                      <ChefHat className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">
                        {generatedMeal.title}
                      </h1>
                      <p className="text-gray-600 text-sm">
                        {generatedMeal.description}
                      </p>
                    </div>
                  </div>

                  {/* 統計情報 */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="text-center">
                      <Clock className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                      <div className="text-sm font-medium text-gray-900">
                        {generatedMeal.totalTime}分
                      </div>
                      <div className="text-xs text-gray-600">調理時間</div>
                    </div>
                    <div className="text-center">
                      <Users className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                      <div className="text-sm font-medium text-gray-900">
                        {generatedMeal.servings}人分
                      </div>
                      <div className="text-xs text-gray-600">分量</div>
                    </div>
                    <div className="text-center">
                      <Flame className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                      <div className="text-sm font-medium text-gray-900">
                        {generatedMeal.totalCalories}kcal
                      </div>
                      <div className="text-xs text-gray-600">総カロリー</div>
                    </div>
                  </div>
                </div>

                {/* レシピ一覧 */}
                <div className="space-y-4">
                  {generatedMeal.recipes.map((recipe, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-2xl p-6 shadow-lg"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">
                          {recipe.name}
                        </h3>
                        <div className="flex gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {recipe.category === 'main' ? 'メイン' : 
                             recipe.category === 'side' ? 'サイド' : 'スープ'}
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            {recipe.difficulty === 'easy' ? '簡単' :
                             recipe.difficulty === 'medium' ? '普通' : '難しい'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {recipe.cookingTime}分
                        </div>
                        {recipe.calories && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Flame className="w-4 h-4" />
                            {recipe.calories}kcal
                          </div>
                        )}
                      </div>

                      {/* 材料 */}
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">材料</h4>
                        <div className="flex flex-wrap gap-1">
                          {recipe.ingredients.map((ingredient, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {ingredient}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 作り方 */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">作り方</h4>
                        <ol className="space-y-2">
                          {recipe.instructions.map((instruction, idx) => (
                            <li key={idx} className="flex gap-3 text-sm text-gray-700">
                              <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-xs font-bold">
                                {idx + 1}
                              </span>
                              <span>{instruction}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* 調理のコツ */}
                {generatedMeal.tips && generatedMeal.tips.length > 0 && (
                  <div className="bg-yellow-50 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">
                      🌟 調理のコツ
                    </h3>
                    <ul className="space-y-2">
                      {generatedMeal.tips.map((tip, index) => (
                        <li key={index} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-yellow-600">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* アクションボタン */}
                <div className="space-y-3 pb-6">
                  <button
                    onClick={handleSaveMeal}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                  >
                    <CheckCircle className="w-6 h-6" />
                    この献立を保存する
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleRegenerate}
                      className="bg-orange-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      再生成
                    </button>
                    
                    <button
                      onClick={() => router.push('/')}
                      className="bg-gray-200 text-gray-800 py-3 px-4 rounded-xl font-medium hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      ホーム
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MobileLayout>
  );
}
