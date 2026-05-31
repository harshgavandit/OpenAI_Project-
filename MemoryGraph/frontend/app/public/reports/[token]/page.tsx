'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { API_URL } from '@/app/lib/api';

interface PublicReport {
  title: string;
  recipient_type: string;
  subject: string;
  body: string;
  summary: {
    memory_count?: number;
    relationship_count?: number;
    timeline_years?: number[];
    top_people?: string[];
    top_places?: string[];
    highlights?: Array<{ title: string; summary: string }>;
  };
  created_at: string;
}

export default function PublicReportPage() {
  const params = useParams<{ token: string }>();
  const [report, setReport] = useState<PublicReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.token) return;
    fetch(`${API_URL}/public/reports/${params.token}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(await response.text());
        return response.json();
      })
      .then(setReport)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [params?.token]);

  return (
    <main className="min-h-screen bg-[#f6f1e8] px-4 py-12 text-slate-950">
      <section className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-xl">
        <div className="bg-slate-950 p-8 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-yellow-400">MemoryGraph Family Letter</p>
          <h1 className="mt-4 text-4xl font-black">{report?.title || 'Opening family letter'}</h1>
          <p className="mt-3 text-sm text-slate-300">{report?.recipient_type || 'Shared report'}</p>
        </div>
        <div className="p-8">
          {error && <p className="rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
          {report && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-4"><strong className="block text-3xl">{report.summary.memory_count || 0}</strong><span className="text-sm text-slate-500">Memories</span></div>
                <div className="rounded-lg bg-slate-50 p-4"><strong className="block text-3xl">{report.summary.relationship_count || 0}</strong><span className="text-sm text-slate-500">Connections</span></div>
                <div className="rounded-lg bg-slate-50 p-4"><strong className="block text-3xl">{report.summary.timeline_years?.length || 0}</strong><span className="text-sm text-slate-500">Years</span></div>
              </div>
              <pre className="mt-8 whitespace-pre-wrap text-base leading-8 text-slate-700">{report.body}</pre>
              <div className="mt-8 border-t border-slate-200 pt-6">
                <h2 className="text-xl font-bold">Highlights</h2>
                <div className="mt-4 space-y-3">
                  {(report.summary.highlights || []).slice(0, 4).map((item) => (
                    <div key={item.title} className="rounded-lg bg-slate-50 p-4">
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{item.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          <Link href="/" className="mt-8 inline-flex rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">
            Learn about MemoryGraph
          </Link>
        </div>
      </section>
    </main>
  );
}
