import Phaser from 'phaser';
import { isLandscape } from '../ui/LandscapeController.js';
import { registerAssets, FRUITS } from '../assets/fruits.js';
import { Fruit } from '../entities/Fruit.js';
import { Pool, rand } from '../utils/math.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { SliceSystem, SwipeTrail } from '../systems/SwipeTrail.js';
import { Spawner } from '../systems/Spawner.js';
import { comboLabel, MODES } from '../systems/rules.js';
export class MarketScene extends Phaser.Scene {
  constructor(manager) {
    super('market');
    this.manager = manager;
  }
  create() {
    registerAssets(this);
    this.fruits = new Pool(() => new Fruit(this), 64);
    this.halves = new Pool(() => new Fruit(this), 100);
    this.effects = new ParticleSystem(this);
    this.trail = new SwipeTrail(this);
    this.slicer = new SliceSystem(this, this.game.canvas);
    this.spawner = new Spawner(this);
    this.ambient = this.add.graphics().setDepth(-1);
    this.fireflies = Array.from({ length: 24 }, () => ({
      x: Math.random(),
      y: Math.random(),
      phase: rand(0, 7),
    }));
    this.slow = 0;
    this.manager.ready(this);
    this.viewport = { width: this.scale.width, height: this.scale.height };
    this.scale.on('resize', () => {
      const { width, height } = this.scale,
        previous = this.viewport;
      const rotated = Math.abs(width - previous.width) > 16;
      const largeChange = Math.abs(height - previous.height) > Math.max(100, previous.height * 0.2);
      for (const f of [...this.fruits.items, ...this.halves.items])
        if (f.active) {
          f.x *= width / previous.width;
          f.y *= height / previous.height;
          f.vx *= width / previous.width;
          f.vy *= height / previous.height;
          f.gravity *= height / previous.height;
          f.render();
        }
      this.viewport = { width, height };
      this.trail.clear();
      this.slicer.reset();
      if ((rotated || largeChange) && this.manager.state === 'playing') this.manager.pause();
    });
  }

  begin() {
    for (const f of [...this.fruits.items, ...this.halves.items]) f.release();
    this.effects.clear();
    this.trail.clear();
    this.slicer.reset();
    this.spawner.reset();
    this.comboCooldown = 0;
    this.slow = 0;
  }
  slice(f, combo, angle) {
    const m = this.manager,
      x = f.x,
      y = f.y;
    if (f.bomb) {
      this.effects.burst(x, y, 0xffa341, true);
      this.effects.popup(x, y - 30, m.mode === 'time' ? '−10' : 'BOOM!', '#ff8a62', true);
      f.release();
      this.cameras.main.shake(300, 0.015);
      m.audio.play('bomb');
      m.audio.vibrate([80, 30, 100]);
      if (m.score.bomb()) m.end('A little too explosive.');
      m.updateHud();
      return;
    }
    m.score.fruit(f.spec.value, combo);
    m.audio.play('slice');
    m.audio.play('fruit_hit');
    if (combo === 1 || combo % 5 === 0) m.audio.vibrate(12);
    this.effects.burst(x, y, f.spec.juice, combo >= 3);
    this.effects.slash(x, y, angle, f.hitRadius * 2.8);
    this.effects.popup(x, y - 35, '+' + f.spec.value, f.spec.value === 10 ? '#ffe277' : '#fff8dd');
    for (const side of [-1, 1]) {
      const h = this.halves.take();
      if (!h) break;
      h.launch(f.spec, x + side * 18, y, f.vx + side * rand(115, 175), f.vy * 0.35 - rand(50, 100));
      h.sprite.setTexture(f.spec.name + (side < 0 ? '-left' : '-right'));
      h.angle = f.angle;
      h.spin = side * rand(2, 5);
      h.half = side;
    }
    f.release();
    this.cameras.main.shake(80, 0.002);
    if (combo >= 2 && m.elapsed >= this.comboCooldown && (combo <= 3 || combo % 5 === 0)) {
      this.comboCooldown = m.elapsed + 0.25;
      this.effects.popup(
        Math.max(110, Math.min(this.scale.width - 110, x)),
        Math.max(170, y - 85),
        comboLabel(combo),
        '#ffcb69',
        true,
      );
      m.audio.play('combo');
      if (combo >= 3 && m.mode !== 'unlimited') this.slow = 0.05;
    }
    m.updateHud();
  }
  update(time, delta) {
    if (!this.fruits) return;
    const real = Math.min(delta / 1000, 0.04),
      m = this.manager,
      w = this.scale.width,
      h = this.scale.height;
    if (!isLandscape()) {
      m.pause();
      m.audio.update(false);
      return;
    }
    this.ambient.clear();
    for (const f of this.fireflies) {
      const x = f.x * w + Math.sin(time * 0.00015 + f.phase) * 20,
        y = f.y * h * 0.8;
      this.ambient.fillStyle(0xffd083, 0.15 + Math.sin(time * 0.001 + f.phase) * 0.12);
      this.ambient.fillCircle(x, y, 2);
    }
    m.audio.update(m.state === 'playing' || m.state === 'menu');
    if (m.state === 'paused' || m.state === 'settings') return;
    this.trail.update(real);
    this.effects.update(real);
    if (m.state !== 'playing') {
      for (const f of this.halves.items)
        if (f.active) {
          f.update(real);
          if (f.y > h + 100) f.release();
        }
      return;
    }
    m.tick(Math.max(0, delta / 1000));
    if (m.state !== 'playing') return;
    const dt = real * (this.slow > 0 ? 0.18 : 1);
    this.slow -= real;
    this.spawner.update(real);
    for (const f of this.fruits.items) {
      if (!f.active) continue;
      f.update(dt);
      if (f.y < h - f.spec.r) f.entered = true;
      if (f.vy > 0 && f.y > h + 85) {
        if (!f.bomb) {
          if (MODES[m.mode].misses) m.audio.play('miss');
          if (m.score.miss()) m.end('Three slipped away.');
          m.updateHud();
        }
        f.release();
        if (m.state !== 'playing') break;
      }
    }
    for (const f of this.halves.items) {
      if (!f.active) continue;
      f.update(dt);
      if (f.y > h + 100 || f.x < -150 || f.x > w + 150) f.release();
    }
  }
}
