import { MarketingPage } from '@/app/components/MarketingChrome';

export default function VeteransPage() {
  const features = [
    ['Service-era timeline', 'Organize memories by service years, places, units, friendships, transitions, and family milestones.'],
    ['Trauma-careful language', 'The product can preserve stories without making clinical claims or forcing sensitive prompts.'],
    ['Family legacy output', 'Turn service memories into source-grounded profiles, letters, and storybook chapters.'],
  ];

  return (
    <MarketingPage eyebrow="04 - For veterans" title={<>Preserve service, family, and legacy with care.</>} body="A future veteran-focused experience for honoring life chapters while keeping language respectful, optional, and source-grounded.">
      <section className="bg-slate-950 px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          {features.map(([title, body]) => (
            <div key={title} className="rounded-lg border border-yellow-500/25 bg-white/5 p-6">
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </MarketingPage>
  );
}
