/** Quest catalogue. The puzzles themselves live in `features/quests`. */
export interface QuestInfo {
  id: string;
  title: string;
  blurb: string;
  /** Twemoji code point. */
  emoji: string;
  /** Player level needed to play. */
  level: number;
}

export const QUESTS: QuestInfo[] = [
  {
    id: 'find-eyes',
    title: 'Find the Eyes',
    blurb: 'Find every eye, big and little.',
    emoji: '1f440',
    level: 1,
  },
  {
    id: 'which-letter',
    title: 'Which Letter?',
    blurb: 'A dot lights up. Which letter is it part of?',
    emoji: '1f524',
    level: 1,
  },
  {
    id: 'spot-the-oops',
    title: 'Spot the Oops',
    blurb: 'Something is wrong. Find the mistake!',
    emoji: '1f50d',
    level: 2,
  },
  {
    id: 'bigger-code',
    title: 'Bigger or Smaller?',
    blurb: 'Which message makes the bigger code?',
    emoji: '1f4cf',
    level: 2,
  },
  {
    id: 'backup-power',
    title: 'Backup Power',
    blurb: 'Pick the right backup level to survive the splat!',
    emoji: '1f6e1',
    level: 3,
  },
  {
    id: 'build-a-qr',
    title: 'Build-a-QR',
    blurb: 'Rebuild a code piece by piece. 6 levels!',
    emoji: '1f9e9',
    level: 3,
  },
];

export const QUEST_XP_PER_STAR = 15;
export const DAILY_BONUS_XP = 40;

/** Stars from mistakes: 0 → 3 stars, 1-2 → 2 stars, more → 1 star. */
export function starsForMistakes(mistakes: number): number {
  if (mistakes === 0) return 3;
  if (mistakes <= 2) return 2;
  return 1;
}

/** Same quest for everyone on a given day, so the daily challenge feels special. */
export function dailyQuestId(day: string): string {
  let hash = 0;
  for (const c of day) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return QUESTS[hash % QUESTS.length].id;
}
