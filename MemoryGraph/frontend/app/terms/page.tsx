import { MarketingPage } from '@/app/components/MarketingChrome';

export default function TermsPage() {
  return (
    <MarketingPage eyebrow="06 - Terms" title={<>Clear boundaries for a family memory system.</>} body="Plain-language product terms for the current local prototype and future hosted product direction.">
      <section className="mx-auto max-w-4xl space-y-5 px-4 py-20 sm:px-6 lg:px-8">
        {[
          ['Prototype status', 'MemoryGraph is currently a local-first prototype. Some public pages describe planned product packaging, not active billing.'],
          ['User content', 'Uploaded files, story sessions, generated reports, and storybooks belong to the user account that created them.'],
          ['AI outputs', 'AI summaries, care cues, profiles, and storybooks are generated from available source memories and should be reviewed by the family.'],
          ['Care boundaries', 'Care Signals are supportive prompts for family check-ins, not medical advice, diagnosis, crisis detection, or treatment.'],
          ['No active billing', 'Pricing pages are visual product packaging only. No payment processing or subscription enforcement is active.'],
        ].map(([title, body]) => (
          <div key={title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
          </div>
        ))}
      </section>
    </MarketingPage>
  );
}
