'use client';

import MobileLayout from '../../../components/layout/MobileLayout';
import StepProgress from '../../../components/ui/StepProgress';
import MealTypeStep from '../../../components/forms/MealTypeStep';

export default function Step1Page() {
  return (
    <MobileLayout title="食事の種類" showBack={true} showBottomNav={false}>
      <StepProgress currentStep={1} totalSteps={7} />
      <MealTypeStep />
    </MobileLayout>
  );
}
