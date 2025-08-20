import { MealPreference, MealSuggestion, ShoppingItem, CookingScheduleItem } from './types';
import { MealGenerationRequest as APIMealGenerationRequest, MealResponse } from './api/ai-providers';
import { sampleMealSuggestions } from './sample-data';

/**
 * 新しいAI統合システムを使用した献立生成
 */
export async function generateMealSuggestion(
  preferences: MealPreference,
  preferredProvider?: string
): Promise<{
  success: boolean;
  suggestion?: MealSuggestion;
  error?: string;
  provider?: string;
}> {
  try {
    console.log('🍽️ 献立生成開始 (新システム):', { preferences, preferredProvider });

    // AIサービスを直接インスタンス化（Hook外で使用）
    const { useApiKeyStore } = await import('./settings-store');
    const { AIServiceManager } = await import('./api/ai-service-manager');
    
    const apiKeyStore = useApiKeyStore.getState();
    
    // APIキー設定状況を詳細チェック
    const allApiKeys = {
      groqApiKey: apiKeyStore.getApiKey('groqApiKey'),
      geminiApiKey: apiKeyStore.getApiKey('geminiApiKey'),
      openaiApiKey: apiKeyStore.getApiKey('openaiApiKey'),
      anthropicApiKey: apiKeyStore.getApiKey('anthropicApiKey'),
      huggingfaceApiKey: apiKeyStore.getApiKey('huggingfaceApiKey'),
      togetherApiKey: apiKeyStore.getApiKey('togetherApiKey'),
    };
    
    const configuredKeys = Object.entries(allApiKeys)
      .filter(([_, key]) => !!key)
      .map(([provider, key]) => ({ provider, keyLength: key!.length, keyPreview: `${key!.substring(0, 8)}...` }));
    
    console.log('🔑 APIキー設定状況詳細:', {
      totalConfigured: configuredKeys.length,
      configuredProviders: configuredKeys,
      preferredProvider: preferredProvider || 'auto',
      hasAnyKey: configuredKeys.length > 0
    });
    
    if (configuredKeys.length === 0) {
      console.warn('❌ APIキーが1つも設定されていません！モックデータを使用します。');
      return generateFallbackMealSuggestion(preferences);
    }
    
    // Gemini APIキー使用状況を詳細ログ出力
    const geminiApiKey = apiKeyStore.getApiKey('geminiApiKey');
    const preferredMealProvider = apiKeyStore.getPreferredProvider('mealGeneration');
    console.log('🔍 Gemini API使用状況確認:', {
      hasGeminiKey: !!geminiApiKey,
      geminiKeyLength: geminiApiKey?.length || 0,
      geminiKeyPreview: geminiApiKey ? `${geminiApiKey.substring(0, 12)}...` : 'なし',
      preferredMealProvider: preferredMealProvider || 'auto',
      isGeminiPreferred: preferredMealProvider === 'geminiApiKey',
      timestamp: new Date().toISOString()
    });
    
    const aiService = new AIServiceManager(apiKeyStore);

    // 献立生成リクエストを構築
    const request: APIMealGenerationRequest = {
      ingredients: preferences.ingredients || [],
      servings: preferences.servings,
      cookingTime: parseInt(preferences.cookingTime || '45'),
      mealType: preferences.mealType as any,
      dietaryRestrictions: [
        ...(preferences.avoidIngredients || []),
        ...(preferences.allergies || [])
      ],
      preferences: [], // 今後拡張可能
      difficulty: preferences.difficulty as any,
      cuisine: '和洋中問わず', // デフォルト
    };

    // AI献立生成を実行
    console.log('🚀 AI献立生成リクエスト送信中...', request);
    const result = await aiService.generateMeals(request, preferredProvider);
    
    console.log('📊 AI献立生成結果:', {
      success: result.success,
      provider: result.provider,
      error: result.error,
      hasMeals: !!result.meals,
      mealsCount: result.meals?.length || 0,
      mealsPreview: result.meals?.slice(0, 2).map(meal => ({ name: meal.name, ingredients: meal.ingredients?.slice(0, 3) })) || []
    });

    if (!result.success || !result.meals || result.meals.length === 0) {
      console.warn('⚠️ AI献立生成失敗、モックデータを使用:', {
        success: result.success,
        hasMeals: !!result.meals,
        mealsLength: result.meals?.length || 0,
        error: result.error,
        provider: result.provider
      });
      return generateFallbackMealSuggestion(preferences);
    }

    // AI結果をMealSuggestion形式に変換
    const mealTypeMap = {
      breakfast: '朝食',
      lunch: '昼食', 
      dinner: '夕食',
      bento: 'お弁当',
      party: 'おもてなし'
    };
    
    const mealTypeName = mealTypeMap[preferences.mealType as keyof typeof mealTypeMap] || '夕食';
    
    const suggestion: MealSuggestion = {
      id: `ai_${Date.now()}`,
      title: `${mealTypeName}の献立`,
      description: `${result.provider}が提案する${preferences.servings || 2}人分の献立です`,
      recipes: result.meals.map(meal => ({
        id: `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: meal.name,
        category: meal.category as any,
        cookingTime: meal.cookingTime,
        difficulty: meal.difficulty as any,
        servings: meal.servings,
        ingredients: Array.isArray(meal.ingredients) 
          ? meal.ingredients.map((ing: string | any) => 
              typeof ing === 'string' 
                ? { name: ing, amount: '適量', unit: '' }
                : { name: ing.name || ing, amount: ing.amount || '適量', unit: ing.unit || '' }
            )
          : [],
        steps: Array.isArray(meal.instructions) 
          ? meal.instructions.map((instruction: string, index: number) => ({
              order: index + 1,
              description: instruction,
              duration: Math.ceil(meal.cookingTime / meal.instructions.length)
            }))
          : [],
        nutrition: {
          calories: Math.round(300 + Math.random() * 200),
          protein: Math.round(15 + Math.random() * 15),
          carbohydrates: Math.round(30 + Math.random() * 20),
          fat: Math.round(10 + Math.random() * 15),
          fiber: Math.round(2 + Math.random() * 3),
          salt: Math.round(1 + Math.random() * 2)
        },
        tags: meal.tips || [],
        imageUrl: ''
      })),
      totalTime: Math.max(...result.meals.map(m => m.cookingTime)),
      totalCalories: result.meals.reduce((sum, meal) => sum + 400, 0), // Default 400 calories per meal
      servings: preferences.servings || 2,
      tags: ['AI生成', result.provider || 'AI'],
      createdAt: new Date(),
      shoppingList: generateShoppingList(result.meals),
      cookingSchedule: generateCookingSchedule(result.meals),
    };

    console.log('✅ AI献立生成成功:', { 
      provider: result.provider, 
      recipeCount: suggestion.recipes.length 
    });

    return {
      success: true,
      suggestion,
      provider: result.provider,
    };

  } catch (error) {
    console.error('❌ 献立生成エラー (詳細):', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      preferences: preferences,
      preferredProvider: preferredProvider
    });
    return generateFallbackMealSuggestion(preferences);
  }
}

/**
 * フォールバック用の献立生成
 */
function generateFallbackMealSuggestion(preferences: MealPreference) {
  console.log('🔄 フォールバック献立生成を使用');
  
  const mealTypeMap = {
    breakfast: '朝食',
    lunch: '昼食', 
    dinner: '夕食',
    bento: 'お弁当',
    party: 'おもてなし'
  };
  
  const mealTypeName = mealTypeMap[preferences.mealType as keyof typeof mealTypeMap] || '夕食';
  
  const mockSuggestions = sampleMealSuggestions;
  const suggestion = mockSuggestions[0]; // 最初の提案を使用

  return {
    success: true,
    suggestion: {
      ...suggestion,
      title: `${mealTypeName}の献立 (サンプル)`,
      description: `${preferences.servings || 2}人分のサンプル献立です`,
      servings: preferences.servings || 2,
      tags: ['サンプル'],
    },
    provider: 'サンプルデータ',
  };
}

/**
 * 買い物リストを生成
 */
function generateShoppingList(meals: any[]): ShoppingItem[] {
  const ingredientMap = new Map();
  
  meals.forEach(meal => {
    if (Array.isArray(meal.ingredients)) {
      meal.ingredients.forEach((ing: string | any) => {
        const ingredientName = typeof ing === 'string' ? ing : (ing.name || ing);
        const amount = typeof ing === 'string' ? '適量' : (ing.amount || '適量');
        
        if (ingredientMap.has(ingredientName)) {
          // 既存の材料がある場合は数量を合計（簡易実装）
          const existing = ingredientMap.get(ingredientName);
          ingredientMap.set(ingredientName, {
            ingredient: ingredientName,
            amount: existing.amount === '適量' ? amount : `${existing.amount} + ${amount}`,
            checked: false
          });
        } else {
          ingredientMap.set(ingredientName, {
            ingredient: ingredientName,
            amount: amount,
            checked: false
          });
        }
      });
    }
  });
  
  return Array.from(ingredientMap.values());
}

/**
 * 調理スケジュールを生成
 */
function generateCookingSchedule(meals: any[]): CookingScheduleItem[] {
  const schedule: CookingScheduleItem[] = [];
  
  meals.forEach((meal, index) => {
    const startTime = index * 15; // 15分間隔で開始
    
    meal.instructions?.forEach((instruction: string, stepIndex: number) => {
      const time = startTime + stepIndex * 5; // 5分間隔
      schedule.push({
        time: `${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, '0')}`,
        task: instruction,
        recipeId: `recipe_${index}`,
        recipeName: meal.name,
      });
    });
  });
  
  return schedule.sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * クイック献立生成（おまかせ機能用）
 */
export async function generateQuickMealSuggestion(
  mealType: 'breakfast' | 'lunch' | 'dinner' = 'dinner',
  servings: number = 2,
  preferredProvider?: string
): Promise<{
  success: boolean;
  suggestion?: MealSuggestion;
  error?: string;
  provider?: string;
}> {
  const quickPreferences: MealPreference = {
    mealType,
    servings,
    cookingTime: '45',
    ingredients: ['おまかせ'],
    avoidIngredients: [],
    allergies: [],
    nutritionBalance: 'balanced',
    difficulty: 'easy',
    dishCount: 3,
    budget: 'standard',
  };

  return generateMealSuggestion(quickPreferences, preferredProvider);
}

/**
 * 食材ベース献立生成（カメラ認識結果から）
 */
export async function generateMealFromIngredients(
  ingredients: string[],
  mealType: 'breakfast' | 'lunch' | 'dinner' = 'dinner',
  servings: number = 2,
  preferredProvider?: string
): Promise<{
  success: boolean;
  suggestion?: MealSuggestion;
  error?: string;
  provider?: string;
}> {
  if (!ingredients || ingredients.length === 0) {
    return {
      success: false,
      error: '食材が指定されていません',
    };
  }

  const preferences: MealPreference = {
    mealType,
    servings,
    cookingTime: '45',
    ingredients: ingredients,
    avoidIngredients: [],
    allergies: [],
    nutritionBalance: 'balanced',
    difficulty: 'easy',
    dishCount: 3,
    budget: 'standard',
  };

  return generateMealSuggestion(preferences, preferredProvider);
}

/**
 * AI プロバイダーの状態確認
 */
export async function checkAIProviderStatus(): Promise<{
  available: boolean;
  providers: {
    mealGeneration: number;
    imageRecognition: number;
  };
  recommendations: {
    mealGeneration?: string;
    imageRecognition?: string;
  };
}> {
  try {
    const { useApiKeyStore } = await import('./settings-store');
    const { AIServiceManager, getRecommendedProvider } = await import('./api/ai-service-manager');
    
    const apiKeyStore = useApiKeyStore.getState();
    
    // 詳細なAPIキー状態をログ出力
    const allApiKeys = {
      groqApiKey: apiKeyStore.getApiKey('groqApiKey'),
      geminiApiKey: apiKeyStore.getApiKey('geminiApiKey'),
      openaiApiKey: apiKeyStore.getApiKey('openaiApiKey'),
      anthropicApiKey: apiKeyStore.getApiKey('anthropicApiKey'),
      huggingfaceApiKey: apiKeyStore.getApiKey('huggingfaceApiKey'),
      togetherApiKey: apiKeyStore.getApiKey('togetherApiKey'),
    };
    
    const configuredKeys = Object.entries(allApiKeys)
      .filter(([_, key]) => !!key)
      .map(([provider, key]) => ({ provider, keyLength: key!.length }));
    
    console.log('🔍 checkAIProviderStatus - APIキー状況:', {
      totalConfiguredKeys: configuredKeys.length,
      configuredProviders: configuredKeys,
      timestamp: new Date().toISOString()
    });
    
    const aiService = new AIServiceManager(apiKeyStore);
    
    const status = aiService.getProviderStatus();
    const mealProviders = aiService.getAvailableProviders('mealGeneration');
    const imageProviders = aiService.getAvailableProviders('imageRecognition');
    
    console.log('🔍 checkAIProviderStatus - プロバイダー状況:', {
      status,
      mealProvidersCount: mealProviders.length,
      imageProvidersCount: imageProviders.length,
      mealProviders: mealProviders.map(p => ({ name: p.label, hasKey: p.hasApiKey })),
      imageProviders: imageProviders.map(p => ({ name: p.label, hasKey: p.hasApiKey }))
    });
    
    const recommendedMeal = getRecommendedProvider('mealGeneration', mealProviders);
    const recommendedImage = getRecommendedProvider('imageRecognition', imageProviders);
    
    const result = {
      available: status.totalConfigured > 0,
      providers: {
        mealGeneration: status.mealGeneration.available,
        imageRecognition: status.imageRecognition.available,
      },
      recommendations: {
        mealGeneration: recommendedMeal?.label,
        imageRecognition: recommendedImage?.label,
      },
    };
    
    console.log('🎯 checkAIProviderStatus - 最終結果:', result);
    
    return result;
  } catch (error) {
    console.error('AIプロバイダー状態確認エラー:', error);
    return {
      available: false,
      providers: {
        mealGeneration: 0,
        imageRecognition: 0,
      },
      recommendations: {},
    };
  }
}

// 従来のAPI（後方互換性のため）
// generateMockMealSuggestions関数を作成（後方互換性のため）
export const generateMockMealSuggestions = () => sampleMealSuggestions;

// 旧APIとの互換性を保つためのラッパー
export interface LegacyMealGenerationRequest {
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
  source: 'ai-provider' | 'mock-data';
  provider?: string;
  rawResponse?: string;
}

/**
 * 旧APIとの互換性を保つための献立生成関数
 */
export async function generateMeals(request: LegacyMealGenerationRequest): Promise<MealGenerationResponse> {
  try {
    const { useApiKeyStore } = await import('./settings-store');
    const { AIServiceManager } = await import('./api/ai-service-manager');
    
    const apiKeyStore = useApiKeyStore.getState();
    
    // Gemini APIキー使用状況を詳細ログ出力（従来API）
    const geminiApiKey = apiKeyStore.getApiKey('geminiApiKey');
    const preferredMealProvider = apiKeyStore.getPreferredProvider('mealGeneration');
    console.log('🔍 [従来API] Gemini使用状況確認:', {
      hasGeminiKey: !!geminiApiKey,
      geminiKeyLength: geminiApiKey?.length || 0,
      geminiKeyPreview: geminiApiKey ? `${geminiApiKey.substring(0, 12)}...` : 'なし',
      preferredMealProvider: preferredMealProvider || 'auto',
      isGeminiPreferred: preferredMealProvider === 'geminiApiKey',
      requestIngredients: request.ingredients,
      timestamp: new Date().toISOString()
    });
    
    const aiService = new AIServiceManager(apiKeyStore);

    const aiRequest = {
      ingredients: request.ingredients,
      servings: request.servings,
      cookingTime: request.cookingTime,
      mealType: request.mealType,
      dietaryRestrictions: request.dietaryRestrictions,
      preferences: request.preferences,
      difficulty: request.difficulty,
      cuisine: request.cuisine,
    };

    // 優先プロバイダーがある場合は使用
    const preferredProviderKey = preferredMealProvider || undefined;
    console.log('🎯 APIリクエスト実行:', { 
      preferredProviderKey, 
      willUsePreferred: !!preferredProviderKey 
    });
    
    console.log('🚀 [従来API] AI献立生成リクエスト送信中...', aiRequest);
    const result = await aiService.generateMeals(aiRequest, preferredProviderKey);
    
    console.log('📊 [従来API] AI献立生成結果:', {
      success: result.success,
      provider: result.provider,
      error: result.error,
      hasMeals: !!result.meals,
      mealsCount: result.meals?.length || 0,
      mealsPreview: result.meals?.slice(0, 2).map(meal => ({ name: meal.name, ingredients: meal.ingredients?.slice(0, 3) })) || [],
      rawResponseLength: result.rawResponse?.length || 0
    });

    if (result.success && result.meals) {
      console.log('✅ [従来API] AI献立生成成功！AIプロバイダーからのデータを返します');
      return {
        success: true,
        meals: result.meals,
        source: 'ai-provider',
        provider: result.provider,
        rawResponse: result.rawResponse,
      };
    } else {
      console.warn('⚠️ [従来API] AI献立生成失敗、モックデータにフォールバック:', {
        success: result.success,
        error: result.error,
        provider: result.provider
      });
      // フォールバックでモックデータを生成
      const mockMeals = generateMockMeals(request);
      return {
        success: true,
        meals: mockMeals.meals,
        source: 'mock-data',
        error: result.error,
      };
    }
  } catch (error) {
    console.error('献立生成エラー:', error);
    const mockMeals = generateMockMeals(request);
    return {
      success: true,
      meals: mockMeals.meals,
      source: 'mock-data',
      error: error instanceof Error ? error.message : '予期しないエラー',
    };
  }
}

/**
 * モック献立データを生成（旧API互換性のため）
 */
function generateMockMeals(request: LegacyMealGenerationRequest): {
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
 * 状態チェック関数（旧API互換性のため）
 */
export async function checkMealGenerationStatus(): Promise<{
  groqApiAvailable: boolean;
  apiKeyConfigured: boolean;
  status: 'ready' | 'api-only' | 'mock-only';
  message: string;
}> {
  try {
    const status = await checkAIProviderStatus();
    
    if (status.available && status.providers.mealGeneration > 0) {
      return {
        groqApiAvailable: true,
        apiKeyConfigured: true,
        status: 'ready',
        message: `AIプロバイダーが利用可能です。${status.providers.mealGeneration}個のプロバイダーで高品質な献立生成ができます。`,
      };
    }

    return {
      groqApiAvailable: false,
      apiKeyConfigured: false,
      status: 'mock-only',
      message: 'APIキーが未設定です。モックデータで献立生成を行います。',
    };
  } catch (error) {
    return {
      groqApiAvailable: false,
      apiKeyConfigured: false,
      status: 'mock-only',
      message: 'APIプロバイダーの確認中にエラーが発生しました。',
    };
  }
}
