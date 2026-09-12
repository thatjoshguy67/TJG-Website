import { routeMetadata } from '../../../../lib/routeMetadata';
import PortableTextContent from '../../PortableTextContent';
import type { Metadata } from "next";
import { cache, Suspense } from "react";
import Image from "next/image";
import { fetchBlogPostBySlug, fetchBlogPostFeaturedImage, type BlogPost } from "../../../../lib/blog";
import { notFound } from "next/navigation";
import LightboxClient from "../../../components/LightboxClient";
import { LoadingDots } from "../../../components/LoadingAnim";
import BlogContent from "../../BlogContent";
import { extractPostSections } from "../../../../lib/fmpSections";
import { countWords, processContentWithEmbeds } from "../../../../lib/blogContentProcessing";
import { portableTextToPlainText, stripHtmlAndDecode } from "../../../../lib/portableText";
import TopAppBar from "../../../components/TopAppBar";
import PostSearchBar from "../../PostSearchBar";
import PostActions from "../../PostActions";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string; section: string }>;
}

const getContentForSlug = cache(async (slug: string): Promise<BlogPost | null> => fetchBlogPostBySlug(slug));

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug, section } = await props.params;
  const content = await getContentForSlug(slug);
  if (!content) notFound();

  const matched = extractPostSections(content).find(s => s.slug === section);
  if (!matched) notFound();
  const postTitle = stripHtmlAndDecode(content.title?.rendered) || 'That Josh Guy';
  return routeMetadata(`/blog/${slug}/${section}`, `${matched.title} - ${postTitle}`, `${matched.title} section of ${postTitle}.`, Boolean(content.seo?.noIndex));
}

export default async function SectionPage(props: PageProps) {
  const { slug, section } = await props.params;
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
            <SectionBody slug={slug} section={section} />
          </Suspense>
        </div>
      </div>
      <LightboxClient />
    </div>
  );
}

async function SectionBody({ slug, section }: { slug: string; section: string }) {
  const content = await getContentForSlug(slug);
  if (!content) return notFound();

  const sections = extractPostSections(content);
  const matched = sections.find(s => s.slug === section);
  if (!matched) return notFound();

  const featuredImageUrl = content.featuredImageUrl ?? await fetchBlogPostFeaturedImage(slug);
  const sectionContent = processContentWithEmbeds(
    matched.html.replace(/^<h1[^>]*>[\s\S]*?<\/h1>\s*/i, '')
  );
  const postTitle = stripHtmlAndDecode(content.title?.rendered) || "Final Major Project";
  const sectionWordCount = countWords(matched.blocks ? portableTextToPlainText(matched.blocks) : matched.html);

  return (
    <>
      <TopAppBar
        title={matched.title}
        backHref={`/blog/${slug}`}
        collapseTarget=".post-hero-card"
        actions={
          <>
            <PostActions slug={slug} postId={content.id} />
          </>
        }
      />

      <div className="post-hero-card post-hero-card--section">
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
              <h1 className="post-hero-title">{matched.title}</h1>
              <div className="post-hero-meta">
                <span className="post-hero-chip post-hero-chip--context" title={postTitle}>
                  {postTitle}
                </span>
                <span className="post-hero-chip">
                  {sectionWordCount.toLocaleString()} words
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="post-hero-fallback">
            <h1 className="post-hero-title" style={{ color: 'var(--primary)' }}>
              {matched.title}
            </h1>
            <div className="post-hero-meta">
              <span className="post-hero-chip post-hero-chip--context" title={postTitle}>
                {postTitle}
              </span>
              <span className="post-hero-chip">
                {sectionWordCount.toLocaleString()} words
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="panel settings" style={{ padding: '0', marginBottom: '0', maxWidth: '100%' }}>
        {matched.blocks ? <PortableTextContent blocks={matched.blocks} /> : <BlogContent content={sectionContent} />}
      </div>
      <PostSearchBar />
    </>
  );
}
