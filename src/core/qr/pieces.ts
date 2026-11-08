import { alignmentPatternPositions } from './tables';
import type { ModuleInfo, QRBuild } from './types';

/** The kinds of chunk a code can be split into for building by hand. */
export type PieceKind =
  'eye' | 'ruler' | 'littleEye' | 'settings' | 'darkDot' | 'label' | 'letter' | 'filler' | 'backup';

export interface Piece {
  id: string;
  kind: PieceKind;
  /** Short name for the tray card, e.g. "Eye" or the letter itself. */
  label: string;
  /**
   * Pieces in the same group look identical and can go in each other's spot
   * (any eye fits any eye socket). Other pieces have a group of their own.
   */
  group: string;
  /** Module coordinates `[x, y]` this piece covers. */
  cells: Array<[number, number]>;
  /** For letters: index of the first character, used for colouring. */
  charIndex?: number;
}

/** Which corner (0 top-left, 1 top-right, 2 bottom-left) a finder module belongs to. */
export function cornerOf(x: number, y: number, size: number): number {
  if (x < 8 && y < 8) return 0;
  return x >= size - 8 ? 1 : 2;
}

/** Centre of the alignment pattern a module belongs to. */
export function alignmentCentreOf(x: number, y: number, version: number): [number, number] {
  const positions = alignmentPatternPositions(version);
  const nearest = (v: number) => positions.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
  return [nearest(x), nearest(y)];
}

/** Where a module goes when building: its piece id, kind, group and label. */
function classify(m: ModuleInfo, build: QRBuild): Omit<Piece, 'cells'> {
  const { size, version } = build;
  switch (m.region) {
    case 'finder':
    case 'separator':
      return { id: `eye-${cornerOf(m.x, m.y, size)}`, kind: 'eye', label: 'Eye', group: 'eye' };
    case 'timing':
      return m.y === 6
        ? { id: 'ruler-h', kind: 'ruler', label: 'Ruler ↔', group: 'ruler-h' }
        : { id: 'ruler-v', kind: 'ruler', label: 'Ruler ↕', group: 'ruler-v' };
    case 'alignment': {
      const [cx, cy] = alignmentCentreOf(m.x, m.y, version);
      return { id: `little-${cx}-${cy}`, kind: 'littleEye', label: 'Little eye', group: 'littleEye' };
    }
    case 'format': {
      const nearTopLeft = m.x <= 8 && m.y <= 8;
      const id = nearTopLeft ? 'settings-1' : 'settings-2';
      return { id, kind: 'settings', label: nearTopLeft ? 'Settings A' : 'Settings B', group: id };
    }
    case 'version': {
      const id = m.y < 6 ? 'size-1' : 'size-2';
      return { id, kind: 'settings', label: 'Size', group: id };
    }
    case 'darkModule':
      return { id: 'dark-dot', kind: 'darkDot', label: 'Dark dot', group: 'dark-dot' };
    case 'ecc': {
      const id = `backup-${m.block ?? 0}`;
      const label = build.numBlocks > 1 ? `Backup ${(m.block ?? 0) + 1}` : 'Backup';
      return { id, kind: 'backup', label, group: id };
    }
    case 'remainder':
      return { id: 'filler', kind: 'filler', label: 'Filler', group: 'filler' };
    default:
      if (m.role === 'char' && m.chars) {
        const id = `letter-${m.chars[0]}`;
        const text = build.chars.slice(m.chars[0], m.chars[1]).join('');
        return { id, kind: 'letter', label: text === ' ' ? '␣' : text, group: id, charIndex: m.chars[0] };
      }
      if (m.role === 'mode' || m.role === 'count')
        return { id: 'label', kind: 'label', label: 'Label', group: 'label' };
      return { id: 'filler', kind: 'filler', label: 'Filler', group: 'filler' };
  }
}

/**
 * Splits a code into chunks a kid can place by hand. Every module belongs to
 * exactly one piece. Pieces come back in a sensible building order.
 */
export function buildPieces(build: QRBuild): Piece[] {
  const pieces = new Map<string, Piece>();
  for (const m of build.info.flat()) {
    const meta = classify(m, build);
    const piece = pieces.get(meta.id) ?? { ...meta, cells: [] };
    piece.cells.push([m.x, m.y]);
    pieces.set(meta.id, piece);
  }
  const order: PieceKind[] = [
    'eye',
    'ruler',
    'littleEye',
    'settings',
    'darkDot',
    'label',
    'letter',
    'filler',
    'backup',
  ];
  return [...pieces.values()].sort(
    (a, b) =>
      order.indexOf(a.kind) - order.indexOf(b.kind) ||
      (a.charIndex ?? 0) - (b.charIndex ?? 0) ||
      a.id.localeCompare(b.id),
  );
}
