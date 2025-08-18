'use client';

import { useRouter } from 'next/navigation';
import { useMealStore } from '../../lib/store';
import { motion } from 'framer-motion';
import { Sunrise, Sun, Moon, Package, PartyPopper, Home } from 'lucide-react';

const mealTypes = [
  { value: 'breakfast', label: '朝食', icon: Sunrise, color: 'from-yellow-400 to-orange-400' },
  { value: 'lunch', label: '昼食', icon: Sun, color: 'from-blue-400 to-cyan-400' },
  { value: 'dinner', label: '夕食', icon: Moon, color: 'from-indigo-500 to-blue-500' },
  { value: 'bento', label: 'お弁当', icon: Package, color: 'from-green-400 to-emerald-400' },
  { value: 'party', label: 'おもてなし', icon: PartyPopper, color: 'from-red-400 to-rose-400' },
];

export default function MealTypeStep() {
  const router = useRouter();
  const { formData, updateFormData } = useMealStore();

  const handleSelect = (value: string) => {
    updateFormData({ mealType: value as any });
    router.push('/meal-form/2');
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
          className="space-y-4"
        >
          <div className="text-center mb-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              どの食事の献立を作りますか？
            </h2>
            <p className="text-sm text-gray-600">
              作りたい食事の種類を選んでください
            </p>
          </div>

          <div className="space-y-3">
            {mealTypes.map((type, index) => {
              const Icon = type.icon;
              return (
                <motion.button
                  key={type.value}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSelect(type.value)}
                  className="w-full rounded-2xl shadow-md active:scale-95 transition-all duration-200 overflow-hidden"
                >
                  <div className={`bg-gradient-to-r ${type.color} p-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-white/20 rounded-full p-3">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-lg font-bold text-white">
                          {type.label}
                        </span>
                      </div>
                      <div className="text-white/80">
                        →
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ボタンエリア */}
      <div className="px-4 py-4 bg-white/95 backdrop-blur-sm border-t border-white/30 space-y-3">
        {/* ホームに戻るボタン */}
        <button
          onClick={handleGoHome}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white/90 backdrop-blur-sm text-gray-700 font-medium rounded-2xl hover:bg-white active:scale-95 transition-all duration-200 shadow-md"
        >
          <Home className="w-5 h-5" />
          <span>ホームに戻る</span>
        </button>
      </div>
    </div>
  );
}
