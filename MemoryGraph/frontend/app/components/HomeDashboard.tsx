'use client';

import type { BootstrapMemory } from '@/app/lib/bootstrapTypes';
import Link from 'next/link';

export function HomeDashboard({
  memoryCount,
  peopleCount,
  yearSpan,
  processingCount,
  recentMemories,
  onAsk,
  onUploadFocus,
}: {
  memoryCount: number;
  peopleCount: number;
  yearSpan: string;
  processingCount: number;
  recentMemories: BootstrapMemory[];
  onAsk: () => void;
  onUploadFocus?: () => void;
}) {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-cyan-50/40 p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Your archive</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          Ask your family anything — with real sources
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          {memoryCount > 0
            ? `${memoryCount} memories across ${peopleCount} people${yearSpan ? ` · ${yearSpan}` : ''}.`
            : 'Upload photos and letters, or explore the sample Patel family archive to see how it works.'}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onAsk}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Ask a question
          </button>
          {onUploadFocus && (
            <button
              type="button"
              onClick={onUploadFocus}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Add memory
            </button>
          )}
          <Link href="/search" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            Search archive
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Memories', value: memoryCount, href: '/memories' },
          { label: 'People', value: peopleCount, href: '/family' },
          { label: 'Processing', value: processingCount, href: '/processing' },
          { label: 'Stories', value: 'Share', href: '/stories' },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-amber-200 hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-950">{stat.value}</p>
          </Link>
        ))}
      </div>

      {recentMemories.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-slate-950">Recent memories</h3>
            <Link href="/memories" className="text-sm font-semibold text-amber-800">
              View library →
            </Link>
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recentMemories.slice(0, 6).map((memory) => (
              <li key={memory.memory_id}>
                <Link
                  href={`/memories/${memory.memory_id}`}
                  className="block rounded-xl border border-slate-100 bg-slate-50/80 p-3 hover:border-amber-200 hover:bg-amber-50/50"
                >
                  <p className="font-semibold text-slate-900 line-clamp-1">{memory.title}</p>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2">{memory.summary || 'Processing…'}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
