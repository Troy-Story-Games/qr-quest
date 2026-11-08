import { motion } from 'motion/react';
import { useMemo, useRef, useState } from 'react';
import { Emoji } from '@/components/Emoji';
import { KidButton } from '@/components/KidButton';
import { Mascot, type MascotPose } from '@/components/Mascot';
import { Panel } from '@/components/Panel';
import { RegionLegend } from '@/components/qr/RegionLegend';
import { PART_INFO, tint, type PartKey } from '@/components/qr/regions';
import { QrView } from '@/components/qr/QrView';
import { decodeMatrix, MASK_DESCRIPTIONS, type Piece, type QRBuild } from '@/core/qr';
import { playSound } from '@/services/audio/sfx';
import styles from './BuilderBoard.module.css';
import { PART_OF_KIND, pieceColor, useBuilder } from './useBuilder';

/** Empty slots look like holes, clearly different from pale built dots. */
const EMPTY = '#cfd7ea';

interface BuilderBoardProps {
  build: QRBuild;
  /** Parts the kid places; everything else starts already built. */
  parts: PartKey[];
  intro: string;
  /** Called once the code is finished, mixed up and proven to scan. */
  onFinish: (mistakes: number) => void;
}

/** Build a QR code by hand: pick a piece from the box, tap where it glows. */
export function BuilderBoard({ build, parts, intro, onFinish }: BuilderBoardProps) {
  const b = useBuilder(build, parts);
  const [says, setSays] = useState<{ text: string; pose: MascotPose }>({ text: intro, pose: 'talk' });
  const [masked, setMasked] = useState(false);
  const [scans, setScans] = useState(false);
  const explained = useRef(new Set<PartKey>());
  const finished = useRef(false);
  const boardRef = useRef<HTMLDivElement>(null);

  // Parts that appear in this code, for the colour key.
  const legendParts = useMemo(
    () =>
      (Object.keys(PART_INFO) as PartKey[]).filter((k) => b.pieces.some((p) => PART_OF_KIND[p.kind] === k)),
    [b.pieces],
  );

  const pick = (piece: Piece) => {
    playSound('tap');
    b.select(b.selected?.id === piece.id ? null : piece.id);
    // On narrow screens the box is below the board; bring the board back into view.
    const rect = boardRef.current?.getBoundingClientRect();
    if (rect && (rect.top < 0 || rect.bottom > window.innerHeight)) {
      boardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const part = PART_OF_KIND[piece.kind];
    if (!explained.current.has(part)) {
      explained.current.add(part);
      setSays({
        text: `${PART_INFO[part].name}: ${PART_INFO[part].job} Tap the glowing spot!`,
        pose: 'show',
      });
    } else {
      setSays({ text: `Tap where the ${piece.label} goes. It's glowing!`, pose: 'talk' });
    }
  };

  const tap = (x: number, y: number) => {
    const result = b.place(x, y);
    if (result === 'placed') {
      playSound('pop', { rate: 0.9 + Math.random() * 0.4 });
      const left = b.tray.length - 1;
      setSays(
        left === 0
          ? { text: 'All the pieces are in! Now press "Mix it up!"', pose: 'cheer' }
          : { text: `Snap! ${left} piece${left === 1 ? '' : 's'} to go.`, pose: 'cheer2' },
      );
    } else if (result === 'wrong') {
      playSound('error');
      setSays({ text: 'That spot is for a different piece. Look for the glowing spot!', pose: 'hurt' });
    } else if (result === 'noSelection') {
      playSound('tap');
      setSays({ text: 'First pick a piece from the box!', pose: 'think' });
    }
  };

  const mixItUp = () => {
    setMasked(true);
    playSound('whoosh');
    setSays({ text: `Mixing it up with ${MASK_DESCRIPTIONS[build.mask]}...`, pose: 'think' });
    window.setTimeout(() => {
      const ok = decodeMatrix(build.modules) === build.text;
      setScans(ok);
      if (ok && !finished.current) {
        finished.current = true;
        setSays({ text: `It scans! It says "${build.text}". You built a real QR code!`, pose: 'cheer' });
        onFinish(b.mistakes);
      }
    }, 900);
  };

  const fill = (x: number, y: number): string | null => {
    const piece = b.pieceAt(x, y);
    const m = build.info[y][x];
    if (b.isPlaced(piece)) {
      if (masked) return m.dark ? '#1d1b2f' : null;
      const color = pieceColor(piece);
      return m.rawDark ? color : tint(color, 0.82);
    }
    // Empty slot: glow in the selected piece's colour if it fits here.
    if (b.isTarget(piece) && b.selected) return tint(pieceColor(b.selected), 0.45);
    return EMPTY;
  };

  return (
    <div className={styles.layout}>
      <Panel tone="purple" className={styles.boardPanel}>
        <div ref={boardRef} className={styles.boardWrap}>
          <QrView
            modules={build.modules}
            fill={fill}
            showGrid={!masked}
            onModuleTap={b.done ? undefined : tap}
            label="QR code being built by hand"
          />
        </div>
        {b.done && !masked && (
          <KidButton size="lg" variant="good" onClick={mixItUp} sound={null}>
            <Emoji code="1f3a8" /> Mix it up!
          </KidButton>
        )}
        {scans && (
          <motion.div className={styles.scans} initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <Emoji code="1f4f7" /> It scans!
          </motion.div>
        )}
      </Panel>

      <div className={styles.side}>
        <Mascot pose={says.pose} says={says.text} size={90} />
        {!b.done && (
          <Panel>
            <h3 className={styles.trayTitle}>
              Pieces box <small>({b.tray.length} left)</small>
            </h3>
            <div className={styles.tray}>
              {b.tray.map((piece) => (
                <motion.button
                  key={piece.id}
                  layout
                  className={`${styles.piece} ${b.selected?.id === piece.id ? styles.selected : ''}`}
                  style={{ '--piece': pieceColor(piece) } as React.CSSProperties}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => pick(piece)}
                  aria-pressed={b.selected?.id === piece.id}
                >
                  <PiecePreview piece={piece} build={build} />
                  <span className={piece.kind === 'letter' ? styles.letter : undefined}>{piece.label}</span>
                </motion.button>
              ))}
            </div>
          </Panel>
        )}
        <RegionLegend parts={legendParts} active={b.selected ? PART_OF_KIND[b.selected.kind] : undefined} />
      </div>
    </div>
  );
}

/** A small drawing of a piece's own dots, in its colour. */
function PiecePreview({ piece, build }: { piece: Piece; build: QRBuild }) {
  const xs = piece.cells.map(([x]) => x);
  const ys = piece.cells.map(([, y]) => y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX + 1;
  const h = Math.max(...ys) - minY + 1;
  const color = pieceColor(piece);
  return (
    <svg viewBox={`-0.5 -0.5 ${w + 1} ${h + 1}`} className={styles.preview} aria-hidden>
      {piece.cells.map(([x, y]) => (
        <rect
          key={`${x},${y}`}
          x={x - minX}
          y={y - minY}
          width={1}
          height={1}
          fill={build.info[y][x].rawDark ? color : tint(color, 0.8)}
        />
      ))}
    </svg>
  );
}
