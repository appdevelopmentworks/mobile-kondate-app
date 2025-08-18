'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MobileLayout from '@/components/layout/MobileLayout';
import StepProgress from '@/components/ui/StepProgress';
import MealTypeStep from '@/components/forms/MealTypeStep';
import ServingsTimeStep from '@/components/forms/ServingsTimeStep';
import IngredientsStep from '@/components/forms/IngredientsStep';
import AvoidIngredientsStep from '@/components/forms/AvoidIngredientsStep';
import NutritionDifficultyStep from '@/components/forms/NutritionDifficultyStep';
import DishCountBudgetStep from '@/components/forms/DishCountBudgetStep';
import ConfirmStep from '@/components/forms/ConfirmStep';
import { formSteps } from '@/lib/form-steps';
import { useMealFormStore } from '@/lib/store';

export default function StepPage() {
  const router = useRouter();
  const params = useParams();
  const stepNumber = parseInt(params.step as string);
  const { currentStep, setStep } = useMealFormStore();
  
  useEffect(() => {
    if (stepNumber >= 1 && stepNumber <= 7) {
      setStep(stepNumber);
    } else {
      router.push('/meal-form');
    }
  }, [stepNumber, setStep, router]);
  
  const renderStepComponent = () => {
    switch (stepNumber) {
      case 1:
        return <MealTypeStep />;
      case 2:
        return <ServingsTimeStep />;
      case 3:
        return <IngredientsStep />;
      case 4:
        return <AvoidIngredientsStep />;
      case 5:
        return <NutritionDifficultyStep />;
      case 6:
        return <DishCountBudgetStep />;
      case 7:
        return <ConfirmStep />;
      default:
        return null;
    }
  };
  
  const currentStepData = formSteps.find(s => s.id === stepNumber);
  
  if (!currentStepData) {
    return null;
  }

  return (
    <MobileLayout 
      title={currentStepData.title}
      showBack={true}
      showBottomNav={false}
    >
      <StepProgress 
        currentStep={stepNumber}
        totalSteps={7}
        steps={formSteps.map(s => s.title)}
      />
      
      <div className="flex flex-col h-full">
        {renderStepComponent()}
      </div>
    </MobileLayout>
  );
}
