import test from 'node:test';
import assert from 'node:assert/strict';
import { MODES, difficulty, ScoreSystem } from '../src/systems/rules.js';
import { launchPlan } from '../src/systems/trajectory.js';
import { Spawner } from '../src/systems/Spawner.js';
test('unlimited has no time limit, misses or bombs at any progression', () => {
  const mode = MODES.unlimited;
  assert.equal(mode.duration, Infinity);
  assert.equal(mode.bombs, false);
  const score = new ScoreSystem('unlimited');
  for (let i = 0; i < 1000; i++) assert.equal(score.miss(), false);
  assert.equal(score.misses, 0);
  for (const time of [0, 60, 3600, 86400]) {
    const d = difficulty(time, 'unlimited');
    assert.equal(d.bombChance, 0);
    assert.ok(d.wave >= 10 && d.wave <= 14);
    assert.ok(d.gap >= 0.45 && d.gap <= 0.72);
  }
});
test('faster trajectories stay below HUD and inside mobile viewport', () => {
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [844, 390],
    [1440, 900],
  ])
    for (let i = 0; i < 60; i++) {
      const p = launchPlan(width, height, i, 1.5, () => 0.5);
      const t = -p.vy / p.gravity;
      const apex = p.y + p.vy * t + 0.5 * p.gravity * t * t;
      assert.ok(Math.abs(apex - p.apexY) < 0.001);
      assert.ok(apex >= Math.min(height * 0.46, width < 600 || height < 500 ? 190 : 210) + 29);
      const end = p.x + p.vx * t * 2;
      assert.ok(end >= 40 && end <= width - 40);
    }
  const slow = launchPlan(390, 844, 0, 1, () => 0.5),
    fast = launchPlan(390, 844, 0, 1.5, () => 0.5);
  assert.equal(slow.apexY, fast.apexY);
  assert.ok(-fast.vy / fast.gravity < -slow.vy / slow.gravity);
});
test('dense unlimited spawner stays bounded and reuses slots during a long run', () => {
  let launched = 0,
    max = 0;
  const fruits = Array.from({ length: 64 }, () => ({
    active: false,
    launch(spec) {
      this.active = true;
      this.bomb = spec.name === 'bomb';
      this.life = 1.6;
      launched++;
    },
  }));
  const scene = {
    scale: { width: 390, height: 844 },
    manager: { mode: 'unlimited', elapsed: 0, score: { launched: 0 } },
    fruits: { items: fruits, take: () => fruits.find((f) => !f.active) },
  };
  const spawner = new Spawner(scene);
  for (let frame = 0; frame < 60 * 180; frame++) {
    scene.manager.elapsed += 1 / 60;
    for (const fruit of fruits)
      if (fruit.active && (fruit.life -= 1 / 60) <= 0) fruit.active = false;
    spawner.update(1 / 60);
    max = Math.max(max, fruits.filter((f) => f.active).length);
    assert.ok(spawner.pending.length <= 48);
    assert.ok(!fruits.some((f) => f.bomb));
  }
  assert.ok(launched > 1000);
  assert.ok(max >= 18 && max <= 24);
  spawner.reset();
  assert.equal(spawner.pending.length, 0);
});
