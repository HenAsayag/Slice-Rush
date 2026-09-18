import { ScoreSystem, MODES } from '../systems/rules.js';
import { read, save } from '../utils/storage.js';
import { AudioManager } from '../audio/AudioManager.js';
export class GameManager {
  constructor(ui) {
    this.ui = ui;
    this.audio = new AudioManager();
    this.mode = 'classic';
    this.state = 'menu';
    this.elapsed = 0;
    this.score = new ScoreSystem(this.mode);
    this.bests = read('bests', {});
    this.ui.bind(this);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.pause();
    });
    window.addEventListener('blur', () => this.pause());
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (this.state === 'playing') this.pause();
        else if (this.state === 'paused') this.resume();
        else if (this.state === 'settings') this.closeSettings();
      }
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        if (this.state === 'menu') this.start();
        else if (this.state === 'paused') this.resume();
      }
    });
  }
  ready(scene) {
    this.scene = scene;
    this.ui.ready();
  }
  select(mode) {
    if (!MODES[mode]) return;
    this.mode = mode;
    this.ui.select(mode);
    this.audio.play('menu_click');
  }
  start() {
    if (!this.scene) return;
    clearTimeout(this.endTimer);
    this.audio.unlock();
    this.audio.play('menu_click');
    this.elapsed = 0;
    this.score = new ScoreSystem(this.mode);
    this.state = 'playing';
    this.scene.begin();
    this.ui.show('playing');
    this.updateHud();
    this.ui.announce('Go!');
  }
  tick(dt) {
    this.elapsed += dt;
    const clock = Math.ceil(MODES[this.mode].duration - this.elapsed);
    if (clock !== this.lastClock) {
      this.lastClock = clock;
      this.updateHud();
    }
    if (this.elapsed >= MODES[this.mode].duration) this.end('Time well sliced.');
  }
  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.scene.slicer.reset();
    this.scene.trail.clear();
    this.ui.show('paused');
  }
  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.audio.unlock();
    this.ui.show('playing');
  }
  menu() {
    clearTimeout(this.endTimer);
    this.state = 'menu';
    this.scene?.begin();
    this.ui.show('menu');
    this.ui.select(this.mode);
  }
  settings() {
    this.previousState = this.state;
    if (this.state === 'playing') this.pause();
    this.state = 'settings';
    this.ui.show('settings');
    this.ui.updateSettings();
  }
  closeSettings() {
    this.state = this.previousState === 'playing' ? 'paused' : this.previousState || 'menu';
    this.ui.show(this.state);
  }
  end(reason) {
    if (this.state !== 'playing') return;
    this.state = 'ending';
    this.scene.slicer.reset();
    this.audio.play('game_over');
    const old = this.bests[this.mode] || 0;
    this.newBest = this.score.score > old;
    if (this.newBest) {
      this.bests[this.mode] = this.score.score;
      save('bests', this.bests);
    }
    this.ui.flash();
    this.endTimer = setTimeout(() => {
      if (this.state !== 'ending') return;
      this.state = 'results';
      this.ui.results(reason);
      this.ui.show('results');
    }, 650);
  }
  updateHud() {
    this.ui.hud(this.score, MODES[this.mode].duration - this.elapsed);
  }
}
