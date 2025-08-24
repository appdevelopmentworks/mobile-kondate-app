'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImprovedCameraComponent from '@/components/camera/ImprovedCameraComponent';
import MobileLayout from '@/components/layout/MobileLayout';

export default function CameraFoodRecognitionPage() {
  console.log('📸 改善されたカメラ食材認識ページにアクセスしました');
  const router = useRouter();
  const [isCameraOpen, setIsCameraOpen] = useState(true);

  const handleIngredientsRecognized = (ingredientsOrImageData: string[] | string) => {
    console.log('✅ 食材認識完了:', ingredientsOrImageData);
    
    // 画像データの場合は、カメラ認識画面に遷移
    if (typeof ingredientsOrImageData === 'string') {
      router.push('/camera-recognition');
    } else {
      // 文字列配列の場合は、食材選択ページに送る
      const recognizedIngredients = ingredientsOrImageData;
      if (recognizedIngredients.length > 0) {
        const ingredientsParam = encodeURIComponent(recognizedIngredients.join(','));
        router.push(`/ingredients?ingredients=${ingredientsParam}`);
      } else {
        router.push('/');
      }
    }
  };

  const handleClose = () => {
    router.push('/');
  };

  return (
    <>
      {/* 背景表示（カメラが開いている間は非表示） */}
      {!isCameraOpen && (
        <MobileLayout title="食材認識">
          <div className="h-full bg-gray-100 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">📸</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                カメラで食材認識
              </h2>
              <p className="text-gray-600 text-sm">
                改善されたAI認識で、より高精度に食材を識別します
              </p>
            </div>
          </div>
        </MobileLayout>
      )}
      
      {/* 改善されたカメラコンポーネント */}
      <ImprovedCameraComponent
        isOpen={isCameraOpen}
        onIngredientsRecognized={handleIngredientsRecognized}
        onClose={handleClose}
        showTutorial={false} // このページでは直接カメラ開始
      />
    </>
  );
}
