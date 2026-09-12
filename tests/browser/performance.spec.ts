import { test, expect } from '@playwright/test';

for (const colorScheme of ['light', 'dark'] as const) {
  test(`homepage intro is visible without hydration in ${colorScheme} mode`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ colorScheme, viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    // Keep Next's inline stream-reveal scripts, but block application hydration.
    await page.route(/\/_next\/.*\.js/, route => route.abort());
    await page.goto(baseURL + '/');
    await expect(page.locator('.hero-name')).toContainText('Josh');
    await expect(page.locator('.hero-name')).toHaveCSS('opacity', '1');
    await expect(page.locator('.hero-intro')).toHaveCSS('filter', 'none');
    await expect(page.locator('.hero-name')).toBeInViewport();
    await context.close();
  });
}

test('blog index keeps one heading and working search after content streams', async ({ page, context, baseURL }) => {
  // Exercise the supported local override so this layout test does not wait for
  // the developer machine's remote Flags stream to connect.
  await context.addCookies([{ name: 'ff-blog-enabled', value: 'true', url: baseURL! }]);
  await page.goto('/blog');
  await expect(page.locator('.main-content')).toHaveCount(1);
  await expect(page.locator('.top-app-bar')).toHaveCount(1);
  await expect(page.getByRole('link', { name: /One UI Design Kit/ }).first()).toBeVisible();
  const search = page.getByRole('textbox', { name: 'Search blog' });
  const results = page.waitForResponse(response => response.url().includes('/api/blog/posts?'));
  await search.fill('One UI');
  expect((await results).ok()).toBe(true);
  await expect(page.getByRole('link', { name: /One UI Design Kit/ }).first()).toBeVisible();
  await search.fill('zzzzzzzz12345678');
  await expect(page.getByText('No articles found. Try different keywords or categories.')).toBeVisible();
});

test('article images stay optimized after hydration and lightbox uses the original', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/blog/oneui-design-kit');
  const image = page.locator('.body-text img[data-full="/images/projects/oneui-bento.png"]');
  await expect(image).toHaveAttribute('srcset', /\/_next\/image/);
  await expect(image).toHaveAttribute('loading', 'eager');
  await expect(image).toHaveAttribute('fetchpriority', 'high');
  // Lightbox preparation happens in an effect, after the HTML has hydrated.
  await expect(image).toHaveAttribute('role', 'button');
  await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await image.click();
  await expect(page.getByRole('dialog', { name: 'Image viewer' })).toBeVisible();
  await expect(page.locator('.lightbox-img')).toHaveAttribute('src', '/images/projects/oneui-bento.png');
  await page.getByRole('button', { name: 'Close image viewer' }).click();
  expect(errors).toEqual([]);
});

test('streamed homepage still supports section links and mobile layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#about');
  await expect(page.locator('#about')).toBeInViewport();
  await expect(page.locator('.home-facts-list li')).toHaveCount(3);
  await expect(page.locator('.hero-name')).toHaveCSS('opacity', '1');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
