'use client';

import { useEffect, type RefObject } from 'react';

export function useBlogMath(ref: RefObject<HTMLDivElement | null>, content: unknown) {
  useEffect(() => {
    const scope = ref.current;
    if (!scope || !/\\\[|\\\(|\$\$/.test(scope.textContent || '')) return;
    let cancelled = false;
    import('./renderBlogMath').then(({ renderBlogMath }) => {
      if (!cancelled) renderBlogMath(scope);
    }).catch(() => {
      // Keep the source readable if the optional math chunk cannot load.
    });
    return () => { cancelled = true; };
  }, [ref, content]);
}
