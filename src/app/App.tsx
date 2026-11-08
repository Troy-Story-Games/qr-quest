import { lazy, Suspense, useEffect } from 'react';
import { HomeScreen } from '@/features/home/HomeScreen';
import { useProgress } from '@/game/progressStore';
import { startMusic, stopMusic } from '@/services/audio/music';
import { useSettings } from '@/services/settings';
import { stopSpeaking } from '@/services/speech/speak';
import { useRoute, type Route } from './router';
import { CelebrationLayer } from './shell/CelebrationLayer';
import { TopBar } from './shell/TopBar';

// Screens load on demand so the home screen appears fast on tablets.
const CreditsScreen = lazy(() =>
  import('@/features/credits/CreditsScreen').then((m) => ({ default: m.CreditsScreen })),
);
const DecorateScreen = lazy(() =>
  import('@/features/decorate/DecorateScreen').then((m) => ({ default: m.DecorateScreen })),
);
const LearnScreen = lazy(() =>
  import('@/features/how-it-works/LearnScreen').then((m) => ({ default: m.LearnScreen })),
);
const MakerScreen = lazy(() =>
  import('@/features/maker/MakerScreen').then((m) => ({ default: m.MakerScreen })),
);
const QuestScreen = lazy(() =>
  import('@/features/quests/QuestScreen').then((m) => ({ default: m.QuestScreen })),
);
const QuestsScreen = lazy(() =>
  import('@/features/quests/QuestsScreen').then((m) => ({ default: m.QuestsScreen })),
);
const ScannerScreen = lazy(() =>
  import('@/features/scanner/ScannerScreen').then((m) => ({ default: m.ScannerScreen })),
);
const ScratchScreen = lazy(() =>
  import('@/features/scratch-lab/ScratchScreen').then((m) => ({ default: m.ScratchScreen })),
);
const TreasureHuntScreen = lazy(() =>
  import('@/features/treasure-hunt/TreasureHuntScreen').then((m) => ({ default: m.TreasureHuntScreen })),
);
const BuildLevelsScreen = lazy(() =>
  import('@/features/quests/build/BuildLevelsScreen').then((m) => ({ default: m.BuildLevelsScreen })),
);
const BuildLevelScreen = lazy(() =>
  import('@/features/quests/build/BuildLevelScreen').then((m) => ({ default: m.BuildLevelScreen })),
);
const HandmadeScreen = lazy(() =>
  import('@/features/handmade/HandmadeScreen').then((m) => ({ default: m.HandmadeScreen })),
);
const TrophiesScreen = lazy(() =>
  import('@/features/trophies/TrophiesScreen').then((m) => ({ default: m.TrophiesScreen })),
);

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case 'make':
      return <MakerScreen />;
    case 'learn':
      return <LearnScreen />;
    case 'scratch':
      return <ScratchScreen />;
    case 'decorate':
      return <DecorateScreen />;
    case 'scan':
      return <ScannerScreen />;
    case 'hunt':
      return <TreasureHuntScreen />;
    case 'quests':
      return <QuestsScreen />;
    case 'quest':
      return <QuestScreen key={route.id} questId={route.id} daily={route.daily} />;
    case 'buildLevels':
      return <BuildLevelsScreen daily={route.daily} />;
    case 'buildLevel':
      return <BuildLevelScreen key={route.level} level={route.level} daily={route.daily} />;
    case 'handmade':
      return <HandmadeScreen />;
    case 'trophies':
      return <TrophiesScreen />;
    case 'credits':
      return <CreditsScreen />;
    default:
      return <HomeScreen />;
  }
}

export function App() {
  const route = useRoute();
  const music = useSettings((s) => s.music);
  const checkIn = useProgress((s) => s.checkIn);

  useEffect(() => checkIn(), [checkIn]);

  useEffect(() => {
    if (music) startMusic();
    else stopMusic();
    return stopMusic;
  }, [music]);

  useEffect(() => {
    stopSpeaking();
    window.scrollTo({ top: 0 });
  }, [route.name]);

  return (
    <>
      <TopBar />
      <Suspense fallback={null}>
        <Screen route={route} />
      </Suspense>
      <CelebrationLayer />
    </>
  );
}
