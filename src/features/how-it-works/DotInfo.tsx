import type { ModuleInfo, QRBuild } from '@/core/qr';
import { SpeakButton } from '@/components/SpeakButton';
import { groupForChar, type CharBits } from './bits';
import { explainColor, REGION_COLORS, REGION_INFO } from '@/components/qr/regions';
import styles from './LearnScreen.module.css';

const ordinal = (n: number) =>
  `${n}${['th', 'st', 'nd', 'rd'][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10 < 4 ? n % 10 : 0]}`;

/** Explains a tapped dot: what region it is in and, for message dots, which letter and bit. */
export function DotInfo({
  module: m,
  build,
  groups,
}: {
  module: ModuleInfo;
  build: QRBuild;
  groups: CharBits[];
}) {
  const info = REGION_INFO[m.region];
  const lines: string[] = [info.job];
  let group: CharBits | undefined;
  let bitPos = -1;

  if (m.region === 'data') {
    if (m.role === 'char' && m.chars && m.streamBit !== undefined) {
      group = groupForChar(groups, m.chars[0]);
      const letters = build.chars.slice(m.chars[0], m.chars[1]).join('');
      bitPos = group ? m.streamBit - group.start : -1;
      lines[0] = `This dot is part of "${letters === ' ' ? 'space' : letters}".`;
      if (group)
        lines.push(
          `It is the ${ordinal(bitPos + 1)} of ${group.bits.length} bits, and it is a ${group.bits[bitPos]}.`,
        );
    } else if (m.role === 'mode') {
      lines[0] = 'This dot is part of the LABEL that says what kind of message this is.';
    } else if (m.role === 'count') {
      lines[0] = `This dot is part of the COUNTER. It says the message has ${build.mode === 'byte' ? new TextEncoder().encode(build.text).length + ' bytes' : build.chars.length + ' letters'}.`;
    } else {
      lines[0] = 'A FILLER dot. It fills up empty space after the message ends.';
    }
  }
  if (m.region === 'ecc' && m.block !== undefined && build.numBlocks > 1) {
    lines.push(`It belongs to backup group ${m.block + 1} of ${build.numBlocks}.`);
  }
  if (m.masked) lines.push('The mix-up pattern flipped this dot!');

  const swatch = m.region === 'data' ? explainColor(m, true) : REGION_COLORS[m.region];
  const spoken = `${info.name}. ${lines.join(' ')}`;

  return (
    <div className={styles.dotInfo}>
      <div className={styles.dotTitle}>
        <span className={styles.swatch} style={{ background: swatch }} />
        <strong>{info.name}</strong>
        <small>
          (row {m.y + 1}, column {m.x + 1})
        </small>
        <SpeakButton text={spoken} />
      </div>
      {lines.map((l) => (
        <p key={l}>{l}</p>
      ))}
      {group && (
        <div className={styles.bitRow} aria-label={`Bits ${group.bits}`}>
          {[...group.bits].map((b, i) => (
            <span
              key={i}
              className={`${styles.bit} ${b === '1' ? styles.one : ''} ${i === bitPos ? styles.thisBit : ''}`}
            >
              {b}
            </span>
          ))}
          <span className={styles.equals}>= {group.value}</span>
        </div>
      )}
    </div>
  );
}
