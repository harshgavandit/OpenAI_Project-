'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { API_URL } from '@/app/lib/api';

type CapsulePublic = {
  title: string;
  recipient_name: string | null;
  unlock_at: string | null;
  locked: boolean;
  message: string | null;
};

export default function PublicCapsulePage() {
  const params = useParams();
  const token = typeof params.token === 'string' ? params.token : '';
  const [capsule, setCapsule] = useState<CapsulePublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const response = await fetch(`${API_URL}/public/capsules/${encodeURIComponent(token)}`);
        if (!response.ok) throw new Error('Capsule not found');
        setCapsule(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load capsule');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <main className="min-h-screen bg-[#f6f0df] px-4 py-16 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-white p-8 shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">Memory Capsule</p>
        {loading && <p className="mt-6 text-slate-500">Opening capsule…</p>}
        {error && (
          <>
            <h1 className="mt-4 text-2xl font-bold">Capsule unavailable</h1>
            <p className="mt-3 text-sm text-slate-600">{error}</p>
          </>
        )}
        {capsule && (
          <>
            <h1 className="mt-4 text-3xl font-bold">{capsule.title}</h1>
            {capsule.recipient_name && (
              <p className="mt-2 text-sm text-slate-600">For {capsule.recipient_name}</p>
            )}
            {capsule.locked ? (
              <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-6">
                <p className="font-semibold text-amber-900">This capsule is still locked.</p>
                {capsule.unlock_at && (
                  <p className="mt-2 text-sm text-amber-800">
                    Unlocks on {new Date(capsule.unlock_at).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-6 text-base leading-8 text-slate-800 whitespace-pre-wrap">
                {capsule.message || 'This capsule is ready but has no message yet.'}
              </div>
            )}
          </>
        )}
        <Link href="/" className="mt-8 inline-block text-sm font-semibold text-cyan-700 hover:text-cyan-900">
          ← MemoryGraph home
        </Link>
      </div>
    </main>
  );
}
