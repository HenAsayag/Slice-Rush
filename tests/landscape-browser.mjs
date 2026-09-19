import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:5173');
  await page.waitForFunction(() => window.__SLICE_RUSH__?.manager.scene);
  assert.equal(
    await page.locator('button[data-mode]').first().getAttribute('data-mode'),
    'classic',
  );
  assert.equal(await page.locator('[data-mode="classic"]').getAttribute('aria-pressed'), 'true');
  assert.ok(await page.locator('#orientation-gate').isVisible());
  assert.ok(await page.locator('#app').evaluate((el) => el.inert));
  await page.evaluate(() => window.__SLICE_RUSH__.manager.start());
  await page.keyboard.press('Space');
  assert.equal(await page.evaluate(() => window.__SLICE_RUSH__.manager.state), 'menu');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'orientation-fullscreen');
  await page.evaluate(() => {
    document.documentElement.requestFullscreen = undefined;
    document.documentElement.webkitRequestFullscreen = undefined;
  });
  await page.locator('#orientation-fullscreen').click();
  assert.ok(await page.locator('#orientation-gate').isVisible());
  assert.equal(await page.evaluate(() => window.__SLICE_RUSH__.manager.state), 'menu');
  await page.screenshot({ path: 'test-results/landscape-portrait-gate.png' });
  for (const [width, height] of [
    [568, 320],
    [844, 390],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width, height });
    await page.locator('#orientation-gate').waitFor({ state: 'hidden' });
    for (const selector of ['#play', '[data-mode="classic"]', '[data-mode="unlimited"]']) {
      const b = await page.locator(selector).boundingBox();
      assert.ok(
        b.x >= 0 && b.y >= 0 && b.x + b.width <= width + 1 && b.y + b.height <= height + 1,
        `${selector} fits ${width}x${height}: ${JSON.stringify(b)}`,
      );
    }
  }
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(150);
  await page.locator('#play').click();
  assert.equal(await page.locator('#mode-name').textContent(), 'CLASSIC');
  await page.evaluate(() => {
    const m = window.__SLICE_RUSH__.manager;
    m.scene.spawner.wait = 999;
    m.scene.spawner.pending = [];
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#orientation-gate').waitFor({ state: 'visible' });
  const snapshot = () =>
    page.evaluate(() => {
      const m = window.__SLICE_RUSH__.manager;
      return { state: m.state, elapsed: m.elapsed, score: m.score.score, misses: m.score.misses };
    });
  const paused = await snapshot();
  assert.equal(paused.state, 'paused');
  await page.keyboard.press('p');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Space');
  await page.evaluate(() => window.__SLICE_RUSH__.manager.resume());
  await page.waitForTimeout(400);
  assert.deepEqual(await snapshot(), paused);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.locator('#orientation-gate').waitFor({ state: 'hidden' });
  assert.equal((await snapshot()).state, 'paused');
  await page.locator('#resume').click();
  assert.equal((await snapshot()).state, 'playing');
  await page.screenshot({ path: 'test-results/landscape-game.png' });
  assert.deepEqual(errors, []);
  console.log(
    'PASS Classic first/default, portrait gate, keyboard blocking, fullscreen fallback, landscape layouts, rotation pause and explicit resume',
  );
} finally {
  await browser.close();
}
