import { flag } from 'flags/next';
import { vercelAdapter } from '@flags-sdk/vercel';

/**
 * Blog feature flag - controls visibility of the blog in navigation and access to blog pages.
 * Configure per-environment (Development, Preview, Production) in the Vercel Dashboard.
 */
export const blogEnabled = flag({
  key: 'blog-enabled',
  adapter: vercelAdapter(),
  defaultValue: true,
  description: 'Show the blog in navigation and allow access to blog pages',
  options: [
    { value: true, label: 'Enabled' },
    { value: false, label: 'Disabled' },
  ],
});

/**
 * Projects feature flag - controls visibility of the Edge Config-driven Projects section on the home page.
 */
export const projectsEnabled = flag({
  key: 'projects-enabled',
  adapter: vercelAdapter(),
  defaultValue: true,
  description: 'Show the Projects section on the home page',
  options: [
    { value: true, label: 'Enabled' },
    { value: false, label: 'Disabled' },
  ],
});

export const twidgetStoreButtonsEnabled = flag({
  key: 'twidget-store-buttons-enabled',
  adapter: vercelAdapter(),
  defaultValue: false,
  description: 'Show Google Play and GitHub buttons on the Twidget carousel card',
  options: [
    { value: true, label: 'Enabled' },
    { value: false, label: 'Disabled' },
  ],
});

/**
 * Popular Stories feature flag - controls visibility of the Popular Stories section on the home page.
 */
export const popularStoriesEnabled = flag({
  key: 'popular-stories-enabled',
  adapter: vercelAdapter(),
  defaultValue: true,
  description: 'Show the Popular Stories section on the home page',
  options: [
    { value: true, label: 'Enabled' },
    { value: false, label: 'Disabled' },
  ],
});

export const miscSectionEnabled = flag({
  key: 'misc-section-enabled',
  adapter: vercelAdapter(),
  defaultValue: true,
  description: 'Show the Misc section on the Home page',
  options: [
    { value: true, label: 'Enabled' },
    { value: false, label: 'Disabled' },
  ],
});

export const recentBlogPostsEnabled = flag({
  key: 'recent-blog-posts-enabled',
  adapter: vercelAdapter(),
  defaultValue: true,
  description: 'Show the Recent Blog Posts carousel on the Home page',
  options: [
    { value: true, label: 'Enabled' },
    { value: false, label: 'Disabled' },
  ],
});

/**
 * In-post search bar feature flag - shows the search bar on every blog post.
 */
export const inPostSearchBarEnabled = flag({
  key: 'in-post-search-bar-enabled',
  adapter: vercelAdapter(),
  defaultValue: false,
  description: 'Show the in-post search bar on every blog post',
  options: [
    { value: true, label: 'Enabled' },
    { value: false, label: 'Disabled' },
  ],
});

/**
 * In-post search bar FMP flag - shows the search bar on the FMP post only.
 * Only used when in-post-search-bar-enabled is false.
 */
export const inPostSearchBarFmpEnabled = flag({
  key: 'in-post-search-bar-fmp-enabled',
  adapter: vercelAdapter(),
  defaultValue: true,
  description: 'Show the in-post search bar on the FMP post only',
  options: [
    { value: true, label: 'Enabled' },
    { value: false, label: 'Disabled' },
  ],
});

/**
 * Corner Smoothing feature flag - enables the squircle corner smoothing toggle in Settings.
 * When enabled, users can opt in to Lisse's Figma/iOS-style squircle corners.
 */
export const cornerSmoothingEnabled = flag({
  key: 'corner-smoothing-enabled',
  adapter: vercelAdapter(),
  defaultValue: false,
  description: 'Enable corner smoothing (squircle) toggle in Settings',
  options: [
    { value: true, label: 'Enabled' },
    { value: false, label: 'Disabled' },
  ],
});

/**
 * FMP Separated View feature flag - controls visibility of the FMP view toggle in Settings.
 * When enabled, the toggle appears allowing users to switch between separated and combined views.
 */
export const fmpSeparatedViewEnabled = flag({
  key: 'fmp-separated-view-enabled',
  adapter: vercelAdapter(),
  defaultValue: false,
  description: 'Show the FMP separated/combined view toggle in the post overflow menu',
  options: [
    { value: true, label: 'Enabled' },
    { value: false, label: 'Disabled' },
  ],
});
