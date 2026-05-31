import {
  FeatureShowcaseRow,
  MarketingCTA,
  MarketingPage,
  PlatformPreviewCard,
  SectionEyebrow,
} from '@/app/components/MarketingChrome';
import { marketingImages } from '@/app/lib/marketingImages';

const featureGrid = [
  {
    title: 'Memory Proof',
    body: 'Every Ask answer shows source cards — photos, notes, and documents the AI actually used.',
    image: marketingImages.archive,
  },
  {
    title: 'Time Machine',
    body: 'Query memories by year or age to reconstruct a period of someone\'s life.',
    image: marketingImages.photos,
  },
  {
    title: 'One Life Story',
    body: 'Build a shareable read-only chapter link the whole family can open without an account.',
    image: marketingImages.table,
  },
  {
    title: 'Letters for later',
    body: 'Schedule a message for a future date — a capsule someone special can open when the time is right.',
    image: marketingImages.letter,
  },
  {
    title: 'Family rituals',
    body: 'Send a weekly question by email; answers become new memories in the archive.',
    image: marketingImages.family,
  },
  {
    title: 'Export & delete',
    body: 'Download JSON, CSV, and HTML reports — or delete your account from Settings.',
    image: marketingImages.hero,
    dark: true,
  },
] as const;

export default function FeaturesPage() {
  return (
    <MarketingPage
      eyebrow="Features"
      title={<>Everything you need to preserve a family story</>}
      body="Four focused experiences in Studio — plus depth when you need it. Built for real families, not file folders."
    >
      <section className="mx-auto max-w-7xl space-y-20 px-4 py-16 sm:px-6 lg:px-8">
        <FeatureShowcaseRow
          eyebrow="Ask"
          title="Questions answered with real sources"
          body="Ask about a person, place, or time. Every reply links to the photos and notes it came from — so everyone in the family can trust what they read."
          bullets={['Plain-language questions', 'Source cards beside every answer', 'Follow-up on people and places']}
          image={marketingImages.family}
        />
        <FeatureShowcaseRow
          eyebrow="Family"
          title="See how people and places connect"
          body="Your files become a living map. Tap anyone to explore their memories and relationships."
          bullets={['People discovered automatically', 'Interactive D3 family graph', 'Built for storytelling']}
          image={marketingImages.photos}
          reverse
        />
        <FeatureShowcaseRow
          eyebrow="Stories"
          title="Chapters and links worth sharing"
          body="Build a life chapter for a person and era, then share one beautiful read-only link with the whole family."
          bullets={['Life chapters from your memories', 'Shareable family story link', 'Letters scheduled for later']}
          image={marketingImages.table}
        />
        <FeatureShowcaseRow
          eyebrow="Private by design"
          title="Your data stays yours"
          body="AI runs on your machine when enabled. Export anytime. Invite family on your terms."
          bullets={['No mandatory cloud AI', 'Export JSON, CSV, or reports', 'Delete account when you want']}
          image={marketingImages.letter}
          reverse
        />

        <div>
          <SectionEyebrow>More depth</SectionEyebrow>
          <h2 className="mt-5 text-3xl font-bold text-slate-950">Standout capabilities</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featureGrid.map((card) => (
              <PlatformPreviewCard key={card.title} {...card} dark={'dark' in card && card.dark} />
            ))}
          </div>
        </div>
      </section>
      <MarketingCTA title="See it in Studio" body="Sign in free — we load a sample family so you can try Ask, Family, and Stories in under a minute." />
    </MarketingPage>
  );
}
