import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
await mkdir('test-results', { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 844, height: 390 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://127.0.0.1:5173');
await page.waitForFunction(() => window.__SLICE_RUSH__?.manager.scene);
const renderer = await page.evaluate(() => {
  const game = window.__SLICE_RUSH__.game;
  return {
    type: game.renderer.type,
    webgl: game.renderer.gl instanceof WebGLRenderingContext,
    contextLost: game.renderer.gl.isContextLost(),
  };
});
assert.equal(renderer.type, 2);
assert.equal(renderer.webgl, true);
assert.equal(renderer.contextLost, false);
console.log('PASS explicit WebGL renderer with a live GL context');
const bounds = await page.locator('#fullscreen').boundingBox();
assert.ok(bounds.height >= 44 && bounds.x + bounds.width <= 844);
await page.screenshot({ path: 'test-results/webgl-mobile-menu.png' });
await page.locator('#fullscreen').click();
await page.waitForFunction(() => document.fullscreenElement);
assert.equal(await page.locator('#fullscreen').getAttribute('aria-pressed'), 'true');
await page.locator('#fullscreen').click();
await page.waitForFunction(() => !document.fullscreenElement);
assert.equal(await page.locator('#fullscreen').getAttribute('aria-pressed'), 'false');
console.log('PASS native fullscreen enters and exits from the mobile button');
await page.evaluate(() => {
  document.documentElement.requestFullscreen = undefined;
  document.documentElement.webkitRequestFullscreen = undefined;
});
await page.locator('#fullscreen').click();
assert.equal(await page.locator('body').getAttribute('data-display-mode'), 'expanded');
await page.locator('#fullscreen').click();
assert.equal(await page.locator('body').getAttribute('data-display-mode'), 'windowed');
console.log('PASS expanded-view fallback without claiming native fullscreen');
await page.locator('#play').click();
await page.evaluate(() => {
  window.__testGLRecovery =
    window.__SLICE_RUSH__.game.renderer.gl.getExtension('WEBGL_lose_context');
  window.__testGLRecovery.loseContext();
});
await page.waitForFunction(() => window.__SLICE_RUSH__.manager.state === 'paused');
await page.evaluate(() => window.__testGLRecovery.restoreContext());
await page.waitForFunction(() => !window.__SLICE_RUSH__.game.renderer.gl.isContextLost());
await page.locator('#resume').click();
assert.equal(await page.evaluate(() => window.__SLICE_RUSH__.manager.state), 'playing');
console.log('PASS WebGL context loss safely pauses and restoration permits resume');
const unsupported = await browser.newPage();
await unsupported.addInitScript(() => {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...args) {
    return /webgl/.test(type) ? null : original.call(this, type, ...args);
  };
});
await unsupported.goto('http://127.0.0.1:5173');
await unsupported.locator('.graphics-error').waitFor();
assert.ok(await unsupported.locator('#play').isDisabled());
console.log('PASS unsupported WebGL shows an actionable message');
assert.deepEqual(errors, []);
await browser.close();
