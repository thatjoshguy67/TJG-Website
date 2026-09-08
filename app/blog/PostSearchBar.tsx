'use client';

import ShortcutPopover from '../components/ShortcutPopover';
import SearchShortcutChip from '../components/SearchShortcutChip';

import { rankPostSections, searchWords } from '../../lib/postSearch';
import { isKeyboardInput } from '../../lib/keyboard';
import { useReadingPreferences } from './useReadingPreferences';

import { useState, useEffect, useCallback, useRef } from 'react';

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

interface HeadingInfo {
  id: string;
  text: string;
}

export default function PostSearchBar({ enabledByDefault = true }: { enabledByDefault?: boolean }) {
  const { hasSavedPreferences } = useReadingPreferences();
  const [headings, setHeadings] = useState<HeadingInfo[]>([]);
  const [nextHeading, setNextHeading] = useState<HeadingInfo | null>(null);
  const [isBackToTop, setIsBackToTop] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [results, setResults] = useState<{ title: string; excerpt: string; target: HTMLElement }[]>([]);
  const [activeResult, setActiveResult] = useState(0);
  const [resultsQuery, setResultsQuery] = useState('');
  function goToResult(index: number) {
    const result = results[index];
    if (!result) return;
    inputRef.current?.blur();
    window.scrollTo({ top: result.target.getBoundingClientRect().top + window.scrollY - headingJumpOffset(),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  const inputRef = useRef<HTMLInputElement>(null);
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
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || isKeyboardInput(event.target)) return;
      if (event.key !== '[' && event.key !== ']') return;
      const headings = Array.from(document.querySelectorAll<HTMLElement>('.body-text h2')).filter(el => el.getClientRects().length > 0);
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
    if (shortcutOpen) { inputRef.current?.focus(); inputRef.current?.select(); }
  }, [shortcutOpen]);

  // Extract h1 headings from .body-text and assign IDs
  useEffect(() => {
    const id = setTimeout(() => {
      const bodyText = document.querySelector('.body-text');
      if (!bodyText) return;
      const els = bodyText.querySelectorAll('h2');
      const extracted: HeadingInfo[] = [];
      els.forEach((el, i) => {
        const text = el.textContent?.trim() || '';
        if (!text) return;
        let elId = el.id;
        if (!elId) {
          elId =
            text
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .trim() || `heading-${i}`;
          el.id = elId;
        }
        extracted.push({ id: elId, text });
      });
      setHeadings(extracted);
    }, 150);
    return () => clearTimeout(id);
  }, []);

  // Update which heading is next based on scroll position
  const updateNextHeading = useCallback(() => {
    if (headings.length === 0) return;
    const scrollPos = window.scrollY + headingJumpOffset() + 12;
    let found: HeadingInfo | null = null;
    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el && el.getBoundingClientRect().top + window.scrollY > scrollPos) {
        found = h;
        break;
      }
    }
    setNextHeading(found);
    setIsBackToTop(!found);
  }, [headings]);

  useEffect(() => {
    if (headings.length === 0) return;
    updateNextHeading();
    window.addEventListener('scroll', updateNextHeading, { passive: true });
    return () => window.removeEventListener('scroll', updateNextHeading);
  }, [headings, updateNextHeading]);

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
    if (document.activeElement instanceof HTMLElement && document.activeElement.closest('.post-search-field')) {
      document.activeElement.blur();
    }
    setShortcutOpen(false);
    if (headings.length === 0 || isBackToTop || !nextHeading) {
      window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      return;
    }
    const el = document.getElementById(nextHeading.id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - headingJumpOffset(), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };

  const jumpLabel =
    headings.length === 0 || isBackToTop
      ? 'Back to top'
      : nextHeading?.text ?? 'Back to top';
  const isBackToTopMode = headings.length === 0 || isBackToTop;

  if (!enabledByDefault && !hasSavedPreferences && !shortcutOpen) return null;

  return (
    <>
      <div className="post-search-anchor" data-shortcut-open={shortcutOpen}>
        <div className="post-search-positioner">
          <div className="post-search-field">
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
              className="post-search-bar"
              style={{
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
              }}
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
                onBlur={() => { setSearchFocused(false); setShortcutOpen(false); }}
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
          <ShortcutPopover title={jumpLabel} content={<>
              <span className="shortcut-popover-row"><span>Previous heading or top</span><kbd className="keyboard-shortcut-chip">[</kbd></span>
              <span className="shortcut-popover-row"><span>Next heading or bottom</span><kbd className="keyboard-shortcut-chip">]</kbd></span>
            </>}>
            {(descriptionId) => <button
              className="post-search-jump"
              type="button"
              onPointerDown={event => {
                if (event.currentTarget.closest('.post-search-positioner')?.querySelector('.post-search-field:focus-within')) event.preventDefault();
              }}
              onClick={handleJump}
              aria-label={jumpLabel}
              aria-describedby={descriptionId}
            >
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
              <span className="post-search-jump-text">{jumpLabel}</span>
            </button>}
            </ShortcutPopover>
        </div>
      </div>
    </>
  );
}
