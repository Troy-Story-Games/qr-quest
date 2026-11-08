import { motion } from 'motion/react';
import { navigate } from '@/app/router';
import { Emoji } from '@/components/Emoji';
import { GameIcon } from '@/components/GameIcon';
import { Mascot } from '@/components/Mascot';
import { Page } from '@/components/Page';
import { Stars } from '@/components/Stars';
import { BUILD_LEVELS, isBuildLevelUnlocked, nextBuildLevel } from '@/game/buildLevels';
import { useLevel, useProgress } from '@/game/progressStore';
import { QUESTS } from '@/game/quests';
import { playSound } from '@/services/audio/sfx';
import styles from './BuildLevels.module.css';

const QUEST = QUESTS.find((q) => q.id === 'build-a-qr')!;

/** Level map for the Build-a-QR quest. */
export function BuildLevelsScreen({ daily }: { daily: boolean }) {
  const playerLevel = useLevel();
  const stars = useProgress((s) => s.buildLevelStars);
  const next = nextBuildLevel(stars);

  if (QUEST.level > playerLevel) {
    return (
      <Page title={QUEST.title} emoji={QUEST.emoji}>
        <Mascot pose="think" says={`Build-a-QR unlocks at level ${QUEST.level}. Keep playing to level up!`} />
      </Page>
    );
  }

  return (
    <Page title="Build-a-QR" emoji="1f9e9" wide>
      <Mascot
        pose="show"
        says={
          daily
            ? `Daily challenge! Finish level ${next} for bonus XP.`
            : 'Each level, more of the code falls apart. Can you build it all back?'
        }
        size={90}
      />
      <ol className={styles.levels}>
        {BUILD_LEVELS.map((l, i) => {
          const unlocked = isBuildLevelUnlocked(l.level, stars);
          return (
            <motion.li
              key={l.level}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <button
                className={`${styles.card} ${!unlocked ? styles.locked : ''} ${l.level === next ? styles.next : ''}`}
                disabled={!unlocked}
                onClick={() => {
                  playSound('open');
                  navigate(`quests/build-a-qr/${l.level}${daily && l.level === next ? '?daily' : ''}`);
                }}
              >
                <span className={styles.number}>{l.level}</span>
                {unlocked ? (
                  <Emoji code={i === BUILD_LEVELS.length - 1 ? '1f3c6' : '1f9e9'} size={48} />
                ) : (
                  <GameIcon name="locked" size={40} dark />
                )}
                <strong>{l.title}</strong>
                {unlocked && <Stars count={stars[l.level] ?? 0} size={22} />}
              </button>
            </motion.li>
          );
        })}
      </ol>
    </Page>
  );
}
