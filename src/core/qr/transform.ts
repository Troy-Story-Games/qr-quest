/** Rotates a square grid clockwise by `quarterTurns` × 90°. */
export function rotateGrid<T>(grid: T[][], quarterTurns: number): T[][] {
  const turns = ((quarterTurns % 4) + 4) % 4;
  let out = grid;
  for (let t = 0; t < turns; t++) {
    const n = out.length;
    const src = out;
    out = Array.from({ length: n }, (_, y) => Array.from({ length: n }, (_, x) => src[n - 1 - x][y]));
  }
  return out;
}
