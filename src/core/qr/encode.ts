import { createGrid, drawFormatBits, drawFunctionPatterns, type WorkingGrid } from './functionPatterns';
import { MASK_PATTERNS, penaltyScore } from './mask';
import { computeDivisor, computeRemainder } from './reedSolomon';
import {
  ALPHANUMERIC_CHARSET,
  BitWriter,
  charCountBits,
  detectMode,
  payloadBitLength,
  writeHeader,
  writePayload,
} from './segment';
import {
  eccCodewordsPerBlock,
  MAX_VERSION,
  MIN_VERSION,
  numDataCodewords,
  numEccBlocks,
  numRawDataModules,
} from './tables';
import type { EccLevel, Mode, ModuleInfo, QRBuild, Region } from './types';

export interface EncodeOptions {
  ecc?: EccLevel;
  /** Force a mode; defaults to the most compact one that fits the text. */
  mode?: Mode;
  /** Smallest version to consider (useful to keep a fixed size while typing). */
  minVersion?: number;
  /** Force a mask (0-7); defaults to the one with the lowest penalty. */
  mask?: number;
}

export class QRCapacityError extends Error {
  constructor() {
    super('That message is too long to fit in a QR code.');
    this.name = 'QRCapacityError';
  }
}

/** Describes where an interleaved codeword came from. */
interface CodewordSource {
  kind: 'data' | 'ecc';
  block: number;
  /** For data: index into the data codeword list. */
  dataIndex?: number;
}

/** Encodes `text` into a QR symbol, recording the provenance of every module. */
export function encode(text: string, options: EncodeOptions = {}): QRBuild {
  const ecc = options.ecc ?? 'M';
  const chars = [...text];
  const mode = options.mode ?? detectMode(text);
  assertModeFits(chars, mode);

  const version = chooseVersion(chars, mode, ecc, options.minVersion ?? MIN_VERSION);
  const capacityBits = numDataCodewords(version, ecc) * 8;

  const writer = new BitWriter();
  writeHeader(writer, chars, mode, version);
  writePayload(writer, chars, mode);
  writer.write(0, Math.min(4, capacityBits - writer.length), 'terminator');
  writer.write(0, (8 - (writer.length % 8)) % 8, 'padBits');
  for (let pad = 0xec; writer.length < capacityBits; pad ^= 0xec ^ 0x11) {
    writer.write(pad, 8, 'padByte');
  }

  const stream = writer.bits;
  const dataCodewords: number[] = [];
  for (let i = 0; i < stream.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | (stream[i + j].value ? 1 : 0);
    dataCodewords.push(byte);
  }

  const { codewords: allCodewords, sources } = addEccAndInterleave(dataCodewords, version, ecc);

  const grid = createGrid(version);
  drawFunctionPatterns(grid, version, ecc, 0);
  const placement = placeCodewords(grid, allCodewords, sources);

  const maskPenalties = MASK_PATTERNS.map((_, m) => penaltyScore(applyMask(grid, ecc, m).dark));
  const mask = options.mask ?? maskPenalties.indexOf(Math.min(...maskPenalties));
  const finalGrid = applyMask(grid, ecc, mask);

  const info: ModuleInfo[][] = finalGrid.dark.map((row, y) =>
    row.map((dark, x) => {
      const region = finalGrid.region[y][x] as Region;
      const p = placement[y][x];
      const base: ModuleInfo = {
        x,
        y,
        region,
        dark,
        rawDark: grid.dark[y][x],
        masked: p !== null && dark !== grid.dark[y][x],
      };
      if (region === 'format' || p === null) return { ...base, rawDark: dark };
      const out: ModuleInfo = { ...base, pathIndex: p.pathIndex };
      if (p.codeword === undefined) return out;
      const source = sources[p.codeword];
      out.codeword = p.codeword;
      out.bit = p.bit;
      out.block = source.block;
      if (source.kind === 'data' && source.dataIndex !== undefined && p.bit !== undefined) {
        const streamIndex = source.dataIndex * 8 + (7 - p.bit);
        const sb = stream[streamIndex];
        out.streamBit = streamIndex;
        out.role = sb.role;
        out.chars = sb.chars;
      }
      return out;
    }),
  );

  return {
    text,
    chars,
    version,
    size: grid.size,
    ecc,
    mode,
    mask,
    maskPenalties,
    modules: finalGrid.dark,
    info,
    stream,
    dataCodewords,
    allCodewords,
    numDataCodewords: dataCodewords.length,
    numBlocks: numEccBlocks(version, ecc),
  };
}

/** Whether `text` can be encoded in `mode` at all. */
export function modeSupports(text: string, mode: Mode): boolean {
  if (mode === 'numeric') return /^[0-9]*$/.test(text);
  if (mode === 'alphanumeric') return [...text].every((c) => ALPHANUMERIC_CHARSET.includes(c));
  return true;
}

function assertModeFits(chars: string[], mode: Mode): void {
  if (!modeSupports(chars.join(''), mode)) {
    throw new Error(`Text cannot be encoded in ${mode} mode`);
  }
}

function chooseVersion(chars: string[], mode: Mode, ecc: EccLevel, minVersion: number): number {
  const payload = payloadBitLength(chars, mode);
  for (let v = Math.max(MIN_VERSION, minVersion); v <= MAX_VERSION; v++) {
    const needed = 4 + charCountBits(mode, v) + payload;
    if (needed <= numDataCodewords(v, ecc) * 8) return v;
  }
  throw new QRCapacityError();
}

function addEccAndInterleave(
  data: number[],
  version: number,
  ecc: EccLevel,
): { codewords: number[]; sources: CodewordSource[] } {
  const numBlocks = numEccBlocks(version, ecc);
  const blockEccLen = eccCodewordsPerBlock(version, ecc);
  const rawCodewords = Math.floor(numRawDataModules(version) / 8);
  const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
  const shortBlockLen = Math.floor(rawCodewords / numBlocks);
  const divisor = computeDivisor(blockEccLen);

  // Each block entry is [value, source]; short blocks get a placeholder so columns line up.
  const blocks: Array<Array<[number, CodewordSource] | null>> = [];
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const len = shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1);
    const blockData = data.slice(k, k + len);
    const entries: Array<[number, CodewordSource] | null> = blockData.map((v, j) => [
      v,
      { kind: 'data', block: i, dataIndex: k + j },
    ]);
    k += len;
    if (i < numShortBlocks) entries.push(null);
    for (const v of computeRemainder(blockData, divisor)) entries.push([v, { kind: 'ecc', block: i }]);
    blocks.push(entries);
  }

  const codewords: number[] = [];
  const sources: CodewordSource[] = [];
  for (let col = 0; col < blocks[0].length; col++) {
    for (const block of blocks) {
      const entry = block[col];
      if (entry) {
        codewords.push(entry[0]);
        sources.push(entry[1]);
      }
    }
  }
  return { codewords, sources };
}

interface Placement {
  pathIndex: number;
  codeword?: number;
  bit?: number;
}

/** Fills the grid along the two-column zigzag, bottom-right first. */
function placeCodewords(
  grid: WorkingGrid,
  codewords: number[],
  sources: CodewordSource[],
): (Placement | null)[][] {
  const { size } = grid;
  const placement: (Placement | null)[][] = Array.from({ length: size }, () =>
    new Array<Placement | null>(size).fill(null),
  );
  const totalBits = codewords.length * 8;
  let i = 0;
  let pathIndex = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // Skip the vertical timing line.
    const upward = ((right + 1) & 2) === 0;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const y = upward ? size - 1 - vert : vert;
        if (grid.region[y][x] !== null) continue;
        if (i < totalBits) {
          const codeword = i >>> 3;
          const bit = 7 - (i & 7);
          grid.dark[y][x] = ((codewords[codeword] >>> bit) & 1) === 1;
          grid.region[y][x] = sources[codeword].kind === 'data' ? 'data' : 'ecc';
          placement[y][x] = { pathIndex: pathIndex++, codeword, bit };
          i++;
        } else {
          grid.dark[y][x] = false;
          grid.region[y][x] = 'remainder';
          placement[y][x] = { pathIndex: pathIndex++ };
        }
      }
    }
  }
  return placement;
}

const MASKABLE: ReadonlySet<Region> = new Set<Region>(['data', 'ecc', 'remainder']);

function applyMask(grid: WorkingGrid, ecc: EccLevel, mask: number): WorkingGrid {
  const pattern = MASK_PATTERNS[mask];
  const out: WorkingGrid = {
    size: grid.size,
    dark: grid.dark.map((row, y) =>
      row.map((d, x) => (MASKABLE.has(grid.region[y][x] as Region) && pattern(x, y) ? !d : d)),
    ),
    region: grid.region.map((row) => [...row]),
  };
  drawFormatBits(out, ecc, mask);
  return out;
}
