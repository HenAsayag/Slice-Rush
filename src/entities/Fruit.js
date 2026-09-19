import { rand } from '../utils/math.js';
export class Fruit {
  constructor(scene) {
    this.scene = scene;
    this.sprite = scene.add.image(0, 0, 'orange').setVisible(false);
    this.active = false;
  }
  launch(spec, x, y, vx, vy, { gravity = 720 } = {}) {
    const mobile = this.scene.scale.width < 600;
    Object.assign(this, {
      active: true,
      spec,
      x,
      y,
      vx,
      vy,
      gravity,
      angle: rand(-0.5, 0.5),
      spin: rand(-1.7, 1.7),
      half: 0,
      age: 0,
      bomb: spec.name === 'bomb',
      sizeBoost: spec.name === 'bomb' ? 1.35 : (mobile ? 1.45 : 1.75) * 0.75,
    });
    this.hitRadius = spec.r * 0.9 * this.sizeBoost;
    this.sprite.setTexture(spec.name).setVisible(true).setAlpha(1);
    this.render();
    return this;
  }
  render() {
    const s = ((this.spec.r * 2.6) / 160) * this.sizeBoost;
    this.sprite
      .setPosition(this.x, this.y)
      .setRotation(this.angle)
      .setScale(
        s * (1 + Math.sin(this.age * 13) * 0.025),
        s * (1 - Math.sin(this.age * 13) * 0.025),
      );
  }
  update(dt) {
    this.age += dt;
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.angle += this.spin * dt;
    this.render();
  }
  release() {
    this.active = false;
    this.sprite.setVisible(false);
  }
}
export class Bomb extends Fruit {
  launch(spec, x, y, vx, vy) {
    super.launch(spec, x, y, vx, vy);
    this.bomb = true;
    return this;
  }
}
