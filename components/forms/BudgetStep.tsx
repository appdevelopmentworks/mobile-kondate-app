'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMealStore } from '../../lib/store';
import { motion } from 'framer-motion';
import { ChevronRight, Utensils, Wallet, ChefHat } from 'lucide-react';

const dishCountOptions = [
  { value: 1, label: '1品', description: 'メイン料理のみ' },
  { value: 2, label: '2品', description: 'メイン + 副菜' },
  { value: 3, label: '3品', description: 'メイン + 副菜 + 汁物' },
  { value: 4, label: '4品以上', description: 'しっかり定食スタイル' },
];

const budgetOptions = [
  {
    value: 'economy',
    label: '節約重視',
    description: '〜500円/人',
    color: 'from-green-400 to-emerald-400',
  },
  {
    value: 'standard',
    label: '標準',
    description: '500〜800円/人',
    color: 'from-blue-400 to-cyan-400',
  },
  {
    value: 'premium',
    label: 'ちょっと豪華',
    description: '800円〜/人',
    color: 'from-purple-400 to-pink-400',
  },
];

const difficultyOptions = [
  {
    value: 'easy',
    label: '簡単',
    description: '初心者でも安心',
    icon: '🟢',
  },
  {
    value: 'medium',
    label: '普通',
    description: '少し手間をかけて',
    icon: '🟡',
  },
  {
    value: 'any',
    label: 'おまかせ',
    description: '難易度は気にしない',
    icon: '⭐',
  },
];

export default function BudgetStep() {
  const router = useRouter();
  const { formData, updateFormData } = useMealStore();
  const [dishCount, setDishCount] = useState(formData.dishCount || 3);
  const [budget, setBudget] = useState(formData.budget || 'standard');
  const [difficulty, setDifficulty] = useState(formData.difficulty || 'easy');

  // フォームデータが変更された時にローカル状態も更新
  useEffect(() => {
    if (formData.dishCount !== undefined && formData.dishCount !== dishCount) {
      setDishCount(formData.dishCount);
    }
    if (formData.budget && formData.budget !== budget) {
      setBudget(formData.budget);
    }
    if (formData.difficulty && formData.difficulty !== difficulty) {
      setDifficulty(formData.difficulty);
    }
  }, [formData.dishCount, formData.budget, formData.difficulty]);

  const handleDishCountChange = (value: number) => {
    console.log('品数選択:', value);
    setDishCount(value);
    updateFormData({ dishCount: value });
  };

  const handleBudgetChange = (value: string) => {
    console.log('予算選択:', value);
    setBudget(value as any);
    updateFormData({ budget: value });
  };

  const handleDifficultyChange = (value: string) => {
    console.log('難易度選択:', value);
    setDifficulty(value as any);
    updateFormData({ difficulty: value });
  };

  const handleNext = () => {
    console.log('次へボタンクリック - 設定内容:', { dishCount, budget, difficulty });
    updateFormData({ dishCount, budget, difficulty });
    router.push('/meal-form/7');
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
              品数・予算・難易度を教えてください
            </h2>
            <p className="text-sm text-gray-600">
              ご希望に合わせて献立を調整します
            </p>
          </div>

          {/* デバッグ情報 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              品数: {dishCount}, 予算: {budget}, 難易度: {difficulty}
            </p>
          </div>

          {/* 品数選択 */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-4">
              <Utensils className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-800">品数</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {dishCountOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleDishCountChange(option.value)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    dishCount === option.value
                      ? 'border-orange-500 bg-orange-100 ring-2 ring-orange-300 ring-opacity-50 transform scale-105'
                      : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50'
                  }`}
                >
                  <div className="text-center relative">
                    {dishCount === option.value && (
                      <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                    )}
                    <p className={`font-semibold mb-1 ${
                      dishCount === option.value ? 'text-orange-800' : 'text-gray-800'
                    }`}>
                      {option.label}
                      {dishCount === option.value && <span className="ml-1">🎯</span>}
                    </p>
                    <p className="text-xs text-gray-600">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 予算選択 */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-gray-800">予算（1人あたり）</h3>
            </div>
            
            <div className="space-y-3">
              {budgetOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleBudgetChange(option.value)}
                  className={`w-full rounded-xl overflow-hidden transition-all duration-200 shadow-sm relative ${
                    budget === option.value 
                      ? 'ring-4 ring-pink-400 ring-opacity-50 transform scale-105' 
                      : 'hover:shadow-md hover:scale-102'
                  }`}
                >
                  {/* 選択インジケーター */}
                  {budget === option.value && (
                    <div className="absolute top-2 right-2 bg-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg z-10">
                      ✓
                    </div>
                  )}
                  
                  <div className={`bg-gradient-to-r ${option.color} p-4 ${
                    budget === option.value ? 'bg-opacity-100' : 'bg-opacity-90'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="font-semibold text-white">
                          {option.label}
                          {budget === option.value && <span className="ml-2">🎯</span>}
                        </p>
                        <p className="text-white/90 text-sm">{option.description}</p>
                      </div>
                      <div className={`text-white text-2xl transition-all duration-200 ${
                        budget === option.value ? 'scale-125 rotate-12' : 'scale-100'
                      }`}>
                        {budget === option.value ? '✓' : '→'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 難易度選択 */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-4">
              <ChefHat className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-gray-800">調理の難易度</h3>
            </div>
            
            <div className="space-y-3">
              {difficultyOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleDifficultyChange(option.value)}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                    difficulty === option.value
                      ? 'border-purple-500 bg-purple-100 ring-2 ring-purple-300 ring-opacity-50 transform scale-105'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <div className="flex items-center gap-3 relative">
                    {difficulty === option.value && (
                      <div className="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                    )}
                    <span className="text-xl">{option.icon}</span>
                    <div className="text-left flex-1">
                      <p className={`font-semibold ${
                        difficulty === option.value ? 'text-purple-800' : 'text-gray-800'
                      }`}>
                        {option.label}
                        {difficulty === option.value && <span className="ml-2">🎯</span>}
                      </p>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                    <div className={`text-gray-400 text-xl transition-all duration-200 ${
                      difficulty === option.value ? 'text-purple-500 scale-125' : ''
                    }`}>
                      {difficulty === option.value ? '✓' : ''}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* サマリー */}
          <div className="bg-pink-50 rounded-2xl p-4">
            <h3 className="font-semibold text-gray-800 mb-2 text-sm">
              📋 設定サマリー
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>品数：{dishCountOptions.find(d => d.value === dishCount)?.label} ✓</p>
              <p>予算：{budgetOptions.find(b => b.value === budget)?.label} ✓</p>
              <p>難易度：{difficultyOptions.find(d => d.value === difficulty)?.label} ✓</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 次へボタン */}
      <div className="px-4 py-4 bg-white border-t border-gray-100">
        <button
          onClick={handleNext}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <span>次へ</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
