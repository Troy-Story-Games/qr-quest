import jsQR from 'jsqr';

/** Minimal typing for the native BarcodeDetector (Chrome on Android/ChromeOS). */
interface NativeBarcodeDetector {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => NativeBarcodeDetector;
  }
}

export interface ScannerHandle {
  stop: () => void;
}

/**
 * Streams the back camera into `video` and calls `onResult` for each decoded code.
 * Uses the fast native detector when available, otherwise jsQR on canvas frames.
 */
export async function startScanner(
  video: HTMLVideoElement,
  onResult: (text: string) => void,
): Promise<ScannerHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' } },
    audio: false,
  });
  video.srcObject = stream;
  video.setAttribute('playsinline', 'true');
  await video.play();

  const native = window.BarcodeDetector ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let running = true;

  const tick = async () => {
    if (!running) return;
    if (video.readyState >= video.HAVE_ENOUGH_DATA) {
      try {
        const text = native ? await detectNative(native, video) : detectJs(video, canvas, ctx);
        if (text && running) onResult(text);
      } catch {
        // A single bad frame is fine; keep scanning.
      }
    }
    if (running) setTimeout(() => requestAnimationFrame(tick), 120);
  };
  requestAnimationFrame(tick);

  return {
    stop: () => {
      running = false;
      stream.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    },
  };
}

async function detectNative(
  detector: NativeBarcodeDetector,
  video: HTMLVideoElement,
): Promise<string | null> {
  const codes = await detector.detect(video);
  return codes[0]?.rawValue ?? null;
}

function detectJs(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D | null,
): string | null {
  if (!ctx) return null;
  // Downscale large frames; jsQR is plenty accurate at ~640px and much faster.
  const scale = Math.min(1, 640 / video.videoWidth);
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(img.data, img.width, img.height)?.data ?? null;
}

/** Decodes a QR code from an image file (fallback when there is no camera). */
export async function scanImageFile(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(img.data, img.width, img.height)?.data ?? null;
}
