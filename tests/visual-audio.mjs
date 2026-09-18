import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
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
await page.evaluate(() => window.__SLICE_RUSH__.manager.scene.artworkReady);
await page.screenshot({ path: 'test-results/upgraded-menu.png' });
await page.locator('#play').click();
await page.waitForTimeout(500);
const audio = await page.evaluate(async () => {
  const a = window.__SLICE_RUSH__.manager.audio;
  const meter = a.ctx.createAnalyser();
  meter.fftSize = 2048;
  a.musicBus.connect(meter);
  await new Promise((r) => setTimeout(r, 200));
  const data = new Float32Array(2048);
  meter.getFloatTimeDomainData(data);
  a.musicBus.disconnect(meter);
  return {
    music: a.music,
    beats: a.beat,
    bus: a.musicBus.gain.value,
    rms: Math.sqrt(data.reduce((n, x) => n + x * x, 0) / data.length),
    state: a.ctx.state,
  };
});
assert.equal(audio.music, true);
assert.equal(audio.state, 'running');
assert.ok(audio.beats > 0);
assert.ok(audio.rms > 0.0001);
console.log('PASS music defaults on and produces audio:', audio);
await page.locator('#music').click();
await page.waitForTimeout(300);
assert.equal(await page.evaluate(() => window.__SLICE_RUSH__.manager.audio.music), false);
assert.ok(
  (await page.evaluate(() => window.__SLICE_RUSH__.manager.audio.musicBus.gain.value)) < 0.005,
);
await page.locator('#music').click();
console.log('PASS independent music button mutes and resumes');
const metrics = await page.evaluate(async () => {
  const m = window.__SLICE_RUSH__.manager;
  const { FRUITS } = await import('/src/assets/fruits.js');
  m.scene.begin();
  m.state = 'paused';
  for (let i = 0; i < 9; i++) {
    const f = m.scene.fruits.take();
    f.launch(FRUITS[i], 330 + (i % 5) * 195, i < 5 ? 380 : 610, 0, 0);
    f.angle = 0;
    f.render();
  }
  return m.scene.fruits.items
    .filter((f) => f.active)
    .map((f) => ({ name: f.spec.name, radius: f.hitRadius, size: f.sprite.displayWidth }));
});
assert.ok(metrics.find((f) => f.name === 'orange').radius > 50);
await page.screenshot({ path: 'test-results/upgraded-fruits.png' });
console.log('PASS enlarged artwork and hitboxes', metrics);
const knife = await page.evaluate(async () => {
  const a = window.__SLICE_RUSH__.manager.audio;
  a.music = false;
  a.syncMusic();
  const meter = a.ctx.createAnalyser();
  meter.fftSize = 2048;
  a.effectsBus.connect(meter);
  a.play('slice');
  await new Promise((r) => setTimeout(r, 30));
  const values = new Float32Array(2048);
  meter.getFloatTimeDomainData(values);
  a.effectsBus.disconnect(meter);
  return Math.sqrt(values.reduce((n, x) => n + x * x, 0) / values.length);
});
assert.ok(knife > 0.0001);
console.log('PASS knife effect produces audio:', knife);
await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => {
  const m = window.__SLICE_RUSH__.manager;
  m.menu();
});
await page.waitForTimeout(100);
await page.screenshot({ path: 'test-results/upgraded-mobile.png' });
assert.ok(await page.locator('#music').isVisible());
assert.deepEqual(errors, []);
console.log('PASS no browser errors');
await browser.close();
