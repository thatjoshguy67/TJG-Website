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

test('launch text and gradient reveal progress gradually without hydration', async ({ page }) => {
  await page.route(/\/_next\/.*\.js/, route => route.abort());
  await page.goto('/');
  await expect(page.locator('.hero-name')).toBeVisible();
  const sample = async (time: number) => page.evaluate(time => {
    for (const animation of document.getAnimations()) {
      animation.pause();
      animation.currentTime = time;
    }
    const name = document.querySelector('.hero-name')!;
    const mesh = document.querySelector('.hero-mesh')!;
    const reveal = getComputedStyle(document.querySelector('.hero-section')!, '::after');
    return {
      text: Number(getComputedStyle(name).opacity),
      mesh: Number(getComputedStyle(mesh).opacity),
      radius: parseFloat(reveal.getPropertyValue('--hero-reveal-inner')),
    };
  }, time);
  const start = await sample(0);
  const middle = await sample(200);
  const textDone = await sample(500);
  const done = await sample(950);
  expect(start.text).toBe(0);
  expect(start.mesh).toBe(0);
  expect(middle.text).toBeGreaterThan(0.1);
  expect(middle.text).toBeLessThan(0.95);
  expect(middle.mesh).toBeGreaterThan(0);
  expect(middle.mesh).toBeLessThan(textDone.mesh);
  expect(middle.radius).toBeGreaterThan(0);
  expect(middle.radius).toBeLessThan(textDone.radius);
  expect(textDone.text).toBe(1);
  expect(done.mesh).toBe(1);
  expect(done.radius).toBe(105);
  await expect(page.locator('.hero-mesh svg')).toHaveCount(6);
});

test('reduced motion shows the complete intro immediately', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.hero-name')).toHaveCSS('opacity', '1');
  await expect(page.locator('.hero-name')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.hero-mesh')).toHaveCSS('opacity', '1');
  await expect(page.locator('.hero-mesh')).toHaveCSS('animation-name', 'none');
});

test('streamed cards hydrate cleanly with corner smoothing enabled', async ({ page, context, baseURL }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await context.addCookies([{ name: 'ff-corner-smoothing-enabled', value: 'true', url: baseURL! }]);
  await page.addInitScript(() => localStorage.setItem('cornerSmoothing', 'true'));
  // Let the shared theme provider hydrate before the streamed cards' module.
  await page.route(/\/_next\/.*\.js/, async route => {
    const response = await route.fetch();
    const body = await response.text();
    if (body.includes('Popular articles')) await new Promise(resolve => setTimeout(resolve, 1200));
    await route.fulfill({ response, body });
  });
  await page.goto('/');
  await expect(page.locator('.home-facts-list li')).toHaveCount(3);
  await expect(page.locator('.design-projects-section [data-no-smooth-corners]').first()).toBeAttached();
  expect(errors).toEqual([]);
  await page.unrouteAll({ behavior: 'wait' });
});

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
