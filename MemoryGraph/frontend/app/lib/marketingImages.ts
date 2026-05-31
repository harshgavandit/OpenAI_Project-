/** Shared marketing image URLs (server + client safe — no "use client"). */

export const marketingImages = {
  hero: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1600&q=80',
  photos: 'https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?auto=format&fit=crop&w=1200&q=80',
  family: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1200&q=80',
  table: 'https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?auto=format&fit=crop&w=1200&q=80',
  archive: 'https://images.unsplash.com/photo-1491013516836-7db643ee125a?auto=format&fit=crop&w=1200&q=80',
  letter: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=1200&q=80',
} as const;

export type MarketingImageKey = keyof typeof marketingImages;

export function marketingImageSrc(key: MarketingImageKey | string | undefined | null, fallback: MarketingImageKey = 'hero'): string {
  if (key && key in marketingImages) {
    return marketingImages[key as MarketingImageKey];
  }
  const direct = typeof key === 'string' ? key.trim() : '';
  if (direct) return direct;
  return marketingImages[fallback];
}
