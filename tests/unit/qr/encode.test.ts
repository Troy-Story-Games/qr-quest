import QRCode from 'qrcode';
import { describe, expect, it } from 'vitest';
import { decodeMatrix, encode, type EccLevel, type Mode } from '@/core/qr';

const LEVELS: EccLevel[] = ['L', 'M', 'Q', 'H'];

/** Matrix from the reference `qrcode` library with identical settings. */
function reference(text: string, mode: Mode, version: number, ecc: EccLevel, mask: number): boolean[][] {
  const qr = QRCode.create([{ data: text, mode } as QRCode.QRCodeSegment], {
    version,
    errorCorrectionLevel: ecc,
    maskPattern: mask as QRCode.QRCodeMaskPattern,
  });
  const { size, data } = qr.modules;
  return Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => data[y * size + x] === 1),
  );
}

/** Text that needs roughly `version` to encode. */
function textFor(version: number): string {
  return 'Hello QR world! '.repeat(Math.max(1, version * version)).slice(0, version * 14);
}

describe('encode', () => {
  it.each(LEVELS)('matches the reference encoder for byte mode at level %s', (ecc) => {
    for (let v = 1; v <= 40; v += 3) {
      const text = textFor(v);
      const build = encode(text, { ecc, mode: 'byte', minVersion: v });
      expect(build.modules).toEqual(reference(text, 'byte', build.version, ecc, build.mask));
    }
  });

  it('matches the reference encoder for numeric and alphanumeric modes', () => {
    const cases: Array<[string, Mode]> = [
      ['0123456789012345', 'numeric'],
      ['31415926535897932384626433832795', 'numeric'],
      ['HELLO WORLD', 'alphanumeric'],
      ['HTTPS://KID.QR/ABC-123', 'alphanumeric'],
    ];
    for (const [text, mode] of cases) {
      for (const ecc of LEVELS) {
        const build = encode(text, { ecc });
        expect(build.mode).toBe(mode);
        expect(build.modules).toEqual(reference(text, mode, build.version, ecc, build.mask));
      }
    }
  });

  it('produces codes that a real decoder can read, for every mask', () => {
    for (let mask = 0; mask < 8; mask++) {
      const text = `Mask ${mask} test ✨🦖`;
      expect(decodeMatrix(encode(text, { ecc: 'M', mask }).modules)).toBe(text);
    }
  });

  it('round-trips emoji and long URLs with automatic mask choice', () => {
    for (const text of ['🍕🚀🌈', 'https://example.com/treasure?clue=under-the-couch', 'a'.repeat(200)]) {
      for (const ecc of LEVELS) expect(decodeMatrix(encode(text, { ecc }).modules)).toBe(text);
    }
  });

  it('records which characters each data module carries', () => {
    const build = encode('HI', { ecc: 'L', mode: 'byte' });
    const charModules = build.info.flat().filter((m) => m.role === 'char');
    expect(charModules).toHaveLength(16);
    expect(charModules.filter((m) => m.chars?.[0] === 0)).toHaveLength(8);
    expect(charModules.filter((m) => m.chars?.[0] === 1)).toHaveLength(8);
  });

  it('labels every module with a region', () => {
    const build = encode('regions', { ecc: 'H', minVersion: 7 });
    const regions = new Set(build.info.flat().map((m) => m.region));
    for (const r of [
      'finder',
      'separator',
      'timing',
      'alignment',
      'format',
      'version',
      'darkModule',
      'data',
      'ecc',
    ]) {
      expect(regions).toContain(r);
    }
  });

  it('throws when the text is too long', () => {
    expect(() => encode('x'.repeat(5000))).toThrow(/too long/);
  });
});
