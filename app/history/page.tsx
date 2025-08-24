'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileLayout from '../../components/layout/MobileLayout';
import { useMealStore } from '../../lib/store';
import { motion } from 'framer-motion';
import { History, Clock, Users, ChefHat, Heart, Search, Trash2, Calendar } from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const { history, favorites, toggleFavorite, resetStore } = useMealStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  // 検索フィルタリング
  const filteredHistory = history.filter(meal =>
    meal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meal.recipes.some(recipe => 
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
  };

  const handleClearHistory = () => {
    if (confirm('すべての履歴を削除しますか？この操作は元に戻せません。')) {
      resetStore();
    }
  };

  // 日付でグループ化
  const groupedHistory = filteredHistory.reduce((groups, meal) => {
    const date = new Date(meal.createdAt).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(meal);
    return groups;
  }, {} as Record<string, typeof filteredHistory>);

  return (
    <MobileLayout title="履歴" showBack>
      <div className="px-4 py-6 space-y-6">
        {/* 検索バー */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="履歴を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-purple-200/40 focus:border-purple-400 focus:outline-none transition-colors text-base bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-500"
          />
        </div>

        {/* 統計情報 */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-3xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <History className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">献立履歴</h2>
              <p className="text-purple-100">過去に作成した献立一覧です</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold">{history.length}</div>
                <div className="text-sm text-purple-100">総数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{favorites.length}</div>
                <div className="text-sm text-purple-100">お気に入り</div>
              </div>
            </div>
            
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium hover:bg-white/30 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                履歴削除
              </button>
            )}
          </div>
        </div>

        {/* 履歴一覧 */}
        {filteredHistory.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchQuery ? '検索結果がありません' : '履歴がありません'}
            </h3>
            <p className="text-gray-500 text-sm">
              {searchQuery 
                ? '別のキーワードで検索してみてください' 
                : '献立を作成すると、ここに履歴が表示されます'
              }
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedHistory).map(([date, meals]) => (
              <div key={date}>
                {/* 日付ヘッダー */}
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-700">{date}</h3>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                {/* その日の献立一覧 */}
                <div className="space-y-4">
                  {meals.map((meal, index) => (
                    <motion.div
                      key={meal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-6 transition-all duration-200 border border-purple-100/30"
                    >
                      {/* ヘッダー */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900 mb-2">
                            {meal.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-3">
                            {meal.description}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => handleToggleFavorite(meal.id)}
                          className={`p-2 rounded-full transition-colors ${
                            favorites.includes(meal.id)
                              ? 'text-red-500 bg-red-50'
                              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                          }`}
                        >
                          <Heart className={`w-6 h-6 ${favorites.includes(meal.id) ? 'fill-current' : ''}`} />
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
                        <h5 className="text-sm font-semibold text-gray-700">料理:</h5>
                        <div className="flex flex-wrap gap-2">
                          {meal.recipes.map((recipe, recipeIndex) => (
                            <button
                              key={recipeIndex}
                              onClick={() => router.push(`/recipe/${recipe.id}`)}
                              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition-colors"
                            >
                              {recipe.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 作成時刻 */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          作成時刻: {new Date(meal.createdAt).toLocaleTimeString('ja-JP', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}