import { Recipe, MealSuggestion } from './types';

export const sampleRecipes: Recipe[] = [
  {
    id: 'r1',
    name: '肉じゃが',
    category: 'main',
    cookingTime: 40,
    difficulty: 'medium',
    servings: 4,
    ingredients: [
      { name: 'じゃがいも', amount: '4', unit: '個' },
      { name: '牛肉薄切り', amount: '200', unit: 'g' },
      { name: '玉ねぎ', amount: '1', unit: '個' },
      { name: 'にんじん', amount: '1', unit: '本' },
      { name: 'しらたき', amount: '1', unit: '袋' },
      { name: '醤油', amount: '大さじ3' },
      { name: 'みりん', amount: '大さじ2' },
      { name: '砂糖', amount: '大さじ1' },
      { name: 'だし汁', amount: '400', unit: 'ml' },
    ],
    steps: [
      { order: 1, description: 'じゃがいも、にんじんを一口大に切る', duration: 5 },
      { order: 2, description: '玉ねぎをくし切りにする', duration: 2 },
      { order: 3, description: '牛肉を炒めて取り出す', duration: 5 },
      { order: 4, description: '野菜を炒める', duration: 5 },
      { order: 5, description: 'だし汁と調味料を加えて煮込む', duration: 20 },
      { order: 6, description: '牛肉を戻して、味を調える', duration: 3 },
    ],
    nutrition: {
      calories: 380,
      protein: 18,
      fat: 12,
      carbohydrates: 45,
      fiber: 4,
      salt: 2.5,
    },
    tags: ['和食', '煮物', '定番', '作り置き'],
  },
  {
    id: 'r2',
    name: '鮭の塩焼き',
    category: 'main',
    cookingTime: 15,
    difficulty: 'easy',
    servings: 4,
    ingredients: [
      { name: '生鮭', amount: '4', unit: '切れ' },
      { name: '塩', amount: '小さじ1' },
      { name: '大根おろし', amount: '適量', optional: true },
      { name: 'レモン', amount: '1/2', unit: '個', optional: true },
    ],
    steps: [
      { order: 1, description: '鮭に塩を振って10分置く', duration: 10 },
      { order: 2, description: 'グリルで両面を焼く', duration: 8 },
      { order: 3, description: '大根おろしとレモンを添える', duration: 2 },
    ],
    nutrition: {
      calories: 180,
      protein: 25,
      fat: 8,
      carbohydrates: 0,
      fiber: 0,
      salt: 1.5,
    },
    tags: ['和食', '魚料理', '簡単', 'ヘルシー'],
  },
  {
    id: 'r3',
    name: '味噌汁（豆腐とわかめ）',
    category: 'soup',
    cookingTime: 10,
    difficulty: 'easy',
    servings: 4,
    ingredients: [
      { name: '豆腐', amount: '1/2', unit: '丁' },
      { name: 'わかめ（乾燥）', amount: '大さじ1' },
      { name: 'だし汁', amount: '600', unit: 'ml' },
      { name: '味噌', amount: '大さじ2' },
      { name: 'ねぎ', amount: '適量', optional: true },
    ],
    steps: [
      { order: 1, description: 'だし汁を温める', duration: 3 },
      { order: 2, description: '豆腐を切って加える', duration: 2 },
      { order: 3, description: 'わかめを加える', duration: 1 },
      { order: 4, description: '味噌を溶き入れる', duration: 2 },
      { order: 5, description: 'ねぎを散らす', duration: 1 },
    ],
    nutrition: {
      calories: 45,
      protein: 4,
      fat: 2,
      carbohydrates: 3,
      fiber: 1,
      salt: 1.8,
    },
    tags: ['和食', '汁物', '簡単', '定番'],
  },
  {
    id: 'r4',
    name: 'ほうれん草のお浸し',
    category: 'side',
    cookingTime: 10,
    difficulty: 'easy',
    servings: 4,
    ingredients: [
      { name: 'ほうれん草', amount: '1', unit: '束' },
      { name: '醤油', amount: '大さじ1' },
      { name: 'だし汁', amount: '大さじ2' },
      { name: 'かつお節', amount: '適量' },
    ],
    steps: [
      { order: 1, description: 'ほうれん草を茹でる', duration: 3 },
      { order: 2, description: '冷水にとって絞る', duration: 2 },
      { order: 3, description: '食べやすく切る', duration: 2 },
      { order: 4, description: '調味料で和える', duration: 1 },
      { order: 5, description: 'かつお節をかける', duration: 1 },
    ],
    nutrition: {
      calories: 25,
      protein: 2,
      fat: 0.5,
      carbohydrates: 3,
      fiber: 2,
      salt: 0.8,
    },
    tags: ['和食', '副菜', '簡単', 'ヘルシー'],
  },
  {
    id: 'r5',
    name: '親子丼',
    category: 'main',
    cookingTime: 20,
    difficulty: 'easy',
    servings: 4,
    ingredients: [
      { name: '鶏もも肉', amount: '300', unit: 'g' },
      { name: '玉ねぎ', amount: '1', unit: '個' },
      { name: '卵', amount: '6', unit: '個' },
      { name: '醤油', amount: '大さじ3' },
      { name: 'みりん', amount: '大さじ2' },
      { name: '砂糖', amount: '大さじ1' },
      { name: 'だし汁', amount: '200', unit: 'ml' },
      { name: 'ご飯', amount: '4', unit: '杯' },
      { name: '三つ葉', amount: '適量', optional: true },
    ],
    steps: [
      { order: 1, description: '鶏肉を一口大に切る', duration: 3 },
      { order: 2, description: '玉ねぎを薄切りにする', duration: 2 },
      { order: 3, description: 'だし汁と調味料を煮立てる', duration: 3 },
      { order: 4, description: '鶏肉と玉ねぎを煮る', duration: 8 },
      { order: 5, description: '溶き卵を回し入れる', duration: 2 },
      { order: 6, description: 'ご飯にのせて三つ葉を散らす', duration: 2 },
    ],
    nutrition: {
      calories: 520,
      protein: 28,
      fat: 15,
      carbohydrates: 65,
      fiber: 2,
      salt: 2.2,
    },
    tags: ['和食', '丼物', '簡単', '人気'],
  },
];

export const sampleMealSuggestions: MealSuggestion[] = [
  {
    id: 'meal1',
    title: '定番の和食夕食セット',
    description: 'バランスの良い、家庭的な和食の組み合わせ',
    recipes: [
      sampleRecipes[0], // 肉じゃが
      sampleRecipes[1], // 鮭の塩焼き
      sampleRecipes[2], // 味噌汁
      sampleRecipes[3], // ほうれん草のお浸し
    ],
    totalTime: 40,
    totalCalories: 630,
    shoppingList: [
      { ingredient: 'じゃがいも', amount: '4個' },
      { ingredient: '牛肉薄切り', amount: '200g' },
      { ingredient: '生鮭', amount: '4切れ' },
      { ingredient: 'ほうれん草', amount: '1束' },
      { ingredient: '豆腐', amount: '1/2丁' },
      { ingredient: '玉ねぎ', amount: '1個' },
      { ingredient: 'にんじん', amount: '1本' },
      { ingredient: 'わかめ（乾燥）', amount: '大さじ1' },
    ],
    cookingSchedule: [
      { time: '18:00', task: '肉じゃがの下準備を始める', recipeId: 'r1', recipeName: '肉じゃが' },
      { time: '18:10', task: '肉じゃがを煮込み始める', recipeId: 'r1', recipeName: '肉じゃが' },
      { time: '18:25', task: '鮭に塩を振る', recipeId: 'r2', recipeName: '鮭の塩焼き' },
      { time: '18:30', task: 'ほうれん草を茹でる', recipeId: 'r4', recipeName: 'ほうれん草のお浸し' },
      { time: '18:35', task: '鮭を焼き始める', recipeId: 'r2', recipeName: '鮭の塩焼き' },
      { time: '18:40', task: '味噌汁を作る', recipeId: 'r3', recipeName: '味噌汁' },
      { time: '18:45', task: '盛り付けて完成', recipeId: 'all', recipeName: '全体' },
    ],
    createdAt: new Date(),
  },
];

// よく使う食材リスト
export const commonIngredients = [
  '鶏肉', '豚肉', '牛肉', '鮭', 'さば', 'たら',
  'じゃがいも', '玉ねぎ', 'にんじん', 'キャベツ', '白菜', 'ほうれん草',
  '大根', 'なす', 'トマト', 'きゅうり', 'ピーマン', 'もやし',
  '豆腐', '納豆', '卵', '牛乳', 'チーズ',
  'ご飯', 'うどん', 'そば', 'パスタ',
];

// アレルギー物質リスト
export const allergyItems = [
  '卵', '乳', '小麦', 'そば', '落花生', 'えび', 'かに',
  '大豆', 'いか', 'いくら', 'さけ', 'さば', '牛肉', '鶏肉',
  '豚肉', 'まつたけ', 'やまいも', 'オレンジ', 'キウイフルーツ',
  'バナナ', 'もも', 'りんご', 'ゼラチン', 'ごま', 'カシューナッツ',
  'くるみ', 'アーモンド',
];

// 季節の食材
export const seasonalIngredients = {
  spring: ['たけのこ', '菜の花', '新じゃが', '新玉ねぎ', 'アスパラガス', 'そら豆'],
  summer: ['トマト', 'きゅうり', 'なす', 'ピーマン', 'ゴーヤ', 'とうもろこし'],
  autumn: ['さつまいも', 'きのこ', '栗', 'さんま', '柿', 'なし'],
  winter: ['白菜', '大根', 'ねぎ', 'ブリ', 'みかん', 'ゆず'],
};
