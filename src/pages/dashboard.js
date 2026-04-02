import { t, i18n } from '../i18n/index.js';
import { store, getSimulatedFeed } from '../store.js';
import { getLevelTitle, formatXP } from '../utils/xp.js';
import { getCurrentLeague, formatTimeAgo, getActiveChallenge } from '../utils/gamification.js';

export function renderDashboard() {
  const user = store.getUser();
  const xpInfo = store.getXPInfo();
  const streak = store.get('streak');
  const levelInfo = getLevelTitle(xpInfo.level);
  const league = getCurrentLeague(xpInfo.total);
  const lang = i18n.getLang();
  const feed = getSimulatedFeed();
  const challenge = getActiveChallenge();

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

      <!-- Challenge -->
      <div class="challenge-card glass-card">
        <div class="challenge-header">
          <span class="challenge-icon">${challenge.icon}</span>
          <h3>${t('challengeTitle')}</h3>
          <span class="challenge-badge">${t('challengeWeekly')}</span>
        </div>
        <p class="challenge-text">${lang === 'tr' ? challenge.titleTR : challenge.titleEN}</p>
        <div class="challenge-reward">
          <span>🎁 +${challenge.xpReward} XP</span>
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

  // Feed like buttons
  document.querySelectorAll('.feed-like-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const isLiked = btn.classList.toggle('liked');
      const count = parseInt(btn.textContent.trim().split(' ').pop()) || 0;
      btn.innerHTML = `${isLiked ? '❤️' : '🤍'} ${isLiked ? count + 1 : count - 1}`;
    });
  });
}
