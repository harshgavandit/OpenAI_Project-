import { InfoCardGrid, MarketingCTA, MarketingPage, SectionEyebrow } from '@/app/components/MarketingChrome';
import { privacySections } from '@/app/lib/marketingSite';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <MarketingPage
      eyebrow="Privacy"
      title={<>Your family archive stays yours</>}
      body="MemoryGraph is built for intimate family data. We explain what is stored, what is inferred, and what you can export or delete — in plain language."
    >
      <section className="mx-auto max-w-7xl space-y-12 px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionEyebrow>Our approach</SectionEyebrow>
            <h2 className="mt-5 text-4xl font-bold tracking-normal text-slate-950">Family memory is intimate data</h2>
          </div>
          <p className="text-sm leading-8 text-slate-600">
            We design MemoryGraph so families understand what the AI used as evidence, what was inferred from uploads, and how to take their archive elsewhere. We do not position the product as a medical system, and care-related signals stay supportive — never diagnostic.
          </p>
        </div>

        <InfoCardGrid items={privacySections} />

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">Data retention</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Your memories remain in your account until you delete them or delete your account. Contact and feedback messages from this website are stored so we can respond — you can ask us to remove them via{' '}
              <Link href="/contact" className="font-semibold text-amber-800 hover:underline">
                Contact
              </Link>
              .
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">Children &amp; sensitive content</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Families should only upload content they have the right to store. MemoryGraph does not proactively scan for minors in photos; you control what enters your private archive.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-700/20 bg-[#f6f0df] p-8">
          <h2 className="text-2xl font-bold text-slate-950">Care disclaimer</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            MemoryGraph Care Signals suggest gentle family check-ins based on archive language. They are not medical advice, diagnosis, treatment, crisis detection, or a replacement for professional care. In an emergency, contact local emergency services.
          </p>
        </div>

        <p className="text-center text-sm text-slate-600">
          Technical safeguards are described on our{' '}
          <Link href="/security" className="font-semibold text-amber-800 hover:underline">
            Security
          </Link>{' '}
          page. Full terms:{' '}
          <Link href="/terms" className="font-semibold text-amber-800 hover:underline">
            Terms of use
          </Link>
          .
        </p>
      </section>
      <MarketingCTA />
    </MarketingPage>
  );
}
