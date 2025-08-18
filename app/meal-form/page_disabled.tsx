export default function DisabledPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">このページは一時的に無効化されています</h1>
      <p>基本動作確認のため、meal-formは一時的に無効化されています。</p>
      <a href="/" className="text-blue-500 underline">ホームに戻る</a>
    </div>
  );
}
