'use client';

import { useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { enhanceBlogMedia } from './enhanceBlogMedia';
import WordCounter from './WordCounter';
import type { SlideData } from './NativeSlideshow';
import BlogButton from './BlogButton';

const NativeSlideshow = dynamic(() => import('./NativeSlideshow'));

const WORD_COUNTER_REGEX = /\{\{WORD_COUNTER\}\}:(\d+)/;
const BUTTON_REGEX = /\{\{BUTTON:([^|]+)\|([^|}]+)(?:\|([^}]+))?\}\}/;

const SLIDESHOW_GALLERY_RE =
  /<figure\b[^>]*class="[^"]*(?:is-style-slideshow|is-slideshow)[^"]*"[^>]*>[\s\S]*?<\/figure>(?:\s*<\/figure>)*/gi;

const JETPACK_SLIDESHOW_RE =
  /<div\b[^>]*class="[^"]*wp-block-jetpack-slideshow[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi;

interface SlideshowSegment {
  type: 'slideshow';
  slides: SlideData[];
}

interface HtmlSegment {
  type: 'html';
  html: string;
}

type ContentSegment = HtmlSegment | SlideshowSegment;

function extractSlides(galleryHtml: string): SlideData[] {
  const slides: SlideData[] = [];
  const imgRe = /<img\b[^>]*>/gi;
  let imgMatch: RegExpExecArray | null;

  while ((imgMatch = imgRe.exec(galleryHtml)) !== null) {
    const tag = imgMatch[0];
    const src = tag.match(/src="([^"]+)"/i)?.[1] || '';
    const alt = tag.match(/alt="([^"]*?)"/i)?.[1] || '';

    let caption = '';
    const afterImg = galleryHtml.slice(imgMatch.index + tag.length);
    const capMatch = afterImg.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
    if (capMatch) {
      caption = capMatch[1].replace(/<[^>]*>/g, '').trim();
    }

    if (src) slides.push({ src, alt, caption: caption || undefined });
  }
  return slides;
}

function splitContentIntoSegments(html: string): ContentSegment[] {
  if (
    !html.includes('is-style-slideshow') &&
    !html.includes('is-slideshow') &&
    !html.includes('wp-block-jetpack-slideshow')
  ) {
    return [{ type: 'html', html }];
  }

  const combined = new RegExp(
    `(${SLIDESHOW_GALLERY_RE.source})|(${JETPACK_SLIDESHOW_RE.source})`,
    'gi'
  );

  const segments: ContentSegment[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = combined.exec(html)) !== null) {
    if (m.index > lastIndex) {
      segments.push({ type: 'html', html: html.slice(lastIndex, m.index) });
    }
    const slides = extractSlides(m[0]);
    if (slides.length > 0) {
      segments.push({ type: 'slideshow', slides });
    } else {
      segments.push({ type: 'html', html: m[0] });
    }
    lastIndex = m.index + m[0].length;
  }

  if (lastIndex < html.length) {
    segments.push({ type: 'html', html: html.slice(lastIndex) });
  }

  return segments;
}

interface BlogContentProps {
  content: string;
}

export default function BlogContent({ content }: BlogContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const segments = useMemo(() => splitContentIntoSegments(content || ''), [content]);

  useEffect(() => {
    const scope = contentRef.current;
    if (!scope) return;

    const features = enhanceBlogMedia(scope);
    const cleanups: Array<() => void> = [features.cleanup];
    let cancelled = false;

    const loadEnhancers = async () => {
      const tasks: Array<Promise<() => void>> = [];

      if (features.hasImageComparisons) {
        tasks.push(
          import('./enhanceImageCompare').then(({ enhanceImageCompare }) =>
            enhanceImageCompare(scope)
          )
        );
      }
      if (features.hasEmbedPlaceholders) {
        tasks.push(
          import('./enhanceWpBlockEmbeds').then(({ enhanceWpBlockEmbeds }) =>
            enhanceWpBlockEmbeds(scope)
          )
        );
      }
      if (features.hasAudio) {
        tasks.push(
          import('./enhanceAudioPlayer').then(({ enhanceAudioPlayer }) =>
            enhanceAudioPlayer(scope)
          )
        );
      }

      const loadedCleanups = await Promise.all(tasks);
      if (cancelled) {
        loadedCleanups.forEach((cleanup) => cleanup());
      } else {
        cleanups.push(...loadedCleanups);
      }
    };

    const idleWindow = window as typeof window & {
      cancelIdleCallback?: (handle: number) => void;
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions
      ) => number;
    };
    const idleHandle = idleWindow.requestIdleCallback?.(() => loadEnhancers(), {
      timeout: 600,
    });
    const timeoutHandle = idleHandle === undefined
      ? window.setTimeout(loadEnhancers, 0)
      : undefined;

    return () => {
      cancelled = true;
      if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [content]);

  const bodyTextStyle: React.CSSProperties = {
    fontSize: '16px',
    lineHeight: '1.5',
    margin: 0,
    padding: 0,
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    maxWidth: '100%',
  };

  const wordCountMatch = content?.match(WORD_COUNTER_REGEX);

  const renderSegments = (segs: ContentSegment[]) =>
    segs.map((seg, i) => {
      if (seg.type === 'slideshow') {
        return <NativeSlideshow key={`slide-${i}`} slides={seg.slides} />;
      }

      const marker = /\{\{WORD_COUNTER\}\}:(\d+)|\{\{BUTTON:([^|]+)\|([^|}]+)(?:\|([^}]+))?\}\}/g;
      const parts: React.ReactNode[] = [];
      let cursor = 0;
      for (const match of seg.html.matchAll(marker)) {
        const start = match.index!;
        if (start > cursor) parts.push(<div key={`text-${cursor}`} dangerouslySetInnerHTML={{ __html: seg.html.slice(cursor, start) }} />);
        parts.push(match[1] !== undefined
          ? <WordCounter key={`marker-${start}`} count={Number(match[1])} />
          : <BlogButton key={`marker-${start}`} label={match[2]} href={match[3]} iconName={match[4]} />);
        cursor = start + match[0].length;
      }
      if (cursor < seg.html.length) parts.push(<div key={`text-${cursor}`} dangerouslySetInnerHTML={{ __html: seg.html.slice(cursor) }} />);
      return <div key={`html-${i}`}>{parts}</div>;
    });

  const hasSlideshows = segments.some(s => s.type === 'slideshow');
  const hasButtons = BUTTON_REGEX.test(content || '');

  if (hasSlideshows || wordCountMatch || hasButtons) {
    return (
      <div ref={contentRef} className="body-text" style={bodyTextStyle}>
        {renderSegments(segments)}
      </div>
    );
  }

  return (
    <div
      ref={contentRef}
      className="body-text"
      style={bodyTextStyle}
      dangerouslySetInnerHTML={{ __html: content || '' }}
    />
  );
}
