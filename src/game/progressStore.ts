import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '@/services/storage/safeStorage';
import { BADGE_XP, newlyEarnedBadges } from './badges';
import { useCelebrations } from './celebrations';
import { levelForXp } from './levels';
import { DAILY_BONUS_XP, QUEST_XP_PER_STAR } from './quests';
import { EMPTY_STATS, type StatKey, type Stats } from './stats';
import { today, visitStreak, type Streak } from './streak';

interface ProgressData {
  xp: number;
  stats: Stats;
  questStars: Record<string, number>;
  badges: string[];
  streak: Streak;
  dailyDoneOn: string | null;
}

interface ProgressActions {
  /** Award XP with a short label for the toast ("Made a code!"). */
  addXp: (amount: number, label: string) => void;
  bumpStat: (key: StatKey, by?: number) => void;
  /** Raise a stat to `value` if it beats the stored best. */
  recordBest: (key: StatKey, value: number) => void;
  /** Records a finished quest; only improvements earn more XP. */
  completeQuest: (questId: string, stars: number, isDaily: boolean) => void;
  checkIn: () => void;
  importSave: (data: unknown) => boolean;
  reset: () => void;
}

export type ProgressState = ProgressData & ProgressActions;

const INITIAL: ProgressData = {
  xp: 0,
  stats: EMPTY_STATS,
  questStars: {},
  badges: [],
  streak: { count: 0, lastDay: null },
  dailyDoneOn: null,
};

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => {
      const celebrate = useCelebrations.getState().push;

      /** Applies an XP gain, then awards any badges that are now earned. */
      const gainXp = (amount: number, label: string) => {
        const before = levelForXp(get().xp);
        set((s) => ({ xp: s.xp + amount }));
        celebrate({ kind: 'xp', amount, label });
        const after = levelForXp(get().xp);
        if (after > before) celebrate({ kind: 'levelUp', level: after });
        awardBadges();
      };

      const awardBadges = () => {
        const s = get();
        const earned = newlyEarnedBadges(
          { stats: s.stats, xp: s.xp, questStars: s.questStars, streak: s.streak.count },
          s.badges,
        );
        if (earned.length === 0) return;
        set({ badges: [...s.badges, ...earned.map((b) => b.id)] });
        for (const badge of earned) {
          celebrate({ kind: 'badge', badgeId: badge.id });
          gainXp(BADGE_XP, badge.name);
        }
      };

      return {
        ...INITIAL,
        addXp: gainXp,
        bumpStat: (key, by = 1) => {
          set((s) => ({ stats: { ...s.stats, [key]: s.stats[key] + by } }));
          awardBadges();
        },
        recordBest: (key, value) => {
          if (value <= get().stats[key]) return;
          set((s) => ({ stats: { ...s.stats, [key]: value } }));
          awardBadges();
        },
        completeQuest: (questId, stars, isDaily) => {
          const previous = get().questStars[questId] ?? 0;
          set((s) => ({
            questStars: { ...s.questStars, [questId]: Math.max(previous, stars) },
            stats: { ...s.stats, questsPlayed: s.stats.questsPlayed + 1 },
          }));
          const improvement = Math.max(0, stars - previous);
          gainXp(10 + improvement * QUEST_XP_PER_STAR, 'Quest complete!');
          const day = today();
          if (isDaily && get().dailyDoneOn !== day) {
            set({ dailyDoneOn: day });
            gainXp(DAILY_BONUS_XP, 'Daily challenge!');
          }
        },
        checkIn: () => {
          set((s) => ({ streak: visitStreak(s.streak, today()) }));
          awardBadges();
        },
        importSave: (data) => {
          if (!isProgressData(data)) return false;
          set({ ...INITIAL, ...data, stats: { ...EMPTY_STATS, ...data.stats } });
          return true;
        },
        reset: () => set(INITIAL),
      };
    },
    {
      name: 'kidqr-progress',
      version: 1,
      storage: persistStorage,
      partialize: ({ xp, stats, questStars, badges, streak, dailyDoneOn }) => ({
        xp,
        stats,
        questStars,
        badges,
        streak,
        dailyDoneOn,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ProgressData>;
        return { ...current, ...p, stats: { ...EMPTY_STATS, ...p.stats } };
      },
    },
  ),
);

function isProgressData(value: unknown): value is ProgressData {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.xp === 'number' && typeof v.stats === 'object' && Array.isArray(v.badges);
}

/** Snapshot suitable for a downloadable save file. */
export function exportSave(): ProgressData {
  const { xp, stats, questStars, badges, streak, dailyDoneOn } = useProgress.getState();
  return { xp, stats, questStars, badges, streak, dailyDoneOn };
}

export const useLevel = () => useProgress((s) => levelForXp(s.xp));
