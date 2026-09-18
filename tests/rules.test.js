import test from 'node:test';
import assert from 'node:assert/strict';
import { segmentCircle, Pool } from '../src/utils/math.js';
import { ScoreSystem, MODES, difficulty, comboLabel } from '../src/systems/rules.js';
test('fast swipe intersects fruit even when both endpoints miss', () => {
  assert.equal(segmentCircle({ x: 0, y: 50 }, { x: 1000, y: 50 }, { x: 500, y: 50 }, 25), true);
  assert.equal(segmentCircle({ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 500, y: 50 }, 25), false);
});
test('collision covers tangents, zero-length segments and endpoints', () => {
  assert.equal(segmentCircle({ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 20 }, 20), true);
  assert.equal(segmentCircle({ x: 5, y: 5 }, { x: 5, y: 5 }, { x: 5, y: 5 }, 2), true);
  assert.equal(segmentCircle({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 30, y: 0 }, 5), false);
});
test('classic ends on third miss and bomb', () => {
  const s = new ScoreSystem('classic');
  assert.equal(s.miss(), false);
  assert.equal(s.miss(), false);
  assert.equal(s.miss(), true);
  assert.equal(s.bomb(), true);
});
test('time attack has no miss penalty, loses ten points and clamps score', () => {
  const s = new ScoreSystem('time');
  s.fruit(3, 1);
  assert.equal(s.bomb(), false);
  assert.equal(s.score, 0);
  for (let i = 0; i < 10; i++) assert.equal(s.miss(), false);
  assert.equal(s.misses, 0);
  s.fruit(10, 2);
  s.fruit(10, 3);
  s.bomb();
  assert.equal(s.score, 10);
});
test('zen is bomb-free with larger waves and a ninety-second clock', () => {
  assert.equal(MODES.zen.duration, 90);
  assert.equal(MODES.zen.bombs, false);
  assert.equal(difficulty(100, 'zen').bombChance, 0);
  assert.equal(difficulty(0, 'zen').wave, 6);
});
test('scoring tracks rare, golden, longest combo and accuracy', () => {
  const s = new ScoreSystem('classic');
  s.launched = 4;
  s.fruit(1, 1);
  s.fruit(3, 2);
  s.fruit(10, 3);
  assert.equal(s.score, 14);
  assert.equal(s.longest, 3);
  assert.equal(s.accuracy, 75);
  assert.equal(comboLabel(2), 'NICE SLICE!');
  assert.equal(comboLabel(5), 'MEGA SLICE!');
});
test('difficulty increases throughout endless play', () => {
  const a = difficulty(0, 'classic'),
    b = difficulty(100, 'classic');
  assert.ok(b.speed > a.speed);
  assert.ok(b.wave > a.wave);
  assert.ok(b.gap < a.gap);
  assert.ok(b.bombChance > a.bombChance);
});
test('bounded pools safely exhaust and reuse released objects', () => {
  const p = new Pool(() => ({ active: false }), 2);
  const a = p.take();
  a.active = true;
  const b = p.take();
  b.active = true;
  assert.equal(p.take(), undefined);
  a.active = false;
  assert.equal(p.take(), a);
  p.clear();
  assert.ok(p.items.every((x) => !x.active));
});
