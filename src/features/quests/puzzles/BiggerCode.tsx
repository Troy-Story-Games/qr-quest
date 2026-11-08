import { useMemo, useState } from 'react';
import { KidButton } from '@/components/KidButton';
import { QrView } from '@/components/qr/QrView';
import { encode, type QRBuild } from '@/core/qr';
import styles from '../QuestScreen.module.css';
import { pick, shuffle, type PuzzleProps } from './types';

// Pairs chosen to teach: longer text = bigger code, and numbers pack tighter than letters.
const PAIRS: Array<[string, string]> = [
  ['Hi', 'Hello there, my friend!'],
  ['Cat', 'The cat sat on the big red mat'],
  ['12345678901234567890', 'twenty letters here!'],
  ['Pizza', 'Pizza with extra cheese, please and thank you'],
  ['2026', 'I love dinosaurs and rockets!'],
  ['Go', 'Ready, set, go! Run as fast as you can!'],
  ['31415926535897932384', 'pi is a yummy number'],
];

export function BiggerCode({ answer, roundDone }: PuzzleProps) {
  const [[a, b]] = useState(() => shuffle(pick(PAIRS)));
  const builds = useMemo(() => [encode(a, { ecc: 'M' }), encode(b, { ecc: 'M' })] as const, [a, b]);
  const [revealed, setRevealed] = useState(false);
  const biggest = builds[0].size > builds[1].size ? 0 : 1;

  const choose = (i: number) => {
    if (revealed) return;
    setRevealed(true);
    const numericLesson = builds.some((x) => x.mode === 'numeric')
      ? ' Numbers squeeze in tighter than letters!'
      : '';
    if (i === biggest) roundDone(`Right! More to say means more dots.${numericLesson}`);
    else {
      answer(false, `Not quite! Look at the sizes.${numericLesson}`);
      setTimeout(() => roundDone(), 1800);
    }
  };

  return (
    <div className={styles.pair}>
      {builds.map((build: QRBuild, i) => (
        <div key={i} className={styles.pairItem}>
          <p className={styles.quote}>"{build.text}"</p>
          {revealed ? (
            <>
              <QrView modules={build.modules} label={`Code for ${build.text}`} />
              <strong>
                {build.size} × {build.size} dots
              </strong>
            </>
          ) : (
            <KidButton size="lg" onClick={() => choose(i)}>
              This one is bigger!
            </KidButton>
          )}
        </div>
      ))}
    </div>
  );
}
