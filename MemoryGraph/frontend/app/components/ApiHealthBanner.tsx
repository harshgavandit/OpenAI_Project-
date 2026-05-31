'use client';

import { API_URL } from '@/app/lib/api';
import { useEffect, useState } from 'react';

export function ApiHealthBanner() {
  const [down, setDown] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 8000);
        const response = await fetch(`${API_URL}/health`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        window.clearTimeout(timeoutId);
        if (!cancelled) setDown(!response.ok);
      } catch {
        if (!cancelled) setDown(true);
      }
    };
    void check();
    const id = window.setInterval(check, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (!down) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-950" role="status">
      We cannot reach the MemoryGraph API. Start the backend or check your connection, then refresh.
    </div>
  );
}
