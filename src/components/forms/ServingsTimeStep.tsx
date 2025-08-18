'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Users, Clock, Minus, Plus } from 'lucide-react';
import { useMealFormStore } from '@/lib/store';
import { CookingTime } from '@/lib/types';

export default function ServingsTimeStep() {
  const router = useRouter();
  const { formData, updateFormData } = useMealFormStore();
  const [servings, setServings] = useState(formData.servings || 2);
  const [cookingTime, setCookingTime] = useState<CookingTime | null>(
    formData.cookingTime || null
  );
  
  const handleServingsChange = (delta: number) => {
    const newValue = servings + delta;
    if (newValue >= 1 && newValue <= 10) {
      setServings(newValue);
    }
  };
  
  const cookingTimes = [
    {
      value: '30分以内' as CookingTime,
      label: '30分以内',
      description: '時短レシピ',
      icon: '⚡',
    },
    {
      value: '1時間' as CookingTime,
      label: '1時間程度',
      description: '標準的な調理',
      icon: '⏱️',
    },
    {
      value: 'じっくり' as CookingTime,
      label: 'じっくり',
      description: '本格的な料理',
      icon: '🍲',
    },
  ];
  
  const handleNext = () => {
    if (cookingTime) {
      updateFormData({ servings, cookingTime });
      router.push('/meal-form/3');
    }
  };
  
  const handleBack = () => {
    router.push('/meal-form/1');
  };

  return (
    <>
      <div className="flex-1 px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            人数と調理時間を教えてください
          </h2>
          <p className="text-gray-600">
            何人分を何分で作りますか？
          </p>
        </motion.div>
        
        {/* 人数選択 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center mb-4">
            <Users className="w-5 h-5 text-gray-700 mr-2" />
            <h3 className="font-semibold text-gray-900">人数</h3>
          </div>
          
          <Card className="p-6">
            <div className="flex items-center justify-center">
              <button
                onClick={() => handleServingsChange(-1)}
                disabled={servings <= 1}
                className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center touch-target disabled:opacity-30"
              >
                <Minus className="w-5 h-5" />
              </button>
              
              <div className="mx-8 text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {servings}
                </div>
                <div className="text-sm text-gray-600">人分</div>
              </div>
              
              <button
                onClick={() => handleServingsChange(1)}
                disabled={servings >= 10}
                className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center touch-target disabled:opacity-30"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </Card>
        </motion.div>
        
        {/* 調理時間選択 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center mb-4">
            <Clock className="w-5 h-5 text-gray-700 mr-2" />
            <h3 className="font-semibold text-gray-900">調理時間</h3>
          </div>
          
          <div className="space-y-3">
            {cookingTimes.map((time) => (
              <Card
                key={time.value}
                variant="bordered"
                selected={cookingTime === time.value}
                onClick={() => setCookingTime(time.value)}
                className="p-4"
              >
                <div className="flex items-center">
                  <div className="text-2xl mr-4">{time.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {time.label}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {time.description}
                    </p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 ${
                    cookingTime === time.value
                      ? 'border-primary-500 bg-primary-500' 
                      : 'border-gray-300'
                  }`}>
                    {cookingTime === time.value && (
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
            disabled={!cookingTime}
            className="flex-1"
          >
            次へ進む
          </Button>
        </div>
      </div>
    </>
  );
}
