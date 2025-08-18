'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Fish, Wheat, Droplet, AlertCircle } from 'lucide-react';
import { NutritionInfo as NutritionInfoType } from '@/lib/types';

interface NutritionInfoProps {
  nutrition: NutritionInfoType;
  showDetails?: boolean;
}

export default function NutritionInfo({ nutrition, showDetails = true }: NutritionInfoProps) {
  const nutritionItems = [
    {
      label: 'カロリー',
      value: nutrition.calories,
      unit: 'kcal',
      icon: Flame,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      percentage: (nutrition.calories / 600) * 100, // 1食600kcal基準
    },
    {
      label: 'タンパク質',
      value: nutrition.protein,
      unit: 'g',
      icon: Fish,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      percentage: (nutrition.protein / 25) * 100, // 1食25g基準
    },
    {
      label: '脂質',
      value: nutrition.fat,
      unit: 'g',
      icon: Droplet,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      percentage: (nutrition.fat / 20) * 100, // 1食20g基準
    },
    {
      label: '炭水化物',
      value: nutrition.carbs,
      unit: 'g',
      icon: Wheat,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      percentage: (nutrition.carbs / 80) * 100, // 1食80g基準
    },
  ];
  
  const saltLevel = nutrition.salt > 3 ? 'high' : nutrition.salt > 2 ? 'medium' : 'low';
  const saltColor = {
    high: 'text-red-600 bg-red-50',
    medium: 'text-yellow-600 bg-yellow-50',
    low: 'text-green-600 bg-green-50',
  }[saltLevel];

  return (
    <div className="mt-4">
      <h4 className="font-medium text-gray-900 mb-3">栄養情報</h4>
      
      {showDetails ? (
        <div className="space-y-3">
          {nutritionItems.map((item, index) => {
            const Icon = item.icon;
            
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-lg ${item.bgColor} flex items-center justify-center mr-3`}>
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <span className="text-sm text-gray-700">{item.label}</span>
                </div>
                
                <div className="flex items-center">
                  <div className="w-24 h-2 bg-gray-200 rounded-full mr-3 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full`}
                      style={{
                        background: `linear-gradient(to right, ${item.color.replace('text-', 'rgb(var(--tw-colors-')}.500))`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(item.percentage, 100)}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 min-w-[50px] text-right">
                    {item.value}{item.unit}
                  </span>
                </div>
              </motion.div>
            );
          })}
          
          {/* 塩分 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className={`flex items-center justify-between p-2 rounded-lg ${saltColor.split(' ')[1]}`}
          >
            <div className="flex items-center">
              <AlertCircle className={`w-4 h-4 mr-2 ${saltColor.split(' ')[0]}`} />
              <span className="text-sm font-medium text-gray-700">塩分</span>
            </div>
            <span className={`text-sm font-bold ${saltColor.split(' ')[0]}`}>
              {nutrition.salt}g
            </span>
          </motion.div>
        </div>
      ) : (
        // 簡易表示
        <div className="grid grid-cols-2 gap-2">
          {nutritionItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            
            return (
              <div
                key={item.label}
                className={`p-2 rounded-lg ${item.bgColor}`}
              >
                <div className="flex items-center mb-1">
                  <Icon className={`w-3 h-3 ${item.color} mr-1`} />
                  <span className="text-xs text-gray-600">{item.label}</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {item.value}{item.unit}
                </p>
              </div>
            );
          })}
        </div>
      )}
      
      {/* 栄養バランス評価 */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 p-3 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg"
        >
          <p className="text-sm font-medium text-gray-900 mb-1">
            栄養バランス評価
          </p>
          <div className="flex items-center">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-4 h-4 ${
                    star <= 4 ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="ml-2 text-xs text-gray-600">
              バランスの良い献立です
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
