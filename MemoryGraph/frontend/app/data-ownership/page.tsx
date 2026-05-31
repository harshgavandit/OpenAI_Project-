import { MarketingPage } from '@/app/components/MarketingChrome';

export default function DataOwnershipPage() {
  const items = [
    ['Export archive', 'Download memory data as JSON.'],
    ['Export relationships', 'Download relationship intelligence as CSV.'],
    ['Export family report', 'Download shareable HTML reports.'],
    ['Source grounding', 'Answers and profiles point back to memories instead of floating claims.'],
  ];

  return (
    <MarketingPage eyebrow="05 - Data ownership" title={<>Your family archive should stay portable.</>} body="MemoryGraph is designed around exportability, source grounding, and user-owned memory data.">
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-20 sm:px-6 md:grid-cols-2 lg:px-8">
        {items.map(([title, body]) => (
          <div key={title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
          </div>
        ))}
      </section>
    </MarketingPage>
  );
}
