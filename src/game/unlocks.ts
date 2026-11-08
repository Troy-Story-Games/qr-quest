/** Decorations that unlock as the player levels up. */

export interface ColorTheme {
  id: string;
  name: string;
  dark: string;
  light: string;
  eye: string;
  level: number;
}

export const COLOR_THEMES: ColorTheme[] = [
  { id: 'classic', name: 'Classic', dark: '#1d1b2f', light: '#ffffff', eye: '#1d1b2f', level: 1 },
  { id: 'grape', name: 'Grape', dark: '#5b21b6', light: '#ffffff', eye: '#db2777', level: 1 },
  { id: 'ocean', name: 'Ocean', dark: '#0e4c92', light: '#e6f6ff', eye: '#0ea5e9', level: 2 },
  { id: 'jungle', name: 'Jungle', dark: '#166534', light: '#f0fdf4', eye: '#ea580c', level: 3 },
  { id: 'lava', name: 'Lava', dark: '#9f1239', light: '#fff7ed', eye: '#f59e0b', level: 4 },
  { id: 'space', name: 'Space', dark: '#ffffff', light: '#111033', eye: '#facc15', level: 5 },
  { id: 'candy', name: 'Candy', dark: '#be185d', light: '#fdf2f8', eye: '#7c3aed', level: 6 },
];

export type DotShape = 'square' | 'round' | 'dot' | 'diamond' | 'heart';

export const DOT_SHAPES: Array<{ id: DotShape; name: string; level: number }> = [
  { id: 'square', name: 'Squares', level: 1 },
  { id: 'round', name: 'Rounded', level: 1 },
  { id: 'dot', name: 'Bubbles', level: 2 },
  { id: 'diamond', name: 'Diamonds', level: 4 },
  { id: 'heart', name: 'Hearts', level: 6 },
];

/** Twemoji stickers for the centre of the code, by unlock level. */
export const STICKERS: Array<{ emoji: string; level: number }> = [
  { emoji: '1f31f', level: 1 },
  { emoji: '2764', level: 1 },
  { emoji: '1f916', level: 1 },
  { emoji: '1f996', level: 2 },
  { emoji: '1f680', level: 2 },
  { emoji: '1f431', level: 3 },
  { emoji: '1f436', level: 3 },
  { emoji: '1f355', level: 4 },
  { emoji: '26bd', level: 4 },
  { emoji: '1f308', level: 5 },
  { emoji: '1f47e', level: 5 },
  { emoji: '1f984', level: 6 },
  { emoji: '1f419', level: 6 },
  { emoji: '1f369', level: 7 },
  { emoji: '1f988', level: 7 },
  { emoji: '1f451', level: 8 },
];

/** Items that become available exactly at `level` (for the level-up screen). */
export function unlocksAtLevel(level: number): string[] {
  return [
    ...COLOR_THEMES.filter((t) => t.level === level).map((t) => `${t.name} colours`),
    ...DOT_SHAPES.filter((s) => s.level === level).map((s) => `${s.name} dots`),
    ...(STICKERS.some((s) => s.level === level) ? ['New stickers'] : []),
  ];
}
