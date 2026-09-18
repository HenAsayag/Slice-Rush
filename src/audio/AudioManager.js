import { assetUrl } from '../utils/assetUrl.js';
import { read, save } from '../utils/storage.js';
export const AUDIO_PATHS = {
  slice: assetUrl('/assets/audio/slice.wav'),
  fruit_hit: assetUrl('/assets/audio/fruit_hit.wav'),
  combo: assetUrl('/assets/audio/combo.wav'),
  bomb: assetUrl('/assets/audio/bomb.wav'),
  miss: assetUrl('/assets/audio/miss.wav'),
  game_over: assetUrl('/assets/audio/game_over.wav'),
  menu_click: assetUrl('/assets/audio/menu_click.wav'),
  music: assetUrl('/assets/audio/background_music.mp3'),
};
export class AudioManager {
  constructor() {
    this.sound = read('sound', true);
    this.music = read('music', true);
    this.vibration = read('vibration', true);
    this.ctx = null;
    this.buffers = new Map();
    this.nextBeat = 0;
    this.beat = 0;
    this.musicActive = false;
    this.lastSlash = -1;
    this.lastWhoosh = -1;
  }
  unlock() {
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createDynamicsCompressor();
        this.master.threshold.value = -18;
        this.master.ratio.value = 5;
        this.master.connect(this.ctx.destination);
        this.effectsBus = this.ctx.createGain();
        this.effectsBus.gain.value = this.sound ? 0.8 : 0;
        this.effectsBus.connect(this.master);
        this.musicBus = this.ctx.createGain();
        this.musicBus.gain.value = 0;
        this.musicBus.connect(this.master);
        this.noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch {}
  }
  toggle(key) {
    this[key] = !this[key];
    save(key, this[key]);
    this.unlock();
    if (this.ctx) {
      if (key === 'sound')
        this.effectsBus.gain.setTargetAtTime(this.sound ? 0.8 : 0, this.ctx.currentTime, 0.015);
      if (key === 'music') this.syncMusic();
    }
    return this[key];
  }
  syncMusic() {
    if (!this.ctx) return;
    this.musicBus.gain.setTargetAtTime(
      this.music && this.musicActive ? 0.65 : 0,
      this.ctx.currentTime,
      0.045,
    );
    if (!this.music || !this.musicActive) this.nextBeat = 0;
  }
  async loadCustom(name, url = AUDIO_PATHS[name]) {
    this.unlock();
    if (!this.ctx) return false;
    try {
      const r = await fetch(url);
      if (!r.ok) return false;
      this.buffers.set(name, await this.ctx.decodeAudioData(await r.arrayBuffer()));
      return true;
    } catch {
      return false;
    }
  }
  tone(
    freq,
    duration = 0.1,
    volume = 0.06,
    type = 'sine',
    end = freq,
    bus = this.effectsBus,
    when = this.ctx?.currentTime,
  ) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    o.frequency.exponentialRampToValueAtTime(Math.max(end, 30), when + duration);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(volume, when + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    o.connect(g);
    g.connect(bus);
    o.start(when);
    o.stop(when + duration + 0.025);
    o.onended = () => {
      o.disconnect();
      g.disconnect();
    };
  }
  noise(
    duration,
    volume,
    from,
    to,
    bus = this.effectsBus,
    when = this.ctx?.currentTime,
    kind = 'bandpass',
  ) {
    if (!this.ctx) return;
    const source = this.ctx.createBufferSource(),
      filter = this.ctx.createBiquadFilter(),
      gain = this.ctx.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = kind;
    filter.Q.value = 0.8;
    filter.frequency.setValueAtTime(from, when);
    filter.frequency.exponentialRampToValueAtTime(to, when + duration);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(volume, when + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(bus);
    source.start(when, Math.random() * 0.5, duration);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }
  knife(light = false) {
    if (!this.sound || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - (light ? this.lastWhoosh : this.lastSlash) < (light ? 0.14 : 0.045)) return;
    if (light) this.lastWhoosh = now;
    else this.lastSlash = now;
    this.noise(light ? 0.13 : 0.2, light ? 0.16 : 0.36, 8200, 650);
    if (!light) {
      this.tone(2600, 0.085, 0.045, 'triangle', 640);
      this.noise(0.09, 0.2, 1800, 180, this.effectsBus, now + 0.025, 'lowpass');
    }
  }
  swipe(speed) {
    if (speed > 650) this.knife(true);
  }
  play(name) {
    if (!this.sound) return;
    this.unlock();
    if (!this.ctx) return;
    if (this.buffers.has(name)) {
      const s = this.ctx.createBufferSource();
      s.buffer = this.buffers.get(name);
      s.connect(this.effectsBus);
      s.start();
      s.onended = () => s.disconnect();
      return;
    }
    switch (name) {
      case 'slice':
        this.knife();
        break;
      case 'fruit_hit':
        this.tone(220, 0.13, 0.085, 'sine', 55);
        this.noise(0.1, 0.13, 1600, 180, this.effectsBus, this.ctx.currentTime, 'lowpass');
        break;
      case 'combo':
        this.tone(659, 0.18, 0.055);
        this.tone(988, 0.22, 0.04, 'sine', 988, this.effectsBus, this.ctx.currentTime + 0.075);
        break;
      case 'bomb':
        this.tone(95, 0.7, 0.17, 'sawtooth', 30);
        this.noise(0.55, 0.3, 1600, 80, this.effectsBus, this.ctx.currentTime, 'lowpass');
        break;
      case 'miss':
        this.tone(240, 0.2, 0.035, 'triangle', 100);
        break;
      case 'game_over':
        this.tone(300, 0.7, 0.045, 'triangle', 75);
        break;
      default:
        this.tone(700, 0.07, 0.025, 'sine', 900);
    }
  }
  update(active) {
    if (active !== this.musicActive) {
      this.musicActive = active;
      this.syncMusic();
    }
    if (!this.ctx || !this.music || !active) return;
    const now = this.ctx.currentTime;
    if (!this.nextBeat || this.nextBeat < now - 0.2) {
      this.nextBeat = now + 0.035;
      this.syncMusic();
    }
    const step = 60 / 108 / 4;
    while (this.nextBeat < now + 0.1) {
      this.scheduleBeat(this.beat++, this.nextBeat);
      this.nextBeat += step;
    }
  }
  scheduleBeat(beat, t) {
    const chords = [
        [220, 261.63, 329.63],
        [174.61, 220, 261.63],
        [196, 246.94, 293.66],
        [164.81, 196, 246.94],
      ],
      chord = chords[Math.floor(beat / 16) % 4],
      part = beat % 16,
      bus = this.musicBus;
    // Marimba-like plucks, mellow chord pads, bass and a soft shaker make a seamless 4-bar loop.
    if (part % 2 === 0) {
      const pattern = [0, 2, 1, 2, 0, 1, 2, 1],
        note = chord[pattern[part / 2]] * (part % 4 === 0 ? 2 : 1);
      this.tone(note, 0.25, 0.085, 'sine', note, bus, t);
      this.tone(note * 3, 0.065, 0.016, 'sine', note * 3, bus, t);
    }
    if (part === 0) {
      for (const note of chord) this.tone(note, 0.95, 0.018, 'triangle', note, bus, t);
    }
    if (part % 4 === 0) {
      this.tone(chord[0] / 2, 0.3, 0.09, 'sine', chord[0] / 2, bus, t);
      this.tone(115, 0.13, 0.07, 'sine', 42, bus, t);
    }
    if (part % 2 === 1) this.noise(0.055, 0.042, 7600, 4200, bus, t, 'highpass');
    if (part === 4 || part === 12) this.noise(0.09, 0.035, 1800, 700, bus, t);
  }
  vibrate(pattern) {
    if (this.vibration && navigator.vibrate) navigator.vibrate(pattern);
  }
}
