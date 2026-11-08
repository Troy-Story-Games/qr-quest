import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { navigate } from '@/app/router';
import { KidButton } from '@/components/KidButton';
import { Mascot, type MascotPose } from '@/components/Mascot';
import { Page } from '@/components/Page';
import { Panel } from '@/components/Panel';
import { Stars } from '@/components/Stars';
import { holdCelebrationsFor } from '@/game/celebrations';
import { useLevel, useProgress } from '@/game/progressStore';
import { QUESTS, starsForMistakes } from '@/game/quests';
import { playSound } from '@/services/audio/sfx';
import { burstConfetti } from '@/services/effects/confetti';
import { PUZZLES } from './puzzles';
import styles from './QuestScreen.module.css';

const NEXT_ROUND_DELAY = 1400;

/** Runs a quest: rounds, mistakes, Bitsy's reactions and the star award. */
export function QuestScreen({ questId, daily }: { questId: string; daily: boolean }) {
  const quest = QUESTS.find((q) => q.id === questId);
  const puzzle = PUZZLES[questId];
  const level = useLevel();
  const completeQuest = useProgress((s) => s.completeQuest);

  const [attempt, setAttempt] = useState(0);
  const [round, setRound] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; pose: MascotPose } | null>(null);
  const [stars, setStars] = useState<number | null>(null);
  const mistakesRef = useRef(0);
  const advancing = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const answer = useCallback((correct: boolean, text?: string) => {
    if (correct) {
      playSound('success', { volume: 0.4 });
      if (text) setFeedback({ text, pose: 'cheer' });
    } else {
      playSound('error');
      mistakesRef.current += 1;
      setMistakes(mistakesRef.current);
      setFeedback({ text: text ?? 'Oops! Try again.', pose: 'hurt' });
    }
  }, []);

  const roundDone = useCallback(
    (text?: string) => {
      if (advancing.current || !puzzle) return;
      advancing.current = true;
      playSound('sparkle');
      if (text) setFeedback({ text, pose: 'cheer2' });
      timer.current = window.setTimeout(() => {
        advancing.current = false;
        if (round + 1 >= puzzle.rounds) {
          const earned = starsForMistakes(mistakesRef.current);
          // Let the stars land before level-ups and badges.
          holdCelebrationsFor(2600);
          setStars(earned);
          completeQuest(questId, earned, daily);
          playSound('jingleWin');
          burstConfetti();
        } else {
          setRound((r) => r + 1);
          setFeedback(null);
        }
      }, NEXT_ROUND_DELAY);
    },
    [puzzle, round, completeQuest, questId, daily],
  );

  if (!quest || !puzzle) {
    return (
      <Page title="Quest not found">
        <KidButton onClick={() => navigate('quests')}>Back to quests</KidButton>
      </Page>
    );
  }

  if (quest.level > level) {
    return (
      <Page title={quest.title} emoji={quest.emoji}>
        <Mascot pose="think" says={`This quest unlocks at level ${quest.level}. Keep playing to level up!`} />
        <KidButton onClick={() => navigate('quests')}>Back to quests</KidButton>
      </Page>
    );
  }

  const restart = () => {
    setAttempt((a) => a + 1);
    setRound(0);
    mistakesRef.current = 0;
    setMistakes(0);
    setFeedback(null);
    setStars(null);
  };

  const Puzzle = puzzle.Component;

  return (
    <Page title={daily ? `Daily: ${quest.title}` : quest.title} emoji={quest.emoji} wide>
      {stars === null ? (
        <div className={styles.layout}>
          <Panel tone="purple" className={styles.puzzle}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${attempt}-${round}`}
                initial={{ x: 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -60, opacity: 0 }}
              >
                <Puzzle round={round} answer={answer} roundDone={roundDone} />
              </motion.div>
            </AnimatePresence>
          </Panel>
          <div className={styles.side}>
            <div className={styles.rounds} aria-label={`Round ${round + 1} of ${puzzle.rounds}`}>
              {Array.from({ length: puzzle.rounds }, (_, i) => (
                <span key={i} className={i < round ? styles.roundDone : i === round ? styles.roundNow : ''} />
              ))}
            </div>
            <Mascot pose={feedback?.pose ?? 'talk'} says={feedback?.text ?? puzzle.intro} size={100} />
            <p className={styles.mistakes}>Oopsies: {mistakes}</p>
          </div>
        </div>
      ) : (
        <Panel tone="yellow" className={styles.finish}>
          <h2>Quest complete!</h2>
          <Stars count={stars} size={72} animate />
          <Mascot
            pose="cheer"
            says={
              stars === 3
                ? 'PERFECT! Three stars!'
                : stars === 2
                  ? 'Great job! Can you get three stars?'
                  : 'You did it! Practice makes perfect!'
            }
            size={100}
          />
          <div className={styles.finishActions}>
            <KidButton size="lg" variant="secondary" onClick={restart}>
              Play again
            </KidButton>
            <KidButton size="lg" onClick={() => navigate('quests')}>
              More quests
            </KidButton>
          </div>
        </Panel>
      )}
    </Page>
  );
}
