'use client';

import { AppShell } from '@/app/components/AppShell';
import { MemoryProofList } from '@/app/components/MemoryProofCard';
import type { MemoryProofItem } from '@/app/components/MemoryProofCard';
import { useAuth } from '@/app/context/AuthContext';
import { API_URL, authHeaders } from '@/app/lib/api';
import { getArchiveOwnerId } from '@/app/lib/archiveContext';
import { loginPathWithNext } from '@/app/lib/authRedirect';
import { LOADING_APP } from '@/app/lib/productCopy';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface MemoryDetail {
  memory_id: string;
  title?: string;
  summary?: string;
  raw_text?: string;
  status?: string;
  structured_data?: {
    people?: string[];
    places?: string[];
    events?: string[];
    dates?: string[];
    summary?: string;
  };
}

export default function MemoryDetailPage() {
  const params = useParams<{ id: string }>();
  const memoryId = params.id;
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [memory, setMemory] = useState<MemoryDetail | null>(null);
  const [proofs, setProofs] = useState<MemoryProofItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const owner = getArchiveOwnerId();
    const ownerQuery = owner ? `?owner_id=${encodeURIComponent(owner)}` : '';
    const [memRes, proofRes] = await Promise.all([
      fetch(`${API_URL}/memories/${memoryId}${ownerQuery}`, { credentials: 'include', headers: authHeaders() }),
      fetch(`${API_URL}/memory-proof/${memoryId}`, { credentials: 'include', headers: authHeaders() }),
    ]);
    if (!memRes.ok) throw new Error(await memRes.text());
    setMemory(await memRes.json());
    if (proofRes.ok) {
      const proofData = await proofRes.json();
      setProofs(proofData.proofs || (proofData.proof ? [proofData.proof] : []));
    }
  }, [memoryId]);

  useEffect(() => {
    if (!isLoading && !user) router.replace(loginPathWithNext(`/memories/${memoryId}`));
  }, [isLoading, user, router, memoryId]);

  useEffect(() => {
    if (!user || !memoryId) return;
    void load().catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [user, memoryId, load]);

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f0df]">
        <p className="text-sm text-slate-600">{LOADING_APP}</p>
      </main>
    );
  }

  const structured = memory?.structured_data || {};

  return (
    <AppShell surface="studio" userName={user.full_name} userEmail={user.email} onLogout={logout}>
      <div className="mb-4">
        <Link href="/memories" className="text-sm font-semibold text-amber-800">
          ← Back to library
        </Link>
      </div>
      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}
      {memory && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{memory.status}</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">{memory.title || 'Untitled memory'}</h1>
            <p className="mt-4 text-sm leading-7 text-slate-700">{memory.summary || structured.summary}</p>
            {memory.raw_text && (
              <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                {memory.raw_text.slice(0, 1200)}
                {memory.raw_text.length > 1200 ? '…' : ''}
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-2">
              {(structured.people || []).map((person) => (
                <span key={person} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                  {person}
                </span>
              ))}
              {(structured.places || []).map((place) => (
                <span key={place} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-900">
                  {place}
                </span>
              ))}
              {(structured.dates || []).map((date) => (
                <span key={date} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
                  {date}
                </span>
              ))}
            </div>
          </article>
          <aside className="space-y-4">
            {proofs.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <MemoryProofList proofs={proofs} title="Sources" />
              </div>
            )}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-slate-950">Actions</h2>
              <Link href={`/ask?q=${encodeURIComponent(`Tell me more about ${memory.title}`)}`} className="mt-3 block text-sm font-semibold text-amber-800">
                Ask about this memory →
              </Link>
              <Link href="/memories" className="mt-2 block text-sm font-semibold text-slate-600">
                Edit in library →
              </Link>
            </div>
          </aside>
        </div>
      )}
    </AppShell>
  );
}
