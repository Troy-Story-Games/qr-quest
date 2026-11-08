import { useState } from 'react';
import { REGION_COLORS, tint } from '@/components/qr/regions';
import { QrView } from '@/components/qr/QrView';
import {
  alignmentCentreOf,
  alignmentPatternPositions,
  cornerOf,
  encode,
  rotateGrid,
  type ModuleInfo,
} from '@/core/qr';
import styles from '../QuestScreen.module.css';
import { pick, WORDS, type PuzzleProps } from './types';

/** Code size per round: bigger codes bring little eyes to find too. */
const VERSIONS = [1, 3, 5, 7];

/** Which eye (big or little) a module is part of, or null. */
function eyeOf(m: ModuleInfo, size: number, version: number): string | null {
  if (m.region === 'finder' || m.region === 'separator') return `big-${cornerOf(m.x, m.y, size)}`;
  if (m.region === 'alignment') return `little-${alignmentCentreOf(m.x, m.y, version).join('-')}`;
  return null;
}

function makeRound(round: number) {
  const version = VERSIONS[Math.min(round, VERSIONS.length - 1)];
  const build = encode(`${pick(WORDS)} ${pick(WORDS)}`, { ecc: 'M', minVersion: version });
  // Spin the code so the eyes aren't always in the same corners (scanners don't mind!).
  const turns = round === 0 ? 0 : 1 + Math.floor(Math.random() * 3);
  const positions = alignmentPatternPositions(build.version).length;
  const littleEyes = positions === 0 ? 0 : positions * positions - 3;
  return {
    build,
    modules: rotateGrid(build.modules, turns),
    info: rotateGrid(build.info, turns),
    total: 3 + littleEyes,
  };
}

export function FindEyes({ round, answer, roundDone }: PuzzleProps) {
  const [{ build, modules, info, total }] = useState(() => makeRound(round));
  const [found, setFound] = useState<string[]>([]);
  const hasLittle = total > 3;

  return (
    <div className={styles.board}>
      <p className={styles.quote}>
        {hasLittle ? `Find all ${total} eyes: 3 big and ${total - 3} little!` : 'Find the 3 big eyes!'} Found:{' '}
        {found.length} / {total}
      </p>
      <QrView
        modules={modules}
        fill={(x, y, dark) => {
          const m = info[y][x];
          const eye = eyeOf(m, build.size, build.version);
          if (eye && found.includes(eye)) {
            const color = m.region === 'alignment' ? REGION_COLORS.alignment : REGION_COLORS.finder;
            return dark ? color : tint(color, 0.8);
          }
          return dark ? '#1d1b2f' : null;
        }}
        onModuleTap={(x, y) => {
          const eye = eyeOf(info[y][x], build.size, build.version);
          if (!eye) {
            answer(
              false,
              hasLittle
                ? 'Not an eye. Look for squares with a dot in the middle, big AND little!'
                : 'That is not an eye. Look for the big squares!',
            );
            return;
          }
          if (found.includes(eye)) return;
          const next = [...found, eye];
          setFound(next);
          if (next.length === total) {
            roundDone(
              hasLittle
                ? 'All of them! Little eyes help when a big code is bent or tilted.'
                : 'Scanners look for these eyes first.',
            );
          } else {
            answer(
              true,
              eye.startsWith('little')
                ? 'A little eye! Big codes need those.'
                : `An eye! ${total - next.length} to go.`,
            );
          }
        }}
        label="Find the eyes"
      />
    </div>
  );
}
