/**
 * Groq API クライアント
 * モデル: openai/gpt-oss-20b を使用して献立生成
 */

export interface GroqMealGenerationRequest {
  ingredients: string[];
  servings?: number;
  cookingTime?: number;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  dietaryRestrictions?: string[];
  preferences?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  cuisine?: string;
}

export interface GroqMealResponse {
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
  rawResponse?: string;
}

/**
 * Groq APIを使用して献立を生成
 */
export async function generateMealsWithGroq(request: GroqMealGenerationRequest): Promise<GroqMealResponse> {
  try {
    console.log('🚀 Groq API献立生成開始:', request);

    // プロンプトを構築
    const prompt = buildMealGenerationPrompt(request);
    
    // Groq API呼び出し
    const apiResponse = await callGroqAPI(prompt);
    
    if (!apiResponse.success) {
      return {
        success: false,
        error: apiResponse.error || 'Groq API呼び出しに失敗しました',
        rawResponse: apiResponse.rawResponse
      };
    }

    // レスポンスをパース
    const parsedMeals = parseMealResponse(apiResponse.content || '');
    
    if (parsedMeals.length === 0) {
      return {
        success: false,
        error: '献立の生成に失敗しました。レスポンスを解析できませんでした。',
        rawResponse: apiResponse.content
      };
    }

    console.log('✅ Groq API献立生成成功:', parsedMeals.length + '品');
    
    return {
      success: true,
      meals: parsedMeals,
      rawResponse: apiResponse.content
    };

  } catch (error) {
    console.error('❌ Groq API献立生成エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '予期しないエラーが発生しました',
    };
  }
}

/**
 * 献立生成用のプロンプトを構築
 */
function buildMealGenerationPrompt(request: GroqMealGenerationRequest): string {
  const {
    ingredients,
    servings = 2,
    cookingTime = 45,
    mealType = 'dinner',
    dietaryRestrictions = [],
    preferences = [],
    difficulty = 'medium',
    cuisine = '和洋中問わず'
  } = request;

  const mealTypeMap = {
    breakfast: '朝食',
    lunch: '昼食', 
    dinner: '夕食',
    snack: '軽食・おやつ'
  };

  const difficultyMap = {
    easy: '簡単（30分以内）',
    medium: '普通（45分以内）',
    hard: '本格的（60分以上）'
  };

  return `あなたは料理のプロフェッショナルです。以下の条件で献立を提案してください。

## 条件
- **使用食材**: ${ingredients.join(', ')}
- **食事タイプ**: ${mealTypeMap[mealType]}
- **人数**: ${servings}人分
- **調理時間**: ${cookingTime}分以内
- **難易度**: ${difficultyMap[difficulty]}
- **料理ジャンル**: ${cuisine}
${dietaryRestrictions.length > 0 ? `- **食事制限**: ${dietaryRestrictions.join(', ')}` : ''}
${preferences.length > 0 ? `- **好み・要望**: ${preferences.join(', ')}` : ''}

## 出力形式
以下のJSON形式で3-4品の献立を提案してください：

\`\`\`json
{
  "meals": [
    {
      "name": "料理名",
      "ingredients": ["材料1", "材料2", "材料3"],
      "instructions": [
        "手順1: 具体的な調理手順",
        "手順2: 具体的な調理手順", 
        "手順3: 具体的な調理手順"
      ],
      "cookingTime": 30,
      "servings": ${servings},
      "difficulty": "easy",
      "category": "主菜",
      "tips": ["コツ1", "コツ2"]
    }
  ]
}
\`\`\`

## 注意事項
1. **必ず指定された食材を活用**してください
2. **実用的で美味しい**料理を提案してください  
3. **手順は具体的で分かりやすく**記述してください
4. **調理時間は現実的**に設定してください
5. **主菜・副菜・汁物・ご飯もの**等、バランス良く提案してください
6. **材料は一般的に入手可能**なものを使用してください
7. **JSONは正確な形式**で出力してください

それでは、美味しい献立を提案してください！`;
}

/**
 * Groq APIを実際に呼び出す
 */
async function callGroqAPI(prompt: string): Promise<{
  success: boolean;
  content?: string;
  error?: string;
  rawResponse?: string;
}> {
  try {
    // Groq APIのエンドポイント
    const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
    
    // APIキーの確認（環境変数またはクライアント側設定）
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    
    console.log('🔑 Groq APIキー確認:', {
      hasKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyStart: apiKey?.substring(0, 8) || 'なし',
      envVar: 'NEXT_PUBLIC_GROQ_API_KEY'
    });
    
    if (!apiKey) {
      console.warn('⚠️ GROQ_API_KEYが設定されていません');
      return {
        success: false,
        error: 'Groq APIキーが設定されていません。環境変数NEXT_PUBLIC_GROQ_API_KEYを設定してください。'
      };
    }

    const requestBody = {
      model: 'openai/gpt-oss-20b',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
      top_p: 0.9,
      stream: false
    };

    console.log('📡 Groq API リクエスト送信:', {
      url: GROQ_API_URL,
      model: requestBody.model,
      promptLength: prompt.length,
      maxTokens: requestBody.max_tokens,
      timestamp: new Date().toISOString()
    });

    const fetchStartTime = Date.now();
    
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const fetchEndTime = Date.now();
    const fetchDuration = fetchEndTime - fetchStartTime;
    
    console.log('📊 Groq API HTTPレスポンス:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      duration: `${fetchDuration}ms`,
      headers: Object.fromEntries(response.headers.entries())
    });

    const responseText = await response.text();
    
    console.log('📝 Groq APIレスポンステキスト:', {
      length: responseText.length,
      firstChars: responseText.substring(0, 200) + '...'
    });
    
    if (!response.ok) {
      console.error('❌ Groq API エラーレスポンス:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      
      return {
        success: false,
        error: `Groq API エラー: ${response.status} ${response.statusText}`,
        rawResponse: responseText
      };
    }

    const jsonResponse = JSON.parse(responseText);
    
    console.log('📄 Groq API JSONレスポンス解析:', {
      hasChoices: !!jsonResponse.choices,
      choicesLength: jsonResponse.choices?.length || 0,
      usage: jsonResponse.usage,
      model: jsonResponse.model
    });
    
    if (!jsonResponse.choices || jsonResponse.choices.length === 0) {
      console.error('❌ Groq API無効レスポンス: choicesが空');
      return {
        success: false,
        error: 'Groq APIからの無効なレスポンス: choices配列が空です',
        rawResponse: responseText
      };
    }

    const content = jsonResponse.choices[0].message?.content;
    
    if (!content) {
      console.error('❌ Groq API無効レスポンス: contentが空');
      return {
        success: false,
        error: 'Groq APIからの無効なレスポンス: contentが空です',
        rawResponse: responseText
      };
    }

    console.log('✅ Groq API レスポンス成功:', {
      contentLength: content.length,
      usage: jsonResponse.usage,
      contentPreview: content.substring(0, 100) + '...'
    });

    return {
      success: true,
      content: content,
      rawResponse: responseText
    };

  } catch (error) {
    console.error('❌ Groq API 呼び出しエラー:', error);
    
    // エラーの詳細情報
    if (error instanceof Error) {
      console.error('エラー詳細:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '予期しないエラー',
    };
  }
}

/**
 * Groq APIからの献立レスポンスをパース
 */
function parseMealResponse(content: string): Array<{
  name: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: number;
  servings: number;
  difficulty: string;
  category: string;
  tips?: string[];
}> {
  try {
    console.log('🔍 献立レスポンス解析開始...');
    
    // JSONブロックを抽出
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    let jsonStr = jsonMatch ? jsonMatch[1] : content;
    
    // JSON以外のテキストを除去
    jsonStr = jsonStr.trim();
    
    // JSONをパース
    const parsed = JSON.parse(jsonStr);
    
    if (!parsed.meals || !Array.isArray(parsed.meals)) {
      console.error('❌ 無効な献立構造:', parsed);
      return [];
    }

    // 各献立を検証・正規化
    const validMeals = parsed.meals
      .filter((meal: any) => {
        return meal.name && 
               Array.isArray(meal.ingredients) && 
               Array.isArray(meal.instructions) &&
               meal.ingredients.length > 0 &&
               meal.instructions.length > 0;
      })
      .map((meal: any) => ({
        name: String(meal.name),
        ingredients: meal.ingredients.map((ing: any) => String(ing)),
        instructions: meal.instructions.map((inst: any) => String(inst)),
        cookingTime: Number(meal.cookingTime) || 30,
        servings: Number(meal.servings) || 2,
        difficulty: String(meal.difficulty || 'medium'),
        category: String(meal.category || '主菜'),
        tips: Array.isArray(meal.tips) ? meal.tips.map((tip: any) => String(tip)) : []
      }));

    console.log('✅ 献立解析成功:', validMeals.length + '品');
    return validMeals;

  } catch (error) {
    console.error('❌ 献立レスポンス解析エラー:', error);
    console.log('📄 元のレスポンス:', content);
    
    // フォールバック: テキストから簡単な献立を抽出
    return extractMealsFromText(content);
  }
}

/**
 * JSONパースに失敗した場合のフォールバック
 */
function extractMealsFromText(content: string): Array<{
  name: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: number;
  servings: number;
  difficulty: string;
  category: string;
  tips?: string[];
}> {
  try {
    console.log('🔧 テキストから献立抽出を試行...');
    
    const lines = content.split('\n').filter(line => line.trim());
    const meals: any[] = [];
    
    // 料理名らしきものを探す
    for (const line of lines) {
      if (line.includes('料理') || line.includes('レシピ') || 
          line.match(/^\d+\./) || line.match(/^[・•]/)) {
        
        const cleanName = line
          .replace(/^\d+\./, '')
          .replace(/^[・•]/, '')
          .replace(/【.*?】/, '')
          .trim();
        
        if (cleanName.length > 0 && cleanName.length < 30) {
          meals.push({
            name: cleanName,
            ingredients: ['提供された食材を使用'],
            instructions: ['詳細な手順は別途確認してください'],
            cookingTime: 30,
            servings: 2,
            difficulty: 'medium',
            category: '主菜',
            tips: []
          });
        }
      }
    }
    
    if (meals.length > 0) {
      console.log('✅ テキストから献立抽出成功:', meals.length + '品');
      return meals.slice(0, 4); // 最大4品まで
    }
    
    return [];
  } catch (error) {
    console.error('❌ テキスト抽出エラー:', error);
    return [];
  }
}

/**
 * 環境変数チェック
 */
export function checkGroqApiKey(): boolean {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  const isAvailable = !!apiKey && apiKey.length > 0;
  
  console.log('🔑 Groq APIキー確認:', isAvailable ? '✅ 設定済み' : '❌ 未設定');
  
  return isAvailable;
}
