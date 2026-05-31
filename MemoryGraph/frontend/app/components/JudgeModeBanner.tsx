'use client';

/**
 * Developer-only status — hidden from normal users.
 * Show with ?debug=1 in the URL.
 */

import { useEffect, useState } from 'react';
import { API_URL } from '@/app/lib/api';

type AiStatus = {
  provider: string;
  reachable: boolean;
  chat_model?: string;
};

export function JudgeModeBanner({
  memoryCount,
  proofEnabled = true,
  authed = false,
}: {
  memoryCount: number;
  proofEnabled?: boolean;
  authed?: boolean;
}) {
  const [show, setShow] = useState(false);
  const [ai, setAi] = useState<AiStatus | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setShow(params.get('debug') === '1' || process.env.NEXT_PUBLIC_SHOW_DEBUG === '1');
  }, []);

  useEffect(() => {
    if (!show || !authed) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/ai/status`);
        if (!cancelled && res.ok) setAi(await res.json());
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [show, authed]);

  if (!show) return null;

  const aiLabel = ai?.reachable ? `AI ready` : `Basic mode (AI offline)`;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600">
      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-white">Debug</span>
      <span>{memoryCount} memories</span>
      {proofEnabled && <span>Sources on</span>}
      <span>{aiLabel}</span>
    </div>
  );
}
