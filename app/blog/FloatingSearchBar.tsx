'use client';

import SearchShortcutChip from '../components/SearchShortcutChip';
import './FloatingSearchBar.css';

import { useState, useRef, useEffect } from 'react';
import { useBlogSearch } from './BlogSearchWrapper';

interface FloatingSearchBarProps {
  categories: Array<{ id: string; slug: string; name: string }>;
}

export default function FloatingSearchBar({ categories }: FloatingSearchBarProps) {
  const { searchQuery, setSearchQuery, activeCategory, setActiveCategory } = useBlogSearch();
  return <BlogSearchControl categories={categories} searchQuery={searchQuery} setSearchQuery={setSearchQuery} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />;
}

interface BlogSearchControlProps extends FloatingSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeCategory: string | null;
  setActiveCategory: (category: string | null) => void;
  inline?: boolean;
}

export function BlogSearchControl({ categories, searchQuery, setSearchQuery, activeCategory, setActiveCategory, inline = false }: BlogSearchControlProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.repeat || event.altKey || event.shiftKey) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (inputRef.current && document.activeElement === inputRef.current) {
          inputRef.current.blur();
          setFilterOpen(false);
          return;
        }
        setFilterOpen(false);
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const activeCategoryName = activeCategory
    ? categories.find(c => c.slug === activeCategory)?.name ?? activeCategory
    : null;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    if (filterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterOpen]);

  const handleClear = () => {
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const handleCategorySelect = (catSlug: string | null) => {
    setActiveCategory(catSlug);
    setFilterOpen(false);
  };

  return (
    <>
      <div className={`floating-search-anchor${inline ? " floating-search-anchor--inline" : ""}`}>
        <div className="floating-search-positioner" ref={filterRef} onKeyDown={e => { if (e.key === 'Escape' && filterOpen) { setFilterOpen(false); inputRef.current?.focus(); } }}>
          <div
            className="floating-search-bar"
            style={{
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            <svg
              className="floating-search-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10.4131 3.4541C14.2501 3.4541 17.3711 6.57421 17.3711 10.4111C17.3711 12.0663 16.7893 13.5876 15.8213 14.7842L15.7275 14.9014L15.833 15.0068L20.375 19.5498C20.6025 19.7766 20.603 20.146 20.375 20.374V20.375C20.2618 20.4889 20.1126 20.5459 19.9629 20.5459C19.8134 20.5458 19.6649 20.4887 19.5518 20.375L15.0078 15.8311L14.9014 15.7256L14.7852 15.8193C13.5895 16.7874 12.0673 17.3701 10.4131 17.3701C6.57617 17.3701 3.45509 14.2481 3.45508 10.4111C3.45508 6.57421 6.5761 3.4541 10.4131 3.4541ZM10.4131 4.62012C7.21908 4.62012 4.62109 7.21705 4.62109 10.4111C4.62111 13.6051 7.21901 16.2041 10.4131 16.2041C13.6072 16.2041 16.2051 13.6051 16.2051 10.4111C16.2051 7.21705 13.6071 4.62012 10.4131 4.62012Z" fill="currentColor" stroke="currentColor" strokeWidth="0.333333"/>
            </svg>

            <input
              ref={inputRef}
              type="text"
              className="floating-search-input"
              placeholder="What are you looking for?"
              aria-label="Search blog"
              aria-keyshortcuts="Meta+k Control+k"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onKeyDown={event => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  event.stopPropagation();
                  setFilterOpen(false);
                  event.currentTarget.blur();
                }
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <SearchShortcutChip focused={searchFocused} />

            {searchQuery && (
              <button
                className="floating-search-clear"
                onClick={handleClear}
                aria-label="Clear search"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}

            {activeCategoryName ? (
              <div className="floating-search-filter-chip">
                <button
                  className="floating-search-filter-chip-label"
                  onClick={() => setFilterOpen(!filterOpen)}
                  aria-label="Change category filter"
                  aria-expanded={filterOpen}
                >
                  {activeCategoryName}
                </button>
                <button
                  className="floating-search-filter-chip-close"
                  onClick={() => setActiveCategory(null)}
                  aria-label="Clear category filter"
                >
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                className="floating-search-filter-btn"
                onClick={() => setFilterOpen(!filterOpen)}
                aria-label="Filter by category"
                aria-expanded={filterOpen}
              >
                <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="m11.9932 18.498c.1372.0001.25.1127.25.25-.0001.138-.1124.25-.25.25l-6.2432.002c-.13829 0-.25-.1116-.25-.25 0-.1379.11214-.25.25-.25zm0-6.5019c.1372.0001.25.1126.25.25-.0001.1379-.1124.2499-.25.25l-6.2432.0039c-.13829 0-.25-.1116-.25-.25 0-.1379.11214-.25.25-.25zm-6.2432-6.4961h14c.1379 0 .25.11214.25.25 0 .13842-.1117.25-.25.25h-14c-.13829 0-.25-.11158-.25-.25 0-.13786.11214-.25.25-.25zm11.2656 9.0449-.124-.1416-2.2998-2.6123c-.0325-.0386-.0477-.067-.0547-.084s-.0085-.0281-.0088-.0332c-.0003-.0065.0004-.0114.001-.0136.0003-.0005.004-.006.0117-.0118.0042-.0031.0128-.0099.0303-.0156.018-.0058.051-.0127.1035-.0127h5.1787c.0518 0 .0847.007.1026.0127.0173.0056.027.0115.0312.0147.0082.0061.0117.0127.0117.0127.0006.0021.0014.0075.001.0146-.0003.0048-.0019.0155-.0088.0322-.007.0169-.0219.0454-.0547.084l-2.2988 2.6231-.124.1416v4.6377c-.0002.1367-.1123.249-.2491.249-.1365-.0002-.2488-.1125-.249-.249z" fill="var(--primary)" stroke="var(--primary)"/></svg>
              </button>
            )}
          </div>

          {filterOpen && (
            <div className="floating-search-filter-menu">
              <button
                className="floating-search-filter-item"
                data-selected={activeCategory === null}
                aria-pressed={activeCategory === null}
                onClick={() => handleCategorySelect(null)}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className="floating-search-filter-item"
                  data-selected={activeCategory === cat.slug}
                  aria-pressed={activeCategory === cat.slug}
                  onClick={() => handleCategorySelect(cat.slug)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
