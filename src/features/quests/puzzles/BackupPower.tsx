import { useState } from 'react';
import { KidButton } from '@/components/KidButton';
import { QrView } from '@/components/qr/QrView';
import { decodeMatrix, ECC_INFO, encode, type EccLevel } from '@/core/qr';
import styles from '../QuestScreen.module.css';
import { pick, WORDS, type PuzzleProps } from './types';

const LEVELS: EccLevel[] = ['L', 'M', 'Q', 'H'];
const SPLAT = '#7c3aed';

/** Builds a round where the answer is a fair, checkable yes/no. */
function makeRound() {
  const ecc = pick(LEVELS);
  const build = encode(`${pick(WORDS)} ${pick(WORDS)} ${pick(WORDS)}`, { ecc });
  const { size } = build;
  // A round splat away from the eyes, sized so some levels survive and some don't.
  const radius = 1.5 + Math.random() * 2.5;
  const cx = 9 + Math.random() * (size - 18);
  const cy = 9 + Math.random() * (size - 18);
  const splat = new Set<number>();
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= radius && build.info[y][x].region !== 'finder')
        splat.add(y * size + x);
    }
  }
  const damaged = build.modules.map((row, y) => row.map((d, x) => d && !splat.has(y * size + x)));
  return { build, splat, survives: decodeMatrix(damaged) === build.text, ecc };
}

export function BackupPower({ answer, roundDone }: PuzzleProps) {
  const [{ build, splat, survives, ecc }] = useState(makeRound);
  const [done, setDone] = useState(false);
  const info = ECC_INFO[ecc];
  const percent = Math.round((splat.size / (build.size * build.size)) * 100);

  const choose = (guess: boolean) => {
    if (done) return;
    setDone(true);
    const why = survives
      ? `The ${info.name.toLowerCase()} backup dots fixed the ${percent}% splat!`
      : `The splat covered ${percent}%. That was too much for ${info.name.toLowerCase()} backup dots.`;
    if (guess === survives) roundDone(`Correct! ${why}`);
    else {
      answer(false, why);
      setTimeout(() => roundDone(), 2200);
    }
  };

  return (
    <div className={styles.board}>
      <p className={styles.quote}>
        Backup level: <strong>{info.name}</strong> (fixes about {info.percent}%)
      </p>
      <QrView
        modules={build.modules}
        fill={(x, y, dark) => (splat.has(y * build.size + x) ? SPLAT : dark ? '#1d1b2f' : null)}
        label="A splatted QR code"
      />
      <div className={styles.choices}>
        <KidButton size="lg" variant="good" onClick={() => choose(true)} disabled={done}>
          It still scans!
        </KidButton>
        <KidButton size="lg" variant="danger" onClick={() => choose(false)} disabled={done}>
          It's broken!
        </KidButton>
      </div>
    </div>
  );
}
