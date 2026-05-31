'use client';

import { ONBOARDING_STEPS } from '@/app/lib/productCopy';
import Link from 'next/link';

const STORAGE_KEY = 'memorygraph_onboarding_v3';

export function isOnboardingComplete(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(STORAGE_KEY) === 'done';
}

export function markOnboardingComplete(): void {
  window.localStorage.setItem(STORAGE_KEY, 'done');
}

export function OnboardingWizard({
  step,
  memoryCount,
  onSeed,
  onAskProof,
  onTimeMachine,
  onDismiss,
  busy,
}: {
  step: number;
  memoryCount: number;
  onSeed: () => void;
  onAskProof: () => void;
  onTimeMachine: () => void;
  onDismiss: () => void;
  busy: boolean;
}) {
  const steps = ONBOARDING_STEPS.map((item, index) => ({
    ...item,
    action: index === 0 ? onSeed : index === 1 ? onAskProof : onTimeMachine,
    done: index === 0 ? memoryCount > 0 : step > index,
  }));

  const current = steps[Math.min(step, steps.length - 1)];

  return (
    <div
      className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm"
      role="region"
      aria-label="Getting started"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Quick start</p>
          <h3 className="mt-1 text-xl font-bold text-slate-950">{current.title}</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-700">{current.body}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          Skip tour
        </button>
      </div>
      <div className="mt-4 flex gap-2" aria-hidden>
        {steps.map((item, index) => (
          <div
            key={item.title}
            className={`h-2 flex-1 rounded-full transition-colors ${index <= step ? 'bg-amber-600' : 'bg-amber-200'}`}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy || current.done}
          onClick={() => void current.action()}
          className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-slate-300"
        >
          {current.actionLabel}
        </button>
        <Link href="/ask" className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Go to Ask
        </Link>
      </div>
    </div>
  );
}
