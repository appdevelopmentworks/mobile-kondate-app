'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MobileLayout from '../../components/layout/MobileLayout';
import { useMealStore } from '../../lib/store';
import { motion } from 'framer-motion';
import { ChefHat } from 'lucide-react';

export default function MealFormPage() {
  const router = useRouter();
  const resetForm = useMealStore((state) => state.resetForm);

  useEffect(() => {
    // フォームをリセット
    resetForm();
    // 最初のステップへリダイレクト
    router.push('/meal-form/1');
  }, [resetForm, router]);

  return (
    <MobileLayout title="献立作成" showBack={true}>
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <ChefHat className="w-16 h-16 text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600">準備中...</p>
        </motion.div>
      </div>
    </MobileLayout>
  );
}
