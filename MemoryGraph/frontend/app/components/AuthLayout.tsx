'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f6f0df] px-4 py-12 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-md flex-col justify-center">
        <Link href="/" className="mb-4 text-center text-lg font-bold text-slate-950 hover:text-amber-800">
          MemoryGraph
        </Link>
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
          <Link href="/features" className="hover:text-amber-800">Features</Link>
          {' · '}
          <Link href="/pricing" className="hover:text-amber-800">Pricing</Link>
          {' · '}
          <Link href="/" className="hover:text-amber-800">Back to website</Link>
        </p>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>}
      </div>
    </div>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
      {message}
    </div>
  );
}

export function AuthNotice({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
      {message}
    </div>
  );
}

export const authInputClass =
  'mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100';

export const authPrimaryButtonClass =
  'w-full rounded-xl bg-slate-950 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-300';

export const authSecondaryButtonClass =
  'w-full rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50';
