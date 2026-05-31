'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MemoryProofList, type MemoryProofItem } from '@/app/components/MemoryProofCard';

import { API_URL } from '@/app/lib/api';

type PublicStory = {
  title: string;
  person: string;
  owner_name?: string;
  memory_dna?: { core_values: string[]; what_shaped_them: string };
  chapters?: Array<{ title: string; narrative: string }>;
  proof?: MemoryProofItem[];
  read_only?: boolean;
  shared_at?: string;
};

export default function PublicOneLifeStoryPage() {
  const params = useParams();
  const token = typeof params.token === 'string' ? params.token : '';
  const [story, setStory] = useState<PublicStory | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const response = await fetch(`${API_URL}/public/one-life-story/${encodeURIComponent(token)}`);
        if (!response.ok) throw new Error('Story not found');
        setStory(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load story');
      }
    })();
  }, [token]);

  return (
    <main className="min-h-screen bg-[#f6f0df] px-4 py-12 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-yellow-700">Shared life story</p>
        {error && <p className="text-red-700">{error}</p>}
        {story && (
          <>
            <h1 className="text-4xl font-bold">{story.title}</h1>
            {story.owner_name && <p className="text-slate-600">Shared by {story.owner_name}</p>}
            {story.memory_dna && (
              <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm leading-7">{story.memory_dna.what_shaped_them}</p>
            )}
            <div className="space-y-4">
              {(story.chapters || []).map((chapter) => (
                <article key={chapter.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-bold">{chapter.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{chapter.narrative}</p>
                </article>
              ))}
            </div>
            {story.proof && story.proof.length > 0 && (
              <MemoryProofList proofs={story.proof} title="Source memories (Memory Proof)" />
            )}
          </>
        )}
        <Link href="/" className="inline-block text-sm font-semibold text-cyan-700 hover:text-cyan-900">
          ← MemoryGraph home
        </Link>
      </div>
    </main>
  );
}
