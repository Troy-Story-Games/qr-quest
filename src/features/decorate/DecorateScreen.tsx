import { useEffect, useMemo, useRef, useState } from 'react';
import { useCurrentCode } from '@/app/currentCode';
import { Emoji } from '@/components/Emoji';
import { GameIcon } from '@/components/GameIcon';
import { KidButton } from '@/components/KidButton';
import { Mascot } from '@/components/Mascot';
import { Page } from '@/components/Page';
import { Panel } from '@/components/Panel';
import { downloadPng, scansOk } from '@/components/qr/qrExport';
import { QrView } from '@/components/qr/QrView';
import { encode } from '@/core/qr';
import { holdCelebrationsFor } from '@/game/celebrations';
import { useLevel, useProgress } from '@/game/progressStore';
import { COLOR_THEMES, DOT_SHAPES, STICKERS, type DotShape } from '@/game/unlocks';
import { playSound } from '@/services/audio/sfx';
import { burstConfetti } from '@/services/effects/confetti';
import styles from './DecorateScreen.module.css';

type ScanState = 'checking' | 'ok' | 'bad';

const rewarded = new Set<string>();

export function DecorateScreen() {
  const text = useCurrentCode((s) => s.text) || 'Hello!';
  const level = useLevel();
  const [themeId, setThemeId] = useState('grape');
  const [shape, setShape] = useState<DotShape>('round');
  const [sticker, setSticker] = useState<string | undefined>('1f31f');
  const [scanResult, setScanResult] = useState<{ key: string; ok: boolean } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { addXp, bumpStat } = useProgress();

  const theme = COLOR_THEMES.find((t) => t.id === themeId)!;
  // Stickers cover dots, so always use the strongest backup level when decorating.
  const build = useMemo(() => {
    try {
      return encode(text, { ecc: 'H' });
    } catch {
      return encode('Hello!', { ecc: 'H' });
    }
  }, [text]);

  const designKey = `${build.text}|${themeId}|${shape}|${sticker}`;
  const scan: ScanState = scanResult?.key !== designKey ? 'checking' : scanResult.ok ? 'ok' : 'bad';

  // Really decode the rendered picture, so fancy designs are proven to scan.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!svgRef.current) return;
      scansOk(svgRef.current)
        .then((result) => setScanResult({ key: designKey, ok: result === build.text }))
        .catch(() => setScanResult({ key: designKey, ok: false }));
    }, 350);
    return () => clearTimeout(timer);
  }, [designKey, build.text]);

  const isEye = (x: number, y: number) => build.info[y][x].region === 'finder';

  const finish = () => {
    if (!svgRef.current) return;
    void downloadPng(svgRef.current, 'my-fancy-qr');
    if (!rewarded.has(designKey)) {
      rewarded.add(designKey);
      holdCelebrationsFor(1500);
      bumpStat('decorations');
      addXp(15, 'Decorated a code!');
    }
    playSound('jingleWin');
    burstConfetti();
  };

  const says =
    scan === 'bad'
      ? 'Hmm, scanners might not read this one. Try a darker colour or a different dot shape!'
      : sticker
        ? 'The sticker covers some dots, but the backup dots fill them back in. That is why we use TONS of backup!'
        : 'Pick colours, dot shapes and a sticker. I will check that it still scans!';

  return (
    <Page title="Decorate" emoji="1f3a8" wide>
      <div className={styles.layout}>
        <Panel tone="pink" className={styles.codePanel}>
          <QrView
            ref={svgRef}
            modules={build.modules}
            quietZone={4}
            background={theme.light}
            shape={shape}
            sticker={sticker}
            eyeColor={shape === 'square' ? undefined : theme.eye}
            fill={(x, y, dark) => (dark ? (isEye(x, y) ? theme.eye : theme.dark) : null)}
            label={`Decorated QR code for: ${text}`}
          />
          <div className={`${styles.scan} ${styles[scan]}`}>
            {scan === 'checking' && 'Checking…'}
            {scan === 'ok' && (
              <>
                <GameIcon name="checkmark" /> It scans!
              </>
            )}
            {scan === 'bad' && (
              <>
                <GameIcon name="cross" /> Too fancy to scan
              </>
            )}
          </div>
          <KidButton size="lg" variant="good" onClick={finish} disabled={scan !== 'ok'} sound={null}>
            <Emoji code="2b50" /> Save my code
          </KidButton>
        </Panel>

        <div className={styles.side}>
          <Mascot pose="show" says={says} size={96} />

          <Panel>
            <h3>Colours</h3>
            <div className={styles.options}>
              {COLOR_THEMES.map((t) => {
                const locked = t.level > level;
                return (
                  <button
                    key={t.id}
                    className={`${styles.option} ${t.id === themeId ? styles.active : ''}`}
                    disabled={locked}
                    onClick={() => {
                      playSound('pop');
                      setThemeId(t.id);
                    }}
                  >
                    <span
                      className={styles.swatch}
                      style={{
                        background: `linear-gradient(135deg, ${t.dark} 50%, ${t.eye} 50%)`,
                        borderColor: t.light === '#ffffff' ? 'var(--ink)' : t.light,
                      }}
                    />
                    {locked ? <Locked level={t.level} /> : t.name}
                  </button>
                );
              })}
            </div>

            <h3>Dot shape</h3>
            <div className={styles.options}>
              {DOT_SHAPES.map((s) => {
                const locked = s.level > level;
                return (
                  <button
                    key={s.id}
                    className={`${styles.option} ${s.id === shape ? styles.active : ''}`}
                    disabled={locked}
                    onClick={() => {
                      playSound('pop');
                      setShape(s.id);
                    }}
                  >
                    <svg viewBox="0 0 3 1" width={60} height={20} aria-hidden>
                      {[0, 1, 2].map((i) => (
                        <ShapePreview key={i} shape={s.id} x={i} />
                      ))}
                    </svg>
                    {locked ? <Locked level={s.level} /> : s.name}
                  </button>
                );
              })}
            </div>

            <h3>Sticker</h3>
            <div className={styles.stickers}>
              <button
                className={`${styles.sticker} ${!sticker ? styles.active : ''}`}
                onClick={() => {
                  playSound('pop');
                  setSticker(undefined);
                }}
                aria-label="No sticker"
              >
                <GameIcon name="cross" size={24} dark />
              </button>
              {STICKERS.map((s) => {
                const locked = s.level > level;
                return (
                  <button
                    key={s.emoji}
                    className={`${styles.sticker} ${s.emoji === sticker ? styles.active : ''}`}
                    disabled={locked}
                    title={locked ? `Unlocks at level ${s.level}` : undefined}
                    onClick={() => {
                      playSound('pop');
                      setSticker(s.emoji);
                    }}
                  >
                    {locked ? <GameIcon name="locked" size={24} dark /> : <Emoji code={s.emoji} size={36} />}
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </Page>
  );
}

function Locked({ level }: { level: number }) {
  return (
    <span className={styles.locked}>
      <GameIcon name="locked" size={18} /> Lv {level}
    </span>
  );
}

function ShapePreview({ shape, x }: { shape: DotShape; x: number }) {
  const props = { fill: 'currentColor' };
  switch (shape) {
    case 'round':
      return <rect x={x + 0.08} y={0.08} width={0.84} height={0.84} rx={0.28} {...props} />;
    case 'dot':
      return <circle cx={x + 0.5} cy={0.5} r={0.42} {...props} />;
    case 'diamond':
      return <path d={`M${x + 0.5} 0L${x + 1} 0.5L${x + 0.5} 1L${x} 0.5Z`} {...props} />;
    case 'heart':
      return (
        <path
          d="M0.5 0.88C0.12 0.6 0.02 0.42 0.08 0.26C0.15 0.08 0.4 0.06 0.5 0.26C0.6 0.06 0.85 0.08 0.92 0.26C0.98 0.42 0.88 0.6 0.5 0.88Z"
          transform={`translate(${x} 0)`}
          {...props}
        />
      );
    default:
      return <rect x={x + 0.05} y={0.05} width={0.9} height={0.9} {...props} />;
  }
}
