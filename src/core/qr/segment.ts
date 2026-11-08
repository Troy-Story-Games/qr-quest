import type { BitRole, Mode, StreamBit } from './types';

export const ALPHANUMERIC_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

const MODE_INDICATOR: Record<Mode, number> = { numeric: 0b0001, alphanumeric: 0b0010, byte: 0b0100 };

/** Length of the character-count field, which grows with the version. */
export function charCountBits(mode: Mode, version: number): number {
  const tier = version <= 9 ? 0 : version <= 26 ? 1 : 2;
  const widths: Record<Mode, [number, number, number]> = {
    numeric: [10, 12, 14],
    alphanumeric: [9, 11, 13],
    byte: [8, 16, 16],
  };
  return widths[mode][tier];
}

/** Picks the most compact single mode that can hold every character. */
export function detectMode(text: string): Mode {
  if (/^[0-9]*$/.test(text)) return 'numeric';
  if ([...text].every((c) => ALPHANUMERIC_CHARSET.includes(c))) return 'alphanumeric';
  return 'byte';
}

/** Collects bits along with their provenance. */
export class BitWriter {
  readonly bits: StreamBit[] = [];

  write(value: number, length: number, role: BitRole, chars?: [number, number]): void {
    for (let i = length - 1; i >= 0; i--) {
      this.bits.push({ value: ((value >>> i) & 1) === 1, role, chars });
    }
  }

  get length(): number {
    return this.bits.length;
  }
}

/** Number of payload bits (excluding header) needed for `chars` in `mode`. */
export function payloadBitLength(chars: string[], mode: Mode): number {
  switch (mode) {
    case 'numeric':
      return Math.floor(chars.length / 3) * 10 + [0, 4, 7][chars.length % 3];
    case 'alphanumeric':
      return Math.floor(chars.length / 2) * 11 + (chars.length % 2) * 6;
    case 'byte':
      return utf8Length(chars) * 8;
  }
}

/** Number of characters reported in the count field (bytes for byte mode). */
export function charCount(chars: string[], mode: Mode): number {
  return mode === 'byte' ? utf8Length(chars) : chars.length;
}

function utf8Length(chars: string[]): number {
  const encoder = new TextEncoder();
  return chars.reduce((sum, c) => sum + encoder.encode(c).length, 0);
}

/** Appends the encoded characters to `writer`, tagging each bit with the characters it carries. */
export function writePayload(writer: BitWriter, chars: string[], mode: Mode): void {
  if (mode === 'numeric') {
    for (let i = 0; i < chars.length; i += 3) {
      const group = chars.slice(i, i + 3).join('');
      writer.write(parseInt(group, 10), group.length * 3 + 1, 'char', [i, i + group.length]);
    }
  } else if (mode === 'alphanumeric') {
    for (let i = 0; i < chars.length; i += 2) {
      const a = ALPHANUMERIC_CHARSET.indexOf(chars[i]);
      if (i + 1 < chars.length) {
        const b = ALPHANUMERIC_CHARSET.indexOf(chars[i + 1]);
        writer.write(a * 45 + b, 11, 'char', [i, i + 2]);
      } else {
        writer.write(a, 6, 'char', [i, i + 1]);
      }
    }
  } else {
    const encoder = new TextEncoder();
    chars.forEach((c, i) => {
      for (const byte of encoder.encode(c)) writer.write(byte, 8, 'char', [i, i + 1]);
    });
  }
}

export function writeHeader(writer: BitWriter, chars: string[], mode: Mode, version: number): void {
  writer.write(MODE_INDICATOR[mode], 4, 'mode');
  writer.write(charCount(chars, mode), charCountBits(mode, version), 'count');
}
