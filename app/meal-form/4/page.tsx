'use client';

import MobileLayout from '../../../components/layout/MobileLayout';
import StepProgress from '../../../components/ui/StepProgress';
import AvoidIngredientsStep from '../../../components/forms/AvoidIngredientsStep';

export default function Step4Page() {
  return (
    <MobileLayout title="避けたい食材" showBack={true} showBottomNav={false}>
      <StepProgress currentStep={4} totalSteps={7} />
      <AvoidIngredientsStep />
    </MobileLayout>
  );
}
