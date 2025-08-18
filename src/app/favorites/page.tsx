'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import MobileLayout from '@/components/layout/MobileLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { Heart, Clock, Flame, Users } from 'lucide-react';
import { useMealFormStore } from '@/lib/store';
import { formatCookingTime } from '@/lib/utils';

export default function FavoritesPage() {
  const router = useRouter();
  const { history, favorites, toggleFavorite } = useMealFormStore();
  
  const favoriteMeals = history.filter(meal => favorites.includes(meal.id));

  return (
    <MobileLayout title="お気に入り" showBack={true}>
      <div className="px-4 py-6">
        {favoriteMeals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Heart className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-600 text-center mb-6">
              お気に入りの献立がありません
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
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                お気に入りの献立
              </h2>
              <p className="text-sm text-gray-600">
                全{favoriteMeals.length}件
              </p>
            </div>
            
            <div className="space-y-4">
              {favoriteMeals.map((meal, index) => (
                <motion.div
                  key={meal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden">
                    <div
                      className="p-4"
                      onClick={() => router.push(`/result?id=${meal.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className="inline-block px-2 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
                              {meal.preference.mealType}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(meal.id);
                              }}
                              className="ml-auto"
                            >
                              <Heart className="w-5 h-5 text-red-500 fill-current" />
                            </button>
                          </div>
                          
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {meal.title}
                          </h3>
                          
                          <p className="text-sm text-gray-600 mb-3">
                            {meal.recipes.map(r => r.name).join('、')}
                          </p>
                          
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
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-4 pb-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/result?id=${meal.id}`);
                        }}
                        className="flex-1"
                      >
                        詳細を見る
                      </Button>
                      
                      <Button
                        variant="primary"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          // 同じ条件で再生成
                          router.push('/meal-form/7');
                        }}
                        className="flex-1"
                      >
                        再度作る
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </MobileLayout>
  );
}
