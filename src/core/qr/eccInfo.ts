import type { EccLevel } from './types';

/** Kid-friendly names for each error-correction level and how much damage it can repair. */
export const ECC_INFO: Record<EccLevel, { name: string; percent: number; shields: number }> = {
  L: { name: 'A little', percent: 7, shields: 1 },
  M: { name: 'Some', percent: 15, shields: 2 },
  Q: { name: 'Lots', percent: 25, shields: 3 },
  H: { name: 'Tons', percent: 30, shields: 4 },
};
