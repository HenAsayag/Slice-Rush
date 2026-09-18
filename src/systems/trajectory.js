import { clamp } from '../utils/math.js';
// Increase velocity and gravity together: quicker arcs, without raising their
// apex into the HUD. Lanes and launch staggering keep small screens readable.
export function launchPlan(width, height, index, speed, random = Math.random) {
  const compact = width < 600 || height < 500;
  const margin = Math.min(72, Math.max(45, width * 0.13));
  const lanes = Math.max(
    3,
    Math.min(8, Math.floor((width - margin * 2) / (compact ? 78 : 115)) + 1),
  );
  const lane = index % lanes;
  const spacing = (width - margin * 2) / (lanes - 1);
  const x = clamp(
    margin + lane * spacing + (random() - 0.5) * spacing * 0.28,
    margin,
    width - margin,
  );
  const safeTop = Math.min(height * 0.46, compact ? 190 : 210);
  const apexY = clamp(height * (0.35 + random() * 0.2), safeTop + 30, height * 0.69);
  const y = height + 85;
  const gravity = 720 * speed * speed * (compact ? 1.05 : 1);
  const vy = -Math.sqrt(2 * gravity * (y - apexY));
  const toApex = -vy / gravity;
  const maxDrift = Math.max(0, Math.min(x - margin, width - margin - x) / 2);
  const drift = clamp((random() - 0.5) * spacing * 0.7, -maxDrift, maxDrift);
  return { x, y, vx: drift / toApex, vy, gravity, apexY, lanes };
}
