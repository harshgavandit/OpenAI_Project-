'use client';

import { useAuth } from '@/app/context/AuthContext';
import { loginPathWithNext, registerPathWithNext } from '@/app/lib/authRedirect';
import Link from 'next/link';

const steps = [
  { title: 'Add or sample memories', body: 'Upload files on Home or try the sample Patel family.', href: '/studio' },
  { title: 'Ask with sources', body: 'Every answer links to real memories you can open.', href: '/ask' },
  { title: 'Explore family map', body: 'See people and connections from your archive.', href: '/family' },
  { title: 'Share a story', body: 'Build chapters and share links with family.', href: '/stories' },
];

export default function GettingStartedPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const authed = !isLoading && isAuthenticated;

  return (
    <main className="min-h-screen bg-[#f6f0df] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold text-slate-950">Getting started</h1>
        <p className="mt-3 text-slate-600">Four steps to a living family archive.</p>
        <ol className="mt-10 space-y-6">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-600 font-bold text-white">{index + 1}</span>
              <div>
                <h2 className="text-lg font-bold text-slate-950">{step.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{step.body}</p>
                {authed ? (
                  <Link href={step.href} className="mt-3 inline-block text-sm font-semibold text-amber-800">
                    Go →
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
        {!authed && (
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={registerPathWithNext('/studio')} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
              Create account
            </Link>
            <Link href={loginPathWithNext('/studio')} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold">
              Sign in
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
