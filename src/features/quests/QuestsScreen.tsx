import { motion } from 'motion/react';
import { navigate } from '@/app/router';
import { Emoji } from '@/components/Emoji';
import { GameIcon } from '@/components/GameIcon';
import { Mascot } from '@/components/Mascot';
import { Page } from '@/components/Page';
import { Stars } from '@/components/Stars';
import { useLevel, useProgress } from '@/game/progressStore';
import { QUESTS } from '@/game/quests';
import { playSound } from '@/services/audio/sfx';
import styles from './QuestScreen.module.css';

export function QuestsScreen() {
  const level = useLevel();
  const questStars = useProgress((s) => s.questStars);
  const total = Object.values(questStars).reduce((a, b) => a + b, 0);

  return (
    <Page title="Quests" emoji="1f9e9" wide>
      <Mascot
        pose="show"
        says={`Solve puzzles to earn stars! You have ${total} of ${QUESTS.length * 3} stars.`}
        size={96}
      />
      <div className={styles.questGrid}>
        {QUESTS.map((q, i) => {
          const locked = q.level > level;
          return (
            <motion.button
              key={q.id}
              className={`${styles.questCard} ${locked ? styles.questLocked : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileTap={locked ? undefined : { scale: 0.95 }}
              disabled={locked}
              onClick={() => {
                playSound('open');
                navigate(`quests/${q.id}`);
              }}
            >
              <Emoji code={q.emoji} size={56} />
              <strong>{q.title}</strong>
              <span>{q.blurb}</span>
              {locked ? (
                <span className={styles.lock}>
                  <GameIcon name="locked" size={20} /> Level {q.level}
                </span>
              ) : (
                <Stars count={questStars[q.id] ?? 0} />
              )}
            </motion.button>
          );
        })}
      </div>
    </Page>
  );
}
