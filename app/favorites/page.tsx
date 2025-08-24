'use client';

import { useState, useEffect } from 'react';
import MobileLayout from '../../components/layout/MobileLayout';
import { useMealStore } from '../../lib/store';
import { motion } from 'framer-motion';
import { Heart, Clock, Users, ChefHat, Trash2, Search } from 'lucide-react';
import type { MealSuggestion } from '../../lib/types';

export default function FavoritesPage() {
  const { history, favorites, toggleFavorite, removeFromFavorites } = useMealStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  // お気に入りの献立を履歴から取得
  const favoriteItems: MealSuggestion[] = history.filter(meal => 
    favorites.includes(meal.id)
  );
  
  // 検索フィルタリング
  const filteredFavorites = favoriteItems.filter(meal =>
    meal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meal.recipes.some(recipe => 
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleRemoveFavorite = (id: string) => {
    removeFromFavorites(id);
  };

  const handleClearAll = () => {
    if (confirm('すべてのお気に入りを削除しますか？')) {
      favorites.forEach(id => removeFromFavorites(id));
    }
  };

  return (
    <MobileLayout title="お気に入り" showBack>
      <div className="px-4 py-6 space-y-6">
        {/* 検索バー */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="お気に入りを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-pink-200/40 focus:border-pink-400 focus:outline-none transition-colors text-base bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-500"
          />
        </div>

        {/* 統計情報 */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-3xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">お気に入り献立</h2>
              <p className="text-pink-100">あなたが保存した献立です</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{favoriteItems.length}</div>
              <div className="text-sm text-pink-100">保存済み</div>
            </div>
            
            {favoriteItems.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium hover:bg-white/30 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                すべて削除
              </button>
            )}
          </div>
        </div>

        {/* お気に入り一覧 */}
        {filteredFavorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchQuery ? '検索結果がありません' : 'お気に入りがありません'}
            </h3>
            <p className="text-gray-500 text-sm">
              {searchQuery 
                ? '別のキーワードで検索してみてください' 
                : '献立詳細画面でハートアイコンをタップしてお気に入りに追加できます'
              }
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredFavorites.map((meal, index) => (
              <motion.div
                key={meal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-6 transition-all duration-200 border border-pink-100/30"
              >
                {/* ヘッダー */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {meal.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {meal.description}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleRemoveFavorite(meal.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Heart className="w-6 h-6 fill-current" />
                  </button>
                </div>

                {/* 統計情報 */}
                <div className="flex items-center gap-6 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{meal.totalTime}分</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{meal.servings}人分</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ChefHat className="w-4 h-4" />
                    <span>{meal.recipes.length}品</span>
                  </div>
                </div>

                {/* 料理一覧 */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700">料理:</h4>
                  <div className="flex flex-wrap gap-2">
                    {meal.recipes.map((recipe, recipeIndex) => (
                      <span
                        key={recipeIndex}
                        className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm"
                      >
                        {recipe.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 作成日時 */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    保存日: {new Date(meal.createdAt).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}