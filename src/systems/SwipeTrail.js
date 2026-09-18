import { clamp, segmentCircle } from '../utils/math.js';
export class SwipeTrail {
  constructor(scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics().setDepth(20);
    this.points = [];
  }
  add(p, speed = 500) {
    this.points.push({ ...p, life: 0.15, width: clamp(speed / 150, 4, 13) });
    if (this.points.length > 70) this.points.shift();
  }
  update(dt) {
    let live = 0;
    for (const p of this.points) {
      p.life -= dt;
      if (p.life > 0) this.points[live++] = p;
    }
    this.points.length = live;
    this.graphics.clear();
    for (let i = 1; i < this.points.length; i++) {
      const a = this.points[i - 1],
        b = this.points[i];
      const alpha = b.life / 0.15;
      this.graphics.lineStyle(b.width * 2.8, 0x8fffea, alpha * 0.15);
      this.graphics.lineBetween(a.x, a.y, b.x, b.y);
      this.graphics.lineStyle(b.width, 0xc5ffef, alpha * 0.5);
      this.graphics.lineBetween(a.x, a.y, b.x, b.y);
      this.graphics.lineStyle(Math.max(1, b.width * 0.4), 0xffffff, alpha);
      this.graphics.lineBetween(a.x, a.y, b.x, b.y);
    }
  }
  clear() {
    this.points = [];
    this.graphics.clear();
  }
}
export class ComboSystem {
  constructor() {
    this.count = 0;
  }
  reset() {
    this.count = 0;
  }
  hit() {
    return ++this.count;
  }
}
export class SliceSystem {
  constructor(scene, canvas) {
    this.scene = scene;
    this.pointer = null;
    this.previous = null;
    this.combo = new ComboSystem();
    this.canvas = canvas;
    const point = (e) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - r.left) * scene.scale.width) / r.width,
        y: ((e.clientY - r.top) * scene.scale.height) / r.height,
      };
    };
    canvas.addEventListener('pointerdown', (e) => {
      if (
        this.pointer !== null ||
        scene.manager.state !== 'playing' ||
        (e.pointerType === 'mouse' && e.button !== 0)
      )
        return;
      e.preventDefault();
      this.pointer = e.pointerId;
      canvas.setPointerCapture(e.pointerId);
      this.previous = point(e);
      this.combo.reset();
      scene.trail.clear();
      scene.trail.add(this.previous);
      scene.manager.audio.unlock();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.pointer || scene.manager.state !== 'playing') return;
      e.preventDefault();
      const samples = e.getCoalescedEvents?.();
      for (const ev of samples?.length ? samples : [e]) {
        const p = point(ev);
        this.segment(this.previous, p);
        this.previous = p;
      }
    });
    const end = (e) => {
      if (e.pointerId === this.pointer) {
        if (e.type === 'pointerup' && scene.manager.state === 'playing')
          this.segment(this.previous, point(e));
        this.pointer = null;
        this.previous = null;
        this.combo.reset();
      }
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('lostpointercapture', end);
  }
  segment(a, b) {
    if (!a) return;
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    if (distance < 2) return;
    this.scene.manager.audio.swipe(distance * 60);
    const steps = Math.min(20, Math.ceil(distance / 8));
    for (let i = 1; i <= steps; i++)
      this.scene.trail.add(
        { x: a.x + ((b.x - a.x) * i) / steps, y: a.y + ((b.y - a.y) * i) / steps },
        distance * 60,
      );
    for (const fruit of this.scene.fruits.items) {
      if (this.scene.manager.state !== 'playing') break;
      if (fruit.active && segmentCircle(a, b, fruit, fruit.hitRadius)) {
        this.scene.slice(
          fruit,
          fruit.bomb ? this.combo.count : this.combo.hit(),
          Math.atan2(b.y - a.y, b.x - a.x),
        );
      }
    }
  }
  reset() {
    this.pointer = null;
    this.previous = null;
    this.combo.reset();
  }
}
