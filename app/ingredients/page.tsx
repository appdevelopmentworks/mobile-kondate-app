'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat,
  Plus,
  Minus,
  X,
  Check,
  ArrowRight,
  Sparkles,
  Clock,
  Users,
  Utensils,
  Camera,
  ShoppingCart,
  Search,
  Filter,
  Grid3X3
} from 'lucide-react';
import MobileLayout from '@/components/layout/MobileLayout';
import { useMealStore } from '@/lib/store';
import { commonIngredients } from '@/lib/sample-data';

interface Ingredient {
  name: string;
  quantity?: string;
  confidence?: number;
  selected: boolean;
  category?: string;
}

// 食材カテゴリ定義
const ingredientCategories = {
  meat: { name: '肉類', icon: '🥩', items: ['鶏肉', '豚肉', '牛肉', '鶏もも肉', '鶏むね肉', '豚バラ肉', 'ひき肉', 'ソーセージ'] },
  fish: { name: '魚介類', icon: '🐟', items: ['鮭', 'さば', 'たら', 'まぐろ', 'いか', 'えび', 'ほたて', 'ちりめんじゃこ'] },
  vegetables: { name: '野菜', icon: '🥬', items: ['じゃがいも', '玉ねぎ', 'にんじん', 'キャベツ', '白菜', 'ほうれん草', '大根', 'なす', 'トマト', 'きゅうり', 'ピーマン', 'もやし', 'レタス', 'ブロッコリー'] },
  grains: { name: '主食', icon: '🍚', items: ['ご飯', 'うどん', 'そば', 'パスタ', 'パン', 'そうめん'] },
  dairy: { name: '乳製品・卵', icon: '🥛', items: ['卵', '牛乳', 'チーズ', 'バター', 'ヨーグルト'] },
  others: { name: 'その他', icon: '🧄', items: ['豆腐', '納豆', 'こんにゃく', 'しらたき', 'きのこ', 'のり'] }
};

export default function IngredientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateFormData } = useMealStore();
  
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'camera' | 'manual'>('manual');
  const [customIngredient, setCustomIngredient] = useState('');

  // 初期化
  useEffect(() => {
    const ingredientsParam = searchParams.get('ingredients');
    if (ingredientsParam) {
      // カメラから認識された食材がある場合
      const recognizedNames = decodeURIComponent(ingredientsParam).split(',');
      const recognizedIngredients = recognizedNames.map(name => ({
        name: name.trim(),
        quantity: '適量',
        confidence: 0.9,
        selected: true,
        category: 'recognized'
      }));
      setIngredients(recognizedIngredients);
      setViewMode('camera');
    } else {
      // 手動選択モード - よく使う食材を表示
      const manualIngredients = Object.values(ingredientCategories)
        .flatMap(category => category.items.map(name => ({
          name,
          quantity: '適量',
          selected: false,
          category: Object.keys(ingredientCategories).find(key => 
            ingredientCategories[key as keyof typeof ingredientCategories].items.includes(name)
          )
        })));
      setIngredients(manualIngredients);
      setViewMode('manual');
    }
  }, [searchParams]);

  // 食材の選択状態を切り替え
  const toggleIngredient = (index: number) => {
    setIngredients(prev => 
      prev.map((ingredient, i) => 
        i === index 
          ? { ...ingredient, selected: !ingredient.selected }
          : ingredient
      )
    );
  };

  // 食材の数量を更新
  const updateQuantity = (index: number, quantity: string) => {
    setIngredients(prev => 
      prev.map((ingredient, i) => 
        i === index 
          ? { ...ingredient, quantity }
          : ingredient
      )
    );
  };

  // カスタム食材を追加
  const addCustomIngredient = () => {
    if (customIngredient.trim()) {
      const newIngredient: Ingredient = {
        name: customIngredient.trim(),
        quantity: '適量',
        selected: true,
        category: 'custom'
      };
      setIngredients(prev => [...prev, newIngredient]);
      setCustomIngredient('');
    }
  };

  // 食材をフィルタリング
  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || ingredient.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 次のステップに進む
  const handleNext = () => {
    const selectedIngredients = ingredients
      .filter(ingredient => ingredient.selected)
      .map(ingredient => ingredient.name);

    if (selectedIngredients.length === 0) {
      alert('少なくとも1つの食材を選択してください');
      return;
    }

    // フォームデータを更新
    updateFormData({
      ingredients: selectedIngredients
    });

    // 献立生成に進む
    router.push('/result');
  };

  const selectedCount = ingredients.filter(ingredient => ingredient.selected).length;

  return (
    <MobileLayout title="食材を選択">
      <div className="h-full flex flex-col">
        {/* ヘッダー情報 */}
        <div className="p-4 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              <h1 className="text-lg font-bold text-gray-900">
                {viewMode === 'camera' ? 'AI認識食材' : '食材を選択'}
              </h1>
            </div>
            {selectedCount > 0 && (
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                {selectedCount}個選択中
              </div>
            )}
          </div>
          
          {/* 検索バー */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="食材を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400"
            />
          </div>

          {/* カスタム食材追加 */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="食材を手動で追加..."
              value={customIngredient}
              onChange={(e) => setCustomIngredient(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400"
              onKeyDown={(e) => e.key === 'Enter' && addCustomIngredient()}
            />
            <button
              onClick={addCustomIngredient}
              disabled={!customIngredient.trim()}
              className="px-3 py-2 bg-green-500 text-white rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* カテゴリフィルター */}
        {viewMode === 'manual' && (
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <div className="flex overflow-x-auto gap-2 pb-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                  !selectedCategory
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                すべて
              </button>
              {Object.entries(ingredientCategories).map(([key, category]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors flex items-center gap-1 ${
                    selectedCategory === key
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  <span>{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 食材リスト */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">{filteredIngredients.map((ingredient, index) => (
              <motion.button
                key={`${ingredient.name}-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => toggleIngredient(ingredients.findIndex(ing => ing.name === ingredient.name))}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 text-left ${
                  ingredient.selected
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-green-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm mb-1">
                      {ingredient.name}
                    </h3>
                    {ingredient.confidence && (
                      <span className="text-xs text-gray-500">
                        {Math.round(ingredient.confidence * 100)}%
                      </span>
                    )}
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    ingredient.selected
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300'
                  }`}>
                    {ingredient.selected && <Check className="w-3 h-3" />}
                  </div>
                </div>
                
                {ingredient.selected && (
                  <input
                    type="text"
                    value={ingredient.quantity || ''}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateQuantity(ingredients.findIndex(ing => ing.name === ingredient.name), e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="数量"
                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded bg-white"
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* フッターアクション */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="space-y-3">
            {selectedCount > 0 && (
              <div className="text-center p-3 bg-green-50 rounded-xl">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    {selectedCount}個の食材で献立を作成
                  </span>
                </div>
                <p className="text-xs text-green-600">
                  選択した食材からベストな献立を提案します
                </p>
              </div>
            )}

            <div className="flex gap-3">
              {viewMode === 'camera' && (
                <button
                  onClick={() => router.push('/camera')}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-xl font-medium hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  再撮影
                </button>
              )}
              
              <button
                onClick={handleNext}
                disabled={selectedCount === 0}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-600 hover:to-blue-600 transition-all duration-200"
              >
                <ArrowRight className="w-5 h-5" />
                献立作成 ({selectedCount}個)
              </button>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}