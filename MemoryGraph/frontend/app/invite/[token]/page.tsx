'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { API_URL, authHeaders } from '@/app/lib/api';
import { setArchiveOwnerId } from '@/app/lib/archiveContext';

type InvitePreview = {
  invite_token: string;
  owner_name: string;
  recipient_name?: string;
  relationship?: string;
  expires_at?: string;
};

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${API_URL}/invites/public/${token}`);
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.detail || 'Invite not found');
        }
        if (!cancelled) setInvite(await response.json());
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Invite unavailable');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const acceptInvite = async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/invites/${token}/accept`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || 'Could not accept invite');
      if (body.owner_id) setArchiveOwnerId(body.owner_id);
      setSuccess(`You now have contributor access to ${body.owner_name || 'this family archive'}.`);
      window.setTimeout(() => router.push('/studio'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Accept failed');
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-50 to-slate-100 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Family archive invite</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Join a shared memory archive</h1>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        {success && <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p>}

        {invite && !success && (
          <div className="mt-6 space-y-3 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-900">{invite.owner_name}</span> invited you
              {invite.recipient_name ? ` (${invite.recipient_name})` : ''} to contribute to their MemoryGraph archive.
            </p>
            {invite.relationship && <p>Relationship: {invite.relationship}</p>}
            {invite.expires_at && <p>Expires: {new Date(invite.expires_at).toLocaleString()}</p>}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {!isAuthenticated ? (
            <>
              <Link href={`/auth/login?next=/invite/${token}`} className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                Sign in to accept
              </Link>
              <Link href={`/auth/register?next=/invite/${token}`} className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700">
                Create account
              </Link>
            </>
          ) : (
            <button
              type="button"
              disabled={busy || !invite}
              onClick={() => void acceptInvite()}
              className="rounded-lg bg-cyan-700 px-4 py-3 text-sm font-semibold text-white disabled:bg-slate-300"
            >
              {busy ? 'Accepting...' : `Accept as ${user?.full_name || user?.email}`}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
