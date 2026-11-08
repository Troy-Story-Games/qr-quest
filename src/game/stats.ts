/** Counters the game tracks; badges and unlocks are derived from these. */
export interface Stats {
  codesMade: number;
  wifiCodes: number;
  walkthroughs: number;
  dotsInspected: number;
  scans: number;
  huntsMade: number;
  cluesFound: number;
  decorations: number;
  /** Best percentage of dots scratched off while the code still scanned. */
  scratchBest: number;
  questsPlayed: number;
  /** Codes built piece by piece in Make a Code. */
  handBuilt: number;
}

export type StatKey = keyof Stats;

export const EMPTY_STATS: Stats = {
  codesMade: 0,
  wifiCodes: 0,
  walkthroughs: 0,
  dotsInspected: 0,
  scans: 0,
  huntsMade: 0,
  cluesFound: 0,
  decorations: 0,
  scratchBest: 0,
  questsPlayed: 0,
  handBuilt: 0,
};
