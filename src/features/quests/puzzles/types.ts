export interface PuzzleProps {
  /** 0-based round number; puzzles generate a fresh challenge per round. */
  round: number;
  /** Report an answer. Wrong answers count as mistakes; feedback is shown by Bitsy. */
  answer: (correct: boolean, feedback?: string) => void;
  /** Call when the round's goal is complete. */
  roundDone: (feedback?: string) => void;
}

export interface PuzzleDefinition {
  rounds: number;
  intro: string;
  Component: (props: PuzzleProps) => React.ReactNode;
}

export const WORDS = [
  'Cat',
  'Dog',
  'Sun',
  'Frog',
  'Star',
  'Moon',
  'Fish',
  'Cake',
  'Book',
  'Tree',
  'Robot',
  'Pizza',
  'Hi!',
  'Wow',
  'Yay',
];

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
