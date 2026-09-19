import { icon } from './icons.js';

// Native fullscreen needs a direct tap. Expanded view is an honest fallback for
// browsers (including some iPhone browsers) that cannot fullscreen an HTML page.
export class FullscreenController {
  constructor(button, announce) {
    this.button = button;
    this.announce = announce;
    this.expanded = false;
    this.busy = false;
    button.onclick = () => this.toggle();
    document.addEventListener('fullscreenchange', () => this.sync());
    document.addEventListener('webkitfullscreenchange', () => this.sync());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.expanded) {
        this.expanded = false;
        this.sync();
      }
    });
    this.sync();
  }
  get nativeElement() {
    return document.fullscreenElement || document.webkitFullscreenElement;
  }
  sync() {
    const active = Boolean(this.nativeElement) || this.expanded;
    document.body.classList.toggle('expanded-view', this.expanded);
    document.body.dataset.displayMode = this.nativeElement
      ? 'fullscreen'
      : this.expanded
        ? 'expanded'
        : 'windowed';
    this.button.setAttribute('aria-pressed', String(active));
    this.button.setAttribute(
      'aria-label',
      active ? 'Exit fullscreen or expanded view' : 'Enter fullscreen',
    );
    this.button.title = active ? 'Return to normal view' : 'Full screen';
    this.button.innerHTML =
      icon(active ? 'collapse' : 'expand') + `<span>${active ? 'Exit view' : 'Full screen'}</span>`;
    window.dispatchEvent(new Event('resize'));
  }
  async toggle() {
    if (this.busy) return;
    this.busy = true;
    try {
      if (this.nativeElement) {
        const exit = document.exitFullscreen || document.webkitExitFullscreen;
        await exit.call(document);
        screen.orientation?.unlock?.();
      } else if (this.expanded) {
        this.expanded = false;
      } else {
        const root = document.documentElement;
        const request = root.requestFullscreen || root.webkitRequestFullscreen;
        if (request) {
          try {
            await request.call(root);
            this.expanded = !this.nativeElement;
            if (this.nativeElement) {
              try {
                await screen.orientation?.lock?.('landscape');
              } catch {
                // The rotation gate still enforces landscape when locking is unsupported.
              }
            }
          } catch {
            this.expanded = true;
          }
        } else this.expanded = true;
        if (this.expanded) this.announce('Expanded view — browser controls may remain visible.');
      }
    } catch {
      this.announce('Could not exit fullscreen. Use your browser’s back or exit control.');
    } finally {
      this.busy = false;
      this.sync();
    }
  }
}
