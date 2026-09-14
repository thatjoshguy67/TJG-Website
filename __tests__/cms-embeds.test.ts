import { getEmbedHtmlForKey } from '../lib/blogContentProcessing';

const figma = '<iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="800" height="450" src="https://embed.figma.com/board/amz85a9nbOQO50MWS33qRA/Unit-9-Ideas?node-id=0-1&amp;embed-host=share" allowfullscreen></iframe>';

test('renders the Figma iframe saved as an embed key in Project Thing', () => {
  const html = getEmbedHtmlForKey(figma);
  expect(html).toContain('<iframe');
  expect(html).toContain('https://embed.figma.com/board/amz85a9nbOQO50MWS33qRA/Unit-9-Ideas?node-id=0-1&amp;embed-host=share');
  expect(html).not.toContain('&amp;amp;');
  expect(html).toContain('aspect-ratio:800/450');
  expect(html).toContain('title="Embedded content"');
});

test('supports URL-only embeds and the existing named embed catalogue', () => {
  expect(getEmbedHtmlForKey('https://embed.figma.com/board/test/Test?embed-host=share')).toContain('<iframe');
  expect(getEmbedHtmlForKey('story-mindmap')).toContain('<iframe');
  expect(getEmbedHtmlForKey('unknown-key')).toBeNull();
});

test('only renders permitted iframe content from pasted code', () => {
  const html = getEmbedHtmlForKey(`<script>alert(1)</script><img src=x onerror="alert(1)">${figma.replace('allowfullscreen', 'onload="alert(1)" srcdoc="<script>alert(1)</script>" allowfullscreen')}`);
  expect(html).toContain('<iframe');
  expect(html).not.toMatch(/script|onload|onerror|srcdoc|<img|alert/);
  for (const src of ['javascript:alert(1)', 'https://evil.example/embed', 'https://embed.figma.com.evil.example/', 'https://user:pass@embed.figma.com/board/test', '//embed.figma.com/board/test']) {
    expect(getEmbedHtmlForKey(`<iframe src="${src}"></iframe>`)).toBeNull();
  }
});
