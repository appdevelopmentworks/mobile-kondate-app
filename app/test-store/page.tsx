'use client';

import { useMealStore, testExport } from '@/lib/store';

export default function TestStorePage() {
  const count = useMealStore((state) => state.count);
  const resetForm = useMealStore((state) => state.resetForm);
  
  return (
    <div className="p-4">
      <h1>Store Test</h1>
      <p>Count: {count}</p>
      <p>Test Export: {testExport}</p>
      <button onClick={resetForm} className="bg-blue-500 text-white p-2 rounded">
        Reset
      </button>
    </div>
  );
}
