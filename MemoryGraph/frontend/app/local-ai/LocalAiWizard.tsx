'use client';

import { API_URL } from '@/app/lib/api';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type SetupStatus = {
  ollama_available: boolean;
  openai_configured: boolean;
  active_provider?: string;
  recommended_steps: string[];
};

export function LocalAiWizard() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/local-ai/setup`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('Could not load AI setup status');
        return r.json();
      })
      .then(setStatus)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-950">Local AI setup</h2>
      <p className="mt-2 text-sm text-slate-600">Run models on your machine for private, low-cost answers.</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {status && (
        <ul className="mt-6 space-y-2 text-sm text-slate-700">
          <li>Ollama: {status.ollama_available ? '✓ connected' : '○ not detected'}</li>
          <li>OpenAI fallback: {status.openai_configured ? '✓ configured' : '○ optional'}</li>
          <li>Active provider: {status.active_provider || 'fallback'}</li>
        </ul>
      )}
      {status?.recommended_steps && (
        <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm text-slate-600">
          {status.recommended_steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
      <Link href="/studio" className="mt-8 inline-flex rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
        Open studio
      </Link>
    </section>
  );
}
