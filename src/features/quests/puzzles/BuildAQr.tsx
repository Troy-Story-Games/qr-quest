import { motion } from 'motion/react';
import { useState } from 'react';
import { QrView } from '@/components/qr/QrView';
import { encode, type ModuleInfo } from '@/core/qr';
import { REGION_COLORS } from '@/features/how-it-works/colors';
import { playSound } from '@/services/audio/sfx';
import styles from '../QuestScreen.module.css';
import { pick, WORDS, type PuzzleProps } from './types';

type Zone = 'eyeTL' | 'eyeTR' | 'eyeBL' | 'rulerH' | 'rulerV';
type PieceKind = 'eye' | 'rulerH' | 'rulerV';

const PIECES: Array<{ id: string; kind: PieceKind; label: string }> = [
  { id: 'e1', kind: 'eye', label: 'Eye' },
  { id: 'e2', kind: 'eye', label: 'Eye' },
  { id: 'e3', kind: 'eye', label: 'Eye' },
  { id: 'rh', kind: 'rulerH', label: 'Ruler ↔' },
  { id: 'rv', kind: 'rulerV', label: 'Ruler ↕' },
];

function zoneOf(m: ModuleInfo, size: number): Zone | null {
  if (m.region === 'finder' || m.region === 'separator') {
    if (m.x < 8 && m.y < 8) return 'eyeTL';
    return m.x >= size - 8 ? 'eyeTR' : 'eyeBL';
  }
  if (m.region === 'timing') return m.y === 6 ? 'rulerH' : 'rulerV';
  return null;
}

const kindForZone = (z: Zone): PieceKind => (z.startsWith('eye') ? 'eye' : (z as PieceKind));

function PieceIcon({ kind }: { kind: PieceKind }) {
  if (kind === 'eye') {
    return (
      <svg viewBox="0 0 7 7" width={48} height={48} aria-hidden>
        <rect width={7} height={7} fill={REGION_COLORS.finder} />
        <rect x={1} y={1} width={5} height={5} fill="#fff" />
        <rect x={2} y={2} width={3} height={3} fill={REGION_COLORS.finder} />
      </svg>
    );
  }
  const horizontal = kind === 'rulerH';
  return (
    <svg
      viewBox={horizontal ? '0 0 7 1' : '0 0 1 7'}
      width={horizontal ? 70 : 10}
      height={horizontal ? 10 : 70}
      aria-hidden
    >
      {Array.from({ length: 7 }, (_, i) => (
        <rect
          key={i}
          x={horizontal ? i : 0}
          y={horizontal ? 0 : i}
          width={1}
          height={1}
          fill={i % 2 ? '#fff' : REGION_COLORS.timing}
        />
      ))}
    </svg>
  );
}

export function BuildAQr({ answer, roundDone }: PuzzleProps) {
  const [build] = useState(() => encode(pick(WORDS), { ecc: 'L' }));
  const [placed, setPlaced] = useState<Partial<Record<Zone, string>>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const usedPieces = new Set(Object.values(placed));
  const selectedKind = PIECES.find((p) => p.id === selected)?.kind;

  const tapZone = (x: number, y: number) => {
    const zone = zoneOf(build.info[y][x], build.size);
    if (!zone || placed[zone]) return;
    if (!selected) {
      answer(false, 'First pick a piece from the box, then tap where it goes!');
      return;
    }
    if (kindForZone(zone) !== selectedKind) {
      answer(
        false,
        selectedKind === 'eye'
          ? 'Eyes go in the big empty corners!'
          : 'Rulers go in the thin lines between the eyes. Check which way they point!',
      );
      return;
    }
    playSound('pop');
    const next = { ...placed, [zone]: selected };
    setPlaced(next);
    setSelected(null);
    if (Object.keys(next).length === 5) roundDone('You built it! Now a scanner can find and read it.');
  };

  return (
    <div className={styles.board}>
      <QrView
        modules={build.modules}
        showGrid
        fill={(x, y, dark) => {
          const m = build.info[y][x];
          const zone = zoneOf(m, build.size);
          if (!zone) return dark ? '#1d1b2f' : null;
          if (!placed[zone])
            return selectedKind && kindForZone(zone) === selectedKind ? '#fff4cc' : '#eeeaf6';
          return dark ? REGION_COLORS[m.region === 'timing' ? 'timing' : 'finder'] : null;
        }}
        onModuleTap={tapZone}
        label="Put the pieces back"
      />
      <div className={styles.tray}>
        {PIECES.filter((p) => !usedPieces.has(p.id)).map((p) => (
          <motion.button
            key={p.id}
            className={`${styles.piece} ${selected === p.id ? styles.pieceSelected : ''}`}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              playSound('tap');
              setSelected(selected === p.id ? null : p.id);
            }}
          >
            <PieceIcon kind={p.kind} />
            <span>{p.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
