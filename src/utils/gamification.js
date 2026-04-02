import { badges, checkBadges } from '../data/badges.js';
import { store } from '../store.js';

export const LEAGUES = [
  { id: 'bronze', nameKey: 'leageBronze', icon: '🥉', minXP: 0, color: '#cd7f32' },
  { id: 'silver', nameKey: 'leagueSilver', icon: '🥈', minXP: 2000, color: '#c0c0c0' },
  { id: 'gold', nameKey: 'leagueGold', icon: '🥇', minXP: 5000, color: '#ffd700' },
  { id: 'diamond', nameKey: 'leagueDiamond', icon: '💎', minXP: 10000, color: '#b9f2ff' },
];

export function getCurrentLeague(xp) {
  for (let i = LEAGUES.length - 1; i >= 0; i--) {
    if (xp >= LEAGUES[i].minXP) return LEAGUES[i];
  }
  return LEAGUES[0];
}

export function checkAndAwardBadges() {
  const stats = store.getStats();
  const earned = store.getEarnedBadges();
  const newBadges = checkBadges(stats, earned);

  newBadges.forEach(badge => {
    store.earnBadge(badge.id);
  });

  return newBadges;
}

export const weeklyChallenges = [
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

export function getActiveChallenge() {
  const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return weeklyChallenges[weekNum % weeklyChallenges.length];
}

export function formatTimeAgo(timestamp, lang = 'tr') {
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
  } else {
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  }
}
