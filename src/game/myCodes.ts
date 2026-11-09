import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EccLevel } from '@/core/qr';
import { persistStorage } from '@/services/storage/safeStorage';
import type { DotShape } from './unlocks';

/** How a decorated code looks. Plain codes have no style. */
export interface CodeStyle {
  themeId: string;
  shape: DotShape;
  sticker?: string;
}

export interface SavedCode {
  id: string;
  text: string;
  ecc: EccLevel;
  style?: CodeStyle;
  /** Milliseconds since 1970. */
  createdAt: number;
}

/** Enough for a big collection without filling up browser storage. */
const MAX_CODES = 200;

interface MyCodesState {
  codes: SavedCode[];
  /** Saves a code (newest first). Making the same code again just moves it to the top. */
  add: (code: Omit<SavedCode, 'id' | 'createdAt'>) => void;
  remove: (id: string) => void;
}

const sameCode = (a: Omit<SavedCode, 'id' | 'createdAt'>, b: SavedCode) =>
  a.text === b.text && a.ecc === b.ecc && JSON.stringify(a.style ?? null) === JSON.stringify(b.style ?? null);

/** The kid's collection of codes made in Make a Code and Decorate. */
export const useMyCodes = create<MyCodesState>()(
  persist(
    (set) => ({
      codes: [],
      add: (code) =>
        set((s) => ({
          codes: [
            { ...code, id: crypto.randomUUID(), createdAt: Date.now() },
            ...s.codes.filter((c) => !sameCode(code, c)),
          ].slice(0, MAX_CODES),
        })),
      remove: (id) => set((s) => ({ codes: s.codes.filter((c) => c.id !== id) })),
    }),
    { name: 'kidqr-codes', storage: persistStorage },
  ),
);
