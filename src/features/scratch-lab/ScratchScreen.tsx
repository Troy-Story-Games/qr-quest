import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useRef, useState } from 'react';
import { useCurrentCode } from '@/app/currentCode';
import { EccPicker } from '@/components/EccPicker';
import { Emoji } from '@/components/Emoji';
import { KidButton } from '@/components/KidButton';
import { Mascot, type MascotPose } from '@/components/Mascot';
import { Page } from '@/components/Page';
import { Panel } from '@/components/Panel';
import { QrView } from '@/components/qr/QrView';
import { decodeMatrix, ECC_INFO, encode, type EccLevel } from '@/core/qr';
import { useProgress } from '@/game/progressStore';
import { playSound } from '@/services/audio/sfx';
import styles from './ScratchScreen.module.css';

const SCRATCH_COLOR = '#f3d9a4';

export function ScratchScreen() {
  const { text, ecc, setEcc } = useCurrentCode();
  const build = useMemo(() => {
    try {
      return encode(text || 'Hello!', { ecc });
    } catch {
      return encode('Hello!', { ecc });
    }
  }, [text, ecc]);
  const [scratched, setScratched] = useState<Set<number>>(new Set());
  const [broken, setBroken] = useState(false);
  const [best, setBest] = useState<Partial<Record<EccLevel, number>>>({});
  const lastScratchSound = useRef(0);
  const { addXp, recordBest } = useProgress();

  const total = build.size * build.size;
  const percent = Math.round((scratched.size / total) * 100);
  const eyeHit = [...scratched].some(
    (i) => build.info[Math.floor(i / build.size)][i % build.size].region === 'finder',
  );

  const reset = () => {
    setScratched(new Set());
    setBroken(false);
  };

  const scratch = (x: number, y: number) => {
    if (broken) return;
    const next = new Set(scratched);
    // A small plus-shaped brush feels like a fingertip.
    for (const [dx, dy] of [
      [0, 0],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < build.size && ny < build.size) next.add(ny * build.size + nx);
    }
    if (next.size === scratched.size) return;
    setScratched(next);

    const now = performance.now();
    if (now - lastScratchSound.current > 120) {
      lastScratchSound.current = now;
      playSound('scratch', { volume: 0.35, rate: 0.9 + Math.random() * 0.3 });
    }

    const damaged = build.modules.map((row, yy) => row.map((d, xx) => d && !next.has(yy * build.size + xx)));
    if (decodeMatrix(damaged) === null) {
      setBroken(true);
      playSound('error');
      const score = Math.round((scratched.size / total) * 100);
      if (score > (best[ecc] ?? 0)) setBest((b) => ({ ...b, [ecc]: score }));
      recordBest('scratchBest', score);
      if (score >= 3) addXp(5 + Math.floor(score / 2), `Scratched ${score}%!`);
    }
  };

  let pose: MascotPose = 'idle';
  let says = 'Rub your finger over the code to scratch it. How much can you scratch before it stops working?';
  if (broken) {
    pose = 'hurt';
    says = eyeHit
      ? `Oh no, you scratched an EYE! Without its eyes the scanner can't find the code. You got to ${percent}%.`
      : `It broke at ${percent}%! The backup dots couldn't fix that much. Try a higher backup level!`;
  } else if (percent > 0) {
    pose = percent > 10 ? 'cheer' : 'show';
    says = `Still works! ${percent}% scratched. The backup dots are fixing it!`;
  }

  return (
    <Page title="Scratch Lab" emoji="1f9ea" wide>
      <div className={styles.layout}>
        <Panel tone="yellow" className={styles.codePanel}>
          <QrView
            modules={build.modules}
            quietZone={3}
            fill={(x, y, dark) =>
              scratched.has(y * build.size + x) ? SCRATCH_COLOR : dark ? '#1d1b2f' : null
            }
            onModuleDrag={scratch}
            label="Scratch this code"
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={broken ? 'broken' : 'ok'}
              className={`${styles.status} ${broken ? styles.bad : styles.good}`}
              initial={{ scale: 0.5, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 14 }}
            >
              <Emoji code={broken ? '1f6e1' : '1f4f7'} size={36} />
              {broken ? 'BROKEN!' : 'Still scans!'}
            </motion.div>
          </AnimatePresence>
        </Panel>

        <div className={styles.side}>
          <Mascot pose={pose} says={says} size={100} />

          <Panel>
            <div className={styles.meter}>
              <span>Scratched</span>
              <div className={styles.track}>
                <motion.div className={styles.fill} animate={{ width: `${Math.min(100, percent * 2.5)}%` }} />
              </div>
              <strong>{percent}%</strong>
            </div>
            <p className={styles.label}>Backup level</p>
            <EccPicker
              value={ecc}
              onChange={(level) => {
                setEcc(level);
                reset();
              }}
            />
            <p className={styles.label}>Your best scores</p>
            <div className={styles.records}>
              {(Object.keys(ECC_INFO) as EccLevel[]).map((level) => (
                <div key={level} className={level === ecc ? styles.current : ''}>
                  <small>{ECC_INFO[level].name}</small>
                  <strong>{best[level] !== undefined ? `${best[level]}%` : '–'}</strong>
                </div>
              ))}
            </div>
          </Panel>

          <KidButton size="lg" variant={broken ? 'good' : 'secondary'} onClick={reset}>
            {broken ? 'Fix it & try again' : 'Start over'}
          </KidButton>
        </div>
      </div>
    </Page>
  );
}
