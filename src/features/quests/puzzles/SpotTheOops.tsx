import { useState } from 'react';
import { RegionLegend } from '@/components/qr/RegionLegend';
import { explainColor, REGION_COLORS, tint, type PartKey } from '@/components/qr/regions';
import { QrView } from '@/components/qr/QrView';
import { encode, type Region } from '@/core/qr';
import styles from '../QuestScreen.module.css';
import { pick, WORDS, type PuzzleProps } from './types';

type Oops = 'timing' | 'finder' | 'fakeEye' | 'alignment';

/** One challenge type per round, then a surprise. */
const ROUNDS: Oops[] = ['timing', 'finder', 'fakeEye', 'alignment'];

const HINTS: Record<Oops, string> = {
  timing: 'Check the yellow rulers. They always go dark, light, dark, light!',
  finder: 'Look closely at the red eyes. They are all exactly the same.',
  fakeEye: 'Count the big eyes. How many should a QR code have?',
  alignment: 'Look at the orange little eye. It should be a perfect square ring.',
};

const FOUND: Record<Oops, string> = {
  timing: 'Found it! Rulers always go dark, light, dark, light.',
  finder: 'Found it! All three eyes must look exactly the same.',
  fakeEye: 'Yes! Real QR codes only have 3 big eyes. The empty corner tells the scanner which way is up!',
  alignment: 'Found it! Little eyes are a perfect ring with a dot in the middle.',
};

const LEGEND: PartKey[] = [
  'eyes',
  'rulers',
  'littleEyes',
  'settings',
  'label',
  'message',
  'filler',
  'backup',
];

function makeRound(round: number) {
  const oops = round < ROUNDS.length ? ROUNDS[round] : pick(ROUNDS);
  // The fake eye needs the bottom-right corner free, which only the smallest code has.
  const build = encode(pick(WORDS), { ecc: 'M', minVersion: oops === 'alignment' ? 2 : 1 });
  const { size } = build;
  const modules = build.modules.map((row) => [...row]);
  let target: (x: number, y: number) => boolean;

  if (oops === 'fakeEye') {
    const start = size - 7;
    for (let dy = 0; dy < 7; dy++) {
      for (let dx = 0; dx < 7; dx++) {
        modules[start + dy][start + dx] = Math.max(Math.abs(dx - 3), Math.abs(dy - 3)) !== 2;
      }
    }
    target = (x, y) => x >= start && y >= start;
  } else {
    const region: Region = oops;
    const spot = pick(build.info.flat().filter((m) => m.region === region));
    modules[spot.y][spot.x] = !modules[spot.y][spot.x];
    target = (x, y) => x === spot.x && y === spot.y;
  }
  return { build, modules, oops, target };
}

export function SpotTheOops({ round, answer, roundDone }: PuzzleProps) {
  const [{ build, modules, oops, target }] = useState(() => makeRound(round));
  const legend = LEGEND.filter((p) => p !== 'littleEyes' || build.version >= 2);

  return (
    <div className={styles.board}>
      <QrView
        modules={modules}
        showGrid
        fill={(x, y) => {
          const dark = modules[y][x];
          // The fake eye is painted like a real eye, so it really looks like it belongs.
          if (oops === 'fakeEye' && target(x, y)) {
            return dark ? REGION_COLORS.finder : tint(REGION_COLORS.finder, 0.8);
          }
          return explainColor(build.info[y][x], dark);
        }}
        onModuleTap={(x, y) => {
          if (target(x, y)) roundDone(FOUND[oops]);
          else answer(false, `Not that one. ${HINTS[oops]}`);
        }}
        label="Find the wrong dot"
      />
      <RegionLegend parts={legend} />
    </div>
  );
}
