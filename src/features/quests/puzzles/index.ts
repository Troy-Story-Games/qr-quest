import { BackupPower } from './BackupPower';
import { BiggerCode } from './BiggerCode';
import { FindEyes } from './FindEyes';
import { SpotTheOops } from './SpotTheOops';
import type { PuzzleDefinition } from './types';
import { WhichLetter } from './WhichLetter';

/** Puzzle implementation for each quest id in `game/quests.ts`. */
export const PUZZLES: Record<string, PuzzleDefinition> = {
  'find-eyes': {
    rounds: 4,
    intro:
      'Tap the EYES of the code! Watch out: codes can be turned around, and big codes have little eyes too.',
    Component: FindEyes,
  },
  'which-letter': {
    rounds: 5,
    intro: 'One dot is glowing. Which letter of the word is it part of?',
    Component: WhichLetter,
  },
  'spot-the-oops': {
    rounds: 5,
    intro: 'Oops! Something in this code is wrong. Use the colour key and tap the mistake!',
    Component: SpotTheOops,
  },
  'bigger-code': {
    rounds: 5,
    intro: 'Which message will make the BIGGER QR code? Think about it, then tap!',
    Component: BiggerCode,
  },
  'backup-power': {
    rounds: 5,
    intro: 'SPLAT! Paint landed on the code. Will the backup dots save it?',
    Component: BackupPower,
  },
};
