import type { QRBuild } from '@/core/qr';

export interface CharBits {
  /** Characters covered by this group (numeric/alphanumeric modes pack several together). */
  chars: [number, number];
  /** The bits as a string like "01001000". */
  bits: string;
  /** What the bits mean as a number. */
  value: number;
  /** Stream index of the first bit. */
  start: number;
}

/** The bit groups that encode each character of the message, in order. */
export function charGroups(build: QRBuild): CharBits[] {
  const groups: CharBits[] = [];
  build.stream.forEach((bit, i) => {
    if (bit.role !== 'char' || !bit.chars) return;
    let group = groups[groups.length - 1];
    if (!group || group.chars[0] !== bit.chars[0] || group.chars[1] !== bit.chars[1]) {
      group = { chars: bit.chars, bits: '', value: 0, start: i };
      groups.push(group);
    }
    group.bits += bit.value ? '1' : '0';
  });
  for (const g of groups) g.value = parseInt(g.bits, 2);
  return groups;
}

export function groupForChar(groups: CharBits[], charIndex: number): CharBits | undefined {
  return groups.find((g) => charIndex >= g.chars[0] && charIndex < g.chars[1]);
}
