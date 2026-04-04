import { checkBadges } from '../data/badges.js';
import { store } from '../store.js';
import type {
  BadgeDefinition,
  ChallengeProgress,
  FitSyncStore,
  League,
  WeeklyXpGoalProgress,
} from '../types/fitsync.js';

const storeApi = store as FitSyncStore;

export const LEAGUES: League[] = [
  { id: 'bronze', nameKey: 'leagueBronze', icon: '🥉', minXP: 0, color: '#cd7f32', weeklyXpGoal: 300 },
  { id: 'silver', nameKey: 'leagueSilver', icon: '🥈', minXP: 2000, color: '#c0c0c0', weeklyXpGoal: 500 },
  { id: 'gold', nameKey: 'leagueGold', icon: '🥇', minXP: 5000, color: '#ffd700', weeklyXpGoal: 750 },
  { id: 'diamond', nameKey: 'leagueDiamond', icon: '💎', minXP: 10000, color: '#b9f2ff', weeklyXpGoal: 1000 },
];

export function getCurrentLeague(xp: number): League {
  for (let i = LEAGUES.length - 1; i >= 0; i--) {
    if (xp >= LEAGUES[i].minXP) return LEAGUES[i];
  }
  return LEAGUES[0];
}

export function getWeeklyXpGoalProgress(
  totalXP: number,
  weeklyXPearned: number
): WeeklyXpGoalProgress {
  const league = getCurrentLeague(totalXP);
  const target = league.weeklyXpGoal;
  const current = Math.min(weeklyXPearned, target);
  const progress = current / target;
  const completed = current >= target;
  const bonusXP = Math.round(target * 0.5);
  const bonusShield = completed && league.id !== 'bronze';
  return { target, current, progress, completed, bonusXP, bonusShield, league };
}

export function checkAndAwardBadges(): BadgeDefinition[] {
  const stats = storeApi.getStats();
  const earned = storeApi.getEarnedBadges();
  const newBadges = checkBadges(stats, earned) as BadgeDefinition[];

  newBadges.forEach((badge) => {
    storeApi.earnBadge(badge.id);
  });

  return newBadges;
}

export interface WeeklyChallenge {
  id: string;
  titleTR: string;
  titleEN: string;
  target: number;
  xpReward: number;
  icon: string;
  exerciseId?: string;
  category?: string;
  type?: string;
}

export const weeklyChallenges: WeeklyChallenge[] = [
  {
    id: 'wc_squat_5',
    titleTR: 'Bu hafta 5 kez squat yap',
    titleEN: 'Do squats 5 times this week',
    target: 5,
    exerciseId: 'squat',
    xpReward: 200,
    icon: '🦵',
  },
  {
    id: 'wc_bench_king',
    titleTR: 'Salonunda en çok bench basan ol',
    titleEN: 'Be the top bench presser at your gym',
    target: 1,
    exerciseId: 'bench_press',
    xpReward: 300,
    icon: '🏋️',
  },
  {
    id: 'wc_cardio_3',
    titleTR: '3 gün kardiyo yap',
    titleEN: 'Do cardio 3 days',
    target: 3,
    category: 'cardio',
    xpReward: 150,
    icon: '🏃',
  },
  {
    id: 'wc_volume_king',
    titleTR: '10,000kg toplam hacim kaldır',
    titleEN: 'Lift 10,000kg total volume',
    target: 10000,
    type: 'volume',
    xpReward: 250,
    icon: '💪',
  },
];

export function getActiveChallenge(): WeeklyChallenge {
  const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return weeklyChallenges[weekNum % weeklyChallenges.length];
}

export function getChallengeProgress(): ChallengeProgress {
  const challenge = getActiveChallenge();
  const workouts = storeApi.getWorkouts();

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const weekWorkouts = workouts.filter((w) => (w.startTime ?? 0) >= startOfWeek.getTime());

  let current = 0;
  const target = challenge.target;

  if (challenge.exerciseId) {
    weekWorkouts.forEach((w) => {
      const hasExercise = (w.exercises || []).some((ex) => ex.exerciseId === challenge.exerciseId);
      if (hasExercise) current++;
    });
  } else if (challenge.type === 'volume') {
    weekWorkouts.forEach((w) => {
      (w.exercises || []).forEach((ex) => {
        (ex.sets || []).forEach((s) => {
          current += (s.weight || 0) * (s.reps || 0);
        });
      });
    });
  } else if (challenge.category) {
    current = weekWorkouts.length;
  }

  const progress = Math.min(current / target, 1);
  return { current, target, progress, completed: current >= target };
}

export function formatTimeAgo(timestamp: number, lang: 'tr' | 'en' = 'tr'): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (lang === 'tr') {
    if (minutes < 1) return 'Az önce';
    if (minutes < 60) return `${minutes} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;
    return `${Math.floor(days / 7)} hafta önce`;
  }
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}
