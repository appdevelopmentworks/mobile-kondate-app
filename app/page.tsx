export default function HomePage() {
  return (
    <div className="min-h-screen bg-pink-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            献立アプリ - 基本テスト
          </h1>
          <p className="text-gray-600">
            今日の献立を考えましょう
          </p>
        </div>

        <div className="space-y-4">
          {/* 条件から作る */}
          <a href="/meal-form">
            <div className="bg-purple-500 text-white p-6 rounded-lg shadow-lg active:scale-95 transition-transform">
              <h3 className="text-xl font-bold mb-2">🍳 条件から作る</h3>
              <p className="text-sm text-white/90">
                食材や時間を指定して献立を作成
              </p>
            </div>
          </a>

          {/* おまかせ献立 */}
          <a href="/meal-form/quick">
            <div className="bg-purple-500 text-white p-6 rounded-lg shadow-lg active:scale-95 transition-transform">
              <h3 className="text-xl font-bold mb-2">✨ おまかせ献立</h3>
              <p className="text-sm text-white/90">
                今すぐ作れる献立を自動で提案
              </p>
            </div>
          </a>

          {/* カメラで食材認識 */}
          <div className="bg-gray-400 text-white p-6 rounded-lg shadow-lg opacity-50">
            <h3 className="text-xl font-bold mb-2">📸 カメラで食材認識</h3>
            <p className="text-sm text-white/90">
              写真から食材を認識して献立提案（準備中）
            </p>
          </div>
        </div>

        <div className="mt-8 bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-800 mb-3">📋 最近の献立</h3>
          <p className="text-sm text-gray-500">まだ献立がありません</p>
        </div>
      </div>
    </div>
  );
}
