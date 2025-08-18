'use client';

import { useRouter } from 'next/navigation';
import { useMealStore } from '../lib/store';
import MobileLayout from '../components/layout/MobileLayout';
import { motion } from 'framer-motion';
import { 
  ChefHat, 
  Zap, 
  Camera, 
  Clock, 
  Heart, 
  History, 
  ArrowRight,
  Star,
  Users,
  Flame 
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { history, resetForm } = useMealStore();

  const handleStartMealForm = () => {
    resetForm();
    router.push('/meal-form');
  };

  const handleQuickMeal = () => {
    resetForm();
    router.push('/meal-form/quick');
  };

  const handleCameraRecognition = () => {
    router.push('/camera-recognition');
  };

  const handleViewHistory = (mealId: string) => {
    // 履歴の詳細表示機能は後で実装
    console.log('履歴表示:', mealId);
  };

  return (
    <MobileLayout title="献立アプリ" showBack={false} showBottomNav={true}>
      <div className="px-4 py-6 space-y-6">
        {/* ウェルカムメッセージ */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
        >
          <div className="text-6xl mb-4">🍳</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            今日は何を作りましょう？
          </h1>
          <p className="text-gray-600">
            あなたにピッタリの献立を提案します
          </p>
        </motion.div>

        {/* メインアクション */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* 条件から作る */}
          <button
            onClick={handleStartMealForm}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white p-6 rounded-2xl shadow-lg active:scale-95 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="flex items-center gap-3 mb-2">
                  <ChefHat className="w-6 h-6" />
                  <h3 className="text-xl font-bold">条件から作る</h3>
                </div>
                <p className="text-white/90 text-sm">
                  食材・時間・人数を指定して献立を作成
                </p>
              </div>
              <ArrowRight className="w-6 h-6 text-white/80" />
            </div>
          </button>

          {/* おまかせ献立 */}
          <button
            onClick={handleQuickMeal}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-2xl shadow-lg active:scale-95 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-6 h-6" />
                  <h3 className="text-xl font-bold">おまかせ献立</h3>
                </div>
                <p className="text-white/90 text-sm">
                  今すぐ作れる献立を自動で提案
                </p>
              </div>
              <ArrowRight className="w-6 h-6 text-white/80" />
            </div>
          </button>

          {/* カメラで食材認識 */}
          <button
            onClick={handleCameraRecognition}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-6 rounded-2xl shadow-lg active:scale-95 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <div className="flex items-center gap-3 mb-2">
                  <Camera className="w-6 h-6" />
                  <h3 className="text-xl font-bold">カメラで食材認識</h3>
                </div>
                <p className="text-white/90 text-sm">
                  写真から食材を認識して献立提案
                </p>
              </div>
              <ArrowRight className="w-6 h-6 text-white/80" />
            </div>
          </button>
        </motion.div>

        {/* 最近の献立 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-800">最近の献立</h3>
          </div>
          
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.slice(0, 3).map((meal, index) => (
                <motion.button
                  key={meal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  onClick={() => handleViewHistory(meal.id)}
                  className="w-full bg-white/70 backdrop-blur-sm p-4 rounded-xl hover:bg-white/90 active:scale-95 transition-all duration-200 text-left shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 mb-1">{meal.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {meal.totalTime}分
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          {meal.totalCalories}kcal
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {meal.recipes.length}品
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </motion.button>
              ))}
              
              {history.length > 3 && (
                <p className="text-center text-gray-500 text-sm pt-2">
                  他 {history.length - 3} 件の履歴があります
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🍽️</div>
              <p className="text-gray-500 text-sm">まだ献立がありません</p>
              <p className="text-gray-400 text-xs mt-1">
                「条件から作る」で最初の献立を作ってみましょう
              </p>
            </div>
          )}
        </motion.div>

        {/* 今日のおすすめ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-yellow-100/90 to-orange-100/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-gray-800">今日のおすすめ</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span>🌱</span>
              <span>春野菜を使った料理がおすすめです</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span>⏰</span>
              <span>30分以内で作れる簡単料理が人気</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span>💰</span>
              <span>節約レシピで家計に優しく</span>
            </div>
          </div>
        </motion.div>

        {/* 底部スペース（ボトムナビのため） */}
        <div className="h-20"></div>
      </div>
    </MobileLayout>
  );
}
