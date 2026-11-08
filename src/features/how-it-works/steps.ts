import { MASK_DESCRIPTIONS, type QRBuild, type Region } from '@/core/qr';
import type { MascotPose } from '@/components/Mascot';

export type StepId =
  'message' | 'eyes' | 'rulers' | 'littleEyes' | 'settings' | 'letters' | 'backup' | 'mask' | 'done';

export interface Step {
  id: StepId;
  title: string;
  says: string;
  pose: MascotPose;
  /** Regions that become visible at this step. */
  reveals: Region[];
}

/** The walkthrough steps for a particular code (some only exist for bigger codes). */
export function stepsFor(build: QRBuild): Step[] {
  const steps: Step[] = [
    {
      id: 'message',
      title: 'Your message',
      says: `Every QR code holds a message. Ours says "${build.text.length > 30 ? build.text.slice(0, 30) + '…' : build.text}". Here is the finished code! Press Next and we'll build it from nothing, dot by dot.`,
      pose: 'wide',
      reveals: [],
    },
    {
      id: 'eyes',
      title: 'Three big eyes',
      says: 'First, three big EYES go in the corners. They help the scanner find the code and know which way is up!',
      pose: 'show',
      reveals: ['finder', 'separator'],
    },
    {
      id: 'rulers',
      title: 'Ruler lines',
      says: 'Next come two dotted RULER lines between the eyes: dark, light, dark, light. They help the scanner count the dots.',
      pose: 'talk',
      reveals: ['timing'],
    },
  ];

  if (build.version >= 2) {
    steps.push({
      id: 'littleEyes',
      title: 'Little eyes',
      says: 'Bigger codes get little eyes too. They help when the code is bent or tilted.',
      pose: 'show',
      reveals: ['alignment'],
    });
  }

  steps.push(
    {
      id: 'settings',
      title: 'Secret settings',
      says:
        build.version >= 7
          ? 'These teal and blue strips are SETTINGS dots. They tell the scanner how big the code is and which tricks we used. They are written twice, just in case!'
          : 'These teal strips are SETTINGS dots. They tell the scanner which tricks we used. They are written twice, just in case! Plus one dot that is always dark.',
      pose: 'think',
      reveals: ['format', 'version', 'darkModule'],
    },
    {
      id: 'letters',
      title: 'Letters become dots',
      says: 'Now the fun part! Each letter becomes a number, and each number becomes dark and light dots. They snake up and down from the bottom-right corner.',
      pose: 'talk',
      reveals: ['data'],
    },
    {
      id: 'backup',
      title: 'Backup dots',
      says: 'Next, BACKUP dots, in pink. They are clever maths copies of the message. If part of the code gets scratched, the scanner can fix it!',
      pose: 'show',
      reveals: ['ecc', 'remainder'],
    },
    {
      id: 'mask',
      title: 'Mix it up!',
      says: `Too many dots in a row can confuse a scanner. So we flip some dots using a pattern called ${MASK_DESCRIPTIONS[build.mask]}. The scanner flips them back!`,
      pose: 'think',
      reveals: [],
    },
    {
      id: 'done',
      title: 'Ta-da!',
      says: 'Our QR code is done! Tap any dot to find out what job it has.',
      pose: 'cheer',
      reveals: [],
    },
  );
  return steps;
}
