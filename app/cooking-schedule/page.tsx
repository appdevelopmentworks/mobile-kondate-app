'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import MobileLayout from '../../components/layout/MobileLayout';
import { useMealStore } from '../../lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle2,
  Circle,
  ChefHat,
  Timer,
  FastForward,
  SkipForward,
  AlertCircle,
  Calendar,
  MapPin,
  Utensils
} from 'lucide-react';
import type { CookingScheduleItem, MealSuggestion } from '../../lib/types';

interface ExtendedScheduleItem extends CookingScheduleItem {
  id: string;
  isCompleted: boolean;
  isActive: boolean;
  estimatedDuration: number;
  actualStartTime?: Date;
  actualEndTime?: Date;
  notes?: string;
}

interface CookingTimer {
  isRunning: boolean;
  remainingTime: number;
  totalTime: number;
  scheduledEndTime?: Date;
}

export default function CookingSchedulePage() {
  const router = useRouter();
  const { history } = useMealStore();
  const [currentMeal, setCurrentMeal] = useState<MealSuggestion | null>(null);
  const [scheduleItems, setScheduleItems] = useState<ExtendedScheduleItem[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [globalTimer, setGlobalTimer] = useState<CookingTimer>({
    isRunning: false,
    remainingTime: 0,
    totalTime: 0
  });
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [showNotes, setShowNotes] = useState<Record<string, boolean>>({});

  // 初回読み込み時に最新の献立を取得
  useEffect(() => {
    if (history.length > 0) {
      const latestMeal = history[0];
      setCurrentMeal(latestMeal);
      
      if (latestMeal.cookingSchedule) {
        const extendedItems: ExtendedScheduleItem[] = latestMeal.cookingSchedule.map((item, index) => ({
          ...item,
          id: `schedule-${Date.now()}-${index}`,
          isCompleted: false,
          isActive: index === 0,
          estimatedDuration: 5, // デフォルト5分
          notes: ''
        }));
        setScheduleItems(extendedItems);
        
        // 全体の調理時間を設定
        setGlobalTimer({
          isRunning: false,
          remainingTime: latestMeal.totalTime * 60, // 分を秒に変換
          totalTime: latestMeal.totalTime * 60
        });
      }
    }
  }, [history]);

  // グローバルタイマー更新
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (globalTimer.isRunning && globalTimer.remainingTime > 0) {
      interval = setInterval(() => {
        setGlobalTimer(prev => ({
          ...prev,
          remainingTime: Math.max(0, prev.remainingTime - 1)
        }));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [globalTimer.isRunning, globalTimer.remainingTime]);

  // 調理開始
  const startCooking = useCallback(() => {
    setSessionStartTime(new Date());
    setGlobalTimer(prev => ({ ...prev, isRunning: true }));
  }, []);

  // 調理一時停止/再開
  const toggleTimer = useCallback(() => {
    setGlobalTimer(prev => ({ ...prev, isRunning: !prev.isRunning }));
  }, []);

  // 調理リセット
  const resetCooking = useCallback(() => {
    setSessionStartTime(null);
    setCurrentStep(0);
    setGlobalTimer(prev => ({
      ...prev,
      isRunning: false,
      remainingTime: prev.totalTime
    }));
    setScheduleItems(items => items.map(item => ({
      ...item,
      isCompleted: false,
      isActive: item === items[0]
    })));
  }, []);

  // ステップ完了
  const completeStep = useCallback((stepId: string) => {
    setScheduleItems(items => {
      const currentIndex = items.findIndex(item => item.id === stepId);
      if (currentIndex === -1) return items;

      const updatedItems = items.map((item, index) => {
        if (item.id === stepId) {
          return {
            ...item,
            isCompleted: true,
            isActive: false,
            actualEndTime: new Date()
          };
        }
        // 次のステップをアクティブにする
        if (index === currentIndex + 1) {
          return {
            ...item,
            isActive: true,
            actualStartTime: new Date()
          };
        }
        return item;
      });

      // 次のステップインデックスを更新
      const nextStep = currentIndex + 1;
      if (nextStep < items.length) {
        setCurrentStep(nextStep);
      }

      return updatedItems;
    });
  }, []);

  // ステップスキップ
  const skipStep = useCallback((stepId: string) => {
    completeStep(stepId);
  }, [completeStep]);

  // ノート追加
  const addNote = useCallback((stepId: string, note: string) => {
    setScheduleItems(items => items.map(item => 
      item.id === stepId ? { ...item, notes: note } : item
    ));
  }, []);

  // 時間フォーマット
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // 進捗計算
  const completedSteps = scheduleItems.filter(item => item.isCompleted).length;
  const progressPercentage = scheduleItems.length > 0 ? (completedSteps / scheduleItems.length) * 100 : 0;

  // 現在のアクティブステップ
  const activeStep = scheduleItems.find(item => item.isActive);

  return (
    <MobileLayout title="調理スケジュール" showBack>
      <div className="px-4 py-6 space-y-6">
        {/* ヘッダー統計 */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <ChefHat className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">{currentMeal?.title || '調理スケジュール'}</h2>
              <p className="text-orange-100">効率よく調理を進めましょう</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{completedSteps}</div>
                <div className="text-sm text-orange-100">完了</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{scheduleItems.length - completedSteps}</div>
                <div className="text-sm text-orange-100">残り</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatTime(globalTimer.remainingTime)}</div>
                <div className="text-sm text-orange-100">残り時間</div>
              </div>
            </div>
          </div>

          {/* 進捗バー */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-orange-100">進捗</span>
              <span className="text-sm text-orange-100">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <motion.div 
                className="bg-white h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* タイマー制御 */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Timer className="w-6 h-6 text-orange-500" />
              <div>
                <h3 className="font-semibold text-gray-800">調理タイマー</h3>
                <p className="text-sm text-gray-600">
                  {sessionStartTime 
                    ? `開始: ${sessionStartTime.toLocaleTimeString()}`
                    : '調理を開始してタイマーをスタート'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!sessionStartTime ? (
                <button
                  onClick={startCooking}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  開始
                </button>
              ) : (
                <>
                  <button
                    onClick={toggleTimer}
                    className={`p-2 rounded-xl transition-colors ${
                      globalTimer.isRunning
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {globalTimer.isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={resetCooking}
                    className="p-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 現在のアクティブステップ */}
        {activeStep && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 text-white"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2">現在のステップ</h3>
                <p className="text-blue-100 mb-3">{activeStep.task}</p>
                <div className="flex items-center gap-2 text-sm text-blue-100">
                  <MapPin className="w-4 h-4" />
                  <span>{activeStep.recipeName}</span>
                  <Clock className="w-4 h-4 ml-2" />
                  <span>{activeStep.time}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => completeStep(activeStep.id)}
                className="flex-1 py-2 px-4 bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                完了
              </button>
              <button
                onClick={() => skipStep(activeStep.id)}
                className="flex-1 py-2 px-4 bg-white/10 backdrop-blur-sm rounded-xl text-sm font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
              >
                <SkipForward className="w-4 h-4" />
                スキップ
              </button>
            </div>
          </motion.div>
        )}

        {/* スケジュール一覧 */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            調理手順
          </h3>
          
          <AnimatePresence>
            {scheduleItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-2xl shadow-lg p-4 border-2 transition-all duration-200 ${
                  item.isCompleted
                    ? 'bg-green-50 border-green-200'
                    : item.isActive
                    ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-100'
                    : 'bg-white/95 backdrop-blur-sm border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 pt-1">
                    {item.isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : item.isActive ? (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Circle className="w-6 h-6 text-blue-500" />
                      </motion.div>
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-mono ${
                        item.isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {item.time}
                      </span>
                      <span className="text-xs text-gray-500">{item.recipeName}</span>
                      {item.isActive && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                          実行中
                        </span>
                      )}
                    </div>
                    
                    <p className={`text-sm ${
                      item.isCompleted ? 'text-gray-500 line-through' : 'text-gray-700'
                    }`}>
                      {item.task}
                    </p>

                    {/* 実行時間 */}
                    {(item.actualStartTime || item.actualEndTime) && (
                      <div className="mt-2 text-xs text-gray-500">
                        {item.actualStartTime && (
                          <span>
                            開始: {item.actualStartTime.toLocaleTimeString()}
                          </span>
                        )}
                        {item.actualEndTime && (
                          <span className="ml-2">
                            完了: {item.actualEndTime.toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    )}

                    {/* ノート */}
                    {item.notes && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs text-yellow-800">{item.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* アクション */}
                  <div className="flex flex-col gap-1">
                    {!item.isCompleted && !item.isActive && (
                      <button
                        onClick={() => {
                          // このステップをアクティブにする
                          setScheduleItems(items => items.map((itm, idx) => ({
                            ...itm,
                            isActive: itm.id === item.id,
                            actualStartTime: itm.id === item.id ? new Date() : itm.actualStartTime
                          })));
                          setCurrentStep(index);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <FastForward className="w-4 h-4" />
                      </button>
                    )}
                    
                    {(item.isActive || item.isCompleted) && (
                      <button
                        onClick={() => setShowNotes(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                        className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <AlertCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* ノート入力エリア */}
                {showNotes[item.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-gray-200"
                  >
                    <textarea
                      placeholder="メモを追加（調理のコツ、次回への改善点など）"
                      value={item.notes || ''}
                      onChange={(e) => addNote(item.id, e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:border-orange-500 focus:outline-none resize-none"
                      rows={2}
                    />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* 完了メッセージ */}
        {completedSteps === scheduleItems.length && scheduleItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl p-8 text-white"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">調理完了！</h2>
            <p className="text-green-100 mb-6">お疲れさまでした。美味しい食事をお楽しみください！</p>
            <button
              onClick={() => router.push('/result')}
              className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-medium hover:bg-white/30 transition-colors"
            >
              献立詳細に戻る
            </button>
          </motion.div>
        )}
      </div>
    </MobileLayout>
  );
}