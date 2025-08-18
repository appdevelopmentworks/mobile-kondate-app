'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Check, Edit2 } from 'lucide-react';
import { useMealFormStore, useUIStore } from '@/lib/store';
import { formatCookingTime } from '@/lib/utils';
import { sampleMealSuggestion } from '@/lib/sample-data';

export default function ConfirmStep() {
  const router = useRouter();
  const { formData, addToHistory } = useMealFormStore();
  const { setLoading } = useUIStore();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleEdit = (step: number) => {
    router.push(`/meal-form/${step}`);
  };
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    setLoading(true);
    
    // シミュレート API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // サンプルデータを使用（実際にはAPIから取得）
    const generatedMeal = {
      ...sampleMealSuggestion,
      id: `meal-${Date.now()}`,
      createdAt: new Date(),
      preference: formData as any,
    };
    
    addToHistory(generatedMeal);
    setIsGenerating(false);
    setLoading(false);
    
    // 結果画面へ遷移
    router.push(`/result?id=${generatedMeal.id}`);
  };
  
  const handleBack = () => {
    router.push('/meal-form/6');
  };
  
  const sections = [
    {
      title: '食事の種類',
      value: formData.mealType || '未設定',
      step: 1,
    },
    {
      title: '人数・時間',
      value: `${formData.servings || 2}人分 / ${formData.cookingTime || '未設定'}`,
      step: 2,
    },
    {
      title: '使いたい食材',
      value: formData.mainIngredients?.length 
        ? formData.mainIngredients.join('、')
        : 'なし',
      step: 3,
    },
    {
      title: '避けたい食材',
      value: [
        ...(formData.allergies || []),
        ...(formData.avoidIngredients || [])
      ].length > 0
        ? [...(formData.allergies || []), ...(formData.avoidIngredients || [])].join('、')
        : 'なし',
      step: 4,
    },
    {
      title: '栄養・難易度',
      value: [formData.nutritionFocus, formData.difficulty]
        .filter(Boolean)
        .join(' / ') || '指定なし',
      step: 5,
    },
    {
      title: '品数・予算',
      value: `${formData.numberOfDishes || 3}品 / ${
        formData.budget === 9999 ? '予算なし' : `〜${formData.budget}円`
      }`,
      step: 6,
    },
  ];

  return (
    <>
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            入力内容の確認
          </h2>
          <p className="text-gray-600">
            以下の内容で献立を作成します
          </p>
        </motion.div>
        
        {/* 確認リスト */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">
                      {section.title}
                    </p>
                    <p className="font-medium text-gray-900">
                      {section.value}
                    </p>
                  </div>
                  <button
                    onClick={() => handleEdit(section.step)}
                    className="touch-target flex items-center justify-center text-primary-500"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
        
        {/* 生成プレビュー */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card className="p-4 bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center mr-3">
                <Check className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">
                準備完了！
              </h3>
            </div>
            <p className="text-sm text-gray-700">
              入力された条件に基づいて、最適な献立をご提案します。
              栄養バランスを考慮した、おいしい和食献立をお楽しみください。
            </p>
          </Card>
        </motion.div>
      </div>
      
      <div className="px-4 pb-8 thumb-zone">
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="large"
            onClick={handleBack}
            className="flex-1"
            disabled={isGenerating}
          >
            戻る
          </Button>
          <Button
            variant="primary"
            size="large"
            onClick={handleGenerate}
            loading={isGenerating}
            className="flex-1"
          >
            {isGenerating ? '生成中...' : '献立を作成'}
          </Button>
        </div>
      </div>
    </>
  );
}
