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

/** Checks a decorated code really scans by decoding the rendered pixels. */
export async function scansOk(svg: SVGSVGElement): Promise<string | null> {
  const canvas = await svgToCanvas(svg, 800);
  const ctx = canvas.getContext('2d')!;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' })?.data ?? null;
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
