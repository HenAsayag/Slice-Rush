import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('test-results', { recursive: true });
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://127.0.0.1:5173');
await page.waitForFunction(() => window.__SLICE_RUSH__?.manager.scene);
await page.screenshot({ path: 'test-results/menu-desktop.png' });
const sprites = await page.evaluate(async () => {
  const { FRUITS, fruitCanvas, bombCanvas } = await import('/src/assets/fruits.js');
  return FRUITS.flatMap((f) =>
    [0, -1, 1].map((half) => ({
      path: `public/assets/fruits/${half ? 'halves/' : ''}${f.name}${half < 0 ? '-left' : half > 0 ? '-right' : ''}.png`,
      data: fruitCanvas(f, half).toDataURL().split(',')[1],
    })),
  ).concat([
    { path: 'public/assets/effects/bomb.png', data: bombCanvas().toDataURL().split(',')[1] },
  ]);
});
for (const s of sprites) await writeFile(s.path, Buffer.from(s.data, 'base64'));
await page.locator('#play').click();
await page.waitForTimeout(1200);
await page.screenshot({ path: 'test-results/game-desktop.png' });
console.log(
  'State',
  await page.evaluate(() => ({
    state: window.__SLICE_RUSH__.manager.state,
    fruits: window.__SLICE_RUSH__.manager.scene.fruits.items.filter((f) => f.active).length,
  })),
);
console.log('Errors', errors);
await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => window.__SLICE_RUSH__.manager.menu());
await page.screenshot({ path: 'test-results/menu-mobile.png' });
await browser.close();
