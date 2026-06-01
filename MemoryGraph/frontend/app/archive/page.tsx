'use client';
// Updated by GitHub contribution automation.

import { AppShell } from '@/app/components/AppShell';
import { useAuth } from '@/app/context/AuthContext';
import { loginPathWithNext } from '@/app/lib/authRedirect';
import { LOADING_APP } from '@/app/lib/productCopy';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const tools = [
  { href: '/search', title: 'Search', description: 'Find memories by people, places, or phrases.' },
  { href: '/memories', title: 'Library', description: 'Browse, edit, and bulk-import your archive.' },
  { href: '/processing', title: 'Processing', description: 'See uploads being organized.' },
  { href: '/notifications', title: 'Notifications', description: 'Failed items and processing updates.' },
  { href: '/account', title: 'Account', description: 'Usage, billing, referrals, and digest.' },
  { href: '/settings', title: 'Settings', description: 'Privacy, export, and family invites.' },
  { href: '/getting-started', title: 'Getting started', description: 'Four steps to a living archive.' },
  { href: '/help', title: 'Help', description: 'Answers to common questions.' },
];

export default function ArchiveHubPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace(loginPathWithNext('/archive'));
  }, [isLoading, user, router]);

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
        <h1 className="text-3xl font-bold text-slate-950">Archive tools</h1>
        <p className="mt-2 text-sm text-slate-600">Library, search, account, and more.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 transition hover:border-amber-200 hover:bg-amber-50/40"
            >
              <h2 className="font-bold text-slate-950">{tool.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{tool.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
