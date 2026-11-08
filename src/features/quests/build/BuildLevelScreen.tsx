import { useState } from 'react';
import { navigate } from '@/app/router';
import { KidButton } from '@/components/KidButton';
import { Modal } from '@/components/Modal';
import { Page } from '@/components/Page';
import { Stars } from '@/components/Stars';
import { encode } from '@/core/qr';
import { BuilderBoard } from '@/features/builder/BuilderBoard';
import { BUILD_LEVELS, isBuildLevelUnlocked } from '@/game/buildLevels';
import { holdCelebrationsFor, useCelebrationHold } from '@/game/celebrations';
import { useProgress } from '@/game/progressStore';
import { starsForMistakes } from '@/game/quests';
import { playSound } from '@/services/audio/sfx';
import { burstConfetti } from '@/services/effects/confetti';

function makeCode(level: number) {
  const def = BUILD_LEVELS[level - 1];
  const word = def.words[Math.floor(Math.random() * def.words.length)];
  return encode(word, { ecc: 'L', mode: 'byte', minVersion: def.minVersion });
}

/** One Build-a-QR level: rebuild the missing parts of a code. */
export function BuildLevelScreen({ level, daily }: { level: number; daily: boolean }) {
  const def = BUILD_LEVELS[level - 1];
  const stars = useProgress((s) => s.buildLevelStars);
  const completeBuildLevel = useProgress((s) => s.completeBuildLevel);
  const [attempt, setAttempt] = useState(0);
  const [build, setBuild] = useState(() => makeCode(level));
  const [earned, setEarned] = useState<number | null>(null);
  // Badges and level-ups wait until the results card is closed.
  useCelebrationHold(earned !== null);

  if (!def || !isBuildLevelUnlocked(level, stars)) {
    return (
      <Page title="Level locked">
        <KidButton onClick={() => navigate('quests/build-a-qr')}>Back to the levels</KidButton>
      </Page>
    );
  }

  const replay = () => {
    setBuild(makeCode(level));
    setAttempt((a) => a + 1);
    setEarned(null);
  };

  const next = BUILD_LEVELS[level];

  return (
    <Page title={`Build-a-QR ${level}: ${def.title}`} emoji="1f9e9" wide>
      <BuilderBoard
        key={attempt}
        build={build}
        parts={def.parts}
        intro={def.intro}
        onFinish={(mistakes) => {
          const result = starsForMistakes(mistakes);
          holdCelebrationsFor(1600);
          completeBuildLevel(level, result, daily);
          playSound('jingleWin');
          burstConfetti();
          window.setTimeout(() => setEarned(result), 1200);
        }}
      />
      <Modal open={earned !== null} label="Level complete">
        <h2 style={{ color: 'var(--primary)', fontSize: '2.2rem' }}>Level {level} complete!</h2>
        <Stars count={earned ?? 0} size={64} animate />
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
          <KidButton variant="secondary" onClick={replay}>
            Play again
          </KidButton>
          <KidButton variant="secondary" onClick={() => navigate('quests/build-a-qr')}>
            Levels
          </KidButton>
          {next && (
            <KidButton variant="good" size="lg" onClick={() => navigate(`quests/build-a-qr/${next.level}`)}>
              Next level
            </KidButton>
          )}
        </div>
      </Modal>
    </Page>
  );
}
