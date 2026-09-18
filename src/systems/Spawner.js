import { FRUITS } from '../assets/fruits.js';
import { difficulty } from './rules.js';
import { rand } from '../utils/math.js';
export class Spawner {
  constructor(scene) {
    this.scene = scene;
    this.wait = 0.5;
  }
  update(dt) {
    this.wait -= dt;
    if (this.wait > 0) return;
    const s = this.scene,
      m = s.manager,
      d = difficulty(m.elapsed, m.mode);
    this.wait = d.gap * rand(0.85, 1.15);
    const count = Math.max(2, Math.floor(d.wave + rand(0, 2))),
      w = s.scale.width,
      h = s.scale.height;
    const center = rand(w * 0.28, w * 0.72);
    const peak = h * (w < 600 ? 0.56 : 0.62);
    const speed = Math.sqrt(2 * 720 * peak) * d.speed;
    for (let i = 0; i < count; i++) {
      const fruit = s.fruits.take();
      if (!fruit) break;
      let spec = FRUITS[Math.floor(rand(0, 9))];
      if (Math.random() < 0.035) spec = FRUITS[9];
      const x = Math.max(
        75,
        Math.min(w - 75, center + (i - (count - 1) / 2) * (w < 600 ? 68 : 112)),
      );
      const trick = m.mode === 'classic' && m.elapsed >= 90 && i % 3 === 0;
      const launchX = trick ? (i % 2 ? w * 0.85 : w * 0.15) : x;
      const horizontal = trick ? (w / 2 - launchX) * 0.7 : rand(-70, 70) + (w / 2 - x) * 0.18;
      fruit.launch(
        spec,
        launchX,
        h + 65 + rand(0, 35),
        horizontal,
        -speed * (trick ? 0.84 : rand(0.94, 1.08)),
      );
      m.score.launched++;
    }
    if (Math.random() < d.bombChance) {
      const bomb = s.fruits.take();
      if (bomb) {
        bomb.launch(
          { name: 'bomb', r: 35 },
          rand(w * 0.18, w * 0.82),
          h + 65,
          rand(-90, 90),
          -speed * 0.99,
        );
        bomb.bomb = true;
      }
    }
  }
}
