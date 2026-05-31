'use client';

import { AppShell } from '@/app/components/AppShell';
import { MemoryGrid } from '@/app/components/MemoryGrid';
import { useAuth } from '@/app/context/AuthContext';
import { API_URL, authHeaders } from '@/app/lib/api';
import { getArchiveOwnerId } from '@/app/lib/archiveContext';
import type { BootstrapMemory } from '@/app/lib/bootstrapTypes';
import { loginPathWithNext } from '@/app/lib/authRedirect';
import { LOADING_APP } from '@/app/lib/productCopy';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

function MemoriesLibrary() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const highlight = params.get('highlight');
  const [memories, setMemories] = useState<BootstrapMemory[]>([]);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<BootstrapMemory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [personFilter, setPersonFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  const load = useCallback(async () => {
    const owner = getArchiveOwnerId();
    const query = new URLSearchParams();
    if (owner) query.set('owner_id', owner);
    if (statusFilter) query.set('status', statusFilter);
    if (personFilter) query.set('person', personFilter);
    if (yearFilter) query.set('year', yearFilter);
    query.set('limit', '120');
    const response = await fetch(`${API_URL}/memories?${query}`, { credentials: 'include', headers: authHeaders() });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    setMemories(data.memories || []);
    setTotal(data.total ?? data.memories?.length ?? 0);
  }, [statusFilter, personFilter, yearFilter]);

  useEffect(() => {
    if (!isLoading && !user) router.replace(loginPathWithNext('/memories'));
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    void load().catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [user, load]);

  const saveEdit = async () => {
    if (!editing) return;
    const response = await fetch(`${API_URL}/memories/${editing.memory_id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ title: editing.title, summary: editing.summary }),
    });
    if (!response.ok) throw new Error(await response.text());
    setEditing(null);
    await load();
  };

  const bulkUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBulkBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));
      const owner = getArchiveOwnerId();
      if (owner) formData.append('archive_owner_id', owner);
      const response = await fetch(`${API_URL}/memories/bulk-upload`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: formData,
      });
      if (!response.ok) throw new Error(await response.text());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBulkBusy(false);
    }
  };

  const retry = async (memoryId: string) => {
    await fetch(`${API_URL}/memories/${memoryId}/retry`, {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders(),
    });
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
        <h1 className="text-3xl font-bold text-slate-950">Memory library</h1>
        <p className="mt-2 text-sm text-slate-600">
          {total} memories in your archive. Browse, filter, edit, and import in bulk.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All statuses</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
          <input
            placeholder="Filter by person"
            value={personFilter}
            onChange={(e) => setPersonFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Year e.g. 1978"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-950">
            {bulkBusy ? 'Uploading…' : 'Bulk import'}
            <input type="file" multiple className="hidden" disabled={bulkBusy} onChange={(e) => void bulkUpload(e.target.files)} />
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        <div className="mt-6">
          {memories.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              No memories yet. <Link href="/studio" className="font-semibold text-amber-800">Add your first memory</Link>.
            </p>
          ) : (
            <MemoryGrid memories={memories} highlightId={highlight} onEdit={setEditing} onRetry={(id) => void retry(id)} />
          )}
        </div>
      </section>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold">Edit memory</h3>
            <input
              className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />
            <textarea
              className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={4}
              value={editing.summary}
              onChange={(e) => setEditing({ ...editing, summary: e.target.value })}
            />
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => void saveEdit()} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                Save
              </button>
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function MemoriesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f6f0df]" />}>
      <MemoriesLibrary />
    </Suspense>
  );
}
