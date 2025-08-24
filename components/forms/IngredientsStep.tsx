'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMealStore } from '../../lib/store';
import { motion } from 'framer-motion';
import { Plus, X, ChevronRight, Home, Camera } from 'lucide-react';
import { commonIngredients } from '../../lib/sample-data';
import ImprovedCameraComponent from '../camera/ImprovedCameraComponent';
// import CameraIngredientRecognition from '../camera/CameraIngredientRecognition';

export default function IngredientsStep() {
  const router = useRouter();
  const { formData, updateFormData } = useMealStore();
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(
    formData.ingredients || []
  );
  const [customIngredient, setCustomIngredient] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const toggleIngredient = (ingredient: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(ingredient)
        ? prev.filter((i) => i !== ingredient)
        : [...prev, ingredient]
    );
  };

  const addCustomIngredient = () => {
    if (customIngredient && !selectedIngredients.includes(customIngredient)) {
      setSelectedIngredients([...selectedIngredients, customIngredient]);
      setCustomIngredient('');
    }
  };

  const handleCameraRecognition = (ingredientsOrImageData: string[] | string) => {
    console.log('🍅 食材認識結果:', ingredientsOrImageData);
    
    // Handle both string array (manual input) and string (image data)  
    const recognizedIngredients = Array.isArray(ingredientsOrImageData) ? ingredientsOrImageData : [];
    
    // 重複を避けながら認識された食材を追加
    const newIngredients = recognizedIngredients.filter(
      (ingredient) => !selectedIngredients.includes(ingredient)
    );
    
    if (newIngredients.length > 0) {
      setSelectedIngredients((prev) => [...prev, ...newIngredients]);
      console.log('✅ 新しい食材を追加:', newIngredients);
    }
    
    setIsCameraOpen(false);
  };

  const handleNext = () => {
    updateFormData({ ingredients: selectedIngredients });
    router.push('/meal-form/4');
  };

  const handleSkip = () => {
    updateFormData({ ingredients: [] });
    router.push('/meal-form/4');
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
          <div className="text-center mb-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              使いたい食材はありますか？
            </h2>
            <p className="text-sm text-gray-600">
              冷蔵庫にある食材や使いたい食材を選んでください
            </p>
          </div>

          {/* カスタム入力とカメラボタン */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={customIngredient}
                onChange={(e) => setCustomIngredient(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomIngredient()}
                placeholder="食材を入力..."
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
            
            {/* カメラで食材認識ボタン */}
            <div className="space-y-2">
              <button
                onClick={() => setIsCameraOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 active:scale-95 transition-all duration-200 shadow-lg"
              >
                <Camera className="w-5 h-5" />
                <span>📸 食材を撮影して認識</span>
              </button>
            </div>
          </div>

          {/* 選択された食材 */}
          {selectedIngredients.length > 0 && (
            <div className="bg-orange-50/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
              <h3 className="font-semibold text-gray-800 mb-3">選択中の食材</h3>
              <div className="flex flex-wrap gap-2">
                {selectedIngredients.map((ingredient) => (
                  <motion.button
                    key={ingredient}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => toggleIngredient(ingredient)}
                    className="chip chip-selected flex items-center gap-1"
                  >
                    <span>{ingredient}</span>
                    <X className="w-4 h-4" />
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* よく使う食材 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">よく使う食材</h3>
            <div className="flex flex-wrap gap-2">
              {commonIngredients.map((ingredient, index) => (
                <motion.button
                  key={ingredient}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => toggleIngredient(ingredient)}
                  className={`chip ${
                    selectedIngredients.includes(ingredient) ? 'chip-selected' : ''
                  }`}
                >
                  {ingredient}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ボタンエリア */}
      <div className="px-4 py-4 bg-white/95 backdrop-blur-sm border-t border-white/30 space-y-3">
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
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white/90 backdrop-blur-sm text-gray-700 font-medium rounded-2xl hover:bg-white active:scale-95 transition-all duration-200 shadow-md"
        >
          <Home className="w-5 h-5" />
          <span>ホームに戻る</span>
        </button>
      </div>
      {/* 改善されたカメラ機能（食材認識統合） */}
      <ImprovedCameraComponent
        isOpen={isCameraOpen}
        onIngredientsRecognized={handleCameraRecognition}
        onClose={() => setIsCameraOpen(false)}
        showTutorial={false}
      />
      
      {/* 元のカメラ食材認識モーダル（一時的にコメントアウト） */}
      {/*
      <CameraIngredientRecognition
        isOpen={isCameraOpen}
        onIngredientsRecognized={handleCameraRecognition}
        onClose={() => setIsCameraOpen(false)}
      />
      */}
    </div>
  );
}
