// 献立関連の型定義
export interface Recipe {
  id: string;
  name: string;
  category: 'main' | 'side' | 'soup' | 'salad' | 'other';
  cookingTime: number; // 分
  difficulty: 'easy' | 'medium' | 'hard';
  servings: number;
  ingredients: Ingredient[];
  steps: CookingStep[];
  nutrition: NutritionInfo;
  tags: string[];
  imageUrl?: string;
}

export interface Ingredient {
  name: string;
  amount: string;
  unit?: string;
  optional?: boolean;
}

export interface CookingStep {
  order: number;
  description: string;
  duration?: number; // 分
  tips?: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  fiber: number;
  salt: number;
}

export interface MealPreference {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'bento' | 'party';
  servings: number;
  cookingTime: '30' | '60' | 'unlimited';
  ingredients: string[];
  avoidIngredients: string[];
  allergies: string[];
  nutritionBalance: 'balanced' | 'protein' | 'vegetable' | 'light';
  difficulty: 'easy' | 'medium' | 'any';
  dishCount: number;
  budget: 'economy' | 'standard' | 'premium';
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
}

export interface MealSuggestion {
  id: string;
  title: string;
  description: string;
  recipes: Recipe[];
  totalTime: number;
  totalCalories: number;
  shoppingList: ShoppingItem[];
  cookingSchedule: CookingScheduleItem[];
  createdAt: Date;
}

export interface ShoppingItem {
  ingredient: string;
  amount: string;
  unit?: string;
  checked?: boolean;
}

export interface CookingScheduleItem {
  time: string;
  task: string;
  recipeId: string;
  recipeName: string;
}

export interface FormStep {
  id: number;
  title: string;
  description: string;
  component: string;
}

export interface UserHistory {
  meals: MealSuggestion[];
  favorites: string[];
  preferences: Partial<MealPreference>;
}
