export type PortableTextMarkDef = {
  _key: string;
  _type: string;
  href?: string;
};

export type PortableTextSpan = {
  _key?: string;
  _type: 'span';
  text?: string;
  marks?: string[];
};

export type PortableTextBlock = {
  _key?: string;
  _type: string;
  style?: string;
  listItem?: 'bullet' | 'number';
  level?: number;
  children?: PortableTextSpan[];
  markDefs?: PortableTextMarkDef[];
  asset?: { _ref?: string };
  alt?: string;
  caption?: string;
  href?: string;
  label?: string;
  iconName?: string;
  embedKey?: string;
  url?: string;
  html?: string;
  tone?: 'info' | 'tip' | 'warning';
  title?: string;
  text?: string;
  icon?: { name?: string; svg?: string };
};

export function portableTextToPlainText(blocks?: PortableTextBlock[] | null): string {
  if (!Array.isArray(blocks)) return '';

  return blocks
    .map((block) => {
      if (Array.isArray(block.children)) {
        return block.children.map((child) => child.text || '').join('');
      }
      if (block._type === 'callout') return [block.title, block.text].filter(Boolean).join('\n');
      return block.caption || block.label || block.embedKey || block.url || '';
    })
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

export function stripHtmlAndDecode(value?: string): string {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)))
    .replace(/\s+/g, ' ')
    .trim();
}
