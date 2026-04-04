import { t, i18n } from '../i18n/index.js';
import { store, getSimulatedFeed } from '../store.js';
import { getLevelTitle, formatXP } from '../utils/xp.js';
import { getCurrentLeague, formatTimeAgo, getActiveChallenge, getChallengeProgress, getWeeklyXpGoalProgress } from '../utils/gamification.js';

export function renderDashboard() {
  const user = store.getUser();
  const xpInfo = store.getXPInfo();
  const streak = store.get('streak');
  const levelInfo = getLevelTitle(xpInfo.level);
  const league = getCurrentLeague(xpInfo.total);
  const lang = i18n.getLang();
  const feed = getSimulatedFeed();
  const challenge = getActiveChallenge();
  const challengeProgress = getChallengeProgress();
  const activeWorkout = store.getActiveWorkout();

  // Weekly XP Goal
  const weeklyXP = store.getWeeklyXP();
  const weeklyXpGoal = getWeeklyXpGoalProgress(xpInfo.total, weeklyXP);

  // Greeting based on time
  const hour = new Date().getHours();
  let greeting;
  if (hour < 12) greeting = t('dashGreetingMorning');
  else if (hour < 18) greeting = t('dashGreetingAfternoon');
  else greeting = t('dashGreetingEvening');

  // Quote of the day
  const quotes = t('quotes');
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const todayQuote = quotes[dayOfYear % quotes.length];

  // Workouts this week
  const workouts = store.getWorkouts();
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const weekWorkouts = workouts.filter(w => w.startTime >= startOfWeek.getTime());

  // Weekly summary
  const weekId = store.getWeekId();
  const dismissedWeekId = store.getWeeklySummaryDismissed();
  const showWeeklySummary = dismissedWeekId !== weekId && workouts.length > 0;
  const lastWeekStats = store.getLastWeekStats();

  let summaryMsg;
  if (lastWeekStats.workoutCount >= 5) summaryMsg = t('weeklySummaryGreat');
  else if (lastWeekStats.workoutCount >= 2) summaryMsg = t('weeklySummaryGood');
  else summaryMsg = t('weeklySummaryStart');

  // Challenge progress text
  let progressText = '';
  if (challenge.type === 'volume') {
    const currentFormatted = challengeProgress.current >= 1000 ? `${(challengeProgress.current / 1000).toFixed(1)}k` : challengeProgress.current;
    const targetFormatted = challenge.target >= 1000 ? `${(challenge.target / 1000).toFixed(0)}k` : challenge.target;
    progressText = `${currentFormatted} / ${targetFormatted} kg`;
  } else {
    progressText = `${challengeProgress.current} / ${challengeProgress.target}`;
  }

  return `
    <div class="page page-dashboard" id="pageDashboard">
      <!-- Header -->
      <header class="dash-header">
        <div class="dash-greeting">
          <h1>${greeting}, <span class="text-gradient">${user?.name || 'Sporcu'}</span> 👋</h1>
          <p class="dash-tagline">${t('tagline')}</p>
        </div>
        <div class="dash-header-actions">
          <div class="league-badge" style="background: ${league.color}20; border-color: ${league.color}">
            <span>${league.icon}</span>
          </div>
        </div>
      </header>

      <!-- Active Workout Banner -->
      ${activeWorkout ? `
        <div class="active-workout-banner glass-card" id="activeWorkoutBanner">
          <div class="awb-left">
            <span class="awb-pulse"></span>
            <div class="awb-info">
              <span class="awb-title">${lang === 'tr' ? '🏋️ Aktif Antrenman' : '🏋️ Active Workout'}</span>
              <span class="awb-detail">${activeWorkout.exercises.length} ${lang === 'tr' ? 'egzersiz' : 'exercises'}</span>
            </div>
          </div>
          <button class="awb-continue-btn" id="continueWorkoutBtn">
            ${lang === 'tr' ? 'Devam Et →' : 'Continue →'}
          </button>
        </div>
      ` : ''}

      <!-- Weekly Summary Card -->
      ${showWeeklySummary ? `
        <div class="weekly-summary-card glass-card" id="weeklySummaryCard">
          <div class="weekly-summary-header">
            <span class="weekly-summary-icon">📊</span>
            <h3>${t('weeklySummaryTitle')}</h3>
            <button class="weekly-summary-dismiss" id="dismissWeeklySummary">✕</button>
          </div>
          <div class="weekly-summary-stats">
            <div class="ws-stat">
              <span class="ws-stat-value">${lastWeekStats.workoutCount}</span>
              <span class="ws-stat-label">${t('weeklySummaryWorkouts')}</span>
            </div>
            <div class="ws-stat">
              <span class="ws-stat-value">${lastWeekStats.totalVolume >= 1000 ? (lastWeekStats.totalVolume / 1000).toFixed(1) + 'k' : lastWeekStats.totalVolume}kg</span>
              <span class="ws-stat-label">${t('weeklySummaryVolume')}</span>
            </div>
            <div class="ws-stat">
              <span class="ws-stat-value">${lastWeekStats.totalSets}</span>
              <span class="ws-stat-label">${t('weeklySummarySets')}</span>
            </div>
          </div>
          <p class="weekly-summary-msg">${summaryMsg}</p>
        </div>
      ` : ''}

      <!-- Streak & XP Bar -->
      <div class="dash-stats-row">
        <div class="stat-card stat-streak glass-card">
          <div class="streak-fire ${streak.current > 0 ? 'active' : ''}">🔥</div>
          <div class="stat-value">${streak.current}</div>
          <div class="stat-label">${t('dashStreakDays')} ${t('dashStreak')}</div>
        </div>
        <div class="stat-card stat-level glass-card">
          <div class="level-icon">${levelInfo.icon}</div>
          <div class="stat-value">${xpInfo.level}</div>
          <div class="stat-label">${t('dashLevel')}</div>
        </div>
        <div class="stat-card stat-xp glass-card">
          <div class="xp-icon">⭐</div>
          <div class="stat-value">${formatXP(xpInfo.total)}</div>
          <div class="stat-label">XP</div>
        </div>
      </div>

      <!-- XP Progress Bar -->
      <div class="xp-progress-container glass-card">
        <div class="xp-progress-header">
          <span>${t('dashLevel')} ${xpInfo.level} ${t(levelInfo.name)}</span>
          <span>${xpInfo.xpInLevel}/${xpInfo.xpForNext} XP</span>
        </div>
        <div class="xp-progress-bar">
          <div class="xp-progress-fill" style="width: ${xpInfo.progress * 100}%"></div>
        </div>
        <div class="xp-progress-footer">
          <span>${t('dashXpToNext')}: ${xpInfo.xpForNext - xpInfo.xpInLevel} XP</span>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="dash-quick-actions">
        <button class="quick-action-btn primary-action" id="dashStartWorkout">
          <span class="action-icon">💪</span>
          <span class="action-label">${t('dashStartWorkout')}</span>
        </button>
        <button class="quick-action-btn secondary-action" id="dashGymReal">
          <span class="action-icon">📸</span>
          <span class="action-label">${t('dashQuickGymReal')}</span>
        </button>
      </div>

      <!-- Weekly Goal -->
      <div class="weekly-goal glass-card">
        <h3>${t('dashWeeklyGoal')}</h3>
        <div class="goal-progress">
          <div class="goal-dots">
            ${[0,1,2,3,4,5,6].map(i => `
              <div class="goal-dot ${i < weekWorkouts.length ? 'completed' : ''}">${i < weekWorkouts.length ? '✓' : ''}</div>
            `).join('')}
          </div>
          <span class="goal-text">${weekWorkouts.length}/7 ${t('dashWorkoutsThisWeek')}</span>
        </div>
      </div>

      <!-- Challenge with Progress Bar -->
      <div class="challenge-card glass-card ${challengeProgress.completed ? 'challenge-complete' : ''}">
        <div class="challenge-header">
          <span class="challenge-icon">${challenge.icon}</span>
          <h3>${t('challengeTitle')}</h3>
          ${challengeProgress.completed ? '<span class="challenge-done-badge">✅</span>' : ''}
          <span class="challenge-badge">${t('challengeWeekly')}</span>
        </div>
        <p class="challenge-text">${lang === 'tr' ? challenge.titleTR : challenge.titleEN}</p>
        
        <!-- Challenge Progress Bar -->
        <div class="challenge-progress">
          <div class="challenge-progress-bar">
            <div class="challenge-progress-fill ${challengeProgress.completed ? 'complete' : ''}" style="width: ${challengeProgress.progress * 100}%"></div>
          </div>
          <div class="challenge-progress-info">
            <span class="challenge-progress-text">${progressText}</span>
            <span class="challenge-progress-pct">${Math.round(challengeProgress.progress * 100)}%</span>
          </div>
        </div>

        <div class="challenge-reward">
          <span>🎁 +${challenge.xpReward} XP</span>
        </div>
      </div>

      <!-- Weekly XP Goal Card -->
      <div class="weekly-xp-card glass-card ${weeklyXpGoal.completed ? 'weekly-xp-complete' : ''}" id="weeklyXpCard">
        <div class="weekly-xp-header">
          <span class="weekly-xp-icon">⚡</span>
          <div class="weekly-xp-title">
            <h3>${t('weeklyXpGoal')}</h3>
            <span class="weekly-xp-league" style="color: ${weeklyXpGoal.league.color}">
              ${weeklyXpGoal.league.icon} ${t(weeklyXpGoal.league.nameKey)}
            </span>
          </div>
          ${weeklyXpGoal.completed ? `<span class="weekly-xp-done">🎉</span>` : ''}
        </div>
        <div class="weekly-xp-progress">
          <div class="weekly-xp-bar">
            <div class="weekly-xp-fill ${weeklyXpGoal.completed ? 'complete' : ''}" 
                 style="width: ${Math.min(weeklyXpGoal.progress * 100, 100)}%">
            </div>
          </div>
          <div class="weekly-xp-info">
            <span>${formatXP(weeklyXpGoal.current)} / ${formatXP(weeklyXpGoal.target)} XP</span>
            <span>${Math.round(weeklyXpGoal.progress * 100)}%</span>
          </div>
        </div>
        <div class="weekly-xp-rewards">
          <span class="weekly-xp-reward-item">🎁 +${formatXP(weeklyXpGoal.bonusXP)} ${t('weeklyXpReward')}</span>
          ${weeklyXpGoal.bonusShield ? `<span class="weekly-xp-reward-item shield-reward">🛡️ +1 ${t('streakShield')}</span>` : ''}
        </div>
      </div>

      <!-- Motivation Quote -->
      <div class="motivation-card glass-card">
        <div class="quote-icon">💬</div>
        <p class="quote-text">"${todayQuote}"</p>
        <span class="quote-label">${t('dashMotivation')}</span>
      </div>

      <!-- Social Feed -->
      <div class="social-feed">
        <h2 class="section-title">${t('dashSocialFeed')}</h2>
        ${feed.slice(0, 5).map(item => `
          <div class="feed-item glass-card" data-feed-id="${item.id}">
            <div class="feed-avatar">${item.user.avatar}</div>
            <div class="feed-content">
              <div class="feed-header">
                <strong>${item.user.name}</strong>
                <span class="feed-time">${formatTimeAgo(item.timestamp, lang)}</span>
              </div>
              <p class="feed-text">${t(item.textKey)} ${item.detail ? `<span class="feed-detail">${item.detail}</span>` : ''}</p>
              <div class="feed-actions">
                <button class="feed-like-btn ${item.liked ? 'liked' : ''}" data-feed-id="${item.id}">
                  ${item.liked ? '❤️' : '🤍'} ${item.likes}
                </button>
                <button class="feed-comment-btn">💬</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function initDashboard(navigateTo) {
  const startBtn = document.getElementById('dashStartWorkout');
  if (startBtn) {
    startBtn.addEventListener('click', () => navigateTo('workout'));
  }

  const gymRealBtn = document.getElementById('dashGymReal');
  if (gymRealBtn) {
    gymRealBtn.addEventListener('click', () => navigateTo('gymreal'));
  }

  // Continue workout banner
  const continueBtn = document.getElementById('continueWorkoutBtn');
  if (continueBtn) {
    continueBtn.addEventListener('click', () => navigateTo('workout'));
  }

  // Dismiss weekly summary
  const dismissBtn = document.getElementById('dismissWeeklySummary');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      store.dismissWeeklySummary();
      const card = document.getElementById('weeklySummaryCard');
      if (card) {
        card.style.animation = 'slideDown 0.3s ease reverse forwards';
        setTimeout(() => card.remove(), 300);
      }
    });
  }

  // Feed like buttons
  document.querySelectorAll('.feed-like-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const isLiked = btn.classList.toggle('liked');
      const count = parseInt(btn.textContent.trim().split(' ').pop()) || 0;
      btn.innerHTML = `${isLiked ? '❤️' : '🤍'} ${isLiked ? count + 1 : count - 1}`;
    });
  });
}
