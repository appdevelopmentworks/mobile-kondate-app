'use client';

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function StepProgress({ currentStep, totalSteps }: StepProgressProps) {
  return (
    <div className="px-4 py-3 bg-white/95 backdrop-blur-sm border-b border-white/30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          ステップ {currentStep} / {totalSteps}
        </span>
        <span className="text-sm text-gray-600">
          {Math.round((currentStep / totalSteps) * 100)}%
        </span>
      </div>
      
      <div className="relative">
        <div className="h-2 bg-white/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-600 to-rose-600 transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
        
        <div className="flex justify-between mt-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`step-dot ${
                i + 1 < currentStep
                  ? 'step-dot-completed'
                  : i + 1 === currentStep
                  ? 'step-dot-active'
                  : ''
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
