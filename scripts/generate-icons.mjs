/**
 * Generates the app icons procedurally: a real, scannable QR code on a
 * rounded tile. Run with `npm run icons` after changing the design.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import QRCode from 'qrcode';
import sharp from 'sharp';

const BG = '#6c4cf1';
const DOT = '#2b2147';
const EYE = '#ff4d6d';

function iconSvg({ padding }) {
  const qr = QRCode.create('QR Quest', { errorCorrectionLevel: 'M', version: 1 });
  const { size, data } = qr.modules;
  const isEye = (x, y) => (x < 7 && y < 7) || (x >= size - 7 && y < 7) || (x < 7 && y >= size - 7);

  const tile = 512;
  const panel = tile - padding * 2;
  const cell = (panel - 40) / size;
  const origin = padding + 20;

  let dots = '';
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!data[y * size + x]) continue;
      const px = origin + x * cell;
      const py = origin + y * cell;
      dots += `<rect x="${px.toFixed(2)}" y="${py.toFixed(2)}" width="${(cell * 0.92).toFixed(2)}" height="${(cell * 0.92).toFixed(2)}" rx="${(cell * 0.3).toFixed(2)}" fill="${isEye(x, y) ? EYE : DOT}"/>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tile} ${tile}">
  <rect width="${tile}" height="${tile}" rx="${padding ? 0 : 112}" fill="${BG}"/>
  <rect x="${padding}" y="${padding}" width="${panel}" height="${panel}" rx="${panel * 0.14}" fill="#ffffff"/>
  ${dots}
</svg>`;
}

mkdirSync('public', { recursive: true });
mkdirSync('build', { recursive: true });

const standard = iconSvg({ padding: 56 });
const maskable = iconSvg({ padding: 104 });

writeFileSync('public/favicon.svg', standard);
const render = (svg, size, file) => sharp(Buffer.from(svg)).resize(size, size).png().toFile(file);

await Promise.all([
  render(standard, 192, 'public/pwa-192.png'),
  render(standard, 512, 'public/pwa-512.png'),
  render(maskable, 512, 'public/pwa-maskable-512.png'),
  render(standard, 180, 'public/apple-touch-icon.png'),
  render(standard, 1024, 'build/icon.png'),
]);
console.log('Icons written to public/ and build/');
