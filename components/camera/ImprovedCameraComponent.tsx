'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Camera,
  X,
  RefreshCw,
  Upload,
  AlertCircle,
  CheckCircle,
  Loader2,
  RotateCcw,
  Zap,
  Settings,
  Info,
  Eye,
  ImageIcon,
  Sparkles,
  Timer,
  ArrowRight
} from 'lucide-react';
import {
  IngredientRecognitionResult,
  RecognizedIngredient,
  CameraConfig,
} from '../../lib/types';
import {
  fileToBase64,
  resizeImage,
  captureImageFromVideo,
  validateImageFile,
  validateImageFileDetailed,
  ImageProcessingError,
  getImageOptionsByQuality,
  DEFAULT_IMAGE_OPTIONS,
} from '../../lib/camera/image-utils';
import {
  recognizeIngredients,
  generateMockRecognitionResult,
} from '../../lib/camera/ingredient-recognition';

interface ImprovedCameraComponentProps {
  onIngredientsRecognized: (ingredientsOrImageData: string[] | string) => void;
  onClose: () => void;
  isOpen: boolean;
  showTutorial?: boolean;
}

export default function ImprovedCameraComponent({
  onIngredientsRecognized,
  onClose,
  isOpen,
  showTutorial = true,
}: ImprovedCameraComponentProps) {
  // State管理
  const [currentStep, setCurrentStep] = useState<'tutorial' | 'camera' | 'processing' | 'result'>('tutorial');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<IngredientRecognitionResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [cameraQuality, setCameraQuality] = useState<'low' | 'medium' | 'high'>('medium');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);


  // カメラ設定
  const getCameraConstraints = useCallback(() => {
    const qualitySettings = {
      low: { width: 640, height: 480 },
      medium: { width: 1280, height: 720 },
      high: { width: 1920, height: 1080 }
    };
    
    const { width, height } = qualitySettings[cameraQuality];
    
    return {
      video: {
        width: { min: 320, ideal: width, max: width },
        height: { min: 240, ideal: height, max: height },
        facingMode: 'environment',
        aspectRatio: { ideal: 16/9 }
      },
      audio: false
    };
  }, [cameraQuality]);

  // カメラエラーハンドリング
  const handleCameraError = useCallback((err: any) => {
    let errorMessage = '';
    let suggestion = '';
    
    switch (err.name) {
      case 'NotAllowedError':
        errorMessage = 'カメラの使用が許可されていません';
        suggestion = 'ブラウザの設定でカメラを許可してください';
        break;
      case 'NotFoundError':
        errorMessage = 'カメラが見つかりません';
        suggestion = 'デバイスにカメラが接続されているか確認してください';
        break;
      case 'NotReadableError':
        errorMessage = 'カメラが使用中です';
        suggestion = '他のアプリを閉じてから再度お試しください';
        break;
      case 'OverconstrainedError':
        errorMessage = 'カメラ設定に問題があります';
        suggestion = '画質設定を下げて再度お試しください';
        break;
      default:
        errorMessage = 'カメラへのアクセスに失敗しました';
        suggestion = 'ページを再読み込みして再度お試しください';
    }
    
    setError(`${errorMessage}\n${suggestion}`);
    setCurrentStep('tutorial'); // チュートリアル画面に戻す
  }, []);

  // カメラ開始（改善版）
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setProcessingProgress(10);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('このブラウザはカメラ機能をサポートしていません');
      }

      console.log('🎥 カメラ開始:', cameraQuality);
      
      const constraints = getCameraConstraints();
      setProcessingProgress(30);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setProcessingProgress(60);
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = mediaStream;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.muted = true;
        
        // ビデオの準備完了を待機
        await new Promise<void>((resolve, reject) => {
          const handleLoadedMetadata = () => {
            setProcessingProgress(90);
            console.log('✅ カメラ準備完了:', {
              width: video.videoWidth,
              height: video.videoHeight,
              quality: cameraQuality
            });
            resolve();
          };
          
          const handleError = (error: any) => {
            console.error('❌ ビデオエラー:', error);
            reject(error);
          };
          
          video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
          video.addEventListener('error', handleError, { once: true });
          
          video.play().catch(console.warn);
          
          // タイムアウト（10秒）
          setTimeout(() => reject(new Error('カメラの起動がタイムアウトしました')), 10000);
        });
        
        setProcessingProgress(100);
        setCurrentStep('camera');
      }
    } catch (err: any) {
      console.error('❌ カメラエラー:', err);
      handleCameraError(err);
    }
  }, [getCameraConstraints, cameraQuality, handleCameraError]);

  // 写真撮影（改善版）
  const takePhoto = useCallback(async () => {
    console.log('🎬 takePhoto実行開始:', {
      hasStream: !!stream,
      hasVideo: !!videoRef.current,
      streamActive: stream?.active,
      videoReadyState: videoRef.current?.readyState,
      videoWidth: videoRef.current?.videoWidth
    });

    if (!stream || !videoRef.current) {
      console.error('❌ ストリームまたはビデオ要素が無効');
      setError('カメラが利用できません');
      return;
    }

    // ストリームが非アクティブの場合
    if (!stream.active) {
      console.error('❌ ストリームが非アクティブ');
      setError('カメラ接続が失われました。再度お試しください。');
      return;
    }


    try {
      setIsProcessing(true);
      setCurrentStep('processing');
      setError(null);
      setProcessingProgress(0);
      
      const video = videoRef.current;
      
      // ビデオ状態チェック
      if (video.readyState < 2 || video.videoWidth === 0) {
        throw new Error('カメラの準備が完了していません');
      }
      
      setProcessingProgress(20);
      
      // 画像キャプチャ
      const canvas = canvasRef.current;
      if (!canvas) {
        const newCanvas = document.createElement('canvas');
        newCanvas.width = video.videoWidth;
        newCanvas.height = video.videoHeight;
        const ctx = newCanvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context取得に失敗');
        ctx.drawImage(video, 0, 0);
        setCapturedImage(newCanvas.toDataURL('image/jpeg', 0.8));
      }
      
      setProcessingProgress(40);
      
      // 画像処理と認識（品質設定を反映）
      const imageProcessingOptions = getImageOptionsByQuality(cameraQuality);
      const imageFile = await captureImageFromVideo(video, imageProcessingOptions);
      const resizedFile = await resizeImage(imageFile, imageProcessingOptions);
      const base64 = await fileToBase64(resizedFile);
      
      setProcessingProgress(60);
      setCapturedImage(`data:image/jpeg;base64,${base64}`);
      
      // AI認識実行
      const result = await recognizeIngredients(base64);
      
      setProcessingProgress(100);
      setRecognitionResult(result);
      setCurrentStep('result');
      
    } catch (err: any) {
      console.error('❌ 写真撮影エラー:', err);
      
      // ImageProcessingErrorの場合は具体的なメッセージを表示
      if (err instanceof ImageProcessingError) {
        setError(err.message);
      } else {
        setError(err.message || '写真の撮影に失敗しました。再度お試しください。');
      }
      
      setCurrentStep('camera');
    } finally {
      setIsProcessing(false);
    }
  }, [stream, cameraQuality]);

  // チュートリアルをスキップしてカメラに直行する場合
  useEffect(() => {
    if (isOpen && !showTutorial) {
      setCurrentStep('camera');
      startCamera();
    } else if (isOpen && showTutorial) {
      setCurrentStep('tutorial');
    }
  }, [isOpen, showTutorial, startCamera]);

  // カメラ起動後にリフレッシュボタンを自動実行（showTutorial = falseの場合）
  useEffect(() => {
    if (!showTutorial && currentStep === 'camera' && stream && !isProcessing) {
      console.log('📹 カメラストリーム検出、リフレッシュボタン自動実行');
      
      // カメラストリーム検出後、少し待ってからリフレッシュボタンと同じ動作を実行
      const autoRefreshTimer = setTimeout(() => {
        console.log('🔄 自動リフレッシュ実行 (startCamera呼び出し)');
        startCamera(); // リフレッシュボタンと同じ動作
      }, 800); // 0.8秒待機

      return () => {
        clearTimeout(autoRefreshTimer);
      };
    }
  }, [currentStep, stream, isProcessing, showTutorial, startCamera]);

  // カメラ停止
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  // ファイル選択処理（改善版）
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 詳細バリデーション
    const validation = validateImageFileDetailed(file);
    if (!validation.valid) {
      setError(validation.error || '無効な画像ファイルです');
      return;
    }

    try {
      setIsProcessing(true);
      setCurrentStep('processing');
      setError(null);
      setProcessingProgress(0);
      
      setProcessingProgress(30);
      const imageProcessingOptions = getImageOptionsByQuality(cameraQuality);
      const resizedFile = await resizeImage(file, imageProcessingOptions);
      
      setProcessingProgress(50);
      const base64 = await fileToBase64(resizedFile);
      
      setProcessingProgress(70);
      setCapturedImage(`data:image/jpeg;base64,${base64}`);
      
      // AI認識実行
      const result = await recognizeIngredients(base64);
      
      setProcessingProgress(100);
      setRecognitionResult(result);
      setCurrentStep('result');
      
    } catch (err: any) {
      console.error('❌ ファイル処理エラー:', err);
      
      // ImageProcessingErrorの場合は具体的なメッセージを表示
      if (err instanceof ImageProcessingError) {
        setError(err.message);
      } else {
        setError('画像の処理に失敗しました。別の画像を選択してください。');
      }
      
      setCurrentStep('tutorial');
    } finally {
      setIsProcessing(false);
    }
  }, [cameraQuality]);

  // モーダルクローズ
  const handleClose = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    setRecognitionResult(null);
    setError(null);
    setIsProcessing(false);
    setCurrentStep('tutorial');
    setProcessingProgress(0);
    onClose();
  }, [stopCamera, onClose]);

  // 結果確定
  const confirmResult = useCallback(() => {
    if (recognitionResult?.success && recognitionResult.ingredients?.length > 0) {
      onIngredientsRecognized(capturedImage || []);
      handleClose();
    }
  }, [recognitionResult, capturedImage, onIngredientsRecognized, handleClose]);

  // 再試行
  const retryCapture = useCallback(() => {
    setCapturedImage(null);
    setRecognitionResult(null);
    setError(null);
    setCurrentStep('camera');
    if (!stream) {
      startCamera();
    }
  }, [stream, startCamera]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black bg-opacity-95"
      >
        <div className="h-full flex flex-col">
          {/* ヘッダー */}
          <div className="flex-shrink-0 flex items-center justify-between p-4 text-white bg-black/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Camera className="w-6 h-6" />
              <div>
                <h2 className="font-bold">食材認識</h2>
                <p className="text-xs text-white/70">
                  {currentStep === 'tutorial' && 'ガイド'}
                  {currentStep === 'camera' && 'カメラ'}
                  {currentStep === 'processing' && '処理中'}
                  {currentStep === 'result' && '結果'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {currentStep === 'camera' && (
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* プログレスバー（処理中） */}
          {currentStep === 'processing' && (
            <div className="flex-shrink-0 px-4 pb-2">
              <div className="w-full bg-white/20 rounded-full h-2">
                <motion.div
                  className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${processingProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* メインコンテンツ */}
          <div className="flex-1 relative">
            <AnimatePresence mode="wait">
              {/* チュートリアル画面 */}
              {currentStep === 'tutorial' && (
                <TutorialScreen
                  onStartCamera={() => startCamera()}
                  onFileSelect={() => fileInputRef.current?.click()}
                  error={error}
                  onClearError={() => setError(null)}
                />
              )}

              {/* カメラ画面 */}
              {currentStep === 'camera' && (
                <CameraScreen
                  videoRef={videoRef}
                  stream={stream}
                  onTakePhoto={takePhoto}
                  onFileSelect={() => fileInputRef.current?.click()}
                  isProcessing={isProcessing}
                  showSettings={showSettings}
                  cameraQuality={cameraQuality}
                  onQualityChange={setCameraQuality}
                  onRetryCamera={startCamera}
                  error={error}
                />
              )}

              {/* 処理中画面 */}
              {currentStep === 'processing' && (
                <ProcessingScreen progress={processingProgress} />
              )}

              {/* 結果画面 */}
              {currentStep === 'result' && (
                <ResultScreen
                  capturedImage={capturedImage}
                  recognitionResult={recognitionResult}
                  onConfirm={confirmResult}
                  onRetry={retryCapture}
                  error={error}
                />
              )}
            </AnimatePresence>
          </div>

          {/* 隠しキャンバスとファイル入力 */}
          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// チュートリアル画面コンポーネント
function TutorialScreen({ 
  onStartCamera, 
  onFileSelect, 
  error, 
  onClearError 
}: {
  onStartCamera: () => void;
  onFileSelect: () => void;
  error: string | null;
  onClearError: () => void;
}) {
  return (
    <motion.div
      key="tutorial"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex flex-col justify-center items-center text-white p-6"
    >
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Camera className="w-12 h-12 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold mb-3">食材を認識しよう</h2>
        <p className="text-white/80 leading-relaxed">
          カメラまたは写真から食材を自動で認識します
        </p>
      </div>

      {/* エラー表示 */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-red-400 font-medium mb-1">エラーが発生しました</h3>
              <p className="text-red-300 text-sm whitespace-pre-line">{error}</p>
            </div>
            <button
              onClick={onClearError}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* 使い方のコツ */}
      <div className="w-full max-w-md mb-8">
        <h3 className="flex items-center gap-2 font-semibold mb-4 text-white/90">
          <Eye className="w-5 h-5" />
          撮影のコツ
        </h3>
        <div className="space-y-3 text-sm text-white/70">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
            <span>明るい場所で撮影してください</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
            <span>食材全体がフレームに入るようにしてください</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
            <span>手ブレしないよう安定させて撮影</span>
          </div>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="w-full max-w-md space-y-4">
        <button
          onClick={onStartCamera}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center justify-center gap-3"
        >
          <Camera className="w-6 h-6" />
          カメラで撮影
        </button>
        
        <button
          onClick={onFileSelect}
          className="w-full bg-white/10 backdrop-blur-sm text-white py-4 px-6 rounded-xl font-semibold hover:bg-white/20 transition-colors flex items-center justify-center gap-3"
        >
          <Upload className="w-6 h-6" />
          写真を選択
        </button>
      </div>
    </motion.div>
  );
}

// カメラ画面コンポーネント
function CameraScreen({ 
  videoRef, 
  stream, 
  onTakePhoto, 
  onFileSelect, 
  isProcessing,
  showSettings,
  cameraQuality,
  onQualityChange,
  onRetryCamera,
  error
}: {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  onTakePhoto: () => void;
  onFileSelect: () => void;
  isProcessing: boolean;
  showSettings: boolean;
  cameraQuality: 'low' | 'medium' | 'high';
  onQualityChange: (quality: 'low' | 'medium' | 'high') => void;
  onRetryCamera: () => void;
  error: string | null;
}) {
  return (
    <motion.div
      key="camera"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full relative"
    >
      {/* カメラビュー */}
      <div className="h-full bg-black">
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white">
            <div className="text-center">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="mb-4">カメラを起動中...</p>
              <button
                onClick={onRetryCamera}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              >
                再試行
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 設定パネル */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-xl p-4 text-white"
          >
            <h4 className="font-semibold mb-3">画質設定</h4>
            <div className="space-y-2">
              {(['low', 'medium', 'high'] as const).map((quality) => (
                <button
                  key={quality}
                  onClick={() => onQualityChange(quality)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    cameraQuality === quality 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {quality === 'low' && '低画質 (640x480)'}
                  {quality === 'medium' && '標準 (1280x720)'}
                  {quality === 'high' && '高画質 (1920x1080)'}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* カメラコントロール */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-6">
        <button
          onClick={onFileSelect}
          className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-4 rounded-full transition-colors"
        >
          <Upload className="w-6 h-6" />
        </button>
        
        <button
          onClick={onTakePhoto}
          disabled={isProcessing || !stream}
          className="bg-white hover:bg-gray-100 text-gray-800 p-6 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg"
        >
          {isProcessing ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <Camera className="w-8 h-8" />
          )}
        </button>
        
        <button
          onClick={onRetryCamera}
          className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-4 rounded-full transition-colors"
        >
          <RefreshCw className="w-6 h-6" />
        </button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="absolute bottom-24 left-4 right-4">
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// 処理中画面コンポーネント
function ProcessingScreen({ progress }: { progress: number }) {
  return (
    <motion.div
      key="processing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col items-center justify-center text-white p-6"
    >
      <div className="text-center">
        <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-12 h-12 text-purple-400 animate-pulse" />
        </div>
        
        <h2 className="text-2xl font-bold mb-2">AI認識中</h2>
        <p className="text-white/80 mb-8">食材を分析しています...</p>
        
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between text-sm text-white/60 mb-2">
            <span>進捗</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <motion.div
              className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-2 text-white/60">
          <Timer className="w-4 h-4" />
          <span className="text-sm">通常 2-5 秒で完了します</span>
        </div>
      </div>
    </motion.div>
  );
}

// 結果画面コンポーネント
function ResultScreen({ 
  capturedImage, 
  recognitionResult, 
  onConfirm, 
  onRetry,
  error
}: {
  capturedImage: string | null;
  recognitionResult: IngredientRecognitionResult | null;
  onConfirm: () => void;
  onRetry: () => void;
  error: string | null;
}) {
  const hasResults = recognitionResult?.success && recognitionResult.ingredients?.length > 0;

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex flex-col text-white overflow-y-auto"
    >
      {/* 撮影画像プレビュー */}
      {capturedImage && (
        <div className="flex-shrink-0 h-48 relative">
          <Image
            src={capturedImage}
            alt="撮影画像"
            width={400}
            height={192}
            className="w-full h-full object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
          <button
            onClick={onRetry}
            className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-full transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 結果内容 */}
      <div className="flex-1 p-6">
        {error ? (
          <div className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-bold mb-2 text-red-400">認識に失敗しました</h2>
            <p className="text-white/80 mb-6">{error}</p>
            <button
              onClick={onRetry}
              className="bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-xl font-semibold transition-colors"
            >
              再度撮影
            </button>
          </div>
        ) : hasResults ? (
          <div className="space-y-6">
            {/* 成功ヘッダー */}
            <div className="text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
              <h2 className="text-2xl font-bold mb-2">
                {recognitionResult!.ingredients.length}個の食材を認識
              </h2>
              <p className="text-white/80">
                信頼度: {Math.round((recognitionResult!.confidence || 0) * 100)}%
              </p>
            </div>

            {/* 認識された食材リスト */}
            <div className="space-y-3">
              {recognitionResult!.ingredients.map((ingredient, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                      <span className="text-green-400 font-bold">
                        {ingredient.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{ingredient.name}</h3>
                      {ingredient.quantity && (
                        <p className="text-sm text-white/60">{ingredient.quantity}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      ingredient.confidence > 0.8 ? 'bg-green-500/20 text-green-400' :
                      ingredient.confidence > 0.6 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {Math.round(ingredient.confidence * 100)}%
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* アクションボタン */}
            <div className="space-y-3">
              <button
                onClick={onConfirm}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-xl font-bold transition-all duration-200 active:scale-95 shadow-lg flex items-center justify-center gap-3"
              >
                <CheckCircle className="w-5 h-5" />
                食材を確定して次へ
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <button
                onClick={onRetry}
                className="w-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white py-3 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                再度撮影
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-bold mb-2">食材が認識できませんでした</h2>
            <p className="text-white/80 mb-6">
              別の角度から撮影するか、照明を明るくしてお試しください
            </p>
            <button
              onClick={onRetry}
              className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold transition-colors"
            >
              再度撮影
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}