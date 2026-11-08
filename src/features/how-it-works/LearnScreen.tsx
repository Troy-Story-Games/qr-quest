import { useEffect, useMemo, useRef, useState } from 'react';
import { useCurrentCode } from '@/app/currentCode';
import { Emoji } from '@/components/Emoji';
import { KidButton } from '@/components/KidButton';
import { Mascot } from '@/components/Mascot';
import { Page } from '@/components/Page';
import { Panel } from '@/components/Panel';
import { QrView } from '@/components/qr/QrView';
import { encode, type ModuleInfo, type QRBuild, type Region } from '@/core/qr';
import { useProgress } from '@/game/progressStore';
import { playSound } from '@/services/audio/sfx';
import { burstConfetti } from '@/services/effects/confetti';
import { charGroups } from './bits';
import { explainColor } from './colors';
import { DotInfo } from './DotInfo';
import styles from './LearnScreen.module.css';
import { LetterStrip } from './LetterStrip';
import { stepsFor } from './steps';

const ANIMATED: ReadonlySet<Region> = new Set(['data', 'ecc', 'remainder']);

function safeEncode(text: string, ecc: QRBuild['ecc']): QRBuild {
  try {
    return encode(text || 'Hello!', { ecc });
  } catch {
    return encode('Hello!', { ecc });
  }
}

export function LearnScreen() {
  const { text, ecc, setText } = useCurrentCode();
  const build = useMemo(() => safeEncode(text, ecc), [text, ecc]);
  const steps = useMemo(() => stepsFor(build), [build]);
  const groups = useMemo(() => charGroups(build), [build]);
  const modules = useMemo(() => build.info.flat(), [build]);

  const [stepIndex, setStepIndex] = useState(0);
  const [pathProgress, setPathProgress] = useState(0);
  const [selected, setSelected] = useState<ModuleInfo | null>(null);
  const [selectedChar, setSelectedChar] = useState<number | null>(null);
  const [showMasked, setShowMasked] = useState(true);
  const [realColors, setRealColors] = useState(false);
  const [draft, setDraft] = useState(text);
  const rewardedRef = useRef(false);
  const { addXp, bumpStat } = useProgress();

  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const stepOfRegion = useMemo(() => {
    const map = new Map<Region, number>();
    steps.forEach((s, i) => s.reveals.forEach((r) => map.set(r, i)));
    return map;
  }, [steps]);

  // Path range of the regions being revealed now, so they snake in one by one.
  const pathRange = useMemo(() => {
    const inStep = modules.filter((m) => step.reveals.includes(m.region) && m.pathIndex !== undefined);
    if (inStep.length === 0) return null;
    return [Math.min(...inStep.map((m) => m.pathIndex!)), Math.max(...inStep.map((m) => m.pathIndex!)) + 1];
  }, [modules, step]);

  useEffect(() => {
    if (!pathRange) return;
    const [from, to] = pathRange;
    const duration = Math.min(5000, Math.max(1500, (to - from) * 12));
    const start = performance.now();
    let lastSound = 0;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setPathProgress(from + Math.round(t * (to - from)));
      if (now - lastSound > 90 && t < 1) {
        lastSound = now;
        playSound('bit', { volume: 0.25, rate: 0.8 + t * 0.8 });
      }
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [pathRange]);

  useEffect(() => {
    if (step.id === 'mask') {
      const t = setTimeout(() => {
        setShowMasked(true);
        playSound('whoosh');
      }, 1200);
      return () => clearTimeout(t);
    }
    if (step.id === 'done' && !rewardedRef.current) {
      rewardedRef.current = true;
      burstConfetti();
      playSound('jingleWin');
      bumpStat('walkthroughs');
      addXp(30, 'Built a code!');
    }
  }, [step.id, addXp, bumpStat]);

  const isVisible = (m: ModuleInfo): boolean => {
    const at = stepOfRegion.get(m.region);
    if (at === undefined || at > stepIndex) return false;
    if (at === stepIndex && ANIMATED.has(m.region) && m.pathIndex !== undefined)
      return m.pathIndex < pathProgress;
    return true;
  };

  const maskApplied = (step.id === 'mask' && showMasked) || step.id === 'done';
  const fill = (x: number, y: number): string | null => {
    const m = build.info[y][x];
    if (!isVisible(m)) return null;
    const dark = maskApplied ? m.dark : m.rawDark;
    if (realColors && step.id === 'done') return dark ? '#1d1b2f' : null;
    return explainColor(m, dark);
  };

  const highlight = (x: number, y: number): boolean => {
    const m = build.info[y][x];
    if (selected && selected.x === x && selected.y === y) return true;
    if (selectedChar !== null && m.chars) return selectedChar >= m.chars[0] && selectedChar < m.chars[1];
    if (step.id === 'mask' && showMasked) return m.masked && isVisible(m);
    return false;
  };

  const go = (delta: number) => {
    const next = Math.max(0, Math.min(steps.length - 1, stepIndex + delta));
    if (next === stepIndex) return;
    setPathProgress(0);
    setSelected(null);
    setSelectedChar(null);
    setShowMasked(steps[next].id !== 'mask');
    setStepIndex(next);
    playSound(delta > 0 ? 'whoosh' : 'close');
  };

  const restart = (newText?: string) => {
    if (newText !== undefined) setText(newText);
    rewardedRef.current = false;
    setStepIndex(0);
    setPathProgress(0);
    setSelected(null);
    setSelectedChar(null);
  };

  const canInspect = stepIndex > 0;

  return (
    <Page title="How It Works" emoji="1f393" wide>
      <div className={styles.layout}>
        <Panel tone="purple" className={styles.codePanel}>
          <QrView
            modules={build.modules}
            fill={fill}
            background="#ffffff"
            showGrid={step.id !== 'done'}
            highlight={highlight}
            onModuleTap={
              canInspect
                ? (x, y) => {
                    const m = build.info[y][x];
                    if (!isVisible(m)) return;
                    playSound('pop');
                    setSelected(m);
                    setSelectedChar(null);
                    bumpStat('dotsInspected');
                  }
                : undefined
            }
            label="QR code being built"
          />
          <div className={styles.progressDots} aria-label={`Step ${stepIndex + 1} of ${steps.length}`}>
            {steps.map((s, i) => (
              <span key={s.id} className={i <= stepIndex ? styles.dotDone : ''} />
            ))}
          </div>
        </Panel>

        <div className={styles.side}>
          <h2>
            {stepIndex + 1}. {step.title}
          </h2>
          <Mascot pose={step.pose} says={step.says} size={100} />

          {step.id === 'message' && (
            <Panel>
              <label className={styles.draft}>
                <span>Try your own message (short ones are best!)</span>
                <div>
                  <input
                    type="text"
                    value={draft}
                    maxLength={40}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <KidButton onClick={() => restart(draft)} disabled={!draft || draft === text}>
                    Use it
                  </KidButton>
                </div>
              </label>
            </Panel>
          )}

          {(step.id === 'message' || step.id === 'letters' || step.id === 'done') && (
            <LetterStrip
              build={build}
              groups={groups}
              selected={selectedChar}
              onSelect={(i) => {
                setSelectedChar(i);
                setSelected(null);
              }}
              showBits={step.id !== 'message'}
            />
          )}

          {step.id === 'mask' && (
            <KidButton variant="secondary" onClick={() => setShowMasked((v) => !v)}>
              {showMasked ? 'Show before mixing' : 'Show after mixing'}
            </KidButton>
          )}

          {step.id === 'done' && (
            <KidButton variant="secondary" onClick={() => setRealColors((v) => !v)}>
              {realColors ? (
                <>
                  <Emoji code="1f3a8" /> Show colours
                </>
              ) : (
                'Show real code'
              )}
            </KidButton>
          )}

          {selected && <DotInfo module={selected} build={build} groups={groups} />}

          <div className={styles.nav}>
            <KidButton
              variant="secondary"
              size="lg"
              onClick={() => go(-1)}
              disabled={stepIndex === 0}
              sound={null}
            >
              Back
            </KidButton>
            {step.id === 'done' ? (
              <KidButton variant="good" size="lg" onClick={() => restart()}>
                Again!
              </KidButton>
            ) : (
              <KidButton size="lg" onClick={() => go(1)} sound={null}>
                Next
              </KidButton>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}
