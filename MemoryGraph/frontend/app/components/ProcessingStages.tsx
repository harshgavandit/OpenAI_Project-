'use client';

const STAGES = ['uploaded', 'extract', 'enrich', 'index', 'completed'] as const;

const LABELS: Record<string, string> = {
  uploaded: 'Received',
  extract: 'Reading',
  enrich: 'Connecting',
  index: 'Organizing',
  completed: 'Ready',
  pending: 'Queued',
  processing: 'Working',
  failed: 'Needs attention',
};

export function ProcessingStages({ stage, status }: { stage?: string; status?: string }) {
  const activeStage = status === 'failed' ? 'failed' : stage || 'uploaded';
  const activeIndex = STAGES.indexOf(activeStage as (typeof STAGES)[number]);
  const index = activeIndex >= 0 ? activeIndex : 0;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-1">
        {STAGES.map((step, stepIndex) => {
          const done = status === 'completed' || stepIndex < index;
          const current = stepIndex === index && status !== 'completed';
          return (
            <div key={step} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`h-2 w-full rounded-full transition-all ${
                  done ? 'bg-emerald-500' : current ? 'bg-amber-500 animate-pulse' : 'bg-slate-200'
                }`}
              />
              <span className={`text-[10px] font-medium ${current ? 'text-amber-800' : 'text-slate-500'}`}>
                {LABELS[step]}
              </span>
            </div>
          );
        })}
      </div>
      {status === 'failed' && (
        <p className="mt-2 text-xs font-medium text-red-700">{LABELS.failed}</p>
      )}
    </div>
  );
}
