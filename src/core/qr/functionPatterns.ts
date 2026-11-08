import { alignmentPatternPositions, ECC_FORMAT_BITS, symbolSize } from './tables';
import type { EccLevel, Region } from './types';

/** A grid under construction: colour plus which region claimed each cell. */
export interface WorkingGrid {
  size: number;
  dark: boolean[][];
  region: (Region | null)[][];
}

export function createGrid(version: number): WorkingGrid {
  const size = symbolSize(version);
  return {
    size,
    dark: Array.from({ length: size }, () => new Array<boolean>(size).fill(false)),
    region: Array.from({ length: size }, () => new Array<Region | null>(size).fill(null)),
  };
}

function set(grid: WorkingGrid, x: number, y: number, dark: boolean, region: Region): void {
  grid.dark[y][x] = dark;
  grid.region[y][x] = region;
}

/** Draws every non-data pattern. Format bits are drawn for the given mask. */
export function drawFunctionPatterns(grid: WorkingGrid, version: number, ecc: EccLevel, mask: number): void {
  const { size } = grid;

  for (let i = 0; i < size; i++) {
    set(grid, 6, i, i % 2 === 0, 'timing');
    set(grid, i, 6, i % 2 === 0, 'timing');
  }

  drawFinder(grid, 3, 3);
  drawFinder(grid, size - 4, 3);
  drawFinder(grid, 3, size - 4);

  const positions = alignmentPatternPositions(version);
  const last = positions.length - 1;
  positions.forEach((px, i) => {
    positions.forEach((py, j) => {
      const overlapsFinder = (i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0);
      if (!overlapsFinder) drawAlignment(grid, px, py);
    });
  });

  drawFormatBits(grid, ecc, mask);
  if (version >= 7) drawVersionBits(grid, version);
}

function drawFinder(grid: WorkingGrid, cx: number, cy: number): void {
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx;
      const y = cy + dy;
      if (x < 0 || y < 0 || x >= grid.size || y >= grid.size) continue;
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      set(grid, x, y, dist !== 2 && dist !== 4, dist === 4 ? 'separator' : 'finder');
    }
  }
}

function drawAlignment(grid: WorkingGrid, cx: number, cy: number): void {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      set(grid, cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1, 'alignment');
    }
  }
}

/** 15-bit format word: ECC level + mask, protected by a BCH code and XOR-masked. */
export function formatBits(ecc: EccLevel, mask: number): number {
  const data = (ECC_FORMAT_BITS[ecc] << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  return ((data << 10) | rem) ^ 0x5412;
}

function bitAt(value: number, i: number): boolean {
  return ((value >>> i) & 1) !== 0;
}

export function drawFormatBits(grid: WorkingGrid, ecc: EccLevel, mask: number): void {
  const bits = formatBits(ecc, mask);
  const { size } = grid;

  // Copy 1: around the top-left finder.
  for (let i = 0; i <= 5; i++) set(grid, 8, i, bitAt(bits, i), 'format');
  set(grid, 8, 7, bitAt(bits, 6), 'format');
  set(grid, 8, 8, bitAt(bits, 7), 'format');
  set(grid, 7, 8, bitAt(bits, 8), 'format');
  for (let i = 9; i < 15; i++) set(grid, 14 - i, 8, bitAt(bits, i), 'format');

  // Copy 2: split between the other two finders.
  for (let i = 0; i < 8; i++) set(grid, size - 1 - i, 8, bitAt(bits, i), 'format');
  for (let i = 8; i < 15; i++) set(grid, 8, size - 15 + i, bitAt(bits, i), 'format');

  set(grid, 8, size - 8, true, 'darkModule');
}

function drawVersionBits(grid: WorkingGrid, version: number): void {
  let rem = version;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
  const bits = (version << 12) | rem;
  for (let i = 0; i < 18; i++) {
    const dark = bitAt(bits, i);
    const a = grid.size - 11 + (i % 3);
    const b = Math.floor(i / 3);
    set(grid, a, b, dark, 'version');
    set(grid, b, a, dark, 'version');
  }
}
