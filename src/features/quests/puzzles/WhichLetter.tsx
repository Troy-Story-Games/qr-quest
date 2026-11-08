import { useState } from 'react';
import { KidButton } from '@/components/KidButton';
import { QrView } from '@/components/qr/QrView';
import { encode } from '@/core/qr';
import { explainColor, letterColor } from '@/components/qr/regions';
import styles from '../QuestScreen.module.css';
import { pick, type PuzzleProps } from './types';

const LETTER_WORDS = ['Cat', 'Dog', 'Frog', 'Star', 'Moon', 'Fish', 'Cake', 'Bike', 'Duck', 'Lion'];

export function WhichLetter({ round, answer, roundDone }: PuzzleProps) {
  // Later rounds hide the colour hints so the kid has to remember the zigzag.
  const colourHints = round < 3;
  const [{ build, target, word }] = useState(() => {
    const w = pick(LETTER_WORDS);
    const b = encode(w, { ecc: 'L', mode: 'byte' });
    const candidates = b.info.flat().filter((m) => m.role === 'char');
    return { build: b, word: [...w], target: pick(candidates) };
  });
  const targetChar = target.chars![0];

  return (
    <div className={styles.board}>
      <QrView
        modules={build.modules}
        fill={(x, y, dark) => {
          const m = build.info[y][x];
          if (colourHints && m.region === 'data') return explainColor(m, m.dark);
          return dark ? '#1d1b2f' : null;
        }}
        highlight={(x, y) => x === target.x && y === target.y}
        label="Which letter is the glowing dot part of?"
      />
      <div className={styles.choices}>
        {word.map((c, i) => (
          <KidButton
            key={i}
            size="lg"
            style={colourHints ? { background: letterColor(i), boxShadow: '0 6px 0 #2b2147' } : undefined}
            onClick={() => {
              if (i === targetChar) roundDone(`Yes! That dot is part of "${c}".`);
              else
                answer(
                  false,
                  `Not "${c}". ${colourHints ? 'Match the colours!' : 'Remember: the letters zigzag up from the bottom-right!'}`,
                );
            }}
          >
            {c}
          </KidButton>
        ))}
      </div>
    </div>
  );
}
