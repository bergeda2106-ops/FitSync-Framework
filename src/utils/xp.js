export const LEVELS = [
  { level: 1, name: 'levelBeginner', minXP: 0, icon: '🌱' },
  { level: 5, name: 'levelIntermediate', minXP: 1000, icon: '💪' },
  { level: 10, name: 'levelAdvanced', minXP: 4500, icon: '⚡' },
  { level: 20, name: 'levelAthlete', minXP: 19000, icon: '🏅' },
  { level: 35, name: 'levelElite', minXP: 59500, icon: '🔱' },
  { level: 50, name: 'levelBeast', minXP: 122500, icon: '👑' },
];

export function getLevelTitle(level) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (level >= LEVELS[i].level) return LEVELS[i];
  }
  return LEVELS[0];
}

export function calculateWorkoutXP(workout) {
  let xp = 0;

  // Base XP for completing a workout
  xp += 50;

  // XP per exercise (only count exercises with at least 1 valid set)
  let validExerciseCount = 0;
  (workout.exercises || []).forEach(ex => {
    const validSets = (ex.sets || []).filter(s => s.weight > 0 && s.reps >= 1);
    if (validSets.length === 0) return; // skip empty/invalid exercises
    validExerciseCount++;

    validSets.forEach(s => {
      xp += 5; // per valid set
      // Bonus for heavy weight
      if (s.weight >= 100) xp += 10;
      else if (s.weight >= 60) xp += 5;
    });
  });

  xp += validExerciseCount * 15;

  // Duration bonus
  const durationMin = (workout.duration || 0) / 60000;
  if (durationMin >= 60) xp += 30;
  else if (durationMin >= 45) xp += 20;
  else if (durationMin >= 30) xp += 10;

  return xp;
}

export function calculateGymRealXP(onTime) {
  return onTime ? 50 : 10;
}

export function getStreakMultiplier(streak) {
  if (streak >= 30) return 2.0;
  if (streak >= 14) return 1.5;
  if (streak >= 7) return 1.25;
  return 1.0;
}

export function formatXP(xp) {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
  return xp.toString();
}
