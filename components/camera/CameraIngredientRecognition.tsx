'use client';

import { useState, useRef, useCallback } from 'react';
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
} from 'lucide-react';
import {
  IngredientRecognitionResult,
  RecognizedIngredient,
  CameraConfig,
} from '../../lib/types';
import {
  fileToBase64,
  resizeImage,
  captureImageFromStream,
  validateImageFile,
  DEFAULT_IMAGE_OPTIONS,
} from '../../lib/camera/image-utils';
import {
  recognizeIngredients,
  recognizeIngredientsOffline,
  processRecognizedIngredients,
  normalizeIngredientNames,
} from '../../lib/camera/ingredient-recognition';

interface CameraIngredientRecognitionProps {
  onIngredientsRecognized: (ingredientsOrImageData: string[] | string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  width: 1280,
  height: 720,
  facingMode: 'environment', // 背面カメラを使用
  quality: 0.8,
};

export default function CameraIngredientRecognition({
  onIngredientsRecognized,
  onClose,
  isOpen,
}: CameraIngredientRecognitionProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<IngredientRecognitionResult | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // カメラの開始
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: DEFAULT_CAMERA_CONFIG.width,
          height: DEFAULT_CAMERA_CONFIG.height,
          facingMode: DEFAULT_CAMERA_CONFIG.facingMode,
        },
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('カメラへのアクセスが拒否されました。設定を確認してください。');
      console.error('Camera access error:', err);
    }
  }, []);

  // カメラの停止
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]); // eslint-disable-line react-hooks/exhaustive-deps

  // 写真撮影
  const takePhoto = useCallback(async () => {
    if (!stream) {
      setError('カメラが利用できません');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      
      const imageFile = await captureImageFromStream(stream, DEFAULT_IMAGE_OPTIONS);
      const resizedFile = await resizeImage(imageFile, DEFAULT_IMAGE_OPTIONS);
      const base64 = await fileToBase64(resizedFile);
      
      setSelectedImage(`data:image/jpeg;base64,${base64}`);
      await processImage(base64);
      
    } catch (err) {
      setError('写真の撮影に失敗しました');
      console.error('Photo capture error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [stream]);

  // 画像ファイル選択
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateImageFile(file)) {
      setError('有効な画像ファイル（JPEG、PNG、WebP）を選択してください（最大10MB）');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      
      const resizedFile = await resizeImage(file, DEFAULT_IMAGE_OPTIONS);
      const base64 = await fileToBase64(resizedFile);
      
      setSelectedImage(`data:image/jpeg;base64,${base64}`);
      await processImage(base64);
      
    } catch (err) {
      setError('画像の処理に失敗しました');
      console.error('File processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // 画像を食材認識APIに送信
  const processImage = useCallback(async (base64: string) => {
    try {
      setRecognitionResult(null);
      
      // 画像データを直接親コンポーネントに送信
      onIngredientsRecognized(base64);
      handleClose();
      
    } catch (err) {
      setError('食材認識処理中にエラーが発生しました');
      console.error('Recognition error:', err);
    }
  }, [onIngredientsRecognized]);

  // 認識された食材を確定（この関数は使われなくなった）
  const confirmIngredients = useCallback(() => {
    if (recognitionResult?.ingredients) {
      const ingredientNames = recognitionResult.ingredients.map(ing => ing.name);
      onIngredientsRecognized(ingredientNames);
      handleClose();
    }
  }, [recognitionResult, onIngredientsRecognized]);

  // モーダルを閉じる
  const handleClose = useCallback(() => {
    stopCamera();
    setSelectedImage(null);
    setRecognitionResult(null);
    setError(null);
    setIsProcessing(false);
    onClose();
  }, [stopCamera, onClose]);

  // 再撮影
  const retakePhoto = useCallback(() => {
    setSelectedImage(null);
    setRecognitionResult(null);
    setError(null);
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
            {/* カメラビューまたは選択された画像 */}
            {!selectedImage ? (
              <div className="flex-1 bg-black relative">
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
                      <p className="text-sm opacity-75 mb-4">カメラまたはファイルから食材認識</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors mx-auto"
                      >
                        <Upload className="w-4 h-4" />
                        ファイル選択
                      </button>
                    </div>
                  </div>
                )}

                {/* カメラコントロール */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  {!stream ? (
                    <button
                      onClick={startCamera}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full transition-colors"
                    >
                      <Camera className="w-6 h-6" />
                    </button>
                  ) : (
                    <button
                      onClick={takePhoto}
                      disabled={isProcessing}
                      className="bg-white hover:bg-gray-100 text-gray-800 p-4 rounded-full transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6" />
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-full transition-colors flex flex-col items-center gap-1 min-w-16"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="text-xs">ファイル</span>
                  </button>
                </div>
              </div>
            ) : (
              /* 選択された画像と認識結果 */
              <div className="flex-1 flex flex-col">
                {/* 画像プレビュー */}
                <div className="h-48 bg-gray-100 relative">
                  <img
                    src={selectedImage}
                    alt="選択された画像"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={retakePhoto}
                    className="absolute top-2 right-2 bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {/* 認識結果 */}
                <div className="flex-1 p-4 overflow-y-auto min-h-0">
                  {isProcessing ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                        <p className="text-sm text-gray-600">食材を認識中...</p>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm">{error}</p>
                    </div>
                  ) : recognitionResult ? (
                    <div className="space-y-4">
                      {recognitionResult.ingredients.length > 0 ? (
                        <>
                          <div className="flex items-center gap-2 text-green-700">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">
                              {recognitionResult.ingredients.length}個の食材を認識しました
                            </span>
                          </div>
                          
                          <div className="space-y-2 max-h-72 overflow-y-auto">
                            {recognitionResult.ingredients.map((ingredient, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div>
                                  <span className="font-medium text-gray-800">
                                    {ingredient.name}
                                  </span>
                                  {ingredient.quantity && (
                                    <span className="text-sm text-gray-600 ml-2">
                                      ({ingredient.quantity})
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500">
                                  {Math.round(ingredient.confidence * 100)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-gray-600 py-8">
                          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">食材を認識できませんでした</p>
                          <p className="text-xs text-gray-500 mt-1">
                            別の角度で撮影してみてください
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* フッター - 常に表示 */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            {recognitionResult && recognitionResult.ingredients && recognitionResult.ingredients.length > 0 ? (
              <div className="space-y-3">
                {/* 結果サマリー */}
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      {recognitionResult.ingredients.length}個の食材を認識完了
                    </span>
                  </div>
                  <p className="text-xs text-green-700 mb-1">
                    「食材を追加」でメイン画面の食材リストに追加
                  </p>
                  <p className="text-xs text-gray-600">
                    重複する食材は自動で除外されます
                  </p>
                </div>

                {/* 確定ボタン */}
                <button
                  onClick={confirmIngredients}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-4 rounded-xl font-bold transition-all duration-200 active:scale-95 shadow-lg"
                >
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>✅ 食材を追加 ({recognitionResult.ingredients.length}個)</span>
                  </div>
                  <div className="text-xs text-white/80 mt-1">
                    メイン画面で次のアクションを選択
                  </div>
                </button>

                {/* サブアクション */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={retakePhoto}
                    className="bg-white text-gray-700 py-2 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <RefreshCw className="w-4 h-4" />
                      <span className="text-sm">{selectedImage ? '再度撮影' : '再テスト'}</span>
                    </div>
                  </button>

                  <button
                    onClick={handleClose}
                    className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <X className="w-4 h-4" />
                      <span className="text-sm">キャンセル</span>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600">
                    食材を認識してください
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={retakePhoto}
                    className="bg-white text-gray-700 py-2 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <RefreshCw className="w-4 h-4" />
                      <span className="text-sm">{selectedImage ? '再度撮影' : '再テスト'}</span>
                    </div>
                  </button>

                  <button
                    onClick={handleClose}
                    className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <X className="w-4 h-4" />
                      <span className="text-sm">キャンセル</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
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
