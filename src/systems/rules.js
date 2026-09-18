export const MODES = {
  classic: {
    name: 'Classic',
    duration: Infinity,
    bombs: true,
    misses: true,
    description: 'Three lives. Endless possibilities.',
  },
  time: {
    name: 'Time Attack',
    duration: 60,
    bombs: true,
    misses: false,
    description: '60 seconds. Make every slice count.',
  },
  zen: {
    name: 'Zen',
    duration: 90,
    bombs: false,
    misses: false,
    description: 'No bombs. No pressure. Just flow.',
  },
};
export function difficulty(seconds, mode) {
  return {
    wave: mode === 'zen' ? 6 : seconds < 20 ? 2 : seconds < 45 ? 3 : seconds < 90 ? 4 : 6,
    gap:
      mode === 'zen' ? 1.7 : seconds < 20 ? 1.8 : seconds < 45 ? 1.45 : seconds < 90 ? 1.15 : 0.85,
    speed: seconds < 20 ? 1 : seconds < 45 ? 1.06 : 1.12,
    bombChance: mode === 'zen' ? 0 : seconds < 20 ? 0.13 : seconds < 90 ? 0.2 : 0.3,
  };
}
export const comboLabel = (n) =>
  n >= 5 ? 'MEGA SLICE!' : n >= 3 ? `COMBO ×${n}` : n === 2 ? 'NICE SLICE!' : '';
export class ScoreSystem {
  constructor(mode) {
    this.mode = mode;
    this.score = 0;
    this.misses = 0;
    this.sliced = 0;
    this.launched = 0;
    this.longest = 0;
  }
  fruit(value, combo) {
    this.score += value;
    this.sliced++;
    this.longest = Math.max(this.longest, combo);
  }
  bomb() {
    if (this.mode === 'time') {
      this.score = Math.max(0, this.score - 10);
      return false;
    }
    return this.mode === 'classic';
  }
  miss() {
    if (MODES[this.mode].misses) this.misses++;
    return this.misses >= 3;
  }
  get accuracy() {
    return this.launched ? Math.round((this.sliced / this.launched) * 100) : 0;
  }
}
