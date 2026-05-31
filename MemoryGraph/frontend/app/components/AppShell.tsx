'use client';

import {
  familySubNav,
  pageMetaForSurface,
  primaryNav,
  settingsNav,
  storiesSubNav,
} from '@/app/lib/navigation';
import { SharedArchiveSwitcher } from '@/app/components/SharedArchiveSwitcher';
import type { MemorySurface } from '@/app/lib/memoryTypes';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

const primaryIcons: Record<string, string> = {
  home: '⌂',
  ask: '◆',
  stories: '☰',
  family: '◎',
};

function NavLink({
  href,
  label,
  active,
  compact,
}: {
  href: string;
  label: string;
  active: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-xl transition ${
        compact ? 'px-3 py-2.5 text-center' : 'px-3 py-3'
      } ${
        active
          ? 'bg-amber-50 text-amber-950 ring-1 ring-amber-200'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
      }`}
    >
      <span className={`block font-bold ${compact ? 'text-[11px]' : 'text-sm'}`}>{label}</span>
    </Link>
  );
}

export function AppShell({
  surface,
  userName,
  userEmail,
  onLogout,
  children,
  hero,
}: {
  surface: MemorySurface;
  userName?: string | null;
  userEmail?: string | null;
  onLogout: () => void;
  children: ReactNode;
  hero?: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const meta = pageMetaForSurface(surface);

  const storiesActive = storiesSubNav.some((item) => pathname === item.href || item.surface === surface);
  const familyActive = familySubNav.some((item) => pathname === item.href || item.surface === surface);

  return (
    <div className="relative z-10 flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 overflow-y-auto border-r border-slate-200/80 bg-white/95 p-4 shadow-sm backdrop-blur-xl lg:block">
        <Link href="/studio" className="block rounded-2xl bg-gradient-to-br from-slate-950 to-slate-800 p-4 text-white">
          <p className="text-xs font-medium text-amber-200/90">MemoryGraph</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight">Your family memories</h1>
          <p className="mt-2 text-xs leading-5 text-slate-300">Explore, ask, and share what matters.</p>
        </Link>
        <nav className="mt-5 space-y-1" aria-label="Main">
          {primaryNav.map((item) => {
            const active =
              pathname === item.href ||
              surface === item.surface ||
              (item.primary === 'stories' && storiesActive) ||
              (item.primary === 'family' && familyActive);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-3 py-3 transition ${
                  active
                    ? 'bg-amber-50 text-amber-950 ring-1 ring-amber-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`}
              >
                <span className="block text-sm font-bold">{item.label}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{item.description}</span>
              </Link>
            );
          })}
        </nav>
        {(storiesActive || familyActive) && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {familyActive ? 'In Family' : 'In Stories'}
            </p>
            <div className="mt-2 space-y-0.5">
              {(familyActive ? familySubNav : storiesSubNav).map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  active={pathname === item.href || surface === item.surface}
                />
              ))}
            </div>
          </div>
        )}
        <SharedArchiveSwitcher />
        <div className="mt-6 border-t border-slate-100 pt-4 space-y-0.5">
          <Link href="/archive" className={`block rounded-xl px-3 py-2 text-sm font-semibold ${pathname === '/archive' ? 'bg-slate-100' : 'text-slate-500 hover:bg-slate-50'}`}>
            Archive tools
          </Link>
          <Link href="/notifications" className={`block rounded-xl px-3 py-2 text-sm font-semibold ${pathname === '/notifications' ? 'bg-slate-100' : 'text-slate-500 hover:bg-slate-50'}`}>
            Notifications
          </Link>
          <Link href="/search" className={`block rounded-xl px-3 py-2 text-sm font-semibold ${pathname === '/search' ? 'bg-slate-100' : 'text-slate-500 hover:bg-slate-50'}`}>
            Search
          </Link>
          <Link href="/memories" className={`block rounded-xl px-3 py-2 text-sm font-semibold ${pathname === '/memories' ? 'bg-slate-100' : 'text-slate-500 hover:bg-slate-50'}`}>
            Library
          </Link>
          <Link href="/processing" className={`block rounded-xl px-3 py-2 text-sm font-semibold ${pathname === '/processing' ? 'bg-slate-100' : 'text-slate-500 hover:bg-slate-50'}`}>
            Processing
          </Link>
          <Link href="/account" className={`block rounded-xl px-3 py-2 text-sm font-semibold ${pathname === '/account' ? 'bg-slate-100' : 'text-slate-500 hover:bg-slate-50'}`}>
            Account
          </Link>
          <Link href="/getting-started" className={`block rounded-xl px-3 py-2 text-sm font-semibold ${pathname === '/getting-started' ? 'bg-slate-100' : 'text-slate-500 hover:bg-slate-50'}`}>
            Getting started
          </Link>
          <Link href="/help" className={`block rounded-xl px-3 py-2 text-sm font-semibold ${pathname === '/help' ? 'bg-slate-100' : 'text-slate-500 hover:bg-slate-50'}`}>
            Help
          </Link>
          <Link
            href="/settings"
            className={`block rounded-xl px-3 py-2.5 text-sm font-semibold ${
              pathname === '/settings' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Settings
          </Link>
        </div>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="truncate text-sm font-semibold text-slate-950">{userName || userEmail}</p>
          <button
            type="button"
            onClick={onLogout}
            className="mt-2 text-xs font-semibold text-slate-500 hover:text-slate-950"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex w-full flex-col lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href="/studio" className="text-lg font-bold text-slate-950">
              MemoryGraph
            </Link>
            <select
              aria-label="Go to page"
              value={pathname}
              onChange={(e) => router.push(e.target.value)}
              className="max-w-[52%] rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-semibold text-slate-700"
            >
              {primaryNav.map((item) => (
                <option key={item.href} value={item.href}>
                  {item.label}
                </option>
              ))}
              <option value="/archive">Archive tools</option>
              <option value="/settings">Settings</option>
            </select>
          </div>
        </header>

        <div className="w-full flex-1 space-y-6 px-4 py-5 pb-24 sm:px-6 lg:px-10 lg:pb-8 xl:px-12">
          {hero ?? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{meta.title}</h2>
              <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">{meta.description}</p>
            </section>
          )}
          {children}
        </div>

        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur lg:hidden"
          aria-label="Mobile"
        >
          <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
            {primaryNav.map((item) => {
              const active =
                pathname === item.href ||
                surface === item.surface ||
                (item.primary === 'stories' && storiesActive) ||
                (item.primary === 'family' && familyActive);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center rounded-xl py-2 ${
                    active ? 'text-amber-800' : 'text-slate-500'
                  }`}
                >
                  <span className="text-lg leading-none" aria-hidden>
                    {primaryIcons[item.primary || 'home']}
                  </span>
                  <span className="mt-1 text-[10px] font-bold">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
