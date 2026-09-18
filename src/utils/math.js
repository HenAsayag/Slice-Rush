export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const rand = (a, b) => a + Math.random() * (b - a);
export function segmentCircle(a, b, c, r) {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    l = dx * dx + dy * dy;
  const t = l ? clamp(((c.x - a.x) * dx + (c.y - a.y) * dy) / l, 0, 1) : 0;
  return (a.x + t * dx - c.x) ** 2 + (a.y + t * dy - c.y) ** 2 <= r * r;
}
export class Pool {
  constructor(factory, max) {
    this.items = Array.from({ length: max }, factory);
  }
  take() {
    return this.items.find((x) => !x.active);
  }
  clear() {
    for (const x of this.items) x.active = false;
  }
}
