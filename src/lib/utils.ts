// ユーティリティ関数
import { CookingTime, MealSuggestion, Recipe, ShoppingItem, CookingScheduleItem } from './types';

// Tailwind CSSクラスのマージユーティリティ
export function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// 調理時間の文字列を分に変換
export function cookingTimeToMinutes(time: CookingTime): number {
  switch (time) {
    case '30分以内':
      return 30;
    case '1時間':
      return 60;
    case 'じっくり':
      return 90;
    default:
      return 30;
  }
}

// 分を読みやすい形式に変換
export function formatCookingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}時間`;
  }
  return `${hours}時間${mins}分`;
}

// 現在の季節を取得
export function getCurrentSeason(): '春' | '夏' | '秋' | '冬' {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return '春';
  if (month >= 6 && month <= 8) return '夏';
  if (month >= 9 && month <= 11) return '秋';
  return '冬';
}

// 買い物リストを生成
export function generateShoppingList(recipes: Recipe[]): ShoppingItem[] {
  const ingredientMap = new Map<string, { amount: string; category: ShoppingItem['category'] }>();
  
  recipes.forEach(recipe => {
    recipe.ingredients.forEach(ingredient => {
      const key = ingredient.name;
      const category = categorizeIngredient(ingredient.name);
      
      if (ingredientMap.has(key)) {
        // 既存の材料に追加（簡易的な実装）
        const existing = ingredientMap.get(key)!;
        ingredientMap.set(key, {
          amount: `${existing.amount}, ${ingredient.amount}${ingredient.unit || ''}`,
          category: existing.category,
        });
      } else {
        ingredientMap.set(key, {
          amount: `${ingredient.amount}${ingredient.unit || ''}`,
          category,
        });
      }
    });
  });
  
  return Array.from(ingredientMap.entries()).map(([ingredient, { amount, category }]) => ({
    ingredient,
    amount,
    category,
    checked: false,
  }));
}

// 食材をカテゴリー分類
function categorizeIngredient(ingredient: string): ShoppingItem['category'] {
  const vegetables = ['キャベツ', '玉ねぎ', 'にんじん', 'じゃがいも', 'トマト', 'きゅうり', 'レタス', 'ほうれん草', '大根', 'なす', 'ピーマン', 'もやし', 'ブロッコリー', 'ごぼう', 'れんこん', 'しょうが', 'ねぎ'];
  const meatsAndFish = ['鶏', '豚', '牛', '肉', '鮭', 'さば', 'あじ', 'さんま', 'いわし', 'まぐろ', 'えび', 'いか', 'たこ'];
  const dairy = ['牛乳', 'チーズ', 'ヨーグルト', 'バター'];
  const seasonings = ['醤油', 'みりん', '酒', '砂糖', '塩', '味噌', 'だし', '油', 'ごま油'];
  
  if (vegetables.some(v => ingredient.includes(v))) return '野菜';
  if (meatsAndFish.some(m => ingredient.includes(m))) return '肉・魚';
  if (dairy.some(d => ingredient.includes(d))) return '乳製品';
  if (seasonings.some(s => ingredient.includes(s))) return '調味料';
  return 'その他';
}

// 調理スケジュールを生成
export function generateCookingSchedule(recipes: Recipe[], startTime = '18:00'): CookingScheduleItem[] {
  const schedule: CookingScheduleItem[] = [];
  let currentTime = parseTime(startTime);
  
  // 各レシピのステップを時系列で並べる（簡易実装）
  // 実際にはもっと複雑な最適化が必要
  recipes.forEach(recipe => {
    recipe.steps.forEach(step => {
      schedule.push({
        time: formatTime(currentTime),
        task: step.description,
        recipeName: recipe.name,
        duration: step.duration || 5,
      });
      currentTime += step.duration || 5;
    });
  });
  
  // 時間順にソート
  return schedule.sort((a, b) => {
    const timeA = parseTime(a.time);
    const timeB = parseTime(b.time);
    return timeA - timeB;
  });
}

// 時間文字列を分に変換
function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

// 分を時間文字列に変換
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// 献立の総カロリーを計算
export function calculateTotalCalories(recipes: Recipe[]): number {
  return recipes.reduce((total, recipe) => {
    return total + (recipe.nutrition?.calories || 0);
  }, 0);
}

// 献立の総調理時間を計算（並行調理を考慮）
export function calculateTotalCookingTime(recipes: Recipe[]): number {
  // 簡易実装：最も時間のかかるレシピ + その他の下準備時間
  if (recipes.length === 0) return 0;
  
  const maxTime = Math.max(...recipes.map(r => r.cookingTime));
  const prepTime = recipes.length > 1 ? 10 : 0; // 複数料理の場合は準備時間を追加
  
  return maxTime + prepTime;
}

// ローカルストレージのキー
export const STORAGE_KEYS = {
  MEAL_HISTORY: 'meal-history',
  FAVORITES: 'meal-favorites',
  PREFERENCES: 'meal-preferences',
  THEME: 'app-theme',
} as const;

// デバウンス関数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// スマホ判定
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// PWAインストール判定
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
}

// 献立をシェア用テキストに変換
export function mealToShareText(meal: MealSuggestion): string {
  const recipes = meal.recipes.map(r => `・${r.name}`).join('\n');
  const time = formatCookingTime(meal.totalCookingTime);
  const calories = meal.totalCalories;
  
  return `【今日の献立】\n${meal.title}\n\n${recipes}\n\n調理時間: ${time}\nカロリー: ${calories}kcal\n\n#献立アプリ #和食献立`;
}

// Web Share API対応チェック
export function canShare(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'share' in navigator;
}

// 献立をシェア
export async function shareMeal(meal: MealSuggestion): Promise<boolean> {
  if (!canShare()) return false;
  
  try {
    await navigator.share({
      title: meal.title,
      text: mealToShareText(meal),
    });
    return true;
  } catch (error) {
    console.error('Share failed:', error);
    return false;
  }
}
