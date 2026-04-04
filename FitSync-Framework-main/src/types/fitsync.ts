/** Ortak domain tipleri — kademeli TS geçişi için */

export interface LevelTier {
  level: number;
  name: string;
  minXP: number;
  icon: string;
}

export interface WorkoutSet {
  weight: number;
  reps: number;
}

export interface WorkoutExercise {
  exerciseId?: string;
  sets?: WorkoutSet[];
}

/** calculateWorkoutXP ve challenge hesaplarında kullanılan antrenman şekli */
export interface WorkoutLike {
  exercises?: WorkoutExercise[];
  duration?: number;
  startTime?: number;
}

/** store.getStats() için kullanılan alanlar (badges ile uyumlu) */
export interface UserStats {
  totalWorkouts: number;
  totalVolume: number;
  totalPRs: number;
  benchPR: number;
  bestStreak: number;
  earlyWorkout: boolean;
  lateWorkout: boolean;
  gymRealOnTimeWeek: number;
}

export interface FitSyncStore {
  getStats(): UserStats;
  getEarnedBadges(): string[];
  earnBadge(id: string): void;
  getWorkouts(): WorkoutLike[];
}

export interface League {
  id: string;
  nameKey: string;
  icon: string;
  minXP: number;
  color: string;
  weeklyXpGoal: number;
}

export interface WeeklyXpGoalProgress {
  target: number;
  current: number;
  progress: number;
  completed: boolean;
  bonusXP: number;
  bonusShield: boolean;
  league: League;
}

export interface ChallengeProgress {
  current: number;
  target: number;
  progress: number;
  completed: boolean;
}

export interface BadgeDefinition {
  id: string;
  icon: string;
  nameKey: string;
  descKey: string;
  rarity: string;
  condition: (stats: UserStats) => boolean;
}
