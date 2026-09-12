import Image from 'next/image';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import { Download } from '@thatjoshguy/oneui-icons';
import { stripHtmlAndDecode } from '../../lib/portableText';
import type { GumroadProduct } from '../../lib/gumroad';
import type { BlogSummary } from '../../lib/blog';
import type { RecentBlogPost } from '../../lib/recent-blog-posts';
import './ContentCards.css';

function ProductRating({ average, count }: { average: number; count?: number }) {
  const roundedRating = Math.round(average);

  return (
    <span
      className="shop-product-rating"
      aria-label={`${average.toFixed(1)} out of 5 stars${count === undefined ? '' : ` from ${count} reviews`}`}
    >
      <span className="shop-product-stars" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index} className={index < roundedRating ? "is-filled" : undefined}>
            ★
          </span>
        ))}
      </span>
      <span>{average.toFixed(1)}</span>
      {count !== undefined && <span>({count.toLocaleString()})</span>}
    </span>
  );
}

export function ShopContentCard({ product }: { product: GumroadProduct }) {
  return (
    <a
      href={product.url}
      className="shop-product-card"
      aria-label={product.name}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="shop-product-card-background">
        <Image
          src={product.imageUrl}
          alt=""
          fill
          sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1023px) 80vw, 40vw"
        />
      </div>
      <div className="shop-product-card-gradient" aria-hidden="true" />
      <div className="shop-product-card-content">
        <h2>{product.name}</h2>
        <div className="shop-product-card-meta">
          {product.formattedPrice && (
            <span className="shop-product-pill shop-product-price">
              {product.formattedPrice}
            </span>
          )}
          {product.salesCount !== undefined && (
            <span
              className="shop-product-pill"
              aria-label={`${product.salesCount.toLocaleString()} downloads`}
            >
              <span aria-hidden="true">
                <Download size={14} color="currentColor" />
              </span>
              <span aria-hidden="true">
                {product.salesCount.toLocaleString()}
              </span>
            </span>
          )}
          {product.rating && (
            <ProductRating {...product.rating} />
          )}
        </div>
      </div>
    </a>
  );
}

export function BlogContentCard({ post, categories = [], preload = false }: { post: BlogSummary; categories?: string[]; preload?: boolean }) {
  const featuredImageUrl = post.featuredImageUrl;
  return (
    <Link href={`/blog/${post.slug}`} className="list blog-index-card">
      <div className={`blog-card-container${featuredImageUrl ? ' blog-card-container--image' : ' blog-card-container--fallback'}`}>
        {featuredImageUrl && (
          <div className="blog-card-background" aria-hidden="true">
            <Image
              src={featuredImageUrl}
              alt=""
              fill
              sizes="(max-width: 699px) calc(100vw - 56px), (max-width: 1200px) calc((100vw - 220px) / 2), 520px"
              preload={preload}
              style={{ objectFit: 'cover' }}
            />
          </div>
        )}
        <div className="blog-card-gradient" aria-hidden="true" />
        <div className="blog-card-text-content">
          <div className="body-text-blog-title" >{stripHtmlAndDecode(post.title.rendered)}</div>
          <div className="information-wrapper">
            <div className="information" >{stripHtmlAndDecode(post.excerpt.rendered)}</div>
            <div className="blog-card-meta">
              <div className="blog-card-pill">
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </div>

              {categories.length > 0 && (
                <div className="blog-card-pill blog-card-pill-muted">
                  {categories.join(', ')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CarouselContentCard({ post, ...linkProps }: { post: RecentBlogPost } & Omit<ComponentProps<typeof Link>, 'href' | 'children'>) {
  return (
    <Link {...linkProps} href={`/blog/${post.slug}`} className={`design-project-card${linkProps.className ? ` ${linkProps.className}` : ''}`}>
      <div className="design-project-thumbnail">
        {post.thumbnail && (
          <Image
            src={post.thumbnail}
            alt={post.title.replace(/<[^>]*>/g, '')}
            width={400}
            height={225}
            className="design-project-image"
          />
        )}
      </div>
      <div className="design-project-info">
        <span className="design-project-title" >{stripHtmlAndDecode(post.title)}</span>
        <span className="design-project-tag">Blog</span>
      </div>
    </Link>
  );
}
