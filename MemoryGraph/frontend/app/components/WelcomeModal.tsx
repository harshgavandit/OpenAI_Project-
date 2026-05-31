'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'memorygraph_welcome_v1';

export function shouldShowWelcome(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(STORAGE_KEY) !== 'done';
}

export function markWelcomeSeen(): void {
  window.localStorage.setItem(STORAGE_KEY, 'done');
}

export function WelcomeModal({ memoryCount, onDismiss }: { memoryCount: number; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(shouldShowWelcome());
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    markWelcomeSeen();
    setVisible(false);
    onDismiss();
  };

  const steps = [
    {
      title: 'Explore your memories',
      body: memoryCount > 0 ? 'Your sample family is ready on Home.' : 'We will load a sample family so you can explore right away.',
      href: '/studio',
      cta: 'Go to Home',
    },
    {
      title: 'Ask anything',
      body: 'Every answer shows the exact photos and notes it came from.',
      href: '/ask',
      cta: 'Try Ask',
    },
    {
      title: 'Build a story',
      body: 'Turn years of memories into a chapter you can read and share.',
      href: '/stories',
      cta: 'Open Stories',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
        <p className="text-xs font-semibold text-amber-800">Welcome to MemoryGraph</p>
        <h2 id="welcome-title" className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
          Your family memories, finally connected
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Three simple things to try — each takes about a minute.
        </p>
        <ol className="mt-6 space-y-4">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-600 text-sm font-bold text-white">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-950">{step.title}</p>
                <p className="mt-1 text-sm text-slate-600">{step.body}</p>
                <Link href={step.href} onClick={dismiss} className="mt-2 inline-block text-sm font-semibold text-amber-800 hover:text-amber-900">
                  {step.cta} →
                </Link>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={dismiss} className="flex-1 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Start exploring
          </button>
          <button type="button" onClick={dismiss} className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 hover:text-slate-800">
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
