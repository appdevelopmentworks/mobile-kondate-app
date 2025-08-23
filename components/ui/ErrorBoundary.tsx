'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error?: Error; retry?: () => void }> },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('エラーバウンダリーでエラーをキャッチしました:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent 
          error={this.state.error}
          retry={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ 
  error, 
  retry 
}: { 
  error?: Error; 
  retry?: () => void; 
}) {
  const goHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-500 via-cyan-400 to-blue-600">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-lg max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-red-500 mb-6"
        >
          <AlertTriangle className="w-16 h-16 mx-auto" />
        </motion.div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          エラーが発生しました
        </h2>
        
        <p className="text-gray-600 mb-6">
          申し訳ありません。予期しないエラーが発生しました。
          ページを再読み込みするか、ホームに戻ってください。
        </p>
        
        {error && (
          <details className="text-left mb-6 p-3 bg-red-50 rounded-lg">
            <summary className="cursor-pointer text-red-700 font-medium">
              エラーの詳細
            </summary>
            <pre className="mt-2 text-xs text-red-600 overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3">
          {retry && (
            <button
              onClick={retry}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              再試行
            </button>
          )}
          
          <button
            onClick={goHome}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-2xl hover:bg-gray-600 transition-colors"
          >
            <Home className="w-5 h-5" />
            ホームに戻る
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default ErrorBoundary;