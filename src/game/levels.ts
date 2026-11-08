/** XP needed to reach `level` (level 1 starts at 0 XP). */
export function xpForLevel(level: number): number {
  return 25 * (level - 1) * level;
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}

/** Progress through the current level, 0..1. */
export function levelProgress(xp: number): number {
  const level = levelForXp(xp);
  const start = xpForLevel(level);
  return (xp - start) / (xpForLevel(level + 1) - start);
}

const TITLES = [
  'QR Rookie',
  'Dot Dabbler',
  'Pattern Pal',
  'Code Cadet',
  'Bit Builder',
  'Mask Master',
  'Error Fixer',
  'Scan Captain',
  'QR Wizard',
  'QR Legend',
];

export function levelTitle(level: number): string {
  return TITLES[Math.min(level, TITLES.length) - 1];
}
