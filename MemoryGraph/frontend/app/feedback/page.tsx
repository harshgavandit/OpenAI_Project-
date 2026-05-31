'use client';

import { MarketingCTA, MarketingPage } from '@/app/components/MarketingChrome';
import { API_URL } from '@/app/lib/api';
import { registerPathWithNext } from '@/app/lib/authRedirect';
import { feedbackExperiences } from '@/app/lib/marketingSite';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function FeedbackForm() {
  const searchParams = useSearchParams();
  const defaultType = searchParams.get('type') || 'Feature request';
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">Product loop</p>
        <h2 className="mt-3 text-3xl font-bold text-slate-950">Help us improve</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Your feedback shapes what we build next — especially for families using Studio, Ask, and Stories.
        </p>
        <div className="mt-5 space-y-3">
          {[
            'Which feature felt most emotional?',
            'Where did the product feel confusing?',
            'What export or sharing option matters most?',
            'What would make this feel safer for your family?',
          ].map((item) => (
            <div key={item} className="rounded-xl bg-slate-50 p-4 text-sm font-medium text-slate-700">
              {item}
            </div>
          ))}
        </div>
        <Link href={registerPathWithNext('/studio')} className="mt-6 inline-flex text-sm font-bold text-amber-800 hover:underline">
          Try Studio first →
        </Link>
      </div>

      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          const form = new FormData(event.currentTarget);
          try {
            const response = await fetch(`${API_URL}/feedback`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                usefulness: form.get('usefulness'),
                feedback_type: form.get('feedback_type'),
                standout_experience: form.get('standout_experience'),
                message: form.get('message'),
                email: form.get('email'),
              }),
            });
            if (!response.ok) throw new Error(await response.text());
            setSaved(true);
            event.currentTarget.reset();
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
          }
        }}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-xl font-bold text-slate-950">Share your experience</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">How useful does MemoryGraph feel?</span>
            <select name="usefulness" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm">
              <option>Extremely useful</option>
              <option>Useful with improvements</option>
              <option>Interesting but unclear</option>
              <option>Not useful yet</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Feedback type</span>
            <select name="feedback_type" defaultValue={defaultType} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm">
              <option>Feature request</option>
              <option>Bug report</option>
              <option>Design feedback</option>
              <option>Privacy concern</option>
            </select>
          </label>
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-800">Which experience stood out?</span>
          <select name="standout_experience" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm">
            {feedbackExperiences.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-800">What should we improve next?</span>
          <textarea name="message" rows={6} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" required placeholder="Be as specific as you like…" />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-800">Email (optional)</span>
          <input name="email" type="email" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" placeholder="you@example.com" />
        </label>
        <button type="submit" className="mt-4 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Submit feedback
        </button>
        {saved && (
          <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-bold">Thank you — feedback saved!</p>
            <p className="mt-1">Ready to explore the app?</p>
            <Link href={registerPathWithNext('/studio')} className="mt-2 inline-flex font-semibold text-emerald-900 underline">
              Open Studio →
            </Link>
          </div>
        )}
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">Could not save: {error}</p>}
      </form>
    </section>
  );
}

export default function FeedbackPage() {
  return (
    <MarketingPage
      eyebrow="Feedback"
      title={<>Help shape the family memory companion</>}
      body="Tell us what feels magical, confusing, or missing — especially after trying Studio, Ask, or Stories."
    >
      <Suspense fallback={<div className="px-4 py-20 text-center text-slate-600">Loading form…</div>}>
        <FeedbackForm />
      </Suspense>
      <MarketingCTA />
    </MarketingPage>
  );
}
