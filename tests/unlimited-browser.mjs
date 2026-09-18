import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('test-results', { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://127.0.0.1:5173');
await page.waitForFunction(() => window.__SLICE_RUSH__?.manager.scene);
assert.equal(await page.locator('[data-mode="unlimited"]').getAttribute('aria-pressed'), 'true');
for (const [width, height] of [
  [390, 844],
  [320, 568],
  [844, 390],
  [1440, 900],
]) {
  await page.setViewportSize({ width, height });
  await page.evaluate(() => window.__SLICE_RUSH__.manager.menu());
  await page.waitForTimeout(120);
  for (const selector of ['#fullscreen', '#play', '[data-mode="unlimited"]', '[data-mode="zen"]']) {
    const b = await page.locator(selector).boundingBox();
    assert.ok(b.x >= 0 && b.x + b.width <= width + 1, selector + ' width at ' + width);
    assert.ok(b.y >= 0 && b.y + b.height <= height + 1, selector + ' height at ' + height);
  }
  await page.screenshot({ path: `test-results/unlimited-menu-${width}.png` });
}
console.log('PASS four-mode menu fits phone, small phone, landscape and desktop');
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(150);
await page.locator('#play').click();
await page.waitForTimeout(1300);
assert.equal(await page.locator('#timer').textContent(), '∞');
const run = await page.evaluate(() => {
  const m = window.__SLICE_RUSH__.manager;
  let max = 0;
  for (let i = 0; i < 600; i++) {
    m.scene.update(i * 16.667, 16.667);
    max = Math.max(max, m.scene.fruits.items.filter((f) => f.active).length);
  }
  m.elapsed = 3600;
  m.tick(1);
  return {
    viewport: [m.scene.scale.width, m.scene.scale.height, window.innerWidth],
    state: m.state,
    launched: m.score.launched,
    misses: m.score.misses,
    max,
    bombs: m.scene.fruits.items.some((f) => f.active && f.bomb),
  };
});
assert.equal(run.state, 'playing');
assert.equal(run.misses, 0);
assert.equal(run.bombs, false);
assert.ok(run.launched >= 60);
assert.ok(run.max <= 24);
console.log('PASS endless mobile fruit stream:', run);
await page.screenshot({ path: 'test-results/unlimited-game-mobile.png' });
await page.setViewportSize({ width: 390, height: 794 });
await page.waitForTimeout(200);
assert.equal(await page.evaluate(() => window.__SLICE_RUSH__.manager.state), 'playing');
console.log('PASS mobile browser toolbar resize does not interrupt play');
const target = await page.evaluate(async () => {
  const m = window.__SLICE_RUSH__.manager;
  m.scene.begin();
  m.scene.spawner.wait = 100;
  const { FRUITS } = await import('/src/assets/fruits.js');
  m.scene.fruits.take().launch(FRUITS[1], 195, 450, 0, 0);
  m.score.launched++;
  return { x: 195, y: 450 };
});
const cdp = await page.context().newCDPSession(page);
await cdp.send('Input.dispatchTouchEvent', {
  type: 'touchStart',
  touchPoints: [{ x: 75, y: target.y, id: 1 }],
});
await cdp.send('Input.dispatchTouchEvent', {
  type: 'touchMove',
  touchPoints: [{ x: 320, y: target.y, id: 1 }],
});
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
assert.ok((await page.evaluate(() => window.__SLICE_RUSH__.manager.score.sliced)) > 0);
await page.locator('#pause').click();
assert.ok(await page.locator('#finish-run').isVisible());
await page.locator('#finish-run').click();
await page.waitForTimeout(800);
assert.ok(await page.locator('#results').isVisible());
assert.ok((await page.evaluate(() => window.__SLICE_RUSH__.manager.bests.unlimited)) > 0);
await page.reload();
await page.waitForFunction(() => window.__SLICE_RUSH__?.manager.scene);
assert.ok(Number(await page.locator('#menu-best').textContent()) > 0);
console.log('PASS touch slicing, finish run and persistent unlimited record');
assert.deepEqual(errors, []);
await browser.close();
