'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileLayout from '@/components/layout/MobileLayout';
import { motion } from 'framer-motion';
import { 
  ChefHat, 
  Camera, 
  Sparkles, 
  Clock, 
  Heart,
  TrendingUp,
  Calendar,
  Sun,
  Cloud,
  CloudRain,
  Snowflake,
  Star
} from 'lucide-react';
import { useMealFormStore } from '@/lib/store';
import { getCurrentSeason, formatCookingTime } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();
  const { history, favorites } = useMealFormStore();
  const [greeting, setGreeting] = useState('');
  const [weather, setWeather] = useState<'sunny' | 'cloudy' | 'rainy' | 'snowy'>('sunny');
  
  useEffect(() => {
    // 時間帯に応じた挨拶
    const hour = new Date().getHours();
    if (hour < 10) {
      setGreeting('おはようございます');
    } else if (hour < 17) {
      setGreeting('こんにちは');
    } else {
      setGreeting('こんばんは');
    }
    
    // 季節に応じた天気アイコン（ダミー）
    const season = getCurrentSeason();
    if (season === '冬') setWeather('snowy');
    else if (season === '梅雨') setWeather('rainy');
    else if (Math.random() > 0.5) setWeather('sunny');
    else setWeather('cloudy');
  }, []);
  
  const weatherIcon = {
    sunny: Sun,
    cloudy: Cloud,
    rainy: CloudRain,
    snowy: Snowflake,
  }[weather];
  
  const WeatherIcon = weatherIcon;
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  const floatingVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <MobileLayout title="献立アプリ" showMenu={true}>
      <div className="px-4 py-6 bg-pattern-hearts min-h-screen">
        {/* キラキラ装飾 */}
        <div className="absolute top-20 right-8 text-2xl animate-bounce-in">✨</div>
        <div className="absolute top-32 left-8 text-xl animate-bounce-in delay-300">💕</div>
        <div className="absolute top-48 right-12 text-lg animate-bounce-in delay-500">🌸</div>
        
        {/* グリーティングセクション */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 relative"
        >
          <div className="card-glass text-center p-6">
            <div className="flex items-center justify-center mb-3">
              <motion.div
                variants={floatingVariants}
                animate="animate"
                className="mr-3"
              >
                <WeatherIcon className="w-10 h-10 text-cream-400" />
              </motion.div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-lavender-600 bg-clip-text text-transparent">
                {greeting}！
              </h1>
              <motion.div
                variants={floatingVariants}
                animate="animate"
                className="ml-3"
              >
                <Star className="w-8 h-8 text-primary-400 heartbeat" />
              </motion.div>
            </div>
            <p className="text-gray-600 font-medium">
              今日の美味しい献立を一緒に見つけましょう 🍽️
            </p>
          </div>
        </motion.div>
        
        {/* メインアクションボタン */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-5 mb-8"
        >
          {/* 条件入力ボタン */}
          <motion.button
            variants={itemVariants}
            onClick={() => router.push('/meal-form')}
            className="w-full text-white rounded-extra-cute p-6 shadow-cute-lg press-cute relative overflow-hidden"
            style={{backgroundColor: '#da70d6'}}
          >
            <div className="absolute top-2 right-2 text-2xl animate-pulse">🌟</div>
            <div className="flex items-center justify-between relative z-10">
              <div className="text-left">
                <div className="flex items-center mb-2">
                  <ChefHat className="w-7 h-7 mr-3" />
                  <span className="text-xl font-bold">条件を入力して作成</span>
                </div>
                <p className="text-sm text-white/90">
                  食材や時間から最適な献立を提案します 💝
                </p>
              </div>
              <div className="text-4xl animate-bounce">🍳</div>
            </div>
          </motion.button>
          
          {/* おまかせボタン */}
          <motion.button
            variants={itemVariants}
            onClick={() => router.push('/meal-form/quick')}
            className="w-full text-white rounded-extra-cute p-6 shadow-lavender press-cute relative overflow-hidden"
            style={{backgroundColor: '#da70d6'}}
          >
            <div className="absolute top-2 right-2 text-2xl animate-pulse delay-500">✨</div>
            <div className="flex items-center justify-between relative z-10">
              <div className="text-left">
                <div className="flex items-center mb-2">
                  <Sparkles className="w-7 h-7 mr-3" />
                  <span className="text-xl font-bold">おまかせで作成</span>
                </div>
                <p className="text-sm text-white/90">
                  季節の食材でおすすめ献立をお届け 🌺
                </p>
              </div>
              <div className="text-4xl animate-bounce delay-200">🎀</div>
            </div>
          </motion.button>
          
          {/* カメラボタン */}
          <motion.button
            variants={itemVariants}
            onClick={() => router.push('/camera')}
            className="w-full text-white rounded-extra-cute p-6 shadow-mint press-cute relative overflow-hidden opacity-75"
            style={{backgroundColor: '#da70d6'}}
            disabled
          >
            <div className="absolute top-2 right-2 text-2xl animate-pulse delay-1000">🎉</div>
            <div className="flex items-center justify-between relative z-10">
              <div className="text-left">
                <div className="flex items-center mb-2">
                  <Camera className="w-7 h-7 mr-3" />
                  <span className="text-xl font-bold">カメラで食材認識</span>
                </div>
                <p className="text-sm text-white/90">
                  冷蔵庫の中身から献立提案（近日公開）🔮
                </p>
              </div>
              <div className="text-4xl animate-bounce delay-400">📸</div>
            </div>
          </motion.button>
        </motion.div>
        
        {/* クイックアクセスセクション */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-lavender-600 bg-clip-text text-transparent mb-4 text-center">
            ✨ クイックアクセス ✨
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            {/* 最近の献立 */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/history')}
              className="card-cute text-center hover-cute"
            >
              <Clock className="w-10 h-10 text-primary-500 mb-3 mx-auto animate-float" />
              <p className="text-sm font-bold text-gray-800 mb-1">履歴</p>
              <div className="flex items-center justify-center">
                <p className="text-xs text-primary-600 font-medium">
                  {history.length > 0 ? `${history.length}件` : 'まだありません'}
                </p>
                <span className="ml-1 text-xs">📋</span>
              </div>
            </motion.button>
            
            {/* お気に入り */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/favorites')}
              className="card-cute text-center hover-cute relative"
            >
              <Heart className="w-10 h-10 text-rose-500 mb-3 mx-auto heartbeat" />
              <p className="text-sm font-bold text-gray-800 mb-1">お気に入り</p>
              <div className="flex items-center justify-center">
                <p className="text-xs text-rose-600 font-medium">
                  {favorites.length > 0 ? `${favorites.length}件` : 'まだありません'}
                </p>
                <span className="ml-1 text-xs">💕</span>
              </div>
            </motion.button>
            
            {/* 今週の人気 */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/trending')}
              className="card-cute text-center hover-cute opacity-75"
              disabled
            >
              <TrendingUp className="w-10 h-10 text-mint-500 mb-3 mx-auto animate-float delay-200" />
              <p className="text-sm font-bold text-gray-800 mb-1">人気</p>
              <div className="flex items-center justify-center">
                <p className="text-xs text-mint-600 font-medium">今週の人気献立</p>
                <span className="ml-1 text-xs">🔥</span>
              </div>
            </motion.button>
            
            {/* カレンダー */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/calendar')}
              className="card-cute text-center hover-cute opacity-75"
              disabled
            >
              <Calendar className="w-10 h-10 text-lavender-500 mb-3 mx-auto animate-float delay-400" />
              <p className="text-sm font-bold text-gray-800 mb-1">カレンダー</p>
              <div className="flex items-center justify-center">
                <p className="text-xs text-lavender-600 font-medium">献立計画</p>
                <span className="ml-1 text-xs">📅</span>
              </div>
            </motion.button>
          </div>
        </motion.div>
        
        {/* 最近作った献立 */}
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card-glass p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-lavender-600 bg-clip-text text-transparent">
                💖 最近の献立
              </h2>
              <button
                onClick={() => router.push('/history')}
                className="text-sm text-primary-500 font-bold bg-primary-50 px-3 py-1 rounded-full hover-cute"
              >
                すべて見る ✨
              </button>
            </div>
            
            <div className="space-y-3">
              {history.slice(0, 3).map((meal, index) => (
                <motion.button
                  key={meal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  onClick={() => router.push(`/result?id=${meal.id}`)}
                  className="w-full bg-gradient-to-r from-white/80 to-primary-50/80 backdrop-blur-sm rounded-cute p-4 shadow-cute-soft border border-primary-100 text-left press-cute hover-cute"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 mb-1 flex items-center">
                        <span className="mr-2">🍽️</span>
                        {meal.title}
                      </p>
                      <p className="text-xs text-gray-600">
                        {meal.recipes.map(r => r.name).join('、')}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xs text-primary-600 font-medium">
                        ⏰ {formatCookingTime(meal.totalCookingTime)}
                      </p>
                      <p className="text-xs text-rose-600 font-medium">
                        🔥 {meal.totalCalories}kcal
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* 空の状態（履歴がない場合） */}
        {history.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card-glass text-center p-8"
          >
            <div className="text-6xl mb-4 animate-bounce">🍱</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              初めての献立を作ってみましょう！
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              上のボタンから献立作成を始められます
            </p>
            <button
              onClick={() => router.push('/meal-form')}
              className="btn-cute btn-primary-cute"
            >
              今すぐ始める ✨
            </button>
          </motion.div>
        )}
      </div>
    </MobileLayout>
  );
}
