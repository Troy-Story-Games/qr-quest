import { describe, expect, it } from 'vitest';
import { BADGES, newlyEarnedBadges } from '@/game/badges';
import { levelForXp, levelProgress, xpForLevel } from '@/game/levels';
import { dailyQuestId, QUESTS, starsForMistakes } from '@/game/quests';
import { EMPTY_STATS } from '@/game/stats';
import { visitStreak } from '@/game/streak';

describe('levels', () => {
  it('starts at level 1 and grows with XP', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(xpForLevel(2) - 1)).toBe(1);
    expect(levelForXp(xpForLevel(2))).toBe(2);
    expect(levelForXp(xpForLevel(7))).toBe(7);
  });

  it('reports progress within a level', () => {
    expect(levelProgress(0)).toBe(0);
    expect(levelProgress(xpForLevel(2) / 2)).toBeCloseTo(0.5);
  });
});

describe('streak', () => {
  it('counts consecutive days and resets after a gap', () => {
    let s = visitStreak({ count: 0, lastDay: null }, '2026-11-01');
    expect(s.count).toBe(1);
    s = visitStreak(s, '2026-11-01');
    expect(s.count).toBe(1);
    s = visitStreak(s, '2026-11-02');
    expect(s.count).toBe(2);
    s = visitStreak(s, '2026-11-05');
    expect(s.count).toBe(1);
  });

  it('handles month boundaries', () => {
    expect(visitStreak({ count: 4, lastDay: '2026-10-31' }, '2026-11-01').count).toBe(5);
  });
});

describe('badges', () => {
  const ctx = { stats: EMPTY_STATS, xp: 0, questStars: {}, streak: 0 };

  it('awards nothing to a brand-new player', () => {
    expect(newlyEarnedBadges(ctx, [])).toEqual([]);
  });

  it('awards first-code once', () => {
    const made = { ...ctx, stats: { ...EMPTY_STATS, codesMade: 1 } };
    expect(newlyEarnedBadges(made, []).map((b) => b.id)).toEqual(['first-code']);
    expect(newlyEarnedBadges(made, ['first-code'])).toEqual([]);
  });

  it('awards champion only when every quest has 3 stars', () => {
    const almost = Object.fromEntries(QUESTS.map((q, i) => [q.id, i === 0 ? 2 : 3]));
    const ids = (stars: Record<string, number>) =>
      newlyEarnedBadges({ ...ctx, questStars: stars }, []).map((b) => b.id);
    expect(ids(almost)).not.toContain('champion');
    expect(ids({ ...almost, [QUESTS[0].id]: 3 })).toContain('champion');
  });

  it('has unique ids', () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
  });
});

describe('quests', () => {
  it('maps mistakes to stars', () => {
    expect([0, 1, 2, 3, 9].map(starsForMistakes)).toEqual([3, 2, 2, 1, 1]);
  });

  it('picks a stable daily quest', () => {
    expect(dailyQuestId('2026-11-08')).toBe(dailyQuestId('2026-11-08'));
    expect(QUESTS.map((q) => q.id)).toContain(dailyQuestId('2026-11-09'));
  });
});
