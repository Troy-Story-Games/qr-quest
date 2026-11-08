import { useEffect, useMemo, useState } from 'react';

/** Small deterministic PRNG so the shuffle is pure for a given seed. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Animates a "pop-in" of `total` items over `durationMs`. Returns a rank lookup
 * (the order each item appears in) and how many are currently visible.
 * Changing `seed` reshuffles and restarts the animation.
 */
export function useReveal(
  total: number,
  durationMs: number,
  seed: number,
): { visible: number; rank: number[] } {
  const rank = useMemo(() => {
    const random = mulberry32(seed + 1);
    const order = Array.from({ length: total }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const r = new Array<number>(total);
    order.forEach((item, position) => (r[item] = position));
    return r;
  }, [total, seed]);

  const [visible, setVisible] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setVisible(Math.round(t * t * total));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [total, durationMs, seed]);

  return { visible, rank };
}
