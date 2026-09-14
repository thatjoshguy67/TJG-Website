import sanitizeHtml from 'sanitize-html';
import { safeEmbedHref } from './contentUrls';
import { sanitizeBlogHtml } from './sanitizeBlogHtml';

/** Recover iframe code and URLs saved in the old admin's embed-key field. */
export function cmsEmbedHtml(input: string): string | null {
  const value = input.trim();
  const dimension = (raw: string | undefined, fallback: number) => raw && /^\d+$/.test(raw) && Number(raw) > 0 && Number(raw) <= 4096 ? Number(raw) : fallback;
  const src = safeEmbedHref(value);
  if (!src && !value.startsWith('<')) return null;
  const escapeAttribute = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Extract only iframe elements. The regular reader sanitizer still enforces
  // the provider allowlist, safe attributes, and URL policy before rendering.
  const frames = sanitizeHtml(src ? `<iframe src="${escapeAttribute(src)}"></iframe>` : value, {
    allowedTags: ['iframe'],
    allowedAttributes: { iframe: ['src', 'title', 'width', 'height', 'style', 'allowfullscreen'] },
    allowedSchemes: ['https'],
    allowProtocolRelative: false,
    textFilter: () => '',
    transformTags: {
      iframe: (_tag, attributes) => {
        const width = dimension(attributes.width, 800);
        const height = dimension(attributes.height, 450);
        return { tagName: 'iframe', attribs: {
          src: safeEmbedHref(attributes.src || ''),
          title: attributes.title || 'Embedded content',
          width: String(width), height: String(height), allowfullscreen: '',
          style: `width:100%;height:auto;aspect-ratio:${width}/${height};border:0;display:block`,
        } };
      },
    },
    exclusiveFilter: frame => frame.tag === 'iframe' && !frame.attribs.src,
  });
  return frames.includes('<iframe') ? sanitizeBlogHtml(`<div class="embed-wrapper">${frames}</div>`) : null;
}
