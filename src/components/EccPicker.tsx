import { ECC_INFO, type EccLevel } from '@/core/qr';
import { playSound } from '@/services/audio/sfx';
import { Emoji } from './Emoji';
import styles from './EccPicker.module.css';

/** Chooses the error-correction ("backup dots") level. */
export function EccPicker({
  value,
  onChange,
  disabled,
}: {
  value: EccLevel;
  onChange: (e: EccLevel) => void;
  disabled?: boolean;
}) {
  return (
    <div className={styles.picker} role="radiogroup" aria-label="Backup level">
      {(Object.keys(ECC_INFO) as EccLevel[]).map((level) => (
        <button
          key={level}
          role="radio"
          aria-checked={value === level}
          disabled={disabled}
          className={`${styles.option} ${value === level ? styles.active : ''}`}
          onClick={() => {
            playSound('toggle');
            onChange(level);
          }}
        >
          <span className={styles.shields}>
            {Array.from({ length: ECC_INFO[level].shields }, (_, i) => (
              <Emoji key={i} code="1f6e1" size={18} />
            ))}
          </span>
          <strong>{ECC_INFO[level].name}</strong>
          <small>fixes {ECC_INFO[level].percent}%</small>
        </button>
      ))}
    </div>
  );
}
