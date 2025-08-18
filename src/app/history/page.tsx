'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileLayout from '@/components/layout/MobileLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Flame, Users, Trash2, Calendar } from 'lucide-react';
import { useMealFormStore } from '@/lib/store';
import { formatCookingTime } from '@/lib/utils';

export default function HistoryPage() {
  const router = useRouter();
  const { history, clearHistory } = useMealFormStore();
  const [showConfirm, setShowConfirm] = useState(false);
  
  const handleClearHistory = () => {
    clearHistory();
    setShowConfirm(false);
  };
  
  const formatDate = (date: Date) => {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hour = d.getHours();
    const minute = d.getMinutes();
    
    return `${month}月${day}日 ${hour}:${minute.toString().padStart(2, '0')}`;
  };
  
  const groupByDate = (meals: typeof history) => {
    const grouped: Record<string, typeof history> = {};
    
    meals.forEach(meal => {
      const date = new Date(meal.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(meal);
    });
    
    return grouped;
  };
  
  const groupedHistory = groupByDate(history);
  const sortedDates = Object.keys(groupedHistory).sort().reverse();

  return (
    <MobileLayout title="履歴" showBack={true}>
      <div className="px-4 py-6">
        {history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Clock className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-600 text-center mb-6">
              まだ献立の履歴がありません
            </p>
            <Button
              variant="primary"
              onClick={() => router.push('/meal-form')}
            >
              献立を作成する
            </Button>
          </motion.div>
        ) : (
          <>
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  献立履歴
                </h2>
                <p className="text-sm text-gray-600">
                  全{history.length}件
                </p>
              </div>
              
              <Button
                variant="outline"
                size="small"
                onClick={() => setShowConfirm(true)}
                icon={<Trash2 className="w-4 h-4" />}
              >
                クリア
              </Button>
            </div>
            
            {/* 履歴リスト */}
            <div className="space-y-6">
              {sortedDates.map((dateKey) => {
                const meals = groupedHistory[dateKey];
                const [year, month, day] = dateKey.split('-');
                const displayDate = `${month}月${day}日`;
                
                return (
                  <div key={dateKey}>
                    <div className="flex items-center mb-3">
                      <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                      <h3 className="text-sm font-medium text-gray-700">
                        {displayDate}
                      </h3>
                    </div>
                    
                    <div className="space-y-3">
                      {meals.map((meal, index) => (
                        <motion.div
                          key={meal.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card
                            className="p-4"
                            onClick={() => router.push(`/result?id=${meal.id}`)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <span className="inline-block px-2 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-medium mb-2">
                                  {meal.preference.mealType}
                                </span>
                                <h4 className="font-medium text-gray-900 mb-1">
                                  {meal.title}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {meal.recipes.map(r => r.name).join('、')}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatCookingTime(meal.totalCookingTime)}
                              </span>
                              <span className="flex items-center">
                                <Flame className="w-3 h-3 mr-1" />
                                {meal.totalCalories}kcal
                              </span>
                              <span className="flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                {meal.preference.servings}人分
                              </span>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      
      {/* 確認ダイアログ */}
      <AnimatePresence>
        {showConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowConfirm(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-4 right-4 bottom-20 bg-white rounded-2xl p-6 z-50 shadow-xl"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                履歴をクリアしますか？
              </h3>
              <p className="text-gray-600 mb-6">
                すべての献立履歴が削除されます。この操作は取り消せません。
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button
                  variant="primary"
                  onClick={handleClearHistory}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                >
                  削除する
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
