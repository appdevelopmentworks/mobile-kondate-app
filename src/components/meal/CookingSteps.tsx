'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import Card from '@/components/ui/Card';
import { Recipe, CookingScheduleItem } from '@/lib/types';
import { formatCookingTime } from '@/lib/utils';

interface CookingStepsProps {
  recipes: Recipe[];
  schedule: CookingScheduleItem[];
}

export default function CookingSteps({ recipes, schedule }: CookingStepsProps) {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [activeRecipe, setActiveRecipe] = useState<string | null>(null);
  
  const toggleStep = (stepId: string) => {
    if (completedSteps.includes(stepId)) {
      setCompletedSteps(completedSteps.filter(id => id !== stepId));
    } else {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };
  
  const getRecipeSteps = (recipeName: string) => {
    const recipe = recipes.find(r => r.name === recipeName);
    return recipe?.steps || [];
  };
  
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
    },
  };

  return (
    <div>
      {/* タイムライン表示 */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">調理スケジュール</h3>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {schedule.map((item, index) => {
            const stepId = `${item.recipeName}-${index}`;
            const isCompleted = completedSteps.includes(stepId);
            
            return (
              <motion.div
                key={stepId}
                variants={itemVariants}
              >
                <Card
                  className={`p-4 ${isCompleted ? 'bg-gray-50' : ''}`}
                  onClick={() => toggleStep(stepId)}
                >
                  <div className="flex items-start">
                    <button
                      className="mr-3 mt-0.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStep(stepId);
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <span className="text-sm font-medium text-primary-600 mr-2">
                          {item.time}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({item.duration}分)
                        </span>
                      </div>
                      
                      <p className={`text-gray-900 mb-1 ${
                        isCompleted ? 'line-through opacity-60' : ''
                      }`}>
                        {item.task}
                      </p>
                      
                      <span className="inline-block px-2 py-1 rounded-full bg-primary-100 text-primary-700 text-xs">
                        {item.recipeName}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
      
      {/* レシピ別手順 */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">レシピ別の手順</h3>
        
        <div className="space-y-3">
          {recipes.map((recipe) => (
            <Card
              key={recipe.id}
              className="overflow-hidden"
            >
              <button
                onClick={() => setActiveRecipe(
                  activeRecipe === recipe.id ? null : recipe.id
                )}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {recipe.name}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {formatCookingTime(recipe.cookingTime)}
                      <span className="ml-3">
                        {recipe.steps.length}ステップ
                      </span>
                    </p>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      activeRecipe === recipe.id ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </button>
              
              {activeRecipe === recipe.id && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 pb-4 border-t border-gray-100"
                >
                  <div className="space-y-3 mt-4">
                    {recipe.steps.map((step) => {
                      const stepId = `detail-${recipe.id}-${step.stepNumber}`;
                      const isCompleted = completedSteps.includes(stepId);
                      
                      return (
                        <div
                          key={step.stepNumber}
                          className="flex items-start"
                        >
                          <button
                            onClick={() => toggleStep(stepId)}
                            className="mr-3 mt-0.5"
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
                                {step.stepNumber}
                              </div>
                            )}
                          </button>
                          
                          <div className="flex-1">
                            <p className={`text-sm text-gray-800 ${
                              isCompleted ? 'line-through opacity-60' : ''
                            }`}>
                              {step.description}
                            </p>
                            
                            {step.duration && (
                              <p className="text-xs text-gray-500 mt-1">
                                約{step.duration}分
                              </p>
                            )}
                            
                            {step.tip && (
                              <div className="mt-2 p-2 bg-yellow-50 rounded-lg">
                                <p className="text-xs text-yellow-800">
                                  💡 {step.tip}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </Card>
          ))}
        </div>
      </div>
      
      {/* 進捗表示 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              進捗状況
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {completedSteps.length} / {schedule.length} ステップ完了
            </p>
          </div>
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#10b981"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(completedSteps.length / schedule.length) * 176} 176`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-900">
                {Math.round((completedSteps.length / schedule.length) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
