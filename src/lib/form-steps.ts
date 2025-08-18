// フォームステップの定義
export const formSteps = [
  {
    id: 1,
    title: '食事の種類',
    description: 'どの食事を作りますか？',
    component: 'MealTypeStep',
  },
  {
    id: 2,
    title: '人数・時間',
    description: '何人分を何分で作りますか？',
    component: 'ServingsTimeStep',
  },
  {
    id: 3,
    title: '使いたい食材',
    description: '使いたい食材を選んでください',
    component: 'IngredientsStep',
  },
  {
    id: 4,
    title: '避けたい食材',
    description: 'アレルギーや苦手な食材',
    component: 'AvoidIngredientsStep',
  },
  {
    id: 5,
    title: '栄養・難易度',
    description: '栄養バランスと調理難易度',
    component: 'NutritionDifficultyStep',
  },
  {
    id: 6,
    title: '品数・予算',
    description: '品数と予算の設定',
    component: 'DishCountBudgetStep',
  },
  {
    id: 7,
    title: '確認',
    description: '入力内容の確認',
    component: 'ConfirmStep',
  },
];
