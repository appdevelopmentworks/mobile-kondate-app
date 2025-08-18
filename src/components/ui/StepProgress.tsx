'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  steps?: string[];
}

export default function StepProgress({ 
  currentStep, 
  totalSteps, 
  steps = [] 
}: StepProgressProps) {
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
  
  return (
    <div className="px-4 py-4 bg-white border-b border-gray-100">
      {/* プログレスバー */}
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </div>
      
      {/* ステップインジケーター */}
      <div className="flex justify-between items-center">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <div
            key={step}
            className="flex flex-col items-center flex-1"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ 
                scale: step === currentStep ? 1.1 : 1,
                backgroundColor: 
                  step < currentStep ? '#10b981' :
                  step === currentStep ? '#10b981' :
                  '#e5e7eb'
              }}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm
                ${step <= currentStep ? 'bg-primary-500' : 'bg-gray-300'}
              `}
            >
              {step < currentStep ? (
                <Check className="w-4 h-4" />
              ) : (
                step
              )}
            </motion.div>
            
            {steps[step - 1] && (
              <span className={`
                text-xs mt-1 text-center
                ${step === currentStep ? 'text-gray-900 font-medium' : 'text-gray-500'}
                ${step < 3 || step > totalSteps - 2 || step === currentStep ? 'block' : 'hidden sm:block'}
              `}>
                {steps[step - 1]}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
