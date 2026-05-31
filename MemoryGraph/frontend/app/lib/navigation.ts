import type { MemorySurface } from '@/app/lib/memoryTypes';

export type PrimaryNavId = 'home' | 'ask' | 'stories' | 'family';

export interface NavItem {
  href: string;
  surface: MemorySurface;
  label: string;
  description: string;
  primary?: PrimaryNavId;
}

/** Main app navigation — four clear destinations. */
export const primaryNav: NavItem[] = [
  { href: '/studio', surface: 'studio', label: 'Home', description: 'Your memories at a glance', primary: 'home' },
  { href: '/ask', surface: 'ask', label: 'Ask', description: 'Questions with real sources', primary: 'ask' },
  { href: '/stories', surface: 'stories', label: 'Stories', description: 'Life chapters and sharing', primary: 'stories' },
  { href: '/family', surface: 'family-tree', label: 'Family', description: 'People and connections', primary: 'family' },
];

/** Settings and advanced tools — not in main nav. */
export const settingsNav: NavItem[] = [
  { href: '/settings', surface: 'trust', label: 'Settings', description: 'Privacy, export, invites' },
];

/** Legacy routes kept for bookmarks; hidden from nav. */
export const legacyRouteRedirects: Record<string, string> = {
  '/memory-proof': '/ask',
  '/life-map': '/family',
  '/life-chapters': '/stories',
  '/family-tree': '/family',
  '/time-machine': '/stories',
  '/one-life-story': '/stories',
  '/memory-capsules': '/stories',
};

export const storiesSubNav = [
  { href: '/stories', label: 'Overview', surface: 'stories' as MemorySurface },
  { href: '/time-machine', label: 'Build a chapter', surface: 'time-machine' as MemorySurface },
  { href: '/one-life-story', label: 'Share a life story', surface: 'one-life-story' as MemorySurface },
  { href: '/memory-capsules', label: 'Letters for later', surface: 'memory-capsules' as MemorySurface },
];

export const familySubNav = [
  { href: '/family', label: 'Family map', surface: 'family-tree' as MemorySurface },
  { href: '/people', label: 'Family members', surface: 'people' as MemorySurface },
];

export function pageMetaForSurface(surface: MemorySurface): { title: string; description: string } {
  const map: Partial<Record<MemorySurface, { title: string; description: string }>> = {
    studio: { title: 'Home', description: 'See your memories, map, and what to do next.' },
    ask: { title: 'Ask', description: 'Every answer links to your real photos and notes.' },
    stories: { title: 'Stories', description: 'Turn years into chapters you can read and share.' },
    'time-machine': { title: 'Build a chapter', description: 'Describe a person and time — we weave a story from your memories.' },
    'one-life-story': { title: 'Share a life story', description: 'One beautiful link for family to read.' },
    'memory-capsules': { title: 'Letters for later', description: 'Schedule a message for someone in the future.' },
    'family-tree': { title: 'Family map', description: 'See how people, places, and memories connect.' },
    people: { title: 'Family members', description: 'Profiles built from your memories.' },
    trust: { title: 'Settings', description: 'Privacy, export, and family access.' },
    'memory-proof': { title: 'Ask', description: 'Sources now live beside every answer.' },
  };
  return map[surface] || { title: 'MemoryGraph', description: 'Your personal memory companion.' };
}

export function isPrimarySurface(surface: MemorySurface): boolean {
  return primaryNav.some((item) => item.surface === surface) || surface === 'stories';
}
