'use client';

import { familySubNav, storiesSubNav } from '@/app/lib/navigation';
import type { MemorySurface } from '@/app/lib/memoryTypes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const STORY_SURFACES: MemorySurface[] = ['stories', 'time-machine', 'one-life-story', 'memory-capsules'];
const FAMILY_SURFACES: MemorySurface[] = ['family-tree', 'people'];

export function SubNavTabs({ surface }: { surface: MemorySurface }) {
  const pathname = usePathname();
  const tabs = STORY_SURFACES.includes(surface)
    ? storiesSubNav
    : FAMILY_SURFACES.includes(surface)
      ? familySubNav
      : null;

  if (!tabs) return null;

  return (
    <nav className="flex gap-1 overflow-x-auto rounded-2xl bg-slate-100/80 p-1" aria-label="Section">
      {tabs.map((tab) => {
        const active = pathname === tab.href || surface === tab.surface;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${
              active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
