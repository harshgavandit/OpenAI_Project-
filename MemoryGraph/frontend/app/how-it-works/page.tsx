import { MarketingCTA, MarketingPage } from '@/app/components/MarketingChrome';
import { marketingImages } from '@/app/lib/marketingImages';
import { registerPathWithNext } from '@/app/lib/authRedirect';
import Image from 'next/image';
import Link from 'next/link';

export default function HowItWorksPage() {
  const steps = [
    {
      n: '1',
      title: 'Add your memories',
      body: 'Upload photos, PDFs, letters, and notes — or sign in and we load a sample family so you can explore immediately.',
      detail: 'Supported: text files, images, PDFs, and more. Everything stays in your private archive.',
    },
    {
      n: '2',
      title: 'Ask in plain English',
      body: 'MemoryGraph finds people, places, and moments — and shows exactly which memory each answer came from.',
      detail: 'Try: “What do we know about grandfather?” and expand the source cards beside the answer.',
    },
    {
      n: '3',
      title: 'Share the story',
      body: 'Turn years into a life chapter or one link the whole family can read. No account needed to view shared stories.',
      detail: 'Build a chapter in Stories, then copy the public read-only link.',
    },
  ];

  return (
    <MarketingPage
      eyebrow="How it works"
      title={<>From scattered files to a story your family can revisit</>}
      body="Three steps. No technical setup. Optional private AI on your machine when you enable Ollama."
    >
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {steps.map((step) => (
            <div key={step.n} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-600 text-lg font-bold text-white">
                {step.n}
              </div>
              <h2 className="mt-6 text-xl font-bold text-slate-950">{step.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{step.body}</p>
              <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-900">{step.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-950">The journey into Studio</h2>
            <ol className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
              <li>
                <span className="font-bold text-slate-950">1.</span> Browse this website — Features, Pricing, Privacy
              </li>
              <li>
                <span className="font-bold text-slate-950">2.</span> Click <strong>Open Studio</strong> → sign in or create a free account
              </li>
              <li>
                <span className="font-bold text-slate-950">3.</span> Home loads a sample family — explore the map, Ask, and Stories
              </li>
              <li>
                <span className="font-bold text-slate-950">4.</span> Upload your own memories when ready
              </li>
            </ol>
            <Link href={registerPathWithNext('/studio')} className="mt-6 inline-flex rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400">
              Open Studio free
            </Link>
          </div>
          <div className="relative min-h-[280px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
            <Image src={marketingImages.family} alt="" fill sizes="50vw" className="object-cover opacity-50" />
            <div className="relative flex h-full min-h-[280px] flex-col justify-end p-8 text-white">
              <p className="text-sm font-semibold uppercase tracking-wider text-amber-400">60-second demo</p>
              <p className="mt-2 text-2xl font-bold">Sign up → sample family → ask about grandfather</p>
            </div>
          </div>
        </div>

        <div className="relative mt-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
          <Image src={marketingImages.family} alt="" fill sizes="100vw" className="object-cover opacity-40" />
          <div className="relative px-8 py-16 text-center text-white">
            <h2 className="text-3xl font-bold">See it yourself in 60 seconds</h2>
            <p className="mx-auto mt-3 max-w-lg text-slate-200">Create a free account, load the sample family, and ask about grandfather.</p>
            <Link href={registerPathWithNext('/studio')} className="mt-6 inline-flex rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400">
              Start free
            </Link>
          </div>
        </div>
      </section>
      <MarketingCTA />
    </MarketingPage>
  );
}
