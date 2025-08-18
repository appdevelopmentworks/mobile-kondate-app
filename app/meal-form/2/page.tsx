'use client';

import MobileLayout from '../../../components/layout/MobileLayout';
import StepProgress from '../../../components/ui/StepProgress';
import TimeStep from '../../../components/forms/TimeStep';

export default function Step2Page() {
  return (
    <MobileLayout title="人数と時間" showBack={true} showBottomNav={false}>
      <StepProgress currentStep={2} totalSteps={7} />
      <TimeStep />
    </MobileLayout>
  );
}
