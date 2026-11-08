/** Error-correction level: how much of the code can be damaged and still scan. */
export type EccLevel = 'L' | 'M' | 'Q' | 'H';

/** How the text is packed into bits. */
export type Mode = 'numeric' | 'alphanumeric' | 'byte';

/** Every module (dot) in the grid belongs to exactly one region. */
export type Region =
  | 'finder'
  | 'separator'
  | 'timing'
  | 'alignment'
  | 'format'
  | 'version'
  | 'darkModule'
  | 'data'
  | 'ecc'
  | 'remainder';

/** What a single bit of the data stream represents. */
export type BitRole = 'mode' | 'count' | 'char' | 'terminator' | 'padBits' | 'padByte';

/** One bit of the data bit stream, with where it came from. */
export interface StreamBit {
  value: boolean;
  role: BitRole;
  /** Index range [start, end) of source characters this bit encodes (role === 'char'). */
  chars?: [number, number];
}

/** Provenance for one module in the final grid. */
export interface ModuleInfo {
  x: number;
  y: number;
  region: Region;
  /** Final colour after masking. */
  dark: boolean;
  /** Colour before the mask was applied (equals `dark` for function patterns). */
  rawDark: boolean;
  /** Whether the mask flipped this module. */
  masked: boolean;
  /** Position along the zigzag data path (data, ecc and remainder modules only). */
  pathIndex?: number;
  /** Index of the codeword in the final interleaved sequence. */
  codeword?: number;
  /** Bit within the codeword, 7 = most significant. */
  bit?: number;
  /** Error-correction block this codeword belongs to. */
  block?: number;
  /** For data modules: the bit in the original data stream (before interleaving). */
  streamBit?: number;
  role?: BitRole;
  chars?: [number, number];
}

/** A fully built QR symbol with everything needed to teach how it was made. */
export interface QRBuild {
  text: string;
  /** The characters of `text` (code points, so emoji count as one). */
  chars: string[];
  version: number;
  size: number;
  ecc: EccLevel;
  mode: Mode;
  mask: number;
  /** Penalty score for each of the 8 masks (lower is better). */
  maskPenalties: number[];
  /** Final grid, `modules[y][x]`, true = dark. */
  modules: boolean[][];
  /** Provenance, `info[y][x]`. */
  info: ModuleInfo[][];
  /** The data bit stream before error correction. */
  stream: StreamBit[];
  /** Data codewords (before interleaving). */
  dataCodewords: number[];
  /** Final interleaved codewords (data + ecc). */
  allCodewords: number[];
  /** Number of data codewords; the rest of `allCodewords` are error correction. */
  numDataCodewords: number;
  numBlocks: number;
}
