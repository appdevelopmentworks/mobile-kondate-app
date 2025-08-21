'use client';

import { useState, useRef, useEffect } from 'react';

interface SimpleCameraTestProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SimpleCameraTest({ isOpen, onClose }: SimpleCameraTestProps) {
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 基本的なカメラアクセス
  const startCamera = async () => {
    try {
      console.log('🎥 カメラアクセス開始...');
      setError(null);

      if (!navigator.mediaDevices) {
        throw new Error('MediaDevices API がサポートされていません');
      }

      console.log('📱 getUserMedia を呼び出し中...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment'
        }
      });

      console.log('✅ ストリーム取得成功:', mediaStream);
      setStream(mediaStream);

      if (videoRef.current) {
        console.log('🎬 ビデオ要素にストリーム設定');
        videoRef.current.srcObject = mediaStream;
        
        // iOS対応
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        
        try {
          await videoRef.current.play();
          console.log('▶️ ビデオ再生開始');
        } catch (playError) {
          console.log('⚠️ 自動再生失敗（よくあることです）:', playError);
        }
      }

    } catch (err: any) {
      console.error('❌ カメラエラー:', err);
      setError(`カメラエラー: ${err.message}`);
    }
  };

  // カメラ停止
  const stopCamera = () => {
    if (stream) {
      console.log('🛑 カメラ停止');
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // モーダル開時にカメラ開始
  useEffect(() => {
    if (isOpen) {
      console.log('🚀 モーダル開いたのでカメラ開始');
      startCamera();
    } else {
      stopCamera();
    }
  }, [isOpen]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md h-[85vh] flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">カメラテスト</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* カメラ表示エリア */}
        <div className="flex-1 bg-black relative">
          {stream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ background: '#000' }}
              onLoadedMetadata={() => {
                console.log('📊 ビデオメタデータ読み込み完了');
                if (videoRef.current) {
                  console.log(`📐 解像度: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
                }
              }}
              onCanPlay={() => {
                console.log('✅ ビデオ再生可能');
              }}
              onPlay={() => {
                console.log('▶️ ビデオ再生中');
              }}
              onError={(e) => {
                console.error('❌ ビデオエラー:', e);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <div className="text-2xl mb-4">📹</div>
                <p>カメラ起動中...</p>
                <button
                  onClick={startCamera}
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
                >
                  カメラ開始
                </button>
              </div>
            </div>
          )}
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="p-4 bg-red-100 text-red-700">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* フッター */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gray-500 text-white py-2 rounded"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
