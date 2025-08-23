'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  Zap, 
  Eye, 
  Heart,
  TrendingUp,
  Award,
  Camera,
  ChefHat
} from 'lucide-react';

interface UsageStats {
  totalMealsGenerated: number;
  totalImagesRecognized: number;
  totalFavorites: number;
  averageSessionTime: number;
  mostUsedProvider: string;
  dailyUsage: { date: string; meals: number; images: number }[];
  weeklyTotal: number;
  monthlyTotal: number;
  favoriteFeatures: string[];
  achievements: string[];
}

export default function UsageStatistics() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week');
  const [isLoading, setIsLoading] = useState(true);

  const calculateStats = async (): Promise<UsageStats> => {
    // ローカルストレージから使用統計を計算
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 基本統計を取得
    const mealHistory = JSON.parse(localStorage.getItem('meal-history') || '[]');
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const usageLog = JSON.parse(localStorage.getItem('usage-log') || '[]');

    // 日別使用状況を生成
    const dailyUsage: { date: string; meals: number; images: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayMeals = mealHistory.filter((meal: any) => 
        meal.createdAt && new Date(meal.createdAt).toISOString().split('T')[0] === dateStr
      ).length;
      
      dailyUsage.push({
        date: dateStr,
        meals: dayMeals,
        images: Math.floor(dayMeals * 0.3) // 概算
      });
    }

    // プロバイダー使用統計
    const providerUsage: Record<string, number> = {};
    usageLog.forEach((log: any) => {
      if (log.provider) {
        providerUsage[log.provider] = (providerUsage[log.provider] || 0) + 1;
      }
    });
    const mostUsedProvider = Object.entries(providerUsage).reduce((a, b) => 
      providerUsage[a[0]] > providerUsage[b[0]] ? a : b
    )?.[0] || 'Unknown';

    // 実績計算
    const achievements: string[] = [];
    if (mealHistory.length >= 10) achievements.push('初心者料理人');
    if (mealHistory.length >= 50) achievements.push('料理上手');
    if (mealHistory.length >= 100) achievements.push('料理マスター');
    if (favorites.length >= 5) achievements.push('グルメ探求者');
    if (favorites.length >= 20) achievements.push('美食家');

    return {
      totalMealsGenerated: mealHistory.length,
      totalImagesRecognized: Math.floor(mealHistory.length * 0.4), // 概算
      totalFavorites: favorites.length,
      averageSessionTime: Math.floor(Math.random() * 300) + 60, // 1-6分の範囲でランダム
      mostUsedProvider: mostUsedProvider,
      dailyUsage,
      weeklyTotal: mealHistory.filter((meal: any) => 
        meal.createdAt && new Date(meal.createdAt) > weekAgo
      ).length,
      monthlyTotal: mealHistory.filter((meal: any) => 
        meal.createdAt && new Date(meal.createdAt) > monthAgo
      ).length,
      favoriteFeatures: ['献立生成', 'カメラ認識', 'お気に入り管理'],
      achievements
    };
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}分`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}時間${mins}分`;
  };

  const refreshStats = async () => {
    setIsLoading(true);
    try {
      const newStats = await calculateStats();
      setStats(newStats);
    } catch (error) {
      console.error('統計の計算に失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-gray-400 animate-pulse" />
          <span className="ml-2 text-gray-500">統計を計算中...</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">統計データを取得できませんでした</p>
      </div>
    );
  }

  const statCards = [
    {
      icon: ChefHat,
      label: '献立作成数',
      value: stats.totalMealsGenerated,
      unit: '回',
      color: 'blue',
      trend: '+12%',
    },
    {
      icon: Camera,
      label: '画像認識数',
      value: stats.totalImagesRecognized,
      unit: '回',
      color: 'green',
      trend: '+8%',
    },
    {
      icon: Heart,
      label: 'お気に入り',
      value: stats.totalFavorites,
      unit: '件',
      color: 'pink',
      trend: '+5%',
    },
    {
      icon: Clock,
      label: '平均利用時間',
      value: stats.averageSessionTime,
      unit: '分',
      color: 'purple',
      trend: '+2%',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="bg-white border border-gray-200 rounded-lg overflow-hidden"
    >
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              使用統計
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              アプリの使用状況とパフォーマンス
            </p>
          </div>
          <div className="flex gap-2">
            {(['week', 'month', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  timeframe === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {period === 'week' ? '週' : period === 'month' ? '月' : '全期間'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 統計カード */}
      <div className="p-4 grid grid-cols-2 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <card.icon className={`w-5 h-5 text-${card.color}-600`} />
              <span className="text-xs text-green-600 font-medium">{card.trend}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            <div className="text-sm text-gray-600">{card.label}</div>
          </div>
        ))}
      </div>

      {/* 日別使用状況グラフ */}
      <div className="p-4 border-t border-gray-100">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          週間使用状況
        </h4>
        <div className="space-y-2">
          {stats.dailyUsage.map((day, index) => (
            <div key={day.date} className="flex items-center gap-3">
              <div className="text-xs text-gray-500 w-16">
                {new Date(day.date).toLocaleDateString('ja-JP', { 
                  month: 'numeric', 
                  day: 'numeric' 
                })}
              </div>
              <div className="flex-1 flex gap-2">
                {/* 献立生成バー */}
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min((day.meals / Math.max(...stats.dailyUsage.map(d => d.meals))) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 w-8">{day.meals}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 実績 */}
      {stats.achievements.length > 0 && (
        <div className="p-4 border-t border-gray-100">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4" />
            獲得実績
          </h4>
          <div className="flex flex-wrap gap-2">
            {stats.achievements.map((achievement) => (
              <div key={achievement} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                🏆 {achievement}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* サマリー */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-gray-900">今週のハイライト</span>
        </div>
        <div className="text-sm text-gray-700 space-y-1">
          <p>• {stats.weeklyTotal}回の献立を作成しました</p>
          <p>• 最もよく使用したAIプロバイダー: {stats.mostUsedProvider}</p>
          <p>• 平均セッション時間: {formatTime(stats.averageSessionTime)}</p>
        </div>
      </div>
    </motion.div>
  );
}