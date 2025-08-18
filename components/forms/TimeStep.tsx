'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMealStore } from '../../lib/store';
import { motion } from 'framer-motion';
import { Users, Clock, ChevronRight } from 'lucide-react';

export default function TimeStep() {
  const router = useRouter();
  const { formData, updateFormData } = useMealStore();
  const [servings, setServings] = useState(formData.servings || 2);
  const [cookingTime, setCookingTime] = useState(formData.cookingTime || '30');

  const handleNext = () => {
    updateFormData({ servings, cookingTime: cookingTime as any });
    router.push('/meal-form/3');
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
              人数と調理時間を教えてください
            </h2>
            <p className="text-sm text-gray-600">
              何人分作りますか？どのくらい時間がありますか？
            </p>
          </div>

          {/* 人数選択 */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-800">人数</h3>
            </div>
            
            <div className="flex justify-between items-center">
              <button
                onClick={() => setServings(Math.max(1, servings - 1))}
                className="touch-target w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
              >
                <span className="text-2xl text-gray-600">−</span>
              </button>
              
              <div className="text-center">
                <span className="text-3xl font-bold text-gray-800">{servings}</span>
                <p className="text-sm text-gray-600">人分</p>
              </div>
              
              <button
                onClick={() => setServings(Math.min(8, servings + 1))}
                className="touch-target w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
              >
                <span className="text-2xl text-gray-600">＋</span>
              </button>
            </div>
          </div>

          {/* 調理時間選択 */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-800">調理時間</h3>
            </div>
            
            <div className="space-y-3">
              {[
                { value: '30', label: '30分以内', description: 'サッと作れる簡単料理' },
                { value: '60', label: '1時間以内', description: 'しっかり作る定番料理' },
                { value: 'unlimited', label: 'じっくり', description: '時間をかけて丁寧に' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setCookingTime(option.value)}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    cookingTime === option.value
                      ? 'border-orange-400 bg-orange-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-medium text-gray-800">{option.label}</p>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  </div>
                </button>
              ))}
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
