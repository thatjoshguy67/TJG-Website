import { sanitizeBlogHtml } from '../lib/sanitizeBlogHtml';
import { optimizedBlogImageAttributes } from '../lib/blogImages';

const imageTags = (html: string) => html.match(/<img\b[^>]*>/g) || [];

it('optimizes a leading article image and preserves the full-resolution source', () => {
  const html = sanitizeBlogHtml('<p>A short introduction.</p><img src="/images/projects/oneui-bento.png" width="2470" height="1389"><p>More detail</p><img src="/images/projects/oneui-devmode.png">');
  const [first, second] = imageTags(html);
  expect(first).toContain('/_next/image?url=%2Fimages%2Fprojects%2Foneui-bento.png');
  expect(first).toContain('srcset=');
  expect(first).toContain('data-full="/images/projects/oneui-bento.png"');
  expect(first).toContain('width="2470"');
  expect(first).toContain('height="1389"');
  expect(first).toContain('loading="eager"');
  expect(first).toContain('fetchpriority="high"');
  expect(second).toContain('loading="lazy"');
  expect(second).toContain('srcset=');
});

it.each([
  '<p>' + 'Long article text. '.repeat(40) + '</p>',
  '<iframe src="https://www.youtube.com/embed/test"></iframe>',
  '<table><tr><td>Content</td></tr></table>',
])('does not prioritize an image after substantial content: %s', prefix => {
  const [image] = imageTags(sanitizeBlogHtml(prefix + '<img src="/images/projects/oneui-bento.png" loading="eager" fetchpriority="high">'));
  expect(image).toContain('loading="lazy"');
  expect(image).not.toContain('fetchpriority="high"');
});

it('leaves galleries to their dedicated renderer and keeps following images lazy', () => {
  const html = sanitizeBlogHtml('<figure class="wp-block-gallery is-style-slideshow"><figure><img src="/images/projects/oneui-bento.png"></figure></figure><img src="/images/projects/oneui-devmode.png">');
  const [slide, following] = imageTags(html);
  expect(slide).toContain('src="/images/projects/oneui-bento.png"');
  expect(slide).not.toContain('/_next/image');
  expect(slide).toContain('loading="lazy"');
  expect(following).toContain('/_next/image');
  expect(following).toContain('loading="lazy"');
});

it('does not feed unconfigured hosts, vectors, or animation sources to the optimizer', () => {
  for (const src of ['https://example.com/image.png', 'https://cdn.sanity.io.evil.test/image.png', 'https://cdn.sanity.io:444/image.png', '/images/animation.gif', '/images/logo.svg', 'https://cdn.sanity.io/image.gif']) {
    expect(optimizedBlogImageAttributes(src)).toEqual({});
  }
  expect(optimizedBlogImageAttributes('https://cdn.sanity.io/images/project/production/photo.png').src).toContain('/_next/image');
  expect(optimizedBlogImageAttributes('https://site.wordpress.com/image.png').src).toContain('/_next/image');
  expect(optimizedBlogImageAttributes('https://pbs.twimg.com/media/image.jpg').src).toContain('/_next/image');
  expect(optimizedBlogImageAttributes('https://pbs.twimg.com/other/image.jpg')).toEqual({});
});

it('discards supplied responsive URLs and unsafe originals while retaining safe original overrides', () => {
  const html = sanitizeBlogHtml('<img src="/images/projects/oneui-bento.png" srcset="https://evil.test/a.png 1x" data-full="javascript:alert(1)">');
  expect(html).not.toMatch(/evil\.test|javascript:/);
  expect(html).toContain('data-full="/images/projects/oneui-bento.png"');
  expect(sanitizeBlogHtml('<img src="/images/projects/oneui-bento.png" data-full="https://example.com/original.png">')).toContain('data-full="https://example.com/original.png"');
});

it('keeps later rich-text fragments lazy when the enclosing article has preceding media', () => {
  const [image] = imageTags(sanitizeBlogHtml('<img src="/images/projects/oneui-bento.png">', { prioritizeLeadingImage: false }));
  expect(image).toContain('loading="lazy"');
});
