import { rand, Pool } from '../utils/math.js';
export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.compact = scene.scale.width < 600 || scene.scale.height < 500;
    this.graphics = scene.add.graphics().setDepth(5);
    this.particles = new Pool(() => ({ active: false }), this.compact ? 360 : 700);
    this.splats = new Pool(() => ({ active: false }), this.compact ? 48 : 110);
    this.slashes = new Pool(() => ({ active: false }), 24);
    this.popups = new Pool(
      () => ({
        active: false,
        text: scene.add
          .text(0, 0, '', {
            fontFamily: 'Arial Black, sans-serif',
            fontSize: 26,
            color: '#fff5ce',
            stroke: '#173632',
            strokeThickness: 5,
          })
          .setOrigin(0.5)
          .setDepth(12)
          .setVisible(false),
      }),
      24,
    );
  }
  burst(x, y, color, strong = false) {
    const crowded = this.scene.manager.mode === 'unlimited';
    const count = this.compact ? (crowded ? 12 : 20) : crowded ? 22 : strong ? 50 : 32;
    for (let i = 0; i < count; i++) {
      const p = this.particles.take();
      if (!p) break;
      const angle = rand(0, Math.PI * 2),
        speed = rand(100, strong ? 460 : 350);
      Object.assign(p, {
        active: true,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 100,
        life: rand(0.35, 0.95),
        r: rand(3, 9),
        pulp: i % 4 === 0,
        color,
      });
    }
    for (let i = 0; i < (this.compact ? 3 : 5); i++) {
      const s = this.splats.take();
      if (s)
        Object.assign(s, {
          active: true,
          x: x + rand(-65, 65),
          y: y + rand(-45, 45),
          r: rand(9, 29),
          life: 3.2,
          color,
        });
    }
  }
  slash(x, y, angle, length) {
    const s = this.slashes.take();
    if (s) Object.assign(s, { active: true, x, y, angle, length, life: 0.22 });
  }
  popup(x, y, label, color = '#fff5ce', large = false) {
    const p = this.popups.take();
    if (!p) return;
    Object.assign(p, { active: true, x, y, life: 1 });
    p.text
      .setText(label)
      .setColor(color)
      .setFontSize(large ? 36 : 26)
      .setPosition(x, y)
      .setAlpha(1)
      .setScale(0.8)
      .setVisible(true);
  }
  update(dt) {
    const g = this.graphics;
    g.clear();
    for (const s of this.splats.items) {
      if (!s.active) continue;
      s.life -= dt;
      if (s.life <= 0) {
        s.active = false;
        continue;
      }
      g.fillStyle(s.color, Math.min(0.26, s.life * 0.15));
      g.fillEllipse(s.x, s.y, s.r * 2, s.r * 1.3);
      g.fillCircle(s.x + s.r, s.y - s.r * 0.5, s.r * 0.3);
      g.fillCircle(s.x - s.r * 0.6, s.y + s.r * 0.8, s.r * 0.22);
    }
    for (const p of this.particles.items) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 480 * dt;
      const alpha = Math.min(1, p.life * 3);
      g.fillStyle(p.color, alpha);
      if (p.pulp) {
        g.fillTriangle(p.x - p.r, p.y + p.r, p.x + p.r, p.y + p.r * 0.5, p.x, p.y - p.r);
      } else {
        g.fillEllipse(p.x, p.y, p.r * 1.5, p.r * 2);
        g.fillStyle(0xffffff, alpha * 0.55);
        g.fillEllipse(p.x - p.r * 0.2, p.y - p.r * 0.4, p.r * 0.45, p.r * 0.6);
      }
    }
    for (const s of this.slashes.items) {
      if (!s.active) continue;
      s.life -= dt;
      if (s.life <= 0) {
        s.active = false;
        continue;
      }
      const alpha = s.life / 0.22,
        dx = (Math.cos(s.angle) * s.length) / 2,
        dy = (Math.sin(s.angle) * s.length) / 2;
      g.lineStyle(17, 0xa4ffe6, alpha * 0.14);
      g.lineBetween(s.x - dx, s.y - dy, s.x + dx, s.y + dy);
      g.lineStyle(5 * alpha, 0xffffff, alpha);
      g.lineBetween(s.x - dx, s.y - dy, s.x + dx, s.y + dy);
      g.lineStyle(2, 0xffefbf, alpha * 0.5);
      g.strokeCircle(s.x, s.y, (1 - alpha) * 44 + 8);
    }
    for (const p of this.popups.items) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        p.text.setVisible(false);
        continue;
      }
      p.y -= 50 * dt;
      p.text
        .setPosition(p.x, p.y)
        .setAlpha(Math.min(1, p.life * 3))
        .setScale(Math.min(1.15, 1.8 - p.life));
    }
  }
  clear() {
    this.particles.clear();
    this.splats.clear();
    this.slashes.clear();
    for (const p of this.popups.items) {
      p.active = false;
      p.text.setVisible(false);
    }
    this.graphics.clear();
  }
}
