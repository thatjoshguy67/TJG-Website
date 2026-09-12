import { canonicalContentHref } from '../../../lib/contentUrls';
import { extractPostSections } from '../../../lib/fmpSections';
import type { Metadata } from "next";
import { cache, Suspense } from "react";
import Image from "next/image";
import { fetchBlogPostBySlug, fetchBlogPostFeaturedImage, type BlogPost } from "../../../lib/blog";
import { notFound } from "next/navigation";
import LightboxClient from "../../components/LightboxClient";
import { LoadingDots } from "../../components/LoadingAnim";
import BlogContent from "../BlogContent";
import PortableTextContent from "../PortableTextContent";
import PostSearchBar from "../PostSearchBar";
import { FMP_SLUG } from "../../../lib/fmpSections";
import FmpViewWrapper from "./FmpViewWrapper";
import { getInPostSearchBarEnabled } from "../../../lib/getInPostSearchBarFlag";
import { getInPostSearchBarFmpEnabled } from "../../../lib/getInPostSearchBarFmpFlag";
import TopAppBar from "../../components/TopAppBar";
import PostActions from "../PostActions";
import { getDisplayWordCount, processContentWithEmbeds } from "../../../lib/blogContentProcessing";
import { portableTextToPlainText, stripHtmlAndDecode } from "../../../lib/portableText";
import { getSiteContext } from "../../../lib/siteEdition";

// Access is hostname-dependent, so direct post requests must never reuse static
// output generated for a different site edition.
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const getContentForSlug = cache(async (slug: string): Promise<BlogPost | null> => fetchBlogPostBySlug(slug));

function truncate(value: string, maxLength = 160): string {
  if (value.length <= maxLength) return value;
  const sliceLength = Math.max(0, maxLength - 3);
  return `${value.slice(0, sliceLength).trimEnd()}...`;
}

function getFeaturedImageAltText(post: BlogPost): string | undefined {
  return post.featuredImageAlt;
}

function getRenderableText(post: BlogPost): string {
  return post.contentSource === 'portableText'
    ? portableTextToPlainText(post.portableBody)
    : stripHtmlAndDecode(post.content?.rendered);
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const content = await getContentForSlug(slug);
  if (!content) notFound();

  try {
    const titleText = stripHtmlAndDecode(content.title?.rendered) || "That Josh Guy";
    const seoTitle = stripHtmlAndDecode(content.seo?.title) || titleText;
    const excerptText = stripHtmlAndDecode(content.excerpt?.rendered);
    const fallbackDescription = getRenderableText(content);
    const description = truncate(
      stripHtmlAndDecode(content.seo?.description) || excerptText || fallbackDescription || "Explore the latest stories from That Josh Guy.",
    );

    let featuredImageUrl: string | null = content.seo?.openGraphImageUrl || content.featuredImageUrl;
    if (!featuredImageUrl) {
      try {
        featuredImageUrl = await fetchBlogPostFeaturedImage(slug);
      } catch (error) {
        console.error('Error fetching featured image:', error);
      }
    }

    const imageAlt = content.seo?.openGraphImageAlt || getFeaturedImageAltText(content) || seoTitle;
    const site = await getSiteContext();
    const siteUrl = site.canonicalOrigin;
    const canonical = canonicalContentHref(content.seo?.canonicalUrl || "") || `${siteUrl}/blog/${slug}`;

    return {
      title: `${seoTitle} | That Josh Guy`,
      description,
      robots: content.seo?.noIndex || !site.indexable ? { index: false, follow: false } : undefined,
      openGraph: {
        title: `${seoTitle} | That Josh Guy`,
        description,
        type: "article",
        url: canonical,
        images: featuredImageUrl
          ? [
              {
                url: featuredImageUrl,
                alt: imageAlt,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: `${seoTitle} | That Josh Guy`,
        description,
        images: featuredImageUrl ? [featuredImageUrl] : undefined,
      },
      alternates: {
        canonical,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: "Blog Post | That Josh Guy",
      description: "Explore the latest stories from That Josh Guy.",
    };
  }
}

export default async function BlogPost(props: PageProps) {
  const { slug } = await props.params;
  const content = await getContentForSlug(slug);
  if (!content) notFound();

  return (
    <div className="page">
      <div className="page-body">
        <div className="main-content">
          <Suspense fallback={
            <div className="page-loading-spinner">
              <LoadingDots />
            </div>
          }>
            <BlogPostBody slug={slug} />
          </Suspense>
        </div>
      </div>
      {/* LightboxClient is a client component — renders immediately */}
      <LightboxClient />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Async component: fetches the post and renders the full content
// ---------------------------------------------------------------------------
async function BlogPostBody({ slug }: { slug: string }) {
  const content = await getContentForSlug(slug);
  if (!content) return notFound();

  const [resolvedFeaturedImage, searchBarEnabled, searchBarFmpEnabled] = await Promise.all([
    content.featuredImageUrl ? Promise.resolve(content.featuredImageUrl) : fetchBlogPostFeaturedImage(slug),
    getInPostSearchBarEnabled(),
    getInPostSearchBarFmpEnabled(),
  ]);
  const featuredImageUrl = resolvedFeaturedImage;
  const legacyHtml = content.content?.rendered || '';
  const portablePlainText = portableTextToPlainText(content.portableBody);
  const displayedWordCount = getDisplayWordCount(content.wordCount, legacyHtml || portablePlainText);
  const titleText = stripHtmlAndDecode(content.title?.rendered) || "Blog Post";

  return (
    <>
      <TopAppBar
        title={titleText}
        backHref="/blog"
        collapseTarget=".post-hero-card"
        actions={
          <>
            <PostActions slug={slug} postId={content.id} />
          </>
        }
      />

      {/* Featured Image with Title Overlay */}
      <div className="post-hero-card">
        {featuredImageUrl ? (
          <>
            <Image
              src={featuredImageUrl}
              alt={content.featuredImageAlt || ""}
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
              style={{ objectFit: 'cover' }}
            />
            <div className="post-hero-gradient" />
            <div className="post-hero-text">
              <h1
                className="post-hero-title">{titleText}</h1>
              <div className="post-hero-meta">
                <span className="post-hero-chip">
                  {new Date(content.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
                <span className="post-hero-chip">
                  {displayedWordCount.toLocaleString()} words
                </span>
                {content.categories
                  .filter(c => c !== 'uncategorized')
                  .map(cat => (
                    <span key={cat} className="post-hero-chip post-hero-chip--category">
                      {cat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
              </div>
            </div>
          </>
        ) : (
          <div className="post-hero-fallback">
            <h1
              className="post-hero-title"
              style={{ color: 'var(--primary)' }}>{titleText}</h1>
            <div className="post-hero-meta">
              <span className="post-hero-chip" style={{ background: 'var(--background)' }}>
                {new Date(content.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
              <span className="post-hero-chip" style={{ background: 'var(--background)' }}>
                {displayedWordCount.toLocaleString()} words
              </span>
              {content.categories
                .filter(c => c !== 'uncategorized')
                .map(cat => (
                  <span key={cat} className="post-hero-chip post-hero-chip--category">
                    {cat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>

      {slug === FMP_SLUG ? (
        <FmpViewWrapper
          sections={extractPostSections(content).map(({ title, slug }) => ({ title, slug }))}
          slug={slug}
        >
          {content.contentSource === 'portableText'
            ? <PortableTextContent blocks={content.portableBody || []} />
            : <BlogContent content={processContentWithEmbeds(legacyHtml)} />}
        </FmpViewWrapper>
      ) : content.contentSource === 'portableText' ? (
        <div className="panel settings" style={{ padding: '0', marginBottom: '0', maxWidth: '100%' }}>
          <PortableTextContent blocks={content.portableBody || []} />
        </div>
      ) : (
        <div className="panel settings" style={{ padding: '0', marginBottom: '0', maxWidth: '100%' }}>
          <BlogContent content={processContentWithEmbeds(legacyHtml)} />
        </div>
      )}
      <PostSearchBar enabledByDefault={searchBarEnabled || (searchBarFmpEnabled && slug === FMP_SLUG)} />
    </>
  );
}
