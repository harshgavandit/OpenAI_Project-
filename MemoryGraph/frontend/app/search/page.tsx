'use client';

import { AppShell } from '@/app/components/AppShell';
import { useAuth } from '@/app/context/AuthContext';
import { API_URL, authHeaders } from '@/app/lib/api';
import { getArchiveOwnerId } from '@/app/lib/archiveContext';
import { loginPathWithNext } from '@/app/lib/authRedirect';
import { LOADING_APP } from '@/app/lib/productCopy';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface SearchHit {
  memory_id: string;
  title?: string;
  summary?: string;
}

export default function SearchPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [person, setPerson] = useState('');
  const [year, setYear] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace(loginPathWithNext('/search'));
  }, [isLoading, user, router]);

  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setBusy(true);
    setError(null);
    try {
      const owner = getArchiveOwnerId();
      const params = new URLSearchParams({ query: q, limit: '24' });
      if (owner) params.set('owner_id', owner);
      if (person.trim()) params.set('person', person.trim());
      if (year.trim()) params.set('year', year.trim());
      const response = await fetch(`${API_URL}/memories/search?${params}`, {
        credentials: 'include',
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [query, person, year]);

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f0df]">
        <p className="text-sm text-slate-600">{LOADING_APP}</p>
      </main>
    );
  }

  return (
    <AppShell surface="ask" userName={user.full_name} userEmail={user.email} onLogout={logout}>
      <section className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Search archive</h1>
          <p className="mt-2 text-sm text-slate-600">Find memories by people, places, years, or phrases.</p>
        </div>
        <form
          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            void runSearch();
          }}
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. grandfather Mumbai wedding"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <input
              value={person}
              onChange={(event) => setPerson(event.target.value)}
              placeholder="Person"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm min-w-[120px]"
            />
            <input
              value={year}
              onChange={(event) => setYear(event.target.value)}
              placeholder="Year"
              className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? 'Searching…' : 'Search'}
            </button>
          </div>
        </form>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <ul className="space-y-3">
          {results.map((hit) => (
            <li key={hit.memory_id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="font-semibold text-slate-950">{hit.title || 'Untitled'}</h2>
              <p className="mt-1 text-sm text-slate-600 line-clamp-3">{hit.summary}</p>
              <Link href={`/memories/${hit.memory_id}`} className="mt-2 inline-block text-xs font-semibold text-amber-800">
                Open memory →
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
