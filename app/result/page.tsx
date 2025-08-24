'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMealStore } from '../../lib/store';
import { useSettingsStore } from '../../lib/settings-store';
import { motion, AnimatePresence } from 'framer-motion';
import MobileLayout from '../../components/layout/MobileLayout';
import { 
  Clock, 
  Users, 
  Heart, 
  ShoppingCart, 
  ChefHat, 
  Home, 
  RefreshCw,
  Star,
  Flame,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { sampleRecipes } from '../../lib/sample-data';
import type { MealSuggestion, Recipe, MealPreference } from '../../lib/types';
import { generateMeals, checkMealGenerationStatus } from '../../lib/meal-generation';

// 献立のバリエーションパターンを定義
const mealPatterns = {
  1: [
    [0], // 肉じゃがのみ
    [4], // 親子丼のみ
    [1], // 鮭の塩焼きのみ
  ],
  2: [
    [0, 3], // 肉じゃが + ほうれん草のお浸し
    [4, 2], // 親子丼 + 味噌汁
    [1, 3], // 鮭の塩焼き + ほうれん草のお浸し
  ],
  3: [
    [0, 3, 2], // 肉じゃが + ほうれん草のお浸し + 味噌汁
    [4, 3, 2], // 親子丼 + ほうれん草のお浸し + 味噌汁
    [1, 0, 2], // 鮭の塩焼き + 肉じゃが + 味噌汁
  ],
  4: [
    [0, 1, 3, 2], // 肉じゃが + 鮭の塩焼き + ほうれん草のお浸し + 味噌汁
    [4, 1, 3, 2], // 親子丼 + 鮭の塩焼き + ほうれん草のお浸し + 味噌汁
    [0, 4, 3, 2], // 肉じゃが + 親子丼 + ほうれん草のお浸し + 味噌汁
  ],
};

export default function ResultPage() {
  const router = useRouter();
  const { formData, addToHistory, toggleFavorite, favorites, setLoading, isLoading, clearGeneratedSuggestion } = useMealStore();
  const { defaultServings, defaultCookingTime } = useSettingsStore();
  
  // デバッグ用：設定値をログ出力
  console.log('🔧 結果画面 - 設定値:', {
    defaultServings,
    defaultCookingTime,
    formDataServings: formData.servings,
    finalServings: formData.servings || defaultServings,
    timestamp: new Date().toISOString()
  });
  const [mealSuggestion, setMealSuggestion] = useState<MealSuggestion | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const getMealTitle = useCallback(() => {
    const mealTypeMap = {
      breakfast: '朝食',
      lunch: '昼食', 
      dinner: '夕食',
      bento: 'お弁当',
      party: 'おもてなし'
    };
    
    const mealTypeName = mealTypeMap[formData.mealType || 'dinner'];
    const nutritionMap = {
      balanced: 'バランス',
      protein: 'タンパク質重視',
      vegetable: '野菜たっぷり',
      light: 'あっさり'
    };
    
    const nutritionName = nutritionMap[formData.nutritionBalance || 'balanced'];
    
    // バリエーションのためにランダムな要素を追加
    const variations = ['', 'おすすめ', '人気', '定番', '家庭の'];
    const variation = variations[Math.floor(Math.random() * variations.length)];
    
    return `${variation}${nutritionName}の${mealTypeName}セット`.replace(/^の/, '');
  }, [formData.mealType, formData.nutritionBalance]);

  const getMealDescription = useCallback(() => {
    // デフォルト設定を常に優先（formDataはページリロードで失われるため）
    const servings = defaultServings;
    const cookingTime = defaultCookingTime;
    const time = cookingTime === 'unlimited' ? 'じっくり' : `${cookingTime}分`;
    return `${servings}人分・調理時間${time}で作れる献立です`;
  }, [defaultServings, defaultCookingTime]);

  const generateShoppingList = useCallback((recipes: Recipe[]) => {
    const ingredients = new Map();
    
    recipes.forEach(recipe => {
      recipe.ingredients.forEach(ingredient => {
        if (ingredients.has(ingredient.name)) {
          // 同じ食材がある場合は数量を合計（簡易実装）
          const existing = ingredients.get(ingredient.name);
          ingredients.set(ingredient.name, {
            ingredient: ingredient.name,
            amount: `${existing.amount} + ${ingredient.amount}`,
            checked: false
          });
        } else {
          ingredients.set(ingredient.name, {
            ingredient: ingredient.name,
            amount: ingredient.amount + (ingredient.unit || ''),
            checked: false
          });
        }
      });
    });
    
    return Array.from(ingredients.values());
  }, []);

  const generateCookingSchedule = useCallback((recipes: Recipe[]) => {
    interface ScheduleItem {
      time: string;
      task: string;
      recipeId: string;
      recipeName: string;
    }
    
    const schedule: ScheduleItem[] = [];
    let currentTime = 0;
    
    recipes.forEach(recipe => {
      recipe.steps.forEach((step, index) => {
        schedule.push({
          time: `${Math.floor(currentTime / 60)}:${(currentTime % 60).toString().padStart(2, '0')}`,
          task: step.description,
          recipeId: recipe.id,
          recipeName: recipe.name
        });
        currentTime += step.duration || 5;
      });
    });
    
    return schedule;
  }, []);

  const generateMealSuggestionLegacy = useCallback(async () => {
    console.log('🚀 「献立完成！」画面で献立生成開始...');
    console.log('📋 フォームデータ:', formData);
    
    try {
      // Groq API状態をチェック
      const apiStatus = checkMealGenerationStatus();
      console.log('🔍 Groq API状態:', apiStatus);
      
      // フォームデータをMealPreference型に変換
      const mealRequest: MealPreference = {
        ingredients: formData.ingredients || ['野菜', '肉類', '調味料'],
        servings: defaultServings,
        cookingTime: formData.cookingTime === 'unlimited' ? 'unlimited' : (formData.cookingTime || '45'),
        mealType: formData.mealType === 'breakfast' ? 'breakfast' as const :
                 formData.mealType === 'lunch' ? 'lunch' as const : 'dinner' as const,
        avoidIngredients: formData.avoidIngredients || [],
        allergies: formData.allergies || [],
        nutritionBalance: formData.nutritionBalance === 'protein' ? 'protein' :
                         formData.nutritionBalance === 'vegetable' ? 'vegetable' :
                         formData.nutritionBalance === 'light' ? 'light' : 'balanced',
        difficulty: 'medium' as const,
        dishCount: formData.dishCount || 3,
        budget: formData.budget === 'economy' ? 'economy' :
                formData.budget === 'premium' ? 'premium' : 'standard'
      };
      
      console.log('📡 Groq APIリクエスト詳細:', mealRequest);
      
      // **実際にAI統合システムを呼び出し**
      const { generateMealSuggestion: aiGenerateMealSuggestion } = await import('../../lib/meal-generation');
      const apiResponse = await aiGenerateMealSuggestion(mealRequest);
      
      console.log('📊 AI APIレスポンス:', {
        success: apiResponse.success,
        provider: apiResponse.provider,
        hasSuggestion: !!apiResponse.suggestion,
        error: apiResponse.error
      });
      
      if (apiResponse.success && apiResponse.suggestion) {
        // ✅ AI生成成功時の処理
        console.log('✅ AI献立生成成功!');
        
        // プロバイダー情報を追加
        const providerEmoji = apiResponse.provider === 'Gemini' ? '💎' : 
                             apiResponse.provider === 'Groq' ? '🚀' :
                             apiResponse.provider === 'OpenAI' ? '🧠' :
                             apiResponse.provider === 'Anthropic' ? '🤖' : '✨';
        
        apiResponse.suggestion.title = `${providerEmoji} ${apiResponse.suggestion.title}`;
        
        setMealSuggestion(apiResponse.suggestion);
        addToHistory(apiResponse.suggestion);
        console.log('🎉 AI献立設定完了!');
        
      } else {
        // ⚠️ Groq API失敗時の処理
        console.warn('⚠️ [結果画面] 初期AI生成失敗:', apiResponse.error);
        
        // APIが利用可能な場合は、代替プロバイダーで再試行
        const apiStatus = await checkMealGenerationStatus();
        if (apiStatus.groqApiAvailable || apiStatus.status === 'ready') {
          console.log('🔄 [結果画面] 代替プロバイダーで再試行...');
          try {
            const { generateMealSuggestion: altGenerateMealSuggestion } = await import('../../lib/meal-generation');
            const altResult = await altGenerateMealSuggestion(mealRequest, undefined); // auto選択
            
            if (altResult.success && altResult.suggestion) {
              console.log('✅ [結果画面] 代替プロバイダーで成功!');
              const altProviderEmoji = altResult.provider === 'Gemini' ? '💎' : 
                                     altResult.provider === 'Groq' ? '🚀' :
                                     altResult.provider === 'OpenAI' ? '🧠' :
                                     altResult.provider === 'Anthropic' ? '🤖' : '✨';
              
              altResult.suggestion.title = `${altProviderEmoji} ${altResult.suggestion.title}`;
              setMealSuggestion(altResult.suggestion);
              addToHistory(altResult.suggestion);
              return;
            }
          } catch (altError) {
            console.error('❌ [結果画面] 代替プロバイダーも失敗:', altError);
          }
        }
        
        // 最後の手段としてモックデータ
        console.warn('⚠️ [結果画面] 全てのAI試行が失敗、モックデータで代替');
        generateMockMealSuggestion();
      }
      
    } catch (error) {
      // ❌ エラー時はモックデータにフォールバック
      console.error('❌ [結果画面] 初期献立生成エラー:', error);
      generateMockMealSuggestion();
    } finally {
      setLoading(false);
      setIsRegenerating(false);
    }
  }, [formData, generateShoppingList, generateCookingSchedule, getMealTitle, getMealDescription, addToHistory, setLoading]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // モックデータでの献立生成（フォールバック用）
  const generateMockMealSuggestion = useCallback(() => {
    console.log('🎭 モックデータで献立生成（フォールバック）');
    
    const dishCount = formData.dishCount || 3;
    const patterns = mealPatterns[dishCount as keyof typeof mealPatterns] || mealPatterns[3];
    
    // ランダムにパターンを選択
    const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
    const selectedRecipes: Recipe[] = randomPattern.map(index => sampleRecipes[index]);

    // 総カロリーと調理時間を計算
    const totalCalories = selectedRecipes.reduce((sum, recipe) => sum + recipe.nutrition.calories, 0);
    // デフォルト設定の調理時間を使用
    const totalTime = defaultCookingTime === 'unlimited' ? 90 : parseInt(defaultCookingTime);

    // 買い物リストを生成
    const shoppingList = generateShoppingList(selectedRecipes);

    // 調理スケジュールを生成
    const cookingSchedule = generateCookingSchedule(selectedRecipes);

    const suggestion: MealSuggestion = {
      id: `mock-meal-${Date.now()}`,
      title: `🎭 ${getMealTitle()}`,
      description: `${getMealDescription()} (サンプル献立)`,
      recipes: selectedRecipes,
      totalTime,
      totalCalories,
      servings: defaultServings,
      tags: ['サンプル', formData.mealType || '夕食'],
      shoppingList,
      cookingSchedule,
      createdAt: new Date(),
    };

    setMealSuggestion(suggestion);
    addToHistory(suggestion);
  }, [formData.dishCount, formData.mealType, defaultServings, generateShoppingList, generateCookingSchedule, getMealTitle, getMealDescription, addToHistory]);

  useEffect(() => {
    console.log('🔍 結果画面: formDataチェック', {
      hasGeneratedSuggestion: !!formData.generatedSuggestion,
      generatedSuggestionTitle: formData.generatedSuggestion?.title,
      formData: formData
    });
    
    // AI生成済みの献立データがある場合はそれを使用
    if (formData.generatedSuggestion) {
      console.log('✅ AI生成済み献立データを使用:', formData.generatedSuggestion);
      setMealSuggestion(formData.generatedSuggestion);
      addToHistory(formData.generatedSuggestion);
      setIsRegenerating(false);
    } else {
      // フォームデータに基づいて献立を生成（新しいAI統合システムを使用）
      console.log('🔄 [結果画面] 初期献立を新しいAI統合システムで生成');
      
      // 初期生成のため、専用の処理を実行
      const initializeWithAI = async () => {
        setIsRegenerating(true);
        
        try {
          const { useApiKeyStore } = await import('../../lib/settings-store');
          const { generateMealSuggestion: aiGenerateMealSuggestion } = await import('../../lib/meal-generation');
          
          const apiKeyStore = useApiKeyStore.getState();
          const preferredProvider = apiKeyStore.getPreferredProvider('mealGeneration');
          
          const availableKeys = {
            groqApiKey: apiKeyStore.getApiKey('groqApiKey'),
            geminiApiKey: apiKeyStore.getApiKey('geminiApiKey'),
            openaiApiKey: apiKeyStore.getApiKey('openaiApiKey'),
            anthropicApiKey: apiKeyStore.getApiKey('anthropicApiKey'),
            huggingfaceApiKey: apiKeyStore.getApiKey('huggingfaceApiKey'),
            togetherApiKey: apiKeyStore.getApiKey('togetherApiKey'),
          };
          
          const hasAnyApiKey = Object.values(availableKeys).some(key => !!key);
          
          if (!hasAnyApiKey) {
            console.warn('⚠️ [結果画面-初期] APIキーが設定されていません。モックデータで生成します。');
            generateMockMealSuggestion();
            return;
          }
          
          // AI献立生成リクエスト構築
          const mealPreferences = {
            ingredients: formData.ingredients || ['野菜', '肉類', '調味料'],
            servings: defaultServings,
            cookingTime: formData.cookingTime === 'unlimited' ? '60' : (formData.cookingTime || '45'),
            mealType: formData.mealType || 'dinner',
            avoidIngredients: formData.avoidIngredients || [],
            allergies: formData.allergies || [],
            nutritionBalance: formData.nutritionBalance || 'balanced',
            difficulty: formData.difficulty || 'easy',
            dishCount: formData.dishCount || 3,
            budget: formData.budget || 'standard',
          };
          
          console.log('📡 [結果画面-初期] AI生成リクエスト:', mealPreferences);
          
          const result = await aiGenerateMealSuggestion(mealPreferences, preferredProvider);
          
          if (result.success && result.suggestion) {
            console.log('✅ [結果画面-初期] AI生成成功!');
            const providerEmoji = result.provider === 'Gemini' ? '💎' : 
                                 result.provider === 'Groq' ? '🚀' :
                                 result.provider === 'OpenAI' ? '🧠' :
                                 result.provider === 'Anthropic' ? '🤖' : '✨';
            
            result.suggestion.title = `${providerEmoji} ${result.suggestion.title}`;
            setMealSuggestion(result.suggestion);
            addToHistory(result.suggestion);
          } else {
            console.warn('⚠️ [結果画面-初期] AI生成失敗、モックデータで代替');
            generateMockMealSuggestion();
          }
          
        } catch (error) {
          console.error('❌ [結果画面-初期] 生成エラー:', error);
          generateMockMealSuggestion();
        } finally {
          setIsRegenerating(false);
        }
      };
      
      initializeWithAI();
    }
  }, [formData.generatedSuggestion, addToHistory, generateMockMealSuggestion, defaultServings, formData.ingredients, formData.cookingTime, formData.mealType, formData.avoidIngredients, formData.allergies, formData.nutritionBalance, formData.difficulty, formData.dishCount, formData.budget]);

  const handleToggleFavorite = () => {
    if (mealSuggestion) {
      toggleFavorite(mealSuggestion.id);
    }
  };

  const handleGoHome = () => {
    // ホームに戻る際にAI生成データをクリア
    clearGeneratedSuggestion();
    router.push('/');
  };


  const handleCreateNew = async () => {
    setIsRegenerating(true);
    // 現在の献立を一時的にクリア（新しいデータの強制表示）
    setMealSuggestion(null);
    // AI生成データもクリアして新しい生成を強制
    clearGeneratedSuggestion();
    console.log('🔄 [結果画面] 新しい献立を再生成中...', formData.ingredients);
    
    try {
      // APIキーと優先プロバイダーの状態を確認
      const { useApiKeyStore } = await import('../../lib/settings-store');
      const { generateMealSuggestion } = await import('../../lib/meal-generation');
      
      const apiKeyStore = useApiKeyStore.getState();
      const preferredProvider = apiKeyStore.getPreferredProvider('mealGeneration');
      
      const availableKeys = {
        groqApiKey: apiKeyStore.getApiKey('groqApiKey'),
        geminiApiKey: apiKeyStore.getApiKey('geminiApiKey'),
        openaiApiKey: apiKeyStore.getApiKey('openaiApiKey'),
        anthropicApiKey: apiKeyStore.getApiKey('anthropicApiKey'),
        huggingfaceApiKey: apiKeyStore.getApiKey('huggingfaceApiKey'),
        togetherApiKey: apiKeyStore.getApiKey('togetherApiKey'),
      };
      
      const hasAnyApiKey = Object.values(availableKeys).some(key => !!key);
      
      console.log('🔑 [結果画面] APIキー状態確認:', {
        preferredProvider: preferredProvider || 'auto',
        hasAnyApiKey,
        availableProviders: Object.entries(availableKeys)
          .filter(([_, key]) => !!key)
          .map(([provider, key]) => ({
            provider,
            keyLength: key.length,
            keyPreview: `${key.substring(0, 8)}...`
          })),
        timestamp: new Date().toISOString()
      });
      
      // キャッシュを回避するためのユニークID生成
      const requestId = `regenerate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const variationWords = [
        '別のアプローチで',
        '異なる調理法で', 
        '新しいスタイルで',
        '違う味付けで',
        '別の組み合わせで',
        'アレンジした',
        'ユニークな',
        '創作的な'
      ];
      const randomVariation = variationWords[Math.floor(Math.random() * variationWords.length)];
      
      if (!hasAnyApiKey) {
        console.warn('⚠️ [結果画面] APIキーが設定されていません。モックデータで再生成します。');
        generateMockMealSuggestion();
        return;
      }
      
      // 現在のフォームデータを新しいAI統合システム向けに変換（キャッシュ回避）
      const uniqueTimestamp = Date.now();
      const randomSeed = Math.floor(Math.random() * 10000);
      const cuisineStyles = ['和風', '洋風', '中華風', '創作', 'アジアン', '地中海風', '家庭料理風'];
      const cookingMethods = ['炒める', '煮る', '焼く', '蒸す', '揚げる', 'グリル', 'オーブン調理'];
      const seasonings = ['醤油ベース', 'みそベース', 'トマトベース', 'クリームベース', '和風だし', 'スパイス系'];
      
      const randomCuisine = cuisineStyles[Math.floor(Math.random() * cuisineStyles.length)];
      const randomMethod = cookingMethods[Math.floor(Math.random() * cookingMethods.length)];
      const randomSeasoning = seasonings[Math.floor(Math.random() * seasonings.length)];
      
      const mealPreferences = {
        ingredients: [
          ...(formData.ingredients || ['野菜', '肉類', '調味料']),
          `時刻${uniqueTimestamp}の新しい発想で`,
          `ランダムシード${randomSeed}`
        ],
        servings: defaultServings,
        cookingTime: formData.cookingTime === 'unlimited' ? '60' : (formData.cookingTime || '45'),
        mealType: formData.mealType || 'dinner',
        avoidIngredients: [
          ...(formData.avoidIngredients || []),
          `${randomVariation}料理を提案してください`,
          '前回とは全く違うレシピで',
          `${randomCuisine}テイストの`,
          `${randomMethod}を使った`,
          `${randomSeasoning}で`,
          `リクエストID: ${requestId}`,
          `生成時刻: ${new Date().toISOString()}`,
          '毎回異なる創作料理を',
          'オリジナリティ重視で'
        ],
        allergies: formData.allergies || [],
        nutritionBalance: formData.nutritionBalance || 'balanced',
        difficulty: formData.difficulty || 'easy',
        dishCount: formData.dishCount || 3,
        budget: formData.budget || 'standard',
      };
      
      console.log('📡 [結果画面] 新しい献立のAI統合APIリクエスト:', {
        mealPreferences,
        preferredProvider: preferredProvider || 'auto',
        requestId,
        randomVariation,
        randomCuisine,
        randomMethod,
        randomSeasoning,
        uniqueTimestamp,
        randomSeed,
        avoidIngredientsCount: mealPreferences.avoidIngredients.length,
        cacheBreakers: mealPreferences.avoidIngredients.filter(item => 
          item.includes('時刻') || item.includes('リクエストID') || item.includes('生成時刻')
        )
      });
      
      // **新しいAI統合システムで再生成**（キャッシュ回避のため短い待機）
      await new Promise(resolve => setTimeout(resolve, 500));
      const result = await generateMealSuggestion(mealPreferences, preferredProvider);
      
      console.log('📊 [結果画面] 新しい献立のAI統合APIレスポンス:', {
        success: result.success,
        provider: result.provider,
        hasError: !!result.error,
        error: result.error,
        hasSuggestion: !!result.suggestion,
        recipeCount: result.suggestion?.recipes?.length || 0
      });
      
      if (result.success && result.suggestion) {
        console.log(`✅ [結果画面] 新しい献立生成成功! プロバイダー: ${result.provider}`);
        
        // プロバイダー情報を献立タイトルに追加
        const providerEmoji = result.provider === 'Gemini' ? '💎' : 
                             result.provider === 'Groq' ? '🚀' :
                             result.provider === 'OpenAI' ? '🧠' :
                             result.provider === 'Anthropic' ? '🤖' : '✨';
        
        // AI生成済み献立データを使用して新しいタイトルを付与
        const newSuggestion = {
          ...result.suggestion,
          id: `regenerated-suggestion-${Date.now()}`,
          title: `${providerEmoji} ${randomVariation}${result.suggestion.title}`,
          description: `${result.suggestion.description} (${new Date().toLocaleTimeString()}再生成)`,
          createdAt: new Date(),
        };

        // 画面に新しい献立を反映
        setMealSuggestion(newSuggestion);
        
        // 履歴にも追加（任意）
        addToHistory(newSuggestion);
        
        console.log('🎉 [結果画面] 新しい献立を画面に反映完了:', {
          title: newSuggestion.title,
          provider: result.provider,
          recipeCount: newSuggestion.recipes.length
        });
        
      } else {
        console.warn('⚠️ [結果画面] AI生成失敗。詳細:', {
          error: result.error,
          provider: result.provider,
          hasApiKey: hasAnyApiKey
        });
        
        // APIキーがあるのに失敗した場合は、別のプロバイダーで再試行
        if (hasAnyApiKey) {
          console.log('🔄 [結果画面] 別のプロバイダーで再試行中...');
          try {
            // 代替プロバイダーで再試行（プロバイダーをnullにしてauto選択させる）
            const retryResult = await generateMealSuggestion(mealPreferences, undefined);
            if (retryResult.success && retryResult.suggestion) {
              console.log('✅ [結果画面] 再試行成功!');
              const retryProviderEmoji = retryResult.provider === 'Gemini' ? '💎' : 
                                       retryResult.provider === 'Groq' ? '🚀' :
                                       retryResult.provider === 'OpenAI' ? '🧠' :
                                       retryResult.provider === 'Anthropic' ? '🤖' : '✨';
              
              const retrySuggestion = {
                ...retryResult.suggestion,
                id: `retry-suggestion-${Date.now()}`,
                title: `${retryProviderEmoji} ${randomVariation}${retryResult.suggestion.title}`,
                description: `${retryResult.suggestion.description} (再試行成功)`,
                createdAt: new Date(),
              };
              
              setMealSuggestion(retrySuggestion);
              addToHistory(retrySuggestion);
              return;
            }
          } catch (retryError) {
            console.error('❌ [結果画面] 再試行も失敗:', retryError);
          }
        }
        
        // 最後の手段としてモックデータを使用
        console.warn('⚠️ [結果画面] 全てのAI試行が失敗、モックデータで代替');
        generateMockMealSuggestion();
      }
      
    } catch (error) {
      console.error('❌ [結果画面] 新しい献立生成エラー:', error);
      
      // エラーが発生した場合の処理
      console.warn('⚠️ [結果画面] エラーが発生。モックデータで代替します。');
      
      // エラー時はモックデータで代替
      generateMockMealSuggestion();
    } finally {
      setIsRegenerating(false);
    }
  };

  if ((isLoading || !mealSuggestion) && !isRegenerating) {
    return (
      <MobileLayout title="献立作成中" showBack={true}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-4"
            >
              <ChefHat className="w-16 h-16 text-pink-500" />
            </motion.div>
            <p className="text-gray-700 font-medium">美味しい献立を作成中...</p>
          </motion.div>
        </div>
      </MobileLayout>
    );
  }

  const isFavorite = mealSuggestion ? favorites.includes(mealSuggestion.id) : false;

  return (
    <MobileLayout title="献立完成！" showBack={true} showBottomNav={false}>
      <div className="px-4 py-6 space-y-6">
        <AnimatePresence mode="wait">
          {isRegenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center min-h-[60vh]"
            >
              <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 mx-auto mb-4"
                >
                  <RefreshCw className="w-16 h-16 text-pink-500" />
                </motion.div>
                <p className="text-gray-700 font-medium">新しい献立を考え中...</p>
                <p className="text-gray-600 text-sm mt-1">少々お待ちください</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* ヘッダー */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
              >
                <div className="text-6xl mb-4">🎉</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  {mealSuggestion?.title}
                </h1>
                <p className="text-gray-600">{mealSuggestion?.description}</p>
                
                {/* AI生成情報 */}
                {formData.generatedSuggestion && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
                    <span className="text-pink-600">🤖</span>
                    <span>AI生成</span>
                  </div>
                )}
                
                {/* タグ表示 */}
                {mealSuggestion?.tags && mealSuggestion.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 justify-center">
                    {mealSuggestion.tags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* サマリー情報 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl p-6 shadow-lg"
              >
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <Clock className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-lg font-bold">{mealSuggestion?.totalTime}分</p>
                    <p className="text-sm text-white/80">調理時間</p>
                  </div>
                  <button
                    onClick={() => router.push('/nutrition')}
                    className="hover:bg-white/10 rounded-xl p-2 transition-colors"
                  >
                    <Flame className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-lg font-bold">{mealSuggestion?.totalCalories}</p>
                    <p className="text-sm text-white/80">kcal</p>
                  </button>
                  <div>
                    <Users className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-lg font-bold">{defaultServings}人分</p>
                    <p className="text-sm text-white/80">分量</p>
                  </div>
                </div>
              </motion.div>

              {/* レシピ一覧 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-pink-500" />
                  今日の献立
                </h2>
                <div className="space-y-3">
                  {mealSuggestion?.recipes.map((recipe, index) => (
                    <motion.button
                      key={recipe.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      onClick={() => router.push(`/recipe/${recipe.id}`)}
                      className="w-full bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 text-left hover:bg-white/95 transition-all duration-200 active:scale-[0.98]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">{recipe.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {recipe.cookingTime}分
                            </span>
                            <span className="flex items-center gap-1">
                              <Flame className="w-4 h-4" />
                              {recipe.nutrition.calories}kcal
                            </span>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                              {recipe.difficulty === 'easy' ? '簡単' : recipe.difficulty === 'medium' ? '普通' : '上級'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-2xl">
                            {recipe.category === 'main' ? '🍖' : 
                             recipe.category === 'side' ? '🥬' : 
                             recipe.category === 'soup' ? '🍲' : '🍽️'}
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* 買い物リスト */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-green-500" />
                    買い物リスト
                  </h3>
                  <button
                    onClick={() => router.push('/shopping-list')}
                    className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1 hover:bg-green-50 px-2 py-1 rounded-lg transition-colors"
                  >
                    詳細
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mealSuggestion?.shoppingList.slice(0, 8).map((item, index) => (
                    <div key={index} className="flex items-center justify-between gap-2 text-sm min-w-0">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <CheckCircle2 className="w-4 h-4 text-gray-300 shrink-0" />
                        <span className="text-gray-700 truncate">{item.ingredient}</span>
                      </div>
                      <span className="text-gray-500 text-xs shrink-0">{item.amount}</span>
                    </div>
                  ))}
                </div>
                {(mealSuggestion?.shoppingList.length || 0) > 8 && (
                  <p className="text-center text-gray-500 text-sm mt-3">
                    他 {(mealSuggestion?.shoppingList.length || 0) - 8} 品
                  </p>
                )}
              </motion.div>

              {/* 調理スケジュール */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-pink-500" />
                    調理スケジュール
                  </h3>
                  <button
                    onClick={() => router.push('/cooking-schedule')}
                    className="text-pink-600 hover:text-pink-700 text-sm font-medium flex items-center gap-1 hover:bg-pink-50 px-2 py-1 rounded-lg transition-colors"
                  >
                    詳細
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {mealSuggestion?.cookingSchedule.slice(0, 6).map((schedule, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded text-xs font-mono shrink-0">
                          {schedule.time}
                        </span>
                        <span className="text-gray-700 flex-1 min-w-0 break-words">{schedule.task}</span>
                      </div>
                      <span className="text-gray-500 text-xs shrink-0 ml-12 sm:ml-0 truncate">
                        {schedule.recipeName}
                      </span>
                    </div>
                  ))}
                </div>
                {(mealSuggestion?.cookingSchedule.length || 0) > 6 && (
                  <p className="text-center text-gray-500 text-sm mt-3">
                    他 {(mealSuggestion?.cookingSchedule.length || 0) - 6} ステップ
                  </p>
                )}
              </motion.div>

              {/* アクションボタン */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                {/* お気に入り登録 */}
                <button
                  onClick={handleToggleFavorite}
                  className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-semibold transition-all duration-200 shadow-lg ${
                    isFavorite
                      ? 'bg-pink-500 text-white'
                      : 'bg-white/90 backdrop-blur-sm border-2 border-pink-500 text-pink-500 hover:bg-white'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                  <span>{isFavorite ? 'お気に入り登録済み' : 'お気に入りに登録'}</span>
                </button>

                {/* 新しい献立を作成 */}
                <button
                  onClick={handleCreateNew}
                  disabled={isRegenerating}
                  className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-semibold transition-all duration-200 shadow-lg ${
                    isRegenerating
                      ? 'bg-gray-200/90 backdrop-blur-sm text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 active:scale-95'
                  }`}
                >
                  <RefreshCw className={`w-5 h-5 ${isRegenerating ? 'animate-spin' : ''}`} />
                  <span>{isRegenerating ? '生成中...' : '他の献立を見る'}</span>
                </button>


                {/* ホームに戻る */}
                <button
                  onClick={handleGoHome}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-white/90 backdrop-blur-sm text-gray-700 font-semibold rounded-2xl hover:bg-white active:scale-95 transition-all duration-200 shadow-lg"
                >
                  <Home className="w-5 h-5" />
                  <span>ホームに戻る</span>
                </button>
              </motion.div>

              {/* 調理のヒント */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-br from-yellow-100/90 to-orange-100/90 backdrop-blur-sm border border-yellow-200/60 rounded-2xl p-4 shadow-lg"
              >
                <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  調理のコツ
                </h3>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>• 同時進行で効率よく調理しましょう</p>
                  <p>• 煮込み料理は最初に始めるのがおすすめ</p>
                  <p>• 野菜の下ごしらえは事前に済ませておくと楽です</p>
                </div>
              </motion.div>

              {/* 底部スペース - ボトムナビゲーション用 */}
              <div className="h-24 safe-area-inset"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}
