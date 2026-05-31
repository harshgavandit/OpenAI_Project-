import { InfoCardGrid, MarketingCTA, MarketingPage, SectionEyebrow } from '@/app/components/MarketingChrome';
import { securitySections } from '@/app/lib/marketingSite';
import Link from 'next/link';

export default function SecurityPage() {
  return (
    <MarketingPage
      eyebrow="Security"
      title="Designed for family memory, privacy, and proof"
      body="MemoryGraph treats family history as sensitive personal data — explicit sharing, exportability, local AI options, and source-grounded answers."
    >
      <section className="mx-auto max-w-7xl space-y-12 px-4 py-16 sm:px-6 lg:px-8">
        <div>
          <SectionEyebrow>Trust model</SectionEyebrow>
          <h2 className="mt-5 max-w-3xl text-3xl font-bold text-slate-950">Security built into the product experience</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            From sign-in cookies to public share links, every surface is designed so families stay in control of what leaves the archive.
          </p>
        </div>

        <InfoCardGrid items={securitySections} />

        <div className="rounded-2xl bg-slate-950 p-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-400">Session security</p>
          <h2 className="mt-4 text-2xl font-bold">How sign-in works</h2>
          <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-300">
            <li>• Short-lived access tokens and rotating refresh tokens in httpOnly cookies</li>
            <li>• No long-lived auth tokens in localStorage</li>
            <li>• Sign out clears server-side session</li>
            <li>• Rate limits on login, register, contact, and feedback endpoints</li>
          </ul>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-950">Shared links</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Life story links, capsule pages, and family tree shares use unguessable tokens. Revoke or regenerate from Settings when needed.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-950">Self-hosted option</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Run MemoryGraph on your own machine or server with local Ollama so memories never leave your network. See{' '}
              <Link href="/local-ai" className="font-semibold text-amber-800 hover:underline">
                Local AI
              </Link>
              .
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-slate-600">
          Privacy principles:{' '}
          <Link href="/privacy" className="font-semibold text-amber-800 hover:underline">
            Privacy policy
          </Link>
          . Report a concern:{' '}
          <Link href="/feedback?type=Privacy%20concern" className="font-semibold text-amber-800 hover:underline">
            Feedback
          </Link>
          .
        </p>
      </section>
      <MarketingCTA />
    </MarketingPage>
  );
}
