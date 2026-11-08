import { motion } from 'motion/react';
import type { QRBuild } from '@/core/qr';
import { playSound } from '@/services/audio/sfx';
import { groupForChar, type CharBits } from './bits';
import { letterColor } from './colors';
import styles from './LearnScreen.module.css';

const MAX_SHOWN = 24;

interface LetterStripProps {
  build: QRBuild;
  groups: CharBits[];
  selected: number | null;
  onSelect: (charIndex: number | null) => void;
  showBits: boolean;
}

/** The message as colourful letter cards. Tapping one lights up its dots. */
export function LetterStrip({ build, groups, selected, onSelect, showBits }: LetterStripProps) {
  const chars = build.chars.slice(0, MAX_SHOWN);
  return (
    <div className={styles.letters}>
      {chars.map((c, i) => {
        const group = groupForChar(groups, i);
        const isGroupStart = group?.chars[0] === i;
        return (
          <motion.button
            key={i}
            className={`${styles.letter} ${selected === i ? styles.letterSelected : ''}`}
            style={{ '--letter': letterColor(group ? group.chars[0] : i) } as React.CSSProperties}
            initial={{ rotateY: 90 }}
            animate={{ rotateY: 0 }}
            transition={{ delay: i * 0.05 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              playSound('pop', { rate: 0.8 + (i % 8) * 0.08 });
              onSelect(selected === i ? null : i);
            }}
          >
            <span className={styles.letterChar}>{c === ' ' ? '␣' : c}</span>
            {showBits && group && isGroupStart && <span className={styles.letterBits}>{group.bits}</span>}
          </motion.button>
        );
      })}
      {build.chars.length > MAX_SHOWN && (
        <span className={styles.more}>+{build.chars.length - MAX_SHOWN} more</span>
      )}
    </div>
  );
}
