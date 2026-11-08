import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EccLevel } from '@/core/qr';
import { persistStorage } from '@/services/storage/safeStorage';

/** The code the kid is working on, shared by Make, Learn, Scratch and Decorate. */
interface CurrentCodeState {
  text: string;
  ecc: EccLevel;
  setText: (text: string) => void;
  setEcc: (ecc: EccLevel) => void;
}

export const useCurrentCode = create<CurrentCodeState>()(
  persist(
    (set) => ({
      text: 'Hello!',
      ecc: 'M',
      setText: (text) => set({ text }),
      setEcc: (ecc) => set({ ecc }),
    }),
    { name: 'kidqr-current', storage: persistStorage },
  ),
);
