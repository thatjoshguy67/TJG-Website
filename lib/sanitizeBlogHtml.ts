import 'server-only';
import sanitizeHtml from 'sanitize-html';
import { optimizedBlogImageAttributes, LEADING_IMAGE_TEXT_LIMIT } from './blogImages';
import { safeContentHref, safeEmbedHref, embedTitle } from './contentUrls';
/** Normalize rich content before SSR, preserving permitted media and layout. */
export function sanitizeBlogHtml(html: string, { prioritizeLeadingImage = true }: { prioritizeLeadingImage?: boolean } = {}): string {
  const ids = new Set<string>();
  let precedingTextLength = 0;
  let precedingMedia = false;
  const groupedMedia: boolean[] = [];
  return sanitizeHtml(html, {
    onOpenTag: (name, attributes) => {
      const grouped = /(?:gallery|slideshow|image-compare|ko-compare)/.test(attributes.class || '');
      groupedMedia.push(grouped || groupedMedia.at(-1) === true);
      if (grouped || ['iframe', 'video', 'audio', 'table'].includes(name)) precedingMedia = true;
    },
    onCloseTag: () => { groupedMedia.pop(); },
    textFilter: text => {
      precedingTextLength += text.trim().length;
      return text;
    },
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'iframe', 'video', 'audio', 'source', 'track', 'figure', 'figcaption'],
    allowedAttributes: {
      '*': ['class', 'id', 'style', 'title', 'lang', 'dir'],
      a: ['href', 'target', 'rel', 'data-src', 'data-iframe-src'],
      img: ['src', 'alt', 'width', 'height', 'loading', 'decoding', 'fetchpriority', 'data-full', 'srcset', 'sizes'],
      iframe: ['src', 'title', 'width', 'height', 'loading', 'allow', 'allowfullscreen', 'referrerpolicy'],
      video: ['src', 'width', 'height', 'controls', 'preload', 'poster', 'playsinline', 'loop', 'muted'],
      audio: ['src', 'controls', 'preload'], source: ['src', 'type', 'media'],
      track: ['src', 'kind', 'srclang', 'label', 'default'],
      td: ['colspan', 'rowspan'], th: ['colspan', 'rowspan', 'scope'], ol: ['start', 'reversed'],
    },
    allowedSchemes: ['https', 'http', 'mailto', 'tel'], allowProtocolRelative: false,
    allowedStyles: { '*': Object.fromEntries(['width', 'height', 'max-width', 'max-height', 'min-height', 'aspect-ratio', 'object-fit', 'text-align', 'font-weight', 'font-style', 'text-decoration', 'margin', 'margin-top', 'margin-bottom', 'padding', 'border', 'border-radius', 'display', 'gap', 'grid-template-columns', 'flex-basis', 'vertical-align'].map(p => [p, [/^(?!.*(?:url|expression|@|\\)).+$/i]])) },
    transformTags: { '*': (tagName, attributes) => {
      const a = { ...attributes };
      if (a.id) { const base = a.id; let n = 2; while (ids.has(a.id)) a.id = `${base}-${n++}`; ids.add(a.id); }
      if (tagName === 'a') {
        a.href = safeContentHref(a.href || '');
        if (a.target === '_blank') a.rel = 'noopener noreferrer';
        for (const key of ['data-src', 'data-iframe-src']) if (a[key]) a[key] = safeEmbedHref(a[key]);
      }
      if (tagName === 'img') {
        a.src = safeContentHref(a.src || '', true);
        if (a['data-full']) a['data-full'] = safeContentHref(a['data-full'], true);
        // Never forward arbitrary srcset candidates from CMS HTML. Generate our own
        // for supported sources; leave galleries to their dedicated renderer.
        delete a.srcset;
        delete a.sizes;
        const grouped = groupedMedia.at(-1) === true;
        const smallImage = Number(a.width) > 0 && Number(a.width) < 200;
        const leading = prioritizeLeadingImage && Boolean(a.src) && !precedingMedia && !grouped && !smallImage
          && precedingTextLength <= LEADING_IMAGE_TEXT_LIMIT;
        if (!grouped) {
          const full = a['data-full'];
          Object.assign(a, optimizedBlogImageAttributes(a.src));
          if (full) a['data-full'] = full;
        }
        if (a.src) precedingMedia = true;
        a.alt = a.alt || '';
        a.loading = leading ? 'eager' : 'lazy';
        a.decoding = 'async';
        a.fetchpriority = leading ? 'high' : 'auto';
      }
      if (tagName === 'iframe') {
        a.src = safeEmbedHref(a.src || ''); a.title = a.title?.trim() || embedTitle(a.src);
        a.loading = 'lazy'; a.referrerpolicy = 'strict-origin-when-cross-origin'; a.allow = 'fullscreen; picture-in-picture';
      }
      if (['audio', 'video', 'source', 'track'].includes(tagName)) {
        if (a.src) a.src = safeContentHref(a.src, true);
        if (a.poster) a.poster = safeContentHref(a.poster, true);
        if (tagName === 'audio' || tagName === 'video') { a.preload = 'metadata'; a.controls = ''; }
      }
      return { tagName, attribs: a };
    } },
    exclusiveFilter: frame => ['iframe', 'img'].includes(frame.tag) && !frame.attribs.src,
  });
}
