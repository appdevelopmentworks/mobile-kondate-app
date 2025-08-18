'use client';

import MobileLayout from '../../../components/layout/MobileLayout';
import StepProgress from '../../../components/ui/StepProgress';
import BudgetStep from '../../../components/forms/BudgetStep';

export default function Step6Page() {
  return (
    <MobileLayout title="品数と予算" showBack={true} showBottomNav={false}>
      <StepProgress currentStep={6} totalSteps={7} />
      <BudgetStep />
    </MobileLayout>
  );
}
