'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Heart, Zap, Scale, Leaf, ChefHat, Star, Award } from 'lucide-react';
import { useMealFormStore } from '@/lib/store';
import { Difficulty } from '@/lib/types';

export default function NutritionDifficultyStep() {
  const router = useRouter();
  const { formData, updateFormData } = useMealFormStore();
  const [nutritionFocus, setNutritionFocus] = useState<
    '高タンパク' | '低カロリー' | 'バランス重視' | '野菜多め' | undefined
  >(formData.nutritionFocus);
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>(
    formData.difficulty
  );
  
  const nutritionOptions = [
    {
      value: '高タンパク' as const,
      label: '高タンパク',
      description: '筋トレ・ダイエット向け',
      icon: Zap,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      value: '低カロリー' as const,
      label: '低カロリー',
      description: 'ヘルシー志向',
      icon: Heart,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
    {
      value: 'バランス重視' as const,
      label: 'バランス重視',
      description: '栄養バランス良く',
      icon: Scale,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      value: '野菜多め' as const,
      label: '野菜多め',
      description: '野菜をたっぷり',
      icon: Leaf,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
    },
  ];
  
  const difficultyOptions = [
    {
      value: '簡単' as Difficulty,
      label: '簡単',
      description: '料理初心者でもOK',
      icon: ChefHat,
      color: 'text-green-500',
    },
    {
      value: '普通' as Difficulty,
      label: '普通',
      description: '基本的な調理技術',
      icon: Star,
      color: 'text-yellow-500',
    },
    {
      value: '本格的' as Difficulty,
      label: '本格的',
      description: 'こだわりの本格料理',
      icon: Award,
      color: 'text-purple-500',
    },
  ];
  
  const handleNext = () => {
    updateFormData({ nutritionFocus, difficulty });
    router.push('/meal-form/6');
  };
  
  const handleBack = () => {
    router.push('/meal-form/4');
  };
  
  const handleSkip = () => {
    updateFormData({ nutritionFocus: undefined, difficulty: undefined });
    router.push('/meal-form/6');
  };

  return (
    <>
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            栄養と調理の希望
          </h2>
          <p className="text-gray-600">
            栄養バランスと調理難易度を選んでください
          </p>
        </motion.div>
        
        {/* 栄養フォーカス */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h3 className="font-semibold text-gray-900 mb-4">栄養の重視ポイント</h3>
          <div className="grid grid-cols-2 gap-3">
            {nutritionOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = nutritionFocus === option.value;
              
              return (
                <motion.div
                  key={option.value}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card
                    variant="bordered"
                    selected={isSelected}
                    onClick={() => setNutritionFocus(
                      isSelected ? undefined : option.value
                    )}
                    className="p-4 h-full"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-12 h-12 rounded-full ${option.bgColor} flex items-center justify-center mb-2`}>
                        <Icon className={`w-6 h-6 ${option.color}`} />
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm mb-1">
                        {option.label}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {option.description}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
        
        {/* 調理難易度 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-semibold text-gray-900 mb-4">調理の難易度</h3>
          <div className="space-y-3">
            {difficultyOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = difficulty === option.value;
              
              return (
                <Card
                  key={option.value}
                  variant="bordered"
                  selected={isSelected}
                  onClick={() => setDifficulty(
                    isSelected ? undefined : option.value
                  )}
                  className="p-4"
                >
                  <div className="flex items-center">
                    <Icon className={`w-8 h-8 ${option.color} mr-4`} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {option.label}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {option.description}
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 ${
                      isSelected
                        ? 'border-primary-500 bg-primary-500' 
                        : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-full h-full rounded-full bg-white flex items-center justify-center"
                        >
                          <div className="w-2 h-2 rounded-full bg-primary-500" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </motion.div>
      </div>
      
      <div className="px-4 pb-8 thumb-zone">
        <div className="mb-3">
          <button
            onClick={handleSkip}
            className="w-full text-center text-gray-600 text-sm py-2"
          >
            スキップして次へ
          </button>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="large"
            onClick={handleBack}
            className="flex-1"
          >
            戻る
          </Button>
          <Button
            variant="primary"
            size="large"
            onClick={handleNext}
            className="flex-1"
          >
            次へ進む
          </Button>
        </div>
      </div>
    </>
  );
}
