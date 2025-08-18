'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMealStore } from '../../lib/store';
import { motion } from 'framer-motion';
import { ChevronRight, Heart, Beef, Leaf, Feather, Home } from 'lucide-react';

const nutritionOptions = [
  {
    value: 'balanced',
    label: 'バランス重視',
    icon: Heart,
    color: 'from-green-400 to-emerald-400',
    description: '栄養バランスの取れた食事',
    details: 'タンパク質、炭水化物、脂質をバランスよく',
  },
  {
    value: 'protein',
    label: 'タンパク質多め',
    icon: Beef,
    color: 'from-red-400 to-rose-400',
    description: 'お肉や魚を中心とした食事',
    details: '筋トレやダイエット中におすすめ',
  },
  {
    value: 'vegetable',
    label: '野菜中心',
    icon: Leaf,
    color: 'from-green-500 to-lime-400',
    description: '野菜たっぷりヘルシー',
    details: 'ビタミン・ミネラル・食物繊維が豊富',
  },
  {
    value: 'light',
    label: 'あっさり・軽め',
    icon: Feather,
    color: 'from-blue-400 to-cyan-400',
    description: '消化に優しい軽やかな食事',
    details: '胃腸に優しく、カロリー控えめ',
  },
];

export default function NutritionStep() {
  const router = useRouter();
  const { formData, updateFormData } = useMealStore();
  const [nutritionBalance, setNutritionBalance] = useState(
    formData.nutritionBalance || 'balanced'
  );

  // フォームデータが変更された時にローカル状態も更新
  useEffect(() => {
    if (formData.nutritionBalance && formData.nutritionBalance !== nutritionBalance) {
      setNutritionBalance(formData.nutritionBalance);
    }
  }, [formData.nutritionBalance]);

  const handleSelect = (value: string) => {
    setNutritionBalance(value as any);
    // 即座にストアも更新
    updateFormData({ nutritionBalance: value });
  };

  const handleNext = () => {
    updateFormData({ nutritionBalance });
    router.push('/meal-form/6');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              どのような栄養バランスをお望みですか？
            </h2>
            <p className="text-sm text-gray-600">
              健康目標や体調に合わせてお選びください
            </p>
          </div>

          <div className="space-y-4">
            {nutritionOptions.map((option, index) => {
              const Icon = option.icon;
              const isSelected = nutritionBalance === option.value;
              
              return (
                <motion.button
                  key={option.value}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full rounded-2xl shadow-md transition-all duration-300 overflow-hidden relative ${
                    isSelected 
                      ? 'ring-4 ring-pink-500 ring-opacity-70 transform scale-105' 
                      : 'hover:shadow-lg hover:scale-102'
                  }`}
                >
                  {/* 選択インジケーター */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg z-10">
                      ✓
                    </div>
                  )}
                  
                  <div className={`bg-gradient-to-r ${option.color} p-6 ${
                    isSelected ? 'bg-opacity-100' : 'bg-opacity-90'
                  }`}>
                    <div className="flex items-start gap-4">
                      <div className={`rounded-full p-3 flex-shrink-0 ${
                        isSelected 
                          ? 'bg-white/40 ring-2 ring-white/60' 
                          : 'bg-white/20'
                      }`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className={`text-lg font-bold mb-1 ${
                          isSelected ? 'text-white' : 'text-white'
                        }`}>
                          {option.label}
                          {isSelected && <span className="ml-2 text-xl">🎯</span>}
                        </h3>
                        <p className="text-white/90 text-sm mb-2">
                          {option.description}
                        </p>
                        <p className="text-white/80 text-xs">
                          {option.details}
                        </p>
                      </div>
                      <div className={`text-white transition-all duration-200 text-2xl ${
                        isSelected ? 'scale-125 rotate-12' : 'scale-100'
                      }`}>
                        {isSelected ? '✓' : '→'}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* 補足情報 */}
          <div className="bg-gray-50 rounded-2xl p-4 mt-6">
            <h3 className="font-semibold text-gray-800 mb-2 text-sm">
              💡 ワンポイントアドバイス
            </h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• バランス重視：毎日の基本の食事におすすめ</p>
              <p>• タンパク質多め：運動後や筋力アップを目指す方に</p>
              <p>• 野菜中心：野菜不足解消や美容を意識される方に</p>
              <p>• あっさり・軽め：胃腸が疲れている時や夜遅い食事に</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ボタンエリア */}
      <div className="px-4 py-4 bg-white border-t border-gray-100 space-y-3">
        {/* 次へボタン */}
        <button
          onClick={handleNext}
          className="btn-primary w-full flex items-center justify-center gap-2 relative overflow-hidden"
        >
          <span>次へ</span>
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* ホームに戻るボタン */}
        <button
          onClick={handleGoHome}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-2xl hover:bg-gray-200 active:scale-95 transition-all duration-200"
        >
          <Home className="w-5 h-5" />
          <span>ホームに戻る</span>
        </button>
      </div>
    </div>
  );
}
