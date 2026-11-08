import { motion } from 'motion/react';
import { navigate } from '@/app/router';
import { Emoji } from '@/components/Emoji';
import { KidButton } from '@/components/KidButton';
import { Mascot } from '@/components/Mascot';
import { Page } from '@/components/Page';
import { useProgress } from '@/game/progressStore';
import { dailyQuestId, QUESTS } from '@/game/quests';
import { today } from '@/game/streak';
import { playSound } from '@/services/audio/sfx';
import styles from './HomeScreen.module.css';

const TILES = [
  {
    path: 'make',
    title: 'Make a Code',
    blurb: 'Type anything, get a code!',
    emoji: '1f4dd',
    color: '#6c4cf1',
  },
  { path: 'learn', title: 'How It Works', blurb: 'Watch a code get built', emoji: '1f393', color: '#ff4d6d' },
  { path: 'quests', title: 'Quests', blurb: 'Puzzles & stars', emoji: '1f9e9', color: '#14b8a6' },
  { path: 'scan', title: 'Scanner', blurb: 'Use the camera', emoji: '1f4f7', color: '#3a86ff' },
  { path: 'scratch', title: 'Scratch Lab', blurb: 'Can you break it?', emoji: '1f9ea', color: '#ff8c42' },
  { path: 'decorate', title: 'Decorate', blurb: 'Colours & stickers', emoji: '1f3a8', color: '#c026d3' },
  { path: 'hunt', title: 'Treasure Hunt', blurb: 'Hide clues at home', emoji: '1f5fa', color: '#16a34a' },
  { path: 'trophies', title: 'Trophies', blurb: 'Badges & levels', emoji: '1f3c6', color: '#eab308' },
];

const GREETINGS = [
  "Hi! I'm Bitsy! QR codes are secret messages made of dots. Let's crack them!",
  'Welcome back, code explorer! What shall we make today?',
  'Did you know? A QR code can still work even when part of it is missing!',
  'Beep boop! Every dot in a QR code has a job. Want to find out what it is?',
];

export function HomeScreen() {
  const dailyDone = useProgress((s) => s.dailyDoneOn === today());
  const codesMade = useProgress((s) => s.stats.codesMade);
  const daily = QUESTS.find((q) => q.id === dailyQuestId(today()))!;
  const greeting =
    codesMade === 0 ? GREETINGS[0] : GREETINGS[1 + (new Date().getDate() % (GREETINGS.length - 1))];

  return (
    <Page title="What do you want to do?" wide>
      <Mascot pose="wide" says={greeting} />

      <motion.button
        className={styles.daily}
        onClick={() => {
          playSound('open');
          navigate(`quests/${daily.id}?daily`);
        }}
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.02 }}
        disabled={dailyDone}
      >
        <Emoji code="1f4c5" size={48} />
        <span>
          <strong>Daily Challenge</strong>
          <span>{dailyDone ? 'Done for today! Come back tomorrow.' : `${daily.title}: bonus XP today!`}</span>
        </span>
        {!dailyDone && <Emoji code="1f381" size={40} />}
      </motion.button>

      <div className={styles.grid}>
        {TILES.map((tile, i) => (
          <motion.button
            key={tile.path}
            className={styles.tile}
            style={{ '--tile': tile.color } as React.CSSProperties}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.05 * i, type: 'spring', stiffness: 300, damping: 20 }}
            whileTap={{ scale: 0.93 }}
            whileHover={{ y: -4, rotate: i % 2 ? 1 : -1 }}
            onClick={() => {
              playSound('open');
              navigate(tile.path);
            }}
          >
            <Emoji code={tile.emoji} size={64} />
            <strong>{tile.title}</strong>
            <span>{tile.blurb}</span>
          </motion.button>
        ))}
      </div>

      <div className={styles.footer}>
        <KidButton variant="ghost" onClick={() => navigate('credits')}>
          Credits & thanks
        </KidButton>
      </div>
    </Page>
  );
}
