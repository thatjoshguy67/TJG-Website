'use client';
import { BlogContentCard } from '../components/ContentCards';

import { useBlogSearch } from './BlogSearchWrapper';

interface BlogPostsWithSearchProps {
  categoryMap: Record<string, string>;
}

export default function BlogPostsWithSearch({ categoryMap }: BlogPostsWithSearchProps) {
  const { filteredPosts, loading, error, hasMore, loadMore, retry } = useBlogSearch();
  const initialImageIds = new Set(
    filteredPosts
      .filter((post) => Boolean(post.featuredImageUrl))
      .slice(0, 2)
      .map((post) => post.id)
  );

  return (
    <>
      <div className="blog-posts-slide-wrapper" aria-busy={loading}>
        {(loading || error) && (
          <p role="status" aria-live="polite">{loading ? 'Loading articles…' : error}</p>
        )}
        {error && <button onClick={retry}>Retry search</button>}
        {filteredPosts.length > 0 ? (
          <div className="section">
            <div className="list-group">
              {filteredPosts.map((post) => {
                const categories = post.categories
                  ?.map((catSlug: string) => categoryMap[catSlug] || catSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
                  .filter(Boolean) ?? [];
                
                return (
                  <BlogContentCard key={post.id} post={post} categories={categories} preload={initialImageIds.has(post.id)} />
                );
              })}
            </div>
          </div>
        ) : (
          <div className="section">
            <div className="section-header">
              <h2 className="title">No Posts Found</h2>
            </div>
            <div className="panel settings">
              <div className="body-text">
                <p>No articles found. Try different keywords or categories.</p>
              </div>
            </div>
          </div>
        )}
        {hasMore && !error && <button className="blog-button" onClick={loadMore} disabled={loading}>Load more articles</button>}
      </div>
    </>
  );
}
