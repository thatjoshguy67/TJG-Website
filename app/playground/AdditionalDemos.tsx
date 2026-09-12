'use client';

import { useState } from 'react';
import ShortcutPopover from '../components/ShortcutPopover';
import SearchShortcutChip from '../components/SearchShortcutChip';
import ReadingLayoutMenu from '../settings/ReadingLayoutMenu';
import PostActions from '../blog/PostActions';
import { BlogContentCard, CarouselContentCard, ShopContentCard } from '../components/ContentCards';
import type { BlogSummary } from '../../lib/blog';
import './playground.css';

const examplePost: BlogSummary = {
  id: 'playground-post',
  slug: 'getaway-driver-final-major-project',
  title: { rendered: 'Final Major Project Getaway Driver' },
  excerpt: { rendered: 'Research, planning and production from the final major project.' },
  date: '2026-03-16T00:00:00Z',
  categories: ['final-major-project'],
  tags: [],
  featuredImageUrl: '/images/projects/oneui-bento.png',
};

export function PopoverDemo() {
  return (
    <div className="playground-demo-actions playground-demo-centered">
      <ShortcutPopover title="Search" content={<span>Focus the search field with <SearchShortcutChip />.</span>}>
        {descriptionId => <button className="blog-button" aria-describedby={descriptionId}>Search hint</button>}
      </ShortcutPopover>
      <ShortcutPopover title="Navigation" placement="right" content={<span>Press <kbd className="keyboard-shortcut-chip">/</kbd> to expand or collapse navigation.</span>}>
        {descriptionId => <button className="blog-button blog-button--secondary" aria-describedby={descriptionId}>Navigation hint</button>}
      </ShortcutPopover>
    </div>
  );
}

export function MenusDemo() {
  const [compact, setCompact] = useState(false);
  return (
    <div className="playground-demo-stack">
      <div className="playground-demo-row">
        <span>Reading layout</span>
        <ReadingLayoutMenu compact={compact} onChange={setCompact} />
      </div>
      <div className="playground-demo-row">
        <span>Post options</span>
        <PostActions slug={examplePost.slug} preview />
      </div>
    </div>
  );
}

export function ContentCardsDemo() {
  const [variant, setVariant] = useState<'shop' | 'blog' | 'carousel'>('shop');
  return (
    <div className="playground-demo-stack">
      <div className="playground-demo-actions" role="group" aria-label="Content card variant">
        {(['shop', 'blog', 'carousel'] as const).map(value => (
          <button key={value} className="playground-chip" aria-pressed={variant === value} onClick={() => setVariant(value)}>
            {value === 'carousel' ? 'Home carousel' : value === 'shop' ? 'Shop' : 'Blog'}
          </button>
        ))}
      </div>
      {variant === 'shop' && <ShopContentCard product={{ id: 'playground-product', name: 'One UI Design Kit', url: '/shop', imageUrl: '/images/projects/oneui-design-kit-cover-light.png', formattedPrice: 'Example price' }} />}
      {variant === 'blog' && <BlogContentCard post={examplePost} categories={['Final Major Project']} />}
      {variant === 'carousel' && (
        <div className="playground-card-carousel" aria-label="Home content card carousel" tabIndex={0}>
          <CarouselContentCard post={{ id: examplePost.id, slug: examplePost.slug, title: examplePost.title.rendered, thumbnail: examplePost.featuredImageUrl, date: examplePost.date }} />
          <CarouselContentCard post={{ id: 'playground-fallback', slug: examplePost.slug, title: 'Content card without a thumbnail', thumbnail: null, date: examplePost.date }} />
        </div>
      )}
    </div>
  );
}

export function SkeletonDemo() {
  return (
    <div className="playground-demo-stack" role="img" aria-label="Article loading skeleton with image and text placeholders">
      <div className="skeleton-box" style={{ height: 140, borderRadius: 20 }} aria-hidden="true" />
      {[85, 100, 70].map(width => <div key={width} className="skeleton-box" style={{ width: `${width}%`, height: 14 }} aria-hidden="true" />)}
    </div>
  );
}
