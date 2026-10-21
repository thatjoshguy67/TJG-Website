import { renderToStaticMarkup } from 'react-dom/server';
import PortableTextContent from '../app/blog/PortableTextContent';
import { processContentWithEmbeds } from '../lib/blogContentProcessing';
import { sanitizeBlogHtml } from '../lib/sanitizeBlogHtml';
import { calloutHtml } from '../lib/callout';
import { portableTextToPlainText } from '../lib/portableText';

jest.mock('../lib/sanity', () => ({ getSanityImageUrl: () => null }));
const svg = '<svg viewBox="0 0 24 24" fill="none"><path d="M0 0h24v24H0z" stroke="currentColor" stroke-width="1.5"/></svg>';

it.each(['info', 'tip', 'warning'] as const)('renders native %s callouts in mixed Portable Text', tone => {
  const html = renderToStaticMarkup(<PortableTextContent blocks={[
    { _type: 'block', children: [{ _type: 'span', text: 'Before' }] },
    { _type: 'callout', tone, title: 'A title', text: 'First line\nSecond line', icon: { name: 'Custom', svg } },
    { _type: 'block', children: [{ _type: 'span', text: 'After' }] },
  ]} />);
  expect(html).toContain(`blog-callout--${tone}`);
  expect(html).toContain('viewBox="0 0 24 24"');
  expect(html).toContain('<path');
  expect(html).toContain('width="24"');
  expect(html).toContain('A title');
  expect(html).toContain('First line\nSecond line');
  expect(html.indexOf('Before')).toBeLessThan(html.indexOf('A title'));
  expect(html.indexOf('A title')).toBeLessThan(html.indexOf('After'));
});

it('preserves already saved Admin callouts in HTML and Portable Text snippets', () => {
  const legacy = `<aside data-blog-element="{&quot;kind&quot;:&quot;callout&quot;}" aria-label="warning callout" style="border-left:4px solid #bd8529;background:#bd852918;border-radius:8px;padding:1.25rem;margin:1.5rem 0"><span style="display:inline-flex;vertical-align:middle;margin-right:0.65rem">${svg}</span><strong>Watch out</strong><p style="white-space:pre-wrap;margin:0.5rem 0 0">One\nTwo</p></aside>`;
  const html = processContentWithEmbeds(legacy);
  expect(html).toContain('blog-callout--warning');
  expect(html).toContain('<svg');
  expect(html).toContain('viewBox="0 0 24 24"');
  expect(html).toContain('white-space:pre-wrap');
  expect(html).toContain('One\nTwo');
  expect(sanitizeBlogHtml(html)).toBe(html);
  expect(renderToStaticMarkup(<PortableTextContent blocks={[{ _type: 'legacyHtml', html: legacy }]} />)).toContain('blog-callout--warning');
});

it('escapes callout text and rejects active or remotely loaded icon content', () => {
  const html = calloutHtml({ _type: 'callout', title: '<script>alert(1)</script>', text: '<img src=x onerror="alert(1)">', icon: { svg: '<svg onload="alert(1)" viewBox="0 0 24 24"><script>alert(2)</script><foreignObject><iframe src="https://www.youtube.com/embed/evil"></iframe></foreignObject><image href="https://evil.example/icon"/><use href="https://evil.example/a"/><path d="M0 0h24" fill="url(https://evil.example/a)"/><animate attributeName="href" values="javascript:alert(1)"/></svg>' } });
  expect(html).not.toMatch(/<script|<img|onload=|<foreignObject|<iframe|<image|<use|<animate|evil\.example|javascript:/i);
  expect(html).toContain('&lt;script&gt;');
  expect(html).toContain('<path');
});

it('renders callouts without a title or icon and includes their body in plain text', () => {
  const block = { _type: 'callout', text: 'The message' };
  const html = calloutHtml(block);
  expect(html).toContain('blog-callout--info');
  expect(html).toContain('The message');
  expect(html).not.toMatch(/<svg|<strong/);
  expect(portableTextToPlainText([{ ...block, title: 'Note' }])).toBe('Note\nThe message');
});
