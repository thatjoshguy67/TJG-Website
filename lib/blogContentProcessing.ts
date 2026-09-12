import { normalizeHtmlHeadings } from './headings';
import { sanitizeBlogHtml } from './sanitizeBlogHtml';
import { sanitizeBlogButtonHref } from './sanitizeBlogButtonHref';
import { replaceTransitModelPlaceholder } from './transitModelSketchfabEmbed';
import { stripHtmlAndDecode } from './portableText';

const EMBED_MAP: Record<string, string> = {
  'story-mindmap': `
    <div class="figma-wrapper">
      <iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="800" height="450" src="https://embed.figma.com/board/JFh3pE1bu21Ad74KUibZug/Unit-4---Storytelling?node-id=0-1&embed-host=share" allowfullscreen></iframe>
    </div>
  `,
  'gdd-results': `
    <div class="figma-wrapper">
      <iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="800" height="450" src="https://forms.office.com/Pages/AnalysisPage.aspx?AnalyzerToken=Svsr8OjeTHhXu0MsS6MiWcVyyd1M3BbD&id=0JsvSSEvbkyhotOQXlsYcw32xjNmmxRNrKwdPrtn9KRUM0s1OEFZWFZLOUNLNklZRThROFc3U1ZQOS4u" allowfullscreen></iframe>
    </div>
  `,
  'story-results': `
    <div class="figma-wrapper">
      <iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="800" height="450" src="https://forms.office.com/Pages/AnalysisPage.aspx?AnalyzerToken=etTOj7nVjPy1Bt4CWPzEeAfutjr6345P&id=0JsvSSEvbkyhotOQXlsYcw32xjNmmxRNrKwdPrtn9KRUNlJPUklRRlRXSDVCUkRCVUZMT1RINTRJTS4u" allowfullscreen></iframe>
    </div>
  `,
  'google-doc-name': `
    <div class="figma-wrapper">
      <iframe src="https://docs.google.com/document/d/e/2PACX-1vRZR3r5IoEGDi0okO7E-GHVfb9yPtadU3H8v6urWH_bvpmze1qFmm_OZL_63jmjGfiG7ML-ahpuoSPC/pub?embedded=true"></iframe>
    </div>
  `,
  'figma-ux-workflow': `
    <div class="figma-wrapper">
      <iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="800" height="450" src="https://embed.figma.com/board/S8xl4FFql9Q6V4O3S0Zayw/UX-Workflow?node-id=0-1&embed-host=share" allowfullscreen></iframe>
    </div>
  `,
  'maps-embed': `
    <div class="figma-wrapper">
      <iframe src="https://www.google.com/maps/embed?pb=!4v1770888651744!6m8!1m7!1sEwCt_D72XDwMDw9hPLITpA!2m2!1d50.75749897863136!2d-2.076732351682947!3f240.73163492541838!4f-6.098039408431191!5f0.7820865974627469" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    </div>
  `,
  'figma-prototype': `
    <div class="figma-wrapper">
      <iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="800" height="800" src="https://embed.figma.com/proto/mCrLxeF17zSEftGhESIB9u/One-UI-Setup-Flow?page-id=1%3A2&node-id=14-772&p=f&viewport=-4%2C538%2C0.13&scaling=min-zoom&content-scaling=responsive&starting-point-node-id=14%3A772&embed-host=share" allowfullscreen></iframe>
    </div>
  `,
  'figma-fmp-design': `
    <div class="figma-wrapper">
      <iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="800" height="450" src="https://embed.figma.com/design/3QmNHhQMlANCj511sSQuXr/Getaway-Driver---FMP?node-id=0-1&embed-host=share" allowfullscreen></iframe>
    </div>
  `,
  'fmp-pitch-embed': `
    <div class="figma-wrapper">
      <iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="800" height="600" src="https://embed.figma.com/deck/tovF81JJShr77717qeJ883/FMP-Proposal?node-id=1-28&p=f&viewport=493%2C302%2C0.3&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1&embed-host=share" allowfullscreen></iframe>
    </div>
  `,
  'fmp-mindmap': `
    <div class="figma-wrapper">
      <iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="800" height="450" src="https://embed.figma.com/board/B9dwuVyhvqnIYIyi2NypXd/FMP-Moodboard?node-id=0-1&embed-host=share" allowfullscreen></iframe>
    </div>
  `,
};

export function getEmbedHtmlForKey(keyphrase: string): string | null {
  return EMBED_MAP[keyphrase] ? sanitizeBlogHtml(EMBED_MAP[keyphrase]) : null;
}

export function countWords(content: string): number {
  const text = stripHtmlAndDecode(content);
  if (!text) return 0;
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

export function getDisplayWordCount(storedWordCount: number | null | undefined, content: string): number {
  if (typeof storedWordCount === 'number' && Number.isFinite(storedWordCount) && storedWordCount > 0) {
    return storedWordCount;
  }
  return countWords(content);
}


export function processContentWithEmbeds(content: string, imageOptions?: { prioritizeLeadingImage?: boolean }): string {
  let processedContent = content;

  Object.entries(EMBED_MAP).forEach(([keyphrase, embedHtml]) => {
    processedContent = processedContent.replaceAll(keyphrase, embedHtml);
  });

  const wordCountMarker = 'word-count';
  const wordCounterPlaceholder = '{{WORD_COUNTER}}';
  const beforeCounters = processedContent;
  processedContent = processedContent.replaceAll(wordCountMarker, (_match, offset: number) =>
    `${wordCounterPlaceholder}:${countWords(beforeCounters.slice(0, offset))}`,
  );

  processedContent = replaceTransitModelPlaceholder(processedContent);

  processedContent = processedContent.replace(
    /<p[^>]*>\s*\(([^)]+)\)\[([^\]]+)\](?:\{([^}]+)\})?\s*<\/p>/g,
    (_match, label: string, href: string, icon?: string) => {
      const safeHref = sanitizeBlogButtonHref(href);
      return icon
        ? `{{BUTTON:${label}|${safeHref}|${icon}}}`
        : `{{BUTTON:${label}|${safeHref}}}`;
    }
  );

  return normalizeHtmlHeadings(sanitizeBlogHtml(processedContent, imageOptions));
}
