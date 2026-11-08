import { LETTER_COLORS, PART_INFO, type PartKey } from './regions';
import styles from './RegionLegend.module.css';

interface RegionLegendProps {
  parts: PartKey[];
  /** Part to emphasise, e.g. the piece currently being placed. */
  active?: PartKey;
}

/** Colour key so kids can tell eyes, rulers, message and backup dots apart. */
export function RegionLegend({ parts, active }: RegionLegendProps) {
  return (
    <ul className={styles.legend} aria-label="Colour key">
      {parts.map((part) => (
        <li key={part} className={part === active ? styles.active : undefined}>
          <span
            className={styles.swatch}
            style={{
              background:
                part === 'message'
                  ? `linear-gradient(90deg, ${LETTER_COLORS.slice(0, 4).join(', ')})`
                  : PART_INFO[part].color,
            }}
          />
          {PART_INFO[part].name}
        </li>
      ))}
    </ul>
  );
}
