import { describe, expect, it } from 'vitest';
import { buildPieces, encode, rotateGrid, type EccLevel } from '@/core/qr';

describe('buildPieces', () => {
  it('covers every module exactly once', () => {
    for (let v = 1; v <= 8; v++) {
      for (const ecc of ['L', 'H'] as EccLevel[]) {
        const build = encode('Hi!', { ecc, minVersion: v });
        const seen = new Map<string, number>();
        for (const p of buildPieces(build))
          for (const [x, y] of p.cells) seen.set(`${x},${y}`, (seen.get(`${x},${y}`) ?? 0) + 1);
        expect(seen.size).toBe(build.size * build.size);
        expect([...seen.values()].every((n) => n === 1)).toBe(true);
      }
    }
  });

  it('makes the expected pieces for a small code', () => {
    const pieces = buildPieces(encode('Cat', { ecc: 'L', minVersion: 2 }));
    const count = (kind: string) => pieces.filter((p) => p.kind === kind).length;
    expect(count('eye')).toBe(3);
    expect(count('ruler')).toBe(2);
    expect(count('littleEye')).toBe(1);
    expect(count('letter')).toBe(3);
    expect(count('darkDot')).toBe(1);
    expect(pieces.filter((p) => p.kind === 'eye').every((p) => p.cells.length >= 49)).toBe(true);
    expect(pieces.filter((p) => p.kind === 'letter').map((p) => p.label)).toEqual(['C', 'a', 't']);
  });

  it('gives every bigger code one little eye per alignment pattern', () => {
    const pieces = buildPieces(encode('Hello', { minVersion: 7 }));
    expect(pieces.filter((p) => p.kind === 'littleEye')).toHaveLength(6);
    expect(pieces.filter((p) => p.kind === 'littleEye').every((p) => p.cells.length === 25)).toBe(true);
  });
});

describe('rotateGrid', () => {
  it('rotates clockwise and returns home after four turns', () => {
    const grid = [
      [1, 2],
      [3, 4],
    ];
    expect(rotateGrid(grid, 1)).toEqual([
      [3, 1],
      [4, 2],
    ]);
    expect(rotateGrid(grid, 4)).toEqual(grid);
  });
});
