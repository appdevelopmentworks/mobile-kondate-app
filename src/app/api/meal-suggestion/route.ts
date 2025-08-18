import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { preferences = {} } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // 現在の季節と時間を取得
    const now = new Date();
    const season = getSeason(now);
    const timeOfDay = getTimeOfDay(now);

    // プロンプトを構築
    const prompt = buildMealSuggestionPrompt(season, timeOfDay, preferences);

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

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from Groq');
    }

    // JSON形式のレスポンスをパース
    let mealSuggestion;
    try {
      mealSuggestion = JSON.parse(content);
    } catch (parseError) {
      // JSONパースに失敗した場合のフォールバック
      mealSuggestion = createFallbackMeal(season, timeOfDay);
    }

    // レスポンスを標準化
    const standardizedResponse = {
      id: generateMealId(),
      title: mealSuggestion.title || `${season}の${timeOfDay}献立`,
      description: mealSuggestion.description || `季節の食材を使った美味しい献立です`,
      season,
      timeOfDay,
      recipes: mealSuggestion.recipes || [],
      totalCookingTime: calculateTotalTime(mealSuggestion.recipes || []),
      totalCalories: calculateTotalCalories(mealSuggestion.recipes || []),
      nutritionInfo: mealSuggestion.nutritionInfo || {},
      tips: mealSuggestion.tips || [],
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(standardizedResponse);

  } catch (error) {
    console.error('Error generating meal suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to generate meal suggestion' },
      { status: 500 }
    );
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
- 和食中心
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
  return {
    title: `${season}の${timeOfDay}献立`,
    description: `${season}の旬の食材を使った栄養バランスの良い献立です`,
    recipes: [
      {
        name: '季節の炊き込みご飯',
        category: 'ご飯物',
        ingredients: ['米', '季節の野菜', 'だし'],
        cookingTime: 45,
        calories: 300,
        instructions: ['米を洗い、野菜と一緒に炊く']
      },
      {
        name: '旬野菜の味噌汁',
        category: '汁物',
        ingredients: ['味噌', '旬の野菜', 'だし'],
        cookingTime: 15,
        calories: 50,
        instructions: ['だしを取り、野菜を煮て味噌を溶く']
      }
    ],
    nutritionInfo: {
      protein: 'バランスの良いたんぱく質',
      vegetables: '季節の野菜たっぷり',
      carbs: '適量の炭水化物'
    },
    tips: ['季節の食材を活用しましょう', '栄養バランスを考えて調理しましょう']
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
