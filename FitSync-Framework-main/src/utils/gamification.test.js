import { beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { checkBadges } from '../data/badges.js';

const mockStore = {
  getStats: jest.fn(),
  getEarnedBadges: jest.fn(() => []),
  earnBadge: jest.fn(),
  getWorkouts: jest.fn(() => []),
};

let getCurrentLeague;
let getWeeklyXpGoalProgress;
let LEAGUES;
let checkAndAwardBadges;

beforeAll(async () => {
  await jest.unstable_mockModule('../store.js', () => ({
    store: mockStore,
  }));
  const g = await import('./gamification.ts');
  getCurrentLeague = g.getCurrentLeague;
  getWeeklyXpGoalProgress = g.getWeeklyXpGoalProgress;
  LEAGUES = g.LEAGUES;
  checkAndAwardBadges = g.checkAndAwardBadges;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockStore.getEarnedBadges.mockReturnValue([]);
  mockStore.getWorkouts.mockReturnValue([]);
});

describe('getCurrentLeague', () => {
  test('bronze at 0 XP', () => {
    expect(getCurrentLeague(0).id).toBe('bronze');
  });

  test('silver when XP meets threshold', () => {
    expect(getCurrentLeague(1999).id).toBe('bronze');
    expect(getCurrentLeague(2000).id).toBe('silver');
  });

  test('gold and diamond tiers', () => {
    expect(getCurrentLeague(5000).id).toBe('gold');
    expect(getCurrentLeague(10000).id).toBe('diamond');
    expect(getCurrentLeague(999999).id).toBe('diamond');
  });

  test('LEAGUES minXP order matches getCurrentLeague', () => {
    const sorted = [...LEAGUES].sort((a, b) => a.minXP - b.minXP);
    expect(LEAGUES.map((l) => l.id)).toEqual(sorted.map((l) => l.id));
  });
});

describe('getWeeklyXpGoalProgress', () => {
  test('progress scales with weekly XP earned', () => {
    const bronze = getWeeklyXpGoalProgress(0, 150);
    expect(bronze.target).toBe(300);
    expect(bronze.current).toBe(150);
    expect(bronze.progress).toBeCloseTo(0.5, 5);
    expect(bronze.completed).toBe(false);
    expect(bronze.bonusXP).toBe(150);
    expect(bronze.bonusShield).toBe(false);
    expect(bronze.league.id).toBe('bronze');
  });

  test('caps current at target', () => {
    const r = getWeeklyXpGoalProgress(0, 500);
    expect(r.current).toBe(300);
    expect(r.progress).toBe(1);
    expect(r.completed).toBe(true);
  });

  test('silver league uses higher weekly goal and enables shield bonus flag', () => {
    const r = getWeeklyXpGoalProgress(2500, 500);
    expect(r.league.id).toBe('silver');
    expect(r.target).toBe(500);
    expect(r.completed).toBe(true);
    expect(r.bonusShield).toBe(true);
    expect(r.bonusXP).toBe(250);
  });

  test('diamond league has largest weekly goal', () => {
    const r = getWeeklyXpGoalProgress(50000, 1000);
    expect(r.league.id).toBe('diamond');
    expect(r.target).toBe(1000);
    expect(r.completed).toBe(true);
  });
});

describe('checkBadges (badge earning rules)', () => {
  const empty = {
    totalWorkouts: 0,
    totalVolume: 0,
    totalPRs: 0,
    benchPR: 0,
    bestStreak: 0,
    earlyWorkout: false,
    lateWorkout: false,
    gymRealOnTimeWeek: 0,
  };

  test('first workout badge when totalWorkouts >= 1', () => {
    const ids = checkBadges({ ...empty, totalWorkouts: 1 }).map((b) => b.id);
    expect(ids).toContain('first_workout');
  });

  test('milestone badges at 10 / 50 / 100 workouts', () => {
    expect(checkBadges({ ...empty, totalWorkouts: 10 }).map((b) => b.id)).toContain(
      '10_workouts',
    );
    expect(checkBadges({ ...empty, totalWorkouts: 50 }).map((b) => b.id)).toContain(
      '50_workouts',
    );
    expect(checkBadges({ ...empty, totalWorkouts: 100 }).map((b) => b.id)).toContain(
      '100_workouts',
    );
  });

  test('streak badges', () => {
    expect(checkBadges({ ...empty, bestStreak: 7 }).map((b) => b.id)).toContain('streak_7');
    expect(checkBadges({ ...empty, bestStreak: 30 }).map((b) => b.id)).toContain(
      'streak_30',
    );
    expect(checkBadges({ ...empty, bestStreak: 365 }).map((b) => b.id)).toContain(
      'streak_365',
    );
  });

  test('PR and bench badges', () => {
    expect(checkBadges({ ...empty, totalPRs: 1 }).map((b) => b.id)).toContain('pr_breaker');
    expect(checkBadges({ ...empty, benchPR: 100 }).map((b) => b.id)).toContain('100kg_bench');
  });

  test('gym real streak badge', () => {
    expect(
      checkBadges({ ...empty, gymRealOnTimeWeek: 5 }).map((b) => b.id),
    ).toContain('gymreal_streak');
  });

  test('time-of-day badges', () => {
    expect(checkBadges({ ...empty, earlyWorkout: true }).map((b) => b.id)).toContain(
      'early_bird',
    );
    expect(checkBadges({ ...empty, lateWorkout: true }).map((b) => b.id)).toContain('night_owl');
  });

  test('does not return already earned badges', () => {
    const earned = ['first_workout', '10_workouts'];
    const next = checkBadges({ ...empty, totalWorkouts: 50 }, earned);
    expect(next.map((b) => b.id)).not.toContain('first_workout');
    expect(next.map((b) => b.id)).not.toContain('10_workouts');
    expect(next.map((b) => b.id)).toContain('50_workouts');
  });
});

describe('checkAndAwardBadges', () => {
  test('earns new badges via store and returns them', () => {
    mockStore.getStats.mockReturnValue({
      totalWorkouts: 1,
      totalVolume: 0,
      totalPRs: 0,
      benchPR: 0,
      bestStreak: 0,
      earlyWorkout: false,
      lateWorkout: false,
      gymRealOnTimeWeek: 0,
    });

    const awarded = checkAndAwardBadges();
    expect(awarded.length).toBeGreaterThanOrEqual(1);
    expect(awarded.some((b) => b.id === 'first_workout')).toBe(true);
    expect(mockStore.earnBadge).toHaveBeenCalledWith('first_workout');
  });

  test('does not call earnBadge when nothing new', () => {
    mockStore.getStats.mockReturnValue({
      totalWorkouts: 0,
      totalVolume: 0,
      totalPRs: 0,
      benchPR: 0,
      bestStreak: 0,
      earlyWorkout: false,
      lateWorkout: false,
      gymRealOnTimeWeek: 0,
    });

    const awarded = checkAndAwardBadges();
    expect(awarded).toEqual([]);
    expect(mockStore.earnBadge).not.toHaveBeenCalled();
  });
});
