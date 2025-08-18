/**
 * 献立生成統合機能
 * Groq API と モック生成を統合
 */

import { generateMealsWithGroq, GroqMealGenerationRequest, GroqMealResponse, checkGroqApiKey } from './api/groq';

export interface MealGenerationRequest {
  ingredients: string[];
  servings?: number;
  cookingTime?: number;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  dietaryRestrictions?: string[];
  preferences?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  cuisine?: string;
  useGroqAPI?: boolean;
}

export interface MealGenerationResponse {
  success: boolean;
  meals?: {
    name: string;
    ingredients: string[];
    instructions: string[];
    cookingTime: number;
    servings: number;
    difficulty: string;
    category: string;
    tips?: string[];
  }[];
  error?: string;
  source: 'groq-api' | 'mock-data';
  rawResponse?: string;
}

/**
 * Groq APIを使用して献立を生成
 */
export async function generateMeals(request: MealGenerationRequest): Promise<MealGenerationResponse> {
  console.log('🍽️ 献立生成開始:', request);

  // Groq APIが利用可能かつ明示的に無効化されていない場合
  const shouldUseGroq = request.useGroqAPI !== false && checkGroqApiKey();
  
  console.log('🤖 Groq API利用判定:', {
    useGroqAPI: request.useGroqAPI,
    apiKeyAvailable: checkGroqApiKey(),
    shouldUseGroq: shouldUseGroq
  });
  
  if (shouldUseGroq) {
    console.log('🚀 Groq APIで献立生成を試行...');
    
    try {
      const groqRequest: GroqMealGenerationRequest = {
        ingredients: request.ingredients,
        servings: request.servings,
        cookingTime: request.cookingTime,
        mealType: request.mealType,
        dietaryRestrictions: request.dietaryRestrictions,
        preferences: request.preferences,
        difficulty: request.difficulty,
        cuisine: request.cuisine,
      };

      console.log('📡 Groq APIリクエスト送信:', groqRequest);
      
      const groqResponse = await generateMealsWithGroq(groqRequest);
      
      console.log('📊 Groq APIレスポンス受信:', {
        success: groqResponse.success,
        mealsCount: groqResponse.meals?.length || 0,
        error: groqResponse.error,
        hasRawResponse: !!groqResponse.rawResponse
      });
      
      if (groqResponse.success && groqResponse.meals && groqResponse.meals.length > 0) {
        console.log('✅ Groq API献立生成成功!');
        
        // 生成された献立の詳細
        groqResponse.meals.forEach((meal, index) => {
          console.log(`  🍲 ${index + 1}: ${meal.name} (${meal.category}, ${meal.difficulty}, ${meal.cookingTime}分)`);
        });
        
        return {
          success: true,
          meals: groqResponse.meals,
          source: 'groq-api',
          rawResponse: groqResponse.rawResponse
        };
      } else {
        console.warn('⚠️ Groq API献立生成失敗、モックデータにフォールバック:', groqResponse.error);
      }
    } catch (error) {
      console.error('❌ Groq API献立生成エラー、モックデータにフォールバック:', error);
    }
  } else {
    console.log('🎭 Groq APIスキップ - APIキー未設定または無効化');
  }

  // Groq APIが失敗した場合、またはAPIキーが設定されていない場合はモックデータを使用
  console.log('🎭 モックデータで献立生成...');
  const mockResponse = generateMockMeals(request);
  
  return {
    success: true,
    meals: mockResponse.meals,
    source: 'mock-data'
  };
}

/**
 * モック献立データを生成
 */
function generateMockMeals(request: MealGenerationRequest): {
  meals: Array<{
    name: string;
    ingredients: string[];
    instructions: string[];
    cookingTime: number;
    servings: number;
    difficulty: string;
    category: string;
    tips?: string[];
  }>;
} {
  const { ingredients, servings = 2, cookingTime = 45, mealType = 'dinner', difficulty = 'medium' } = request;
  
  // 主要食材を基にした料理名の生成
  const primaryIngredients = ingredients.slice(0, 3);
  
  const mockMeals = [
    {
      name: `${primaryIngredients[0] || '野菜'}炒め`,
      ingredients: [
        ...ingredients.slice(0, 4),
        '醤油', 'ごま油', '塩・胡椒'
      ],
      instructions: [
        `${primaryIngredients[0] || '野菜'}を食べやすい大きさに切る`,
        'フライパンにごま油を熱し、材料を炒める',
        '醤油で味付けし、塩・胡椒で調味する',
        '全体に火が通ったら完成'
      ],
      cookingTime: Math.min(cookingTime, 20),
      servings,
      difficulty,
      category: '主菜',
      tips: ['強火で素早く炒めると美味しく仕上がります', '野菜の食感を残すのがポイントです']
    },
    {
      name: `${primaryIngredients[1] || '具材'}のみそ汁`,
      ingredients: [
        ...ingredients.slice(1, 3),
        'だし汁', 'みそ', 'ねぎ'
      ],
      instructions: [
        'だし汁を鍋で温める',
        `${primaryIngredients[1] || '具材'}を食べやすく切って加える`,
        '材料に火が通ったらみそを溶き入れる',
        '最後にねぎを散らして完成'
      ],
      cookingTime: Math.min(cookingTime, 15),
      servings,
      difficulty: 'easy',
      category: '汁物',
      tips: ['みそは最後に加えて香りを残しましょう']
    },
    {
      name: `${primaryIngredients[2] || '食材'}サラダ`,
      ingredients: [
        ...ingredients.slice(2, 4),
        'レタス', 'ドレッシング', 'トマト'
      ],
      instructions: [
        '野菜をよく洗って水気を切る',
        '食べやすい大きさに切る',
        '器に盛り付ける',
        'お好みのドレッシングをかけて完成'
      ],
      cookingTime: Math.min(cookingTime, 10),
      servings,
      difficulty: 'easy',
      category: '副菜',
      tips: ['野菜は冷やしておくとより美味しくいただけます']
    }
  ];

  // 食事タイプに応じて調整
  if (mealType === 'breakfast') {
    mockMeals[0].name = `${primaryIngredients[0] || '野菜'}入りスクランブルエッグ`;
    mockMeals[0].ingredients.push('卵', 'バター');
    mockMeals[1].name = 'フルーツヨーグルト';
    mockMeals[2].name = 'トースト';
  } else if (mealType === 'lunch') {
    mockMeals[0].name = `${primaryIngredients[0] || '野菜'}チャーハン`;
    mockMeals[0].ingredients.push('ご飯', '卵');
  }

  return { meals: mockMeals };
}

/**
 * 献立生成の詳細設定
 */
export interface MealGenerationConfig {
  enableGroqAPI: boolean;
  maxRetries: number;
  fallbackToMock: boolean;
  timeout: number;
}

/**
 * 高度な献立生成（設定付き）
 */
export async function generateMealsAdvanced(
  request: MealGenerationRequest, 
  config: MealGenerationConfig = {
    enableGroqAPI: true,
    maxRetries: 2,
    fallbackToMock: true,
    timeout: 30000
  }
): Promise<MealGenerationResponse> {
  
  if (!config.enableGroqAPI) {
    console.log('🎭 Groq API無効、モックデータで生成');
    const mockResponse = generateMockMeals(request);
    return {
      success: true,
      meals: mockResponse.meals,
      source: 'mock-data'
    };
  }

  // タイムアウト付きでGroq APIを実行
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      console.log(`🔄 Groq API実行試行 ${attempt}/${config.maxRetries}`);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('タイムアウト')), config.timeout);
      });

      const generatePromise = generateMeals({ ...request, useGroqAPI: true });
      
      const result = await Promise.race([generatePromise, timeoutPromise]);
      
      if (result.success && result.source === 'groq-api') {
        console.log(`✅ Groq API成功（試行${attempt}）`);
        return result;
      }
      
      lastError = result.error;
      
    } catch (error) {
      lastError = error instanceof Error ? error.message : '予期しないエラー';
      console.warn(`⚠️ Groq API試行${attempt}失敗:`, lastError);
    }
  }

  // 全ての試行が失敗した場合
  if (config.fallbackToMock) {
    console.log('🎭 Groq API失敗、モックデータにフォールバック');
    const mockResponse = generateMockMeals(request);
    return {
      success: true,
      meals: mockResponse.meals,
      source: 'mock-data',
      error: `Groq API失敗（${lastError}）、モックデータを使用`
    };
  }

  return {
    success: false,
    source: 'groq-api',
    error: `献立生成に失敗しました（${config.maxRetries}回試行）: ${lastError}`
  };
}

/**
 * Groq API状態チェック
 */
export function checkMealGenerationStatus(): {
  groqApiAvailable: boolean;
  apiKeyConfigured: boolean;
  status: 'ready' | 'api-only' | 'mock-only';
  message: string;
} {
  const apiKeyConfigured = checkGroqApiKey();
  
  if (apiKeyConfigured) {
    return {
      groqApiAvailable: true,
      apiKeyConfigured: true,
      status: 'ready',
      message: 'Groq APIが利用可能です。高品質な献立生成ができます。'
    };
  }

  return {
    groqApiAvailable: false,
    apiKeyConfigured: false,
    status: 'mock-only',
    message: 'Groq APIキーが未設定です。モックデータで献立生成を行います。'
  };
}
