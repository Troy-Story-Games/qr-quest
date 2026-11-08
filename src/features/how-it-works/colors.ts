import type { ModuleInfo, Region } from '@/core/qr';

/** Same colours as the CSS `--region-*` tokens, needed as values for SVG fills. */
export const REGION_COLORS: Record<Region, string> = {
  finder: '#ff4d6d',
  separator: '#ffd1da',
  timing: '#ffb400',
  alignment: '#ff8c42',
  format: '#14b8a6',
  version: '#3a86ff',
  darkModule: '#2b2147',
  data: '#6c4cf1',
  ecc: '#c026d3',
  remainder: '#9ca3af',
};

/** A bright colour per letter so kids can match letters to their dots. */
export const LETTER_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
];

const HEADER_COLOR = '#475569';
const FILLER_COLOR = '#a8a29e';

export function letterColor(index: number): string {
  return LETTER_COLORS[index % LETTER_COLORS.length];
}

/** Mixes a hex colour with white; amount 0 = unchanged, 1 = white. */
export function tint(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** The "explain" colour of a module: its region or letter colour, pale when the module is light. */
export function explainColor(m: ModuleInfo, dark: boolean): string {
  let base = REGION_COLORS[m.region];
  if (m.region === 'data') {
    if (m.role === 'char' && m.chars) base = letterColor(m.chars[0]);
    else if (m.role === 'mode' || m.role === 'count') base = HEADER_COLOR;
    else base = FILLER_COLOR;
  }
  if (m.region === 'separator') return dark ? REGION_COLORS.finder : '#fff0f3';
  return dark ? base : tint(base, 0.8);
}
