'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Sun, Coffee, Sunset, Package, Users } from 'lucide-react';
import { useMealFormStore } from '@/lib/store';
import { MealType } from '@/lib/types';

export default function MealTypeStep() {
  const router = useRouter();
  const { formData, updateFormData } = useMealFormStore();
  const [selected, setSelected] = useState<MealType | null>(formData.mealType || null);
  
  const mealTypes = [
    {
      type: '朝食' as MealType,
      icon: Sun,
      description: '一日の始まりに',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
    },
    {
      type: '昼食' as MealType,
      icon: Coffee,
      description: 'お昼のひととき',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      type: '夕食' as MealType,
      icon: Sunset,
      description: '家族の団らん',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      type: 'お弁当' as MealType,
      icon: Package,
      description: '持ち運びやすく',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      type: 'おもてなし' as MealType,
      icon: Users,
      description: '特別な日に',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
  ];
  
  const handleNext = () => {
    if (selected) {
      updateFormData({ mealType: selected });
      router.push('/meal-form/2');
    }
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
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
            どの食事を作りますか？
          </h2>
          <p className="text-gray-600">
            作りたい食事の種類を選んでください
          </p>
        </motion.div>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {mealTypes.map((meal) => {
            const Icon = meal.icon;
            const isSelected = selected === meal.type;
            
            return (
              <motion.div key={meal.type} variants={itemVariants}>
                <Card
                  variant="bordered"
                  selected={isSelected}
                  onClick={() => setSelected(meal.type)}
                  className="p-4"
                >
                  <div className="flex items-center">
                    <div className={`w-14 h-14 rounded-xl ${meal.bgColor} flex items-center justify-center mr-4`}>
                      <Icon className={`w-8 h-8 ${meal.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {meal.type}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {meal.description}
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
              </motion.div>
            );
          })}
        </motion.div>
      </div>
      
      <div className="px-4 pb-8 thumb-zone">
        <Button
          variant="primary"
          size="large"
          fullWidth
          onClick={handleNext}
          disabled={!selected}
        >
          次へ進む
        </Button>
      </div>
    </>
  );
}
