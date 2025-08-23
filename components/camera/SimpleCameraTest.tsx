'use client';

import { useState, useRef, useEffect } from 'react';

interface SimpleCameraTestProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SimpleCameraTest({ isOpen, onClose }: SimpleCameraTestProps) {
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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
        const video = videoRef.current;
        video.srcObject = mediaStream;
        
        // iOS Safari向けの詳細設定
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.muted = true;
        video.autoplay = true;
        video.controls = false;
        
        // 明示的なサイズ設定
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        
        console.log('📺 ビデオ再生開始試行...');
        
        try {
          await video.play();
          console.log('▶️ ビデオ再生開始');
        } catch (playError) {
          console.log('⚠️ 自動再生失敗:', playError);
          // iOSではこれが正常な動作
        }
        
        // ストリームの状態をチェック
        setTimeout(() => {
          console.log('🔍 ストリーム状態チェック:');
          console.log('- ストリームアクティブ:', mediaStream.active);
          console.log('- ビデオトラック数:', mediaStream.getVideoTracks().length);
          console.log('- ビデオサイズ:', video.videoWidth, 'x', video.videoHeight);
          console.log('- 再生状態:', video.paused ? '一時停止' : '再生中');
        }, 1000);
      }

    } catch (err: any) {
      console.error('❌ カメラエラー:', err);
      setError(`カメラエラー: ${err.message}`);
    }
  };

  const stopCamera = () => {
    if (stream) {
      console.log('🛑 カメラ停止');
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !stream) {
      setError('カメラが利用できません');
      return;
    }

    try {
      console.log('📸 写真撮影中...');
      
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas contextが取得できません');
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageDataUrl);
      
      console.log('✅ 写真撮影成功!');
      
    } catch (err: any) {
      console.error('❌ 写真撮影エラー:', err);
      setError(`撮影エラー: ${err.message}`);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">カメラテスト</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 bg-black relative">
          {capturedImage ? (
            <div className="w-full h-full relative">
              <img
                src={capturedImage}
                alt="撮影した写真"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4">
                <button
                  onClick={retakePhoto}
                  className="bg-white/90 p-2 rounded-full hover:bg-white transition-colors"
                >
                  🔄
                </button>
              </div>
            </div>
          ) : stream ? (
            <div className="w-full h-full relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                controls={false}
                className="w-full h-full object-cover"
                style={{ 
                  background: '#000',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onLoadedMetadata={() => {
                  console.log('📊 ビデオメタデータ読み込み完了');
                  if (videoRef.current) {
                    console.log(`📐 解像度: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
                    // 強制的に再描画
                    videoRef.current.style.visibility = 'hidden';
                    videoRef.current.offsetHeight; // リフロー強制
                    videoRef.current.style.visibility = 'visible';
                  }
                }}
                onCanPlay={() => {
                  console.log('✅ ビデオ再生可能');
                  if (videoRef.current) {
                    videoRef.current.play().catch(console.warn);
                  }
                }}
                onPlay={() => {
                  console.log('▶️ ビデオ再生中');
                }}
                onError={(e) => {
                  console.error('❌ ビデオエラー:', e);
                }}
              />
              
              <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                <button
                  onClick={capturePhoto}
                  className="bg-white hover:bg-gray-100 text-gray-800 p-4 rounded-full transition-colors shadow-lg"
                >
                  📸
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center p-8">
                <div className="text-6xl mb-6">📹</div>
                <h3 className="text-xl font-bold mb-4">カメラを起動してください</h3>
                <p className="text-sm mb-6 text-gray-300">
                  ボタンをタップしてカメラを開始してください
                </p>
                <button
                  onClick={startCamera}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg"
                >
                  📸 カメラを開始
                </button>
                {error && (
                  <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
                    <p className="text-red-300 text-sm">{error}</p>
                    <button
                      onClick={startCamera}
                      className="mt-2 text-red-300 underline text-sm"
                    >
                      もう一度試す
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          {capturedImage ? (
            <div className="space-y-3">
              <button
                onClick={() => {
                  console.log('✅ 写真を保存しました');
                  alert('写真撮影成功！カメラ機能が正常に動作しています。');
                  onClose();
                }}
                className="w-full bg-green-500 text-white py-3 rounded-xl font-bold"
              >
                ✅ 撮影完了！
              </button>
              <button
                onClick={retakePhoto}
                className="w-full bg-gray-500 text-white py-2 rounded-lg"
              >
                🔄 もう一度撮影
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full bg-gray-500 text-white py-2 rounded"
            >
              閉じる
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
