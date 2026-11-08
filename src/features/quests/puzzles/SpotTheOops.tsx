import { useState } from 'react';
import { QrView } from '@/components/qr/QrView';
import { encode } from '@/core/qr';
import styles from '../QuestScreen.module.css';
import { pick, WORDS, type PuzzleProps } from './types';

export function SpotTheOops({ round, answer, roundDone }: PuzzleProps) {
  const [{ modules, target }] = useState(() => {
    const build = encode(pick(WORDS), { ecc: 'M' });
    // Early rounds break the ruler lines (easier to see), later rounds break an eye.
    const region = round < 3 ? 'timing' : 'finder';
    const t = pick(build.info.flat().filter((m) => m.region === region));
    const broken = build.modules.map((row, y) => row.map((d, x) => (x === t.x && y === t.y ? !d : d)));
    return { modules: broken, target: t };
  });

  return (
    <div className={styles.board}>
      <QrView
        modules={modules}
        onModuleTap={(x, y) => {
          if (x === target.x && y === target.y) {
            roundDone(
              target.region === 'timing'
                ? 'Found it! Rulers always go dark, light, dark, light.'
                : 'Found it! Eyes always look exactly the same.',
            );
          } else {
            answer(
              false,
              round < 3
                ? 'Not that one. Check the dotted ruler lines between the eyes!'
                : 'Not that one. Look closely at the eyes!',
            );
          }
        }}
        label="Find the wrong dot"
      />
    </div>
  );
}
