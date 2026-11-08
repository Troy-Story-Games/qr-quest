import type { PartKey } from '@/components/qr/regions';

export interface BuildLevel {
  level: number;
  title: string;
  /** Parts the kid places by hand; the rest start already built. */
  parts: PartKey[];
  /** Smallest code size, so later levels include little eyes. */
  minVersion: number;
  words: string[];
  intro: string;
}

const SHORT = ['Hi!', 'Cat', 'Dog', 'Sun', 'Wow', 'Yay', 'Fox', 'Pig'];

/** The Build-a-QR level map: each level adds more parts to build. */
export const BUILD_LEVELS: BuildLevel[] = [
  {
    level: 1,
    title: 'Eyes',
    parts: ['eyes'],
    minVersion: 1,
    words: SHORT,
    intro: 'The three big eyes fell off! Pick one from the box, then tap where it glows.',
  },
  {
    level: 2,
    title: 'Rulers',
    parts: ['eyes', 'rulers'],
    minVersion: 1,
    words: SHORT,
    intro: 'Now the rulers are missing too. Eyes first, then the dotted rulers between them!',
  },
  {
    level: 3,
    title: 'Little Eyes',
    parts: ['eyes', 'rulers', 'littleEyes'],
    minVersion: 2,
    words: SHORT,
    intro: 'A bigger code! Bigger codes have a little eye as well.',
  },
  {
    level: 4,
    title: 'Settings',
    parts: ['eyes', 'rulers', 'littleEyes', 'settings'],
    minVersion: 2,
    words: SHORT,
    intro: 'Now add the settings strips that tell the scanner how the code was made.',
  },
  {
    level: 5,
    title: 'Message',
    parts: ['eyes', 'rulers', 'littleEyes', 'settings', 'label', 'message'],
    minVersion: 2,
    words: SHORT,
    intro: 'Time for the message! Each letter has its own colour. Put them in where they glow.',
  },
  {
    level: 6,
    title: 'Everything!',
    parts: ['eyes', 'rulers', 'littleEyes', 'settings', 'label', 'message', 'filler', 'backup'],
    minVersion: 2,
    words: SHORT,
    intro: 'The whole code, from nothing! Then mix it up to make it scan.',
  },
];

export function isBuildLevelUnlocked(level: number, stars: Record<number, number>): boolean {
  return level === 1 || (stars[level - 1] ?? 0) > 0;
}

/** The first level not finished yet (or the last level). */
export function nextBuildLevel(stars: Record<number, number>): number {
  return BUILD_LEVELS.find((l) => !stars[l.level])?.level ?? BUILD_LEVELS.length;
}
