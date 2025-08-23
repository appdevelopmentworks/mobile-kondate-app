'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Image as ImageIcon,
  X,
  RefreshCw,
  Upload,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
} from 'lucide-react';

interface CameraIngredientRecognitionFixedProps {
  onIngredientsRecognized: (ingredientsOrImageData: string[] | string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function CameraIngredientRecognitionFixed({
  onIngredientsRecognized,
  onClose,
  isOpen,
}: CameraIngredientRecognitionFixedProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // カメラの開始
  const startCamera = async () => {
    try {
      setError(null);
      console.log('🎥 カメラアクセス開始...');

      if (!navigator.mediaDevices) {
        throw new Error('このブラウザはカメラ機能をサポートしていません');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { min: 320, ideal: 640, max: 1280 },
          height: { min: 240, ideal: 480, max: 720 }
        }
      });

      console.log('✅ カメラストリーム取得成功');
      setStream(mediaStream);
      setShowInstructions(false);

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = mediaStream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.muted = true;
        video.autoplay = true;

        try {
          await video.play();
          console.log('▶️ ビデオ再生開始');
        } catch (playError) {
          console.log('⚠️ 自動再生失敗（正常）:', playError);
        }
      }

    } catch (err: any) {
      console.error('❌ カメラエラー:', err);
      if (err.name === 'NotAllowedError') {
        setError('カメラの使用が許可されていません。ブラウザの設定でカメラを許可してください。');
      } else {
        setError(err.message || 'カメラへのアクセスに失敗しました。');
      }
    }
  };

  // カメラの停止
  const stopCamera = () => {
    if (stream) {
      console.log('🛑 カメラ停止');
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // 写真撮影
  const takePhoto = async () => {
    if (!stream || !videoRef.current) {
      setError('カメラが利用できません');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      console.log('📸 写真撮影中...');

      const video = videoRef.current;
      
      // ビデオの状態をチェック
      if (video.readyState < 2) {
        setError('カメラの準備が完了していません。しばらくお待ちください。');
        setIsProcessing(false);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas contextが取得できません');
      }

      // キャンバスのサイズをビデオに合わせる
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      // ビデオフレームをキャンバスに描画
      ctx.drawImage(video, 0, 0);

      // データ URLに変換
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setSelectedImage(imageDataUrl);

      // Base64データのみを抽出
      const base64 = imageDataUrl.split(',')[1];
      
      console.log('✅ 写真撮影成功');
      
      // 食材認識処理を実行
      onIngredientsRecognized(base64);
      handleClose();

    } catch (err: any) {
      setError(err.message || '写真の撮影に失敗しました');
      console.error('❌ 撮影エラー:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // 画像ファイル選択
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError('有効な画像ファイル（JPEG、PNG、WebP）を選択してください（最大10MB）');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        
        setSelectedImage(result);
        console.log('✅ ファイル選択成功');
        
        // 食材認識処理を実行
        onIngredientsRecognized(base64);
        handleClose();
      };
      reader.readAsDataURL(file);

    } catch (err: any) {
      setError('画像の処理に失敗しました');
      console.error('❌ ファイル処理エラー:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // モーダルを閉じる
  const handleClose = () => {
    stopCamera();
    setSelectedImage(null);
    setError(null);
    setIsProcessing(false);
    setShowInstructions(true);
    onClose();
  };

  // モーダル開時にカメラ開始
  useEffect(() => {
    if (isOpen && !stream && !selectedImage) {
      const timer = setTimeout(() => {
        startCamera();
      }, 500); // 少し遅延させてモーダルが完全に表示されてから
      return () => clearTimeout(timer);
    }
  }, [isOpen, stream, selectedImage, startCamera]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl w-full max-w-md h-[85vh] flex flex-col overflow-hidden"
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">食材認識</h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* メインコンテンツ */}
          <div className="flex-1 flex flex-col">
            {/* カメラビューまたは指示画面 */}
            <div className="flex-1 bg-black relative">
              {stream ? (
                <>
                  {/* 隠しビデオ要素（iOS Safari対応） */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover opacity-0"
                    style={{ background: '#000' }}
                  />
                  
                  {/* 撮影インターフェース */}
                  <div className="w-full h-full flex flex-col items-center justify-center text-white relative">
                    {/* 背景グラデーション */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50"></div>
                    
                    {/* 中央の説明エリア */}
                    <div className="relative z-10 text-center px-6">
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
                        <div className="text-4xl mb-4">📸</div>
                        <h3 className="text-xl font-bold mb-3">カメラ準備完了</h3>
                        <p className="text-sm text-gray-200 mb-4">
                          食材を画面に向けて「撮影」ボタンをタップしてください
                        </p>
                        <div className="flex items-center justify-center gap-2 text-xs text-yellow-200">
                          <Info className="w-4 h-4" />
                          <span>プレビューが見えなくても撮影できます</span>
                        </div>
                      </div>
                    </div>

                    {/* 撮影ボタン */}
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
                      <button
                        onClick={takePhoto}
                        disabled={isProcessing}
                        className="bg-white hover:bg-gray-100 text-gray-800 p-6 rounded-full transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-8 h-8 animate-spin" />
                        ) : (
                          <Camera className="w-8 h-8" />
                        )}
                      </button>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-gray-600/80 hover:bg-gray-700/80 text-white p-4 rounded-full transition-colors shadow-lg flex flex-col items-center gap-1"
                      >
                        <Upload className="w-5 h-5" />
                        <span className="text-xs">ファイル</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* カメラ起動前の画面 */
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center px-6">
                    <div className="text-6xl mb-6">📹</div>
                    <h3 className="text-xl font-bold mb-4">食材認識を開始</h3>
                    <p className="text-sm mb-6 text-gray-300">
                      カメラまたはファイルから食材を認識します
                    </p>
                    
                    {!stream && (
                      <div className="space-y-3">
                        <button
                          onClick={startCamera}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg"
                        >
                          📸 カメラを開始
                        </button>
                        
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                          📁 ファイルから選択
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* フッター */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-600 mb-3">
              <Info className="w-4 h-4" />
              <span>iOS Safariではプレビューが表示されない場合がありますが、撮影は正常に動作します</span>
            </div>
            
            <button
              onClick={handleClose}
              className="w-full bg-gray-500 text-white py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              キャンセル
            </button>
          </div>

          {/* 隠しファイル入力 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
