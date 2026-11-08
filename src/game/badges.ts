import { levelForXp } from './levels';
import { QUESTS } from './quests';
import type { Stats } from './stats';

/** Everything a badge rule can look at. */
export interface BadgeContext {
  stats: Stats;
  xp: number;
  questStars: Record<string, number>;
  streak: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  /** Twemoji code point of the badge picture. */
  emoji: string;
  earned: (ctx: BadgeContext) => boolean;
}

const totalStars = (ctx: BadgeContext) => Object.values(ctx.questStars).reduce((a, b) => a + b, 0);

export const BADGES: Badge[] = [
  {
    id: 'first-code',
    name: 'First Code!',
    description: 'Make your very first QR code.',
    emoji: '2b50',
    earned: (c) => c.stats.codesMade >= 1,
  },
  {
    id: 'code-factory',
    name: 'Code Factory',
    description: 'Make 10 QR codes.',
    emoji: '1f48e',
    earned: (c) => c.stats.codesMade >= 10,
  },
  {
    id: 'wifi-wizard',
    name: 'WiFi Wizard',
    description: 'Make a WiFi code.',
    emoji: '1f4f6',
    earned: (c) => c.stats.wifiCodes >= 1,
  },
  {
    id: 'explorer',
    name: 'Code Explorer',
    description: 'Watch a QR code get built, step by step.',
    emoji: '1f393',
    earned: (c) => c.stats.walkthroughs >= 1,
  },
  {
    id: 'bit-detective',
    name: 'Bit Detective',
    description: 'Tap 20 dots to see what they mean.',
    emoji: '1f50d',
    earned: (c) => c.stats.dotsInspected >= 20,
  },
  {
    id: 'scratch-hero',
    name: 'Scratch Hero',
    description: 'Scratch off 15% of a code and it still scans!',
    emoji: '1f6e1',
    earned: (c) => c.stats.scratchBest >= 15,
  },
  {
    id: 'scanner',
    name: 'Super Scanner',
    description: 'Scan a QR code with the camera.',
    emoji: '1f4f7',
    earned: (c) => c.stats.scans >= 1,
  },
  {
    id: 'hunt-master',
    name: 'Hunt Master',
    description: 'Make a treasure hunt.',
    emoji: '1f5fa',
    earned: (c) => c.stats.huntsMade >= 1,
  },
  {
    id: 'clue-finder',
    name: 'Clue Finder',
    description: 'Find 5 treasure hunt clues.',
    emoji: '1f440',
    earned: (c) => c.stats.cluesFound >= 5,
  },
  {
    id: 'artist',
    name: 'QR Artist',
    description: 'Decorate 3 codes.',
    emoji: '1f3a8',
    earned: (c) => c.stats.decorations >= 3,
  },
  {
    id: 'star-collector',
    name: 'Star Collector',
    description: 'Collect 10 quest stars.',
    emoji: '1f31f',
    earned: (c) => totalStars(c) >= 10,
  },
  {
    id: 'champion',
    name: 'Quest Champion',
    description: 'Get 3 stars on every quest.',
    emoji: '1f3c6',
    earned: (c) => QUESTS.every((q) => (c.questStars[q.id] ?? 0) >= 3),
  },
  {
    id: 'streak-3',
    name: 'On Fire',
    description: 'Play 3 days in a row.',
    emoji: '1f525',
    earned: (c) => c.streak >= 3,
  },
  {
    id: 'royal',
    name: 'QR Royalty',
    description: 'Reach level 5.',
    emoji: '1f451',
    earned: (c) => levelForXp(c.xp) >= 5,
  },
];

export const BADGE_XP = 25;

/** Badges that are earned but not yet in `owned`. */
export function newlyEarnedBadges(ctx: BadgeContext, owned: readonly string[]): Badge[] {
  return BADGES.filter((b) => !owned.includes(b.id) && b.earned(ctx));
}

export function badgeById(id: string): Badge | undefined {
  return BADGES.find((b) => b.id === id);
}
