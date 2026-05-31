'use client';

import { API_URL, authHeaders } from '@/app/lib/api';
import { useCallback, useEffect, useState } from 'react';

type InviteRow = {
  invite_id: string;
  recipient_email?: string;
  recipient_name?: string;
  status: string;
  invite_link: string;
};

export function InviteManager() {
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [recipientName, setRecipientName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(`${API_URL}/invites`, { credentials: 'include', headers: authHeaders() });
    if (!response.ok) return;
    const data = await response.json();
    setInvites(data.invites || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createInvite = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch(`${API_URL}/invites`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ recipient_name: recipientName, relationship }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Could not create invite');
      const link = `${window.location.origin}${data.invite_link}`;
      await navigator.clipboard.writeText(link);
      setNotice('Invite link copied to clipboard.');
      setRecipientName('');
      setRelationship('');
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Invite failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">Family invites</h2>
      <p className="mt-1 text-sm text-slate-600">Invite relatives to view and add to your shared archive.</p>
      {notice && <p className="mt-3 text-sm text-emerald-800">{notice}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          placeholder="Their name"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Relationship (e.g. cousin)"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void createInvite()}
          className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Create invite link
        </button>
      </div>
      <ul className="mt-6 space-y-2">
        {invites.length === 0 ? (
          <li className="text-sm text-slate-500">No invites yet.</li>
        ) : (
          invites.map((invite) => (
            <li key={invite.invite_id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
              <span className="font-semibold text-slate-900">{invite.recipient_name || 'Family member'}</span>
              <span className="text-slate-500"> · {invite.status}</span>
              <p className="mt-1 break-all text-xs text-slate-500">{invite.invite_link}</p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
