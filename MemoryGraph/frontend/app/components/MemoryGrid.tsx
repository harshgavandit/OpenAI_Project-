'use client';

import type { BootstrapMemory } from '@/app/lib/bootstrapTypes';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-900',
  processing: 'bg-amber-100 text-amber-900',
  pending: 'bg-slate-100 text-slate-700',
  failed: 'bg-red-100 text-red-900',
};

export function MemoryGrid({
  memories,
  highlightId,
  onEdit,
  onRetry,
}: {
  memories: Array<BootstrapMemory & { raw_text?: string }>;
  highlightId?: string | null;
  onEdit?: (memory: BootstrapMemory) => void;
  onRetry?: (memoryId: string) => void;
}) {
  if (memories.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-500">
        No memories match your filters.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {memories.map((memory) => (
        <article
          key={memory.memory_id}
          className={`flex flex-col rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
            highlightId === memory.memory_id ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-200'
          }`}
        >
          <div className="flex h-24 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-amber-50 text-3xl">
            📄
          </div>
          <Link href={`/memories/${memory.memory_id}`} className="mt-3 font-bold text-slate-950 hover:text-amber-900 line-clamp-2">
            {memory.title}
          </Link>
          <p className="mt-1 flex-1 text-sm text-slate-600 line-clamp-3">{memory.summary || 'No summary yet'}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[memory.status] || STATUS_COLORS.pending}`}>
              {memory.status}
            </span>
            {onEdit && (
              <button type="button" onClick={() => onEdit(memory)} className="text-xs font-semibold text-slate-600 hover:text-slate-900">
                Edit
              </button>
            )}
            {memory.status === 'failed' && onRetry && (
              <button type="button" onClick={() => onRetry(memory.memory_id)} className="text-xs font-semibold text-amber-800">
                Retry
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
