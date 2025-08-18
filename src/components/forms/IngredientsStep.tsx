'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import { Search, X } from 'lucide-react';
import { useMealFormStore } from '@/lib/store';
import { commonIngredients, seasonalIngredients } from '@/lib/sample-data';
import { getCurrentSeason } from '@/lib/utils';

export default function IngredientsStep() {
  const router = useRouter();
  const { formData, updateFormData } = useMealFormStore();
  const [selected, setSelected] = useState<string[]>(formData.mainIngredients || []);
  const [customInput, setCustomInput] = useState('');
  const [activeCategory, setActiveCategory] = useState('野菜');
  
  const season = getCurrentSeason();
  const categories = ['野菜', '肉類', '魚介類', 'その他', '季節'];
  
  const handleToggle = (ingredient: string) => {
    if (selected.includes(ingredient)) {
      setSelected(selected.filter(i => i !== ingredient));
    } else {
      if (selected.length < 10) {
        setSelected([...selected, ingredient]);
      }
    }
  };
  
  const handleAddCustom = () => {
    if (customInput.trim() && !selected.includes(customInput.trim())) {
      if (selected.length < 10) {
        setSelected([...selected, customInput.trim()]);
        setCustomInput('');
      }
    }
  };
  
  const handleRemove = (ingredient: string) => {
    setSelected(selected.filter(i => i !== ingredient));
  };
  
  const handleNext = () => {
    updateFormData({ mainIngredients: selected });
    router.push('/meal-form/4');
  };
  
  const handleBack = () => {
    router.push('/meal-form/2');
  };
  
  const handleSkip = () => {
    updateFormData({ mainIngredients: [] });
    router.push('/meal-form/4');
  };
  
  const getIngredientsList = () => {
    if (activeCategory === '季節') {
      return seasonalIngredients[season] || [];
    }
    return commonIngredients[activeCategory as keyof typeof commonIngredients] || [];
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
            使いたい食材を選んでください
          </h2>
          <p className="text-gray-600">
            最大10個まで選択できます（{selected.length}/10）
          </p>
        </motion.div>
        
        {/* 選択済み食材 */}
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            <div className="flex flex-wrap gap-2">
              {selected.map((ingredient) => (
                <motion.span
                  key={ingredient}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm"
                >
                  {ingredient}
                  <button
                    onClick={() => handleRemove(ingredient)}
                    className="ml-2 touch-target"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* カスタム入力 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCustom();
                  }
                }}
                placeholder="食材を入力"
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
              />
            </div>
            <Button
              variant="primary"
              onClick={handleAddCustom}
              disabled={!customInput.trim() || selected.length >= 10}
            >
              追加
            </Button>
          </div>
        </motion.div>
        
        {/* カテゴリータブ */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                activeCategory === category
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {category === '季節' ? `${season}の食材` : category}
            </button>
          ))}
        </div>
        
        {/* 食材チップ */}
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-2"
        >
          {getIngredientsList().map((ingredient) => {
            const isSelected = selected.includes(ingredient);
            return (
              <motion.button
                key={ingredient}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleToggle(ingredient)}
                disabled={!isSelected && selected.length >= 10}
                className={`px-4 py-2 rounded-full transition-colors ${
                  isSelected
                    ? 'bg-primary-500 text-white'
                    : selected.length >= 10
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {ingredient}
              </motion.button>
            );
          })}
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
