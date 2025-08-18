'use client';

import MobileLayout from '../../../components/layout/MobileLayout';
import StepProgress from '../../../components/ui/StepProgress';
import NutritionStep from '../../../components/forms/NutritionStep';

export default function Step5Page() {
  return (
    <MobileLayout title="栄養バランス" showBack={true} showBottomNav={false}>
      <StepProgress currentStep={5} totalSteps={7} />
      <NutritionStep />
    </MobileLayout>
  );
}
