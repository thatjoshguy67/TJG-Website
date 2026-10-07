import { safeContentHref } from './contentUrls';

/** Serve only configured Gumroad thumbnails directly, without using optimizer quota. */
export function bypassShopImageOptimization(src: string): boolean {
  if (safeContentHref(src, true) !== src) return false;
  try {
    const url = new URL(src);
    return url.protocol === 'https:' && !url.port && !url.username && !url.password &&
      (url.hostname === 'static.gumroad.com' || url.hostname === 'public-files.gumroad.com');
  } catch { return false; }
}
