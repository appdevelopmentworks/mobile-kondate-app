'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMealStore } from '../../lib/store';
import { motion } from 'framer-motion';
import { Plus, X, ChevronRight, AlertTriangle, Home } from 'lucide-react';
import { allergyItems, commonIngredients } from '../../lib/sample-data';

export default function AvoidIngredientsStep() {
  const router = useRouter();
  const { formData, updateFormData } = useMealStore();
  const [avoidIngredients, setAvoidIngredients] = useState<string[]>(
    formData.avoidIngredients || []
  );
  const [allergies, setAllergies] = useState<string[]>(
    formData.allergies || []
  );
  const [customIngredient, setCustomIngredient] = useState('');
  const [activeTab, setActiveTab] = useState<'avoid' | 'allergy'>('avoid');

  const toggleAvoidIngredient = (ingredient: string) => {
    setAvoidIngredients((prev) =>
      prev.includes(ingredient)
        ? prev.filter((i) => i !== ingredient)
        : [...prev, ingredient]
    );
  };

  const toggleAllergy = (allergen: string) => {
    setAllergies((prev) =>
      prev.includes(allergen)
        ? prev.filter((i) => i !== allergen)
        : [...prev, allergen]
    );
  };

  const addCustomIngredient = () => {
    if (customIngredient) {
      if (activeTab === 'avoid' && !avoidIngredients.includes(customIngredient)) {
        setAvoidIngredients([...avoidIngredients, customIngredient]);
      } else if (activeTab === 'allergy' && !allergies.includes(customIngredient)) {
        setAllergies([...allergies, customIngredient]);
      }
      setCustomIngredient('');
    }
  };

  const handleNext = () => {
    updateFormData({ avoidIngredients, allergies });
    router.push('/meal-form/5');
  };

  const handleSkip = () => {
    updateFormData({ avoidIngredients: [], allergies: [] });
    router.push('/meal-form/5');
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
              避けたい食材やアレルギーはありますか？
            </h2>
            <p className="text-sm text-gray-600">
              苦手な食材やアレルギー物質をお選びください
            </p>
          </div>

          {/* タブ切り替え */}
          <div className="bg-white rounded-2xl shadow-md p-1 mb-4">
            <div className="flex">
              <button
                onClick={() => setActiveTab('avoid')}
                className={`flex-1 py-3 px-4 rounded-xl transition-all ${
                  activeTab === 'avoid'
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                避けたい食材
              </button>
              <button
                onClick={() => setActiveTab('allergy')}
                className={`flex-1 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-1 ${
                  activeTab === 'allergy'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                アレルギー
              </button>
            </div>
          </div>

          {/* カスタム入力 */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={customIngredient}
                onChange={(e) => setCustomIngredient(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomIngredient()}
                placeholder={
                  activeTab === 'avoid' 
                    ? "避けたい食材を入力..." 
                    : "アレルギー物質を入力..."
                }
                className="input flex-1"
              />
              <button
                onClick={addCustomIngredient}
                className="btn-secondary px-4"
                disabled={!customIngredient}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 選択された項目 */}
          {((activeTab === 'avoid' && avoidIngredients.length > 0) ||
            (activeTab === 'allergy' && allergies.length > 0)) && (
            <div className={`${
              activeTab === 'avoid' ? 'bg-orange-50' : 'bg-red-50'
            } rounded-2xl p-4`}>
              <h3 className="font-semibold text-gray-800 mb-3">
                {activeTab === 'avoid' ? '避ける食材' : 'アレルギー物質'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {(activeTab === 'avoid' ? avoidIngredients : allergies).map((item) => (
                  <motion.button
                    key={item}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() =>
                      activeTab === 'avoid'
                        ? toggleAvoidIngredient(item)
                        : toggleAllergy(item)
                    }
                    className={`chip chip-selected flex items-center gap-1 ${
                      activeTab === 'allergy' ? 'bg-red-600' : ''
                    }`}
                  >
                    <span>{item}</span>
                    <X className="w-4 h-4" />
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* 選択肢リスト */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            <h3 className="font-semibold text-gray-800 mb-3">
              {activeTab === 'avoid' ? 'よくある苦手食材' : 'アレルギー物質'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {(activeTab === 'avoid' ? commonIngredients : allergyItems).map((item, index) => (
                <motion.button
                  key={item}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() =>
                    activeTab === 'avoid'
                      ? toggleAvoidIngredient(item)
                      : toggleAllergy(item)
                  }
                  className={`chip ${
                    (activeTab === 'avoid' ? avoidIngredients : allergies).includes(item)
                      ? activeTab === 'avoid' 
                        ? 'chip-selected' 
                        : 'bg-red-600 text-white'
                      : ''
                  }`}
                >
                  {item}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ボタンエリア */}
      <div className="px-4 py-4 bg-white border-t border-gray-100 space-y-3">
        {/* 次へボタン */}
        <button
          onClick={handleNext}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <span>次へ</span>
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* スキップボタン */}
        <button
          onClick={handleSkip}
          className="w-full py-3 text-gray-600 font-medium hover:text-gray-800 transition-colors"
        >
          スキップ
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
