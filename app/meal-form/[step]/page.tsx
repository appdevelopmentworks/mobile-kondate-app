'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import MobileLayout from '../../../components/layout/MobileLayout';
import StepProgress from '../../../components/ui/StepProgress';
import { useMealStore } from '../../../lib/store';
import MealTypeStep from '../../../components/forms/MealTypeStep';
import TimeStep from '../../../components/forms/TimeStep';
import IngredientsStep from '../../../components/forms/IngredientsStep';
import AvoidIngredientsStep from '../../../components/forms/AvoidIngredientsStep';
import NutritionStep from '../../../components/forms/NutritionStep';
import BudgetStep from '../../../components/forms/BudgetStep';
import ConfirmStep from '../../../components/forms/ConfirmStep';

const stepComponents = [
  { component: MealTypeStep, title: '食事の種類' },
  { component: TimeStep, title: '人数と時間' },
  { component: IngredientsStep, title: '使いたい食材' },
  { component: AvoidIngredientsStep, title: '避けたい食材' },
  { component: NutritionStep, title: '栄養バランス' },
  { component: BudgetStep, title: '品数と予算' },
  { component: ConfirmStep, title: '確認' },
];

export default function StepPage() {
  const params = useParams();
  const router = useRouter();
  const stepNumber = parseInt(params.step as string);
  const { currentStep, setStep } = useMealStore();

  useEffect(() => {
    if (stepNumber >= 1 && stepNumber <= 7) {
      setStep(stepNumber);
    } else {
      router.push('/meal-form/1');
    }
  }, [stepNumber, setStep, router]);

  if (stepNumber < 1 || stepNumber > 7) {
    return null;
  }

  const StepComponent = stepComponents[stepNumber - 1].component;
  const stepTitle = stepComponents[stepNumber - 1].title;

  return (
    <MobileLayout title={stepTitle} showBack={true} showBottomNav={false}>
      <StepProgress currentStep={stepNumber} totalSteps={7} />
      <StepComponent />
    </MobileLayout>
  );
}
