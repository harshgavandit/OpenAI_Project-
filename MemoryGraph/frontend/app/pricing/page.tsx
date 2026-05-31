import {
  MarketingCTA,
  MarketingPage,
  PricingComparisonTable,
  SectionEyebrow,
} from '@/app/components/MarketingChrome';
import { pricingFaq, pricingPlans } from '@/app/lib/marketingSite';
import Link from 'next/link';

export default function PricingPage() {
  return (
    <MarketingPage
      eyebrow="Pricing"
      title={<>Simple, honest pricing</>}
      body="Start free today. No credit card. No paid AI APIs. Upgrade only when shared family plans ship."
    >
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-8 shadow-sm ${
                plan.highlight
                  ? 'border-amber-400 bg-gradient-to-b from-amber-600 to-amber-700 text-white ring-2 ring-amber-300'
                  : 'border-slate-200 bg-white text-slate-950'
              }`}
            >
              {'comingSoon' in plan && plan.comingSoon && (
                <span className="absolute -top-3 right-4 rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-amber-300">
                  Coming soon
                </span>
              )}
              <p className="text-lg font-bold">{plan.name}</p>
              <p className="mt-4 text-4xl font-black">{plan.price}</p>
              {plan.period && (
                <p className={`text-sm ${plan.highlight ? 'text-amber-100' : 'text-slate-500'}`}>{plan.period}</p>
              )}
              <p className={`mt-4 text-sm leading-7 ${plan.highlight ? 'text-amber-50' : 'text-slate-600'}`}>
                {plan.tagline}
              </p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className={`flex gap-2 text-sm ${plan.highlight ? 'text-white' : 'text-slate-700'}`}>
                    <span className="text-amber-500">{plan.highlight ? '✓' : '✓'}</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`mt-8 inline-flex justify-center rounded-xl px-5 py-3 text-sm font-bold ${
                  plan.highlight ? 'bg-white text-amber-800 hover:bg-amber-50' : 'bg-slate-950 text-white hover:bg-slate-800'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <SectionEyebrow>Compare plans</SectionEyebrow>
          <h2 className="mt-5 text-3xl font-bold text-slate-950">What&apos;s included</h2>
          <div className="mt-8">
            <PricingComparisonTable />
          </div>
        </div>

        <div className="mt-16 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <SectionEyebrow>Billing</SectionEyebrow>
          <h2 className="mt-5 text-2xl font-bold text-slate-950">How billing works today</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ['Free forever', 'Core features stay free. No trial that expires.'],
              ['No hidden AI fees', 'Optional local Ollama — no mandatory OpenAI subscription.'],
              ['Family plan later', 'Waitlist opens shared billing only when invites & shared archives ship.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-xl bg-slate-50 p-5">
                <p className="font-bold text-slate-950">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <SectionEyebrow>FAQ</SectionEyebrow>
          <h2 className="mt-5 text-3xl font-bold text-slate-950">Common questions</h2>
          <div className="mt-8 space-y-4">
            {pricingFaq.map(({ q, a }) => (
              <div key={q} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-950">{q}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{a}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-7 text-slate-600">
          Questions about pricing or the Family waitlist?{' '}
          <Link href="/contact" className="font-semibold text-amber-800 hover:underline">
            Contact us
          </Link>
          .
        </p>
      </section>
      <MarketingCTA primaryLabel="Open Studio" secondaryLabel="Start free account" />
    </MarketingPage>
  );
}
