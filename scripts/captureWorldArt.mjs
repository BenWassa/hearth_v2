// Read-only browser verification against the synthetic Hearth template.
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');

const origin = 'http://127.0.0.1:4173';
const out = resolve('world-art-browser-evidence');
const viewports = [320, 390, 448];
const ids = [
  'marvel',
  'dc',
  'pixar',
  'disney-animation',
  'dreamworks',
  'star-wars',
  'wizarding-world',
  'studio-ghibli',
];
// Launch Vite itself rather than `npm run preview`. Killing an npm wrapper
// leaves the spawned Vite server holding inherited pipes open on Linux CI.
const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '4173',
    '--strictPort',
  ],
  { stdio: 'pipe' },
);
let output = '';
server.stdout.on('data', (v) => { output += v.toString(); });
server.stderr.on('data', (v) => { output += v.toString(); });

const waitForServer = async () => {
  for (let attempt = 0; attempt < 70; attempt += 1) {
    if (server.exitCode !== null) throw new Error('Preview exited: ' + output);
    try {
      const response = await fetch(origin + '/?demo=1');
      if (response.ok) return;
    } catch {
      // Preview still initializing.
    }
    await delay(250);
  }
  throw new Error('Preview unavailable: ' + output);
};

await mkdir(out, { recursive: true });
let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  for (const width of viewports) {
    const context = await browser.newContext({
      viewport: { width, height: 844 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(origin + '/?demo=1&collectionsFixture=25', { waitUntil: 'domcontentloaded' });
    const cards = page.locator('[data-world-id]');
    await cards.first().waitFor({ timeout: 20000 });
    // Tonight World tiles are text-only: no artwork requests, at least 44px
    // tall, and no horizontal overflow.
    for (let index = 0; index < (await cards.count()); index += 1) {
      const card = cards.nth(index);
      await card.scrollIntoViewIfNeeded();
      if (await card.locator('img').count()) {
        throw new Error(`World tile ${index} loads an image at ${width}px`);
      }
      const height = await card.evaluate((el) => el.getBoundingClientRect().height);
      if (height < 44) throw new Error(`World tile ${index} under 44px at ${width}px`);
    }
    await cards.first().scrollIntoViewIfNeeded();
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    if (documentWidth > width + 1) {
      throw new Error(`Horizontal overflow at ${width}px: ${documentWidth}`);
    }
    await page.screenshot({
      path: resolve(out, `tonight-worlds-${width}.png`),
      animations: 'disabled',
    });
    // The Collections row: every saga plus the neutral All collections tile,
    // finite (no cloned cards) and scrolled into view for the capture.
    const rail = page.locator('section[aria-label="Collections"]');
    await rail.scrollIntoViewIfNeeded();
    const railCells = await rail.locator('li').count();
    const cardCount = await rail.locator('[data-saga-card]').count();
    const hasAllTile = (await rail.locator('[data-all-collections]').count()) > 0;
    if (railCells !== cardCount + (hasAllTile ? 1 : 0) || hasAllTile !== cardCount > 3) {
      throw new Error(`Collections rail has unexpected cells at ${width}px`);
    }
    if (hasAllTile && !(await rail.locator('li').last().locator('[data-all-collections]').count())) {
      throw new Error('All collections tile is not last in the rail');
    }
    await page.screenshot({
      path: resolve(out, `tonight-collections-row-${width}.png`),
      animations: 'disabled',
    });

    // The plain index opened from the final tile: no search, sort or count.
    if (hasAllTile) {
      const allTile = rail.locator('[data-all-collections]');
      await allTile.click();
      await page.locator('[aria-label="All sagas"]').waitFor();
      if (await page.locator('#saga-search, #saga-sort').count()) {
        throw new Error(`Index still has search or sort at ${width}px`);
      }
      await page.screenshot({
        path: resolve(out, `collections-index-${width}.png`),
        animations: 'disabled',
      });
      await page.keyboard.press('Escape');
      await page.locator('[aria-label="All sagas"]').waitFor({ state: 'detached' });
    }

    for (const id of ids) {
      const card = page.locator(`[data-world-id="${id}"]`).first();
      if (!(await card.count())) {
        console.log(`No represented ${id} in template at ${width}px`);
        continue;
      }
      await card.click();
      const hero = page.locator(`[data-world-hero="${id}"]`);
      await hero.waitFor({ state: 'visible', timeout: 10000 });
      const image = hero.locator('img[src$="/cover.webp"]');
      await image.evaluate(async (img) => {
        await img.decode().catch(() => undefined);
      });
      const valid = await image.evaluate((img) => img.naturalWidth > 0);
      if (!valid) throw new Error(`Hero failed to load: ${id}`);
      const title = await hero.locator('h1').evaluate((node) => {
        const bounds = node.getBoundingClientRect();
        return { text: node.textContent.trim(), height: bounds.height };
      });
      if (title.height < 20) {
        throw new Error(`World title not visibly readable: ${id} at ${width}px`);
      }
      const contentVisible = (await page.locator('[data-saga-shelf]').count())
        + (await page.locator('[aria-label="Other films"] button').count())
        + (await page.locator('[aria-label="Shorts & specials"] button').count())
        + (await page.locator('[aria-label="TV series"] button').count());
      if (!contentVisible) throw new Error(`No directly browsable content in ${id}`);
      const worldWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      if (worldWidth > width + 1) {
        throw new Error(`World page horizontally overflows: ${id} at ${width}px`);
      }
      await page.screenshot({
        path: resolve(out, `world-${id}-${width}.png`),
        animations: 'disabled',
      });
      await page.keyboard.press('Escape');
      await hero.waitFor({ state: 'detached', timeout: 10000 });
      const focusRestored = await card.evaluate((el) => document.activeElement === el);
      if (!focusRestored) throw new Error(`Focus not restored after ${id} at ${width}px`);
    }
    await context.close();
  }
  console.log('Saved Chromium captures to ' + out);
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  server.stdout.destroy();
  server.stderr.destroy();
}
