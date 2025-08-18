'use client';

import MobileLayout from '../../../components/layout/MobileLayout';
import StepProgress from '../../../components/ui/StepProgress';
import IngredientsStep from '../../../components/forms/IngredientsStep';

export default function Step3Page() {
  return (
    <MobileLayout title="使いたい食材" showBack={true} showBottomNav={false}>
      <StepProgress currentStep={3} totalSteps={7} />
      <IngredientsStep />
    </MobileLayout>
  );
}
