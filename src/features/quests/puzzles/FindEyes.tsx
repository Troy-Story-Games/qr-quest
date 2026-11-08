import { useState } from 'react';
import { QrView } from '@/components/qr/QrView';
import { encode } from '@/core/qr';
import styles from '../QuestScreen.module.css';
import { pick, WORDS, type PuzzleProps } from './types';

/** Which corner eye (0-2) a finder module belongs to. */
function eyeOf(x: number, y: number, size: number): number {
  if (x < 8 && y < 8) return 0;
  if (x >= size - 8) return 1;
  return 2;
}

export function FindEyes({ answer, roundDone }: PuzzleProps) {
  const [build] = useState(() => encode(pick(WORDS) + ' ' + pick(WORDS), { ecc: 'M' }));
  const [found, setFound] = useState<number[]>([]);

  return (
    <div className={styles.board}>
      <QrView
        modules={build.modules}
        fill={(x, y, dark) => {
          const m = build.info[y][x];
          if (m.region === 'finder' && found.includes(eyeOf(x, y, build.size)))
            return dark ? '#ff4d6d' : '#ffe1e8';
          return dark ? '#1d1b2f' : null;
        }}
        onModuleTap={(x, y) => {
          const m = build.info[y][x];
          if (m.region !== 'finder' && m.region !== 'separator') {
            answer(false, 'That is not an eye. Look for the big squares in the corners!');
            return;
          }
          const eye = eyeOf(x, y, build.size);
          if (found.includes(eye)) return;
          const next = [...found, eye];
          setFound(next);
          answer(true, ['One eye!', 'Two eyes!', 'All three eyes!'][next.length - 1]);
          if (next.length === 3) roundDone('Scanners look for these eyes first.');
        }}
        label="Find the three eyes"
      />
    </div>
  );
}
