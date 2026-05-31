'use client';

import { useAuth } from '@/app/context/AuthContext';
import { API_URL, authHeaders } from '@/app/lib/api';
import { loginPathWithNext } from '@/app/lib/authRedirect';
import { LOADING_APP } from '@/app/lib/productCopy';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface PersonDetail {
  name: string;
  role: string;
  biography: string;
  places: string[];
  years: string[];
  events: string[];
  memories: Array<{ memory_id: string; title: string; summary: string; raw_text?: string }>;
  relationships: Array<{ relationship_id: string; person_a: string; relation: string; person_b: string; notes?: string | null }>;
}

export default function PersonDetailPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    if (pathname.startsWith('/auth/')) return;
    router.replace(loginPathWithNext(pathname));
  }, [isAuthenticated, isLoading, pathname, router]);

  useEffect(() => {
    if (!isAuthenticated || !params?.id) return;
    fetch(`${API_URL}/people/${encodeURIComponent(params.id)}`, {
      credentials: 'include',
      headers: authHeaders(),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(await response.text());
        return response.json();
      })
      .then(setPerson)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [params?.id, isAuthenticated]);

  const askPerson = async () => {
    if (!person || !question.trim()) return;
    setError(null);
    const response = await fetch(`${API_URL}/people/${encodeURIComponent(person.name)}/ask`, {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ question }),
    });
    if (!response.ok) {
      setError(await response.text());
      return;
    }
    const data = await response.json();
    setAnswer(data.answer || '');
  };

  if (isLoading || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f0df] p-6">
        <p className="text-sm font-medium text-slate-600">{LOADING_APP}</p>
      </main>
    );
  }

  if (error && !person) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <p className="text-sm text-red-700">{error}</p>
        <Link href="/family" className="mt-4 inline-block text-sm font-semibold text-amber-800">
          Back to family
        </Link>
      </main>
    );
  }

  if (!person) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f0df] p-6">
        <p className="text-sm font-medium text-slate-600">{LOADING_APP}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f0df] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/family" className="text-sm font-semibold text-amber-800 hover:text-amber-900">
          ← Family
        </Link>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold text-amber-800">{person.role}</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">{person.name}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">{person.biography}</p>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Ask about {person.name}</h2>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder={`What should I know about ${person.name}?`}
          />
          <button
            type="button"
            onClick={() => void askPerson()}
            className="mt-3 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Ask
          </button>
          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
          {answer && <p className="mt-4 text-sm leading-7 text-slate-700">{answer}</p>}
        </section>
        {person.memories.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">Memories</h2>
            <ul className="mt-4 space-y-3">
              {person.memories.map((memory) => (
                <li key={memory.memory_id} className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-950">{memory.title}</p>
                  {memory.summary && <p className="mt-1">{memory.summary}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
        {person.relationships.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">Relationships</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {person.relationships.map((rel) => (
                <li key={rel.relationship_id}>
                  {rel.person_a} — {rel.relation.replaceAll('_', ' ')} — {rel.person_b}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
