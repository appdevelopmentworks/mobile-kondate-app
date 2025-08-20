import { create } from 'zustand';
import type { MealPreference, MealSuggestion } from './types';

interface MealFormState {
  // State
  currentStep: number;
  formData: Partial<MealPreference> & {
    generatedSuggestion?: MealSuggestion; // AI生成済み献立データ
  };
  lastResult: MealSuggestion | null;
  history: MealSuggestion[];
  favorites: string[];
  isLoading: boolean;
  
  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateFormData: (data: Partial<MealPreference>) => void;
  setResult: (result: MealSuggestion) => void;
  setGeneratedSuggestion: (suggestion: MealSuggestion) => void; // 新規追加
  clearGeneratedSuggestion: () => void; // 新規追加
  addToHistory: (result: MealSuggestion) => void;
  addMeal: (meal: MealSuggestion) => void; // 新規追加
  addToFavorites: (id: string) => void;
  removeFromFavorites: (id: string) => void;
  toggleFavorite: (id: string) => void; // 新規追加
  setLoading: (loading: boolean) => void;
  resetForm: () => void;
  resetStore: () => void; // 完全リセット
  forceClearCache: () => void; // キャッシュ強制クリア
}

const initialFormData: Partial<MealPreference> = {
  servings: 2,
  cookingTime: '30',
  ingredients: [],
  avoidIngredients: [],
  allergies: [],
  nutritionBalance: 'balanced',
  difficulty: 'easy',
  dishCount: 3,
  budget: 'standard',
};

export const useMealStore = create<MealFormState>((set, get) => ({
  // Initial state
  currentStep: 1,
  formData: initialFormData,
  lastResult: null,
  history: [],
  favorites: [],
  isLoading: false,
  
  // Actions
  setStep: (step: number) => {
    console.log('ストア: ステップ設定', step);
    set({ currentStep: step });
  },
  
  nextStep: () => set((state) => ({ 
    currentStep: Math.min(state.currentStep + 1, 7) 
  })),
  
  prevStep: () => set((state) => ({ 
    currentStep: Math.max(state.currentStep - 1, 1) 
  })),
  
  updateFormData: (data: Partial<MealPreference>) => {
    console.log('ストア: フォームデータ更新開始');
    console.log('ストア: 更新前のデータ', get().formData);
    console.log('ストア: 新しいデータ', data);
    
    set((state) => {
      const newFormData = { ...state.formData, ...data };
      console.log('ストア: 更新後のデータ', newFormData);
      return { formData: newFormData };
    });
  },
  
  setResult: (result: MealSuggestion) => {
    console.log('ストア: 結果設定', result);
    set({ lastResult: result });
  },
  
  setGeneratedSuggestion: (suggestion: MealSuggestion) => {
    console.log('ストア: AI生成献立設定', suggestion.title);
    set((state) => ({
      formData: { ...state.formData, generatedSuggestion: suggestion }
    }));
  },
  
  clearGeneratedSuggestion: () => {
    console.log('ストア: AI生成献立クリア');
    set((state) => {
      const { generatedSuggestion, ...restFormData } = state.formData;
      return { formData: restFormData };
    });
  },
  
  addToHistory: (result: MealSuggestion) => {
    console.log('ストア: 履歴追加', result.title);
    set((state) => ({
      history: [result, ...state.history.slice(0, 9)] // Keep last 10
    }));
  },

  addMeal: (meal: MealSuggestion) => {
    console.log('ストア: 献立追加', meal.title);
    set((state) => ({
      history: [meal, ...state.history.slice(0, 9)], // 履歴に追加
      lastResult: meal, // 最新結果として設定
    }));
  },
  
  addToFavorites: (id: string) => {
    console.log('ストア: お気に入り追加', id);
    set((state) => ({
      favorites: state.favorites.includes(id) 
        ? state.favorites 
        : [...state.favorites, id]
    }));
  },
  
  removeFromFavorites: (id: string) => {
    console.log('ストア: お気に入り削除', id);
    set((state) => ({
      favorites: state.favorites.filter(fav => fav !== id)
    }));
  },

  toggleFavorite: (id: string) => {
    console.log('ストア: お気に入りトグル', id);
    set((state) => {
      const isCurrentlyFavorite = state.favorites.includes(id);
      return {
        favorites: isCurrentlyFavorite 
          ? state.favorites.filter(fav => fav !== id)
          : [...state.favorites, id]
      };
    });
  },
  
  setLoading: (loading: boolean) => {
    console.log('ストア: ローディング状態変更', loading);
    set({ isLoading: loading });
  },
  
  resetForm: () => {
    console.log('ストア: フォームリセット');
    set({
      currentStep: 1,
      formData: initialFormData,
      isLoading: false,
    });
  },
  
  resetStore: () => {
    console.log('🗑️ ストア: 完全リセット実行');
    set({
      currentStep: 1,
      formData: initialFormData,
      lastResult: null,
      history: [],
      favorites: [],
      isLoading: false,
    });
  },
  
  forceClearCache: () => {
    console.log('💥 ストア: キャッシュ強制クリア実行');
    set({
      currentStep: 1,
      formData: initialFormData,
      lastResult: null,
      history: [],
      favorites: [],
      isLoading: false,
    });
    
    // ブラウザストレージもクリア
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.clear();
        localStorage.clear();
        // IndexedDBもクリア（あれば）
        if ('indexedDB' in window) {
          indexedDB.deleteDatabase('meal-app-cache');
        }
        console.log('✅ ブラウザストレージも強制クリアしました');
      } catch (error) {
        console.warn('⚠️ ブラウザストレージクリア中にエラー:', error);
      }
    }
  },
}));
