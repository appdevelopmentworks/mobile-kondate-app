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
  ShoppingCart
} from 'lucide-react';
import MobileLayout from '@/components/layout/MobileLayout';
import { useMealStore } from '@/lib/store';

interface RecognizedIngredient {
  name: string;
  quantity?: string;
  confidence: number;
  selected: boolean;
}

export default function IngredientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateFormData } = useMealStore();
  
  const [ingredients, setIngredients] = useState<RecognizedIngredient[]>([]);
  const [additionalIngredients, setAdditionalIngredients] = useState<string[]>(['']);
  const [showAddForm, setShowAddForm] = useState(false);

  // URL パラメータから認識された食材を取得
  useEffect(() => {
    const ingredientsParam = searchParams.get('ingredients');
    if (ingredientsParam) {
      const recognizedNames = decodeURIComponent(ingredientsParam).split(',');
      const recognizedIngredients = recognizedNames.map(name => ({
        name: name.trim(),
        quantity: '適量',
        confidence: 0.9,
        selected: true
      }));
      setIngredients(recognizedIngredients);
    } else {
      // 認識された食材がない場合はカメラページに戻る
      router.push('/camera');
    }
  }, [searchParams, router]);

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

  // 追加食材の入力を処理
  const handleAdditionalIngredientChange = (index: number, value: string) => {
    const newAdditionals = [...additionalIngredients];
    newAdditionals[index] = value;
    setAdditionalIngredients(newAdditionals);
  };

  // 追加食材の入力フィールドを増やす
  const addAdditionalIngredientField = () => {
    setAdditionalIngredients(prev => [...prev, '']);
  };

  // 追加食材を削除
  const removeAdditionalIngredient = (index: number) => {
    if (additionalIngredients.length > 1) {
      setAdditionalIngredients(prev => prev.filter((_, i) => i !== index));
    }
  };

  // 追加食材をメインリストに追加
  const confirmAdditionalIngredients = () => {
    const validAdditionals = additionalIngredients.filter(ing => ing.trim() !== '');
    const newIngredients = validAdditionals.map(name => ({
      name: name.trim(),
      quantity: '適量',
      confidence: 1.0,
      selected: true
    }));
    
    setIngredients(prev => [...prev, ...newIngredients]);
    setAdditionalIngredients(['']);
    setShowAddForm(false);
  };

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

    // 献立作成フォームのステップ3（食材確認）に遷移
    router.push('/meal-form/3');
  };

  const selectedCount = ingredients.filter(ingredient => ingredient.selected).length;

  return (
    <MobileLayout title="食材を選択">
      <div className="h-full bg-gradient-to-br from-green-50 to-blue-50">
        {/* ヘッダー情報 */}
        <div className="p-4 bg-white/90 backdrop-blur-sm border-b border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-green-600" />
            <h1 className="text-lg font-bold text-gray-900">認識された食材</h1>
          </div>
          <p className="text-sm text-gray-600">
            使用したい食材をチェックし、数量を調整してください
          </p>
          {selectedCount > 0 && (
            <div className="mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm w-fit">
              {selectedCount}個の食材を選択中
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* 認識された食材リスト */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-500" />
                  AI認識食材 ({ingredients.length}個)
                </h2>
              </div>
              
              <div className="divide-y divide-gray-100">
                {ingredients.map((ingredient, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 ${ingredient.selected ? 'bg-green-50' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* チェックボックス */}
                      <button
                        onClick={() => toggleIngredient(index)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          ingredient.selected
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 text-transparent hover:border-green-400'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </button>

                      {/* 食材情報 */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900">
                            {ingredient.name}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {Math.round(ingredient.confidence * 100)}%
                          </span>
                        </div>
                        
                        {/* 数量入力 */}
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-sm text-gray-600">数量:</span>
                          <input
                            type="text"
                            value={ingredient.quantity || ''}
                            onChange={(e) => updateQuantity(index, e.target.value)}
                            placeholder="適量"
                            className="px-2 py-1 border border-gray-200 rounded text-sm flex-1 max-w-20"
                            disabled={!ingredient.selected}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 食材追加セクション */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-gray-900">食材を追加</span>
                </div>
                <ArrowRight className={`w-5 h-5 text-gray-400 transition-transform ${showAddForm ? 'rotate-90' : ''}`} />
              </button>

              <AnimatePresence>
                {showAddForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-100 overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      {additionalIngredients.map((ingredient, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={ingredient}
                            onChange={(e) => handleAdditionalIngredientChange(index, e.target.value)}
                            placeholder="食材名を入力"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                          />
                          {additionalIngredients.length > 1 && (
                            <button
                              onClick={() => removeAdditionalIngredient(index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      
                      <div className="flex gap-2">
                        <button
                          onClick={addAdditionalIngredientField}
                          className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                        >
                          + さらに追加
                        </button>
                        <button
                          onClick={confirmAdditionalIngredients}
                          className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                        >
                          追加確定
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 調理情報 */}
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-purple-500" />
                調理情報
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Clock className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                  <div className="text-sm font-medium text-gray-900">30-45分</div>
                  <div className="text-xs text-gray-600">調理時間</div>
                </div>
                <div>
                  <Users className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                  <div className="text-sm font-medium text-gray-900">2-3人分</div>
                  <div className="text-xs text-gray-600">推定人数</div>
                </div>
                <div>
                  <ChefHat className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                  <div className="text-sm font-medium text-gray-900">3-4品</div>
                  <div className="text-xs text-gray-600">料理数</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* フッターアクション */}
        <div className="flex-shrink-0 p-4 bg-white border-t border-gray-200">
          <div className="space-y-3">
            {selectedCount > 0 && (
              <div className="text-center p-3 bg-blue-50 rounded-xl">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {selectedCount}個の食材で献立を作成します
                  </span>
                </div>
                <p className="text-xs text-blue-600">
                  シンプルで美味しい料理が作れます！
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => router.push('/camera')}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              >
                再撮影
              </button>
              
              <button
                onClick={handleNext}
                disabled={selectedCount === 0}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-600 hover:to-blue-600 transition-all duration-200"
              >
                <ArrowRight className="w-5 h-5" />
                献立作成へ ({selectedCount}個)
              </button>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}