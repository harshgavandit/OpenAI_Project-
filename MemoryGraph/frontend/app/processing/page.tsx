'use client';

import { AppShell } from '@/app/components/AppShell';
import { useAuth } from '@/app/context/AuthContext';
import { API_URL, authHeaders } from '@/app/lib/api';
import { loginPathWithNext } from '@/app/lib/authRedirect';
import { LOADING_APP } from '@/app/lib/productCopy';
import { ProcessingStages } from '@/app/components/ProcessingStages';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface QueueItem {
  memory_id: string;
  title: string;
  status: string;
  processing_stage: string;
  processing_error?: string | null;
  updated_at?: string | null;
}

export default function ProcessingPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<QueueItem[]>([]);

  const load = useCallback(async () => {
    const response = await fetch(`${API_URL}/memories/processing`, { credentials: 'include', headers: authHeaders() });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    setItems(data.items || []);
  }, []);

  useEffect(() => {
    if (!isLoading && !user) router.replace(loginPathWithNext('/processing'));
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    void load();
    const id = window.setInterval(load, 8000);
    return () => window.clearInterval(id);
  }, [user, load]);

  const retry = async (memoryId: string) => {
    await fetch(`${API_URL}/memories/${memoryId}/retry`, { method: 'POST', credentials: 'include', headers: authHeaders() });
    await load();
  };

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f0df]">
        <p className="text-sm text-slate-600">{LOADING_APP}</p>
      </main>
    );
  }

  return (
    <AppShell surface="studio" userName={user.full_name} userEmail={user.email} onLogout={logout}>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-950">Processing queue</h1>
        <p className="mt-2 text-sm text-slate-600">Uploads being organized. This page refreshes every few seconds.</p>
        {items.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">All caught up — nothing processing.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {items.map((item) => (
              <li key={item.memory_id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-950">{item.title || item.memory_id}</p>
                    <ProcessingStages stage={item.processing_stage} status={item.status} />
                    {item.processing_error && <p className="mt-2 text-sm text-red-700">{item.processing_error}</p>}
                  </div>
                  {item.status === 'failed' && (
                    <button type="button" onClick={() => void retry(item.memory_id)} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white">
                      Retry
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        <Link href="/memories" className="mt-6 inline-block text-sm font-semibold text-amber-800">
          Open memory library →
        </Link>
      </section>
    </AppShell>
  );
}
