/** Public marketing site structure — nav, pricing, trust copy */

export const marketingNavLinks = [
  { label: 'Features', href: '/features' },
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Security', href: '/security' },
  { label: 'Contact', href: '/contact' },
] as const;

export const studioLoginPath = '/auth/login?next=/studio';
export const studioRegisterPath = '/auth/register?next=/studio';

export const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    tagline: 'Everything you need to explore family memories',
    features: [
      'Unlimited memories on your plan',
      'Ask with source-backed answers',
      'Family map & life chapters',
      'Export JSON, CSV & HTML reports',
      'Sample family on first sign-in',
      'Optional local Ollama AI',
    ],
    cta: 'Start free',
    href: studioRegisterPath,
    highlight: true,
  },
  {
    name: 'Family',
    price: '$9',
    period: 'per month · coming soon',
    tagline: 'Shared archives for extended family',
    features: [
      'Multiple family members',
      'Shared collections & invites',
      'Scheduled letters for later',
      'Family ritual email loop',
      'Priority support',
    ],
    cta: 'Join waitlist',
    href: '/contact?reason=Family%20plan%20waitlist',
    highlight: false,
    comingSoon: true,
  },
  {
    name: 'Self-hosted',
    price: 'Free',
    period: 'open source',
    tagline: 'Run on your own server — data never leaves your network',
    features: [
      'Docker & local SQLite',
      'Local Ollama models',
      'Full export & account delete',
      'No vendor lock-in',
    ],
    cta: 'See how it works',
    href: '/local-ai',
    highlight: false,
  },
] as const;

export const pricingComparison = [
  { feature: 'Memory upload & search', free: true, family: true, selfHosted: true },
  { feature: 'Ask with Memory Proof sources', free: true, family: true, selfHosted: true },
  { feature: 'Family map & people', free: true, family: true, selfHosted: true },
  { feature: 'Life chapters & share links', free: true, family: true, selfHosted: true },
  { feature: 'Letters scheduled for later', free: true, family: true, selfHosted: true },
  { feature: 'GDPR export & delete', free: true, family: true, selfHosted: true },
  { feature: 'Shared family invites', free: false, family: true, selfHosted: true },
  { feature: 'Multiple members', free: false, family: true, selfHosted: true },
  { feature: 'Runs fully offline', free: false, family: false, selfHosted: true },
] as const;

export const pricingFaq = [
  {
    q: 'Do I need a credit card to start?',
    a: 'No. The Free plan is $0 forever. Family billing will only activate when shared plans ship.',
  },
  {
    q: 'Does MemoryGraph use paid AI APIs?',
    a: 'No mandatory subscriptions. The app works with optional local Ollama on your machine, or a lightweight fallback when Ollama is off.',
  },
  {
    q: 'Can I export my data?',
    a: 'Yes — JSON archive, relationship CSV, and HTML family reports from Settings anytime.',
  },
  {
    q: 'What happens to my photos?',
    a: 'Files stay in your archive on the server you use (local dev or your self-hosted instance). We do not sell family data.',
  },
] as const;

export const privacySections = [
  {
    title: 'What we store',
    body: 'Account email, encrypted password hash, your uploaded memories (text, metadata, extracted people/places), and relationships you build in the app.',
  },
  {
    title: 'What we do not do',
    body: 'We do not sell family archives, train public models on your private memories, or share data with advertisers.',
  },
  {
    title: 'AI & sources',
    body: 'Answers in Ask are designed to cite source memories. When Ollama is enabled, processing can stay on your machine. Otherwise a local fallback enriches without cloud model calls.',
  },
  {
    title: 'Your controls',
    body: 'Export your full archive (JSON/CSV/HTML), delete individual memories, or delete your account from Settings → Trust.',
  },
  {
    title: 'Cookies & sessions',
    body: 'We use httpOnly cookies for sign-in sessions (mg_access, mg_refresh). No third-party ad trackers on the marketing site.',
  },
  {
    title: 'Public sharing',
    body: 'Story links, capsule pages, and family tree shares are opt-in. Nothing is public until you create and share a link.',
  },
] as const;

export const securitySections = [
  {
    title: 'Authentication',
    body: 'Passwords are hashed with industry-standard algorithms. Sessions use short-lived access tokens and rotating refresh tokens in httpOnly cookies.',
  },
  {
    title: 'Private by default',
    body: 'Memories stay inside your signed-in archive unless you explicitly publish a report, story link, or capsule.',
  },
  {
    title: 'Source-grounded AI',
    body: 'Ask, Time Machine, and Life Chapters cite memory cards — the product is built to reduce invented family history.',
  },
  {
    title: 'Rate limiting',
    body: 'Public contact, feedback, and auth endpoints are rate-limited to reduce abuse.',
  },
  {
    title: 'Portable data',
    body: 'Full archive export, relationship CSV, and HTML reports — leave anytime with your data.',
  },
  {
    title: 'Care boundaries',
    body: 'Care Signals suggest gentle family check-ins only. They are not medical advice, diagnosis, or emergency monitoring.',
  },
] as const;

export const contactReasons = [
  { value: 'Demo request', label: 'Demo request', hint: 'Walk through Studio, Ask, Stories, and Family map.' },
  { value: 'Family archive help', label: 'Family archive question', hint: 'How photos, PDFs, and notes become a living archive.' },
  { value: 'Partnership', label: 'Partnership inquiry', hint: 'Family history, education, or memory preservation.' },
  { value: 'Family plan waitlist', label: 'Family plan waitlist', hint: 'Get notified when shared family billing launches.' },
  { value: 'Technical support', label: 'Technical support', hint: 'Local AI, Ollama, exports, or privacy questions.' },
] as const;

export const feedbackExperiences = [
  'Home & family map',
  'Ask with sources',
  'Stories & life chapters',
  'Time Machine',
  'Letters for later',
  'Export & data ownership',
] as const;
