import { describe, expect, test } from '@jest/globals';
import {
  LEVELS,
  calculateGymRealXP,
  calculateWorkoutXP,
  formatXP,
  getLevelTitle,
  getStreakMultiplier,
} from './xp.ts';

describe('getLevelTitle', () => {
  test('returns beginner tier for low levels', () => {
    expect(getLevelTitle(1).name).toBe('levelBeginner');
    expect(getLevelTitle(4).name).toBe('levelBeginner');
  });

  test('returns intermediate from level 5', () => {
    expect(getLevelTitle(5).name).toBe('levelIntermediate');
    expect(getLevelTitle(9).name).toBe('levelIntermediate');
  });

  test('returns advanced from level 10', () => {
    expect(getLevelTitle(10).name).toBe('levelAdvanced');
  });

  test('returns highest matching tier (elite vs beast)', () => {
    expect(getLevelTitle(49).name).toBe('levelElite');
    expect(getLevelTitle(50).name).toBe('levelBeast');
    expect(getLevelTitle(100).name).toBe('levelBeast');
  });
});

describe('calculateWorkoutXP', () => {
  test('base XP only for empty workout', () => {
    expect(calculateWorkoutXP({})).toBe(50);
    expect(calculateWorkoutXP({ exercises: [] })).toBe(50);
  });

  test('counts only sets with weight > 0 and reps >= 1', () => {
    const workout = {
      exercises: [
        {
          sets: [
            { weight: 0, reps: 10 },
            { weight: 50, reps: 0 },
            { weight: 40, reps: 8 },
          ],
        },
      ],
    };
    // 50 base + 5 (one valid set) + 15 (one valid exercise)
    expect(calculateWorkoutXP(workout)).toBe(70);
  });

  test('skips exercises with no valid sets', () => {
    const workout = {
      exercises: [
        { sets: [{ weight: 10, reps: 0 }] },
        { sets: [{ weight: 60, reps: 5 }] },
      ],
    };
    // 50 + 5 + 5 (60kg bonus) + 15
    expect(calculateWorkoutXP(workout)).toBe(75);
  });

  test('adds medium and heavy weight bonuses per set', () => {
    const workout = {
      exercises: [
        {
          sets: [
            { weight: 59, reps: 5 },
            { weight: 60, reps: 5 },
            { weight: 99, reps: 3 },
            { weight: 100, reps: 2 },
          ],
        },
      ],
    };
    // base 50 + 4 sets * 5 = 20 + 60kg:+5 + 99kg(>=60):+5 + 100kg:+10 + exercise 15
    const expected = 50 + 20 + 5 + 5 + 10 + 15;
    expect(calculateWorkoutXP(workout)).toBe(expected);
  });

  test('duration bonus in minutes', () => {
    const base = { exercises: [{ sets: [{ weight: 50, reps: 5 }] }] };
    expect(calculateWorkoutXP({ ...base, duration: 29 * 60_000 })).toBe(70);
    expect(calculateWorkoutXP({ ...base, duration: 30 * 60_000 })).toBe(80);
    expect(calculateWorkoutXP({ ...base, duration: 45 * 60_000 })).toBe(90);
    expect(calculateWorkoutXP({ ...base, duration: 60 * 60_000 })).toBe(100);
  });

  test('multiple exercises each add 15 XP bonus', () => {
    const workout = {
      exercises: [
        { sets: [{ weight: 10, reps: 5 }] },
        { sets: [{ weight: 10, reps: 5 }] },
      ],
    };
    // 50 + 5 + 5 + 15 + 15
    expect(calculateWorkoutXP(workout)).toBe(90);
  });
});

describe('calculateGymRealXP', () => {
  test('on-time vs late', () => {
    expect(calculateGymRealXP(true)).toBe(50);
    expect(calculateGymRealXP(false)).toBe(10);
  });
});

describe('getStreakMultiplier', () => {
  test('returns 1.0 below 7 days', () => {
    expect(getStreakMultiplier(0)).toBe(1.0);
    expect(getStreakMultiplier(6)).toBe(1.0);
  });

  test('returns 1.25 from 7 to 13 days', () => {
    expect(getStreakMultiplier(7)).toBe(1.25);
    expect(getStreakMultiplier(13)).toBe(1.25);
  });

  test('returns 1.5 from 14 to 29 days', () => {
    expect(getStreakMultiplier(14)).toBe(1.5);
    expect(getStreakMultiplier(29)).toBe(1.5);
  });

  test('returns 2.0 from 30+ days', () => {
    expect(getStreakMultiplier(30)).toBe(2.0);
    expect(getStreakMultiplier(365)).toBe(2.0);
  });
});

describe('formatXP', () => {
  test('formats thousands with k suffix', () => {
    expect(formatXP(1000)).toBe('1.0k');
    expect(formatXP(1500)).toBe('1.5k');
  });

  test('returns string for values under 1000', () => {
    expect(formatXP(0)).toBe('0');
    expect(formatXP(999)).toBe('999');
  });
});

describe('LEVELS', () => {
  test('minXP tiers are strictly increasing', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].minXP).toBeGreaterThan(LEVELS[i - 1].minXP);
    }
  });
});
