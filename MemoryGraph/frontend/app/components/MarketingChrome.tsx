'use client';

import { useAuth } from '@/app/context/AuthContext';
import { loginPathWithNext, registerPathWithNext } from '@/app/lib/authRedirect';
import { marketingImageSrc, marketingImages } from '@/app/lib/marketingImages';
import { marketingNavLinks, pricingComparison, studioLoginPath } from '@/app/lib/marketingSite';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';

export { marketingImages } from '@/app/lib/marketingImages';

export function MarketingNav() {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const studioHref = isAuthenticated ? '/studio' : studioLoginPath;

  return (
    <nav className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 font-bold text-white" onClick={() => setMobileOpen(false)}>
          MemoryGraph
        </Link>

        <div className="hidden items-center gap-5 lg:flex">
          {marketingNavLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-semibold transition ${
                pathname === href ? 'text-amber-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {!isAuthenticated && (
            <Link
              href={loginPathWithNext('/studio')}
              className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 hover:text-white sm:inline-flex"
            >
              Sign in
            </Link>
          )}
          <Link
            href={studioHref}
            className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300"
            onClick={() => setMobileOpen(false)}
          >
            Open Studio
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-white lg:hidden"
            aria-expanded={mobileOpen}
            aria-label="Open menu"
            onClick={() => setMobileOpen((open) => !open)}
          >
            <span className="block h-0.5 w-5 bg-white" />
            <span className="mt-1 block h-0.5 w-5 bg-white" />
            <span className="mt-1 block h-0.5 w-5 bg-white" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-slate-950 px-4 py-4 lg:hidden">
          <div className="space-y-1">
            {marketingNavLinks.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/privacy"
              className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-400 hover:bg-white/5"
              onClick={() => setMobileOpen(false)}
            >
              Privacy
            </Link>
            <Link
              href="/feedback"
              className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-400 hover:bg-white/5"
              onClick={() => setMobileOpen(false)}
            >
              Feedback
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export function MarketingPage({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  body: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f6f0df] text-slate-950">
      <MarketingNav />
      <section className="relative overflow-hidden bg-slate-950 px-4 pb-16 pt-32 text-white sm:px-6 lg:px-8">
        <Image src={marketingImages.hero} alt="" fill priority sizes="100vw" className="object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/45" />
        <div className="relative mx-auto max-w-7xl">
          <p className="w-fit border border-yellow-500/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-yellow-400">
            {eyebrow}
          </p>
          <h1 className="mt-7 max-w-4xl text-4xl font-bold tracking-normal sm:text-6xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">{body}</p>
        </div>
      </section>
      {children}
      <MarketingFooter />
    </main>
  );
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="w-fit border border-yellow-600/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-yellow-700">
      {children}
    </p>
  );
}

export function TrustStrip() {
  return (
    <section className="border-y border-slate-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 text-center text-sm font-semibold text-slate-600">
        <Link href="/privacy" className="hover:text-amber-800">
          Privacy-first
        </Link>
        <span className="hidden text-slate-300 sm:inline">·</span>
        <Link href="/security" className="hover:text-amber-800">
          Source-backed AI
        </Link>
        <span className="hidden text-slate-300 sm:inline">·</span>
        <Link href="/pricing" className="hover:text-amber-800">
          Free to start
        </Link>
        <span className="hidden text-slate-300 sm:inline">·</span>
        <Link href="/data-ownership" className="hover:text-amber-800">
          Export anytime
        </Link>
      </div>
    </section>
  );
}

export function MarketingCTA({
  title = 'Ready to open Studio?',
  body = 'Sign in free — we load a sample family so you can explore in under a minute.',
  primaryLabel = 'Open Studio',
  secondaryLabel = 'Create free account',
}: {
  title?: string;
  body?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
}) {
  const { isAuthenticated } = useAuth();
  const primaryHref = isAuthenticated ? '/studio' : studioLoginPath;
  const secondaryHref = isAuthenticated ? '/ask' : registerPathWithNext('/studio');

  return (
    <section className="bg-amber-600 px-4 py-16 text-center text-white sm:px-6 lg:px-8">
      <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
      <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-amber-50">{body}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={primaryHref} className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-amber-800 hover:bg-amber-50">
          {primaryLabel}
        </Link>
        <Link
          href={secondaryHref}
          className="rounded-xl border border-white/40 px-6 py-3 text-sm font-bold text-white hover:bg-white/10"
        >
          {secondaryLabel}
        </Link>
      </div>
    </section>
  );
}

export function MarketingFooter() {
  return (
    <footer className="bg-[#29231f] px-4 py-14 text-slate-300 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
        <div>
          <h2 className="text-2xl font-bold text-white">MemoryGraph</h2>
          <p className="mt-3 max-w-sm text-sm leading-7 text-slate-400">
            A private family memory companion — ask questions with real sources, map your people, and share life chapters.
          </p>
          <Link
            href={studioLoginPath}
            className="mt-5 inline-flex rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400"
          >
            Open Studio
          </Link>
        </div>
        {[
          [
            'Product',
            [
              ['Features', '/features'],
              ['How it works', '/how-it-works'],
              ['Pricing', '/pricing'],
              ['Local AI', '/local-ai'],
            ],
          ],
          [
            'Company',
            [
              ['About', '/about'],
              ['Contact', '/contact'],
              ['Feedback', '/feedback'],
              ['Privacy', '/privacy'],
              ['Security', '/security'],
              ['Terms', '/terms'],
            ],
          ],
          [
            'Experiences',
            [
              ['Families', '/families'],
              ['Facilities', '/facilities'],
              ['Veterans', '/veterans'],
              ['Data ownership', '/data-ownership'],
            ],
          ],
        ].map(([title, links]) => (
          <div key={title as string}>
            <p className="font-bold text-white">{title as string}</p>
            <div className="mt-4 space-y-3">
              {(links as string[][]).map(([label, href]) => (
                <Link key={href} href={href} className="block text-sm text-slate-400 hover:text-white">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-6 text-sm text-slate-500">
        © {new Date().getFullYear()} MemoryGraph. Built for families — private, source-backed, exportable.
      </div>
    </footer>
  );
}

export function FeatureShowcaseRow({
  eyebrow,
  title,
  body,
  bullets,
  image,
  reverse = false,
}: {
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  image: string;
  reverse?: boolean;
}) {
  return (
    <div className={`grid gap-10 lg:grid-cols-2 lg:items-center ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-yellow-700">{eyebrow}</p>
        <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950">{title}</h2>
        <p className="mt-4 text-sm leading-7 text-slate-600">{body}</p>
        <div className="mt-5 space-y-2">
          {bullets.map((bullet) => (
            <div key={bullet} className="flex gap-3 text-sm leading-6 text-slate-700">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-600" />
              <span>{bullet}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="relative min-h-[320px] overflow-hidden rounded-2xl bg-slate-950 shadow-2xl">
        <Image src={marketingImageSrc(image, 'hero')} alt={title} fill sizes="(min-width: 1024px) 42vw, 100vw" className="object-cover opacity-85" />
        <div className="absolute bottom-4 right-4 rounded-xl bg-white/90 px-4 py-3 text-xs font-semibold text-slate-800 shadow-xl">
          MemoryGraph preview
        </div>
      </div>
    </div>
  );
}

export function PlatformPreviewCard({
  title,
  body,
  image,
  dark = false,
}: {
  title: string;
  body: string;
  image: string;
  dark?: boolean;
}) {
  const safeImage = marketingImageSrc(image, 'hero');

  return (
    <div className={`overflow-hidden rounded-2xl border shadow-sm ${dark ? 'border-amber-500/30 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-950'}`}>
      <div className="relative h-60">
        <Image src={safeImage} alt={title} fill sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover opacity-85" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
        </div>
      </div>
    </div>
  );
}

export function InfoCardGrid({ items }: { items: ReadonlyArray<{ title: string; body: string }> }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {items.map(({ title, body }) => (
        <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-slate-950">{title}</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
        </div>
      ))}
    </div>
  );
}

export function PricingComparisonTable() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-5 py-4 font-bold text-slate-950">Feature</th>
            <th className="px-5 py-4 font-bold text-slate-950">Free</th>
            <th className="px-5 py-4 font-bold text-slate-950">Family</th>
            <th className="px-5 py-4 font-bold text-slate-950">Self-hosted</th>
          </tr>
        </thead>
        <tbody>
          {pricingComparison.map((row) => (
            <tr key={row.feature} className="border-b border-slate-100">
              <td className="px-5 py-3 font-medium text-slate-800">{row.feature}</td>
              <td className="px-5 py-3 text-slate-600">{row.free ? '✓' : '—'}</td>
              <td className="px-5 py-3 text-slate-600">{row.family ? '✓' : '—'}</td>
              <td className="px-5 py-3 text-slate-600">{row.selfHosted ? '✓' : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
