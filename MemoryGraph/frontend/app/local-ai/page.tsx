import { MarketingPage, SectionEyebrow } from '@/app/components/MarketingChrome';
import { marketingImages } from '@/app/lib/marketingImages';
import { LocalAiWizard } from '@/app/local-ai/LocalAiWizard';
import Image from 'next/image';
import Link from 'next/link';

const trustCards = [
  {
    title: 'Local-first intelligence',
    body: 'MemoryGraph can run with local Ollama models for the demo path, keeping AI generation zero-cost and private-first.',
  },
  {
    title: 'Source-grounded answers',
    body: 'The archive exposes proof cards so families can see the people, places, dates, and excerpts behind important insights.',
  },
  {
    title: 'Explicit sharing',
    body: 'Weekly letters, capsules, and legacy contacts only create public links when the user chooses to share.',
  },
  {
    title: 'Export anytime',
    body: 'Families can download archive data, relationship maps, reports, and biography pages without being locked into a platform.',
  },
];

export default function LocalAiPage() {
  const photoUrl = marketingImages.photos || marketingImages.hero;
  
  return (
    <MarketingPage
      eyebrow="Private AI Memory OS"
      title={
        <>
          Built for family trust, not black-box AI.
        </>
      }
      body="MemoryGraph is designed around local AI support, source-grounded memory reconstruction, and user-owned exports."
    >
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <SectionEyebrow>Local and explainable</SectionEyebrow>
            <h2 className="mt-5 text-4xl font-bold tracking-normal text-slate-950">The emotional product still needs engineering trust.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Family memories are sensitive. The product experience is warm, but the architecture is intentionally practical: local model support,
              deterministic fallbacks, exportable data, and proof-backed AI responses.
            </p>
            <Link href="/studio" className="mt-6 inline-flex rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              Open private studio
            </Link>
          </div>
          {photoUrl && (
            <div className="relative min-h-[420px] overflow-hidden rounded-lg bg-slate-950 shadow-2xl">
              <Image src={photoUrl} alt="Family photos and documents" fill sizes="(min-width: 1024px) 48vw, 100vw" className="object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 rounded-lg bg-white/90 p-5 text-slate-950 shadow-xl">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Trust layer</p>
                <h3 className="mt-1 text-2xl font-bold">Every story can show its sources.</h3>
              </div>
            </div>
          )}
        </div>
      </section>
      <section className="bg-[#f6f0df] px-4 py-16 sm:px-6 lg:px-8">
        <LocalAiWizard />
      </section>
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionEyebrow>Product promises</SectionEyebrow>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {trustCards.map((card) => (
              <div key={card.title} className="rounded-lg border border-slate-200 bg-[#f6f0df] p-6 shadow-sm">
                <h3 className="text-xl font-bold text-slate-950">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
