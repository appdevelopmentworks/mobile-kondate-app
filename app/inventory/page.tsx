'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileLayout from '../../components/layout/MobileLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Calendar,
  Trash2,
  Edit2,
  ShoppingCart,
  RefreshCw,
  Camera,
  MapPin,
  Clock,
  Thermometer
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate: Date;
  location: 'fridge' | 'freezer' | 'pantry' | 'counter';
  purchaseDate?: Date;
  price?: number;
  notes?: string;
  imageUrl?: string;
}

interface InventoryStore {
  items: InventoryItem[];
  addItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  getExpiringItems: (days: number) => InventoryItem[];
  getExpiredItems: () => InventoryItem[];
}

// 簡易的な在庫ストア（本来はZustandやContextで管理）
const useInventoryStore = (): InventoryStore => {
  const [items, setItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    // ローカルストレージから読み込み
    const stored = localStorage.getItem('inventory-items');
    if (stored) {
      const parsedItems = JSON.parse(stored).map((item: any) => ({
        ...item,
        expiryDate: new Date(item.expiryDate),
        purchaseDate: item.purchaseDate ? new Date(item.purchaseDate) : undefined
      }));
      setItems(parsedItems);
    } else {
      // サンプルデータを設定
      const sampleItems: InventoryItem[] = [
        {
          id: '1',
          name: 'じゃがいも',
          category: 'vegetables',
          quantity: 5,
          unit: '個',
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1週間後
          location: 'counter',
          purchaseDate: new Date(),
          notes: '北海道産'
        },
        {
          id: '2',
          name: '牛乳',
          category: 'dairy',
          quantity: 1,
          unit: '本',
          expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3日後
          location: 'fridge',
          purchaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2日前
          price: 250
        },
        {
          id: '3',
          name: '鶏もも肉',
          category: 'meat',
          quantity: 300,
          unit: 'g',
          expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 明日
          location: 'fridge',
          purchaseDate: new Date()
        }
      ];
      setItems(sampleItems);
    }
  }, []);

  useEffect(() => {
    // ローカルストレージに保存
    localStorage.setItem('inventory-items', JSON.stringify(items));
  }, [items]);

  const addItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: `inventory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setItems(prev => [newItem, ...prev]);
  };

  const updateItem = (id: string, updates: Partial<InventoryItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const getExpiringItems = (days: number) => {
    const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return items.filter(item => 
      item.expiryDate <= targetDate && item.expiryDate > new Date()
    );
  };

  const getExpiredItems = () => {
    return items.filter(item => item.expiryDate < new Date());
  };

  return { items, addItem, updateItem, deleteItem, getExpiringItems, getExpiredItems };
};

export default function InventoryPage() {
  const router = useRouter();
  const { items, addItem, updateItem, deleteItem, getExpiringItems, getExpiredItems } = useInventoryStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'expiry' | 'category'>('expiry');

  // カテゴリー定義
  const categories = [
    { id: 'all', name: '全て', emoji: '📦' },
    { id: 'vegetables', name: '野菜', emoji: '🥬' },
    { id: 'meat', name: '肉・魚', emoji: '🍖' },
    { id: 'dairy', name: '乳製品', emoji: '🥛' },
    { id: 'grain', name: '米・麺', emoji: '🍚' },
    { id: 'seasoning', name: '調味料', emoji: '🧂' },
    { id: 'frozen', name: '冷凍食品', emoji: '🧊' },
    { id: 'other', name: 'その他', emoji: '📦' },
  ];

  const locations = [
    { id: 'all', name: '全て', emoji: '🏠' },
    { id: 'fridge', name: '冷蔵庫', emoji: '❄️' },
    { id: 'freezer', name: '冷凍庫', emoji: '🧊' },
    { id: 'pantry', name: '食品棚', emoji: '🗄️' },
    { id: 'counter', name: 'カウンター', emoji: '🏪' },
  ];

  // フィルタリングとソート
  const filteredItems = items
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesLocation = selectedLocation === 'all' || item.location === selectedLocation;
      return matchesSearch && matchesCategory && matchesLocation;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'expiry':
          return a.expiryDate.getTime() - b.expiryDate.getTime();
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

  // 期限切れ・期限間近のアイテム
  const expiredItems = getExpiredItems();
  const expiringItems = getExpiringItems(3); // 3日以内

  // 日数計算
  const getDaysUntilExpiry = (expiryDate: Date): number => {
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // アイテム追加/編集
  const handleSaveItem = (itemData: Omit<InventoryItem, 'id'>) => {
    if (editingItem) {
      updateItem(editingItem.id, itemData);
    } else {
      addItem(itemData);
    }
    setShowAddModal(false);
    setEditingItem(null);
  };

  return (
    <MobileLayout title="食材在庫管理" showBack>
      <div className="px-4 py-6 space-y-6">
        {/* ヘッダー統計 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">食材在庫</h2>
              <p className="text-indigo-100">冷蔵庫の中身をスマートに管理</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{items.length}</div>
                <div className="text-sm text-indigo-100">総アイテム</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${expiredItems.length > 0 ? 'text-red-200' : ''}`}>
                  {expiredItems.length}
                </div>
                <div className="text-sm text-indigo-100">期限切れ</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${expiringItems.length > 0 ? 'text-yellow-200' : ''}`}>
                  {expiringItems.length}
                </div>
                <div className="text-sm text-indigo-100">期限間近</div>
              </div>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* アラート */}
        {(expiredItems.length > 0 || expiringItems.length > 0) && (
          <div className="space-y-3">
            {expiredItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-4"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div>
                    <h3 className="font-semibold text-red-800">期限切れアイテム</h3>
                    <p className="text-sm text-red-700">
                      {expiredItems.length}品の食材が期限切れです。確認してください。
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {expiringItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">期限間近アイテム</h3>
                    <p className="text-sm text-yellow-700">
                      {expiringItems.length}品の食材が3日以内に期限切れになります。
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* 検索・フィルター */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="食材を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-indigo-200/40 focus:border-indigo-400 focus:outline-none transition-colors text-base bg-white/90 backdrop-blur-sm text-gray-900 placeholder-gray-500"
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
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white/90 text-gray-700 hover:bg-indigo-50'
                }`}
              >
                <span>{category.emoji}</span>
                {category.name}
              </button>
            ))}
          </div>

          {/* 場所フィルター */}
          <div className="flex overflow-x-auto gap-2 pb-2">
            {locations.map((location) => (
              <button
                key={location.id}
                onClick={() => setSelectedLocation(location.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedLocation === location.id
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/90 text-gray-700 hover:bg-purple-50'
                }`}
              >
                <span>{location.emoji}</span>
                {location.name}
              </button>
            ))}
          </div>

          {/* ソート */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">並び順:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="expiry">期限日順</option>
              <option value="name">名前順</option>
              <option value="category">カテゴリ順</option>
            </select>
          </div>
        </div>

        {/* アイテム一覧 */}
        <div className="space-y-3">
          <AnimatePresence>
            {filteredItems.map((item, index) => {
              const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
              const isExpired = daysUntilExpiry < 0;
              const isExpiringSoon = daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
              const categoryInfo = categories.find(c => c.id === item.category);
              const locationInfo = locations.find(l => l.id === item.location);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-2xl shadow-lg p-4 border-2 transition-all duration-200 ${
                    isExpired
                      ? 'bg-red-50 border-red-200'
                      : isExpiringSoon
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-white/95 backdrop-blur-sm border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                        isExpired ? 'bg-red-100' :
                        isExpiringSoon ? 'bg-yellow-100' : 'bg-indigo-100'
                      }`}>
                        {categoryInfo?.emoji || '📦'}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 truncate">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{item.quantity}{item.unit}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <span>{locationInfo?.emoji}</span>
                              <span>{locationInfo?.name}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setShowAddModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* 期限情報 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {item.expiryDate.toLocaleDateString()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isExpired
                              ? 'bg-red-100 text-red-800'
                              : isExpiringSoon
                              ? 'bg-yellow-100 text-yellow-800'
                              : daysUntilExpiry <= 7
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {isExpired
                              ? `${Math.abs(daysUntilExpiry)}日経過`
                              : daysUntilExpiry === 0
                              ? '今日期限'
                              : `あと${daysUntilExpiry}日`
                            }
                          </span>
                        </div>

                        {item.price && (
                          <span className="text-sm text-gray-500">
                            ¥{item.price}
                          </span>
                        )}
                      </div>

                      {item.notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-600">{item.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {searchQuery ? '検索結果がありません' : 'アイテムがありません'}
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                {searchQuery 
                  ? '別のキーワードで検索してみてください' 
                  : '食材を追加して在庫管理を始めましょう'
                }
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-2xl font-medium hover:bg-indigo-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                アイテムを追加
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* アイテム追加/編集モーダル */}
      {showAddModal && (
        <AddItemModal 
          item={editingItem}
          onSave={handleSaveItem}
          onCancel={() => {
            setShowAddModal(false);
            setEditingItem(null);
          }}
        />
      )}
    </MobileLayout>
  );

  // アイテム追加/編集モーダル
  function AddItemModal({ 
    item, 
    onSave, 
    onCancel 
  }: { 
    item: InventoryItem | null;
    onSave: (item: Omit<InventoryItem, 'id'>) => void;
    onCancel: () => void;
  }) {
    const [formData, setFormData] = useState({
      name: item?.name || '',
      category: item?.category || 'other',
      quantity: item?.quantity || 1,
      unit: item?.unit || '個',
      expiryDate: item?.expiryDate.toISOString().split('T')[0] || '',
      location: item?.location || 'fridge',
      price: item?.price || 0,
      notes: item?.notes || ''
    });

    const handleSubmit = () => {
      if (!formData.name.trim() || !formData.expiryDate) return;

      const itemData = {
        name: formData.name,
        category: formData.category,
        quantity: formData.quantity,
        unit: formData.unit,
        expiryDate: new Date(formData.expiryDate),
        location: formData.location as any,
        price: formData.price > 0 ? formData.price : undefined,
        notes: formData.notes || undefined,
        purchaseDate: new Date()
      };

      onSave(itemData);
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            {item ? 'アイテムを編集' : 'アイテムを追加'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                食材名 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例: じゃがいも"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  数量 *
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  min="1"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  単位
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="個">個</option>
                  <option value="本">本</option>
                  <option value="袋">袋</option>
                  <option value="パック">パック</option>
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="ml">ml</option>
                  <option value="L">L</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリー
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:outline-none"
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
                保存場所
              </label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value as "fridge" | "freezer" | "pantry" | "counter" })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:outline-none"
              >
                {locations.slice(1).map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.emoji} {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                期限日 *
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                価格（円）
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                placeholder="任意"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メモ
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="産地、特記事項など"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:outline-none resize-none"
                rows={2}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.name.trim() || !formData.expiryDate}
              className="flex-1 py-3 px-4 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {item ? '更新' : '追加'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }
}