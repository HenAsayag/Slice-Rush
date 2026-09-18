import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const url = process.env.SLICE_RUSH_URL || 'http://127.0.0.1:4173/Slice-Rush/';
await mkdir('test-results', { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [],
  badResponses = [],
  assets = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('response', (r) => {
  if (r.status() >= 400) badResponses.push({ url: r.url(), status: r.status() });
  if (r.url().includes('/assets/')) assets.push(r.url());
});
const response = await page.goto(url);
assert.equal(response.status(), 200);
await page.waitForFunction(() => !document.querySelector('#play')?.disabled);
await page.waitForFunction(() =>
  [...document.images].every((i) => i.complete && i.naturalWidth > 0),
);
await page.locator('[data-mode="unlimited"]').click();
await page.locator('#play').click();
await page.waitForTimeout(1400);
assert.ok(await page.locator('#hud').isVisible());
assert.equal(await page.locator('#timer').textContent(), '∞');
assert.ok(
  await page.evaluate(
    () =>
      document.querySelector('#game canvas').getContext('webgl') instanceof WebGLRenderingContext,
  ),
);
await page.mouse.move(20, 550);
await page.mouse.down();
await page.mouse.move(370, 550, { steps: 8 });
await page.mouse.up();
await page.screenshot({ path: 'test-results/pages-game.png' });
assert.ok(
  assets.some((u) => u.includes('/Slice-Rush/assets/fruits/fruit-atlas.png')),
  'detailed atlas must load below the project path',
);
assert.ok(
  assets.some((u) => u.includes('/Slice-Rush/assets/background/night-market.png')),
  'background must load below the project path',
);
assert.deepEqual(badResponses, []);
assert.deepEqual(errors, []);
assert.ok(await page.locator('#fullscreen').isVisible());
console.log(
  JSON.stringify({
    url,
    webgl: true,
    gameplayStarted: true,
    assetRequests: assets.length,
    errors,
    badResponses,
  }),
);
await browser.close();
