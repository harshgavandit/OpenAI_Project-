'use client';

import { AppShell } from '@/app/components/AppShell';
import { useAuth } from '@/app/context/AuthContext';
import { API_URL, authHeaders } from '@/app/lib/api';
import { loginPathWithNext } from '@/app/lib/authRedirect';
import { LOADING_APP } from '@/app/lib/productCopy';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  memory_id?: string;
}

export default function NotificationsPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);

  const load = useCallback(async () => {
    const response = await fetch(`${API_URL}/notifications`, { credentials: 'include', headers: authHeaders() });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    setItems(data.notifications || []);
  }, []);

  useEffect(() => {
    if (!isLoading && !user) router.replace(loginPathWithNext('/notifications'));
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    void load().catch(() => setItems([]));
  }, [user, load]);

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
        <h1 className="text-3xl font-bold text-slate-950">Notifications</h1>
        <p className="mt-2 text-sm text-slate-600">Processing updates and items that need your attention.</p>
        <ul className="mt-6 space-y-3">
          {items.length === 0 ? (
            <li className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              You&apos;re all caught up.
            </li>
          ) : (
            items.map((item) => (
              <li key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">{item.type.replace(/_/g, ' ')}</p>
                <p className="mt-1 font-semibold text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600">{item.body}</p>
                {item.memory_id && (
                  <Link href={`/memories/${item.memory_id}`} className="mt-2 inline-block text-sm font-semibold text-amber-800">
                    Open memory →
                  </Link>
                )}
              </li>
            ))
          )}
        </ul>
      </section>
    </AppShell>
  );
}
