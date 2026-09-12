import 'server-only';
import { getImageProps } from 'next/image';
import remotePatterns from './imageRemotePatterns.json';

// Reading width is user-configurable. Avoid undersizing wide desktop layouts.
export const BLOG_IMAGE_SIZES = '(max-width: 699px) calc(100vw - 40px), calc(100vw - 112px)';
export const LEADING_IMAGE_TEXT_LIMIT = 400;

function canOptimize(src: string): boolean {
  if (/^\/images\/[^?#]+\.(?:png|jpe?g|webp|avif)(?:[?#]|$)/i.test(src)) return true;
  try {
    const url = new URL(src);
    if (url.protocol !== 'https:' || url.port || url.username || url.password) return false;
    if (/\.(?:svg|gif)$/i.test(url.pathname)) return false;
    return remotePatterns.some(pattern => {
      const hostnameMatches = pattern.hostname.startsWith('*.')
        ? url.hostname.endsWith(pattern.hostname.slice(1)) && url.hostname.split('.').length === pattern.hostname.split('.').length
        : url.hostname === pattern.hostname;
      return hostnameMatches && (!pattern.pathname || url.pathname.startsWith(pattern.pathname.replace(/\*\*$/, '')));
    });
  } catch { return false; }
}

/** Only generate optimizer URLs for sources accepted by the site's image config. */
export function optimizedBlogImageAttributes(src: string): Record<string, string> {
  if (!canOptimize(src)) return {};
  const { props } = getImageProps({ src, alt: '', fill: true, sizes: BLOG_IMAGE_SIZES });
  return { src: props.src, srcset: props.srcSet || '', sizes: BLOG_IMAGE_SIZES, 'data-full': src };
}
