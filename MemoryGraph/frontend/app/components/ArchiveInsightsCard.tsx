'use client';

import { useState } from 'react';

export interface ArchiveInsightItem {
  type: string;
  label: string;
  severity: string;
  suggestion: string;
  insight_key?: string;
  merge_target?: string;
  resolved?: boolean;
}

export interface ArchiveIntelligence {
  archive_score: number;
  memory_count: number;
  year_span: number[];
  gaps: ArchiveInsightItem[];
  contradictions: ArchiveInsightItem[];
  summary: string;
}

export function ArchiveInsightsCard({
  data,
  onAction,
}: {
  data: ArchiveIntelligence | null;
  onAction?: (insightKey: string, action: 'dismiss' | 'merge', mergeTarget?: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  if (!data) return null;

  const tone = (severity: string) => {
    if (severity === 'high') return 'border-red-200 bg-red-50 text-red-900';
    if (severity === 'watch') return 'border-amber-200 bg-amber-50 text-amber-900';
    return 'border-slate-200 bg-slate-50 text-slate-800';
  };

  const items = [...data.gaps, ...data.contradictions].slice(0, 4);
  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <div>
          <p className="text-xs font-semibold text-amber-800">Memory checkup</p>
          <h3 className="mt-0.5 text-base font-bold text-slate-950">
            {items.length} suggestion{items.length === 1 ? '' : 's'} to strengthen your timeline
          </h3>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">{open ? 'Hide' : 'Review'}</span>
      </button>
      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4">
          <p className="text-sm leading-6 text-slate-600">{data.summary}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {items.map((item) => (
              <div key={`${item.type}-${item.label}`} className={`rounded-xl border p-4 text-sm ${tone(item.severity)}`}>
                <p className="font-bold">{item.label}</p>
                <p className="mt-2 opacity-90">{item.suggestion}</p>
                {onAction && item.insight_key && !item.resolved && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void onAction(item.insight_key!, 'dismiss')}
                      className="rounded-lg bg-white/80 px-2.5 py-1 text-xs font-semibold ring-1 ring-black/10 hover:bg-white"
                    >
                      Dismiss
                    </button>
                    {item.type === 'date_conflict' && (
                      <button
                        type="button"
                        onClick={() => {
                          const target = window.prompt('Keep which name?', item.label.split('"')[1] || '');
                          if (target) void onAction(item.insight_key!, 'merge', target);
                        }}
                        className="rounded-lg bg-white/80 px-2.5 py-1 text-xs font-semibold ring-1 ring-black/10 hover:bg-white"
                      >
                        Combine duplicates
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
