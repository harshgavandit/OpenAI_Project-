// Updated by GitHub contribution automation.
import { MarketingCTA, MarketingPage, SectionEyebrow } from '@/app/components/MarketingChrome';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <MarketingPage
      eyebrow="About"
      title={<>A private memory companion for real families</>}
      body="MemoryGraph exists because family memories are scattered across phones, folders, old documents, chats, and half-remembered stories."
    >
      <section className="mx-auto max-w-7xl space-y-12 px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionEyebrow>Our mission</SectionEyebrow>
            <h2 className="mt-5 text-4xl font-bold tracking-normal text-slate-950">Storage keeps files. MemoryGraph keeps context.</h2>
          </div>
          <div className="space-y-5 text-sm leading-8 text-slate-600">
            <p>
              Most families already have the raw material of a life story: photos, certificates, journals, messages, scanned letters, and voice notes. The problem is that these fragments rarely explain themselves.
            </p>
            <p>
              MemoryGraph turns those fragments into a living archive. It discovers people, places, events, and relationships — then makes them explorable through conversation, family map, life chapters, and shareable story links.
            </p>
            <p>
              Every AI answer is designed to show its sources, so grandparents, parents, and kids can trust what they read together.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            ['Private by design', 'Families control their archive, export it, and understand what the AI used.'],
            ['Source-grounded', 'We do not invent family history — answers point back to memories and evidence.'],
            ['Emotionally useful', 'The best memory product feels like a life becoming visible again, not a database.'],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold text-slate-950">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <SectionEyebrow>Who it&apos;s for</SectionEyebrow>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              'Families preserving stories across generations',
              'Adult children organizing a parent\'s archive',
              'Genealogy enthusiasts who want sources, not guesses',
              'Anyone who wants private AI on their own machine',
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                <span className="text-amber-600">→</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-950 p-8 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-400">Roadmap</p>
          <h2 className="mt-4 text-3xl font-bold">Where MemoryGraph goes next</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              'Shared family workspaces and invite flows',
              'Legacy book export with chapters and cover pages',
              'Optional weekly family ritual emails',
              'Richer local AI with Ollama',
              'Audio memory interviews and voice notes',
              'Careful care-signal boundaries and check-ins',
            ].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/10 p-4 text-sm text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm font-semibold">
          <Link href="/contact" className="text-amber-800 hover:underline">
            Get in touch
          </Link>
          <Link href="/feedback" className="text-amber-800 hover:underline">
            Share feedback
          </Link>
          <Link href="/features" className="text-amber-800 hover:underline">
            See features
          </Link>
        </div>
      </section>
      <MarketingCTA />
    </MarketingPage>
  );
}
