import { test, expect, type Page } from '@playwright/test';
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
let fixture: string;
let fixtureStyles: string;
test.beforeAll(async () => {
 const result = await build({ entryPoints: ['tests/browser/fixtures/controls.tsx'], bundle: true, write: false, outdir: 'browser-fixture', jsx: 'automatic', platform: 'browser',
   define: { 'process.env.NODE_ENV': '"production"' },
   alias: Object.fromEntries(['navigation', 'image', 'dynamic', 'link'].map(name => [`next/${name}`, path.resolve(`tests/browser/fixtures/${name}.${name === 'navigation' ? 'ts' : 'tsx'}`)])),
 });
 fixture = result.outputFiles.find(file => file.path.endsWith('.js'))!.text;
 fixtureStyles = result.outputFiles.find(file => file.path.endsWith('.css'))?.text ?? '';
});
async function controls(page: Page) {
 await page.route('**/__audit_fixture', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="en" data-theme="light" data-accent="blue"><head><title>Controls test</title></head><body><div id="fixture"></div></body></html>' }));
 await page.goto('/__audit_fixture');
 for (const file of ['app/styles/shared.css','app/styles/ui-components.css','app/blog/blog.css']) await page.addStyleTag({ content: fs.readFileSync(file, 'utf8') });
 if (fixtureStyles) await page.addStyleTag({ content: fixtureStyles });
 await page.addScriptTag({ content: fixture });
 await expect(page.getByRole('button', { name: 'Expand image: Landscape preview' })).toBeVisible();
}
test('article lightbox supports keyboard, traps focus, restores focus and cleans up', async ({page}) => {
 await page.setViewportSize({width:390,height:844});
 await controls(page);
 const image = page.getByRole('button', { name: 'Expand image: Landscape preview' });
 await image.focus(); await page.keyboard.press('Enter');
 const dialog = page.getByRole('dialog', { name: 'Image viewer' }); await expect(dialog).toBeVisible();
 expect(await dialog.evaluate(el => { const rect=el.getBoundingClientRect(); return rect.width <= innerWidth && rect.height <= innerHeight; })).toBe(true);
 await expect(page.getByRole('button', { name: 'Close image viewer' })).toBeFocused();
 for(let i=0;i<6;i++) { await page.keyboard.press('Tab'); expect(await page.evaluate(() => Boolean(document.activeElement?.closest('dialog')))).toBe(true); }
 await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(image).toBeFocused();
 expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('');
 await image.press('Space'); await expect(dialog).toBeVisible();
 await page.evaluate(() => (document.querySelector('main button') as HTMLButtonElement).click());
 expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('');
});
test('interactive images have compatible accessible names and roles', async ({page}) => {
 await controls(page);
 await page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
 const violations = await page.evaluate(async () => {
   const engine = (window as unknown as { axe: { run: (node: Document, options: unknown) => Promise<{ violations: unknown[] }> } }).axe;
   return (await engine.run(document, { runOnly: ['presentation-role-conflict', 'image-alt', 'button-name'] })).violations;
 });
 expect(violations).toEqual([]);
});
test('developer Edit links use the document ID from the loaded post', async ({ page, context, baseURL }) => {
 await context.addCookies([{ name: 'ff-blog-enabled', value: 'true', url: baseURL! }]);
 const response = await page.request.get('/api/blog/posts?q=One%20UI%20Design%20Kit');
 expect(response.ok()).toBe(true);
 const { posts }: { posts: Array<{ id: string; slug: string }> } = await response.json();
 const post = posts.find(post => post.slug === 'oneui-design-kit');
 expect(post).toBeDefined();
 expect(post!.id).not.toBe(post!.slug);

 await page.goto(`/blog/${post!.slug}`);
 await page.getByRole('button', { name: 'More post options' }).click();
 const edit = page.getByRole('menuitem', { name: 'Edit', exact: true });
 await expect(edit).toHaveCount(0);
 await page.evaluate(() => {
   localStorage.setItem('developer-options-enabled', 'true');
   window.dispatchEvent(new Event('developer-options-changed'));
 });
 await expect(edit).toHaveAttribute('href', `https://admin.tjg.gg/content/posts/${encodeURIComponent(post!.id)}`);
});
test('comparison responds to arrow keys and exposes its value', async ({page}) => {
 await controls(page); const range = page.getByRole('slider', { name: 'Image comparison position' });
 await range.scrollIntoViewIfNeeded(); await range.focus(); await page.keyboard.press('ArrowRight');
 await expect(range).toHaveValue('51'); await expect(range).toHaveAttribute('aria-valuetext','51% before image');
});
test('server search cancels stale results and supports retry', async ({page}) => {
 await controls(page);
 const summary = (name: string) => ({ id:name, slug:name, date:'2026-01-01', title:{rendered:name}, excerpt:{rendered:'Result'}, categories:[],tags:[],featuredImageUrl:null });
 await page.route('**/api/blog/posts?*', async route => {
  const q = new URL(route.request().url()).searchParams.get('q');
  if(q==='fail') return route.fulfill({status:503,json:{error:'Unavailable'}});
  if(q==='old') await new Promise(resolve=>setTimeout(resolve,700));
  await route.fulfill({json:{posts:[summary(q || 'all')],hasMore:false}}).catch(()=>{});
 });
 const input=page.getByRole('textbox',{name:'Search blog'});
 await input.fill('old'); await page.waitForTimeout(300); await input.fill('new');
 await expect(page.locator('.body-text-blog-title')).toHaveText('new'); await page.waitForTimeout(800);
 await expect(page.locator('.body-text-blog-title')).toHaveText('new');
 await input.fill('fail'); await expect(page.getByRole('button',{name:'Retry search'})).toBeVisible();
});
test('shared preferences survive denied storage and mobile navigation stays usable', async ({page}) => {
 const errors: string[]=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(() => { for(const key of ['localStorage','sessionStorage']) Object.defineProperty(window,key,{get(){throw new DOMException('Denied','SecurityError');},configurable:true}); });
 await page.setViewportSize({width:390,height:844}); await page.goto('/settings');
 await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
 expect(errors).toEqual([]); expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('blog route retains its stylesheet and responsive layouts on both editions', async ({page,context}) => {
 for(const edition of ['normal','college']) {
  await context.addCookies([{name:'ff-blog-content-edition',value:edition,url:'http://localhost:3100'}]);
  await page.goto('/blog', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(()=>Array.from(document.styleSheets).some(sheet=>{
   try {return Array.from(sheet.cssRules).some(rule=>rule.cssText.includes('.post-hero-card'));} catch{return false;}
  }))).toBe(true);
  await expect(page).toHaveTitle('Blog | That Josh Guy');
  if(await page.locator('.blog-index-card:visible').count()) {
    expect(await page.locator('.floating-search-anchor:visible').evaluate(el=>getComputedStyle(el).position)).toBe('fixed');
    expect(await page.locator('.blog-card-container').first().evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThan(150);
  }
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 }
});
test('every accent gives readable text on filled controls',async({page})=>{
 await page.goto('/settings');
 const ratios=await page.evaluate(()=>{
  function luminance(hex:string){const nums=hex.trim().replace('#','').match(/../g)!.map(n=>parseInt(n,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return nums[0]*.2126+nums[1]*.7152+nums[2]*.0722;}
  return ['blue','coral','mint','lilac','mono'].map(accent=>{document.documentElement.dataset.accent=accent;const bg=getComputedStyle(document.documentElement).getPropertyValue('--accent-control');return {accent,ratio:1.05/(luminance(bg)+.05)};});
 });
 for(const {accent,ratio} of ratios) expect(ratio,accent).toBeGreaterThanOrEqual(4.5);
});

test('smooth corners survive resizing and clean up when switched off', async ({page, context}) => {
 const errors: string[] = [];
 page.on('pageerror', error => errors.push(error.message));
 await context.addCookies([{name:'ff-corner-smoothing-enabled',value:'true',url:'http://localhost:3100'}]);
 await page.goto('/settings');
 const toggle = page.locator('#corner-smoothing-toggle');
 const panel = page.locator('.panel').first();
 await expect(toggle).toBeChecked();
 await expect(panel).not.toHaveCSS('clip-path', 'none');
 await page.setViewportSize({width:390,height:844});
 await expect(panel).not.toHaveCSS('clip-path', 'none');
 expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
 await toggle.focus();
 await page.keyboard.press('Space');
 await expect(toggle).not.toBeChecked();
 await expect(panel).toHaveCSS('clip-path', 'none');
 await page.keyboard.press('Space');
 await expect(toggle).toBeChecked();
 await expect(panel).not.toHaveCSS('clip-path', 'none');
 expect(errors).toEqual([]);
});
