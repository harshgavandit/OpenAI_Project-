'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { API_URL } from '@/app/lib/api';

interface PublicTree {
  title: string;
  tree: {
    people: Array<{ name: string; role?: string; memory_count?: number; photo_url?: string | null }>;
    relationships: Array<{ person_a: string; relation: string; person_b: string }>;
  };
}

export default function PublicFamilyTreePage() {
  const params = useParams<{ token: string }>();
  const [tree, setTree] = useState<PublicTree | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/public/family-tree/${params.token}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(await response.text());
        return response.json();
      })
      .then(setTree)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [params.token]);

  return (
    <main className="min-h-screen bg-[#f6f0df] px-4 py-14 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">Shared family tree</p>
        <h1 className="mt-4 text-center text-5xl font-bold">{tree?.title || 'Opening family tree'}</h1>
        {error && <p className="mt-8 rounded-lg bg-red-50 p-4 text-center text-sm text-red-700">{error}</p>}
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {(tree?.tree.people || []).map((person) => (
            <div key={person.name} className="rounded-lg border border-slate-200 bg-white p-5 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-50 text-xl font-bold text-cyan-800">{person.name.slice(0, 1)}</div>
              <h2 className="mt-3 text-xl font-bold">{person.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{person.role || 'Family'} · {person.memory_count || 0} memories</p>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-lg bg-white p-5 shadow-sm">
          <h2 className="font-bold">Relationships</h2>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {(tree?.tree.relationships || []).map((relationship) => (
              <div key={`${relationship.person_a}-${relationship.relation}-${relationship.person_b}`} className="rounded-lg bg-slate-50 p-3 text-sm">
                <strong>{relationship.person_a}</strong> is {relationship.relation} of <strong>{relationship.person_b}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
