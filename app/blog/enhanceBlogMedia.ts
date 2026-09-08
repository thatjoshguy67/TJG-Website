interface BlogMediaFeatures {
  hasAudio: boolean;
  hasEmbedPlaceholders: boolean;
  hasImageComparisons: boolean;
}

const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);

function headingId(heading: HTMLElement, index: number): string {
  const slug = (heading.textContent || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  return slug || `heading-${index}`;
}

function containOffscreenMedia(element: HTMLElement) {
  // Slides need their image's intrinsic width to size the horizontal track.
  // Size containment substitutes a placeholder and creates blank slide space.
  if (element.closest('.native-slideshow')) return;

  const container = element.closest<HTMLElement>(
    'figure, .wp-block-embed, .wp-block-video, .wp-block-gallery'
  );

  if (!container || container.dataset.blogMediaContained === 'true') return;

  container.dataset.blogMediaContained = 'true';
  container.style.contentVisibility = 'auto';
  container.style.containIntrinsicSize = 'auto 480px';
}

/**
 * Prepares rich post markup in one DOM walk. Keeping this work together avoids
 * several full-article queries on image-heavy legacy posts.
 */
export function enhanceBlogMedia(scope: HTMLElement): BlogMediaFeatures {
  const features: BlogMediaFeatures = {
    hasAudio: false,
    hasEmbedPlaceholders: false,
    hasImageComparisons: false,
  };
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_ELEMENT);
  let headingIndex = 0;
  let node = walker.nextNode();

  while (node) {
    const element = node as HTMLElement;

    if (HEADING_TAGS.has(element.tagName)) {
      if (!element.id) element.id = headingId(element, headingIndex);
      headingIndex += 1;
    } else if (element instanceof HTMLImageElement) {
      element.loading = 'lazy';
      element.decoding = 'async';
      if (!element.hasAttribute('fetchpriority')) element.fetchPriority = 'low';
      containOffscreenMedia(element);
    } else if (element instanceof HTMLIFrameElement) {
      element.loading = 'lazy';
      containOffscreenMedia(element);
    } else if (element instanceof HTMLVideoElement) {
      element.preload = 'metadata';
      containOffscreenMedia(element);
    } else if (element instanceof HTMLAudioElement) {
      element.preload = 'metadata';
      features.hasAudio = true;
    }

    if (element.classList.contains('wp-block-jetpack-image-compare')) {
      features.hasImageComparisons = true;
    }

    if (
      element instanceof HTMLAnchorElement &&
      (element.hasAttribute('data-src') || element.hasAttribute('data-iframe-src')) &&
      element.closest('.wp-block-embed__wrapper')
    ) {
      features.hasEmbedPlaceholders = true;
    }

    node = walker.nextNode();
  }

  return features;
}
