'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileLayout from '@/components/layout/MobileLayout';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Clock, 
  Users, 
  Heart,
  Loader2,
  Sun,
  Moon,
  Sunrise
} from 'lucide-react';

interface QuickPreferences {
  mealType: '朝食' | '昼食' | '夕食' | 'auto';
  servings: number;
  dietaryRestrictions: string[];
  preferredStyle: '和食' | '洋食' | '中華' | 'mixed';
}

export default function QuickMealPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<QuickPreferences>({
    mealType: 'auto',
    servings: 2,
    dietaryRestrictions: [],
    preferredStyle: '和食'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mealTypeOptions = [
    { value: 'auto' as const, label: '自動選択', icon: Sparkles, description: '時間に応じて自動で選択' },
    { value: '朝食' as const, label: '朝食', icon: Sunrise, description: '朝の時間にピッタリ' },
    { value: '昼食' as const, label: '昼食', icon: Sun, description: 'お昼の時間にピッタリ' },
    { value: '夕食' as const, label: '夕食', icon: Moon, description: '夜の時間にピッタリ' }
  ];

  const servingOptions = [1, 2, 3, 4, 5, 6];

  const dietaryOptions = [
    { value: 'vegetarian', label: 'ベジタリアン', emoji: '🥬' },
    { value: 'no-seafood', label: '魚介類なし', emoji: '🚫🐟' },
    { value: 'low-salt', label: '減塩', emoji: '🧂' },
    { value: 'low-calorie', label: 'ヘルシー', emoji: '🥗' }
  ];

  const styleOptions = [
    { value: '和食' as const, label: '和食', emoji: '🍱', description: '日本の伝統的な料理' },
    { value: '洋食' as const, label: '洋食', emoji: '🍝', description: '西洋風の料理' },
    { value: '中華' as const, label: '中華', emoji: '🥢', description: '中国風の料理' },
    { value: 'mixed' as const, label: 'ミックス', emoji: '🌍', description: '様々な国の料理' }
  ];

  const handleDietaryRestrictionToggle = (restriction: string) => {
    setPreferences(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction]
    }));
  };

  const handleGenerateMeal = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/meal-suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });

      if (!response.ok) {
        throw new Error('献立生成に失敗しました');
      }

      const mealData = await response.json();
      
      // 結果ページに遷移
      router.push(`/result?id=${mealData.id}&data=${encodeURIComponent(JSON.stringify(mealData))}`);
      
    } catch (error) {
      console.error('Error generating meal:', error);
      setError('献立の生成中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsGenerating(false);
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
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  return (
    <MobileLayout title="おまかせ献立" showBack={true}>
      <div className="px-4 py-6 bg-pattern-hearts min-h-screen">
        {/* ヘッダー */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="text-6xl mb-4 animate-bounce">✨</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-lavender-600 bg-clip-text text-transparent mb-2">
            おまかせ献立
          </h1>
          <p className="text-gray-600">
            簡単な設定で美味しい献立を提案します
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* 食事の種類 */}
          <motion.div variants={itemVariants} className="card-glass p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-primary-500" />
              食事の種類
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {mealTypeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setPreferences(prev => ({ ...prev, mealType: option.value }))}
                    className={`p-4 rounded-cute border-2 transition-all ${
                      preferences.mealType === option.value
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-gray-200 bg-white hover:border-primary-200'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${
                      preferences.mealType === option.value ? 'text-primary-500' : 'text-gray-400'
                    }`} />
                    <p className="text-sm font-medium text-gray-800">{option.label}</p>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* 人数 */}
          <motion.div variants={itemVariants} className="card-glass p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-primary-500" />
              人数
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {servingOptions.map((num) => (
                <button
                  key={num}
                  onClick={() => setPreferences(prev => ({ ...prev, servings: num }))}
                  className={`min-w-[60px] h-12 rounded-full font-bold transition-all ${
                    preferences.servings === num
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-primary-100'
                  }`}
                >
                  {num}人
                </button>
              ))}
            </div>
          </motion.div>

          {/* 料理のスタイル */}
          <motion.div variants={itemVariants} className="card-glass p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-primary-500" />
              料理のスタイル
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {styleOptions.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setPreferences(prev => ({ ...prev, preferredStyle: style.value }))}
                  className={`p-4 rounded-cute border-2 transition-all ${
                    preferences.preferredStyle === style.value
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-gray-200 bg-white hover:border-primary-200'
                  }`}
                >
                  <div className="text-2xl mb-2">{style.emoji}</div>
                  <p className="text-sm font-medium text-gray-800">{style.label}</p>
                  <p className="text-xs text-gray-500">{style.description}</p>
                </button>
              ))}
            </div>
          </motion.div>

          {/* 食事制限（オプション） */}
          <motion.div variants={itemVariants} className="card-glass p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              食事制限（オプション）
            </h2>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleDietaryRestrictionToggle(option.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    preferences.dietaryRestrictions.includes(option.value)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-primary-100'
                  }`}
                >
                  {option.emoji} {option.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* エラーメッセージ */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border border-red-200 rounded-cute p-4"
            >
              <p className="text-red-600 text-sm">{error}</p>
            </motion.div>
          )}

          {/* 生成ボタン */}
          <motion.div variants={itemVariants} className="pt-4">
            <button
              onClick={handleGenerateMeal}
              disabled={isGenerating}
              className="w-full btn-cute btn-primary-cute text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  献立を生成中...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Sparkles className="w-6 h-6 mr-2" />
                  おまかせ献立を作成
                </div>
              )}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </MobileLayout>
  );
}
