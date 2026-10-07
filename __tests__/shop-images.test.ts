import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ShopContentCard } from '../app/components/ContentCards';
import { bypassShopImageOptimization } from '../lib/shopImages';
import remotePatterns from '../lib/imageRemotePatterns.json';

it.each(['static.gumroad.com', 'public-files.gumroad.com'])('bypasses only configured HTTPS Gumroad origin %s', hostname => {
  expect(remotePatterns).toContainEqual({ protocol: 'https', hostname });
  expect(bypassShopImageOptimization(`https://${hostname}/thumbnail.png?version=1`)).toBe(true);
  expect(bypassShopImageOptimization(`https://${hostname.toUpperCase()}/thumbnail.png`)).toBe(true);
});

it.each([
  '/images/projects/oneui-design-kit-cover-light.png',
  'https://example.com/thumbnail.png',
  'https://cdn.sanity.io/thumbnail.png',
  'http://static.gumroad.com/thumbnail.png',
  '//static.gumroad.com/thumbnail.png',
  'https://static.gumroad.com.evil.test/thumbnail.png',
  'https://evil-static.gumroad.com/thumbnail.png',
  'https://sub.static.gumroad.com/thumbnail.png',
  'https://public-files.gumroad.com.evil.test/thumbnail.png',
  'https://static.gumroad.com@evil.test/thumbnail.png',
  'https://user:password@static.gumroad.com/thumbnail.png',
  'https://static.gumroad.com:444/thumbnail.png',
  'https://static.gumroad.com./thumbnail.png',
  'https://static.gumroad.com\\@evil.test/thumbnail.png',
  ' https://static.gumroad.com/thumbnail.png',
  'https://static.gumroad.com/image name.png',
  'https://',
  'not a URL',
  '',
])('does not grant an optimization bypass to %s', src => {
  expect(bypassShopImageOptimization(src)).toBe(false);
});

it.each(['https://static.gumroad.com/image.png', 'https://public-files.gumroad.com/image.png', '/images/projects/oneui-design-kit-cover-light.png'])('preserves shop card image behavior for %s', imageUrl => {
  const html = renderToStaticMarkup(createElement(ShopContentCard, {
    product: { id: 'fixture', name: 'Fixture product', url: '/shop', imageUrl },
  }));
  expect(html).toContain('loading="lazy"');
  expect(html).toContain('alt=""');
  expect(html).toContain('aria-label="Fixture product"');
  expect(html).toContain('position:absolute');
  if (imageUrl.startsWith('/')) {
    expect(html).toContain('/_next/image');
    expect(html).toContain('srcSet=');
  } else {
    expect(html).toContain(`src="${imageUrl}"`);
    expect(html).not.toContain('/_next/image');
  }
});
