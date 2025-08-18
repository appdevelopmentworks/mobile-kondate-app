import { ImageProcessingOptions } from '../types';

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
 * 画像を指定されたサイズと品質でリサイズ
 */
export const resizeImage = (
  file: File,
  options: ImageProcessingOptions
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // アスペクト比を保持しながらリサイズ
      const { width, height } = calculateAspectRatio(
        img.width,
        img.height,
        options.maxWidth,
        options.maxHeight
      );

      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: `image/${options.format}`,
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              reject(new Error('画像の圧縮に失敗しました'));
            }
          },
          `image/${options.format}`,
          options.quality
        );
      } else {
        reject(new Error('Canvas contextの取得に失敗しました'));
      }
    };

    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    img.src = URL.createObjectURL(file);
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
 * カメラから画像をキャプチャ
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

      // クリーンアップ
      video.srcObject = null;
      stream.getTracks().forEach(track => track.stop());
    };
  });
};

/**
 * 画像ファイルが有効かチェック
 */
export const validateImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  return validTypes.includes(file.type) && file.size <= maxSize;
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
