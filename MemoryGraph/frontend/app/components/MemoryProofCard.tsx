export interface LineageStep {
  key: string;
  label: string;
  state: 'done' | 'active' | 'pending' | 'failed';
}

export interface MemoryProofItem {
  memory_id: string;
  title: string;
  summary?: string;
  status?: string;
  processing_stage?: string;
  lineage?: LineageStep[];
  evidence: {
    people: string[];
    places: string[];
    events: string[];
    dates: string[];
    excerpt: string;
  };
  confidence: number;
  created_at?: string | null;
}

export function EvidenceChips({ proof }: { proof: MemoryProofItem }) {
  const chips = [
    ...proof.evidence.people.map((value) => ({ label: value, tone: 'bg-emerald-50 text-emerald-800' })),
    ...proof.evidence.places.map((value) => ({ label: value, tone: 'bg-amber-50 text-amber-800' })),
    ...proof.evidence.dates.map((value) => ({ label: value, tone: 'bg-sky-50 text-sky-800' })),
    ...proof.evidence.events.map((value) => ({ label: value, tone: 'bg-violet-50 text-violet-800' })),
  ];
  if (chips.length === 0) {
    return <p className="text-xs text-slate-400">No structured tags yet.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <span key={`${proof.memory_id}-${chip.label}`} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${chip.tone}`}>
          {chip.label}
        </span>
      ))}
    </div>
  );
}

export function MemoryProofCard({ proof, compact = false }: { proof: MemoryProofItem; compact?: boolean }) {
  return (
    <article className={`rounded-lg border border-cyan-200 bg-white shadow-sm ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-amber-800">Source memory</p>
          <h3 className={`font-bold text-slate-950 ${compact ? 'text-base' : 'text-lg'}`}>{proof.title}</h3>
        </div>
        <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900">
          {Math.round(proof.confidence * 100)}% match
        </span>
      </div>
      {!compact && proof.lineage && proof.lineage.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {proof.lineage.map((step) => (
            <span
              key={step.key}
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                step.state === 'done'
                  ? 'bg-emerald-100 text-emerald-800'
                  : step.state === 'active'
                    ? 'bg-cyan-100 text-cyan-800'
                    : step.state === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-slate-100 text-slate-500'
              }`}
            >
              {step.label}
            </span>
          ))}
        </div>
      ) : !compact && proof.processing_stage ? (
        <p className="mt-2 text-xs text-slate-500">
          Saved as <span className="font-medium text-slate-700">{proof.processing_stage.replaceAll('_', ' ')}</span>
        </p>
      ) : null}
      <p className={`mt-2 leading-6 text-slate-600 ${compact ? 'text-xs' : 'text-sm'}`}>
        {proof.summary || proof.evidence.excerpt}
      </p>
      <blockquote className="mt-3 rounded-lg border-l-4 border-cyan-400 bg-slate-50 px-3 py-2 text-sm italic leading-6 text-slate-600">
        “{proof.evidence.excerpt || 'Source excerpt unavailable.'}”
      </blockquote>
      <div className="mt-3">
        <EvidenceChips proof={proof} />
      </div>
    </article>
  );
}

export function MemoryProofList({
  proofs,
  title = 'Sources',
  emptyMessage = 'Sources appear when an answer links to your memories.',
  onProofClick,
}: {
  proofs: MemoryProofItem[];
  title?: string;
  emptyMessage?: string;
  onProofClick?: (proof: MemoryProofItem) => void;
}) {
  if (!proofs.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-sm font-bold text-slate-950">{title}</p>
      <div className="grid gap-3 md:grid-cols-2">
        {proofs.map((proof) => (
          <button
            key={proof.memory_id}
            type="button"
            onClick={() => onProofClick?.(proof)}
            className={`text-left ${onProofClick ? 'cursor-pointer transition hover:ring-2 hover:ring-amber-200 rounded-lg' : ''}`}
          >
            <MemoryProofCard proof={proof} compact />
          </button>
        ))}
      </div>
    </div>
  );
}
