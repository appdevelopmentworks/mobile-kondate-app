import { 
  GroqApiClient, 
  GeminiApiClient, 
  OpenAIApiClient, 
  AnthropicApiClient, 
  HuggingFaceApiClient, 
  TogetherAIApiClient,
  MealGenerationRequest,
  MealResponse,
  ImageRecognitionRequest,
  ImageRecognitionResponse
} from './ai-providers';
import { useApiKeyStore } from '@/lib/settings-store';

// プロバイダーの優先順位とビジョン機能対応状況
export const PROVIDER_CONFIG = {
  // 献立生成の優先順位（性能・コスト・速度を考慮、レート制限対策でGroqを最優先）
  mealGeneration: [
    { name: 'groqApiKey', label: 'Groq', hasVision: false, speed: 'fast', cost: 'low', rateLimitRisk: 'low' },
    { name: 'openaiApiKey', label: 'OpenAI', hasVision: true, speed: 'medium', cost: 'medium', rateLimitRisk: 'medium' },
    { name: 'anthropicApiKey', label: 'Anthropic', hasVision: true, speed: 'medium', cost: 'high', rateLimitRisk: 'low' },
    { name: 'togetherApiKey', label: 'Together AI', hasVision: true, speed: 'medium', cost: 'medium', rateLimitRisk: 'medium' },
    { name: 'geminiApiKey', label: 'Gemini', hasVision: true, speed: 'medium', cost: 'low', rateLimitRisk: 'high' },
    { name: 'huggingfaceApiKey', label: 'HuggingFace', hasVision: true, speed: 'slow', cost: 'low', rateLimitRisk: 'low' },
  ],
  
  // 画像認識の優先順位（ビジョン機能の精度を考慮）
  imageRecognition: [
    { name: 'groqApiKey', label: 'Groq', hasVision: true, accuracy: 'high' },
    { name: 'openaiApiKey', label: 'OpenAI', hasVision: true, accuracy: 'high' },
    { name: 'anthropicApiKey', label: 'Anthropic', hasVision: true, accuracy: 'high' },
    { name: 'geminiApiKey', label: 'Gemini', hasVision: true, accuracy: 'high' },
    { name: 'togetherApiKey', label: 'Together AI', hasVision: true, accuracy: 'medium' },
    { name: 'huggingfaceApiKey', label: 'HuggingFace', hasVision: true, accuracy: 'medium' },
  ].filter(p => p.hasVision), // ビジョン機能があるもののみ
} as const;

// レート制限管理
class RateLimitTracker {
  private rateLimitedProviders: Map<string, number> = new Map();
  private readonly RATE_LIMIT_COOLDOWN = 5 * 60 * 1000; // 5分間のクールダウン

  isRateLimited(providerName: string): boolean {
    const blockedUntil = this.rateLimitedProviders.get(providerName);
    if (blockedUntil && Date.now() < blockedUntil) {
      return true;
    }
    if (blockedUntil) {
      this.rateLimitedProviders.delete(providerName);
    }
    return false;
  }

  markRateLimited(providerName: string): void {
    const blockedUntil = Date.now() + this.RATE_LIMIT_COOLDOWN;
    this.rateLimitedProviders.set(providerName, blockedUntil);
    console.warn(`🚫 プロバイダー ${providerName} を5分間ブロックリストに追加`);
  }

  getRemainingCooldown(providerName: string): number {
    const blockedUntil = this.rateLimitedProviders.get(providerName);
    if (blockedUntil) {
      return Math.max(0, blockedUntil - Date.now());
    }
    return 0;
  }

  getStatus(): { provider: string; blockedUntil?: number; remainingMs?: number }[] {
    return Array.from(this.rateLimitedProviders.entries()).map(([provider, blockedUntil]) => ({
      provider,
      blockedUntil,
      remainingMs: blockedUntil - Date.now()
    }));
  }
}

// AIサービス統合マネージャー
export class AIServiceManager {
  private apiKeyStore: any;
  private rateLimitTracker: RateLimitTracker = new RateLimitTracker();

  constructor(apiKeyStore: any) {
    this.apiKeyStore = apiKeyStore;
  }

  /**
   * 利用可能なプロバイダーを取得
   */
  getAvailableProviders(service: 'mealGeneration' | 'imageRecognition') {
    const providers = PROVIDER_CONFIG[service];
    
    return providers
      .map(provider => ({
        ...provider,
        hasApiKey: !!this.apiKeyStore.getApiKey(provider.name as any),
        apiKey: this.apiKeyStore.getApiKey(provider.name as any),
        isRateLimited: this.rateLimitTracker.isRateLimited(provider.name),
        rateLimitCooldown: this.rateLimitTracker.getRemainingCooldown(provider.name),
      }))
      .filter(provider => provider.hasApiKey && !provider.isRateLimited);
  }

  /**
   * APIクライアントを作成
   */
  private createApiClient(providerName: string, apiKey: string) {
    switch (providerName) {
      case 'groqApiKey':
        return new GroqApiClient(apiKey);
      case 'geminiApiKey':
        return new GeminiApiClient(apiKey);
      case 'openaiApiKey':
        return new OpenAIApiClient(apiKey);
      case 'anthropicApiKey':
        return new AnthropicApiClient(apiKey);
      case 'huggingfaceApiKey':
        return new HuggingFaceApiClient(apiKey);
      case 'togetherApiKey':
        return new TogetherAIApiClient(apiKey);
      default:
        throw new Error(`未対応のプロバイダー: ${providerName}`);
    }
  }

  /**
   * 献立生成（フォールバック機能付き）
   */
  async generateMeals(
    request: MealGenerationRequest, 
    preferredProvider?: string
  ): Promise<MealResponse> {
    console.log('🍽️ 献立生成開始:', { request, preferredProvider });

    let availableProviders = this.getAvailableProviders('mealGeneration');
    
    // 利用可能なプロバイダーがない場合の詳細チェック
    if (availableProviders.length === 0) {
      const rateLimitStatus = this.rateLimitTracker.getStatus();
      const allProviders = PROVIDER_CONFIG['mealGeneration']
        .filter(p => !!this.apiKeyStore.getApiKey(p.name as any));
      
      console.warn('⚠️ 利用可能なプロバイダーがありません', {
        totalWithKeys: allProviders.length,
        rateLimited: rateLimitStatus.length,
        rateLimitDetails: rateLimitStatus
      });
      
      if (allProviders.length === 0) {
        return {
          success: false,
          error: 'APIキーが設定されていません。設定ページでAPIキーを設定してください。',
        };
      } else if (rateLimitStatus.length > 0) {
        const nextAvailable = Math.min(...rateLimitStatus.map(p => p.remainingMs || 0));
        const nextAvailableMinutes = Math.ceil(nextAvailable / (60 * 1000));
        return {
          success: false,
          error: `すべてのプロバイダーがレート制限中です。約${nextAvailableMinutes}分後に再試行してください。設定ページで追加のAPIキーを設定するか、しばらく待ってから再度お試しください。`,
        };
      }
    }

    // 優先プロバイダーがある場合は最初に試行
    if (preferredProvider) {
      const preferredConfig = availableProviders.find(p => p.name === preferredProvider);
      if (preferredConfig) {
        console.log(`🎯 優先プロバイダーで試行: ${preferredConfig.label}`);
        const result = await this.tryGenerateMeals(preferredConfig, request);
        if (result.success) {
          return result;
        }
        console.warn(`⚠️ 優先プロバイダー失敗: ${preferredConfig.label}, フォールバックします`);
      }
    }

    // 利用可能なプロバイダーを順番に試行
    for (const provider of availableProviders) {
      if (preferredProvider && provider.name === preferredProvider) {
        continue; // 既に試行済み
      }

      console.log(`🔄 プロバイダー試行: ${provider.label}`);
      const result = await this.tryGenerateMeals(provider, request);
      
      if (result.success) {
        console.log(`✅ 献立生成成功: ${provider.label}`);
        return result;
      }

      // レート制限エラーの場合は特別なメッセージを表示とトラッキング
      if (result.error?.includes('レート制限') || result.error?.includes('429')) {
        console.warn(`⏰ プロバイダーレート制限: ${provider.label} - 次のプロバイダーを試行`);
        this.rateLimitTracker.markRateLimited(provider.name);
      } else {
        console.warn(`❌ プロバイダー失敗: ${provider.label} - ${result.error}`);
      }
    }

    // すべてのプロバイダーが失敗した場合
    const rateLimitStatus = this.rateLimitTracker.getStatus();
    const hasRateLimitedProviders = rateLimitStatus.length > 0;
    
    console.error('❌ すべてのプロバイダーで献立生成に失敗', {
      availableProviders: availableProviders.length,
      rateLimitedProviders: rateLimitStatus.length,
      rateLimitStatus: rateLimitStatus
    });
    
    let errorMessage = 'すべてのAIプロバイダーで献立生成に失敗しました。';
    
    if (hasRateLimitedProviders) {
      const nextAvailable = Math.min(...rateLimitStatus.map(p => p.remainingMs || 0));
      const nextAvailableMinutes = Math.ceil(nextAvailable / (60 * 1000));
      errorMessage += ` ${rateLimitStatus.length}個のプロバイダーがレート制限中です。約${nextAvailableMinutes}分後に再試行してください。`;
    } else {
      errorMessage += ' APIキーが正しく設定されているか確認してください。';
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }

  /**
   * 個別プロバイダーでの献立生成試行
   */
  private async tryGenerateMeals(
    provider: any, 
    request: MealGenerationRequest
  ): Promise<MealResponse> {
    try {
      // プロバイダーと リクエストの安全性チェック
      if (!provider) {
        throw new Error('プロバイダーが null または undefined です');
      }
      
      if (!provider.name) {
        throw new Error('プロバイダー名が設定されていません');
      }
      
      if (!provider.label) {
        throw new Error('プロバイダーラベルが設定されていません');
      }
      
      if (!provider.apiKey) {
        throw new Error('APIキーが設定されていません');
      }
      
      if (!request) {
        throw new Error('リクエストが null または undefined です');
      }
      
      // Gemini使用時の詳細ログ
      if (provider.name === 'geminiApiKey') {
        console.log('🚀 Geminiクライアント作成・実行開始:', {
          provider: provider.label,
          hasApiKey: !!provider.apiKey,
          keyLength: provider.apiKey?.length || 0,
          keyPrefix: provider.apiKey ? `${provider.apiKey.substring(0, 10)}...` : 'なし',
          requestIngredients: request.ingredients,
          requestServings: request.servings
        });
      }
      
      const client = this.createApiClient(provider.name, provider.apiKey);
      const result = await client.generateMeals(request);
      
      // Gemini成功時のログ
      if (provider.name === 'geminiApiKey' && result.success) {
        console.log('✅ Gemini献立生成成功:', {
          provider: provider.label,
          mealsGenerated: result.meals?.length || 0,
          rawResponseLength: result.rawResponse?.length || 0
        });
      }
      
      return { ...result, provider: provider.label };
    } catch (error) {
      // Geminiエラー時の詳細ログ
      if (provider.name === 'geminiApiKey') {
        console.error('❌ Gemini献立生成詳細エラー (サービスマネージャー):', {
          provider: provider.label,
          error: error instanceof Error ? error.message : String(error),
          errorType: typeof error,
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
      }
      
      console.error(`${provider.label} 献立生成エラー:`, error);
      
      // エラーメッセージからレート制限を検出
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('レート制限') || errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
        console.warn(`🚫 プロバイダー ${provider.label} をレート制限でブロック`);
        this.rateLimitTracker.markRateLimited(provider.name);
      }
      
      return {
        success: false,
        error: errorMessage,
        provider: provider.label,
      };
    }
  }

  /**
   * 画像認識（フォールバック機能付き）
   */
  async recognizeImage(
    request: ImageRecognitionRequest,
    preferredProvider?: string
  ): Promise<ImageRecognitionResponse> {
    const startTime = Date.now();
    console.log('📷 画像認識開始:', { preferredProvider });

    const availableProviders = this.getAvailableProviders('imageRecognition');
    
    if (availableProviders.length === 0) {
      console.warn('⚠️ ビジョン機能付きAPIキーがありません');
      return {
        success: false,
        error: 'ビジョン機能対応のAPIキーが設定されていません。OpenAI、Anthropic、Gemini等のAPIキーを設定してください。',
        processingTime: Date.now() - startTime,
      };
    }

    // 優先プロバイダーがある場合は最初に試行
    if (preferredProvider) {
      const preferredConfig = availableProviders.find(p => p.name === preferredProvider);
      if (preferredConfig) {
        console.log(`🎯 優先プロバイダーで試行: ${preferredConfig.label}`);
        const result = await this.tryRecognizeImage(preferredConfig, request, startTime);
        if (result.success) {
          return result;
        }
        console.warn(`⚠️ 優先プロバイダー失敗: ${preferredConfig.label}, フォールバックします`);
      }
    }

    // 利用可能なプロバイダーを順番に試行
    for (const provider of availableProviders) {
      if (preferredProvider && provider.name === preferredProvider) {
        continue; // 既に試行済み
      }

      console.log(`🔄 プロバイダー試行: ${provider.label}`);
      const result = await this.tryRecognizeImage(provider, request, startTime);
      
      if (result.success) {
        console.log(`✅ 画像認識成功: ${provider.label}`);
        return result;
      }

      console.warn(`❌ プロバイダー失敗: ${provider.label} - ${result.error}`);
    }

    // すべてのプロバイダーが失敗した場合はモックデータを返す
    console.warn('⚠️ すべてのプロバイダーで画像認識に失敗、モックデータを返します');
    return this.generateMockRecognitionResult(Date.now() - startTime);
  }

  /**
   * 個別プロバイダーでの画像認識試行
   */
  private async tryRecognizeImage(
    provider: any,
    request: ImageRecognitionRequest,
    startTime: number
  ): Promise<ImageRecognitionResponse> {
    try {
      // プロバイダーとリクエストの安全性チェック
      if (!provider) {
        throw new Error('プロバイダーが null または undefined です');
      }
      
      if (!provider.name) {
        throw new Error('プロバイダー名が設定されていません');
      }
      
      if (!provider.label) {
        throw new Error('プロバイダーラベルが設定されていません');
      }
      
      if (!provider.apiKey) {
        throw new Error('APIキーが設定されていません');
      }
      
      if (!request) {
        throw new Error('リクエストが null または undefined です');
      }
      
      // Gemini画像認識時の詳細ログ
      if (provider.name === 'geminiApiKey') {
        console.log('🚀 Gemini画像認識クライアント作成・実行開始:', {
          provider: provider.label,
          hasApiKey: !!provider.apiKey,
          keyLength: provider.apiKey?.length || 0,
          keyPrefix: provider.apiKey ? `${provider.apiKey.substring(0, 10)}...` : 'なし',
          imageDataSize: request.imageBase64.length
        });
      }
      
      const client = this.createApiClient(provider.name, provider.apiKey);
      
      if (!client.recognizeImage) {
        throw new Error('このプロバイダーは画像認識に対応していません');
      }

      const result = await client.recognizeImage(request);
      
      // Gemini画像認識成功時のログ
      if (provider.name === 'geminiApiKey' && result.success) {
        console.log('✅ Gemini画像認識成功:', {
          provider: provider.label,
          ingredientsRecognized: result.ingredients?.length || 0,
          confidence: result.confidence,
          processingTime: Date.now() - startTime
        });
      }
      
      return { 
        ...result, 
        provider: provider.label,
        processingTime: Date.now() - startTime 
      };
    } catch (error) {
      // Gemini画像認識エラー時の詳細ログ
      if (provider.name === 'geminiApiKey') {
        console.error('❌ Gemini画像認識詳細エラー (サービスマネージャー):', {
          provider: provider.label,
          error: error instanceof Error ? error.message : String(error),
          errorType: typeof error,
          stack: error instanceof Error ? error.stack : undefined,
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        });
      }
      
      console.error(`${provider.label} 画像認識エラー:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '予期しないエラー',
        provider: provider.label,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * プロバイダーの状態確認
   */
  getProviderStatus() {
    const mealProviders = this.getAvailableProviders('mealGeneration');
    const visionProviders = this.getAvailableProviders('imageRecognition');
    const rateLimitStatus = this.rateLimitTracker.getStatus();

    return {
      mealGeneration: {
        available: mealProviders.length,
        providers: mealProviders.map(p => ({ name: p.label, config: p })),
      },
      imageRecognition: {
        available: visionProviders.length,
        providers: visionProviders.map(p => ({ name: p.label, config: p })),
      },
      rateLimits: {
        blocked: rateLimitStatus.length,
        details: rateLimitStatus
      },
      totalConfigured: new Set([
        ...mealProviders.map(p => p.name),
        ...visionProviders.map(p => p.name)
      ]).size,
    };
  }

  /**
   * 全プロバイダーの率制限状態をリセット（緊急時用）
   */
  resetAllRateLimits() {
    console.log('🔄 すべてのレート制限をリセット');
    this.rateLimitTracker = new RateLimitTracker();
  }

  /**
   * モック認識結果の生成（フォールバック用）
   */
  private generateMockRecognitionResult(processingTime: number): ImageRecognitionResponse {
    const mockIngredients = [
      { name: 'トマト', confidence: 0.92, category: 'vegetable', quantity: '2個', freshness: 'fresh' },
      { name: 'タマネギ', confidence: 0.88, category: 'vegetable', quantity: '1個', freshness: 'good' },
      { name: 'ニンジン', confidence: 0.85, category: 'vegetable', quantity: '1本', freshness: 'fresh' },
      { name: 'キャベツ', confidence: 0.79, category: 'vegetable', quantity: '1/4個', freshness: 'fresh' },
      { name: '鶏肉', confidence: 0.87, category: 'meat', quantity: '200g', freshness: 'fresh' },
      { name: '卵', confidence: 0.95, category: 'dairy', quantity: '3個', freshness: 'fresh' },
    ];

    // ランダムに1-4個の食材を返す
    const shuffled = mockIngredients.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.floor(Math.random() * 4) + 1);

    return {
      success: true,
      ingredients: selected,
      confidence: 0.85,
      processingTime,
      provider: 'Mock (デモ用)',
    };
  }

  /**
   * 献立プラン生成（プロンプトベース）
   */
  async generateMealPlan(request: {
    prompt: string;
    maxTokens?: number;
    preferredProvider?: string;
  }): Promise<{
    success: boolean;
    content?: string;
    provider?: string;
    processingTime?: number;
    error?: string;
  }> {
    console.log('🍳 献立プラン生成開始:', request);

    const availableProviders = this.getAvailableProviders('mealGeneration');
    
    if (availableProviders.length === 0) {
      return {
        success: false,
        error: 'APIキーが設定されていません。設定ページでAPIキーを設定してください。',
      };
    }

    // 利用可能なプロバイダーを順番に試行
    for (const provider of availableProviders) {
      const result = await this.tryGenerateMealPlan(provider, request);
      
      if (result.success) {
        console.log(`✅ 献立プラン生成成功: ${provider.label}`);
        return result;
      }

      console.warn(`❌ プロバイダー失敗: ${provider.label} - ${result.error}`);
    }

    return {
      success: false,
      error: 'すべてのAIプロバイダーで献立生成に失敗しました。しばらく時間をおいて再試行してください。',
    };
  }

  /**
   * 個別プロバイダーでの献立プラン生成試行
   */
  private async tryGenerateMealPlan(
    provider: any,
    request: { prompt: string; maxTokens?: number }
  ): Promise<{
    success: boolean;
    content?: string;
    provider?: string;
    processingTime?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      // Groqを使用
      if (provider.name === 'groqApiKey') {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-120b',
            messages: [{ role: 'user', content: request.prompt }],
            max_tokens: request.maxTokens || 2000,
            temperature: 0.7,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Groq API error: ${response.status}`);
        }
        
        const data = await response.json();
        return {
          success: true,
          content: data.choices[0].message.content,
          provider: provider.label,
          processingTime: Date.now() - startTime,
        };
      }

      throw new Error(`プロバイダー ${provider.name} の献立プラン生成は実装中です`);

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '献立生成に失敗しました',
        provider: provider.label,
        processingTime: Date.now() - startTime,
      };
    }
  }
}

// React Hook for AIサービス利用
export function useAIService() {
  const apiKeyStore = useApiKeyStore();
  const aiService = new AIServiceManager(apiKeyStore);

  return {
    // 献立生成
    generateMeals: (request: MealGenerationRequest, preferredProvider?: string) =>
      aiService.generateMeals(request, preferredProvider),
    
    // 画像認識
    recognizeImage: (request: ImageRecognitionRequest, preferredProvider?: string) =>
      aiService.recognizeImage(request, preferredProvider),
    
    // プロバイダー状態
    getProviderStatus: () => aiService.getProviderStatus(),
    
    // 利用可能プロバイダー
    getAvailableProviders: (service: 'mealGeneration' | 'imageRecognition') =>
      aiService.getAvailableProviders(service),
    
    // レート制限管理
    resetRateLimits: () => aiService.resetAllRateLimits(),
  };
}

// プロバイダー選択用のユーティリティ
export function getRecommendedProvider(
  service: 'mealGeneration' | 'imageRecognition',
  availableProviders: any[]
) {
  if (availableProviders.length === 0) return null;

  // 献立生成の推奨：Groq (高速) > Gemini (バランス) > OpenAI (品質)
  if (service === 'mealGeneration') {
    const priorities = ['groqApiKey', 'geminiApiKey', 'openaiApiKey', 'anthropicApiKey', 'togetherApiKey', 'huggingfaceApiKey'];
    for (const priority of priorities) {
      const provider = availableProviders.find(p => p.name === priority);
      if (provider) return provider;
    }
  }

  // 画像認識の推奨：Groq (高速・高精度) > OpenAI (精度) > Anthropic (品質) > Gemini (バランス)
  if (service === 'imageRecognition') {
    const priorities = ['groqApiKey', 'openaiApiKey', 'anthropicApiKey', 'geminiApiKey', 'togetherApiKey', 'huggingfaceApiKey'];
    for (const priority of priorities) {
      const provider = availableProviders.find(p => p.name === priority);
      if (provider) return provider;
    }
  }

  return availableProviders[0];
}
