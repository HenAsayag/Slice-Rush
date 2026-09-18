import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('test-results', { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://127.0.0.1:5173');
await page.waitForFunction(() => window.__SLICE_RUSH__?.manager.scene);
await page.locator('#play').click();
async function fixture(mode = 'classic', kind = 'orange', count = 1) {
  return page.evaluate(
    async ({ mode, kind, count }) => {
      const m = window.__SLICE_RUSH__.manager;
      const { FRUITS } = await import('/src/assets/fruits.js');
      m.mode = mode;
      m.start();
      m.scene.spawner.wait = 100;
      for (let i = 0; i < count; i++) {
        const f = m.scene.fruits.take();
        f.launch(
          kind === 'bomb' ? { name: 'bomb', r: 35 } : FRUITS.find((x) => x.name === kind),
          500 + i * 100,
          430,
          0,
          -20,
        );
        f.bomb = kind === 'bomb';
        if (!f.bomb) m.score.launched++;
      }
      return m.state;
    },
    { mode, kind, count },
  );
}
async function swipe(x1 = 400, y1 = 430, x2 = 1000, y2 = 430) {
  await page.mouse.move(x1, y1);
  await page.mouse.down();
  await page.mouse.move(x2, y2);
  await page.mouse.up();
}
const state = () =>
  page.evaluate(() => {
    const m = window.__SLICE_RUSH__.manager;
    return {
      state: m.state,
      score: m.score.score,
      sliced: m.score.sliced,
      longest: m.score.longest,
      misses: m.score.misses,
      elapsed: m.elapsed,
      halves: m.scene.halves.items.filter((f) => f.active).length,
    };
  });
await fixture('classic', 'orange', 5);
await swipe();
let s = await state();
assert.equal(s.score, 5);
assert.equal(s.longest, 5);
assert.equal(s.halves, 10);
console.log('PASS full-path swipe, five-fruit combo, physics halves');
await page.locator('#pause').click();
let paused = await state();
await page.waitForTimeout(250);
assert.equal((await state()).elapsed, paused.elapsed);
await page.locator('#resume').click();
assert.equal((await state()).state, 'playing');
console.log('PASS pause freezes simulation and resumes');
await fixture('classic', 'bomb');
await page.evaluate(() => (window.__SLICE_RUSH__.manager.score.score = 5));
await swipe();
assert.equal((await state()).state, 'ending');
await page.waitForTimeout(750);
assert.equal((await state()).state, 'results');
await page.screenshot({ path: 'test-results/results-desktop.png' });
console.log('PASS classic bomb ends run with results');
await fixture('time', 'bomb');
await page.evaluate(() => (window.__SLICE_RUSH__.manager.score.score = 25));
await swipe();
assert.equal((await state()).score, 15);
assert.equal((await state()).state, 'playing');
console.log('PASS time-attack bomb deducts ten');
await fixture('classic', 'orange', 3);
await page.evaluate(() => {
  const m = window.__SLICE_RUSH__.manager;
  for (const f of m.scene.fruits.items)
    if (f.active) {
      f.y = m.scene.scale.height + 200;
      f.vy = 200;
    }
});
await page.waitForTimeout(100);
assert.equal((await state()).misses, 3);
assert.equal((await state()).state, 'ending');
console.log('PASS three falling fruits end classic');
for (const mode of ['time', 'zen']) {
  await fixture(mode);
  await page.evaluate(() => {
    const m = window.__SLICE_RUSH__.manager;
    m.elapsed = m.mode === 'zen' ? 89.99 : 59.99;
  });
  await page.waitForTimeout(100);
  assert.equal((await state()).state, 'ending');
}
console.log('PASS 60- and 90-second timer endings');
await page.evaluate(() => window.__SLICE_RUSH__.manager.menu());
await page.locator('#settings-button').click();
await page.locator('[data-toggle="sound"]').click();
assert.equal(await page.locator('[data-toggle="sound"]').getAttribute('aria-checked'), 'false');
await page.locator('#settings-done').click();
await page.reload();
await page.waitForFunction(() => window.__SLICE_RUSH__?.manager.scene);
assert.equal(await page.evaluate(() => window.__SLICE_RUSH__.manager.audio.sound), false);
assert.ok((await page.evaluate(() => window.__SLICE_RUSH__.manager.bests.classic)) >= 5);
console.log('PASS settings and high scores persist');
await page.setViewportSize({ width: 390, height: 844 });
await fixture('zen', 'orange');
await page.evaluate(() => {
  const m = window.__SLICE_RUSH__.manager;
  for (const f of m.scene.fruits.items)
    if (f.active) {
      f.x = 195;
      f.y = 430;
    }
});
await page.waitForTimeout(50);
await page.evaluate(() => window.__SLICE_RUSH__.manager.resume());
const cdp = await page.context().newCDPSession(page);
await cdp.send('Input.dispatchTouchEvent', {
  type: 'touchStart',
  touchPoints: [{ x: 90, y: 430, id: 1 }],
});
await cdp.send('Input.dispatchTouchEvent', {
  type: 'touchStart',
  touchPoints: [
    { x: 90, y: 430, id: 1 },
    { x: 320, y: 250, id: 2 },
  ],
});
await cdp.send('Input.dispatchTouchEvent', {
  type: 'touchMove',
  touchPoints: [
    { x: 300, y: 430, id: 1 },
    { x: 320, y: 250, id: 2 },
  ],
});
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
assert.equal((await state()).sliced, 1);
console.log('PASS primary touch slicing with secondary touch ignored');
await page.route('**/assets/**/*.png', (route) => route.abort());
await page.setViewportSize({ width: 1440, height: 900 });
await page.reload();
await page.waitForFunction(() => window.__SLICE_RUSH__?.manager.scene);
await fixture('classic', 'orange');
await swipe();
assert.equal((await state()).sliced, 1);
assert.ok(
  await page.evaluate(
    () => window.__SLICE_RUSH__.manager.scene.textures.getPixelAlpha(80, 80, 'orange') > 0,
  ),
);
console.log('PASS missing PNG assets retain playable procedural textures');
assert.deepEqual(errors, []);
console.log('PASS no browser runtime errors');
await browser.close();
