import { useCallback, useEffect, useRef, useState } from 'react';
import { Emoji } from '@/components/Emoji';
import { KidButton } from '@/components/KidButton';
import { Mascot } from '@/components/Mascot';
import { Page } from '@/components/Page';
import { Panel } from '@/components/Panel';
import { parseClue } from '@/core/payload/payload';
import { useHunt } from '@/game/huntStore';
import { holdCelebrationsFor } from '@/game/celebrations';
import { useProgress } from '@/game/progressStore';
import { scanImageFile, startScanner, type ScannerHandle } from '@/services/camera/qrScanner';
import { playSound } from '@/services/audio/sfx';
import { burstConfetti } from '@/services/effects/confetti';
import { ScanResult } from './ScanResult';
import styles from './ScannerScreen.module.css';

type CameraState = 'off' | 'starting' | 'on' | 'error';

/** Unique codes rewarded this session. */
const rewarded = new Set<string>();

export function ScannerScreen() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<ScannerHandle | null>(null);
  const pausedRef = useRef(false);
  const [camera, setCamera] = useState<CameraState>('off');
  const [result, setResult] = useState<string | null>(null);
  const [cluesFound, setCluesFound] = useState<number | undefined>(undefined);
  const [fileError, setFileError] = useState(false);
  const { addXp, bumpStat } = useProgress();

  const handleResult = useCallback(
    (text: string) => {
      if (pausedRef.current) return;
      pausedRef.current = true;
      // Show what was scanned before any badge pops up over it.
      holdCelebrationsFor(1800);
      playSound('success');
      navigator.vibrate?.(80);
      setResult(text);
      if (!rewarded.has(text)) {
        rewarded.add(text);
        bumpStat('scans');
        addXp(15, 'Scanned a code!');
      }

      const clue = parseClue(text);
      if (!clue) {
        setCluesFound(undefined);
        return;
      }
      const hunt = useHunt.getState();
      const isNew = hunt.markFound(clue);
      const found = hunt.foundOf(clue.total);
      setCluesFound(found);
      if (isNew) {
        bumpStat('cluesFound');
        addXp(20, 'Found a clue!');
        burstConfetti();
        if (found >= clue.total) setTimeout(() => playSound('jingleWin'), 300);
      }
    },
    [addXp, bumpStat],
  );

  const start = async () => {
    if (!videoRef.current) return;
    setCamera('starting');
    try {
      scannerRef.current = await startScanner(videoRef.current, handleResult);
      setCamera('on');
    } catch {
      setCamera('error');
    }
  };

  useEffect(() => () => scannerRef.current?.stop(), []);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setFileError(false);
    const text = await scanImageFile(file).catch(() => null);
    if (text) handleResult(text);
    else setFileError(true);
  };

  const scanAgain = () => {
    setResult(null);
    pausedRef.current = false;
  };

  const says =
    camera === 'error'
      ? "I can't use the camera. Ask a grown-up to allow it, or pick a photo of a QR code instead!"
      : camera === 'on'
        ? 'Point the camera at a QR code. Hold steady…'
        : 'Tap the big button to turn on the camera!';

  return (
    <Page title="Scanner" emoji="1f4f7" wide>
      <div className={styles.layout}>
        <Panel tone="purple" className={styles.cameraPanel}>
          <div className={styles.viewport}>
            <video ref={videoRef} className={styles.video} muted playsInline />
            {camera === 'on' && !result && <div className={styles.scanLine} />}
            {camera === 'on' && <div className={styles.frame} />}
            {camera !== 'on' && (
              <div className={styles.placeholder}>
                <Emoji code="1f4f7" size={96} />
              </div>
            )}
          </div>
          {camera !== 'on' && (
            <KidButton size="lg" variant="good" onClick={start} disabled={camera === 'starting'}>
              {camera === 'starting' ? 'Starting…' : 'Turn on camera'}
            </KidButton>
          )}
          <label className={styles.fileButton}>
            <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
            <Emoji code="1f50d" /> Scan a photo instead
          </label>
          {fileError && <p className={styles.error}>No QR code found in that picture.</p>}
        </Panel>

        <div className={styles.side}>
          {result ? (
            <ScanResult text={result} cluesFound={cluesFound} onAgain={scanAgain} />
          ) : (
            <Mascot pose="think" says={says} size={100} />
          )}
        </div>
      </div>
    </Page>
  );
}
