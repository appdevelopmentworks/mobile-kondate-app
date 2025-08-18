'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Clock, 
  Flame, 
  Users, 
  ArrowLeft,
  CheckCircle,
  Utensils
} from 'lucide-react';

export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [meal, setMeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      // URLパラメータからデータを取得
      const dataParam = searchParams.get('data');
      
      if (dataParam) {
        const decodedData = JSON.parse(decodeURIComponent(dataParam));
        setMeal(decodedData);
        console.log('受信した献立データ:', decodedData);
      } else {
        setError('献立データが見つかりませんでした');
      }
    } catch (error) {
      console.error('Failed to parse meal data:', error);
      setError('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">献立を読み込んでいます...</p>
        </div>
      </div>
    );
  }
  
  if (error || !meal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">エラーが発生しました</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-600 transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">献立結果</h1>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {/* 献立タイトル */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
          <div className="text-center mb-4">
            <div className="text-6xl mb-4">🍽️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {meal.title}
            </h2>
            <p className="text-gray-600">
              {meal.description}
            </p>
          </div>
          
          {/* 基本情報 */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Clock className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <p className="text-xs text-gray-600">調理時間</p>
              <p className="font-semibold text-sm">
                {meal.totalCookingTime}分
              </p>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
              <p className="text-xs text-gray-600">カロリー</p>
              <p className="font-semibold text-sm">
                {meal.totalCalories}kcal
              </p>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Users className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-xs text-gray-600">人数</p>
              <p className="font-semibold text-sm">
                {meal.servings || 2}人分
              </p>
            </div>
          </div>
        </div>

        {/* レシピ一覧 */}
        <div className="space-y-4 mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center">
            <Utensils className="w-6 h-6 mr-2 text-purple-500" />
            レシピ
          </h3>
          
          {meal.recipes && meal.recipes.length > 0 ? (
            meal.recipes.map((recipe: any, index: number) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium mb-2">
                      {recipe.category}
                    </span>
                    <h4 className="text-lg font-semibold text-gray-800">
                      {recipe.name}
                    </h4>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>{recipe.cookingTime}分</div>
                    <div>{recipe.calories}kcal</div>
                  </div>
                </div>
                
                {/* 材料 */}
                {recipe.ingredients && recipe.ingredients.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-800 mb-2">📋 材料</h5>
                    <div className="grid grid-cols-2 gap-1 text-sm">
                      {recipe.ingredients.map((ingredient: string, idx: number) => (
                        <div key={idx} className="flex items-center">
                          <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-gray-600">{ingredient}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 手順 */}
                {recipe.instructions && recipe.instructions.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-800 mb-2">👩‍🍳 作り方</h5>
                    <ol className="space-y-1 text-sm">
                      {recipe.instructions.map((step: string, idx: number) => (
                        <li key={idx} className="flex">
                          <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-gray-600">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <p className="text-gray-500">レシピが見つかりませんでした</p>
            </div>
          )}
        </div>

        {/* 調理のコツ */}
        {meal.tips && meal.tips.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 shadow-lg mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">💡 調理のコツ</h3>
            <ul className="space-y-2">
              {meal.tips.map((tip: string, index: number) => (
                <li key={index} className="flex items-start text-sm text-gray-700">
                  <span className="text-orange-500 mr-2">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* アクションボタン */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/meal-form/quick')}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all"
          >
            ✨ 別の献立を作成
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="w-full bg-white text-purple-600 font-bold py-4 rounded-xl shadow-lg border-2 border-purple-200 active:scale-95 transition-all"
          >
            🏠 ホームに戻る
          </button>
        </div>
      </div>
    </div>
  );
}
