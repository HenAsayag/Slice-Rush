import { LandscapeController } from './LandscapeController.js';
import { FullscreenController } from './FullscreenController.js';
import { decorateWithAtlas } from '../assets/atlas.js';
import { icon } from './icons.js';
import { FRUITS, fruitCanvas } from '../assets/fruits.js';
import { MODES } from '../systems/rules.js';
export class UI {
  constructor() {
    document.querySelector('#app').innerHTML =
      `<div class="environment"></div><div class="vignette"></div><div id="game" aria-label="Fruit slicing playfield"></div>
 <header class="topbar"><button class="brand" aria-label="Slice Rush main menu">${icon('blade')}<span>SLICE<span class="accent">RUSH</span><small>THE NIGHT MARKET ARCADE</small></span></button><div class="top-actions"><span class="live-dot"></span><span class="market-open">THE MARKET IS OPEN</span><button id="sound" class="icon-button" aria-label="Toggle sound effects" title="Sound effects">${icon('sound')}</button><button id="music" class="icon-button" aria-label="Toggle background music" title="Background music">${icon('music')}</button><button id="fullscreen" class="icon-button fullscreen-button" aria-label="Toggle fullscreen">${icon('expand')}</button></div></header>
 <main id="menu" class="screen menu"><div class="menu-intro"><span class="eyebrow"><i></i> FRESH FRUIT. SHARP REFLEXES.</span><h1><span>SLICE</span> <em>RUSH<span class="title-spark">✦</span></em></h1><p class="tagline">A little chaos. A lot of juice.</p><p class="subline">Find your flow at the night market.</p></div>
 <div class="fruit-display" aria-hidden="true"><img class="hero-fruit melon"/><img class="hero-fruit orange"/><img class="hero-fruit lime"/><img class="hero-fruit berry"/><span class="fruit-streak"></span><span class="tiny-spark spark-one">✧</span><span class="tiny-spark spark-two">✦</span></div>
 <section class="mode-section" aria-label="Game mode"><div class="section-label"><span></span> MAKE YOUR CUT <span></span></div><div class="mode-grid">${Object.entries(
   MODES,
 )
   .map(
     ([mode, config]) =>
       `<button class="mode-card ${mode === 'classic' ? 'selected' : ''}" data-mode="${mode}" aria-pressed="${mode === 'classic'}"><span class="mode-icon">${icon({ unlimited: 'infinity', classic: 'blade', time: 'clock', zen: 'leaf' }[mode])}</span><span class="mode-copy"><strong>${config.name}</strong><small>${{ unlimited: 'No timer · Fruit frenzy', classic: '3 lives · Stay sharp', time: '60 seconds · Go fast', zen: '90 seconds · Just flow' }[mode]}</small></span><span class="selection-dot"></span>${mode === 'unlimited' ? '<span class="mode-tag">NEW · ENDLESS</span>' : ''}</button>`,
   )
   .join(
     '',
   )}</div><p id="mode-description" class="mode-description">Three lives. Endless possibilities.</p></section>
 <button id="play" class="play-button" disabled><span>${icon('blade')} LET’S SLICE</span>${icon('arrow')}</button><div class="menu-meta"><span>${icon('trophy')} PERSONAL BEST <b id="menu-best">0</b></span><i></i><button id="settings-button">${icon('gear')} Settings</button></div>
 </main>
 <section id="hud" class="hud" hidden><div class="score-block"><span class="eyebrow">SCORE</span><strong id="score">0</strong><small>BEST <b id="hud-best">0</b></small></div><div class="hud-center"><span id="mode-name" class="eyebrow">CLASSIC</span><b id="combo"></b></div><div class="hud-right"><div id="lives"></div><strong id="timer" hidden>1:00</strong><button id="pause" class="icon-button" aria-label="Pause game">${icon('pause')}</button></div></section>
 <div id="announcement" aria-live="polite"></div><div id="flash"></div>
 <div id="modal" class="modal-backdrop" hidden><section id="paused" class="dialog" hidden><span class="eyebrow">TAKE A BREATHER</span><h2>STAY SHARP.</h2><p>Your fruit can wait a moment.</p><button id="resume" class="primary">Back to slicing ${icon('arrow')}</button><button id="finish-run" class="secondary">Finish & save score</button><button id="pause-settings" class="secondary">${icon('gear')} Settings</button><button class="text-button go-menu">Main menu</button></section>
 <section id="settings" class="dialog" hidden><button id="close-settings" class="dialog-close icon-button" aria-label="Close settings">${icon('close')}</button><span class="eyebrow">MAKE IT YOURS</span><h2>GOOD VIBES.</h2><p>The perfect mix for your night market.</p><div class="setting-row"><span>Sound effects<small>Every slice, pop, and splash</small></span><button data-toggle="sound" class="switch" role="switch" aria-label="Sound effects"></button></div><div class="setting-row"><span>Music<small>Tropical marimba, bass & a mellow beat</small></span><button data-toggle="music" class="switch" role="switch" aria-label="Music"></button></div><div class="setting-row"><span>Haptics<small>A little buzz on supported devices</small></span><button data-toggle="vibration" class="switch" role="switch" aria-label="Haptics"></button></div><button id="settings-done" class="primary">All set ${icon('arrow')}</button></section>
 <section id="results" class="dialog results" hidden><span id="result-eyebrow" class="eyebrow">THAT’S A WRAP</span><h2>NICELY SLICED.</h2><p id="result-reason"></p><div class="final-score"><strong id="final-score">0</strong><span>FINAL SCORE</span></div><div class="stats"><div><b id="best-score">0</b><small>BEST SCORE</small></div><div><b id="longest-combo">0</b><small>LONGEST COMBO</small></div><div><b id="fruit-sliced">0</b><small>FRUIT SLICED</small></div><div><b id="accuracy">0%</b><small>ACCURACY</small></div></div><button id="again" class="primary">One more round ${icon('arrow')}</button><button class="text-button go-menu">Main menu</button></section></div>
 <footer><span class="instruction">${icon('mouse')} <span><span id="control-hint">Drag to slice · No bombs, just fruit</span></span></span><span class="footer-right">SLICED FRESH. EVERY TIME. <span>✦</span></span></footer>`;
    this.$ = (s) => document.querySelector(s);
    this.lastScore = -1;
    this.decorate();
  }
  decorate() {
    const set = (selector, index, half = 0) => {
      this.$(selector).src = fruitCanvas(FRUITS[index], half).toDataURL();
      decorateWithAtlas(this.$(selector), FRUITS[index].name, half);
    };
    set('.melon', 0, -1);
    set('.orange', 1, 1);
    set('.lime', 8, -1);
    set('.berry', 3);
  }
  bind(m) {
    this.m = m;
    this.$('#play').onclick = () => m.start();
    this.$('.brand').onclick = () => {
      if (m.state === 'playing') m.pause();
      else if (m.state !== 'menu') m.menu();
    };
    document
      .querySelectorAll('button[data-mode]')
      .forEach((b) => (b.onclick = () => m.select(b.dataset.mode)));
    this.$('#sound').onclick = () => {
      m.audio.toggle('sound');
      this.updateSettings();
    };
    this.$('#music').onclick = () => {
      m.audio.toggle('music');
      this.updateSettings();
    };
    this.fullscreen = new FullscreenController(this.$('#fullscreen'), (text) =>
      this.announce(text),
    );
    this.$('#settings-button').onclick = () => m.settings();
    this.$('#pause-settings').onclick = () => m.settings();
    this.$('#close-settings').onclick = this.$('#settings-done').onclick = () => m.closeSettings();
    this.$('#pause').onclick = () => m.pause();
    this.$('#resume').onclick = () => m.resume();
    this.$('#finish-run').onclick = () => m.finish();
    this.$('#again').onclick = () => m.start();
    document.querySelectorAll('.go-menu').forEach((b) => (b.onclick = () => m.menu()));
    document.querySelectorAll('[data-toggle]').forEach(
      (b) =>
        (b.onclick = () => {
          m.audio.toggle(b.dataset.toggle);
          this.updateSettings();
        }),
    );
    this.updateSettings();
    this.select(m.mode);
    this.orientation = new LandscapeController(m, this.fullscreen);
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || this.$('#modal').hidden) return;
      const buttons = [...this.$('#modal').querySelectorAll('section:not([hidden]) button')];
      const first = buttons[0],
        last = buttons.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }
  ready() {
    this.$('#play').disabled = false;
  }
  select(mode) {
    document.querySelectorAll('button[data-mode]').forEach((b) => {
      const selected = b.dataset.mode === mode;
      b.classList.toggle('selected', selected);
      b.setAttribute('aria-pressed', selected);
    });
    this.$('#menu-best').textContent = this.m.bests[mode] || 0;
    this.$('#mode-description').textContent = MODES[mode].description;
    this.$('#control-hint').textContent =
      (matchMedia('(pointer: coarse)').matches ? 'Swipe' : 'Hold & drag') +
      ' to slice · ' +
      (MODES[mode].bombs ? 'Watch out for bombs' : 'No bombs, just fruit');
  }
  show(state) {
    const menu = state === 'menu',
      modal = ['paused', 'settings', 'results'].includes(state);
    document.body.dataset.state = state;
    document.body.dataset.gameMode = this.m.mode;
    this.$('#finish-run').hidden = this.m.mode !== 'unlimited';
    this.$('#menu').hidden = !menu;
    this.$('#hud').hidden = !['playing', 'paused', 'ending'].includes(state);
    this.$('#modal').hidden = !modal;
    for (const id of ['paused', 'settings', 'results']) this.$('#' + id).hidden = state !== id;
    this.$('footer').classList.toggle('playing', !menu);
    if (modal) {
      this.lastFocus = document.activeElement;
      this.$(`#${state} button`)?.focus();
    } else if (state === 'menu') this.$('#play').focus({ preventScroll: true });
  }
  hud(score, time) {
    if (score.score !== this.lastScore) {
      this.$('#score').textContent = score.score;
      this.$('#score').animate([{ transform: 'scale(1.16)' }, { transform: 'scale(1)' }], {
        duration: 180,
      });
      this.lastScore = score.score;
    }
    this.$('#hud-best').textContent = this.m.bests[this.m.mode] || 0;
    this.$('#mode-name').textContent = MODES[this.m.mode].name.toUpperCase();
    const classic = this.m.mode === 'classic';
    this.$('#lives').hidden = !classic;
    this.$('#timer').hidden = classic;
    const lifeState = String(score.misses);
    if (this.lifeState !== lifeState) {
      this.lifeState = lifeState;
      this.$('#lives').innerHTML = Array.from(
        { length: 3 },
        (_, i) => `<span class="life ${i < score.misses ? 'lost' : ''}">${icon('heart')}</span>`,
      ).join('');
    }
    if (this.m.mode === 'unlimited') {
      this.$('#timer').textContent = '∞';
      this.$('#timer').classList.remove('urgent');
      this.$('#timer').setAttribute('aria-label', 'Unlimited time');
    } else if (!classic) {
      this.$('#timer').removeAttribute('aria-label');
      const remaining = Math.max(0, Math.ceil(time));
      this.$('#timer').textContent =
        `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
      this.$('#timer').classList.toggle('urgent', remaining <= 10);
    }
    this.$('#combo').textContent = score.longest >= 2 ? 'BEST COMBO ×' + score.longest : '';
  }
  updateSettings() {
    document.querySelectorAll('[data-toggle]').forEach((b) => {
      b.classList.toggle('on', this.m.audio[b.dataset.toggle]);
      b.setAttribute('aria-checked', this.m.audio[b.dataset.toggle]);
    });
    this.$('#sound').innerHTML = icon(this.m.audio.sound ? 'sound' : 'mute');
    this.$('#sound').setAttribute('aria-pressed', this.m.audio.sound);
    this.$('#music').setAttribute('aria-pressed', this.m.audio.music);
    this.$('#music').classList.toggle('audio-off', !this.m.audio.music);
  }
  results(reason) {
    const s = this.m.score;
    this.$('#result-reason').textContent = reason;
    this.$('#result-eyebrow').textContent = this.m.newBest
      ? 'A FRESH PERSONAL BEST'
      : 'THAT’S A WRAP';
    this.$('#final-score').textContent = s.score;
    this.$('#best-score').textContent = this.m.bests[this.m.mode] || 0;
    this.$('#longest-combo').textContent = '×' + s.longest;
    this.$('#fruit-sliced').textContent = s.sliced;
    this.$('#accuracy').textContent = s.accuracy + '%';
  }
  flash() {
    this.$('#flash').animate([{ opacity: 0.4 }, { opacity: 0 }], { duration: 600 });
  }
  announce(text) {
    const el = this.$('#announcement');
    el.textContent = text;
    el.animate(
      [
        { opacity: 0, transform: 'translate(-50%, 10px)' },
        { opacity: 1, offset: 0.15 },
        { opacity: 1, offset: 0.7 },
        { opacity: 0, transform: 'translate(-50%, -10px)' },
      ],
      { duration: 1700 },
    );
  }
}
