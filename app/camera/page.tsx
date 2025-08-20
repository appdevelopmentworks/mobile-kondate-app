'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CameraIngredientRecognition from '@/components/camera/CameraIngredientRecognition';
import MobileLayout from '@/components/layout/MobileLayout';

export default function CameraFoodRecognitionPage() {
  console.log('📸 カメラ食材認識ページにアクセスしました');
  const router = useRouter();
  const [isCameraOpen, setIsCameraOpen] = useState(true); // 自動で開く

  const handleIngredientsRecognized = (ingredientsOrImageData: string[] | string) => {
    // Handle both string array (manual input) and string (image data)
    const recognizedIngredients = Array.isArray(ingredientsOrImageData) ? ingredientsOrImageData : [];
    
    // 認識された食材を食材選択ページに送る
    if (recognizedIngredients.length > 0) {
      const ingredientsParam = encodeURIComponent(recognizedIngredients.join(','));
      router.push(`/ingredients?ingredients=${ingredientsParam}`);
    } else {
      // 食材が認識されなかった場合はホームに戻る
      router.push('/');
    }
  };

  const handleClose = () => {
    // カメラを閉じる場合はホームに戻る
    router.push('/');
  };

  return (
    <MobileLayout title="食材認識">
      <div className="h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">📸</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            カメラで食材認識
          </h2>
          <p className="text-gray-600 text-sm">
            食材を撮影またはアップロードして認識します
          </p>
        </div>
      </div>
      
      {/* カメラ食材認識モーダル */}
      <CameraIngredientRecognition
        isOpen={isCameraOpen}
        onIngredientsRecognized={handleIngredientsRecognized}
        onClose={handleClose}
      />
    </MobileLayout>
  );
}
