import { test, expect, type Page } from '@playwright/test';
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

let script: string;
let styles: string;
test.beforeAll(async () => {
  const bundle = await build({
    entryPoints: ['tests/browser/fixtures/blog-layout.tsx'], bundle: true, write: false,
    outdir: 'browser-fixture', jsx: 'automatic', platform: 'browser',
    define: { 'process.env.NODE_ENV': '"production"' },
    alias: Object.fromEntries(['navigation', 'image', 'dynamic', 'link'].map(name =>
      [`next/${name}`, path.resolve(`tests/browser/fixtures/${name}.${name === 'navigation' ? 'ts' : 'tsx'}`)])),
  });
  script = bundle.outputFiles.find(file => file.path.endsWith('.js'))!.text;
  styles = bundle.outputFiles.find(file => file.path.endsWith('.css'))?.text ?? '';
});

async function fixture(page: Page, mode = 'post') {
  await page.route('**/__blog_layout?*', route => route.fulfill({ contentType: 'text/html', body:
    '<!doctype html><html data-theme="light"><body class="nav-collapsed"><div id="fixture"></div></body></html>' }));
  await page.goto(`/__blog_layout?${mode}`);
  for (const file of ['app/styles/shared.css', 'app/globals.css', 'app/blog/blog.css']) {
    await page.addStyleTag({ content: fs.readFileSync(file, 'utf8').replace(/@import[^;]+;/g, '') });
  }
  await page.addStyleTag({ content: styles });
  await page.addScriptTag({ content: script });
  await expect(page.locator('.native-slideshow__img')).toHaveCount(3);
  await expect.poll(() => page.locator('.native-slideshow__img').evaluateAll(images =>
    images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
}

for (const mode of ['post', 'index']) {
  test(`${mode} search stays in place when navigation opens or changes width`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await fixture(page, mode);
    const bar = page.locator(mode === 'post' ? '.post-search-bar' : '.floating-search-bar');
    const initial = await bar.boundingBox();
    for (const state of ['', 'sidebar-custom-width', 'nav-collapsed']) {
      await page.evaluate(state => {
        document.body.className = state;
        document.body.style.setProperty('--sidebar-content-offset', '480px');
      }, state);
      const current = await bar.boundingBox();
      expect(current!.x).toBeCloseTo(initial!.x, 0);
      expect(current!.width).toBeCloseTo(initial!.width, 0);
    }
  });
}

for (const width of [320, 390, 1440]) {
  test(`heading action has its own pill and collapses while searching at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await fixture(page);
    await page.addStyleTag({ content: '.main-content { padding-bottom: 100vh !important; }' });
    const bar = page.locator('.post-search-bar');
    const jump = page.locator('.post-search-jump');
    const input = page.getByRole('combobox', { name: 'Search in post' });
    const label = jump.locator('.post-search-jump-text');
    await expect(label).not.toHaveText('Back to top');
    expect(await bar.locator('.post-search-jump').count()).toBe(0);
    const toolbar = page.locator('.post-search-positioner');
    const toolbarBefore = await toolbar.boundingBox();
    const before = await bar.boundingBox();
    const action = await jump.boundingBox();
    expect(action!.x - (before!.x + before!.width)).toBeGreaterThanOrEqual(7);
    expect(action!.height).toBeCloseTo(before!.height, 0);
    if (width < 700) {
      expect(action!.width).toBeCloseTo(56, 0);
      await expect(label).toHaveCSS('opacity', '0');
    }
    const destination = await jump.getAttribute('aria-label');
    await input.focus();
    await expect(jump).toHaveCSS('width', '56px');
    await expect(label).toHaveCSS('opacity', '0');
    await expect.poll(async () => (await jump.boundingBox())!.width).toBeCloseTo(56, 0);
    if (width >= 700) await expect.poll(async () => (await bar.boundingBox())!.width).toBeGreaterThan(before!.width);
    else expect((await bar.boundingBox())!.width).toBeCloseTo(before!.width, 0);
    const toolbarAfter = await toolbar.boundingBox();
    expect(toolbarAfter!.width).toBeCloseTo(toolbarBefore!.width, 0);
    expect(toolbarAfter!.x).toBeCloseTo(toolbarBefore!.x, 0);
    await input.fill('searchable');
    await expect(page.locator('.post-search-results')).toBeVisible();
    await expect(jump).toHaveAttribute('aria-label', destination!);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    // Clicking the compact action must complete before blur expands its shape.
    await jump.click();
    await expect(input).not.toBeFocused();
    await expect(label).toHaveCSS('opacity', width < 700 ? '0' : '1');
    await expect(page.locator('.post-search-results')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  });
}

test('late article sections update the jump label and button and keyboard visit the same H1 sections', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await fixture(page);
  await page.addStyleTag({ content: '.main-content { padding-bottom: 100vh !important; }' });
  const jump = page.locator('.post-search-jump');
  // Mimic switching from a section list to the combined article after mount.
  await page.locator('.body-text').first().evaluate(el => { el.innerHTML = '<p>Introduction without headings</p>'; });
  await expect(jump).toHaveAttribute('aria-label', 'Back to top');
  await page.locator('.body-text').first().evaluate(el => {
    el.insertAdjacentHTML('afterend', `<div class="body-text">
      <div style="height:400px"></div><h2 id="repeated" class="content-heading-h1">First section</h2>
      <div style="height:400px"></div><h2 class="content-heading-h2">Subheading</h2>
      <div style="height:400px"></div><h2 id="repeated" class="content-heading-h1">Second section</h2>
      <div style="height:400px"></div><h2 class="content-heading-h1">Last section</h2></div>`);
  });
  await expect(jump).toHaveAttribute('aria-label', 'First section');
  const toolbar = page.locator('.post-search-positioner');
  const original = await toolbar.boundingBox();
  await page.getByRole('heading', { name: 'First section' }).evaluate(el => { el.textContent = 'A much longer first section heading'; });
  await expect(jump).toHaveAttribute('aria-label', 'A much longer first section heading');
  expect((await toolbar.boundingBox())!.width).toBeCloseTo(original!.width, 0);
  expect((await toolbar.boundingBox())!.x).toBeCloseTo(original!.x, 0);
  await jump.click();
  await expect(jump).toHaveAttribute('aria-label', 'Second section');
  await jump.click();
  await expect.poll(() => page.getByRole('heading', { name: 'Second section', exact: true }).evaluate(el => el.getBoundingClientRect().top)).toBeCloseTo(104, 0);
  await expect(jump).toHaveAttribute('aria-label', 'Last section');
  await jump.blur();
  await page.keyboard.press(']');
  await expect(jump).toHaveAttribute('aria-label', 'Back to top');
  await page.keyboard.press('[');
  await expect(jump).toHaveAttribute('aria-label', 'Last section');
  await jump.click();
  await jump.click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});

test('toolbar animates its internal widths on focus, blur, and heading changes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await fixture(page);
  const jump = page.locator('.post-search-jump');
  await expect(jump).not.toHaveAttribute('aria-label', 'Back to top');
  await jump.evaluate(async el => { await Promise.all(el.getAnimations().map(a => a.finished)); });
  const sampleTransition = async () => page.locator('.post-search-positioner').evaluate(async toolbar => {
    const button = toolbar.querySelector<HTMLElement>('.post-search-jump')!;
    const search = toolbar.querySelector<HTMLElement>('.post-search-bar')!;
    getComputedStyle(button).width;
    const animation = button.getAnimations().find(a => (a as CSSTransition).transitionProperty === 'width');
    if (!animation) return [];
    animation.pause();
    const samples = [0, 120, 360].map(time => {
      animation.currentTime = time;
      return { button: parseFloat(getComputedStyle(button).width), search: search.getBoundingClientRect().width, total: toolbar.getBoundingClientRect().width };
    });
    animation.finish();
    return samples;
  });
  for (const focus of [true, false]) {
    await page.locator('.post-search-input').evaluate((el, focus) => focus ? (el as HTMLElement).focus() : (el as HTMLElement).blur(), focus);
    const samples = await sampleTransition();
    expect(samples).toHaveLength(3);
    expect(samples[1].button).toBeGreaterThan(Math.min(samples[0].button, samples[2].button));
    expect(samples[1].button).toBeLessThan(Math.max(samples[0].button, samples[2].button));
    for (const sample of samples) {
      expect(sample.total).toBeCloseTo(samples[0].total, 0);
      expect(sample.search + sample.button).toBeCloseTo(samples[0].search + samples[0].button, 0);
    }
  }
  const label = await jump.getAttribute('aria-label');
  await page.getByRole('heading', { name: label!, exact: true }).evaluate(el => { el.textContent = 'Next'; });
  await expect(jump).toHaveAttribute('aria-label', 'Next');
  expect(await sampleTransition()).toHaveLength(3);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('.post-search-input').focus();
  await expect(jump).toHaveCSS('width', '56px');
  expect(await sampleTransition()).toHaveLength(0);
});

test('short heading labels fit without fractional-pixel truncation after resizing or font changes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await fixture(page);
  const jump = page.locator('.post-search-jump');
  await expect(jump).not.toHaveAttribute('aria-label', 'Back to top');
  const heading = page.getByRole('heading', { name: (await jump.getAttribute('aria-label'))!, exact: true });
  await heading.evaluate(el => { el.id = 'fit-heading'; });
  const visibleLabel = jump.locator('.post-search-jump-label');
  const expectFits = async () => expect.poll(() => visibleLabel.evaluate(el => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return range.getBoundingClientRect().width - el.getBoundingClientRect().width;
  })).toBeLessThanOrEqual(0);
  for (const text of ['Overview', 'Research', 'Project Proposal', 'Next']) {
    await page.locator('#fit-heading').evaluate((el, text) => { el.textContent = text; }, text);
    await expect(jump).toHaveAttribute('aria-label', text);
    await expectFits();
    await page.locator('.post-search-input').focus();
    await expect(jump).toHaveCSS('width', '56px');
    await page.locator('.post-search-input').blur();
    await expectFits();
  }
  // A late font change must also resize the measurement while the label is clipped.
  await page.locator('.post-search-input').focus();
  await expect(jump).toHaveCSS('width', '56px');
  await jump.evaluate(el => { el.style.fontSize = '15.3px'; });
  await page.locator('.post-search-input').blur();
  await expectFits();
});

test('one click lands on its intended heading when media changes height during scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await fixture(page);
  await page.addStyleTag({ content: '.main-content { padding-bottom: 100vh !important; }' });
  await page.locator('.body-text').first().evaluate(el => {
    el.innerHTML = '<div id="resizing-media" style="height:2200px"></div><h2>Destination</h2><p>End.</p>';
    window.addEventListener('scroll', () => {
      document.getElementById('resizing-media')!.style.height = '3000px';
    }, { once: true });
  });
  const jump = page.locator('.post-search-jump');
  await expect(jump).toHaveAttribute('aria-label', 'Destination');
  await jump.click();
  await expect.poll(() => page.getByRole('heading', { name: 'Destination' }).evaluate(el => el.getBoundingClientRect().top)).toBeCloseTo(104, 0);
  await expect(jump).toHaveAttribute('aria-label', 'Back to top');
});

test('a press still clicks when the heading button shrinks before release', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await fixture(page);
  await page.addStyleTag({ content: '.main-content { padding-bottom: 100vh !important; }' });
  const jump = page.locator('.post-search-jump');
  await expect(jump).not.toHaveAttribute('aria-label', 'Back to top');
  const before = (await jump.boundingBox())!;
  await page.mouse.move(before.x + 20, before.y + before.height / 2);
  await page.mouse.down();
  await page.locator('.post-search-input').focus();
  await expect(jump).toHaveCSS('width', '56px');
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
});

test('heading action hover scales with a shadow without fading', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await fixture(page);
  const jump = page.locator('.post-search-jump');
  const normalShadow = await jump.evaluate(el => getComputedStyle(el).boxShadow);
  await jump.hover();
  await expect(jump).toHaveCSS('opacity', '1');
  await expect(jump).not.toHaveCSS('box-shadow', normalShadow);
  await expect.poll(() => jump.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a)).toBeCloseTo(1.035, 3);
});

test('shortcut border follows the chip as heading labels and search focus change', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await fixture(page);
  const chip = page.locator('.post-search-bar kbd');
  await expect(chip).toHaveAttribute('data-state', 'ready');
  for (const label of ['Short', 'A much longer heading changes the button width', 'Next']) {
    await page.locator('.post-search-jump-text').evaluate((el, label) => { el.textContent = label; }, label);
    await expect.poll(() => chip.evaluate(el => {
      const border = el.parentElement!.querySelector('svg[style*="absolute"]')!;
      return Math.abs(el.getBoundingClientRect().x - border.getBoundingClientRect().x);
    })).toBeLessThan(1);
  }
  await page.keyboard.press('Meta+k');
  await expect(chip).toHaveText('Esc');
  await expect(page.getByRole('combobox')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(chip).not.toHaveText('Esc');
});

for (const width of [390, 1440]) {
  test(`slideshow has no blank slide space and scrolls at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await fixture(page);
    for (const compact of [false, true]) {
      await page.evaluate(compact => document.body.classList.toggle('post-reading-compact', compact), compact);
      const sizes = await page.locator('.native-slideshow__slide').evaluateAll(slides => slides.map(slide => ({
        slide: slide.getBoundingClientRect().width,
        image: slide.querySelector('img')!.getBoundingClientRect().width,
        contained: getComputedStyle(slide).contentVisibility,
        gap: slide.nextElementSibling ? slide.nextElementSibling.getBoundingClientRect().left - slide.getBoundingClientRect().right : 12,
      })));
      for (const size of sizes) {
        expect(size.slide).toBeCloseTo(size.image, 0);
        expect(size.gap).toBeCloseTo(12, 0);
        expect(size.contained).toBe('visible');
      }
    }
    await page.evaluate(() => document.body.classList.remove('post-reading-compact'));
    const viewport = page.getByRole('region', { name: 'Image slideshow' });
    await expect(page.locator('.native-slideshow__dot')).toHaveCount(3);
    await expect(page.locator('.native-slideshow__indicators')).toHaveAttribute('aria-label', 'Image 1 of 3');
    await expect(page.locator('.native-slideshow__dot[data-active="true"]')).toHaveCount(1);
    await expect(viewport).not.toHaveAttribute('data-overflow-start');
    await expect(viewport).toHaveAttribute('data-overflow-end');
    await expect(viewport).not.toHaveCSS('mask-image', 'none');
    await viewport.focus();
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => viewport.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
    await expect(page.locator('.native-slideshow__indicators')).not.toHaveAttribute('aria-label', 'Image 1 of 3');
    await expect(viewport).toHaveAttribute('data-overflow-start');
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => viewport.evaluate(el => el.scrollLeft)).toBe(0);
    await expect(page.locator('.native-slideshow__indicators')).toHaveAttribute('aria-label', 'Image 1 of 3');
    await expect(viewport).not.toHaveAttribute('data-overflow-start');
    await viewport.evaluate(el => { el.scrollLeft = el.scrollWidth; });
    await expect(viewport).not.toHaveAttribute('data-overflow-end');
    await expect(page.locator('.native-slideshow__indicators')).toHaveAttribute('aria-label', 'Image 3 of 3');
    await expect(page.locator('.native-slideshow__count')).toHaveCount(0);
    await expect(page.locator('.native-slideshow__indicators')).toHaveCSS('padding-left', '20px');
    expect(await page.locator('.native-slideshow__dot[data-active="true"]').evaluate(el => getComputedStyle(el).backgroundColor === getComputedStyle(el.parentElement!.parentElement!).color)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('height-capped article images keep their visible corners inside the rounded element', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 600 });
  await fixture(page);
  const picture = page.getByRole('img', { name: 'Height capped image' });
  await picture.scrollIntoViewIfNeeded();
  await expect.poll(() => picture.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const size = await picture.evaluate(el => {
    const img = el as HTMLImageElement;
    const rect = img.getBoundingClientRect();
    return { ratio: rect.width / rect.height, naturalRatio: img.naturalWidth / img.naturalHeight, height: rect.height };
  });
  expect(size.ratio).toBeCloseTo(size.naturalRatio, 2);
  expect(size.height).toBeLessThanOrEqual(420);
  expect(await picture.evaluate(el => Math.abs(el.getBoundingClientRect().left - el.closest('figure')!.getBoundingClientRect().left))).toBeLessThan(1);
  await expect(picture).toHaveCSS('border-top-left-radius', '28px');
  await expect(page.locator('.wp-block-video video')).toHaveCSS('border-top-left-radius', '28px');
  for (const compact of [false, true]) {
    await page.evaluate(compact => document.body.classList.toggle('post-reading-compact', compact), compact);
    await expect(picture).toHaveCSS('border-top-left-radius', '28px');
    await expect(page.locator('.native-slideshow__img').first()).toHaveCSS('border-top-left-radius', '28px');
    await expect(page.locator('.native-slideshow__slide').first()).toHaveCSS('border-top-left-radius', '28px');
  }
});
