'use client';

import { MarketingCTA, MarketingPage } from '@/app/components/MarketingChrome';
import { API_URL } from '@/app/lib/api';
import { registerPathWithNext } from '@/app/lib/authRedirect';
import { contactReasons } from '@/app/lib/marketingSite';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function ContactForm() {
  const searchParams = useSearchParams();
  const defaultReason = searchParams.get('reason') || 'Demo request';
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">Contact paths</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-950">How can we help?</h2>
          <div className="mt-6 space-y-3">
            {contactReasons.map(({ label, hint }) => (
              <div key={label} className="rounded-xl bg-slate-50 p-4">
                <p className="font-bold text-slate-950">{label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{hint}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="font-bold text-slate-950">Want to try it now?</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Skip the wait — create a free account and we load a sample family automatically.
          </p>
          <Link href={registerPathWithNext('/studio')} className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
            Open Studio free
          </Link>
        </div>
      </div>

      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          const form = new FormData(event.currentTarget);
          try {
            const response = await fetch(`${API_URL}/contact`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: form.get('name'),
                email: form.get('email'),
                reason: form.get('reason'),
                message: form.get('message'),
              }),
            });
            if (!response.ok) throw new Error(await response.text());
            setSent(true);
            event.currentTarget.reset();
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
          }
        }}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-xl font-bold text-slate-950">Send a message</h2>
        <p className="mt-1 text-sm text-slate-600">We save messages securely so the team can follow up.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Name</span>
            <input name="name" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" required />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Email</span>
            <input name="email" type="email" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" required />
          </label>
        </div>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-800">Reason</span>
          <select name="reason" defaultValue={defaultReason} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm">
            {contactReasons.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-800">Message</span>
          <textarea name="message" rows={6} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" required placeholder="Tell us what you need…" />
        </label>
        <button type="submit" className="mt-4 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Send message
        </button>
        {sent && (
          <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-bold">Message received — thank you!</p>
            <p className="mt-1">While you wait, you can explore MemoryGraph with a free account.</p>
            <Link href={registerPathWithNext('/studio')} className="mt-2 inline-flex font-semibold text-emerald-900 underline">
              Open Studio →
            </Link>
          </div>
        )}
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">Could not send: {error}</p>}
      </form>
    </section>
  );
}

export default function ContactPage() {
  return (
    <MarketingPage
      eyebrow="Contact"
      title={<>Talk to the MemoryGraph team</>}
      body="Demo requests, family archive questions, partnership ideas, Family plan waitlist, or technical support — we read every message."
    >
      <Suspense fallback={<div className="px-4 py-20 text-center text-slate-600">Loading form…</div>}>
        <ContactForm />
      </Suspense>
      <MarketingCTA />
    </MarketingPage>
  );
}
