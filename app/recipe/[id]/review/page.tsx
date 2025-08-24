'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MobileLayout from '../../../../components/layout/MobileLayout';
import { useReviewStore } from '../../../../lib/review-store';
import { useMealStore } from '../../../../lib/store';
import { motion } from 'framer-motion';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown,
  Clock,
  ChefHat,
  MessageSquare,
  Lightbulb,
  Camera,
  Tag,
  Save,
  Trash2,
  RotateCcw
} from 'lucide-react';
import type { Recipe, RecipeReview } from '../../../../lib/types';
import { sampleRecipes } from '../../../../lib/sample-data';

export default function RecipeReviewPage() {
  const router = useRouter();
  const params = useParams();
  const recipeId = params.id as string;
  
  const { addReview, updateReview, getReviewsByRecipe } = useReviewStore();
  const { history } = useMealStore();
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [existingReview, setExistingReview] = useState<RecipeReview | null>(null);
  const [formData, setFormData] = useState({
    rating: 0,
    difficulty: 'as_expected' as "easier" | "as_expected" | "harder",
    taste: 'good' as "poor" | "fair" | "good" | "very_good" | "excellent",
    notes: '',
    improvements: '',
    wouldMakeAgain: true,
    actualCookingTime: 0,
    tags: [] as string[]
  });

  // 初回読み込み
  useEffect(() => {
    // レシピを検索
    let foundRecipe = sampleRecipes.find(r => r.id === recipeId);
    
    if (!foundRecipe) {
      // 履歴からレシピを検索
      for (const meal of history) {
        const foundInMeal = meal.recipes.find(r => r.id === recipeId);
        if (foundInMeal) {
          foundRecipe = foundInMeal;
          break;
        }
      }
    }
    
    if (foundRecipe) {
      setRecipe(foundRecipe);
      setFormData(prev => ({
        ...prev,
        actualCookingTime: foundRecipe!.cookingTime
      }));
      
      // 既存のレビューをチェック
      const reviews = getReviewsByRecipe(recipeId);
      if (reviews.length > 0) {
        const latestReview = reviews[0];
        setExistingReview(latestReview);
        setFormData({
          rating: latestReview.rating,
          difficulty: latestReview.difficulty as "easier" | "as_expected" | "harder",
          taste: latestReview.taste as "poor" | "fair" | "good" | "very_good" | "excellent",
          notes: latestReview.notes,
          improvements: latestReview.improvements,
          wouldMakeAgain: latestReview.wouldMakeAgain,
          actualCookingTime: latestReview.actualCookingTime || foundRecipe!.cookingTime,
          tags: latestReview.tags
        });
      }
    }
  }, [recipeId, history, getReviewsByRecipe]);

  // フォーム送信
  const handleSubmit = () => {
    if (!recipe || formData.rating === 0) return;

    const reviewData = {
      recipeId: recipe.id,
      recipeName: recipe.name,
      ...formData
    };

    if (existingReview) {
      updateReview(existingReview.id, reviewData);
    } else {
      addReview(reviewData);
    }

    router.push(`/recipe/${recipeId}`);
  };

  // タグ追加/削除
  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  // 評価タグ候補
  const availableTags = [
    '簡単', '美味しい', 'ヘルシー', '時短', 'コスパ良し', 
    '子供受け', 'お弁当向き', 'おもてなし', '作り置き', 
    '失敗した', 'リピート確定', '手間かかる', '材料多い'
  ];

  if (!recipe) {
    return (
      <MobileLayout title="レシピが見つかりません" showBack>
        <div className="text-center py-16">
          <p className="text-gray-500">指定されたレシピが見つかりませんでした。</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="レシピレビュー" showBack>
      <div className="px-4 py-6 space-y-6">
        {/* レシピヘッダー */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <ChefHat className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">{recipe.name}</h2>
              <p className="text-purple-100">
                {existingReview ? 'レビューを編集' : '料理の感想を教えてください'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-purple-100">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              予定時間: {recipe.cookingTime}分
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              {recipe.difficulty === 'easy' ? '簡単' : recipe.difficulty === 'medium' ? '普通' : '上級'}
            </span>
          </div>
        </div>

        {/* 総合評価 */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            総合評価 *
          </h3>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                className="p-2 transition-transform hover:scale-110"
              >
                <Star 
                  className={`w-8 h-8 ${
                    star <= formData.rating 
                      ? 'text-yellow-500 fill-current' 
                      : 'text-gray-300'
                  }`} 
                />
              </button>
            ))}
          </div>
          
          <p className="text-center text-gray-600 text-sm">
            {formData.rating === 0 && 'タップして評価してください'}
            {formData.rating === 1 && 'う〜ん...'}
            {formData.rating === 2 && 'いまいち'}
            {formData.rating === 3 && 'まあまあ'}
            {formData.rating === 4 && 'とても良い'}
            {formData.rating === 5 && '最高！'}
          </p>
        </div>

        {/* 詳細評価 */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 space-y-6">
          <h3 className="text-lg font-bold text-gray-800">詳細評価</h3>
          
          {/* 難易度 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              難易度はどうでしたか？
            </label>
            <div className="flex gap-2">
              {[
                { value: 'easier', label: '簡単だった', icon: ThumbsUp, color: 'green' },
                { value: 'as_expected', label: '予想通り', icon: ChefHat, color: 'blue' },
                { value: 'harder', label: '難しかった', icon: ThumbsDown, color: 'red' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData(prev => ({ ...prev, difficulty: option.value as any }))}
                  className={`flex-1 p-3 rounded-xl border-2 transition-colors ${
                    formData.difficulty === option.value
                      ? `border-${option.color}-500 bg-${option.color}-50`
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <option.icon className={`w-5 h-5 mx-auto mb-1 ${
                    formData.difficulty === option.value 
                      ? `text-${option.color}-600` 
                      : 'text-gray-400'
                  }`} />
                  <div className={`text-xs font-medium ${
                    formData.difficulty === option.value 
                      ? `text-${option.color}-700` 
                      : 'text-gray-600'
                  }`}>
                    {option.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 味 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              味はいかがでしたか？
            </label>
            <div className="flex gap-1">
              {[
                { value: 'poor', label: '残念' },
                { value: 'fair', label: 'まあまあ' },
                { value: 'good', label: '良い' },
                { value: 'very_good', label: 'とても良い' },
                { value: 'excellent', label: '最高' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData(prev => ({ ...prev, taste: option.value as any }))}
                  className={`flex-1 p-2 rounded-lg text-xs font-medium transition-colors ${
                    formData.taste === option.value
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 実際の調理時間 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              実際の調理時間（分）
            </label>
            <input
              type="number"
              value={formData.actualCookingTime}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                actualCookingTime: parseInt(e.target.value) || 0 
              }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:outline-none"
              placeholder="実際にかかった時間"
            />
          </div>

          {/* また作るかどうか */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              また作りたいですか？
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setFormData(prev => ({ ...prev, wouldMakeAgain: true }))}
                className={`flex-1 p-3 rounded-xl border-2 transition-colors ${
                  formData.wouldMakeAgain
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <ThumbsUp className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm font-medium">はい</div>
              </button>
              <button
                onClick={() => setFormData(prev => ({ ...prev, wouldMakeAgain: false }))}
                className={`flex-1 p-3 rounded-xl border-2 transition-colors ${
                  !formData.wouldMakeAgain
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <ThumbsDown className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm font-medium">いいえ</div>
              </button>
            </div>
          </div>
        </div>

        {/* メモとコメント */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-800">コメント</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              感想・メモ
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="料理の感想、調理中の気づき、家族の反応など自由にメモしてください"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:outline-none resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              次回への改善点
            </label>
            <textarea
              value={formData.improvements}
              onChange={(e) => setFormData(prev => ({ ...prev, improvements: e.target.value }))}
              placeholder="次回作るときに気をつけたいこと、アレンジのアイデアなど"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:outline-none resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* タグ */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5" />
            タグ
          </h3>
          
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  formData.tags.includes(tag)
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-3">
          {existingReview && (
            <button
              onClick={() => {
                setFormData({
                  rating: 0,
                  difficulty: 'as_expected',
                  taste: 'good',
                  notes: '',
                  improvements: '',
                  wouldMakeAgain: true,
                  actualCookingTime: recipe.cookingTime,
                  tags: []
                });
              }}
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              リセット
            </button>
          )}
          
          <button
            onClick={handleSubmit}
            disabled={formData.rating === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
          >
            <Save className="w-4 h-4" />
            {existingReview ? 'レビューを更新' : 'レビューを保存'}
          </button>
        </div>

        {/* 既存レビューの削除 */}
        {existingReview && (
          <button
            onClick={() => {
              if (confirm('このレビューを削除しますか？')) {
                // deleteReview(existingReview.id);
                router.push(`/recipe/${recipeId}`);
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            レビューを削除
          </button>
        )}
      </div>
    </MobileLayout>
  );
}