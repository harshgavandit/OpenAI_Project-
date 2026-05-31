'use client';

import { API_URL, authHeaders } from '@/app/lib/api';
import { ARCHIVE_CHANGE_EVENT, getArchiveOwnerId, setArchiveOwnerId } from '@/app/lib/archiveContext';
import { useEffect, useState } from 'react';

type SharedArchive = { owner_id: string; owner_name: string; role: string };

export function SharedArchiveSwitcher() {
  const [archives, setArchives] = useState<SharedArchive[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    setActive(getArchiveOwnerId());
    const sync = () => setActive(getArchiveOwnerId());
    window.addEventListener(ARCHIVE_CHANGE_EVENT, sync);
    return () => window.removeEventListener(ARCHIVE_CHANGE_EVENT, sync);
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/family/shared-archives`, { credentials: 'include', headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : { archives: [] }))
      .then((data) => setArchives(data.archives || []))
      .catch(() => setArchives([]));
  }, []);

  if (archives.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50/80 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-800">Shared archives</p>
      <select
        className="mt-2 w-full rounded-lg border border-cyan-200 bg-white px-2 py-2 text-xs font-medium text-slate-800"
        value={active || ''}
        onChange={(event) => {
          const value = event.target.value;
          setArchiveOwnerId(value || null);
          setActive(value || null);
        }}
      >
        <option value="">My archive</option>
        {archives.map((archive) => (
          <option key={archive.owner_id} value={archive.owner_id}>
            {archive.owner_name} ({archive.role})
          </option>
        ))}
      </select>
    </div>
  );
}
