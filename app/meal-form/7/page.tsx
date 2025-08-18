'use client';

import MobileLayout from '../../../components/layout/MobileLayout';
import StepProgress from '../../../components/ui/StepProgress';
import ConfirmStep from '../../../components/forms/ConfirmStep';

export default function Step7Page() {
  return (
    <MobileLayout title="確認" showBack={true} showBottomNav={false}>
      <StepProgress currentStep={7} totalSteps={7} />
      <ConfirmStep />
    </MobileLayout>
  );
}
