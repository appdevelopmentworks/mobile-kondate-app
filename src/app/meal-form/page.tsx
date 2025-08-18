'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import MobileLayout from '@/components/layout/MobileLayout';
import Button from '@/components/ui/Button';
import { ChefHat, Clock, Users, Utensils } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMealFormStore } from '@/lib/store';

export default function MealFormPage() {
  const router = useRouter();
  const { resetForm } = useMealFormStore();
  
  const handleStart = () => {
    resetForm();
    router.push('/meal-form/1');
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
    <MobileLayout title="献立作成" showBack={true}>
      <div className="flex flex-col h-full px-4 py-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex-1"
        >
          {/* ヘッダーイラスト */}
          <motion.div 
            variants={itemVariants}
            className="flex justify-center mb-8"
          >
            <div className="w-32 h-32 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
              <ChefHat className="w-16 h-16 text-white" />
            </div>
          </motion.div>
          
          {/* タイトル */}
          <motion.div variants={itemVariants} className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              あなただけの献立を作成
            </h1>
            <p className="text-gray-600">
              7つの質問に答えるだけで、
              <br />
              最適な献立をご提案します
            </p>
          </motion.div>
          
          {/* 特徴リスト */}
          <motion.div variants={itemVariants} className="space-y-4 mb-8">
            <div className="flex items-center bg-white rounded-xl p-4 shadow-sm">
              <Clock className="w-8 h-8 text-blue-500 mr-4" />
              <div>
                <p className="font-medium text-gray-900">時間に合わせて</p>
                <p className="text-sm text-gray-600">30分以内から本格料理まで</p>
              </div>
            </div>
            
            <div className="flex items-center bg-white rounded-xl p-4 shadow-sm">
              <Users className="w-8 h-8 text-green-500 mr-4" />
              <div>
                <p className="font-medium text-gray-900">人数に合わせて</p>
                <p className="text-sm text-gray-600">1人分から家族分まで対応</p>
              </div>
            </div>
            
            <div className="flex items-center bg-white rounded-xl p-4 shadow-sm">
              <Utensils className="w-8 h-8 text-orange-500 mr-4" />
              <div>
                <p className="font-medium text-gray-900">栄養バランス</p>
                <p className="text-sm text-gray-600">健康的でおいしい献立</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
        
        {/* 開始ボタン */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="thumb-zone"
        >
          <Button
            variant="primary"
            size="large"
            fullWidth
            onClick={handleStart}
          >
            献立作成を始める
          </Button>
        </motion.div>
      </div>
    </MobileLayout>
  );
}
