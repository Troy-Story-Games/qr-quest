import { motion } from 'motion/react';
import { useState } from 'react';
import { Emoji } from '@/components/Emoji';
import { GrownUpGate } from '@/components/GrownUpGate';
import { KidButton } from '@/components/KidButton';
import { Mascot } from '@/components/Mascot';
import { Panel } from '@/components/Panel';
import { SpeakButton } from '@/components/SpeakButton';
import { classify, parseClue, parseWifi } from '@/core/payload/payload';
import styles from './ScannerScreen.module.css';

const KIND_INFO = {
  web: { emoji: '1f517', title: 'A website!' },
  wifi: { emoji: '1f4f6', title: 'A WiFi code!' },
  clue: { emoji: '1f5fa', title: 'A treasure clue!' },
  text: { emoji: '1f4dd', title: 'A message!' },
};

interface ScanResultProps {
  text: string;
  /** For treasure hunt clues: how many clues of this hunt have been found. */
  cluesFound?: number;
  onAgain: () => void;
}

/** Shows what a scanned code contains, with the right action for its kind. */
export function ScanResult({ text, cluesFound, onAgain }: ScanResultProps) {
  const kind = classify(text);
  const [gateOpen, setGateOpen] = useState(false);

  const info = KIND_INFO[kind];
  const wifi = kind === 'wifi' ? parseWifi(text) : null;
  const clue = kind === 'clue' ? parseClue(text) : null;

  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
    >
      <Panel tone="green" className={styles.result}>
        <h2>
          <Emoji code={info.emoji} size="1.2em" /> {info.title}
        </h2>

        {wifi && (
          <dl className={styles.details}>
            <dt>Network</dt>
            <dd>{wifi.ssid}</dd>
            <dt>Password</dt>
            <dd>{wifi.password || '(none)'}</dd>
          </dl>
        )}

        {clue && (
          <>
            <p className={styles.clueNumber}>
              Clue {clue.number} of {clue.total}
            </p>
            <p className={styles.message}>{clue.text}</p>
            {cluesFound !== undefined && (
              <div className={styles.huntMeter}>
                {Array.from({ length: clue.total }, (_, i) => (
                  <span key={i} className={i < cluesFound ? styles.huntFound : ''}>
                    <Emoji code={i < cluesFound ? '1f48e' : '1f50d'} size={28} />
                  </span>
                ))}
              </div>
            )}
            {cluesFound !== undefined && cluesFound >= clue.total && (
              <Mascot
                pose="cheer"
                says="You found ALL the clues! You are a treasure hunting champion!"
                size={90}
              />
            )}
          </>
        )}

        {(kind === 'text' || kind === 'web') && <p className={styles.message}>{text}</p>}

        <div className={styles.resultActions}>
          {kind !== 'wifi' && <SpeakButton text={clue ? clue.text : text} />}
          {kind === 'web' && (
            <KidButton onClick={() => setGateOpen(true)}>
              <Emoji code="1f517" /> Open website
            </KidButton>
          )}
          <KidButton variant="good" onClick={onAgain}>
            Scan another
          </KidButton>
        </div>
      </Panel>

      <GrownUpGate
        open={gateOpen}
        action={`open ${text}`}
        onCancel={() => setGateOpen(false)}
        onPass={() => {
          setGateOpen(false);
          window.open(text, '_blank', 'noopener');
        }}
      />
    </motion.div>
  );
}
