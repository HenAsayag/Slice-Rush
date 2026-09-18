import { FRUITS } from '../assets/fruits.js';
import { difficulty, MODES } from './rules.js';
import { launchPlan } from './trajectory.js';
import { rand } from '../utils/math.js';
export class Spawner {
  constructor(scene) {
    this.scene = scene;
    this.reset();
  }
  reset() {
    this.wait = 0.18;
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
    if (this.wait <= 0) {
      const d = difficulty(m.elapsed, m.mode);
      this.wait = d.gap * rand(0.94, 1.06);
      const count = d.wave + Math.floor(rand(0, 2));
      for (let i = 0; i < count && this.pending.length < 48; i++) {
        let spec = FRUITS[Math.floor(rand(0, 9))];
        if (Math.random() < (m.mode === 'unlimited' ? 0.055 : 0.035)) spec = FRUITS[9];
        this.pending.push({
          spec,
          delay: i * (compact ? 0.065 : 0.045),
          index: this.sequence++,
          speed: d.speed,
        });
      }
      if (MODES[m.mode].bombs && Math.random() < d.bombChance)
        this.pending.push({
          spec: { name: 'bomb', r: 35 },
          delay: count * 0.07,
          index: this.sequence++,
          speed: d.speed,
        });
    }
    let active = s.fruits.items.reduce((n, f) => n + Number(f.active), 0);
    for (let i = this.pending.length - 1; i >= 0; i--) {
      const item = this.pending[i];
      item.delay -= dt;
      if (item.delay > 0) continue;
      this.pending.splice(i, 1);
      if (active >= maxActive) continue;
      const fruit = s.fruits.take();
      if (!fruit) continue;
      const p = launchPlan(w, h, item.index, item.speed);
      fruit.launch(item.spec, p.x, p.y, p.vx, p.vy, { gravity: p.gravity });
      active++;
      if (!fruit.bomb) m.score.launched++;
    }
  }
}
