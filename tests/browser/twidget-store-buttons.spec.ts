import { test, expect } from '@playwright/test';

test('Twidget store actions follow the flag and fit desktop and mobile cards', async ({ page, context, baseURL }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const override = async (value: boolean) => {
    await context.addCookies([
      { name: 'ff-projects-enabled', value: 'true', url: baseURL! },
      { name: 'ff-twidget-store-buttons-enabled', value: String(value), url: baseURL! },
    ]);
    await page.goto('/');
  };
  const card = page.locator('.project-app-card').filter({ has: page.getByRole('heading', { name: 'Twidget', exact: true }) });
  await override(false);
  await expect(card.getByRole('link', { name: 'Get Twidget on Google Play' })).toHaveCount(0);
  await expect(card.getByRole('link', { name: 'View Twidget releases' })).toBeVisible();

  await override(true);
  const play = card.getByRole('link', { name: 'Get Twidget on Google Play' });
  const github = card.getByRole('link', { name: 'View Twidget on GitHub' });
  await expect(play).toHaveAttribute('href', 'https://play.google.com/store/apps/details?id=com.tjg.twidget');
  await expect(github).toHaveAttribute('href', 'https://github.com/thatjoshguy67/twidget');
  await expect(card.getByRole('link', { name: 'View Twidget releases' })).toHaveCount(0);
  await expect(page.locator('.project-app-card-actions')).toHaveCount(1);

  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await card.scrollIntoViewIfNeeded();
    await expect(play).toBeVisible();
    await expect(github).toBeVisible();
    for (const link of [play, github]) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      await link.click({ trial: true });
      await page.mouse.move(0, 0);
      await expect(link).toHaveCSS('transform', /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
      const icon = link.locator('img');
      await expect.poll(() => icon.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      const iconBox = await icon.boundingBox();
      expect(iconBox!.width).toBeCloseTo(24, 0);
      expect(iconBox!.height).toBeCloseTo(24, 0);
    }
    // Measure in one frame: mobile scrollIntoView can still be settling.
    const [cardBox, playBox, githubBox] = await card.evaluate(element =>
      [element, ...element.querySelectorAll('.project-app-card-actions a')]
        .map(node => node.getBoundingClientRect().toJSON()),
    );
    expect(playBox.width).toBeCloseTo(44, 0);
    expect(playBox.height).toBeCloseTo(32, 0);
    expect(githubBox.y - (playBox.y + playBox.height)).toBeCloseTo(12, 0);
    expect(githubBox.x + githubBox.width).toBeLessThanOrEqual(cardBox.x + cardBox.width);
    expect(githubBox.y + githubBox.height).toBeLessThanOrEqual(cardBox.y + cardBox.height);
    await card.screenshot({ path: `/private/tmp/twidget-card-${width}.png` });
  }

  await page.goto('/settings/feature-flags');
  await expect(page.locator('#flag-toggle-twidget-store-buttons-enabled')).toBeChecked();
  expect(errors).toEqual([]);
});
