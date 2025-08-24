'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileLayout from '../../components/layout/MobileLayout';
import { useMealStore } from '../../lib/store';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  Check, 
  Plus, 
  Trash2, 
  Edit2, 
  Search,
  Package,
  MapPin,
  Calendar,
  Filter,
  Download,
  Share
} from 'lucide-react';
import type { ShoppingItem } from '../../lib/types';

interface ExtendedShoppingItem extends ShoppingItem {
  id: string;
  category?: string;
  store?: string;
  priority?: 'high' | 'medium' | 'low';
  addedAt: Date;
}

export default function ShoppingListPage() {
  const router = useRouter();
  const { history } = useMealStore();
  const [shoppingItems, setShoppingItems] = useState<ExtendedShoppingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ExtendedShoppingItem | null>(null);

  // カテゴリー定義
  const categories = [
    { id: 'all', name: '全て', emoji: '🛒' },
    { id: 'vegetables', name: '野菜', emoji: '🥬' },
    { id: 'meat', name: '肉・魚', emoji: '🍖' },
    { id: 'dairy', name: '乳製品', emoji: '🥛' },
    { id: 'grain', name: '米・麺', emoji: '🍚' },
    { id: 'seasoning', name: '調味料', emoji: '🧂' },
    { id: 'other', name: 'その他', emoji: '📦' },
  ];

  // 食材カテゴリーを自動判定
  const determineCategory = (ingredient: string): string => {
    const categoryMap: Record<string, string[]> = {
      vegetables: ['野菜', 'キャベツ', 'にんじん', 'じゃがいも', '玉ねぎ', 'ほうれん草', 'もやし', 'なす', 'トマト', 'きゅうり', 'ピーマン', '大根', 'ねぎ', 'ブロッコリー'],
      meat: ['肉', '鶏肉', '豚肉', '牛肉', '鮭', 'さば', 'たら', '魚', '鶏', '豚', '牛', 'ハム', 'ベーコン', 'ソーセージ'],
      dairy: ['牛乳', 'チーズ', 'バター', 'ヨーグルト', '卵', 'クリーム'],
      grain: ['米', 'ご飯', 'パン', 'うどん', 'そば', 'パスタ', '小麦粉', 'パン粉'],
      seasoning: ['醤油', 'みそ', '塩', '砂糖', 'みりん', '酒', '酢', '油', 'だし', 'コンソメ', 'ソース', 'ケチャップ', 'マヨネーズ']
    };
    
    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => ingredient.includes(keyword))) {
        return category;
      }
    }
    return 'other';
  };

  // 初回読み込み時に履歴から買い物リストを生成
  useEffect(() => {
    if (history.length > 0 && shoppingItems.length === 0) {
      const latestMeal = history[0];
      if (latestMeal.shoppingList) {
        const extendedItems: ExtendedShoppingItem[] = latestMeal.shoppingList.map((item, index) => ({
          ...item,
          id: `item-${Date.now()}-${index}`,
          category: determineCategory(item.ingredient),
          priority: 'medium' as const,
          addedAt: new Date(),
        }));
        setShoppingItems(extendedItems);
      }
    }
  }, [history, shoppingItems.length]);

  // 検索とフィルタリング
  const filteredItems = shoppingItems.filter(item => {
    const matchesSearch = item.ingredient.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 完了/未完了でグループ化
  const completedItems = filteredItems.filter(item => item.checked);
  const pendingItems = filteredItems.filter(item => !item.checked);

  // アイテムのチェック状態切り替え
  const toggleItem = (id: string) => {
    setShoppingItems(items => 
      items.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  // アイテム削除
  const deleteItem = (id: string) => {
    setShoppingItems(items => items.filter(item => item.id !== id));
  };

  // アイテム追加
  const addItem = (ingredient: string, amount: string, category: string) => {
    const newItem: ExtendedShoppingItem = {
      id: `item-${Date.now()}`,
      ingredient,
      amount,
      checked: false,
      category,
      priority: 'medium',
      addedAt: new Date(),
    };
    setShoppingItems(items => [newItem, ...items]);
  };

  // 完了済みアイテムをクリア
  const clearCompleted = () => {
    setShoppingItems(items => items.filter(item => !item.checked));
  };

  return (
    <MobileLayout title="買い物リスト" showBack>
      <div className="px-4 py-6 space-y-6">
        {/* ヘッダー統計 */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">買い物リスト</h2>
              <p className="text-green-100">お買い物をサポートします</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{pendingItems.length}</div>
                <div className="text-sm text-green-100">未購入</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{completedItems.length}</div>
                <div className="text-sm text-green-100">完了</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
              {completedItems.length > 0 && (
                <button
                  onClick={clearCompleted}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 検索バー */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="食材を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-green-200/40 focus:border-green-400 focus:outline-none transition-colors text-base bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-500"
          />
        </div>

        {/* カテゴリーフィルター */}
        <div className="flex overflow-x-auto gap-2 pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? 'bg-green-500 text-white'
                  : 'bg-white/90 text-gray-700 hover:bg-green-50'
              }`}
            >
              <span>{category.emoji}</span>
              {category.name}
            </button>
          ))}
        </div>

        {/* 未完了アイテム */}
        {pendingItems.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-green-500" />
              未購入 ({pendingItems.length}品)
            </h3>
            {pendingItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-green-100/30"
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-green-500 transition-colors"
                  >
                    {item.checked && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {categories.find(c => c.id === item.category)?.emoji || '📦'}
                      </span>
                      <h4 className="font-semibold text-gray-800">{item.ingredient}</h4>
                      {item.priority === 'high' && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          優先
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{item.amount}</p>
                    {item.store && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {item.store}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* 完了済みアイテム */}
        {completedItems.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              購入済み ({completedItems.length}品)
            </h3>
            {completedItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-50/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-200/30"
              >
                <div className="flex items-center gap-4 opacity-70">
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg grayscale">
                        {categories.find(c => c.id === item.category)?.emoji || '📦'}
                      </span>
                      <h4 className="font-semibold text-gray-600 line-through">{item.ingredient}</h4>
                    </div>
                    <p className="text-sm text-gray-500 line-through">{item.amount}</p>
                  </div>

                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* 空状態 */}
        {filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchQuery ? '検索結果がありません' : '買い物リストが空です'}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {searchQuery 
                ? '別のキーワードで検索してみてください' 
                : '献立を作成すると自動で買い物リストが生成されます'
              }
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-2xl font-medium hover:bg-green-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              アイテムを追加
            </button>
          </motion.div>
        )}
      </div>

      {/* アイテム追加モーダル */}
      {(showAddModal || editingItem) && <AddItemModal />}
    </MobileLayout>
  );

  // アイテム追加/編集モーダル
  function AddItemModal() {
    const [ingredient, setIngredient] = useState(editingItem?.ingredient || '');
    const [amount, setAmount] = useState(editingItem?.amount || '');
    const [category, setCategory] = useState(editingItem?.category || 'other');
    const [store, setStore] = useState(editingItem?.store || '');
    const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(editingItem?.priority || 'medium');

    const handleSubmit = () => {
      if (!ingredient.trim()) return;

      if (editingItem) {
        // 編集
        setShoppingItems(items => 
          items.map(item => 
            item.id === editingItem.id 
              ? { ...item, ingredient, amount, category, store, priority }
              : item
          )
        );
      } else {
        // 追加
        const newItem: ExtendedShoppingItem = {
          id: `item-${Date.now()}`,
          ingredient,
          amount,
          checked: false,
          category,
          store,
          priority,
          addedAt: new Date(),
        };
        setShoppingItems(items => [newItem, ...items]);
      }

      // モーダルを閉じる
      setShowAddModal(false);
      setEditingItem(null);
      setIngredient('');
      setAmount('');
      setCategory('other');
      setStore('');
      setPriority('medium');
    };

    const handleClose = () => {
      setShowAddModal(false);
      setEditingItem(null);
      setIngredient('');
      setAmount('');
      setCategory('other');
      setStore('');
      setPriority('medium');
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl p-6 w-full max-w-md"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            {editingItem ? 'アイテムを編集' : 'アイテムを追加'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                食材名 *
              </label>
              <input
                type="text"
                value={ingredient}
                onChange={(e) => setIngredient(e.target.value)}
                placeholder="例: じゃがいも"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分量
              </label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="例: 3個"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリー
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:outline-none"
              >
                {categories.slice(1).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                購入予定店舗
              </label>
              <input
                type="text"
                value={store}
                onChange={(e) => setStore(e.target.value)}
                placeholder="例: スーパーA"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                優先度
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'low', label: '低', color: 'gray' },
                  { value: 'medium', label: '中', color: 'blue' },
                  { value: 'high', label: '高', color: 'red' }
                ].map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPriority(p.value as any)}
                    className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
                      priority === p.value
                        ? `bg-${p.color}-500 text-white`
                        : `bg-${p.color}-50 text-${p.color}-700 hover:bg-${p.color}-100`
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleClose}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSubmit}
              disabled={!ingredient.trim()}
              className="flex-1 py-3 px-4 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {editingItem ? '更新' : '追加'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }
}