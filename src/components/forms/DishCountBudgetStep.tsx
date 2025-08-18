'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Utensils, DollarSign } from 'lucide-react';
import { useMealFormStore } from '@/lib/store';

export default function DishCountBudgetStep() {
  const router = useRouter();
  const { formData, updateFormData } = useMealFormStore();
  const [numberOfDishes, setNumberOfDishes] = useState(formData.numberOfDishes || 3);
  const [budget, setBudget] = useState(formData.budget || 1000);
  
  const dishCountOptions = [
    { value: 1, label: '1品', description: 'シンプルに' },
    { value: 2, label: '2品', description: '主菜＋副菜' },
    { value: 3, label: '3品', description: '一汁二菜' },
    { value: 4, label: '4品', description: '充実の献立' },
    { value: 5, label: '5品', description: '豪華な食卓' },
  ];
  
  const budgetOptions = [
    { value: 500, label: '〜500円', description: '節約重視' },
    { value: 1000, label: '〜1,000円', description: '標準的' },
    { value: 1500, label: '〜1,500円', description: 'ちょっと贅沢' },
    { value: 2000, label: '〜2,000円', description: '特別な日' },
    { value: 9999, label: '予算なし', description: 'こだわり重視' },
  ];
  
  const handleNext = () => {
    updateFormData({ numberOfDishes, budget });
    router.push('/meal-form/7');
  };
  
  const handleBack = () => {
    router.push('/meal-form/5');
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
            品数と予算を設定
          </h2>
          <p className="text-gray-600">
            献立の品数と予算を教えてください
          </p>
        </motion.div>
        
        {/* 品数選択 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center mb-4">
            <Utensils className="w-5 h-5 text-gray-700 mr-2" />
            <h3 className="font-semibold text-gray-900">品数</h3>
          </div>
          
          <div className="space-y-2">
            {dishCountOptions.map((option) => (
              <Card
                key={option.value}
                variant="bordered"
                selected={numberOfDishes === option.value}
                onClick={() => setNumberOfDishes(option.value)}
                className="p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                      numberOfDishes === option.value
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <span className="font-bold">{option.value}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {option.label}
                      </p>
                      <p className="text-xs text-gray-600">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    numberOfDishes === option.value
                      ? 'border-primary-500 bg-primary-500' 
                      : 'border-gray-300'
                  }`}>
                    {numberOfDishes === option.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-full h-full rounded-full bg-white flex items-center justify-center"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                      </motion.div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
        
        {/* 予算選択 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center mb-4">
            <DollarSign className="w-5 h-5 text-gray-700 mr-2" />
            <h3 className="font-semibold text-gray-900">
              予算（{formData.servings || 2}人分）
            </h3>
          </div>
          
          <div className="space-y-2">
            {budgetOptions.map((option) => (
              <Card
                key={option.value}
                variant="bordered"
                selected={budget === option.value}
                onClick={() => setBudget(option.value)}
                className="p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {option.label}
                    </p>
                    <p className="text-xs text-gray-600">
                      {option.description}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    budget === option.value
                      ? 'border-primary-500 bg-primary-500' 
                      : 'border-gray-300'
                  }`}>
                    {budget === option.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-full h-full rounded-full bg-white flex items-center justify-center"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                      </motion.div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>
      </div>
      
      <div className="px-4 pb-8 thumb-zone">
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
