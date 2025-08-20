import { useApiKeyStore } from '@/lib/settings-store';
import { AIServiceManager } from './ai-service-manager';
import { GeminiApiClient } from './ai-providers';

// APIテスト結果の型定義
export interface APITestResult {
  success: boolean;
  provider: string;
  responseTime?: number;
  error?: string;
  details?: any;
}

/**
 * 単一プロバイダーの接続テスト
 */
export async function testProviderConnection(
  providerName: string,
  apiKey: string
): Promise<APITestResult> {
  const startTime = Date.now();
  
  try {
    console.log(`🧪 ${providerName} API接続テスト開始`);
    
    switch (providerName) {
      case 'geminiApiKey':
        return await testGeminiConnection(apiKey);
      case 'openaiApiKey':
        return await testOpenAIConnection(apiKey);
      case 'anthropicApiKey':
        return await testAnthropicConnection(apiKey);
      case 'groqApiKey':
        return await testGroqConnection(apiKey);
      case 'huggingfaceApiKey':
        return await testHuggingFaceConnection(apiKey);
      case 'togetherApiKey':
        return await testTogetherAIConnection(apiKey);
      default:
        throw new Error(`未対応のプロバイダー: ${providerName}`);
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ ${providerName} API接続テスト失敗:`, error);
    
    return {
      success: false,
      provider: providerName,
      responseTime,
      error: error instanceof Error ? error.message : 'テスト失敗',
    };
  }
}

/**
 * Gemini API接続テスト
 */
async function testGeminiConnection(apiKey: string): Promise<APITestResult> {
  const startTime = Date.now();
  
  try {
    const client = new GeminiApiClient(apiKey);
    
    // シンプルなテストリクエスト
    const testRequest = {
      ingredients: ['テスト'],
      servings: 1,
      cookingTime: 15,
      mealType: 'dinner' as const,
      dietaryRestrictions: [],
      preferences: ['簡単な料理'],
      difficulty: 'easy' as const,
      cuisine: 'テスト'
    };
    
    console.log('🔍 Gemini APIテストリクエスト送信中...');
    const result = await client.generateMeals(testRequest);
    
    const responseTime = Date.now() - startTime;
    
    if (result.success) {
      console.log('✅ Gemini API接続テスト成功!', { responseTime });
      return {
        success: true,
        provider: 'Gemini',
        responseTime,
        details: {
          mealCount: result.meals?.length || 0,
          rawResponseLength: result.rawResponse?.length || 0
        }
      };
    } else {
      console.warn('⚠️ Gemini APIテストレスポンス異常:', result.error);
      return {
        success: false,
        provider: 'Gemini',
        responseTime,
        error: result.error || 'APIレスポンス異常'
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('❌ Gemini API接続テストエラー:', error);
    
    return {
      success: false,
      provider: 'Gemini',
      responseTime,
      error: error instanceof Error ? error.message : 'テストエラー'
    };
  }
}

/**
 * OpenAI API接続テスト (簡易版)
 */
async function testOpenAIConnection(apiKey: string): Promise<APITestResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
      }),
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      console.log('✅ OpenAI API接続テスト成功!');
      return {
        success: true,
        provider: 'OpenAI',
        responseTime,
      };
    } else {
      const errorText = await response.text();
      console.warn('⚠️ OpenAI APIテスト失敗:', response.status, errorText);
      return {
        success: false,
        provider: 'OpenAI',
        responseTime,
        error: `API Error ${response.status}: ${errorText}`,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      provider: 'OpenAI',
      responseTime,
      error: error instanceof Error ? error.message : 'テストエラー',
    };
  }
}

/**
 * Anthropic API接続テスト (簡易版)
 */
async function testAnthropicConnection(apiKey: string): Promise<APITestResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        success: true,
        provider: 'Anthropic',
        responseTime,
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        provider: 'Anthropic',
        responseTime,
        error: `API Error ${response.status}: ${errorText}`,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      provider: 'Anthropic',
      responseTime,
      error: error instanceof Error ? error.message : 'テストエラー',
    };
  }
}

/**
 * Groq API接続テスト (簡易版)
 */
async function testGroqConnection(apiKey: string): Promise<APITestResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
      }),
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        success: true,
        provider: 'Groq',
        responseTime,
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        provider: 'Groq',
        responseTime,
        error: `API Error ${response.status}: ${errorText}`,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      provider: 'Groq',
      responseTime,
      error: error instanceof Error ? error.message : 'テストエラー',
    };
  }
}

/**
 * HuggingFace API接続テスト (簡易版)
 */
async function testHuggingFaceConnection(apiKey: string): Promise<APITestResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-8B-Instruct', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: 'Hello',
        parameters: {
          max_new_tokens: 10,
        },
      }),
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        success: true,
        provider: 'HuggingFace',
        responseTime,
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        provider: 'HuggingFace',
        responseTime,
        error: `API Error ${response.status}: ${errorText}`,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      provider: 'HuggingFace',
      responseTime,
      error: error instanceof Error ? error.message : 'テストエラー',
    };
  }
}

/**
 * Together AI API接続テスト (簡易版)
 */
async function testTogetherAIConnection(apiKey: string): Promise<APITestResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
      }),
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        success: true,
        provider: 'Together AI',
        responseTime,
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        provider: 'Together AI',
        responseTime,
        error: `API Error ${response.status}: ${errorText}`,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      provider: 'Together AI',
      responseTime,
      error: error instanceof Error ? error.message : 'テストエラー',
    };
  }
}

/**
 * 全てのAPIキーをテスト
 */
export async function testAllProviders(): Promise<APITestResult[]> {
  console.log('🧪 全プロバイダーAPIテスト開始');
  
  const apiKeyStore = useApiKeyStore.getState();
  const results: APITestResult[] = [];
  
  const providers = [
    'geminiApiKey',
    'openaiApiKey', 
    'anthropicApiKey',
    'groqApiKey',
    'huggingfaceApiKey',
    'togetherApiKey'
  ];
  
  for (const provider of providers) {
    const apiKey = apiKeyStore.getApiKey(provider as any);
    
    if (apiKey) {
      console.log(`🔍 ${provider} テスト実行中...`);
      const result = await testProviderConnection(provider, apiKey);
      results.push(result);
    } else {
      console.log(`⚠️ ${provider} APIキーが未設定`);
      results.push({
        success: false,
        provider: provider.replace('ApiKey', ''),
        error: 'APIキーが未設定',
      });
    }
  }
  
  console.log('🏁 全プロバイダーAPIテスト完了:', results);
  return results;
}

/**
 * 献立生成のテスト
 */
export async function testMealGeneration(provider?: string): Promise<{
  success: boolean;
  suggestion?: any;
  error?: string;
  provider?: string;
}> {
  try {
    console.log('🍽️ 献立生成テスト開始:', { provider });
    
    const apiKeyStore = useApiKeyStore.getState();
    const aiService = new AIServiceManager(apiKeyStore);
    
    const testRequest = {
      ingredients: ['卵', '玉ねぎ', '人参'],
      servings: 2,
      cookingTime: 30,
      mealType: 'dinner' as const,
      dietaryRestrictions: [],
      preferences: ['簡単', '美味しい'],
      difficulty: 'easy' as const,
      cuisine: '和食'
    };
    
    const result = await aiService.generateMeals(testRequest, provider);
    
    if (result.success) {
      console.log('✅ 献立生成テスト成功!', result);
      return {
        success: true,
        suggestion: result.meals,
        provider: result.provider,
      };
    } else {
      console.warn('⚠️ 献立生成テスト失敗:', result.error);
      return {
        success: false,
        error: result.error,
        provider: result.provider,
      };
    }
  } catch (error) {
    console.error('❌ 献立生成テストエラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'テストエラー',
    };
  }
}

/**
 * 画像認識のテスト（サンプル画像使用）
 */
export async function testImageRecognition(provider?: string): Promise<{
  success: boolean;
  ingredients?: any[];
  error?: string;
  provider?: string;
}> {
  try {
    console.log('🖼️ 画像認識テスト開始:', { provider });
    
    const apiKeyStore = useApiKeyStore.getState();
    const aiService = new AIServiceManager(apiKeyStore);
    
    // テスト用のサンプル画像（小さなBase64画像）
    const sampleImageBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAACAAIDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/iK';
    
    const result = await aiService.recognizeImage(
      { imageBase64: sampleImageBase64 },
      provider
    );
    
    if (result.success) {
      console.log('✅ 画像認識テスト成功!', result);
      return {
        success: true,
        ingredients: result.ingredients,
        provider: result.provider,
      };
    } else {
      console.warn('⚠️ 画像認識テスト失敗:', result.error);
      return {
        success: false,
        error: result.error,
        provider: result.provider,
      };
    }
  } catch (error) {
    console.error('❌ 画像認識テストエラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'テストエラー',
    };
  }
}
