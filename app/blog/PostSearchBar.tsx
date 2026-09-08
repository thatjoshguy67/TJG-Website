'use client';

import ShortcutPopover from '../components/ShortcutPopover';
import SearchShortcutChip from '../components/SearchShortcutChip';

import { rankPostSections, searchWords } from '../../lib/postSearch';
import { isKeyboardInput } from '../../lib/keyboard';
import { useReadingPreferences } from './useReadingPreferences';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';

// Include the fading edge of the toolbar blur, not just the buttons.
function headingJumpOffset() {
  let bottom = 80;
  document.querySelectorAll<HTMLElement>('.top-app-bar, .progressive-blur-overlay--top').forEach(element => {
    if (!element.getClientRects().length) return;
    const rect = element.getBoundingClientRect();
    if (rect.top <= 80) bottom = Math.max(bottom, rect.bottom);
  });
  return bottom + 24;
}

// The original H1 sections are rendered as H2s for the page hierarchy.
// Search every content block: combined/portable posts can mount them later.
function postHeadings() {
  const visible = Array.from(document.querySelectorAll<HTMLElement>(
    '.body-text :is(h1,h2,h3,h4,h5,h6)'
  )).filter(el => el.getClientRects().length > 0 && el.textContent?.trim());
  const sections = visible.filter(el => el.matches('.content-heading-h1,h1'));
  return sections.length ? sections : visible.filter(el => el.tagName === 'H2');
}

function nextPostHeading() {
  return postHeadings().find(el => el.getBoundingClientRect().top > headingJumpOffset() + 12) ?? null;
}

interface HeadingInfo {
  target: HTMLElement;
  text: string;
}

export default function PostSearchBar({ enabledByDefault = true }: { enabledByDefault?: boolean }) {
  const { hasSavedPreferences } = useReadingPreferences();
  const [nextHeading, setNextHeading] = useState<HeadingInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [results, setResults] = useState<{ title: string; excerpt: string; target: HTMLElement }[]>([]);
  const [activeResult, setActiveResult] = useState(0);
  const [resultsQuery, setResultsQuery] = useState('');
  const positionerRef = useRef<HTMLDivElement>(null);
  const jumpLabelRef = useRef<HTMLSpanElement>(null);
  const cancelJump = useRef<(() => void) | null>(null);
  useEffect(() => () => cancelJump.current?.(), []);

  function scrollToHeading(target: HTMLElement | null, fallback = 0) {
    cancelJump.current?.();
    let timer = 0;
    let frame = 0;
    let corrections = 0;
    const destination = () => Math.max(0, Math.min(
      document.documentElement.scrollHeight - window.innerHeight,
      target ? target.getBoundingClientRect().top + window.scrollY - headingJumpOffset() : fallback
    ));
    const stop = () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('scrollend', settle);
      for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) window.removeEventListener(event, stop);
      cancelJump.current = null;
    };
    const settle = () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Offscreen media may replace estimated heights during the smooth scroll.
        // Re-align the same heading, never a newly detected intermediate section.
        const top = destination();
        if ((!target || target.isConnected) && Math.abs(top - window.scrollY) > 1 && corrections++ < 4) {
          window.scrollTo({ top, behavior: 'instant' });
          settle();
        } else stop();
      });
    };
    const schedule = () => { clearTimeout(timer); timer = window.setTimeout(settle, 140); };
    cancelJump.current = stop;
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('scrollend', settle);
    for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) window.addEventListener(event, stop, { passive: true });
    window.scrollTo({ top: destination(), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    schedule();
  }
  function goToResult(index: number) {
    const result = results[index];
    if (!result) return;
    inputRef.current?.blur();
    scrollToHeading(result.target);
  }
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileOpening, setMobileOpening] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const resultsVisible = searchFocused && searchQuery.trim().length > 0 && resultsQuery === searchQuery;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.repeat) return;
      if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (inputRef.current && document.activeElement === inputRef.current) {
          inputRef.current.blur();
          setShortcutOpen(false);
          return;
        }
        setShortcutOpen(true);
        if (window.matchMedia('(max-width: 699px)').matches) {
          setMobileOpen(true);
          setMobileOpening(true);
        } else {
          inputRef.current?.focus();
          inputRef.current?.select();
        }
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || isKeyboardInput(event.target)) return;
      if (event.key !== '[' && event.key !== ']') return;
      const headings = postHeadings();
      const offset = headingJumpOffset();
      const heading = event.key === ']'
        ? headings.find(el => el.getBoundingClientRect().top > offset + 12)
        : headings.reverse().find(el => el.getBoundingClientRect().top < offset - 12);
      event.preventDefault();
      const top = heading
        ? window.scrollY + heading.getBoundingClientRect().top - offset
        : event.key === '[' ? 0 : document.documentElement.scrollHeight;
      window.scrollTo({ top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!shortcutOpen) return;
    if (window.matchMedia('(max-width: 699px)').matches) {
      setMobileOpen(true);
      setMobileOpening(true);
    } else { inputRef.current?.focus(); inputRef.current?.select(); }
  }, [shortcutOpen]);

  useLayoutEffect(() => {
    if (!mobileOpen) return;
    const bar = searchBarRef.current;
    if (!bar) return;
    let cancelled = false;
    const dismiss = () => { setMobileOpen(false); setMobileOpening(false); setShortcutOpen(false); };
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !positionerRef.current?.contains(event.target)) dismiss();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); dismiss(); }
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    const focusAfterExpansion = async () => {
      // Read layout to start the CSS transition before checking its completion.
      // Recheck after cancellation: rotating/resizing can replace a transition.
      while (!cancelled) {
        void bar.offsetWidth;
        const animations = bar.getAnimations().filter(animation =>
          animation.playState !== 'finished' && animation instanceof CSSTransition &&
          ['width', 'padding-left', 'padding-right', 'column-gap'].includes(animation.transitionProperty));
        if (!animations.length) break;
        await Promise.allSettled(animations.map(animation => animation.finished));
      }
      if (cancelled) return;
      setMobileOpening(false);
      inputRef.current?.focus({ preventScroll: true });
    };
    void focusAfterExpansion();
    return () => {
      cancelled = true;
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  useEffect(() => {
    const scope = document.querySelector('.main-content') ?? document.body;
    let frame = 0;
    const update = () => {
      frame = 0;
      const target = nextPostHeading();
      const text = target?.textContent?.trim() || '';
      setNextHeading(current => current?.target === target && current?.text === text
        ? current : target ? { target, text } : null);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    // View changes, streamed content, and media loading can change the next section
    // without a scroll. Keep the label in sync instead of relying on a mount timer.
    const mutations = new MutationObserver(schedule);
    mutations.observe(scope, { childList: true, subtree: true, characterData: true });
    const resize = new ResizeObserver(schedule);
    resize.observe(scope);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  useEffect(() => {
    if (!CSS.highlights) return;
    const style = document.createElement('style');
    style.textContent = '::highlight(post-search) { color: #111; background-color: #ffe066; }';
    document.head.append(style);
    return () => style.remove();
  }, []);

  // CSS ranges leave React-owned text nodes intact, including during rerenders.
  useEffect(() => {
    const timer = setTimeout(() => {
      CSS.highlights?.delete('post-search');
      const query = searchQuery.trim().toLocaleLowerCase();
      if (!query) { setMatchCount(0); setResults([]); setResultsQuery(searchQuery); return; }
      const sections: { title: string; text: string; target: HTMLElement }[] = [];
      document.querySelectorAll<HTMLElement>('.body-text').forEach(root => {
        if (root.parentElement?.closest('.body-text') || !root.getClientRects().length) return;
        let section = { title: 'Introduction', text: '', target: root };
        root.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6,p,li,figcaption,td').forEach(element => {
          if (!element.getClientRects().length || element.closest('button,script,style')) return;
          if (/^H[1-6]$/.test(element.tagName)) {
            if (section.text.trim()) sections.push(section);
            section = { title: element.textContent?.trim() || 'Section', text: '', target: element };
          } else if (!element.parentElement?.closest('p,li,td')) {
            section.text += ' ' + (element.textContent || '');
          }
        });
        if (section.text.trim()) sections.push(section);
      });
      const terms = new Set(searchWords(query));
      setResults(rankPostSections(sections, query).map(({ index }) => {
        const section = sections[index];
        const sentences = section.text.split(/(?<=[.!?])\s+/);
        const best = sentences.map(text => ({ text, score: searchWords(text).filter(word => terms.has(word)).length }))
          .sort((a, b) => b.score - a.score)[0]?.text.trim() || section.text.trim();
        return { title: section.title, target: section.target, excerpt: best.length > 180 ? best.slice(0, 177) + '…' : best };
      }));
      setActiveResult(0);
      setResultsQuery(searchQuery);
      const ranges: Range[] = [];
      document.querySelectorAll('.body-text').forEach(root => {
        if (root.parentElement?.closest('.body-text')) return;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode: node => node.parentElement?.closest('script,style,input,textarea,button') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
        });
        let node: Node | null;
        while ((node = walker.nextNode()) && ranges.length < 10000) {
          const text = node.textContent?.toLocaleLowerCase() || '';
          for (let start = text.indexOf(query); start !== -1 && ranges.length < 10000; start = text.indexOf(query, start + query.length)) {
            const range = document.createRange(); range.setStart(node, start); range.setEnd(node, start + query.length); ranges.push(range);
          }
        }
      });
      if (typeof Highlight !== 'undefined' && CSS.highlights) CSS.highlights.set('post-search', new Highlight(...ranges));
      setMatchCount(ranges.length);
    }, 200);
    return () => { clearTimeout(timer); CSS.highlights?.delete('post-search'); };
  }, [searchQuery]);

  const handleJump = () => {
    setMobileOpen(false);
    setMobileOpening(false);
    if (document.activeElement instanceof HTMLElement && document.activeElement.closest('.post-search-field')) {
      document.activeElement.blur();
    }
    setShortcutOpen(false);
    // Resolve from the current DOM as well as keeping the visible label in sync.
    const target = nextPostHeading();
    scrollToHeading(target);
  };

  const jumpLabel = nextHeading?.text ?? 'Back to top';
  const isBackToTopMode = !nextHeading;

  const visible = enabledByDefault || hasSavedPreferences || shortcutOpen;
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const viewport = window.visualViewport;
    if (!anchor || !viewport) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      // Mobile keyboards can resize/pan only the visual viewport, leaving fixed
      // elements anchored behind them. Layout-resizing browsers need no lift.
      const bottom = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      anchor.style.setProperty('--post-search-viewport-bottom', `${bottom}px`);
      anchor.style.setProperty('--post-search-visible-height', `${viewport.height}px`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    viewport.addEventListener('resize', schedule);
    viewport.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener('resize', schedule);
      viewport.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [visible]);
  useLayoutEffect(() => {
    const positioner = positionerRef.current;
    const label = jumpLabelRef.current;
    if (!positioner || !label) return;
    // Animate a measured width: intrinsic/auto widths snap when the text changes.
    // Measure an unconstrained copy, including fractional pixels and font changes.
    // scrollWidth rounds to integers and can make even short labels ellipsize.
    const measure = () => positioner.style.setProperty(
      '--post-search-jump-width', `${Math.ceil(parseFloat(getComputedStyle(label).width)) + 68}px`
    );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(label);
    return () => observer.disconnect();
  }, [jumpLabel, visible]);

  if (!visible) return null;

  return (
    <>
      <div ref={anchorRef} className="post-search-anchor" data-shortcut-open={shortcutOpen}>
        <div ref={positionerRef} className="post-search-positioner">
          <div className="post-search-field" data-mobile-open={mobileOpen} data-mobile-opening={mobileOpening}>
            {resultsVisible && <div className="post-search-results">
              <div className="post-search-results-title" role="status">{results.length ? 'Relevant sections' : 'No matching sections. Try another word or topic.'}</div>
              <div id="post-search-results" role="listbox" aria-label="Matching sections">
                {results.map((result, index) => <button key={index} type="button" role="option"
                  id={`post-search-result-${index}`} aria-selected={index === activeResult}
                  onPointerDown={event => event.preventDefault()}
                  onClick={() => goToResult(index)} tabIndex={-1}>
                  <strong>{result.title}</strong><span>{result.excerpt}</span>
                </button>)}
              </div>
            </div>}
            <div
              ref={searchBarRef}
              className="post-search-bar"
              style={{ backdropFilter: 'var(--post-search-backdrop, blur(24px))', WebkitBackdropFilter: 'var(--post-search-backdrop, blur(24px))' }}
            >
              {/* Search icon */}
              <svg
                className="post-search-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.4131 3.4541C14.2501 3.4541 17.3711 6.57421 17.3711 10.4111C17.3711 12.0663 16.7893 13.5876 15.8213 14.7842L15.7275 14.9014L15.833 15.0068L20.375 19.5498C20.6025 19.7766 20.603 20.146 20.375 20.374V20.375C20.2618 20.4889 20.1126 20.5459 19.9629 20.5459C19.8134 20.5458 19.6649 20.4887 19.5518 20.375L15.0078 15.8311L14.9014 15.7256L14.7852 15.8193C13.5895 16.7874 12.0673 17.3701 10.4131 17.3701C6.57617 17.3701 3.45509 14.2481 3.45508 10.4111C3.45508 6.57421 6.5761 3.4541 10.4131 3.4541ZM10.4131 4.62012C7.21908 4.62012 4.62109 7.21705 4.62109 10.4111C4.62111 13.6051 7.21901 16.2041 10.4131 16.2041C13.6072 16.2041 16.2051 13.6051 16.2051 10.4111C16.2051 7.21705 13.6071 4.62012 10.4131 4.62012Z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="0.333333"
                />
              </svg>

              {/* Input */}
              <input
                ref={inputRef}
                type="text"
                className="post-search-input"
                tabIndex={mobileOpening ? -1 : undefined}
                placeholder="Search…"
                aria-label="Search in post"
                aria-keyshortcuts="Meta+k Control+k"
                title="Search in post"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={resultsVisible && results.length > 0}
                aria-controls={resultsVisible ? 'post-search-results' : undefined}
                aria-activedescendant={resultsVisible && results.length ? `post-search-result-${activeResult}` : undefined}
                onKeyDown={event => {
                  if (event.nativeEvent.isComposing) return;
                  if (resultsVisible && results.length && ['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) {
                    event.preventDefault();
                    if (event.key === 'Enter') goToResult(activeResult);
                    else setActiveResult(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length);
                  }
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    setShortcutOpen(false);
                    inputRef.current?.blur();
                  }
                }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => { setSearchFocused(false); setShortcutOpen(false); setMobileOpen(false); setMobileOpening(false); }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value.slice(0, 200))}
              />
              <SearchShortcutChip focused={searchFocused} />

              {/* Match count */}
              {searchFocused && searchQuery && matchCount > 0 && (
                <span className="post-search-match-badge" title="Exact phrase matches">{matchCount}</span>
              )}

              {/* Clear */}
              {searchQuery && (
                <button
                  className="post-search-clear"
                  onClick={() => {
                    setSearchQuery('');
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}

            </div>
          </div>
          <button
            type="button"
            className="post-search-open"
            aria-label="Open post search"
            aria-expanded={mobileOpen || searchFocused}
            onClick={() => { setMobileOpen(true); setMobileOpening(true); }}
          />
          <ShortcutPopover title={jumpLabel} content={<>
              <span className="shortcut-popover-row"><span>Previous heading or top</span><kbd className="keyboard-shortcut-chip">[</kbd></span>
              <span className="shortcut-popover-row"><span>Next heading or bottom</span><kbd className="keyboard-shortcut-chip">]</kbd></span>
            </>}>
            {(descriptionId) => <button
              className="post-search-jump"
              type="button"
              onPointerDown={event => {
                if (event.button !== 0) return;
                // Keep the release/click on this button if its width changes mid-press.
                event.currentTarget.setPointerCapture(event.pointerId);
                if (event.currentTarget.closest('.post-search-positioner')?.querySelector('.post-search-field:focus-within')) event.preventDefault();
              }}
              onClick={handleJump}
              aria-label={jumpLabel}
              aria-describedby={descriptionId}
            >
              <span ref={jumpLabelRef} className="post-search-jump-measure" aria-hidden="true">{jumpLabel}</span>
              {isBackToTopMode ? (
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              )}
              <span className="post-search-jump-text"><span key={jumpLabel} className="post-search-jump-label">{jumpLabel}</span></span>
            </button>}
            </ShortcutPopover>
        </div>
      </div>
    </>
  );
}
