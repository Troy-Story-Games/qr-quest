import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cluePayload, type Clue } from '@/core/payload/payload';
import { persistStorage } from '@/services/storage/safeStorage';

interface HuntState {
  /** Clue texts being written in the Treasure Hunt screen. */
  draft: string[];
  /** Payloads of clues already found by scanning. */
  found: string[];
  setDraft: (draft: string[]) => void;
  /** Records a scanned clue. Returns false if it was already found. */
  markFound: (clue: Clue) => boolean;
  /** How many clues of a hunt with `total` clues have been found. */
  foundOf: (total: number) => number;
  resetFound: () => void;
}

export const useHunt = create<HuntState>()(
  persist(
    (set, get) => ({
      draft: [
        'Look under your pillow!',
        'Check inside the fridge door.',
        'The last clue is by the front door!',
      ],
      found: [],
      setDraft: (draft) => set({ draft }),
      markFound: (clue) => {
        const key = cluePayload(clue);
        if (get().found.includes(key)) return false;
        set((s) => ({ found: [...s.found, key] }));
        return true;
      },
      foundOf: (total) => get().found.filter((f) => f.includes(` of ${total}: `)).length,
      resetFound: () => set({ found: [] }),
    }),
    { name: 'kidqr-hunt', storage: persistStorage },
  ),
);
