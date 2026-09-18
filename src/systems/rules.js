export const MODES = {
  unlimited: {
    name: 'Unlimited',
    duration: Infinity,
    bombs: false,
    misses: false,
    description: 'Endless fruit. No bombs. No limits.',
  },
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
  if (mode === 'unlimited') {
    const level = Math.min(1, Math.max(0, seconds) / 120);
    return {
      wave: 10 + Math.floor(level * 4),
      gap: 0.72 - level * 0.24,
      speed: 1.24 + level * 0.25,
      bombChance: 0,
    };
  }
  if (mode === 'zen') return { wave: 6, gap: 1.3, speed: 1.05, bombChance: 0 };
  const level = seconds < 20 ? 0 : seconds < 45 ? 1 : seconds < 90 ? 2 : 3;
  return {
    wave: (mode === 'time' ? 4 : 3) + level,
    gap: Math.max(0.62, (mode === 'time' ? 1.05 : 1.3) - level * 0.18),
    speed: 1.12 + level * 0.08,
    bombChance: !MODES[mode].bombs ? 0 : level === 0 ? 0.1 : level < 3 ? 0.16 : 0.23,
  };
}
export const comboLabel = (n) =>
  n >= 10
    ? `FRUIT FRENZY ×${n}`
    : n >= 5
      ? `MEGA SLICE ×${n}`
      : n >= 3
        ? `COMBO ×${n}`
        : n === 2
          ? 'NICE SLICE!'
          : '';
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
