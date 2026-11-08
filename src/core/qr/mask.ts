/**
 * The eight mask patterns. A mask flips data dots in a regular pattern so the
 * code never ends up with confusing blobs or stripes that look like finder eyes.
 */
export const MASK_PATTERNS: ReadonlyArray<(x: number, y: number) => boolean> = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

/** Kid-friendly descriptions of each mask, shown in the walkthrough. */
export const MASK_DESCRIPTIONS = [
  'a checkerboard',
  'stripes across',
  'stripes down',
  'diagonal lines',
  'little bricks',
  'crosses',
  'diamonds',
  'wiggly waves',
];

const PENALTY_N1 = 3;
const PENALTY_N2 = 3;
const PENALTY_N3 = 40;
const PENALTY_N4 = 10;

/** ISO/IEC 18004 penalty score; the encoder keeps the mask with the lowest one. */
export function penaltyScore(modules: boolean[][]): number {
  const size = modules.length;
  let result = 0;

  const scanLine = (get: (i: number) => boolean): void => {
    let runColor = false;
    let runLength = 0;
    const history = [0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < size; i++) {
      if (get(i) === runColor) {
        runLength++;
        if (runLength === 5) result += PENALTY_N1;
        else if (runLength > 5) result++;
      } else {
        addHistory(runLength, history, size);
        if (!runColor) result += countFinderLike(history) * PENALTY_N3;
        runColor = get(i);
        runLength = 1;
      }
    }
    result += terminateAndCount(runColor, runLength, history, size) * PENALTY_N3;
  };

  for (let y = 0; y < size; y++) scanLine((x) => modules[y][x]);
  for (let x = 0; x < size; x++) scanLine((y) => modules[y][x]);

  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const c = modules[y][x];
      if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) {
        result += PENALTY_N2;
      }
    }
  }

  const dark = modules.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
  const total = size * size;
  const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
  result += k * PENALTY_N4;
  return result;
}

function addHistory(runLength: number, history: number[], size: number): void {
  // The first run is padded with the light quiet zone around the symbol.
  if (history[0] === 0) runLength += size;
  history.pop();
  history.unshift(runLength);
}

function countFinderLike(h: number[]): number {
  const n = h[1];
  const core = n > 0 && h[2] === n && h[3] === n * 3 && h[4] === n && h[5] === n;
  return (core && h[0] >= n * 4 && h[6] >= n ? 1 : 0) + (core && h[6] >= n * 4 && h[0] >= n ? 1 : 0);
}

function terminateAndCount(runColor: boolean, runLength: number, history: number[], size: number): number {
  if (runColor) {
    addHistory(runLength, history, size);
    runLength = 0;
  }
  runLength += size;
  addHistory(runLength, history, size);
  return countFinderLike(history);
}
