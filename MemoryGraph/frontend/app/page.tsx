'use client';

import {
  FeatureShowcaseRow,
  MarketingCTA,
  MarketingFooter,
  MarketingNav,
  SectionEyebrow,
  TrustStrip,
  marketingImages,
} from '@/app/components/MarketingChrome';
import { registerPathWithNext, loginPathWithNext } from '@/app/lib/authRedirect';
import { PRODUCT_SUBLINE, PRODUCT_TAGLINE } from '@/app/lib/productCopy';
import { useAuth } from '@/app/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const studioHref = isAuthenticated ? '/studio' : loginPathWithNext('/studio');
  const registerHref = registerPathWithNext('/studio');

  const howItWorks = [
    ['1', 'Add your memories', 'Photos, letters, journals, and notes — everything scattered across folders and phones.'],
    ['2', 'Ask in plain English', 'Every answer shows the exact memories it came from. No mystery, no guesswork.'],
    ['3', 'Share the story', 'Turn years into a life chapter or a single link the whole family can read.'],
  ];

  const gallery: Array<[string, string]> = [
    ['Childhood', marketingImages.family],
    ['Places', marketingImages.archive],
    ['Family', marketingImages.table],
    ['Milestones', marketingImages.photos],
    ['Letters', marketingImages.letter],
    ['Legacy', marketingImages.hero],
  ];

  return (
    <main className="min-h-screen bg-[#f6f0df] text-slate-950">
      <MarketingNav />

      <section className="relative flex min-h-screen items-center overflow-hidden bg-slate-950 px-4 py-28 text-white sm:px-6 lg:px-8">
        <Image src={marketingImages.hero} alt="" fill priority sizes="100vw" className="object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/55 to-slate-950/90" />
        <div className="relative mx-auto max-w-5xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">Private family memory companion</p>
          <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-7xl">{PRODUCT_TAGLINE}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-200">{PRODUCT_SUBLINE}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={studioHref} className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400">
              Open Studio
            </Link>
            <Link
              href={registerHref}
              className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur hover:bg-white/15"
            >
              Start free
            </Link>
            <Link href="/features" className="rounded-xl border border-white/20 px-6 py-3 text-sm font-bold text-slate-200 hover:text-white">
              See features
            </Link>
          </div>
        </div>
      </section>

      <TrustStrip />

      <section id="how-it-works" className="bg-[#ede9fb] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-amber-800">Three simple steps</p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">How MemoryGraph works</h2>
          <div className="relative mt-14 grid gap-8 lg:grid-cols-3">
            <div className="absolute left-[18%] right-[18%] top-16 hidden h-px bg-indigo-200 lg:block" />
            {howItWorks.map(([step, title, body]) => (
              <div key={step} className="relative rounded-2xl border border-indigo-100 bg-white p-8 shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-600 text-xl font-bold text-white">
                  {step}
                </div>
                <h3 className="mt-8 text-2xl font-bold text-slate-950">{title}</h3>
                <p className="mx-auto mt-4 max-w-xs text-sm leading-7 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
          <Link href="/how-it-works" className="mt-10 inline-flex text-sm font-bold text-amber-800 hover:text-amber-900">
            Full walkthrough →
          </Link>
        </div>
      </section>

      <section className="bg-[#29231f] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-amber-400">Stories that last</p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            A whole life, <span className="text-amber-400">beautifully told</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            From childhood photos to letters and milestones — reconnect with the people, places, and moments that matter.
          </p>
          <div className="mx-auto mt-10 grid max-w-5xl gap-3 md:grid-cols-3">
            {gallery.map(([label, image]) => (
              <div key={label} className="relative min-h-[210px] overflow-hidden rounded-2xl border border-amber-700/30 bg-slate-950 shadow-2xl">
                <Image src={image} alt={label} fill sizes="(min-width: 768px) 30vw, 100vw" className="object-cover opacity-85" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                <p className="absolute bottom-4 left-4 text-sm font-bold text-white">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-20 px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <SectionEyebrow>Why families choose MemoryGraph</SectionEyebrow>
          <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Clarity, connection, and sources you can trust
          </h2>
          <Link href="/features" className="mt-4 inline-flex text-sm font-bold text-amber-800 hover:text-amber-900">
            Explore all features →
          </Link>
        </div>
        <FeatureShowcaseRow
          eyebrow="Ask"
          title="Questions answered with real sources"
          body="Ask about a person, place, or time. Every reply links to the photos and notes it came from — so everyone in the family can trust what they read."
          bullets={['Plain-language questions', 'Source cards beside every answer', 'Turn answers into life chapters']}
          image={marketingImages.family}
        />
        <FeatureShowcaseRow
          eyebrow="Family"
          title="See how people and places connect"
          body="Your files become a living map — tap anyone to explore their memories and relationships."
          bullets={['People discovered automatically', 'Tap to explore connections', 'Built for storytelling, not spreadsheets']}
          image={marketingImages.photos}
          reverse
        />
        <FeatureShowcaseRow
          eyebrow="Stories"
          title="Chapters and links worth sharing"
          body="Build a life chapter for a person and era, then share one beautiful read-only link with the whole family."
          bullets={['Life chapters from your memories', 'Shareable family story link', 'Letters scheduled for the future']}
          image={marketingImages.table}
        />
      </section>

      <section className="bg-[#f4efe6] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto h-1 w-16 bg-amber-600" />
          <p className="mt-8 text-3xl font-semibold italic leading-snug text-slate-950 sm:text-4xl">
            “Memories should feel like stories again — not folders lost on a hard drive.”
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm font-semibold">
            <Link href="/privacy" className="text-amber-900 hover:underline">
              Privacy
            </Link>
            <Link href="/security" className="text-amber-900 hover:underline">
              Security
            </Link>
            <Link href="/pricing" className="text-amber-900 hover:underline">
              Pricing
            </Link>
          </div>
        </div>
      </section>

      <MarketingCTA />
      <MarketingFooter />
    </main>
  );
}
