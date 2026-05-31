'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { API_URL } from '@/app/lib/api';

interface PublicStorybook {
  title: string;
  style: string;
  chapters: Array<{ chapter: number; title: string; summary: string; people?: string[]; places?: string[] }>;
}

export default function PublicStorybookPage() {
  const params = useParams<{ token: string }>();
  const [book, setBook] = useState<PublicStorybook | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/public/storybooks/${params.token}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(await response.text());
        return response.json();
      })
      .then(setBook)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [params.token]);

  return (
    <main className="min-h-screen bg-[#29231f] px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-yellow-400">MemoryGraph Storybook</p>
        <h1 className="mt-4 text-center text-5xl font-bold">{book?.title || 'Opening storybook'}</h1>
        {error && <p className="mt-8 rounded-lg bg-red-50 p-4 text-center text-sm text-red-700">{error}</p>}
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {(book?.chapters || []).map((chapter) => (
            <section key={chapter.chapter} className="rounded-lg border-8 border-yellow-700 bg-orange-50 p-6 text-slate-950 shadow-2xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700">Scene {chapter.chapter}</p>
              <h2 className="mt-2 text-3xl font-bold">{chapter.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-700">{chapter.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[...(chapter.people || []), ...(chapter.places || [])].slice(0, 6).map((chip) => (
                  <span key={chip} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">{chip}</span>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
