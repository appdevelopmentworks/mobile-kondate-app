import { useApiKeyStore } from '@/lib/settings-store';

// 共通の型定義
export interface MealGenerationRequest {
  ingredients: string[];
  servings?: number;
  cookingTime?: number;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  dietaryRestrictions?: string[];
  preferences?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  cuisine?: string;
}

export interface MealResponse {
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
  provider?: string;
  rawResponse?: string;
}

export interface ImageRecognitionRequest {
  imageBase64: string;
  provider?: string;
}

export interface ImageRecognitionResponse {
  success: boolean;
  ingredients?: {
    name: string;
    confidence: number;
    category: string;
    quantity?: string;
    freshness?: string;
  }[];
  confidence?: number;
  error?: string;
  provider?: string;
  processingTime?: number;
}

// API基底クラス
abstract class BaseApiClient {
  protected apiKey: string;
  protected provider: string;

  constructor(apiKey: string, provider: string) {
    this.apiKey = apiKey;
    this.provider = provider;
  }

  abstract generateMeals(request: MealGenerationRequest): Promise<MealResponse>;
  abstract recognizeImage?(request: ImageRecognitionRequest): Promise<ImageRecognitionResponse>;

  protected buildMealPrompt(request: MealGenerationRequest): string {
    try {
      if (!request) {
        throw new Error('buildMealPrompt: request is null or undefined');
      }
      
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

      if (!Array.isArray(ingredients)) {
        throw new Error('buildMealPrompt: ingredients is not an array');
      }

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

      const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      const creativityPrompt = dietaryRestrictions.some(item => item.includes('時刻') || item.includes('リクエストID') || item.includes('生成時刻'))
        ? '\n\n## 重要な指示\n**毎回異なる創作料理を提案してください。前回とは全く違うレシピ、調理法、味付けで、オリジナリティ溢れる献立を作成してください。**'
        : '';
      
      return `あなたは料理のプロフェッショナルです。以下の条件で【ユニークな献立ID: ${uniqueId}】の献立を提案してください。

## 条件
- **使用食材**: ${ingredients.join(', ')}
- **食事タイプ**: ${mealTypeMap[mealType]}
- **人数**: ${servings}人分
- **調理時間**: ${cookingTime}分以内
- **難易度**: ${difficultyMap[difficulty]}
- **料理ジャンル**: ${cuisine}
${dietaryRestrictions.length > 0 ? `- **食事制限**: ${dietaryRestrictions.join(', ')}` : ''}
${preferences.length > 0 ? `- **好み・要望**: ${preferences.join(', ')}` : ''}${creativityPrompt}

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
    } catch (error) {
      console.error('❌ buildMealPrompt エラー:', {
        error: error instanceof Error ? error.message : String(error),
        errorType: typeof error,
        request: request || 'null',
        timestamp: new Date().toISOString()
      });
      throw new Error(`プロンプト生成中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  protected buildImagePrompt(): string {
    try {
      return `この画像に写っている食材を認識し、日本語で以下のJSON形式で返してください：

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

認識できる食材がない場合は空の配列を返してください。必ずJSON形式のみで回答してください。`;
    } catch (error) {
      console.error('❌ buildImagePrompt エラー:', {
        error: error instanceof Error ? error.message : String(error),
        errorType: typeof error,
        timestamp: new Date().toISOString()
      });
      throw new Error(`画像認識プロンプト生成中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  protected parseJsonResponse(content: string): any {
    console.log('🔍 JSON解析開始 - 生レスポンス:', {
      contentLength: content.length,
      contentPreview: content.substring(0, 500),
      contentType: typeof content
    });
    
    try {
      // JSONブロックを抽出
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/\{[\s\S]*\}/);
      
      console.log('🔍 JSON抽出結果:', {
        hasJsonMatch: !!jsonMatch,
        matchLength: jsonMatch ? jsonMatch.length : 0,
        match0Preview: jsonMatch?.[0]?.substring(0, 200),
        match1Preview: jsonMatch?.[1]?.substring(0, 200)
      });
      
      let jsonStr = jsonMatch ? 
        (jsonMatch[1] || jsonMatch[0]) : content;
      
      // JSONの前処理: 不正なフォーマットを修正
      jsonStr = this.sanitizeJsonString(jsonStr.trim());
      
      console.log('🔍 パース対象JSON (サニタイズ後):', {
        jsonStrLength: jsonStr.length,
        jsonStrPreview: jsonStr.substring(0, 300),
        jsonStrTrimmed: jsonStr.trim().substring(0, 300)
      });
      
      const parsed = JSON.parse(jsonStr);
      console.log('✅ JSON解析成功:', {
        parsedType: typeof parsed,
        parsedKeys: Object.keys(parsed || {}),
        hasMeals: !!parsed?.meals,
        mealsLength: parsed?.meals?.length || 0
      });
      
      return parsed;
    } catch (error) {
      console.error('❌ JSON解析エラー詳細:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        contentLength: content.length,
        contentStart: content.substring(0, 300),
        contentEnd: content.substring(Math.max(0, content.length - 300))
      });
      
      // フォールバック: より寛容なパースを試行
      try {
        const fallbackResult = this.attemptFallbackParsing(content);
        if (fallbackResult) {
          console.log('✅ フォールバック解析成功');
          return fallbackResult;
        }
      } catch (fallbackError) {
        console.warn('⚠️ フォールバック解析も失敗:', fallbackError);
      }
      
      throw new Error('レスポンスの解析に失敗しました');
    }
  }

  /**
   * JSON文字列をサニタイズして有効なJSONにする
   */
  private sanitizeJsonString(jsonStr: string): string {
    try {
      // 1. シングルクォートをダブルクォートに変換（文字列内容以外）
      // まず、文字列の内容を一時的に置換してから処理
      let sanitized = jsonStr;
      
      // 2. JavaScriptオブジェクト記法をJSONに変換
      sanitized = sanitized
        // プロパティ名のクォートが無い場合を修正
        .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
        // シングルクォートをダブルクォートに変換（より包括的）
        .replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '"$1"')
        // 配列内での処理も改善
        .replace(/\[\s*'/g, '["')
        .replace(/'\s*,\s*'/g, '", "')
        .replace(/'\s*\]/g, '"]')
        // 手順などの長いテキスト内の改行やエスケープを処理
        .replace(/\\n/g, '\\n')
        .replace(/\\r/g, '')
        // 末尾のカンマを削除
        .replace(/,(\s*[}\]])/g, '$1')
        // 二重エスケープを修正
        .replace(/\\"/g, '"');
      
      console.log('🔧 JSON サニタイズ結果:', {
        originalLength: jsonStr.length,
        sanitizedLength: sanitized.length,
        originalPreview: jsonStr.substring(0, 200),
        sanitizedPreview: sanitized.substring(0, 200)
      });
      
      return sanitized;
    } catch (error) {
      console.warn('⚠️ JSON サニタイズ中にエラー:', error);
      return jsonStr; // 元の文字列を返す
    }
  }

  /**
   * フォールバック: より寛容なパースを試行
   */
  private attemptFallbackParsing(content: string): any {
    console.log('🔄 フォールバックパース試行');
    
    // パターン1: evalを使用（安全性を考慮して制限された環境で）
    try {
      // 安全なevalのために、関数で包む
      const jsonStr = content.match(/\{[\s\S]*\}/)?.[0];
      if (jsonStr) {
        // 危険なコードをチェック
        if (jsonStr.includes('function') || jsonStr.includes('eval') || jsonStr.includes('require')) {
          throw new Error('安全でないコードが検出されました');
        }
        
        const result = Function('"use strict"; return (' + jsonStr + ')')();
        console.log('✅ eval パース成功');
        return result;
      }
    } catch (error) {
      console.warn('⚠️ eval パース失敗:', error);
    }

    // パターン2: 正規表現で構造化データを抽出
    try {
      const meals = this.extractMealsFromText(content);
      if (meals.length > 0) {
        console.log('✅ 正規表現パース成功:', meals.length + '件');
        return { meals };
      }
    } catch (error) {
      console.warn('⚠️ 正規表現パース失敗:', error);
    }

    return null;
  }

  /**
   * テキストから構造化された献立データを抽出
   */
  private extractMealsFromText(content: string): any[] {
    const meals = [];
    
    try {
      // パターン1: JSON形式の料理データを抽出（シングルクォート対応）
      const mealPattern = /['"']name['"']\s*:\s*['"']([^'"']+)['"']/g;
      const ingredientPattern = /['"']ingredients['"']\s*:\s*\[([^\]]+)\]/g;
      const instructionPattern = /['"']instructions['"']\s*:\s*\[([^\]]+)\]/g;
      
      // 各料理のデータを抽出
      let mealMatch;
      const mealPattern2 = new RegExp(mealPattern.source, 'g');
      
      while ((mealMatch = mealPattern2.exec(content)) !== null) {
        const name = mealMatch[1];
        
        // この料理に関連するセクションを特定
        const mealStart = mealMatch.index;
        const nextMealMatch = mealPattern2.exec(content);
        const mealEnd = nextMealMatch ? nextMealMatch.index : content.length;
        mealPattern2.lastIndex = mealEnd; // 次の検索位置をリセット
        
        const mealSection = content.substring(mealStart, mealEnd);
        
        // 材料を抽出（シングルクォート・ダブルクォート両対応）
        const ingredientMatch = mealSection.match(/['"']ingredients['"']\s*:\s*\[([^\]]+)\]/);
        let ingredients: string[] = [];
        if (ingredientMatch) {
          ingredients = ingredientMatch[1]
            .split(',')
            .map(ing => ing.trim().replace(/^['"']|['"']$/g, '').trim())
            .filter(ing => ing.length > 0);
        }
        
        // 手順を抽出（シングルクォート・ダブルクォート両対応）
        const instructionMatch = mealSection.match(/['"']instructions['"']\s*:\s*\[([^\]]+)\]/);
        let instructions: string[] = [];
        if (instructionMatch) {
          // 長い手順文を適切に分割
          const instructionText = instructionMatch[1];
          
          // 手順番号付きのパターンを探す
          const stepPattern = /['"']([^'"']*手順\d+[^'"']*)['"']/g;
          let stepMatch;
          while ((stepMatch = stepPattern.exec(instructionText)) !== null) {
            instructions.push(stepMatch[1]);
          }
          
          // 手順番号がない場合は単純に分割
          if (instructions.length === 0) {
            instructions = instructionText
              .split(/['"']\s*,\s*['"']/)
              .map(inst => inst.trim().replace(/^['"']|['"']$/g, '').trim())
              .filter(inst => inst.length > 0);
          }
        }

        if (name && (ingredients.length > 0 || instructions.length > 0)) {
          meals.push({
            name: name.trim(),
            ingredients: ingredients.length > 0 ? ingredients : ['材料情報なし'],
            instructions: instructions.length > 0 ? instructions : ['手順情報なし'],
            cookingTime: 30, // デフォルト値
            servings: 2,     // デフォルト値
            difficulty: 'medium',
            category: '主菜',
            tips: []
          });
        }
      }
      
      // パターン2: より緩い形式での抽出
      if (meals.length === 0) {
        const simplePattern = /(?:料理名|名前|name)[:\s]*['"']?([^'"'\n,}]+)['"']?/gi;
        let match;
        let counter = 1;
        
        while ((match = simplePattern.exec(content)) !== null && counter <= 3) {
          meals.push({
            name: match[1].trim(),
            ingredients: ['材料情報の抽出に失敗しました'],
            instructions: ['手順情報の抽出に失敗しました'],
            cookingTime: 30,
            servings: 2,
            difficulty: 'medium',
            category: '主菜',
            tips: []
          });
          counter++;
        }
      }
    } catch (error) {
      console.warn('⚠️ テキスト抽出中にエラー:', error);
    }
    
    return meals;
  }
}

// Groq APIクライアント
export class GroqApiClient extends BaseApiClient {
  constructor(apiKey: string) {
    super(apiKey, 'Groq');
  }

  async generateMeals(request: MealGenerationRequest): Promise<MealResponse> {
    try {
      const prompt = this.buildMealPrompt(request);
      const model = 'openai/gpt-oss-120b';
      
      console.log('🚀 Groq献立生成開始:', {
        provider: this.provider,
        model: model,
        hasApiKey: !!this.apiKey,
        keyLength: this.apiKey?.length,
        ingredients: request.ingredients
      });
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: request.dietaryRestrictions?.some(item => item.includes('時刻') || item.includes('リクエストID')) ? 0.9 : 0.7,
          top_p: 0.95,
          frequency_penalty: 0.5,
          presence_penalty: 0.3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        if (response.status === 429) {
          console.warn('⚠️ Groq APIレート制限に達しました。他のプロバイダーにフォールバックします。', {
            status: response.status,
            statusText: response.statusText,
            errorBody: errorText,
            headers: Object.fromEntries(response.headers.entries())
          });
          throw new Error(`Groq APIレート制限: ${response.status} - ${errorText || 'レート制限に達しました'}`);
        }
        
        console.error('❌ Groq APIエラー詳細:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        });
        throw new Error(`Groq API エラー: ${response.status} - ${errorText || response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('レスポンスが空です');
      }

      const parsed = this.parseJsonResponse(content);
      
      return {
        success: true,
        meals: parsed.meals || [],
        provider: this.provider,
        rawResponse: content,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '予期しないエラー',
        provider: this.provider,
      };
    }
  }

  async recognizeImage(request: ImageRecognitionRequest): Promise<ImageRecognitionResponse> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Groq画像認識開始:', { 
        provider: this.provider, 
        hasApiKey: !!this.apiKey,
        keyLength: this.apiKey?.length,
        imageSize: request.imageBase64.length 
      });
      
      const prompt = this.buildImagePrompt();
      console.log('📝 Groq画像プロンプト:', prompt.substring(0, 200) + '...');
      
      const requestBody = {
        model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${request.imageBase64}`
              }
            }
          ]
        }],
        max_tokens: 1000,
        temperature: 0.3,
      };
      
      console.log('📡 Groq Vision API呼び出し:', `https://api.groq.com/openai/v1/chat/completions (model: ${requestBody.model})`);
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📊 Groq Vision APIレスポンス:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Groq Vision APIエラー詳細:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
        });
        throw new Error(`Groq Vision API エラー: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📋 Groq Vision APIレスポンスデータ:', {
        choices: data.choices?.length || 0,
        hasContent: !!data.choices?.[0]?.message?.content,
        finishReason: data.choices?.[0]?.finish_reason,
      });
      
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        console.error('❌ Groq Visionレスポンスが空:', { data, finishReason: data.choices?.[0]?.finish_reason });
        throw new Error(`レスポンスが空です。finishReason: ${data.choices?.[0]?.finish_reason || 'unknown'}`);
      }

      console.log('📄 Groq Vision生レスポンス:', content.substring(0, 300) + '...');

      const parsed = this.parseJsonResponse(content);
      console.log('✅ Groq Vision JSON解析成功:', { ingredientCount: parsed.ingredients?.length || 0 });
      
      const processingTime = Date.now() - startTime;
      console.log(`🎉 Groq画像認識完了 (${processingTime}ms)`);
      
      return {
        success: true,
        ingredients: parsed.ingredients || [],
        confidence: parsed.confidence || 0,
        provider: this.provider,
        processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ Groq画像認識エラー:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        processingTime,
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : '予期しないエラー',
        provider: this.provider,
        processingTime,
      };
    }
  }
}

// Gemini APIクライアント
export class GeminiApiClient extends BaseApiClient {
  constructor(apiKey: string) {
    super(apiKey, 'Gemini');
  }

  async generateMeals(request: MealGenerationRequest): Promise<MealResponse> {
    const startTime = Date.now();
    
    try {
      // 入力パラメータの安全性チェック
      if (!this.apiKey) {
        throw new Error('Gemini API キーが設定されていません');
      }
      
      if (!request) {
        throw new Error('リクエストが null または undefined です');
      }
      
      console.log('🔍 Gemini献立生成開始:', { 
        provider: this.provider, 
        hasApiKey: !!this.apiKey, 
        keyLength: this.apiKey?.length,
        requestValid: !!request,
        ingredients: request?.ingredients?.length || 0
      });
      
      const prompt = this.buildMealPrompt(request);
      console.log('📝 Gemini献立プロンプト:', prompt.substring(0, 200) + '...');
      
      const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: request.dietaryRestrictions?.some(item => item.includes('時刻') || item.includes('リクエストID')) ? 0.9 : 0.7,
          maxOutputTokens: 2000,
          topP: 0.95,
          topK: 40,
        },
      };
      
      console.log('📡 Gemini API呼び出し:', `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${this.apiKey.substring(0, 8)}...`);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📊 Gemini APIレスポンス:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // レート制限エラーの特別ハンドリング
        if (response.status === 429) {
          console.warn('⚠️ Gemini APIレート制限に達しました。他のプロバイダーにフォールバックします。', {
            status: response.status,
            statusText: response.statusText,
            errorBody: errorText
          });
          throw new Error(`Gemini APIレート制限: ${response.status} - しばらく待ってから再試行するか、他のプロバイダーを使用してください`);
        }
        
        console.error('❌ Gemini APIエラー詳細:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
        });
        throw new Error(`Gemini API エラー: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📋 Gemini APIレスポンスデータ:', {
        candidates: data.candidates?.length || 0,
        hasContent: !!data.candidates?.[0]?.content?.parts?.[0]?.text,
        safetyRatings: data.candidates?.[0]?.safetyRatings,
        finishReason: data.candidates?.[0]?.finishReason,
      });
      
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        console.error('❌ Geminiレスポンスが空:', { data, finishReason: data.candidates?.[0]?.finishReason });
        throw new Error(`レスポンスが空です。finishReason: ${data.candidates?.[0]?.finishReason || 'unknown'}`);
      }

      console.log('📄 Gemini生レスポンス:', content.substring(0, 300) + '...');

      const parsed = this.parseJsonResponse(content);
      console.log('✅ Gemini JSON解析成功:', { mealCount: parsed.meals?.length || 0 });
      
      const processingTime = Date.now() - startTime;
      console.log(`🎉 Gemini献立生成完了 (${processingTime}ms)`);
      
      return {
        success: true,
        meals: parsed.meals || [],
        provider: this.provider,
        rawResponse: content,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ Gemini献立生成エラー (詳細):', {
        error: error instanceof Error ? error.message : String(error),
        errorType: typeof error,
        stack: error instanceof Error ? error.stack : undefined,
        processingTime,
        provider: this.provider,
        timestamp: new Date().toISOString()
      });
      
      // エラーメッセージの詳細化
      let errorMessage = 'Gemini API: 予期しないエラー';
      if (error instanceof Error) {
        errorMessage = `Gemini API: ${error.message}`;
      } else if (typeof error === 'string') {
        errorMessage = `Gemini API: ${error}`;
      }
      
      return {
        success: false,
        error: errorMessage,
        provider: this.provider,
      };
    }
  }

  async recognizeImage(request: ImageRecognitionRequest): Promise<ImageRecognitionResponse> {
    const startTime = Date.now();
    
    try {
      // 入力パラメータの安全性チェック
      if (!this.apiKey) {
        throw new Error('Gemini API キーが設定されていません');
      }
      
      if (!request) {
        throw new Error('リクエストが null または undefined です');
      }
      
      if (!request.imageBase64) {
        throw new Error('画像データが null または undefined です');
      }
      
      console.log('🔍 Gemini画像認識開始:', { 
        provider: this.provider, 
        hasApiKey: !!this.apiKey,
        keyLength: this.apiKey?.length,
        requestValid: !!request,
        hasImageData: !!request.imageBase64,
        imageSize: request.imageBase64?.length || 0
      });
      
      const prompt = this.buildImagePrompt();
      console.log('📝 Gemini画像プロンプト:', prompt.substring(0, 200) + '...');
      
      const requestBody = {
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: request.imageBase64
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        },
      };
      
      console.log('📡 Gemini Vision API呼び出し:', `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${this.apiKey.substring(0, 8)}...`);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📊 Gemini Vision APIレスポンス:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // レート制限エラーの特別ハンドリング
        if (response.status === 429) {
          console.warn('⚠️ Gemini Vision APIレート制限に達しました。他のプロバイダーにフォールバックします。', {
            status: response.status,
            statusText: response.statusText,
            errorBody: errorText
          });
          throw new Error(`Gemini Vision APIレート制限: ${response.status} - しばらく待ってから再試行するか、他のプロバイダーを使用してください`);
        }
        
        console.error('❌ Gemini Vision APIエラー詳細:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText,
        });
        throw new Error(`Gemini Vision API エラー: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📋 Gemini Vision APIレスポンスデータ:', {
        candidates: data.candidates?.length || 0,
        hasContent: !!data.candidates?.[0]?.content?.parts?.[0]?.text,
        finishReason: data.candidates?.[0]?.finishReason,
      });
      
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        console.error('❌ Gemini Visionレスポンスが空:', { data, finishReason: data.candidates?.[0]?.finishReason });
        throw new Error(`レスポンスが空です。finishReason: ${data.candidates?.[0]?.finishReason || 'unknown'}`);
      }

      console.log('📄 Gemini Vision生レスポンス:', content.substring(0, 300) + '...');

      const parsed = this.parseJsonResponse(content);
      console.log('✅ Gemini Vision JSON解析成功:', { ingredientCount: parsed.ingredients?.length || 0 });
      
      const processingTime = Date.now() - startTime;
      console.log(`🎉 Gemini画像認識完了 (${processingTime}ms)`);
      
      return {
        success: true,
        ingredients: parsed.ingredients || [],
        confidence: parsed.confidence || 0,
        provider: this.provider,
        processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ Gemini画像認識エラー (詳細):', {
        error: error instanceof Error ? error.message : String(error),
        errorType: typeof error,
        stack: error instanceof Error ? error.stack : undefined,
        processingTime,
        provider: this.provider,
        timestamp: new Date().toISOString()
      });
      
      // エラーメッセージの詳細化
      let errorMessage = 'Gemini Vision API: 予期しないエラー';
      if (error instanceof Error) {
        errorMessage = `Gemini Vision API: ${error.message}`;
      } else if (typeof error === 'string') {
        errorMessage = `Gemini Vision API: ${error}`;
      }
      
      return {
        success: false,
        error: errorMessage,
        provider: this.provider,
        processingTime,
      };
    }
  }
}

// OpenAI APIクライアント
export class OpenAIApiClient extends BaseApiClient {
  constructor(apiKey: string) {
    super(apiKey, 'OpenAI');
  }

  async generateMeals(request: MealGenerationRequest): Promise<MealResponse> {
    try {
      const prompt = this.buildMealPrompt(request);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: request.dietaryRestrictions?.some(item => item.includes('時刻') || item.includes('リクエストID')) ? 0.9 : 0.7,
          top_p: 0.95,
          frequency_penalty: 0.3,
          presence_penalty: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API エラー: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('レスポンスが空です');
      }

      const parsed = this.parseJsonResponse(content);
      
      return {
        success: true,
        meals: parsed.meals || [],
        provider: this.provider,
        rawResponse: content,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '予期しないエラー',
        provider: this.provider,
      };
    }
  }

  async recognizeImage(request: ImageRecognitionRequest): Promise<ImageRecognitionResponse> {
    try {
      const prompt = this.buildImagePrompt();
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${request.imageBase64}`
                }
              }
            ]
          }],
          max_tokens: 1000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI Vision API エラー: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('レスポンスが空です');
      }

      const parsed = this.parseJsonResponse(content);
      
      return {
        success: true,
        ingredients: parsed.ingredients || [],
        confidence: parsed.confidence || 0,
        provider: this.provider,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '予期しないエラー',
        provider: this.provider,
      };
    }
  }
}

// Anthropic APIクライアント
export class AnthropicApiClient extends BaseApiClient {
  constructor(apiKey: string) {
    super(apiKey, 'Anthropic');
  }

  async generateMeals(request: MealGenerationRequest): Promise<MealResponse> {
    try {
      const prompt = this.buildMealPrompt(request);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API エラー: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content[0]?.text;
      
      if (!content) {
        throw new Error('レスポンスが空です');
      }

      const parsed = this.parseJsonResponse(content);
      
      return {
        success: true,
        meals: parsed.meals || [],
        provider: this.provider,
        rawResponse: content,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '予期しないエラー',
        provider: this.provider,
      };
    }
  }

  async recognizeImage(request: ImageRecognitionRequest): Promise<ImageRecognitionResponse> {
    try {
      const prompt = this.buildImagePrompt();
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: request.imageBase64,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic Vision API エラー: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content[0]?.text;
      
      if (!content) {
        throw new Error('レスポンスが空です');
      }

      const parsed = this.parseJsonResponse(content);
      
      return {
        success: true,
        ingredients: parsed.ingredients || [],
        confidence: parsed.confidence || 0,
        provider: this.provider,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '予期しないエラー',
        provider: this.provider,
      };
    }
  }
}

// HuggingFace APIクライアント
export class HuggingFaceApiClient extends BaseApiClient {
  constructor(apiKey: string) {
    super(apiKey, 'HuggingFace');
  }

  async generateMeals(request: MealGenerationRequest): Promise<MealResponse> {
    try {
      const prompt = this.buildMealPrompt(request);
      
      const response = await fetch('https://api-inference.huggingface.co/models/meta-llama/Llama-3.1-8B-Instruct', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 2000,
            temperature: 0.7,
            do_sample: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HuggingFace API エラー: ${response.status}`);
      }

      const data = await response.json();
      const content = data[0]?.generated_text || '';
      
      if (!content) {
        throw new Error('レスポンスが空です');
      }

      // プロンプトを除いたレスポンス部分を抽出
      const responseOnly = content.replace(prompt, '').trim();
      const parsed = this.parseJsonResponse(responseOnly);
      
      return {
        success: true,
        meals: parsed.meals || [],
        provider: this.provider,
        rawResponse: content,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '予期しないエラー',
        provider: this.provider,
      };
    }
  }

  async recognizeImage(request: ImageRecognitionRequest): Promise<ImageRecognitionResponse> {
    try {
      const response = await fetch('https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: request.imageBase64,
        }),
      });

      if (!response.ok) {
        throw new Error(`HuggingFace Vision API エラー: ${response.status}`);
      }

      const data = await response.json();
      const caption = data[0]?.generated_text || '';
      
      // 簡単な食材推定（実際のプロジェクトではより高度な処理が必要）
      const estimatedIngredients = this.extractIngredientsFromCaption(caption);
      
      return {
        success: true,
        ingredients: estimatedIngredients,
        confidence: 0.7,
        provider: this.provider,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '予期しないエラー',
        provider: this.provider,
      };
    }
  }

  private extractIngredientsFromCaption(caption: string) {
    const ingredientKeywords = [
      'tomato', 'onion', 'carrot', 'potato', 'cabbage', 'lettuce', 'cucumber',
      'broccoli', 'spinach', 'mushroom', 'chicken', 'beef', 'pork', 'fish',
      'egg', 'milk', 'cheese', 'rice', 'bread', 'pasta'
    ];

    const ingredients = [];
    const lowerCaption = caption.toLowerCase();

    for (const keyword of ingredientKeywords) {
      if (lowerCaption.includes(keyword)) {
        ingredients.push({
          name: keyword,
          confidence: 0.7,
          category: 'unknown' as const,
        });
      }
    }

    return ingredients;
  }
}

// Together AI APIクライアント
export class TogetherAIApiClient extends BaseApiClient {
  constructor(apiKey: string) {
    super(apiKey, 'Together AI');
  }

  async generateMeals(request: MealGenerationRequest): Promise<MealResponse> {
    try {
      const prompt = this.buildMealPrompt(request);
      
      const response = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Together AI API エラー: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('レスポンスが空です');
      }

      const parsed = this.parseJsonResponse(content);
      
      return {
        success: true,
        meals: parsed.meals || [],
        provider: this.provider,
        rawResponse: content,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '予期しないエラー',
        provider: this.provider,
      };
    }
  }

  async recognizeImage(request: ImageRecognitionRequest): Promise<ImageRecognitionResponse> {
    try {
      const prompt = this.buildImagePrompt();
      
      const response = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${request.imageBase64}`
                }
              }
            ]
          }],
          max_tokens: 1000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`Together AI Vision API エラー: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('レスポンスが空です');
      }

      const parsed = this.parseJsonResponse(content);
      
      return {
        success: true,
        ingredients: parsed.ingredients || [],
        confidence: parsed.confidence || 0,
        provider: this.provider,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '予期しないエラー',
        provider: this.provider,
      };
    }
  }
}
