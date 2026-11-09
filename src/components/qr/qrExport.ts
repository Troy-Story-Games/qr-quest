import jsQR from 'jsqr';

/** Rasterises a QrView SVG to a canvas (inlining images so the sticker survives). */
export async function svgToCanvas(svg: SVGSVGElement, pixels = 1024): Promise<HTMLCanvasElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(pixels));
  clone.setAttribute('height', String(pixels));

  await Promise.all(
    [...clone.querySelectorAll('image')].map(async (img) => {
      const href = img.getAttribute('href');
      if (!href || href.startsWith('data:')) return;
      const blob = await (await fetch(href)).blob();
      img.setAttribute('href', await blobToDataUrl(blob));
    }),
  );

  const xml = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' }));
  try {
    const image = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = pixels;
    canvas.getContext('2d')!.drawImage(image, 0, 0, pixels, pixels);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Saves the code as a PNG file. */
export async function downloadPng(svg: SVGSVGElement, filename: string): Promise<void> {
  const canvas = await svgToCanvas(svg);
  const link = document.createElement('a');
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Checks a decorated code scans, trying the ways a phone camera would: the
 * browser's built-in barcode reader if there is one, then jsQR at several sizes
 * and on a cleaned-up black-and-white copy. jsQR alone is much fussier than
 * phone cameras, so a miss here means "might be tricky", not "broken".
 */
export async function scansOk(svg: SVGSVGElement): Promise<string | null> {
  const canvas = await svgToCanvas(svg, 1024);

  if (window.BarcodeDetector) {
    try {
      const found = await new window.BarcodeDetector({ formats: ['qr_code'] }).detect(canvas);
      if (found[0]) return found[0].rawValue;
    } catch {
      // Fall through to jsQR.
    }
  }

  for (const size of [1024, 640, 400]) {
    const img = scaled(canvas, size);
    const result =
      jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' }) ??
      jsQR(binarize(img, 0.5), img.width, img.height, { inversionAttempts: 'attemptBoth' });
    if (result) return result.data;
  }

  // Cameras see a slightly blurry picture, which fills thin shapes (diamonds,
  // hearts) into solid dots. Copy that: blur, then count "mostly dark" as dark.
  const modulesAcross = Number(svg.getAttribute('viewBox')?.split(' ')[2]) || 40;
  for (const size of [640, 400]) {
    const img = scaled(canvas, size, (size / modulesAcross) * 0.35);
    // Low levels handle light-on-dark designs (the Space theme) the same way.
    for (const level of [0.65, 0.8, 0.35, 0.2]) {
      const result = jsQR(binarize(img, level), img.width, img.height, { inversionAttempts: 'attemptBoth' });
      if (result) return result.data;
    }
  }
  return null;
}

function scaled(source: HTMLCanvasElement, size: number, blurPx = 0): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = 'high';
  if (blurPx > 0) ctx.filter = `blur(${blurPx.toFixed(1)}px)`;
  ctx.drawImage(source, 0, 0, size, size);
  return ctx.getImageData(0, 0, size, size);
}

/**
 * Pure black and white. `level` is where the split sits between the darkest (0)
 * and lightest (1) colours; higher values count more grey as dark.
 */
function binarize(img: ImageData, level: number): Uint8ClampedArray {
  const { data } = img;
  const lum = new Float32Array(data.length / 4);
  let min = 255;
  let max = 0;
  for (let i = 0; i < lum.length; i++) {
    const l = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    lum[i] = l;
    min = Math.min(min, l);
    max = Math.max(max, l);
  }
  const threshold = min + (max - min) * level;
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < lum.length; i++) {
    const v = lum[i] < threshold ? 0 : 255;
    out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = v;
    out[i * 4 + 3] = 255;
  }
  return out;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
