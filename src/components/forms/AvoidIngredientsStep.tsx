'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { AlertTriangle, X } from 'lucide-react';
import { useMealFormStore } from '@/lib/store';
import { allergyIngredients } from '@/lib/sample-data';

export default function AvoidIngredientsStep() {
  const router = useRouter();
  const { formData, updateFormData } = useMealFormStore();
  const [allergies, setAllergies] = useState<string[]>(formData.allergies || []);
  const [avoidIngredients, setAvoidIngredients] = useState<string[]>(
    formData.avoidIngredients || []
  );
  const [customInput, setCustomInput] = useState('');
  
  const commonAvoidIngredients = [
    'ピーマン', 'セロリ', 'パクチー', 'しいたけ', 'なす', 
    'トマト', 'ゴーヤ', 'レバー', '納豆', '生魚'
  ];
  
  const handleAllergyToggle = (allergy: string) => {
    if (allergies.includes(allergy)) {
      setAllergies(allergies.filter(a => a !== allergy));
    } else {
      setAllergies([...allergies, allergy]);
    }
  };
  
  const handleAvoidToggle = (ingredient: string) => {
    if (avoidIngredients.includes(ingredient)) {
      setAvoidIngredients(avoidIngredients.filter(i => i !== ingredient));
    } else {
      setAvoidIngredients([...avoidIngredients, ingredient]);
    }
  };
  
  const handleAddCustom = () => {
    if (customInput.trim() && !avoidIngredients.includes(customInput.trim())) {
      setAvoidIngredients([...avoidIngredients, customInput.trim()]);
      setCustomInput('');
    }
  };
  
  const handleRemove = (ingredient: string, type: 'allergy' | 'avoid') => {
    if (type === 'allergy') {
      setAllergies(allergies.filter(a => a !== ingredient));
    } else {
      setAvoidIngredients(avoidIngredients.filter(i => i !== ingredient));
    }
  };
  
  const handleNext = () => {
    updateFormData({ allergies, avoidIngredients });
    router.push('/meal-form/5');
  };
  
  const handleBack = () => {
    router.push('/meal-form/3');
  };
  
  const handleSkip = () => {
    updateFormData({ allergies: [], avoidIngredients: [] });
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
            避けたい食材はありますか？
          </h2>
          <p className="text-gray-600">
            アレルギーや苦手な食材を教えてください
          </p>
        </motion.div>
        
        {/* アレルギー警告 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900 mb-1">
                  アレルギーについて
                </p>
                <p className="text-xs text-yellow-700">
                  重篤なアレルギーをお持ちの場合は、必ず材料を確認してください
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
        
        {/* 選択済み */}
        {(allergies.length > 0 || avoidIngredients.length > 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            {allergies.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">アレルギー</p>
                <div className="flex flex-wrap gap-2">
                  {allergies.map((allergy) => (
                    <span
                      key={allergy}
                      className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm"
                    >
                      {allergy}
                      <button
                        onClick={() => handleRemove(allergy, 'allergy')}
                        className="ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {avoidIngredients.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">苦手な食材</p>
                <div className="flex flex-wrap gap-2">
                  {avoidIngredients.map((ingredient) => (
                    <span
                      key={ingredient}
                      className="inline-flex items-center px-3 py-1 rounded-full bg-gray-200 text-gray-700 text-sm"
                    >
                      {ingredient}
                      <button
                        onClick={() => handleRemove(ingredient, 'avoid')}
                        className="ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
        
        {/* アレルギー選択 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h3 className="font-semibold text-gray-900 mb-3">主なアレルギー</h3>
          <div className="flex flex-wrap gap-2">
            {allergyIngredients.map((allergy) => {
              const isSelected = allergies.includes(allergy);
              return (
                <motion.button
                  key={allergy}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAllergyToggle(allergy)}
                  className={`px-4 py-2 rounded-full transition-colors ${
                    isSelected
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {allergy}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
        
        {/* 苦手な食材 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <h3 className="font-semibold text-gray-900 mb-3">よくある苦手食材</h3>
          <div className="flex flex-wrap gap-2">
            {commonAvoidIngredients.map((ingredient) => {
              const isSelected = avoidIngredients.includes(ingredient);
              return (
                <motion.button
                  key={ingredient}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAvoidToggle(ingredient)}
                  className={`px-4 py-2 rounded-full transition-colors ${
                    isSelected
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {ingredient}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
        
        {/* カスタム入力 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="font-semibold text-gray-900 mb-3">その他の食材</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddCustom();
                }
              }}
              placeholder="避けたい食材を入力"
              className="flex-1 h-12 px-4 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
            />
            <Button
              variant="primary"
              onClick={handleAddCustom}
              disabled={!customInput.trim()}
            >
              追加
            </Button>
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
