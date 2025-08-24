import { ImageProcessingOptions } from '../types';

// エラータイプの定義
export class ImageProcessingError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ImageProcessingError';
  }
}

/**
 * 画像ファイルをbase64エンコードされた文字列に変換
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // data:image/xxx;base64, の部分を除去してbase64のみを返す
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * 画像を指定されたサイズと品質でリサイズ（改善版）
 */
export const resizeImage = (
  file: File,
  options: ImageProcessingOptions
): Promise<File> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      if (!ctx) {
        throw new ImageProcessingError('Canvas contextの取得に失敗しました', 'CANVAS_CONTEXT_ERROR');
      }

      let objectUrl: string | null = null;

      img.onload = () => {
        try {
          // URL オブジェクトを解放
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
            objectUrl = null;
          }

          // 画像サイズバリデーション
          if (img.width === 0 || img.height === 0) {
            throw new ImageProcessingError('無効な画像サイズです', 'INVALID_IMAGE_SIZE');
          }

          // アスペクト比を保持しながらリサイズ
          const { width, height } = calculateAspectRatio(
            img.width,
            img.height,
            options.maxWidth,
            options.maxHeight
          );

          console.log('🔄 画像リサイズ:', {
            original: `${img.width}x${img.height}`,
            resized: `${width}x${height}`,
            quality: options.quality,
            format: options.format
          });

          canvas.width = width;
          canvas.height = height;

          // 高品質リサイズのための設定
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // 画像を描画
          ctx.drawImage(img, 0, 0, width, height);

          // Blobに変換
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const resizedFile = new File([blob], file.name, {
                  type: `image/${options.format}`,
                  lastModified: Date.now(),
                });
                console.log('✅ 画像リサイズ完了:', {
                  originalSize: `${(file.size / 1024).toFixed(1)}KB`,
                  resizedSize: `${(blob.size / 1024).toFixed(1)}KB`,
                  compressionRatio: `${((1 - blob.size / file.size) * 100).toFixed(1)}%`
                });
                resolve(resizedFile);
              } else {
                reject(new ImageProcessingError('画像の圧縮に失敗しました', 'COMPRESSION_FAILED'));
              }
            },
            `image/${options.format}`,
            options.quality
          );
        } catch (error) {
          reject(error instanceof ImageProcessingError ? error : 
                new ImageProcessingError('画像処理中にエラーが発生しました', 'PROCESSING_ERROR'));
        }
      };

      // タイムアウト処理（30秒）
      const timeoutId = setTimeout(() => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
        reject(new ImageProcessingError('画像処理がタイムアウトしました', 'TIMEOUT'));
      }, 30000);

      img.onload = () => {
        clearTimeout(timeoutId);
        try {
          // URL オブジェクトを解放
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
            objectUrl = null;
          }

          // 画像サイズバリデーション
          if (img.width === 0 || img.height === 0) {
            throw new ImageProcessingError('無効な画像サイズです', 'INVALID_IMAGE_SIZE');
          }

          // アスペクト比を保持しながらリサイズ
          const { width, height } = calculateAspectRatio(
            img.width,
            img.height,
            options.maxWidth,
            options.maxHeight
          );

          console.log('🔄 画像リサイズ:', {
            original: `${img.width}x${img.height}`,
            resized: `${width}x${height}`,
            quality: options.quality,
            format: options.format
          });

          canvas.width = width;
          canvas.height = height;

          // 高品質リサイズのための設定
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // 画像を描画
          ctx.drawImage(img, 0, 0, width, height);

          // Blobに変換
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const resizedFile = new File([blob], file.name, {
                  type: `image/${options.format}`,
                  lastModified: Date.now(),
                });
                console.log('✅ 画像リサイズ完了:', {
                  originalSize: `${(file.size / 1024).toFixed(1)}KB`,
                  resizedSize: `${(blob.size / 1024).toFixed(1)}KB`,
                  compressionRatio: `${((1 - blob.size / file.size) * 100).toFixed(1)}%`
                });
                resolve(resizedFile);
              } else {
                reject(new ImageProcessingError('画像の圧縮に失敗しました', 'COMPRESSION_FAILED'));
              }
            },
            `image/${options.format}`,
            options.quality
          );
        } catch (error) {
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
          }
          reject(error instanceof ImageProcessingError ? error : 
                new ImageProcessingError('画像処理中にエラーが発生しました', 'PROCESSING_ERROR'));
        }
      };

      img.onerror = (error) => {
        clearTimeout(timeoutId);
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
        reject(new ImageProcessingError('画像の読み込みに失敗しました', 'IMAGE_LOAD_ERROR'));
      };

      objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;

    } catch (error) {
      reject(error instanceof ImageProcessingError ? error : 
            new ImageProcessingError('画像リサイズの初期化に失敗しました', 'INIT_ERROR'));
    }
  });
};

/**
 * アスペクト比を保持しながら最適なサイズを計算
 */
const calculateAspectRatio = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  const aspectRatio = originalWidth / originalHeight;

  let width = originalWidth;
  let height = originalHeight;

  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return { width: Math.round(width), height: Math.round(height) };
};

/**
 * 実際に表示されているvideo要素から画像をキャプチャ（改善版）
 */
export const captureImageFromVideo = (
  videoElement: HTMLVideoElement,
  options: ImageProcessingOptions
): Promise<File> => {
  return new Promise((resolve, reject) => {
    try {
      // video要素の状態チェック
      if (!videoElement) {
        throw new ImageProcessingError('ビデオ要素が無効です', 'INVALID_VIDEO_ELEMENT');
      }

      if (videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        throw new ImageProcessingError('ビデオデータが準備できていません', 'VIDEO_NOT_READY');
      }

      if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
        throw new ImageProcessingError('カメラの映像が準備できていません', 'VIDEO_DIMENSIONS_INVALID');
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new ImageProcessingError('Canvas contextの取得に失敗しました', 'CANVAS_CONTEXT_ERROR');
      }

      const { width, height } = calculateAspectRatio(
        videoElement.videoWidth,
        videoElement.videoHeight,
        options.maxWidth,
        options.maxHeight
      );

      console.log('📸 ビデオキャプチャ開始:', {
        videoSize: `${videoElement.videoWidth}x${videoElement.videoHeight}`,
        captureSize: `${width}x${height}`,
        quality: options.quality,
        format: options.format
      });

      canvas.width = width;
      canvas.height = height;

      // 高品質キャプチャのための設定
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // video要素から直接キャンバスに描画
      ctx.drawImage(videoElement, 0, 0, width, height);

      // 画像データの検証
      const imageData = ctx.getImageData(0, 0, width, height);
      if (imageData.data.every(value => value === 0)) {
        throw new ImageProcessingError('キャプチャされた画像が空です', 'EMPTY_IMAGE_DATA');
      }

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const filename = `camera-${Date.now()}.${options.format}`;
            const file = new File([blob], filename, {
              type: `image/${options.format}`,
              lastModified: Date.now(),
            });
            
            console.log('✅ ビデオキャプチャ完了:', {
              filename,
              size: `${(blob.size / 1024).toFixed(1)}KB`,
              dimensions: `${width}x${height}`
            });
            
            resolve(file);
          } else {
            reject(new ImageProcessingError('画像のキャプチャに失敗しました', 'CAPTURE_FAILED'));
          }
        },
        `image/${options.format}`,
        options.quality
      );
    } catch (error) {
      console.error('❌ ビデオキャプチャエラー:', error);
      reject(error instanceof ImageProcessingError ? error : 
            new ImageProcessingError('ビデオキャプチャ中にエラーが発生しました', 'CAPTURE_ERROR'));
    }
  });
};

/**
 * カメラから画像をキャプチャ（レガシー関数、使用非推奨）
 */
export const captureImageFromStream = (
  stream: MediaStream,
  options: ImageProcessingOptions
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.srcObject = stream;
    video.play();

    video.onloadedmetadata = () => {
      const { width, height } = calculateAspectRatio(
        video.videoWidth,
        video.videoHeight,
        options.maxWidth,
        options.maxHeight
      );

      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], `camera-${Date.now()}.${options.format}`, {
                type: `image/${options.format}`,
                lastModified: Date.now(),
              });
              resolve(file);
            } else {
              reject(new Error('画像のキャプチャに失敗しました'));
            }
          },
          `image/${options.format}`,
          options.quality
        );
      } else {
        reject(new Error('Canvas contextの取得に失敗しました'));
      }

      // クリーンアップ（注意：この実装はストリームを停止してしまう）
      video.srcObject = null;
      // stream.getTracks().forEach(track => track.stop()); // 削除：メインのカメラも停止してしまう
    };
  });
};

/**
 * 画像ファイルが有効かチェック（改善版）
 */
export const validateImageFile = (file: File): boolean => {
  try {
    if (!file) {
      console.warn('⚠️ ファイルが選択されていません');
      return false;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const minSize = 1024; // 1KB

    // ファイルタイプチェック
    if (!validTypes.includes(file.type.toLowerCase())) {
      console.warn('⚠️ 無効なファイル形式:', file.type);
      return false;
    }

    // ファイルサイズチェック
    if (file.size > maxSize) {
      console.warn('⚠️ ファイルサイズが大きすぎます:', `${(file.size / 1024 / 1024).toFixed(1)}MB`);
      return false;
    }

    if (file.size < minSize) {
      console.warn('⚠️ ファイルサイズが小さすぎます:', `${file.size}bytes`);
      return false;
    }

    // ファイル名チェック
    if (!file.name || file.name.length === 0) {
      console.warn('⚠️ ファイル名が無効です');
      return false;
    }

    console.log('✅ ファイルバリデーション通過:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(1)}KB`
    });

    return true;
  } catch (error) {
    console.error('❌ ファイルバリデーションエラー:', error);
    return false;
  }
};

/**
 * 詳細なファイルバリデーション（エラーメッセージ付き）
 */
export const validateImageFileDetailed = (file: File): { valid: boolean; error?: string } => {
  try {
    if (!file) {
      return { valid: false, error: 'ファイルが選択されていません' };
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const minSize = 1024; // 1KB

    if (!validTypes.includes(file.type.toLowerCase())) {
      return { 
        valid: false, 
        error: `サポートされていないファイル形式です（${file.type}）。JPEG、PNG、WebP形式のみ対応しています。` 
      };
    }

    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `ファイルサイズが大きすぎます（${(file.size / 1024 / 1024).toFixed(1)}MB）。最大10MBまで対応しています。` 
      };
    }

    if (file.size < minSize) {
      return { 
        valid: false, 
        error: 'ファイルサイズが小さすぎます。有効な画像ファイルを選択してください。' 
      };
    }

    if (!file.name || file.name.length === 0) {
      return { 
        valid: false, 
        error: 'ファイル名が無効です。' 
      };
    }

    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: 'ファイルの検証中にエラーが発生しました。' 
    };
  }
};

/**
 * デフォルトの画像処理オプション
 */
export const DEFAULT_IMAGE_OPTIONS: ImageProcessingOptions = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.8,
  format: 'jpeg',
};

/**
 * 高品質画像処理オプション（精度重視）
 */
export const HIGH_QUALITY_IMAGE_OPTIONS: ImageProcessingOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.9,
  format: 'jpeg',
};

/**
 * 高速処理画像オプション（速度重視）
 */
export const FAST_PROCESSING_IMAGE_OPTIONS: ImageProcessingOptions = {
  maxWidth: 640,
  maxHeight: 640,
  quality: 0.7,
  format: 'jpeg',
};

/**
 * 画質設定に基づいて適切なオプションを取得
 */
export const getImageOptionsByQuality = (quality: 'low' | 'medium' | 'high'): ImageProcessingOptions => {
  switch (quality) {
    case 'low':
      return FAST_PROCESSING_IMAGE_OPTIONS;
    case 'high':
      return HIGH_QUALITY_IMAGE_OPTIONS;
    case 'medium':
    default:
      return DEFAULT_IMAGE_OPTIONS;
  }
};
