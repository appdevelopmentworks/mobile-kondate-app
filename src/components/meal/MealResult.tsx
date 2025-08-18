'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Flame, 
  Users, 
  ChefHat,
  ShoppingCart,
  BookOpen,
  Heart,
  Share2,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import CookingSteps from './CookingSteps';
import ShoppingList from './ShoppingList';
import NutritionInfo from './NutritionInfo';
import { MealSuggestion } from '@/lib/types';
import { formatCookingTime, shareMeal } from '@/lib/utils';
import { useMealFormStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

interface MealResultProps {
  meal: MealSuggestion;
}

export default function MealResult({ meal }: MealResultProps) {
  const router = useRouter();
  const { toggleFavorite, favorites } = useMealFormStore();
  const [activeTab, setActiveTab] = useState<'recipes' | 'steps' | 'shopping'>('recipes');
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  
  const isFavorite = favorites.includes(meal.id);
  
  const handleShare = async () => {
    const shared = await shareMeal(meal);
    if (!shared) {
      // Web Share APIが使えない場合はクリップボードにコピー
      navigator.clipboard.writeText(
        `【献立】${meal.title}\n${meal.recipes.map(r => r.name).join('、')}`
      );
      alert('献立をクリップボードにコピーしました');
    }
  };
  
  const handleRegenerate = () => {
    router.push('/meal-form/7');
  };
  
  const tabs = [
    { id: 'recipes', label: 'レシピ', icon: BookOpen },
    { id: 'steps', label: '手順', icon: ChefHat },
    { id: 'shopping', label: '買い物', icon: ShoppingCart },
  ];

  return (
    <div className="pb-20">
      {/* ヘッダー情報 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-6"
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {meal.title}
        </h1>
        <p className="text-gray-700 mb-4">
          {meal.description}
        </p>
        
        {/* 基本情報 */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600">調理時間</p>
            <p className="font-semibold text-sm">
              {formatCookingTime(meal.totalCookingTime)}
            </p>
          </Card>
          
          <Card className="p-3 text-center">
            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600">カロリー</p>
            <p className="font-semibold text-sm">
              {meal.totalCalories}kcal
            </p>
          </Card>
          
          <Card className="p-3 text-center">
            <Users className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-xs text-gray-600">人数</p>
            <p className="font-semibold text-sm">
              {meal.preference.servings}人分
            </p>
          </Card>
        </div>
      </motion.div>
      
      {/* アクションボタン */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-4 py-4 bg-white border-b border-gray-100"
      >
        <div className="flex gap-2">
          <Button
            variant={isFavorite ? 'primary' : 'outline'}
            size="small"
            onClick={() => toggleFavorite(meal.id)}
            icon={<Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />}
            className="flex-1"
          >
            {isFavorite ? 'お気に入り済み' : 'お気に入り'}
          </Button>
          
          <Button
            variant="outline"
            size="small"
            onClick={handleShare}
            icon={<Share2 className="w-4 h-4" />}
            className="flex-1"
          >
            共有
          </Button>
          
          <Button
            variant="outline"
            size="small"
            onClick={handleRegenerate}
            icon={<RefreshCw className="w-4 h-4" />}
            className="flex-1"
          >
            再生成
          </Button>
        </div>
      </motion.div>
      
      {/* タブナビゲーション */}
      <div className="sticky top-14 z-30 bg-white border-b border-gray-200">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center py-3 border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-gray-500'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* タブコンテンツ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="px-4 py-4"
        >
          {activeTab === 'recipes' && (
            <div className="space-y-4">
              {meal.recipes.map((recipe) => (
                <Card
                  key={recipe.id}
                  className="overflow-hidden"
                  onClick={() => setExpandedRecipe(
                    expandedRecipe === recipe.id ? null : recipe.id
                  )}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="inline-block px-2 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-medium mb-2">
                          {recipe.category}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {recipe.name}
                        </h3>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          expandedRecipe === recipe.id ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {recipe.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatCookingTime(recipe.cookingTime)}
                      </span>
                      <span className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {recipe.servings}人分
                      </span>
                      <span className="flex items-center">
                        <Flame className="w-3 h-3 mr-1" />
                        {recipe.nutrition?.calories}kcal
                      </span>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {expandedRecipe === recipe.id && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-gray-100">
                          {/* 材料 */}
                          <div className="mt-4">
                            <h4 className="font-medium text-gray-900 mb-2">材料</h4>
                            <div className="space-y-1">
                              {recipe.ingredients.map((ingredient, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between text-sm"
                                >
                                  <span className="text-gray-700">
                                    {ingredient.name}
                                  </span>
                                  <span className="text-gray-500">
                                    {ingredient.amount}{ingredient.unit || ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* 栄養情報 */}
                          {recipe.nutrition && (
                            <NutritionInfo nutrition={recipe.nutrition} />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              ))}
            </div>
          )}
          
          {activeTab === 'steps' && (
            <CookingSteps
              recipes={meal.recipes}
              schedule={meal.cookingSchedule}
            />
          )}
          
          {activeTab === 'shopping' && (
            <ShoppingList items={meal.shoppingList} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
