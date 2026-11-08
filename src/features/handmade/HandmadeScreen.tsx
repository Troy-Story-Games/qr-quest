import { useMemo, useState } from 'react';
import { useCurrentCode } from '@/app/currentCode';
import { navigate } from '@/app/router';
import { Emoji } from '@/components/Emoji';
import { KidButton } from '@/components/KidButton';
import { Mascot } from '@/components/Mascot';
import { Page } from '@/components/Page';
import { encode, type QRBuild } from '@/core/qr';
import { BuilderBoard } from '@/features/builder/BuilderBoard';
import { holdCelebrationsFor } from '@/game/celebrations';
import { useProgress } from '@/game/progressStore';
import { playSound } from '@/services/audio/sfx';
import { burstConfetti } from '@/services/effects/confetti';

/** Longer messages turn into a slog of tiny pieces, so hand-building is capped. */
const MAX_CHARS = 24;
const MAX_VERSION = 3;
const ALL_PARTS = [
  'eyes',
  'rulers',
  'littleEyes',
  'settings',
  'label',
  'message',
  'filler',
  'backup',
] as const;

function tryEncode(text: string, ecc: QRBuild['ecc']): QRBuild | null {
  try {
    return encode(text, { ecc });
  } catch {
    return null;
  }
}

/** Build your own message into a QR code, piece by piece. */
export function HandmadeScreen() {
  const { text, ecc, setText } = useCurrentCode();
  const build = useMemo(() => tryEncode(text, ecc), [text, ecc]);
  const [attempt, setAttempt] = useState(0);
  const [finished, setFinished] = useState(false);
  const { addXp, bumpStat } = useProgress();

  const tooBig = !build || [...text].length > MAX_CHARS || build.version > MAX_VERSION;

  if (!text || tooBig) {
    const shorter = [...text].slice(0, MAX_CHARS).join('');
    return (
      <Page title="Build it by hand" emoji="1f9e9">
        <Mascot
          pose="think"
          says={
            text
              ? `That message would need lots and lots of pieces! Hand-built codes work best with ${MAX_CHARS} letters or fewer.`
              : 'First type a message in Make a Code!'
          }
        />
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
          <KidButton variant="secondary" onClick={() => navigate('make')}>
            <Emoji code="1f4dd" /> Change my message
          </KidButton>
          {text && <KidButton onClick={() => setText(shorter)}>Make it shorter for me</KidButton>}
        </div>
      </Page>
    );
  }

  return (
    <Page title="Build it by hand" emoji="1f9e9" wide>
      <BuilderBoard
        key={`${build.text}-${build.ecc}-${attempt}`}
        build={build}
        parts={[...ALL_PARTS]}
        intro={`Let's build "${build.text}" piece by piece! Pick a piece from the box and tap where it glows.`}
        onFinish={() => {
          holdCelebrationsFor(2500);
          bumpStat('handBuilt');
          addXp(40, 'Built a code by hand!');
          playSound('jingleWin');
          burstConfetti();
          setFinished(true);
        }}
      />
      {finished && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20, justifyContent: 'center' }}>
          <KidButton
            variant="secondary"
            onClick={() => {
              setFinished(false);
              setAttempt((a) => a + 1);
            }}
          >
            Build it again
          </KidButton>
          <KidButton onClick={() => navigate('make')}>
            <Emoji code="1f4dd" /> Make another code
          </KidButton>
          <KidButton variant="good" onClick={() => navigate('decorate')}>
            <Emoji code="1f3a8" /> Decorate it
          </KidButton>
        </div>
      )}
    </Page>
  );
}
