import { useMemo, useState } from 'react';
import { buildPieces, type Piece, type PieceKind, type QRBuild } from '@/core/qr';
import { letterColor, PART_INFO, type PartKey } from '@/components/qr/regions';

export const PART_OF_KIND: Record<PieceKind, PartKey> = {
  eye: 'eyes',
  ruler: 'rulers',
  littleEye: 'littleEyes',
  settings: 'settings',
  darkDot: 'settings',
  label: 'label',
  letter: 'message',
  filler: 'filler',
  backup: 'backup',
};

export function pieceColor(piece: Piece): string {
  return piece.kind === 'letter'
    ? letterColor(piece.charIndex ?? 0)
    : PART_INFO[PART_OF_KIND[piece.kind]].color;
}

export type PlaceResult = 'placed' | 'wrong' | 'filled' | 'noSelection';

/**
 * State for building a code by hand: which pieces still need placing, which is
 * picked up, and whether a tap put it in the right spot.
 */
export function useBuilder(build: QRBuild, parts: PartKey[]) {
  const pieces = useMemo(() => buildPieces(build), [build]);
  const toPlace = useMemo(
    () => new Set(pieces.filter((p) => parts.includes(PART_OF_KIND[p.kind])).map((p) => p.id)),
    [pieces, parts],
  );
  const pieceAt = useMemo(() => {
    const map = new Map<string, Piece>();
    for (const p of pieces) for (const [x, y] of p.cells) map.set(`${x},${y}`, p);
    return map;
  }, [pieces]);

  const [placed, setPlaced] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);

  const selected = pieces.find((p) => p.id === selectedId) ?? null;
  const tray = pieces.filter((p) => toPlace.has(p.id) && !placed.has(p.id));
  const done = tray.length === 0;

  /** Is this spot an empty slot the selected piece may go into? */
  const isTarget = (piece: Piece) =>
    selected !== null && toPlace.has(piece.id) && !placed.has(piece.id) && piece.group === selected.group;

  const place = (x: number, y: number): PlaceResult => {
    const target = pieceAt.get(`${x},${y}`);
    if (!target || !toPlace.has(target.id) || placed.has(target.id)) return 'filled';
    if (!selected) return 'noSelection';
    if (!isTarget(target)) {
      setMistakes((m) => m + 1);
      return 'wrong';
    }
    // Identical pieces (eyes) can fill any matching slot, so mark the slot that was tapped.
    setPlaced((s) => new Set(s).add(target.id));
    setSelectedId(null);
    return 'placed';
  };

  return {
    pieces,
    tray,
    done,
    mistakes,
    selected,
    select: setSelectedId,
    place,
    isPlaced: (piece: Piece) => !toPlace.has(piece.id) || placed.has(piece.id),
    isTarget,
    pieceAt: (x: number, y: number) => pieceAt.get(`${x},${y}`)!,
    total: toPlace.size,
  };
}
