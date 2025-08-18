'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShoppingBag, Copy, Trash2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ShoppingItem } from '@/lib/types';

interface ShoppingListProps {
  items: ShoppingItem[];
}

export default function ShoppingList({ items: initialItems }: ShoppingListProps) {
  const [items, setItems] = useState(initialItems);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | '野菜' | '肉・魚' | '調味料' | 'その他'>('all');
  
  useEffect(() => {
    // ローカルストレージから保存済みのチェック状態を復元
    const savedChecked = localStorage.getItem('shopping-checked');
    if (savedChecked) {
      setCheckedItems(JSON.parse(savedChecked));
    }
  }, []);
  
  useEffect(() => {
    // チェック状態をローカルストレージに保存
    localStorage.setItem('shopping-checked', JSON.stringify(checkedItems));
  }, [checkedItems]);
  
  const toggleItem = (ingredient: string) => {
    if (checkedItems.includes(ingredient)) {
      setCheckedItems(checkedItems.filter(item => item !== ingredient));
    } else {
      setCheckedItems([...checkedItems, ingredient]);
    }
  };
  
  const clearAll = () => {
    setCheckedItems([]);
  };
  
  const copyToClipboard = () => {
    const text = items
      .filter(item => filter === 'all' || item.category === filter)
      .map(item => `${checkedItems.includes(item.ingredient) ? '✓' : '□'} ${item.ingredient} - ${item.amount}`)
      .join('\n');
    
    navigator.clipboard.writeText(text);
    alert('買い物リストをクリップボードにコピーしました');
  };
  
  const categories = ['all', '野菜', '肉・魚', '調味料', 'その他'] as const;
  
  const filteredItems = items.filter(
    item => filter === 'all' || item.category === filter
  );
  
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);
  
  const progress = (checkedItems.length / items.length) * 100;

  return (
    <div>
      {/* 進捗バー */}
      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <ShoppingBag className="w-5 h-5 text-primary-500 mr-2" />
            <span className="font-medium text-gray-900">
              買い物の進捗
            </span>
          </div>
          <span className="text-sm text-gray-600">
            {checkedItems.length} / {items.length}
          </span>
        </div>
        
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-400 to-primary-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </Card>
      
      {/* フィルター */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setFilter(category as any)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              filter === category
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {category === 'all' ? 'すべて' : category}
            {category !== 'all' && (
              <span className="ml-1 text-xs">
                ({items.filter(item => item.category === category).length})
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* アクションボタン */}
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          size="small"
          onClick={copyToClipboard}
          icon={<Copy className="w-4 h-4" />}
        >
          コピー
        </Button>
        
        <Button
          variant="outline"
          size="small"
          onClick={clearAll}
          icon={<Trash2 className="w-4 h-4" />}
          disabled={checkedItems.length === 0}
        >
          クリア
        </Button>
      </div>
      
      {/* 買い物リスト */}
      <AnimatePresence mode="wait">
        {filter === 'all' ? (
          // カテゴリー別表示
          <motion.div
            key="grouped"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category}>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary-500 mr-2" />
                  {category}
                </h4>
                
                <div className="space-y-2">
                  {categoryItems.map((item, index) => {
                    const isChecked = checkedItems.includes(item.ingredient);
                    
                    return (
                      <motion.div
                        key={`${item.ingredient}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card
                          className={`p-3 ${isChecked ? 'bg-gray-50' : ''}`}
                          onClick={() => toggleItem(item.ingredient)}
                        >
                          <div className="flex items-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleItem(item.ingredient);
                              }}
                              className="mr-3"
                            >
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                isChecked
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-gray-300'
                              }`}>
                                {isChecked && (
                                  <Check className="w-4 h-4 text-white" />
                                )}
                              </div>
                            </button>
                            
                            <div className="flex-1">
                              <p className={`text-gray-900 ${
                                isChecked ? 'line-through opacity-60' : ''
                              }`}>
                                {item.ingredient}
                              </p>
                            </div>
                            
                            <span className="text-sm text-gray-500">
                              {item.amount}
                            </span>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          // フィルター適用時の表示
          <motion.div
            key="filtered"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {filteredItems.map((item, index) => {
              const isChecked = checkedItems.includes(item.ingredient);
              
              return (
                <motion.div
                  key={`${item.ingredient}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`p-3 ${isChecked ? 'bg-gray-50' : ''}`}
                    onClick={() => toggleItem(item.ingredient)}
                  >
                    <div className="flex items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItem(item.ingredient);
                        }}
                        className="mr-3"
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isChecked
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300'
                        }`}>
                          {isChecked && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </button>
                      
                      <div className="flex-1">
                        <p className={`text-gray-900 ${
                          isChecked ? 'line-through opacity-60' : ''
                        }`}>
                          {item.ingredient}
                        </p>
                      </div>
                      
                      <span className="text-sm text-gray-500">
                        {item.amount}
                      </span>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 完了メッセージ */}
      {checkedItems.length === items.length && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl text-center"
        >
          <p className="text-green-800 font-medium">
            🎉 買い物完了！
          </p>
          <p className="text-green-600 text-sm mt-1">
            すべての材料が揃いました
          </p>
        </motion.div>
      )}
    </div>
  );
}
