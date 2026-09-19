export const isLandscape = () => window.innerWidth > window.innerHeight;

export class LandscapeController {
  constructor(manager, fullscreen) {
    this.manager = manager;
    this.app = document.querySelector('#app');
    this.overlay = document.createElement('section');
    this.overlay.id = 'orientation-gate';
    this.overlay.hidden = true;
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-labelledby', 'orientation-title');
    this.overlay.setAttribute('aria-describedby', 'orientation-description');
    this.overlay.innerHTML = `
      <div class="orientation-card">
        <div class="rotate-device" aria-hidden="true"><span>↻</span></div>
        <span class="eyebrow">SLICE RUSH</span>
        <h2 id="orientation-title">TURN TO<br><em>LANDSCAPE.</em></h2>
        <p id="orientation-description">Rotate your device horizontally to play.</p>
        <button id="orientation-fullscreen" class="primary">Try full screen</button>
        <small>If the screen stays vertical, turn off your device’s rotation lock.</small>
      </div>`;
    document.body.append(this.overlay);
    this.button = this.overlay.querySelector('button');
    this.button.onclick = () => fullscreen.toggle();
    this.button.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        this.button.focus();
      }
    });
    window.addEventListener('resize', () => this.sync());
    window.visualViewport?.addEventListener('resize', () => this.sync());
    this.sync();
  }
  sync() {
    const blocked = !isLandscape();
    const wasBlocked = !this.overlay.hidden;
    if (blocked) this.manager.pause();
    this.overlay.hidden = !blocked;
    this.app.inert = blocked;
    if (blocked) {
      this.overlay.querySelector('p').textContent =
        this.manager.state === 'paused'
          ? 'Your game is paused. Rotate horizontally, then resume when you’re ready.'
          : 'Rotate your device horizontally to play.';
      this.manager.audio.update(false);
      if (!wasBlocked) this.button.focus({ preventScroll: true });
    } else if (wasBlocked) {
      const target = this.manager.state === 'paused' ? '#resume' : '#play';
      document.querySelector(target)?.focus({ preventScroll: true });
    }
  }
}
