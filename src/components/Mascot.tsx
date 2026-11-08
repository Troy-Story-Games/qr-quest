import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import cheer0 from '@/assets/images/mascot/robot-cheer0.png';
import cheer1 from '@/assets/images/mascot/robot-cheer1.png';
import hurt from '@/assets/images/mascot/robot-hurt.png';
import idle from '@/assets/images/mascot/robot-idle.png';
import show from '@/assets/images/mascot/robot-show.png';
import talk from '@/assets/images/mascot/robot-talk.png';
import think from '@/assets/images/mascot/robot-think.png';
import wide from '@/assets/images/mascot/robot-wide.png';
import { useSettings } from '@/services/settings';
import { speak } from '@/services/speech/speak';
import styles from './Mascot.module.css';
import { SpeakButton } from './SpeakButton';

const POSES = { idle, cheer: cheer0, cheer2: cheer1, hurt, show, talk, think, wide };
export type MascotPose = keyof typeof POSES;

/** The robot guide's name, used in dialogue. */
export const MASCOT_NAME = 'Bitsy';

interface MascotProps {
  pose?: MascotPose;
  /** What Bitsy says. Changes animate in a speech bubble. */
  says?: string;
  size?: number;
  side?: 'left' | 'right';
}

/** Bitsy the robot, with a speech bubble and read-aloud. */
export function Mascot({ pose = 'idle', says, size = 120, side = 'left' }: MascotProps) {
  const autoSpeak = useSettings((s) => s.autoSpeak);

  useEffect(() => {
    if (says && autoSpeak) speak(says);
  }, [says, autoSpeak]);

  return (
    <div className={`${styles.wrap} ${side === 'right' ? styles.right : ''}`}>
      <motion.img
        key={pose}
        src={POSES[pose]}
        alt={`${MASCOT_NAME} the robot`}
        className={styles.robot}
        style={{ width: size }}
        initial={{ y: 10, scale: 0.9 }}
        animate={{ y: [0, -6, 0], scale: 1 }}
        transition={{ y: { repeat: Infinity, duration: 2.4, ease: 'easeInOut' } }}
        draggable={false}
      />
      <AnimatePresence mode="wait">
        {says && (
          <motion.div
            key={says}
            className={styles.bubble}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <p>{says}</p>
            <SpeakButton text={says} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
