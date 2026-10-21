import sanitizeHtml from 'sanitize-html';
import { iconTags, iconAttributes, filterIconAttributes } from './calloutSvg';
import { sanitizeBlogHtml } from './sanitizeBlogHtml';
import type { PortableTextBlock } from './portableText';

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

/** Match the Admin callout fields; sanitize CMS SVG again at the reader boundary. */
export function calloutHtml(block: PortableTextBlock): string {
  const tone = block.tone === 'tip' || block.tone === 'warning' ? block.tone : 'info';
  const icon = typeof block.icon?.svg === 'string' && block.icon.svg.length <= 50000
    ? block.icon.svg : '';
  // Sanitize the icon separately so pasted non-SVG HTML cannot enter the body.
  const svg = sanitizeCalloutSvg(icon);
  return sanitizeBlogHtml(`<aside class="blog-callout blog-callout--${tone}" aria-label="${tone} callout">${svg ? `<span class="blog-callout-icon">${svg}</span>` : ''}${block.title ? `<strong>${escapeHtml(block.title)}</strong>` : ''}<p class="blog-callout-body">${escapeHtml(block.text || '')}</p></aside>`);
}

function sanitizeCalloutSvg(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: iconTags, allowedAttributes: iconAttributes,
    parser: { lowerCaseTags: false, lowerCaseAttributeNames: false, recognizeSelfClosing: true },
    nonTextTags: ['script', 'style', 'textarea', 'option', 'foreignObject'],
    textFilter: () => '',
    transformTags: { '*': (tagName, attribs) => ({ tagName, attribs: filterIconAttributes(tagName, attribs) }) },
  });
}
