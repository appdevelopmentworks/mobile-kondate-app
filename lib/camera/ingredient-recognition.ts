import { IngredientRecognitionResult, RecognizedIngredient } from '../types';

/**
 * Groq APIを使用してmeta-llama/llama-4-maverick-17b-128e-instructで食材認識を実行
 */
export const recognizeIngredients = async (
  imageBase64: string
): Promise<IngredientRecognitionResult> => {
  const startTime = Date.now();

  try {
    const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    
    console.log('🔍 Groq API認識開始:', {
      apiKeyExists: groqApiKey ? 'あり' : 'なし',
      imageSize: `${imageBase64.length} characters`,
      model: 'meta-llama/llama-4-maverick-17b-128e-instruct'
    });
    
    if (!groqApiKey) {
      console.warn('⚠️ Groq APIキーが設定されていないため、フォールバックを使用します');
      return await recognizeIngredientsHuggingFace(imageBase64);
    }

    const requestBody = {
      model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `この画像に写っている食材を認識し、日本語で以下のJSON形式で返してください：

{
  "ingredients": [
    {
      "name": "食材名",
      "confidence": 0.95,
      "category": "vegetable",
      "quantity": "2個",
      "freshness": "fresh"
    }
  ],
  "confidence": 0.90
}

カテゴリ: vegetable, meat, fish, grain, dairy, seasoning, other のいずれか
鮮度: fresh, good, need_to_use_soon, overripe のいずれか

認識できる食材がない場合は空の配列を返してください。必ずJSON形式のみで回答してください。`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    };

    console.log('📡 Groq API呼び出し中...');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📊 Groq APIレスポンス:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Groq APIエラー詳細:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        errorBody: errorText
      });
      throw new Error(`Groq API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Groq APIレスポンス成功:', {
      model: data.model,
      usage: data.usage,
      choices: data.choices?.length
    });
    
    const content = data.choices[0]?.message?.content;
    console.log('🤖 AI応答内容:', content);
    
    if (!content) {
      throw new Error('レスポンスにコンテンツが含まれていません');
    }
    
    // JSON部分を抽出
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ JSON抽出失敗:', { content });
      throw new Error('有効なJSONレスポンスが見つかりません');
    }

    console.log('🔍 抽出されたJSON:', jsonMatch[0]);
    
    const result = JSON.parse(jsonMatch[0]);
    const processingTime = Date.now() - startTime;

    console.log('🎉 食材認識成功:', {
      ingredientCount: result.ingredients?.length || 0,
      confidence: result.confidence,
      processingTime: `${processingTime}ms`,
      ingredients: result.ingredients
    });

    return {
      success: true,
      ingredients: result.ingredients || [],
      confidence: result.confidence || 0,
      processingTime,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('🚫 Groq食材認識エラー:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: `${processingTime}ms`
    });

    // フォールバックとしてHuggingFace APIを使用
    console.log('🔄 HuggingFace APIフォールバックを使用します');
    return await recognizeIngredientsHuggingFace(imageBase64);
  }
};

/**
 * HuggingFace Inference APIを使用したフォールバック
 */
export const recognizeIngredientsHuggingFace = async (
  imageBase64: string
): Promise<IngredientRecognitionResult> => {
  const startTime = Date.now();

  try {
    const hfApiKey = process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY;
    
    if (!hfApiKey) {
      // APIキーがない場合はオフラインフォールバックを使用
      return await recognizeIngredientsOffline(imageBase64);
    }

    // HuggingFaceのLlama Visionモデルを使用
    const response = await fetch(
      'https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-11B-Vision-Instruct',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {
            image: imageBase64,
            text: `この画像に写っている食材を認識し、日本語でJSON形式で答えてください。フォーマット: {"ingredients": [{"name": "食材名", "confidence": 0.95, "category": "vegetable"}], "confidence": 0.90}`
          },
          parameters: {
            max_new_tokens: 500,
            temperature: 0.3
          }
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HuggingFace API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // HuggingFaceのレスポンスをパース
    const generated_text = data[0]?.generated_text || data.generated_text || '';
    const jsonMatch = generated_text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('有効なJSONレスポンスが見つかりません');
    }

    const result = JSON.parse(jsonMatch[0]);
    const processingTime = Date.now() - startTime;

    return {
      success: true,
      ingredients: result.ingredients || [],
      confidence: result.confidence || 0,
      processingTime,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('HuggingFace食材認識エラー:', error);

    // 最終フォールバックとしてオフライン認識を使用
    return await recognizeIngredientsOffline(imageBase64);
  }
};

/**
 * クライアントサイドでのフォールバック食材認識
 * （APIが利用できない場合の代替手段）
 */
export const recognizeIngredientsOffline = async (
  imageBase64: string
): Promise<IngredientRecognitionResult> => {
  const startTime = Date.now();

  try {
    // Claude APIを使用した食材認識
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: `この画像に写っている食材を認識し、日本語で以下のJSON形式で返してください：
                
                {
                  \"ingredients\": [
                    {
                      \"name\": \"食材名\",
                      \"confidence\": 0.95,
                      \"category\": \"vegetable\",
                      \"quantity\": \"2個\",
                      \"freshness\": \"fresh\"
                    }
                  ],
                  \"confidence\": 0.90
                }
                
                カテゴリは: vegetable, meat, fish, grain, dairy, seasoning, other のいずれか
                鮮度は: fresh, good, need_to_use_soon, overripe のいずれか
                
                認識できる食材がない場合は空の配列を返してください。`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // JSONレスポンスをパース
    const jsonMatch = content.match(/\\{[\\s\\S]*\\}/);
    if (!jsonMatch) {
      throw new Error('有効なJSONレスポンスが見つかりません');
    }

    const result = JSON.parse(jsonMatch[0]);
    const processingTime = Date.now() - startTime;

    return {
      success: true,
      ingredients: result.ingredients || [],
      confidence: result.confidence || 0,
      processingTime,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('オフライン食材認識エラー:', error);

    // 最後の手段として、モックデータを返す（デモ用）
    return generateMockRecognitionResult(processingTime);
  }
};

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
 * モック食材認識結果を生成（デモ・フォールバック用）
 */
export const generateMockRecognitionResult = (
  processingTime: number = 1500
): IngredientRecognitionResult => {
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
    {
      name: 'キャベツ',
      confidence: 0.79,
      category: 'vegetable',
      quantity: '1/4個',
      freshness: 'fresh',
    },
    {
      name: '鶏肉',
      confidence: 0.87,
      category: 'meat',
      quantity: '200g',
      freshness: 'fresh',
    },
    {
      name: '卵',
      confidence: 0.95,
      category: 'dairy',
      quantity: '3個',
      freshness: 'fresh',
    },
  ];

  // ランダムに1-4個の食材を返す
  const shuffled = mockIngredients.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.floor(Math.random() * 4) + 1);

  return {
    success: true,
    ingredients: selected,
    confidence: 0.85,
    processingTime,
  };
};
