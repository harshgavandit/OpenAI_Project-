import Link from 'next/link';

const faqs = [
  {
    q: 'Where is my data stored?',
    a: 'By default on your server (SQLite + local files). Self-host with Docker for full control.',
  },
  {
    q: 'Why does Google sign-in fail?',
    a: 'Add your site URL to Authorized JavaScript origins in Google Cloud Console and set NEXT_PUBLIC_GOOGLE_CLIENT_ID.',
  },
  {
    q: 'How do sources work?',
    a: 'Ask returns Memory Proof cards — click any source to read the original excerpt.',
  },
  {
    q: 'Upload stuck?',
    a: 'Open Processing queue to retry failed items.',
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[#f6f0df] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold text-slate-950">Help</h1>
        <p className="mt-3 text-slate-600">
          More detail in <Link href="/security" className="font-semibold text-amber-800">Security</Link> and{' '}
          <Link href="/contact" className="font-semibold text-amber-800">Contact</Link>.
        </p>
        <dl className="mt-10 space-y-6">
          {faqs.map((item) => (
            <div key={item.q} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <dt className="font-bold text-slate-950">{item.q}</dt>
              <dd className="mt-2 text-sm leading-7 text-slate-600">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </main>
  );
}
