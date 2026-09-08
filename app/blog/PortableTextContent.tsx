import { uniqueHeadingId } from '../../lib/headings';
import { safeContentHref } from '../../lib/contentUrls';
import Image from 'next/image';
import type React from 'react';
import { getEmbedHtmlForKey, processContentWithEmbeds } from '../../lib/blogContentProcessing';
import { getSanityImageUrl, type SanityImageSource } from '../../lib/sanity';
import type { PortableTextBlock, PortableTextMarkDef, PortableTextSpan } from '../../lib/portableText';
import BlogButton from './BlogButton';
import BlogContent from './BlogContent';

interface PortableTextContentProps {
  blocks: PortableTextBlock[];
}

function getMarkDef(markDefs: PortableTextMarkDef[] | undefined, mark: string) {
  return markDefs?.find(def => def._key === mark);
}

function renderSpan(span: PortableTextSpan, markDefs: PortableTextMarkDef[] | undefined, index: number) {
  let node: React.ReactNode = span.text || '';

  for (const mark of span.marks || []) {
    const def = getMarkDef(markDefs, mark);
    if (def?._type === 'link' && def.href) {
      node = (
        <a key={`${span._key || index}-${mark}`} href={safeContentHref(def.href) || undefined} target="_blank" rel="noopener noreferrer">
          {node}
        </a>
      );
    } else if (mark === 'strong') {
      node = <strong key={`${span._key || index}-${mark}`}>{node}</strong>;
    } else if (mark === 'em') {
      node = <em key={`${span._key || index}-${mark}`}>{node}</em>;
    } else if (mark === 'code') {
      node = <code key={`${span._key || index}-${mark}`}>{node}</code>;
    } else if (mark === 'underline') {
      node = <u key={`${span._key || index}-${mark}`}>{node}</u>;
    }
  }

  return <span key={span._key || index}>{node}</span>;
}

function renderChildren(block: PortableTextBlock) {
  return block.children?.map((span, index) => renderSpan(span, block.markDefs, index));
}

function PortableImage({ block }: { block: PortableTextBlock }) {
  const image = block as SanityImageSource;
  const src = getSanityImageUrl(image);
  const dimensions = image?.asset?._ref?.match(/-(\d+)x(\d+)-[^-]+$/);
  // Unknown legacy asset dimensions: avoid inventing an aspect ratio.
  // eslint-disable-next-line @next/next/no-img-element
  if (!dimensions) return src ? <figure className="portable-image portable-image--intrinsic"><img src={src} alt={block.alt || block.caption || ''} loading="lazy" decoding="async" />{block.caption && <figcaption>{block.caption}</figcaption>}</figure> : null;
  const crop = image?.crop;
  const width = Math.max(1, Math.round(Number(dimensions[1]) * (1 - (crop?.left || 0) - (crop?.right || 0))));
  const height = Math.max(1, Math.round(Number(dimensions[2]) * (1 - (crop?.top || 0) - (crop?.bottom || 0))));
  if (!src) return null;

  return (
    <figure className="portable-image" style={{ '--blog-media-ratio': width / height } as React.CSSProperties}>
      <div className="portable-image-frame">
        <Image
          src={src}
          alt={block.alt || block.caption || ''}
          width={width}
          height={height}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          style={{ width: '100%', height: 'auto' }}
        />
      </div>
      {block.caption && <figcaption>{block.caption}</figcaption>}
    </figure>
  );
}

function renderBlock(block: PortableTextBlock, index: number, heading?: { id: string; level: number }) {
  const key = block._key || index;

  if (block._type === 'image') {
    return <PortableImage key={key} block={block} />;
  }

  if (block._type === 'blogButton' && block.label && block.href) {
    return <BlogButton key={key} label={block.label} href={block.href} iconName={block.iconName} />;
  }

  if (block._type === 'embed' && block.embedKey) {
    const html = getEmbedHtmlForKey(block.embedKey);
    return html ? <div key={key} dangerouslySetInnerHTML={{ __html: html }} /> : null;
  }

  if (block._type === 'legacyHtml' && block.html) {
    return <BlogContent key={key} content={processContentWithEmbeds(block.html)} />;
  }

  const children = renderChildren(block);
  if (!children?.length) return null;

  if (block.listItem === 'bullet') {
    return <li key={key}>{children}</li>;
  }
  if (block.listItem === 'number') {
    return <li key={key}>{children}</li>;
  }

  if (heading) {
    const Tag = `h${heading.level}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    return <Tag key={key} id={heading.id} className={`content-heading-${block.style}`}>{children}</Tag>;
  }
  return block.style === 'blockquote' ? <blockquote key={key}>{children}</blockquote> : <p key={key}>{children}</p>;
}

export default function PortableTextContent({ blocks }: PortableTextContentProps) {
  const renderedBlocks: React.ReactNode[] = [];
  const ids = new Map<string, number>();
  const shift = blocks.some(b => b.style === 'h1') ? 1 : 0;
  let previousHeading = 1;
  let index = 0;
  function list(level: number, type: 'bullet' | 'number'): React.ReactNode {
    const children: React.ReactNode[] = [];
    const start = index;
    while (index < blocks.length) {
      const block = blocks[index];
      const depth = Math.max(1, Math.min(6, block.level || 1));
      if (!block.listItem || depth < level || (depth === level && block.listItem !== type)) break;
      const key = block._key || index;
      index++;
      const nested: React.ReactNode[] = [];
      while (index < blocks.length && blocks[index].listItem && Math.max(1, Math.min(6, blocks[index].level || 1)) > level) {
        nested.push(list(Math.max(1, Math.min(6, blocks[index].level || 1)), blocks[index].listItem!));
      }
      children.push(<li key={key}>{renderChildren(block)}{nested}</li>);
    }
    const Tag = type === 'number' ? 'ol' : 'ul';
    return <Tag key={`list-${start}`}>{children}</Tag>;
  }
  while (index < blocks.length) {
    const block = blocks[index];
    if (block.listItem) { renderedBlocks.push(list(Math.max(1, Math.min(6, block.level || 1)), block.listItem)); continue; }
    let heading: { id: string; level: number } | undefined;
    if (/^h[1-6]$/.test(block.style || '')) {
      const level = Math.max(2, Math.min(6, Number(block.style![1]) + shift, previousHeading + 1));
      previousHeading = level;
      heading = { level, id: uniqueHeadingId(block.children?.map(s => s.text || '').join('') || 'section', ids) };
    }
    renderedBlocks.push(renderBlock(block, index, heading));
    index++;
  }
  return <div className="body-text portable-text">{renderedBlocks}</div>;
}
