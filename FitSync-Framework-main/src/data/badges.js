export const badges = [
  {
    id: 'first_workout',
    icon: '🎯',
    nameKey: 'badgeFirstWorkout',
    descKey: 'badgeFirstWorkoutDesc',
    condition: (stats) => stats.totalWorkouts >= 1,
    rarity: 'common',
  },
  {
    id: '10_workouts',
    icon: '⭐',
    nameKey: 'badge10Workouts',
    descKey: 'badge10WorkoutsDesc',
    condition: (stats) => stats.totalWorkouts >= 10,
    rarity: 'common',
  },
  {
    id: '50_workouts',
    icon: '🌟',
    nameKey: 'badge50Workouts',
    descKey: 'badge50WorkoutsDesc',
    condition: (stats) => stats.totalWorkouts >= 50,
    rarity: 'rare',
  },
  {
    id: '100_workouts',
    icon: '💯',
    nameKey: 'badge100Workouts',
    descKey: 'badge100WorkoutsDesc',
    condition: (stats) => stats.totalWorkouts >= 100,
    rarity: 'epic',
  },
  {
    id: 'streak_7',
    icon: '🔥',
    nameKey: 'badgeStreak7',
    descKey: 'badgeStreak7Desc',
    condition: (stats) => stats.bestStreak >= 7,
    rarity: 'common',
  },
  {
    id: 'streak_30',
    icon: '🔥🔥',
    nameKey: 'badgeStreak30',
    descKey: 'badgeStreak30Desc',
    condition: (stats) => stats.bestStreak >= 30,
    rarity: 'rare',
  },
  {
    id: 'streak_365',
    icon: '👑',
    nameKey: 'badgeStreak365',
    descKey: 'badgeStreak365Desc',
    condition: (stats) => stats.bestStreak >= 365,
    rarity: 'legendary',
  },
  {
    id: 'pr_breaker',
    icon: '🏆',
    nameKey: 'badgePR',
    descKey: 'badgePRDesc',
    condition: (stats) => stats.totalPRs >= 1,
    rarity: 'common',
  },
  {
    id: '100kg_bench',
    icon: '🦾',
    nameKey: 'badge100kgBench',
    descKey: 'badge100kgBenchDesc',
    condition: (stats) => stats.benchPR >= 100,
    rarity: 'epic',
  },
  {
    id: 'gymreal_streak',
    icon: '📸',
    nameKey: 'badgeGymRealStreak',
    descKey: 'badgeGymRealStreakDesc',
    condition: (stats) => stats.gymRealOnTimeWeek >= 5,
    rarity: 'rare',
  },
  {
    id: 'early_bird',
    icon: '🌅',
    nameKey: 'badgeEarlyBird',
    descKey: 'badgeEarlyBirdDesc',
    condition: (stats) => stats.earlyWorkout === true,
    rarity: 'common',
  },
  {
    id: 'night_owl',
    icon: '🌙',
    nameKey: 'badgeNightOwl',
    descKey: 'badgeNightOwlDesc',
    condition: (stats) => stats.lateWorkout === true,
    rarity: 'common',
  },
];

export const rarityColors = {
  common: '#8b95a5',
  rare: '#4a9eff',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

export function checkBadges(stats, earnedBadgeIds = []) {
  const newBadges = [];
  for (const badge of badges) {
    if (!earnedBadgeIds.includes(badge.id) && badge.condition(stats)) {
      newBadges.push(badge);
    }
  }
  return newBadges;
}

export function getBadgeById(id) {
  return badges.find(b => b.id === id);
}
