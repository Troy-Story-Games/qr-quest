import { BackupPower } from './BackupPower';
import { BiggerCode } from './BiggerCode';
import { BuildAQr } from './BuildAQr';
import { FindEyes } from './FindEyes';
import { SpotTheOops } from './SpotTheOops';
import type { PuzzleDefinition } from './types';
import { WhichLetter } from './WhichLetter';

/** Puzzle implementation for each quest id in `game/quests.ts`. */
export const PUZZLES: Record<string, PuzzleDefinition> = {
  'find-eyes': {
    rounds: 3,
    intro: 'Tap the three big EYES in the corners of the code!',
    Component: FindEyes,
  },
  'which-letter': {
    rounds: 5,
    intro: 'One dot is glowing. Which letter of the word is it part of?',
    Component: WhichLetter,
  },
  'spot-the-oops': {
    rounds: 5,
    intro: 'Oops! One dot in the eyes or rulers is the wrong colour. Tap it!',
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
  'build-a-qr': {
    rounds: 2,
    intro: 'The eyes and rulers fell off! Pick a piece, then tap where it belongs.',
    Component: BuildAQr,
  },
};
