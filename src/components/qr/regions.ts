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

export const HEADER_COLOR = '#475569';
export const FILLER_COLOR = '#a8a29e';

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

/** Plain-language explanation of each region, shown when a dot is tapped. */
export const REGION_INFO: Record<Region, { name: string; job: string }> = {
  finder: { name: 'Big eye', job: 'Helps the scanner find the code and see which way is up.' },
  separator: { name: 'Eye border', job: 'A light ring that keeps the eye apart from other dots.' },
  timing: { name: 'Ruler', job: 'Dark, light, dark, light: helps the scanner count the dots.' },
  alignment: { name: 'Little eye', job: 'Helps when the code is bent or tilted.' },
  format: { name: 'Settings', job: 'Says which backup level and which mix-up pattern were used.' },
  version: { name: 'Size settings', job: 'Says how big the code is.' },
  darkModule: { name: 'Always-dark dot', job: 'This one is always dark. Every QR code has it!' },
  data: { name: 'Message dot', job: 'Part of your message.' },
  ecc: { name: 'Backup dot', job: 'Maths copies that can fix a scratched code.' },
  remainder: { name: 'Leftover', job: 'A spare spot with nothing to say.' },
};

/** Groups of regions as kids see them, used by legends and the builder. */
export type PartKey =
  'eyes' | 'rulers' | 'littleEyes' | 'settings' | 'label' | 'message' | 'filler' | 'backup';

export const PART_INFO: Record<PartKey, { name: string; color: string; job: string }> = {
  eyes: { name: 'Eyes', color: REGION_COLORS.finder, job: REGION_INFO.finder.job },
  rulers: { name: 'Rulers', color: REGION_COLORS.timing, job: REGION_INFO.timing.job },
  littleEyes: { name: 'Little eyes', color: REGION_COLORS.alignment, job: REGION_INFO.alignment.job },
  settings: { name: 'Settings', color: REGION_COLORS.format, job: REGION_INFO.format.job },
  label: { name: 'Label', color: HEADER_COLOR, job: 'Says what kind of message it is and how long.' },
  message: { name: 'Message', color: LETTER_COLORS[0], job: REGION_INFO.data.job },
  filler: { name: 'Filler', color: FILLER_COLOR, job: 'Fills up the space after the message ends.' },
  backup: { name: 'Backup dots', color: REGION_COLORS.ecc, job: REGION_INFO.ecc.job },
};

/** Which kid-level part a module belongs to. */
export function partOf(m: ModuleInfo): PartKey {
  switch (m.region) {
    case 'finder':
    case 'separator':
      return 'eyes';
    case 'timing':
      return 'rulers';
    case 'alignment':
      return 'littleEyes';
    case 'format':
    case 'version':
    case 'darkModule':
      return 'settings';
    case 'ecc':
      return 'backup';
    case 'remainder':
      return 'filler';
    default:
      if (m.role === 'char') return 'message';
      if (m.role === 'mode' || m.role === 'count') return 'label';
      return 'filler';
  }
}
