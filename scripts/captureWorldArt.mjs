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
    await page.locator('[data-world-id]').first().waitFor({ timeout: 20000 });
    await page.locator('[data-world-id] img').first().evaluate(async (img) => {
      await img.decode().catch(() => undefined);
    });

    const coverGeometry = await page.locator('[data-world-id]').first().evaluate(
      (el) => ({
        ratio: el.getBoundingClientRect().width / el.getBoundingClientRect().height,
        width: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
      }),
    );
    if (Math.abs(coverGeometry.ratio - 16 / 9) > 0.05) {
      throw new Error(`Cover aspect ratio incorrect at ${width}px: ${coverGeometry.ratio}`);
    }
    if (coverGeometry.documentWidth > coverGeometry.width + 1) {
      throw new Error(`Horizontal overflow at ${width}px: ${JSON.stringify(coverGeometry)}`);
    }
    await page.screenshot({
      path: resolve(out, `tonight-${width}.png`),
      fullPage: true,
      animations: 'disabled',
    });

    for (const id of ids) {
      const card = page.locator(`[data-world-id="${id}"]`).first();
      if (!(await card.count())) {
        console.log(`No represented ${id} in template at ${width}px`);
        continue;
      }
      await card.click();
      const hero = page.locator(`[data-world-hero="${id}"]`);
      await hero.waitFor({ state: 'visible', timeout: 10000 });
      const image = hero.locator('img[src$="/hero.webp"]');
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
      const contentVisible = (await page.locator('[aria-label="All sagas"] h3').count())
        + (await page.locator('[aria-label="Other films"] button').count())
        + (await page.locator('[aria-label="Shorts & specials"] button').count())
        + (await page.locator('[aria-label="TV series"] button').count());
      if (!contentVisible) throw new Error(`No directly browsable content in ${id}`);
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
