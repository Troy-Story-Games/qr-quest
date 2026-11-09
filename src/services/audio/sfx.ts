import bit from '@/assets/sounds/bit.ogg';
import close from '@/assets/sounds/close.ogg';
import error from '@/assets/sounds/error.ogg';
import jingleBadge from '@/assets/sounds/jingle-badge.ogg';
import jingleLevelUp from '@/assets/sounds/jingle-levelup.ogg';
import jingleWin from '@/assets/sounds/jingle-win.ogg';
import open from '@/assets/sounds/open.ogg';
import pop from '@/assets/sounds/pop.ogg';
import powerup from '@/assets/sounds/powerup.ogg';
import scratch from '@/assets/sounds/scratch.ogg';
import sparkle from '@/assets/sounds/sparkle.ogg';
import success from '@/assets/sounds/success.ogg';
import tap from '@/assets/sounds/tap.ogg';
import toggle from '@/assets/sounds/toggle.ogg';
import whoosh from '@/assets/sounds/whoosh.ogg';
import { useSettings } from '../settings';
import { getAudioContext } from './context';

const SOUNDS = {
  bit,
  close,
  error,
  jingleBadge,
  jingleLevelUp,
  jingleWin,
  open,
  pop,
  powerup,
  scratch,
  sparkle,
  success,
  tap,
  toggle,
  whoosh,
} as const;

export type SoundName = keyof typeof SOUNDS;

const buffers = new Map<SoundName, Promise<AudioBuffer | null>>();

function load(name: SoundName): Promise<AudioBuffer | null> {
  let pending = buffers.get(name);
  if (!pending) {
    pending = fetch(SOUNDS[name])
      .then((r) => r.arrayBuffer())
      .then((data) => getAudioContext().decodeAudioData(data))
      .catch(() => null);
    buffers.set(name, pending);
  }
  return pending;
}

/** Warms the cache so the first tap doesn't lag. */
export function preloadSounds(): void {
  (Object.keys(SOUNDS) as SoundName[]).forEach((n) => void load(n));
}

export interface PlayOptions {
  volume?: number;
  /** Playback rate; >1 is higher-pitched. Handy for rising "combo" sounds. */
  rate?: number;
}

/** Overall loudness of sound effects, so they sit under the music and speech. */
export const SFX_MASTER = 0.55;

/** Plays a sound effect unless sound effects are muted. */
export function playSound(name: SoundName, { volume = 0.6, rate = 1 }: PlayOptions = {}): void {
  if (!useSettings.getState().sfx) return;
  void load(name).then((buffer) => {
    if (!buffer) return;
    const ctx = getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    const gain = ctx.createGain();
    gain.gain.value = volume * SFX_MASTER;
    source.connect(gain).connect(ctx.destination);
    source.start();
  });
}
