import { FRUITS } from '../assets/fruits.js';
import { difficulty, MODES } from './rules.js';
import { launchPlan } from './trajectory.js';
export class Spawner {
  constructor(scene, random = Math.random) {
    this.scene = scene;
    this.random = random;
    this.reset();
  }
  reset() {
    this.wait = 0.18;
    this.launchWait = 0;
    this.pending = [];
    this.sequence = 0;
  }
  update(dt) {
    const s = this.scene,
      m = s.manager,
      w = s.scale.width,
      h = s.scale.height;
    const compact = w < 600 || h < 500;
    const maxActive = m.mode === 'unlimited' ? (compact ? 24 : 44) : compact ? 18 : 32;
    this.wait -= dt;
    this.launchWait -= dt;
    // Refill only after the previous wave has launched, so waves cannot overlap.
    if (this.wait <= 0 && this.pending.length === 0) {
      const d = difficulty(m.elapsed, m.mode);
      this.wait = d.gap * (0.94 + this.random() * 0.12);
      const count = d.wave + Math.floor(this.random() * 2);
      for (let i = 0; i < count; i++) {
        let spec = FRUITS[Math.floor(this.random() * 9)];
        if (this.random() < (m.mode === 'unlimited' ? 0.055 : 0.035)) spec = FRUITS[9];
        this.pending.push({ spec, index: this.sequence++, speed: d.speed });
      }
      if (MODES[m.mode].bombs && this.random() < d.bombChance)
        this.pending.push({
          spec: { name: 'bomb', r: 35 },
          index: this.sequence++,
          speed: d.speed,
        });
    }
    if (this.launchWait > 0 || this.pending.length === 0) return;
    const active = s.fruits.items.reduce((n, f) => n + Number(f.active), 0);
    if (active >= maxActive) return;
    const fruit = s.fruits.take();
    if (!fruit) return;
    const item = this.pending.shift();
    const p = launchPlan(w, h, item.index, item.speed, this.random);
    fruit.launch(item.spec, p.x, p.y, p.vx, p.vy, { gravity: p.gravity });
    if (!fruit.bomb) m.score.launched++;
    const pace = Math.min(1, Math.max(0, m.elapsed) / 120);
    // Start a fresh gap after each launch, including after a slow frame or full pool.
    // Never catch up by releasing multiple fruit in the same frame.
    this.launchWait =
      m.mode === 'unlimited'
        ? 0.09 - pace * 0.02 + this.random() * 0.06
        : 0.14 + this.random() * 0.12;
  }
}
