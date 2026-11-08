import jsQR from 'jsqr';

const QUIET_ZONE = 4;

/** Pure-data RGBA image so this works in browsers, workers and Node tests. */
export interface RgbaImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/** Renders a module grid (true = dark) to RGBA pixels with a quiet zone. */
export function matrixToImageData(modules: boolean[][], scale = 4): RgbaImage {
  const size = modules.length;
  const width = (size + QUIET_ZONE * 2) * scale;
  const data = new Uint8ClampedArray(width * width * 4).fill(255);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!modules[y][x]) continue;
      for (let dy = 0; dy < scale; dy++) {
        const row = (y + QUIET_ZONE) * scale + dy;
        for (let dx = 0; dx < scale; dx++) {
          const p = (row * width + (x + QUIET_ZONE) * scale + dx) * 4;
          data[p] = data[p + 1] = data[p + 2] = 0;
        }
      }
    }
  }
  return { data, width, height: width };
}

/** Tries to read a grid the way a real scanner would. Returns the text or null. */
export function decodeMatrix(modules: boolean[][]): string | null {
  const img = matrixToImageData(modules);
  const result = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
  return result ? result.data : null;
}
