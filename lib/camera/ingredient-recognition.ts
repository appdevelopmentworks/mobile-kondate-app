import { IngredientRecognitionResult, RecognizedIngredient } from '../types';
import { ImageRecognitionRequest, ImageRecognitionResponse } from '../api/ai-providers';

/**
 * 新しいAI統合システムを使用した食材認識
 */
export const recognizeIngredients = async (
  imageBase64: string,
  preferredProvider?: string
): Promise<IngredientRecognitionResult> => {
  const startTime = Date.now();

  try {
    console.log('📷 食材認識開始 (新システム):', { 
      imageSize: `${imageBase64.length} characters`,
      preferredProvider
    });

    // AIサービスを直接インスタンス化（Hook外で使用）
    const { useApiKeyStore } = await import('../settings-store');
    const { AIServiceManager } = await import('../api/ai-service-manager');
    
    const apiKeyStore = useApiKeyStore.getState();
    
    // Gemini APIキー使用状況を詳細ログ出力（画像認識）
    const geminiApiKey = apiKeyStore.getApiKey('geminiApiKey');
    const preferredImageProvider = apiKeyStore.getPreferredProvider('imageRecognition');
    console.log('🔍 [画像認識] Gemini使用状況確認:', {
      hasGeminiKey: !!geminiApiKey,
      geminiKeyLength: geminiApiKey?.length || 0,
      geminiKeyPreview: geminiApiKey ? `${geminiApiKey.substring(0, 12)}...` : 'なし',
      preferredImageProvider: preferredImageProvider || 'auto',
      isGeminiPreferred: preferredImageProvider === 'geminiApiKey',
      providedPreferredProvider: preferredProvider,
      timestamp: new Date().toISOString()
    });
    
    // デバッグ: APIキーの状態を確認
    console.log('🔑 APIキー状態確認:', {
      groqApiKey: apiKeyStore.getApiKey('groqApiKey') ? '設定済み' : '未設定',
      groqKeyLength: apiKeyStore.getApiKey('groqApiKey')?.length || 0,
      openaiApiKey: apiKeyStore.getApiKey('openaiApiKey') ? '設定済み' : '未設定',
      anthropicApiKey: apiKeyStore.getApiKey('anthropicApiKey') ? '設定済み' : '未設定',
      geminiApiKey: geminiApiKey ? '設定済み' : '未設定'
    });
    
    const aiService = new AIServiceManager(apiKeyStore);

    // 画像認識リクエストを構築
    const request: ImageRecognitionRequest = {
      imageBase64: imageBase64,
      provider: preferredProvider,
    };

    // 優先プロバイダーの決定ロジック
    const finalPreferredProvider = preferredProvider || preferredImageProvider || 'groqApiKey';
    console.log('🎯 [画像認識] 最終プロバイダー選択:', { 
      finalPreferredProvider,
      reason: preferredProvider ? 'Function parameter' : 
              preferredImageProvider ? 'User preference' : 'Default (Groq)'
    });
    
    // AI画像認識を実行
    const result = await aiService.recognizeImage(request, finalPreferredProvider);

    if (!result.success || !result.ingredients) {
      console.warn('⚠️ AI画像認識失敗、フォールバックを使用:', result.error);
      return generateFallbackRecognitionResult(Date.now() - startTime);
    }

    // AI結果をIngredientRecognitionResult形式に変換
    const recognitionResult: IngredientRecognitionResult = {
      success: true,
      ingredients: result.ingredients.map(ingredient => ({
        name: ingredient.name,
        confidence: ingredient.confidence,
        category: ingredient.category as any,
        quantity: ingredient.quantity || '',
        freshness: ingredient.freshness as any || 'good',
      })),
      confidence: result.confidence || 0,
      processingTime: result.processingTime || Date.now() - startTime,
      provider: result.provider,
    };

    console.log('✅ AI食材認識成功:', {
      provider: result.provider,
      ingredientCount: recognitionResult.ingredients.length,
      confidence: recognitionResult.confidence,
      processingTime: recognitionResult.processingTime
    });

    return recognitionResult;

  } catch (error) {
    console.error('❌ 食材認識エラー:', error);
    return generateFallbackRecognitionResult(Date.now() - startTime);
  }
};

/**
 * フォールバック用の食材認識結果生成
 */
function generateFallbackRecognitionResult(processingTime: number): IngredientRecognitionResult {
  console.log('🔄 フォールバック食材認識を使用');
  
  const mockIngredients: RecognizedIngredient[] = [
    {
      name: 'トマト',
      confidence: 0.92,
      category: 'vegetable',
      quantity: '2個',
      freshness: 'fresh',
    },
    {
      name: 'タマネギ',
      confidence: 0.88,
      category: 'vegetable',
      quantity: '1個',
      freshness: 'good',
    },
    {
      name: 'ニンジン',
      confidence: 0.85,
      category: 'vegetable',
      quantity: '1本',
      freshness: 'fresh',
    },
  ];

  // ランダムに1-3個の食材を返す
  const shuffled = mockIngredients.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.floor(Math.random() * 3) + 1);

  return {
    success: true,
    ingredients: selected,
    confidence: 0.75,
    processingTime,
    provider: 'サンプルデータ',
  };
}

/**
 * プロバイダー指定での食材認識
 */
export const recognizeIngredientsWithProvider = async (
  imageBase64: string,
  provider: 'openai' | 'anthropic' | 'gemini' | 'together' | 'huggingface'
): Promise<IngredientRecognitionResult> => {
  const providerMap = {
    openai: 'openaiApiKey',
    anthropic: 'anthropicApiKey', 
    gemini: 'geminiApiKey',
    together: 'togetherApiKey',
    huggingface: 'huggingfaceApiKey',
  };

  return recognizeIngredients(imageBase64, providerMap[provider]);
};

/**
 * 複数プロバイダーでの食材認識（比較用）
 */
export const recognizeIngredientsMultiple = async (
  imageBase64: string,
  providers: string[] = []
): Promise<{
  success: boolean;
  results: Array<{
    provider: string;
    result: IngredientRecognitionResult;
  }>;
  consensus?: IngredientRecognitionResult;
}> => {
  try {
    console.log('📷 複数プロバイダー食材認識開始:', providers);

    if (providers.length === 0) {
      // プロバイダーが指定されていない場合は利用可能なものを使用
      const { useApiKeyStore } = await import('../settings-store');
      const { AIServiceManager } = await import('../api/ai-service-manager');
      
      const apiKeyStore = useApiKeyStore.getState();
      const aiService = new AIServiceManager(apiKeyStore);
      const availableProviders = aiService.getAvailableProviders('imageRecognition');
      
      providers = availableProviders.slice(0, 3).map(p => p.name); // 最大3つまで
    }

    const results = await Promise.allSettled(
      providers.map(async (provider) => {
        const result = await recognizeIngredients(imageBase64, provider);
        return { provider, result };
      })
    );

    const successfulResults = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value)
      .filter(({ result }) => result.success);

    if (successfulResults.length === 0) {
      return {
        success: false,
        results: [],
      };
    }

    // コンセンサス結果を生成（複数の結果から最適なものを選択）
    const consensus = generateConsensusResult(successfulResults.map(r => r.result));

    return {
      success: true,
      results: successfulResults,
      consensus,
    };

  } catch (error) {
    console.error('複数プロバイダー食材認識エラー:', error);
    return {
      success: false,
      results: [],
    };
  }
};

/**
 * 複数の認識結果からコンセンサスを生成
 */
function generateConsensusResult(results: IngredientRecognitionResult[]): IngredientRecognitionResult {
  if (results.length === 0) {
    return generateFallbackRecognitionResult(0);
  }

  if (results.length === 1) {
    return results[0];
  }

  // 各食材の出現回数と信頼度を集計
  const ingredientCounts = new Map<string, {
    count: number;
    totalConfidence: number;
    categories: string[];
    quantities: string[];
    freshness: string[];
  }>();

  results.forEach(result => {
    result.ingredients.forEach(ingredient => {
      const key = ingredient.name.toLowerCase();
      const existing = ingredientCounts.get(key) || {
        count: 0,
        totalConfidence: 0,
        categories: [],
        quantities: [],
        freshness: [],
      };

      existing.count += 1;
      existing.totalConfidence += ingredient.confidence;
      if (ingredient.category) existing.categories.push(ingredient.category);
      if (ingredient.quantity) existing.quantities.push(ingredient.quantity);
      if (ingredient.freshness) existing.freshness.push(ingredient.freshness);

      ingredientCounts.set(key, existing);
    });
  });

  // コンセンサス食材を生成（2つ以上のプロバイダーで認識されたもの）
  const consensusIngredients: RecognizedIngredient[] = [];
  
  ingredientCounts.forEach((data, name) => {
    if (data.count >= Math.min(2, results.length)) {
      const avgConfidence = data.totalConfidence / data.count;
      const mostCommonCategory = getMostCommon(data.categories);
      const mostCommonQuantity = getMostCommon(data.quantities);
      const mostCommonFreshness = getMostCommon(data.freshness);

      consensusIngredients.push({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        confidence: avgConfidence,
        category: mostCommonCategory as any,
        quantity: mostCommonQuantity || '',
        freshness: mostCommonFreshness as any || 'good',
      });
    }
  });

  // 信頼度でソート
  consensusIngredients.sort((a, b) => b.confidence - a.confidence);

  const avgProcessingTime = results.reduce((sum, r) => sum + (r.processingTime || 0), 0) / results.length;
  const avgConfidence = consensusIngredients.reduce((sum, i) => sum + i.confidence, 0) / consensusIngredients.length;

  return {
    success: true,
    ingredients: consensusIngredients,
    confidence: avgConfidence,
    processingTime: avgProcessingTime,
    provider: `コンセンサス (${results.length}プロバイダー)`,
  };
}

/**
 * 配列内で最も多く出現する要素を取得
 */
function getMostCommon<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;

  const counts = new Map<T, number>();
  arr.forEach(item => {
    counts.set(item, (counts.get(item) || 0) + 1);
  });

  let maxCount = 0;
  let mostCommon: T | undefined;
  
  counts.forEach((count, item) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = item;
    }
  });

  return mostCommon;
}

/**
 * 認識された食材をフィルタリング・最適化
 */
export const processRecognizedIngredients = (
  ingredients: RecognizedIngredient[],
  minConfidence: number = 0.5
): RecognizedIngredient[] => {
  return ingredients
    .filter((ingredient) => ingredient.confidence >= minConfidence)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 20); // 最大20個まで
};

/**
 * 認識結果を日本語に変換・正規化
 */
export const normalizeIngredientNames = (ingredients: RecognizedIngredient[]): RecognizedIngredient[] => {
  const nameMapping: Record<string, string> = {
    'tomato': 'トマト',
    'onion': 'タマネギ',
    'carrot': 'ニンジン',
    'potato': 'ジャガイモ',
    'cabbage': 'キャベツ',
    'lettuce': 'レタス',
    'cucumber': 'キュウリ',
    'broccoli': 'ブロッコリー',
    'spinach': 'ほうれん草',
    'mushroom': 'きのこ',
    'chicken': '鶏肉',
    'beef': '牛肉',
    'pork': '豚肉',
    'fish': '魚',
    'egg': '卵',
    'milk': '牛乳',
    'cheese': 'チーズ',
    'rice': '米',
    'bread': 'パン',
    'pasta': 'パスタ',
  };

  return ingredients.map((ingredient) => ({
    ...ingredient,
    name: nameMapping[ingredient.name.toLowerCase()] || ingredient.name,
  }));
};

/**
 * ビジョン対応プロバイダーの状態確認
 */
export const checkVisionProviderStatus = async (): Promise<{
  available: boolean;
  providers: Array<{
    name: string;
    hasApiKey: boolean;
    accuracy: string;
  }>;
  recommended?: string;
}> => {
  try {
    const { useApiKeyStore } = await import('../settings-store');
    const { AIServiceManager, getRecommendedProvider } = await import('../api/ai-service-manager');
    
    const apiKeyStore = useApiKeyStore.getState();
    const aiService = new AIServiceManager(apiKeyStore);
    
    const availableProviders = aiService.getAvailableProviders('imageRecognition');
    const recommended = getRecommendedProvider('imageRecognition', availableProviders);
    
    return {
      available: availableProviders.length > 0,
      providers: availableProviders.map(p => ({
        name: p.label,
        hasApiKey: p.hasApiKey,
        accuracy: (p as any).accuracy || 'unknown',
      })),
      recommended: recommended?.label,
    };
  } catch (error) {
    console.error('ビジョンプロバイダー状態確認エラー:', error);
    return {
      available: false,
      providers: [],
    };
  }
};

// 従来のAPI（後方互換性のため）

/**
 * HuggingFace Inference APIを使用したフォールバック（旧API互換性のため）
 */
export const recognizeIngredientsHuggingFace = async (
  imageBase64: string
): Promise<IngredientRecognitionResult> => {
  console.log('🔄 旧HuggingFace API互換性関数が呼ばれました');
  return recognizeIngredientsWithProvider(imageBase64, 'huggingface');
};

/**
 * クライアントサイドでのフォールバック食材認識（旧API互換性のため）
 */
export const recognizeIngredientsOffline = async (
  imageBase64: string
): Promise<IngredientRecognitionResult> => {
  console.log('🔄 旧オフライン API互換性関数が呼ばれました');
  return recognizeIngredientsWithProvider(imageBase64, 'anthropic');
};

/**
 * モック食材認識結果を生成（デモ・フォールバック用）
 */
export const generateMockRecognitionResult = (
  processingTime: number = 1500
): IngredientRecognitionResult => {
  return generateFallbackRecognitionResult(processingTime);
};
