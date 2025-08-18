import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('=== 献立生成API開始 ===');
  
  try {
    const { preferences = {} } = await req.json();
    console.log('受信した設定:', preferences);

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('GROQ_API_KEYが設定されていません');
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured' },
        { status: 500 }
      );
    }
    console.log('APIキーが設定されています');

    // 現在の季節と時間を取得
    const now = new Date();
    const season = getSeason(now);
    const timeOfDay = getTimeOfDay(now);
    console.log(`季節: ${season}, 時間帯: ${timeOfDay}`);

    // プロンプトを構築
    const prompt = buildMealSuggestionPrompt(season, timeOfDay, preferences);
    console.log('生成したプロンプトの長さ:', prompt.length);

    console.log('Groq APIへリクエスト送信中...');
    
    // GroqのAPIを呼び出し
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b', // openai/gpt-oss-20bモデルを使用
        messages: [
          {
            role: 'system',
            content: 'あなたは和食を中心とした料理の専門家です。季節感があり、栄養バランスの良い献立を提案してください。回答は必ずJSON形式で返してください。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    console.log('Groq APIレスポンスステータス:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq APIエラー:', errorText);
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Groq APIレスポンス受信成功');
    
    const content = data.choices[0]?.message?.content;
    console.log('生成されたコンテンツの長さ:', content?.length || 0);

    if (!content) {
      console.error('Groqからコンテンツが取得できませんでした');
      throw new Error('No content received from Groq');
    }

    // JSON形式のレスポンスをパース
    let mealSuggestion;
    try {
      console.log('JSONパース試行中...');
      // JSONのマークダウンを削除
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      mealSuggestion = JSON.parse(cleanContent);
      console.log('JSONパース成功');
    } catch (parseError) {
      console.error('JSONパースエラー:', parseError);
      console.log('原始コンテンツ:', content);
      // JSONパースに失敗した場合のフォールバック
      console.log('フォールバック献立を使用します');
      mealSuggestion = createFallbackMeal(season, timeOfDay);
    }

    // レスポンスを標準化
    const standardizedResponse = {
      id: generateMealId(),
      title: mealSuggestion.title || `${season}の${timeOfDay}献立`,
      description: mealSuggestion.description || `季節の食材を使った美味しい献立です`,
      season,
      timeOfDay,
      servings: preferences.servings || 2,
      recipes: mealSuggestion.recipes || [],
      totalCookingTime: calculateTotalTime(mealSuggestion.recipes || []),
      totalCalories: calculateTotalCalories(mealSuggestion.recipes || []),
      nutritionInfo: mealSuggestion.nutritionInfo || {},
      tips: mealSuggestion.tips || [],
      createdAt: new Date().toISOString(),
    };

    console.log('献立生成成功:', standardizedResponse.title);
    console.log('レシピ数:', standardizedResponse.recipes.length);
    
    return NextResponse.json(standardizedResponse);

  } catch (error) {
    console.error('=== 献立生成エラー ===');
    console.error(error);
    
    // エラー時のフォールバック
    const now = new Date();
    const season = getSeason(now);
    const timeOfDay = getTimeOfDay(now);
    
    const fallbackMeal = {
      id: generateMealId(),
      title: `${season}の${timeOfDay}献立`,
      description: 'シンプルで美味しい献立です',
      season,
      timeOfDay,
      servings: 2,
      ...createFallbackMeal(season, timeOfDay)
    };
    
    return NextResponse.json(fallbackMeal);
  }
}

// ヘルパー関数
function getSeason(date: Date): string {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return '春';
  if (month >= 6 && month <= 8) return '夏';
  if (month >= 9 && month <= 11) return '秋';
  return '冬';
}

function getTimeOfDay(date: Date): string {
  const hour = date.getHours();
  if (hour < 10) return '朝食';
  if (hour < 15) return '昼食';
  return '夕食';
}

function buildMealSuggestionPrompt(season: string, timeOfDay: string, preferences: any): string {
  return `
${season}の季節に適した${timeOfDay}の献立を提案してください。

以下の条件を考慮してください：
- 季節: ${season}
- 時間帯: ${timeOfDay}
- 人数: ${preferences.servings || 2}人分
- 料理スタイル: ${preferences.preferredStyle || '和食'}
- 食事制限: ${preferences.dietaryRestrictions?.join(', ') || 'なし'}
- 栄養バランスの良い食事
- 家庭で作りやすい料理

以下のJSON形式で回答してください：
{
  "title": "献立のタイトル",
  "description": "献立の説明",
  "recipes": [
    {
      "name": "料理名",
      "category": "主菜/副菜/汁物/ご飯物",
      "ingredients": ["材料1", "材料2"],
      "cookingTime": 30,
      "calories": 250,
      "instructions": ["手順1", "手順2"]
    }
  ],
  "nutritionInfo": {
    "protein": "たんぱく質の情報",
    "vegetables": "野菜の情報",
    "carbs": "炭水化物の情報"
  },
  "tips": ["調理のコツ1", "調理のコツ2"]
}
`;
}

function createFallbackMeal(season: string, timeOfDay: string) {
  const fallbackRecipes = {
    "春": {
      "朝食": [
        {
          name: '春野菜の卵焼き',
          category: '主菜',
          ingredients: ['卵 2個', 'アスパラガス 3本', 'コシアブラ 少々', 'バター 少々'],
          cookingTime: 10,
          calories: 180,
          instructions: ['卵を溶き、アスパラガスを小口に切る', 'フライパンで焼き上げる']
        }
      ],
      "昼食": [
        {
          name: '春キャベツのパスタ',
          category: '主菜',
          ingredients: ['パスタ 100g', '春キャベツ 3枚', 'ベーコン 2枚', 'オリーブオイル 大さじ1'],
          cookingTime: 15,
          calories: 450,
          instructions: ['パスタを茹でる', 'キャベツとベーコンを炒める', 'パスタと絡める']
        }
      ],
      "夕食": [
        {
          name: 'たけのこご飯',
          category: 'ご飯物',
          ingredients: ['米 2合', 'たけのこ 100g', 'だし 400ml', '醤油 大さじ1'],
          cookingTime: 45,
          calories: 320,
          instructions: ['たけのこを水に浸けて戻す', '米と一緒に炊飯器で炊く']
        },
        {
          name: '春野菜のお味噌汁',
          category: '汁物',
          ingredients: ['春キャベツ 2枚', 'ワカメ 少々', '味噌 大さじ2', 'だし 400ml'],
          cookingTime: 10,
          calories: 50,
          instructions: ['だしを温め、野菜を入れる', '味噌を溶かして完成']
        }
      ]
    },
    "夏": {
      "朝食": [
        {
          name: '冷やしそうめん',
          category: '主菜',
          ingredients: ['そうめん 1束', 'トマト 1個', 'きゅうり 1/2本', 'メンツユ 少々'],
          cookingTime: 10,
          calories: 280,
          instructions: ['そうめんを茹で、冷水で締める', '野菜を切って盛り付ける']
        }
      ],
      "昼食": [
        {
          name: '冷やし中華',
          category: '主菜',
          ingredients: ['中華麺 1玉', 'キュウリ 1本', 'ハム 3枚', 'ゴマダレ 大さじ2'],
          cookingTime: 15,
          calories: 380,
          instructions: ['麺を茹で、冷やす', '具材を切って絡める']
        }
      ],
      "夕食": [
        {
          name: 'うなぎの土用丸',
          category: '主菜',
          ingredients: ['うなぎ 2尾', '稲荷 適量', '蒸し器', 'しょうゆ 適量'],
          cookingTime: 20,
          calories: 280,
          instructions: ['うなぎを蒸し器で蒸す', 'しょうゆでいただく']
        }
      ]
    },
    "秋": {
      "朝食": [
        {
          name: 'きのこご飯',
          category: 'ご飯物',
          ingredients: ['米 2合', 'きのこ 100g', 'だし 400ml', '酒 大さじ1'],
          cookingTime: 45,
          calories: 350,
          instructions: ['きのこを水に浸けて戻す', '米と一緒に炊飯器で炊く']
        }
      ],
      "昼食": [
        {
          name: 'かぼちゃの煮物',
          category: '主菜',
          ingredients: ['かぼちゃ 1/4個', '豚肉 100g', 'ごま油 大さじ1', '調料 適量'],
          cookingTime: 15,
          calories: 320,
          instructions: ['かぼちゃを一口大に切る', '豚肉と一緒に炒める']
        }
      ],
      "夕食": [
        {
          name: 'さんまの塩焼き',
          category: '主菜',
          ingredients: ['さんま 2尾', '大根おろし 適量', 'レモン 1/2個', '塩 少々'],
          cookingTime: 15,
          calories: 250,
          instructions: ['さんまに塩をふって焼く', '大根おろしとレモンでいただく']
        }
      ]
    },
    "冬": {
      "朝食": [
        {
          name: '白菜と豚肉の味噌汁',
          category: '汁物',
          ingredients: ['白菜 2枚', '豚バラ肉 100g', '味噌 大さじ2', 'だし 400ml'],
          cookingTime: 15,
          calories: 180,
          instructions: ['白菜を切ってだしで煮る', '味噌を溶かして完成']
        }
      ],
      "昼食": [
        {
          name: 'うどん',
          category: '主菜',
          ingredients: ['うどん 1玉', 'えび天 1尾', 'わかめ 少々', 'つゆ 400ml'],
          cookingTime: 10,
          calories: 400,
          instructions: ['うどんを茹でる', '温かいつゆでいただく']
        }
      ],
      "夕食": [
        {
          name: '鶏の水炊き',
          category: '主菜',
          ingredients: ['鶏胸肉 200g', '白菜 3枚', 'しょうが 1片', '鶏がらスープ 400ml'],
          cookingTime: 20,
          calories: 280,
          instructions: ['野菜を切って鶏がらスープで煮る', '鶏肉を加えて仕上げる']
        }
      ]
    }
  };

  const seasonRecipes = fallbackRecipes[season as keyof typeof fallbackRecipes];
  const timeRecipes = seasonRecipes?.[timeOfDay as keyof typeof seasonRecipes] || [];
  
  const selectedRecipes = timeRecipes.length > 0 ? timeRecipes : [
    {
      name: '簡単おいしい料理',
      category: '主菜',
      ingredients: ['基本の食材'],
      cookingTime: 20,
      calories: 250,
      instructions: ['シンプルな調理手順']
    }
  ];

  return {
    title: `${season}の${timeOfDay}献立`,
    description: `${season}の旬の食材を使った栄養バランスの良い献立です`,
    recipes: selectedRecipes,
    totalCookingTime: selectedRecipes.reduce((total, recipe) => total + recipe.cookingTime, 0),
    totalCalories: selectedRecipes.reduce((total, recipe) => total + recipe.calories, 0),
    nutritionInfo: {
      protein: 'バランスの良いたんぱく質',
      vegetables: `${season}の野菜たっぷり`,
      carbs: '適量の炭水化物'
    },
    tips: [
      `${season}の食材を活用しましょう`,
      '栄養バランスを考えて調理しましょう',
      '家族みんなで美味しくいただきましょう'
    ]
  };
}

function generateMealId(): string {
  return `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function calculateTotalTime(recipes: any[]): number {
  return recipes.reduce((total, recipe) => total + (recipe.cookingTime || 0), 0);
}

function calculateTotalCalories(recipes: any[]): number {
  return recipes.reduce((total, recipe) => total + (recipe.calories || 0), 0);
}
