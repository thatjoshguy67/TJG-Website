# Desktop performance investigation — 12 September 2026

Investigated the supplied production Speed Insights report, recent Vercel runtime logs, deployed source, and public pages at https://tjg.gg. No application code, CMS content, deployment, or infrastructure settings were changed. The homepage experiment changed CSS only inside an isolated browser.

## Field data supplied by the user

| Metric | Desktop value | Good target |
| --- | ---: | ---: |
| Real Experience Score | 87 | >90 |
| First Contentful Paint | 2.52 s | ≤1.8 s |
| Largest Contentful Paint | 3.28 s | ≤2.5 s |
| Interaction to Next Paint | 48 ms | ≤200 ms |
| Cumulative Layout Shift | 0.01 | ≤0.1 |
| Time to First Byte | 0.67 s | <0.8 s |

Routes flagged: `/` RES 84 (63 events), `/blog/[slug]` RES 73 (34), `/blog` RES 71 (8). These are event counts, not necessarily distinct visits. The complete report contains 149 events. UK RES is 99 across 101 events, US 73 across 14. Geographic differences are suggestive, but small samples and differing route/device/network mixes prevent attributing them to server location alone.

Metric targets: https://vercel.com/docs/speed-insights/metrics

## 1. Homepage text reveal is a confirmed loading delay

`app/components/HomeClient.tsx:608` initializes `heroLaunchReady` to false. Its effect waits for six decorative SVG images to load/decode, or a 900 ms timeout after hydration, before starting the reveal. `app/styles/home.css:293` hides/blurs the intro until then. The reveal and delayed per-character font-weight animation add further time; the browser identified letters in the name as the final LCP candidates.

Three interleaved baseline/experiment pairs used fresh Chromium contexts, a 1440×900 desktop viewport, DPR 1, and no network throttling. Both variants intercepted CSS requests. The experimental variant appended CSS setting opacity to 1 and removing blur, transforms and animations from `.hero-intro` and its descendants. Decorative background behavior was unchanged.

| Run | Baseline FCP | Baseline LCP | Visible intro FCP/LCP |
| --- | ---: | ---: | ---: |
| 1 | 692 ms | 2000 ms | 476 ms |
| 2 | 360 ms | 1676 ms | 520 ms |
| 3 | 492 ms | 1904 ms | 528 ms |

Median LCP: **1904 → 520 ms**, a **1384 ms / 73%** reduction. Baseline LCP occurred 1.31–1.41 seconds after FCP; experimental LCP coincided with FCP. This is a diagnostic experiment, not a validated production patch or a forecast of field-score improvement. It also changes the intro's visual motion.

Recommended implementation: render readable intro text from the initial HTML and let the decorative mesh animate independently. Remove the visibility dependency on image decoding/hydration and reconsider the delayed font-weight sweep on the main name. Verify light/dark themes, reduced motion, navigation, and restored scroll positions.

## 2. A visible article image is oversized and deprioritized

On `/blog/oneui-design-kit`, Chromium identified `/images/projects/oneui-bento.png` as LCP at 1440×900. The image is 2470×1389, with an original size of **1,063,137 bytes**. Its live attributes are `loading="lazy"` and `fetchpriority="low"`; the screenshot area includes the image beginning around 587 px down the viewport. It is served as a raw PNG, bypassing Next image optimization. This route transferred about 1.92 MB of subresources in the first normal test, including another 341 KB PNG.

`lib/sanitizeBlogHtml.ts:32` unconditionally assigns lazy loading and low priority to every rich-text image; `app/blog/enhanceBlogMedia.ts:74` also sets lazy loading. The sanitizer does not preserve `srcset` or `sizes`. The featured hero already uses Next Image priority; it is not the LCP image in this representative test.

Local Sharp WebP encodes at quality 75, without modifying the original:

| Width | Encoded size | Reduction |
| --- | ---: | ---: |
| 960 px | 38,608 bytes | 96.4% |
| 1200 px | 53,890 bytes | 94.9% |
| 1920 px | 106,078 bytes | 90.0% |

Recommended implementation: responsive optimized article media, retaining originals for lightbox/download use. Give actual above-fold/LCP media eager loading and appropriate priority; retain lazy loading below the fold. Both server sanitization and client enhancement must preserve that decision. Do not simply prioritize every image or always the first image regardless of layout. Check image quality and higher-DPR screens before choosing final variants.

Google's guidance on identifying LCP and removing loading/render delays: https://web.dev/articles/optimize-lcp

## 3. Server/content waits are a secondary investigation target

`app/page.tsx:18` waits for flags, then waits for projects, featured stories, recent posts, and profile facts before returning the homepage. These feeds are parallel within their group, but below-fold content still gates the hero. `app/blog/BlogIndexContent.tsx:8` waits for both posts and categories before returning the header/list. The root layout also awaits request-dependent flags/context.

One normal `/blog` navigation received first bytes at 143 ms, finished its HTML response at 1093 ms, and painted at 1188 ms. Its first CSS request began at 942 ms. This demonstrates that a fast first byte can coexist with late useful content. Exact server/CMS/config contributions were not instrumented, so this cannot be assigned wholly to Sanity or a single function.

Production deployment `dpl_4wbRhioZX6iEQu6t8tU5GtEqP8b6` runs in `iad1`; response IDs showed `lhr1::iad1`. All sampled route responses had private/no-store HTML and `x-vercel-cache: MISS`. That establishes lack of full-page CDN caching, **not** lack of data caching: Sanity fetches explicitly request a 60-second revalidation interval and the `blog` tag. Do not remove host/flag-dependent rendering or cache whole pages without preserving edition and override isolation.

Recommended next steps: render the homepage hero independently and stream lower sections; move the blog heading outside the CMS-dependent boundary where practical; measure per-upstream timings and verify data-cache hits/revalidation before changing caching or region. Keep the existing hostname and feature-flag behavior. A region move alone is not established as the solution by these samples.

## Scope and limits

The inspected production revision is `b9e195100568716e9bf842d2f20208ace5bdf7ba` (6 September), while the working checkout is `beta`, HEAD `32fedca`, with existing uncommitted work. Relevant production code was checked with `git show`; substantial other beta changes are not yet represented in this field report. The tested personal `/blog` currently lists one post, so this test does not cover all historical post paths or the college hostname that may contribute to the grouped route metrics.

The baseline JSON includes normal runs and exploratory CDP latency runs. The latter did not consistently impose the requested delay on navigation timing and must not be interpreted as calibrated geographic or network benchmarks. The three-pair homepage comparison above uses unthrottled runs only. Local UK lab measurements cannot reproduce the report's global p75 distribution. No JavaScript page errors appeared in the initial three-route samples; the 10 recent runtime log entries sampled were successful requests, not an exhaustive error audit.

Fonts are already self-hosted/preloaded or generated by next/font with swap behavior. The six mesh SVG files together are only a few KB. These are lower priorities than visibility gating and article image bytes. INP and CLS do not justify a broad interaction or animation rewrite.

After implementation, compare desktop FCP/LCP by route and deployment with adequate fresh events; target FCP ≤1.8 s and LCP ≤2.5 s while preserving INP/CLS. A rolling seven-day score will include older deployments until those events age out.

Evidence: `baseline.json` and `hero-experiment.json` alongside this report.

## Implementation and validation

Implemented after approval on 12 September:

- Extracted `HomeHero` so the server can stream it before the lower homepage content feeds. Intro text is visible before application hydration; decorative mesh and pointer-driven text interactions remain.
- Moved the blog heading outside the content-fetching Suspense boundary.
- Generated responsive Next image URLs for supported standalone article images using the same remote-host configuration as the optimizer. Retained original URLs for the lightbox and kept galleries/comparisons with their dedicated renderers.
- Prioritized only a leading standalone article image before substantial text or other media; later images remain lazy. Client enhancement preserves the server's loading decision. Portable Text uses the same early-media policy, including mixed legacy fragments.
- Restored initial hash scrolling when a linked homepage section arrives after the initial stream.

Validation: production build, TypeScript, ESLint, 133 unit tests, 21 existing blog-layout browser checks, eight existing audit browser checks, and five new performance browser checks passed. The new checks cover light/dark intro visibility with application chunks blocked, streamed blog search, responsive article images and original lightbox media, and mobile section links. The real CMS search test uses the existing local `ff-blog-enabled` override because the developer machine's remote Flags stream intermittently times out.

### Launch animation refinement

After visual feedback on beta, restored a short staggered fade, 12 px rise, and 3 px blur for the intro. Each element animates for 420 ms, with the final line complete by 500 ms. These CSS animations begin with the server-rendered page, independent of application hydration and lower content feeds. The decorative gradient expands and fades over 950 ms, removing the previous early opacity jump. Its original SVG ellipse geometry is now inline, eliminating the separate image/decode readiness gate. Reduced-motion mode remains immediately visible; pointer-driven name effects remain available.

Beta smoke testing also exposed a hydration mismatch when corner smoothing was enabled and the shared theme provider hydrated before streamed cards. Each card now uses a server/client hydration snapshot to preserve the initial server tree before adding its smoothing wrapper.

Revalidated the production build, TypeScript, ESLint, and all eight performance browser checks. Added checks for intermediate text/gradient animation values, instant reduced-motion rendering, and delayed card hydration with corner smoothing enabled. Inspected 100/250/500/950 ms animation frames in both themes. This restores a bounded visual entrance instead of aiming for the diagnostic experiment's fully static intro; field improvements still require fresh Speed Insights events.

The local build emitted the existing Google Sans Code fallback-font warning and an unavailable-shop-catalogue fallback message. These did not prevent the build. No region, full-page caching, production domain, or CMS content settings were changed.
