'use client';

import { useState } from 'react';

interface CameraPermissionTestProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CameraPermissionTest({ isOpen, onClose }: CameraPermissionTestProps) {
  const [status, setStatus] = useState<string>('準備中...');
  const [permissionState, setPermissionState] = useState<string>('不明');

  const checkPermissions = async () => {
    setStatus('権限をチェック中...');
    
    try {
      // Step 1: MediaDevices APIの確認
      if (!navigator.mediaDevices) {
        setStatus('❌ MediaDevices API がサポートされていません');
        return;
      }
      
      // Step 2: 権限の状態を確認
      try {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setPermissionState(permission.state);
        setStatus(`📋 権限状態: ${permission.state}`);
        
        if (permission.state === 'denied') {
          setStatus('❌ カメラ権限が拒否されています。ブラウザ設定で許可してください。');
          return;
        }
      } catch (permError) {
        setStatus('⚠️ 権限チェックAPIが利用できません（続行します）');
      }
      
      // Step 3: 実際にカメラアクセスを試行
      setStatus('📹 カメラアクセスを試行中...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      setStatus('✅ カメラアクセス成功！');
      
      // ストリームを停止
      stream.getTracks().forEach(track => track.stop());
      
      setTimeout(() => {
        setStatus('🎉 カメラ機能が正常に動作しています！');
      }, 1000);
      
    } catch (error: any) {
      console.error('Camera test error:', error);
      
      if (error.name === 'NotAllowedError') {
        setStatus('❌ カメラアクセスが拒否されました。権限設定を確認してください。');
      } else if (error.name === 'NotFoundError') {
        setStatus('❌ カメラが見つかりません。');
      } else if (error.name === 'NotReadableError') {
        setStatus('❌ カメラが他のアプリで使用中です。');
      } else {
        setStatus(`❌ エラー: ${error.message}`);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">カメラ権限テスト</h2>
          
          <div className="bg-gray-100 p-4 rounded-lg mb-4 min-h-[100px] flex items-center justify-center">
            <p className="text-sm text-gray-700">{status}</p>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <p className="text-xs text-blue-700">
              <strong>権限状態:</strong> {permissionState}
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={checkPermissions}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium"
            >
              🔍 権限とカメラをテスト
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-gray-500 text-white py-2 rounded-lg"
            >
              閉じる
            </button>
          </div>
          
          <div className="mt-4 text-xs text-gray-500 text-left">
            <p><strong>📱 iPhone の場合:</strong></p>
            <p>1. 設定 → Safari → カメラ → 許可</p>
            <p>2. アドレスバーの🔒 → カメラ → 許可</p>
            <p><strong>🖥️ PC の場合:</strong></p>
            <p>ブラウザでカメラ許可ダイアログで「許可」</p>
          </div>
        </div>
      </div>
    </div>
  );
}
