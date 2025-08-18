'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileLayout from '@/components/layout/MobileLayout';
import MealResult from '@/components/meal/MealResult';
import { useMealFormStore } from '@/lib/store';
import { MealSuggestion } from '@/lib/types';
import { sampleMealSuggestion } from '@/lib/sample-data';

export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mealId = searchParams.get('id');
  const { history, lastResult } = useMealFormStore();
  const [meal, setMeal] = useState<MealSuggestion | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // URLパラメータからデータを取得
    const dataParam = searchParams.get('data');
    
    if (dataParam) {
      // APIから受け取ったデータをデコード
      try {
        const decodedData = JSON.parse(decodeURIComponent(dataParam));
        setMeal(decodedData);
      } catch (error) {
        console.error('Failed to parse meal data:', error);
      }
    } else if (mealId) {
      // 履歴から検索
      const foundMeal = history.find(m => m.id === mealId);
      if (foundMeal) {
        setMeal(foundMeal);
      } else if (lastResult && lastResult.id === mealId) {
        setMeal(lastResult);
      } else {
        // デモ用：サンプルデータを使用
        setMeal({
          ...sampleMealSuggestion,
          id: mealId,
        });
      }
    } else if (lastResult) {
      setMeal(lastResult);
    } else {
      // 結果がない場合はホームへ
      router.push('/');
    }
    setLoading(false);
  }, [mealId, searchParams, history, lastResult, router]);
  
  if (loading) {
    return (
      <MobileLayout title="読み込み中..." showBack={true}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">献立を読み込んでいます...</p>
          </div>
        </div>
      </MobileLayout>
    );
  }
  
  if (!meal) {
    return (
      <MobileLayout title="エラー" showBack={true}>
        <div className="flex items-center justify-center h-full px-4">
          <div className="text-center">
            <p className="text-gray-600 mb-4">献立が見つかりませんでした</p>
            <button
              onClick={() => router.push('/')}
              className="text-primary-500 font-medium"
            >
              ホームへ戻る
            </button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="献立結果" showBack={true} showMenu={true}>
      <MealResult meal={meal} />
    </MobileLayout>
  );
}
