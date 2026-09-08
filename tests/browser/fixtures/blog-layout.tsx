import { createRoot } from 'react-dom/client';
import { useEffect, useRef } from 'react';
import { CornerSmoothingManager } from '../../../app/components/CornerSmoothingManager';
import NativeSlideshow from '../../../app/blog/NativeSlideshow';
import BlogContent from '../../../app/blog/BlogContent';
import PostSearchBar from '../../../app/blog/PostSearchBar';
import FloatingSearchBar from '../../../app/blog/FloatingSearchBar';
import { BlogSearchProvider } from '../../../app/blog/BlogSearchWrapper';
import { enhanceBlogMedia } from '../../../app/blog/enhanceBlogMedia';

function Fixture() {
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => { if (body.current) return enhanceBlogMedia(body.current).cleanup; }, []);
  return <>
    <main className="main-content">
      <div ref={body} className="body-text">
        <h2>Overview</h2>
        <p>Searchable introduction.</p>
        <NativeSlideshow slides={[1, 2, 3].map(index => ({ src: '/images/preview.png', alt: `Slide image ${index}` }))} />
        <h2>A longer heading for the next section</h2>
        <p>Searchable conclusion.</p>
        <BlogContent content={'<figure class="wp-block-image"><img src="/images/preview.png" width="200" height="400" alt="Height capped image"></figure><figure class="wp-block-video"><video width="600" height="315" controls poster="/images/preview.png"></video></figure>'} />
      </div>
      {location.search.includes('index')
        ? <BlogSearchProvider initialPage={{ posts: [], hasMore: false }}><FloatingSearchBar categories={[]} /></BlogSearchProvider>
        : <PostSearchBar />}
    </main>
    <CornerSmoothingManager enabled />
  </>;
}
createRoot(document.getElementById('fixture')!).render(<Fixture />);
