'use client';

import { useRouter } from 'next/navigation';
import { useMealStore } from '../../lib/store';
import { motion } from 'framer-motion';
import { 
  ChevronRight, 
  Sunrise, 
  Sun, 
  Moon, 
  Package, 
  PartyPopper, 
  Users, 
  Clock, 
  Heart, 
  Beef, 
  Leaf, 
  Feather,
  Utensils,
  Wallet,
  ChefHat,
  Edit3,
  Home
} from 'lucide-react';

const mealTypeConfig = {
  breakfast: { label: '朝食', icon: Sunrise, color: 'text-yellow-600' },
  lunch: { label: '昼食', icon: Sun, color: 'text-blue-600' },
  dinner: { label: '夕食', icon: Moon, color: 'text-purple-600' },
  bento: { label: 'お弁当', icon: Package, color: 'text-green-600' },
  party: { label: 'おもてなし', icon: PartyPopper, color: 'text-red-600' },
};

const nutritionConfig = {
  balanced: { label: 'バランス重視', icon: Heart, color: 'text-green-600' },
  protein: { label: 'タンパク質多め', icon: Beef, color: 'text-red-600' },
  vegetable: { label: '野菜中心', icon: Leaf, color: 'text-green-500' },
  light: { label: 'あっさり・軽め', icon: Feather, color: 'text-blue-600' },
};

const budgetConfig = {
  economy: { label: '節約重視', color: 'text-green-600' },
  standard: { label: '標準', color: 'text-blue-600' },
  premium: { label: 'ちょっと豪華', color: 'text-purple-600' },
};

const difficultyConfig = {
  easy: { label: '簡単', color: 'text-green-600' },
  medium: { label: '普通', color: 'text-yellow-600' },
  any: { label: 'おまかせ', color: 'text-purple-600' },
};

export default function ConfirmStep() {
  const router = useRouter();
  const { formData, setLoading } = useMealStore();

  const handleEdit = (step: number) => {
    router.push(`/meal-form/${step}`);
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // TODO: 実際のAPI呼び出しを実装
      // const response = await fetch('/api/generate-meal', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      // const result = await response.json();
      
      // 仮の遅延を入れてローディング状態をシミュレート
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 結果ページへリダイレクト
      router.push('/result');
    } catch (error) {
      console.error('献立生成エラー:', error);
      setLoading(false);
      // エラーハンドリング
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const mealType = mealTypeConfig[formData.mealType || 'dinner'];
  const MealIcon = mealType.icon;
  
  const nutrition = nutritionConfig[formData.nutritionBalance || 'balanced'];
  const NutritionIcon = nutrition.icon;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              設定内容をご確認ください
            </h2>
            <p className="text-sm text-gray-600">
              内容に問題がなければ献立を作成します
            </p>
          </div>

          {/* 食事の種類 */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MealIcon className={`w-6 h-6 ${mealType.color}`} />
                <div>
                  <h3 className="font-semibold text-gray-800">食事の種類</h3>
                  <p className="text-gray-600">{mealType.label}</p>
                </div>
              </div>
              <button
                onClick={() => handleEdit(1)}
                className="p-2 text-gray-400 hover:text-pink-600 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 人数と時間 */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">人数と時間</h3>
              <button
                onClick={() => handleEdit(2)}
                className="p-2 text-gray-400 hover:text-pink-600 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" />
                <span className="text-gray-600">{formData.servings}人分</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-gray-600">
                  {formData.cookingTime === 'unlimited' ? 'じっくり' : `${formData.cookingTime}分以内`}
                </span>
              </div>
            </div>
          </div>

          {/* 食材 */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">食材</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(3)}
                  className="p-2 text-gray-400 hover:text-pink-600 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(4)}
                  className="p-2 text-gray-400 hover:text-pink-600 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">使いたい食材</p>
                {formData.ingredients && formData.ingredients.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {formData.ingredients.map((ingredient) => (
                      <span key={ingredient} className="chip text-xs">
                        {ingredient}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">指定なし</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">避けたい食材・アレルギー</p>
                {(formData.avoidIngredients?.length || 0) + (formData.allergies?.length || 0) > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {formData.avoidIngredients?.map((ingredient) => (
                      <span key={ingredient} className="chip text-xs bg-orange-100">
                        {ingredient}
                      </span>
                    ))}
                    {formData.allergies?.map((allergy) => (
                      <span key={allergy} className="chip text-xs bg-red-100">
                        {allergy}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">指定なし</p>
                )}
              </div>
            </div>
          </div>

          {/* 栄養バランス */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <NutritionIcon className={`w-6 h-6 ${nutrition.color}`} />
                <div>
                  <h3 className="font-semibold text-gray-800">栄養バランス</h3>
                  <p className="text-gray-600">{nutrition.label}</p>
                </div>
              </div>
              <button
                onClick={() => handleEdit(5)}
                className="p-2 text-gray-400 hover:text-pink-600 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 品数・予算・難易度 */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">その他の設定</h3>
              <button
                onClick={() => handleEdit(6)}
                className="p-2 text-gray-400 hover:text-pink-600 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-orange-500" />
                <span className="text-gray-600">{formData.dishCount}品</span>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-green-500" />
                <span className={`${budgetConfig[formData.budget || 'standard'].color}`}>
                  {budgetConfig[formData.budget || 'standard'].label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-purple-500" />
                <span className={`${difficultyConfig[formData.difficulty || 'easy'].color}`}>
                  {difficultyConfig[formData.difficulty || 'easy'].label}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ボタンエリア */}
      <div className="px-4 py-4 bg-white border-t border-gray-100 space-y-3">
        {/* 作成ボタン */}
        <button
          onClick={handleSubmit}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <span>献立を作成する</span>
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* ホームに戻るボタン */}
        <button
          onClick={handleGoHome}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-2xl hover:bg-gray-200 active:scale-95 transition-all duration-200"
        >
          <Home className="w-5 h-5" />
          <span>ホームに戻る</span>
        </button>
      </div>
    </div>
  );
}
