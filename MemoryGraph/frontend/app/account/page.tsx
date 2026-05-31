'use client';

import { AppShell } from '@/app/components/AppShell';
import { useAuth } from '@/app/context/AuthContext';
import { API_URL, authHeaders } from '@/app/lib/api';
import { loginPathWithNext } from '@/app/lib/authRedirect';
import { LOADING_APP } from '@/app/lib/productCopy';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AccountPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [usage, setUsage] = useState<Record<string, number | string> | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [referral, setReferral] = useState<{ code: string; signups: number; share_url_path: string } | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.replace(loginPathWithNext('/account'));
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/usage/stats`, { credentials: 'include', headers: authHeaders() })
      .then((r) => r.json())
      .then(setUsage)
      .catch(() => setUsage(null));
    fetch(`${API_URL}/referrals/me`, { credentials: 'include', headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setReferral(data))
      .catch(() => setReferral(null));
  }, [user]);

  const startCheckout = async () => {
    const response = await fetch(`${API_URL}/billing/checkout`, {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders(),
    });
    const data = await response.json();
    if (data.url) window.location.href = data.url;
    else setNotice(data.message || 'Billing is not configured yet.');
  };

  const sendDigest = async () => {
    const response = await fetch(`${API_URL}/reports/weekly/digest`, {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders(),
    });
    const data = await response.json();
    setNotice(data.success ? 'Weekly digest sent to your email.' : 'Could not send digest.');
  };

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f0df]">
        <p className="text-sm text-slate-600">{LOADING_APP}</p>
      </main>
    );
  }

  return (
    <AppShell surface="trust" userName={user.full_name} userEmail={user.email} onLogout={logout}>
      <section className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-950">Account</h1>
          <p className="mt-2 text-sm text-slate-600">{user.email}</p>
          <p className="mt-1 text-sm text-slate-500">Plan: {user.plan}</p>
          {notice && <p className="mt-4 text-sm text-emerald-800">{notice}</p>}
        </div>
        {usage && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Usage today</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>Uploads: {usage.daily_uploads} / {usage.daily_upload_limit}</li>
              <li>Questions: {usage.daily_queries} / {usage.daily_query_limit}</li>
            </ul>
          </div>
        )}
        {referral && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">Invite friends</h2>
            <p className="mt-2 text-sm text-slate-600">
              Share your link — {referral.signups} signup{referral.signups === 1 ? '' : 's'} so far.
            </p>
            <p className="mt-3 break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-800">
              {typeof window !== 'undefined' ? `${window.location.origin}${referral.share_url_path}` : referral.share_url_path}
            </p>
          </div>
        )}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Family plan</h2>
          <p className="mt-2 text-sm text-slate-600">Upgrade for shared archives and collaboration.</p>
          <button type="button" onClick={() => void startCheckout()} className="mt-4 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white">
            Upgrade with Stripe
          </button>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Email</h2>
          <button type="button" onClick={() => void sendDigest()} className="mt-3 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">
            Send weekly digest now
          </button>
        </div>
        <p className="text-sm text-slate-500">
          Privacy tools live in <Link href="/settings" className="font-semibold text-amber-800">Settings</Link>.
        </p>
      </section>
    </AppShell>
  );
}
