import { t, i18n } from '../i18n/index.js';
import { store } from '../store.js';
import { getLevelTitle, formatXP } from '../utils/xp.js';
import { getCurrentLeague } from '../utils/gamification.js';
import { badges, rarityColors } from '../data/badges.js';
import { showModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { getExerciseById } from '../data/exercises.js';

export function renderProfile() {
  const user = store.getUser();
  const xpInfo = store.getXPInfo();
  const stats = store.getStats();
  const levelInfo = getLevelTitle(xpInfo.level);
  const league = getCurrentLeague(xpInfo.total);
  const earnedBadgeIds = store.getEarnedBadges();
  const pinnedBadgeIds = store.getPinnedBadges();
  const lang = i18n.getLang();

  const earnedBadges = badges.filter(b => earnedBadgeIds.includes(b.id));
  const lockedBadges = badges.filter(b => !earnedBadgeIds.includes(b.id));
  const pinnedBadges = badges.filter(b => pinnedBadgeIds.includes(b.id));

  // Streak calendar (last 30 days)
  const workouts = store.getWorkouts();
  const streakDays = new Set();
  workouts.forEach(w => {
    streakDays.add(new Date(w.startTime).toDateString());
  });

  const last30Days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    last30Days.push({
      date: d,
      dayNum: d.getDate(),
      hasWorkout: streakDays.has(d.toDateString()),
      isToday: d.toDateString() === new Date().toDateString(),
    });
  }

  // Weight log data
  const weightLog = store.getWeightLog();
  const weightChartData = buildWeightChartSVG(weightLog);

  // Streak shield
  const shieldCount = store.getStreakShields();

  // Volume analytics
  const workoutsData = store.getWorkouts();
  const volumeData = buildMuscleVolumeData(workoutsData);

  return `
    <div class="page page-profile" id="pageProfile">
      <header class="page-header">
        <h1>${t('profileTitle')}</h1>
        <button class="settings-gear" id="settingsBtn">⚙️</button>
      </header>

      <!-- User Card -->
      <div class="profile-card glass-card">
        <div class="profile-avatar-large">
          <span class="avatar-emoji">🏋️</span>
          <span class="level-ring" style="--progress: ${xpInfo.progress}">${xpInfo.level}</span>
        </div>
        <div class="profile-info">
          <h2 class="profile-name">${user?.name || 'Sporcu'}</h2>
          <div class="profile-league" style="color: ${league.color}">
            ${league.icon} ${t(league.nameKey)}
          </div>
          <div class="profile-level-badge">
            ${levelInfo.icon} ${t(levelInfo.name)} • Lv.${xpInfo.level}
          </div>
        </div>
        <!-- Pinned Badges -->
        ${pinnedBadges.length > 0 ? `
          <div class="pinned-badges">
            ${pinnedBadges.map(b => `
              <span class="pinned-badge" title="${t(b.nameKey)}" style="border-color: ${rarityColors[b.rarity]}">${b.icon}</span>
            `).join('')}
          </div>
        ` : ''}
        <button class="edit-profile-btn" id="editProfileBtn">✏️ ${t('profileEdit')}</button>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-tile glass-card">
          <span class="stat-tile-value">${stats.totalWorkouts}</span>
          <span class="stat-tile-label">${t('profileTotalWorkouts')}</span>
        </div>
        <div class="stat-tile glass-card">
          <span class="stat-tile-value">${stats.totalVolume >= 1000 ? (stats.totalVolume / 1000).toFixed(1) + 'k' : stats.totalVolume}kg</span>
          <span class="stat-tile-label">${t('profileTotalVolume')}</span>
        </div>
        <div class="stat-tile glass-card">
          <span class="stat-tile-value">${stats.bestStreak}</span>
          <span class="stat-tile-label">${t('profileBestStreak')}</span>
        </div>
        <div class="stat-tile glass-card">
          <span class="stat-tile-value">${formatXP(xpInfo.total)}</span>
          <span class="stat-tile-label">${t('profileCurrentXP')}</span>
        </div>
      </div>

      <!-- Streak Shield -->
      <div class="streak-shield-card glass-card">
        <div class="shield-card-left">
          <span class="shield-icon-lg">🛡️</span>
          <div class="shield-info">
            <h4>${t('streakShield')}</h4>
            <p class="shield-desc">${t('streakShieldDesc')}</p>
          </div>
        </div>
        <div class="shield-count ${shieldCount === 0 ? 'shield-empty' : ''}">
          <span class="shield-num">${shieldCount}</span>
          <span class="shield-label">${t('streakShieldCount')}</span>
        </div>
      </div>

      <!-- Weight Tracker -->
      <div class="weight-tracker glass-card">
        <div class="weight-tracker-header">
          <h3>⚖️ ${t('weightTracker')}</h3>
          <button class="weight-add-btn" id="weightAddBtn">+ ${t('weightAdd')}</button>
        </div>
        ${weightLog.length > 0 ? `
          <div class="weight-current-row">
            <div class="weight-current">
              <span class="weight-current-value">${weightLog[weightLog.length - 1].weight}</span>
              <span class="weight-current-unit">kg</span>
            </div>
            ${weightLog.length >= 2 ? `
              <div class="weight-change ${weightLog[weightLog.length - 1].weight < weightLog[weightLog.length - 2].weight ? 'down' : weightLog[weightLog.length - 1].weight > weightLog[weightLog.length - 2].weight ? 'up' : 'same'}">
                ${getWeightChangeIndicator(weightLog)}
              </div>
            ` : ''}
          </div>
          <div class="weight-chart" id="weightChart">
            ${weightChartData}
          </div>
          <div class="weight-chart-label">${t('weightLast30')}</div>
        ` : `
          <div class="weight-empty">
            <p>⚖️ ${t('weightNoData')}</p>
          </div>
        `}
      </div>

      <!-- Volume Analytics -->
      <div class="volume-analytics glass-card">
        <div class="volume-header">
          <h3>${t('volumeAnalytics')}</h3>
          <span class="volume-period">${t('thisWeek')}</span>
        </div>
        ${volumeData.length === 0
          ? `<p class="volume-empty">💪 ${t('volumeNoData')}</p>`
          : `<div class="volume-bars">
            ${volumeData.map(m => `
              <div class="volume-muscle-row">
                <span class="volume-muscle-label">${m.icon} ${lang === 'tr' ? m.nameTR : m.nameEN}</span>
                <div class="volume-bar-container">
                  <div class="volume-bar-fill" style="width: ${m.pct}%; background: ${m.color}"></div>
                </div>
                <span class="volume-muscle-val">${m.volume >= 1000 ? (m.volume/1000).toFixed(1)+'k' : m.volume}kg</span>
              </div>
            `).join('')}
          </div>`
        }
      </div>

      <!-- Streak Calendar -->
      <div class="streak-calendar glass-card">
        <h3>🔥 ${t('dashStreak')} ${lang === 'tr' ? 'Takvimi' : 'Calendar'}</h3>
        <div class="calendar-grid">
          ${last30Days.map(d => `
            <div class="cal-day ${d.hasWorkout ? 'active' : ''} ${d.isToday ? 'today' : ''}">
              <span class="cal-num">${d.dayNum}</span>
              ${d.hasWorkout ? '<span class="cal-check">🔥</span>' : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Badges -->
      <div class="badges-section glass-card">
        <h3>🏆 ${t('profileBadges')}</h3>
        
        ${earnedBadges.length > 0 ? `
          <div class="badges-earned">
            <h4>${t('profileAllBadges')} (${earnedBadges.length}/${badges.length})</h4>
            <div class="badges-grid">
              ${earnedBadges.map(b => `
                <div class="badge-item earned ${pinnedBadgeIds.includes(b.id) ? 'pinned' : ''}" 
                     data-badge-id="${b.id}"
                     style="border-color: ${rarityColors[b.rarity]}">
                  <span class="badge-icon">${b.icon}</span>
                  <span class="badge-name">${t(b.nameKey)}</span>
                  <span class="badge-rarity" style="color: ${rarityColors[b.rarity]}">${b.rarity}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="badges-locked">
          <div class="badges-grid">
            ${lockedBadges.map(b => `
              <div class="badge-item locked">
                <span class="badge-icon locked-icon">🔒</span>
                <span class="badge-name">${t(b.nameKey)}</span>
                <span class="badge-desc">${t(b.descKey)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- XP Progress Detail -->
      <div class="xp-detail glass-card">
        <h3>⭐ XP ${lang === 'tr' ? 'Detayı' : 'Details'}</h3>
        <div class="xp-bar-large">
          <div class="xp-bar-fill" style="width: ${xpInfo.progress * 100}%"></div>
        </div>
        <div class="xp-detail-info">
          <span>${formatXP(xpInfo.xpInLevel)} / ${formatXP(xpInfo.xpForNext)} XP</span>
          <span>${t('dashLevel')} ${xpInfo.level} → ${xpInfo.level + 1}</span>
        </div>
      </div>
    </div>
  `;
}

function getWeightChangeIndicator(weightLog) {
  const current = weightLog[weightLog.length - 1].weight;
  const previous = weightLog[weightLog.length - 2].weight;
  const diff = (current - previous).toFixed(1);
  if (diff > 0) return `↑ +${diff}kg`;
  if (diff < 0) return `↓ ${diff}kg`;
  return '= 0kg';
}

// 📊 Muscle group volume analytics (this week)
function buildMuscleVolumeData(workouts) {
  const muscleGroups = [
    { id: 'chest',     nameTR: 'Göğüs',   nameEN: 'Chest',     icon: '💪', color: '#f87171', categories: ['chest'] },
    { id: 'back',      nameTR: 'Sırt',     nameEN: 'Back',      icon: '🔙', color: '#60a5fa', categories: ['back'] },
    { id: 'legs',      nameTR: 'Bacak',    nameEN: 'Legs',      icon: '🦵', color: '#4ade80', categories: ['legs'] },
    { id: 'shoulders', nameTR: 'Omuz',     nameEN: 'Shoulders', icon: '🏋️', color: '#facc15', categories: ['shoulders'] },
    { id: 'arms',      nameTR: 'Kol',      nameEN: 'Arms',      icon: '💪', color: '#c084fc', categories: ['arms'] },
    { id: 'core',      nameTR: 'Karın',    nameEN: 'Core',      icon: '🎯', color: '#fb923c', categories: ['core'] },
    { id: 'cardio',    nameTR: 'Kardiyo',  nameEN: 'Cardio',    icon: '🏃', color: '#34d399', categories: ['cardio'] },
  ];

  // Filter to this week's workouts
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const weekWorkouts = workouts.filter(w => w.startTime >= startOfWeek.getTime());

  // Aggregate volume by exercise category
  const volumeMap = {};
  weekWorkouts.forEach(w => {
    (w.exercises || []).forEach(ex => {
      const exData = getExerciseById(ex.exerciseId);
      if (!exData) return;
      const cat = exData.category || 'other';
      const exVolume = (ex.sets || []).reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);
      volumeMap[cat] = (volumeMap[cat] || 0) + exVolume;
    });
  });

  // Map to muscle groups, sort by volume desc
  const result = muscleGroups
    .map(mg => ({
      ...mg,
      volume: mg.categories.reduce((s, c) => s + (volumeMap[c] || 0), 0),
    }))
    .filter(mg => mg.volume > 0)
    .sort((a, b) => b.volume - a.volume);

  if (result.length === 0) return [];

  const maxVol = result[0].volume;
  return result.map(mg => ({ ...mg, pct: Math.round((mg.volume / maxVol) * 100) }));
}


function buildWeightChartSVG(weightLog) {
  if (weightLog.length < 2) return '<div class="weight-chart-placeholder">📊</div>';

  const last30 = weightLog.slice(-30);
  const weights = last30.map(e => e.weight);
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;
  const range = maxW - minW || 1;

  const width = 320;
  const height = 100;
  const padding = 10;

  const points = last30.map((entry, i) => {
    const x = padding + (i / (last30.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((entry.weight - minW) / range) * (height - 2 * padding);
    return `${x},${y}`;
  });

  const pathD = points.map((p, i) => (i === 0 ? 'M' : 'L') + p).join(' ');
  
  // Area fill
  const areaD = pathD + ` L${padding + ((last30.length - 1) / (last30.length - 1)) * (width - 2 * padding)},${height - padding} L${padding},${height - padding} Z`;

  return `
    <svg viewBox="0 0 ${width} ${height}" class="weight-svg">
      <defs>
        <linearGradient id="weightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color: var(--primary); stop-opacity: 0.3"/>
          <stop offset="100%" style="stop-color: var(--primary); stop-opacity: 0.02"/>
        </linearGradient>
      </defs>
      <path d="${areaD}" fill="url(#weightGrad)" />
      <path d="${pathD}" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      ${last30.map((entry, i) => {
        const x = padding + (i / (last30.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((entry.weight - minW) / range) * (height - 2 * padding);
        return i === last30.length - 1 ? `<circle cx="${x}" cy="${y}" r="4" fill="var(--primary)" stroke="var(--bg-main)" stroke-width="2"/>` : '';
      }).join('')}
      <text x="${padding}" y="${padding + 4}" class="chart-label" fill="var(--text-secondary)" font-size="8">${maxW.toFixed(0)}kg</text>
      <text x="${padding}" y="${height - 2}" class="chart-label" fill="var(--text-secondary)" font-size="8">${minW.toFixed(0)}kg</text>
    </svg>
  `;
}

export function initProfile(navigateTo) {
  // Settings button
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => openSettings(navigateTo));
  }

  // Edit profile
  const editBtn = document.getElementById('editProfileBtn');
  if (editBtn) {
    editBtn.addEventListener('click', () => openEditProfile(navigateTo));
  }

  // Badge pinning
  document.querySelectorAll('.badge-item.earned').forEach(badge => {
    badge.addEventListener('click', () => {
      const badgeId = badge.dataset.badgeId;
      store.togglePinBadge(badgeId);
      navigateTo('profile');
    });
  });

  // Weight add button
  const weightAddBtn = document.getElementById('weightAddBtn');
  if (weightAddBtn) {
    weightAddBtn.addEventListener('click', () => openWeightModal(navigateTo));
  }
}

function openWeightModal(navigateTo) {
  const user = store.getUser() || {};
  const currentWeight = user.weight || '';

  showModal({
    title: `⚖️ ${t('weightAdd')}`,
    content: `
      <div class="weight-modal">
        <div class="form-group">
          <label>${t('weightCurrent')}</label>
          <div class="weight-input-row">
            <input type="number" id="weightInput" class="form-input weight-big-input" 
                   value="${currentWeight}" placeholder="75" min="30" max="300" step="0.1">
            <span class="weight-unit">kg</span>
          </div>
        </div>
      </div>
    `,
    actions: [{
      id: 'logWeight',
      label: `💾 ${t('save')}`,
      class: 'btn-primary',
      onClick: () => {
        const weight = parseFloat(document.getElementById('weightInput')?.value);
        if (weight && weight > 0) {
          store.addWeightEntry(weight);
          // Also update user profile weight
          const user = store.getUser();
          if (user) {
            store.setUser({ ...user, weight });
          }
          showToast(`⚖️ ${weight}kg ✅`, 'success');
          navigateTo('profile');
        }
      },
    }],
  });
}

function openSettings(navigateTo) {
  const lang = i18n.getLang();
  showModal({
    title: '⚙️ ' + t('settings'),
    content: `
      <div class="settings-modal">
        <div class="setting-item">
          <span class="setting-label">🌐 ${t('language')}</span>
          <div class="lang-toggle">
            <button class="lang-btn ${lang === 'tr' ? 'active' : ''}" data-lang="tr">🇹🇷 ${t('turkish')}</button>
            <button class="lang-btn ${lang === 'en' ? 'active' : ''}" data-lang="en">🇬🇧 ${t('english')}</button>
          </div>
        </div>
        <div class="setting-item setting-danger">
          <button class="reset-btn" id="resetDataBtn">🗑️ ${lang === 'tr' ? 'Tüm Verileri Sıfırla' : 'Reset All Data'}</button>
        </div>
      </div>
    `,
  });

  setTimeout(() => {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        i18n.setLang(btn.dataset.lang);
        import('../components/modal.js').then(m => m.closeModal());
        navigateTo(navigateTo.__currentPage || 'profile');
      });
    });

    const resetBtn = document.getElementById('resetDataBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm(lang === 'tr' ? 'Tüm veriler silinecek. Emin misiniz?' : 'All data will be deleted. Are you sure?')) {
          store.reset();
          import('../components/modal.js').then(m => m.closeModal());
          location.reload();
        }
      });
    }
  }, 100);
}

function openEditProfile(navigateTo) {
  const user = store.getUser() || {};
  showModal({
    title: '✏️ ' + t('profileEdit'),
    content: `
      <div class="edit-profile-form">
        <div class="form-group">
          <label>${t('onboardingName')}</label>
          <input type="text" id="editName" value="${user.name || ''}" class="form-input">
        </div>
        <div class="form-group">
          <label>${t('onboardingAge')}</label>
          <input type="number" id="editAge" value="${user.age || ''}" class="form-input">
        </div>
        <div class="form-group">
          <label>${t('onboardingWeight')}</label>
          <input type="number" id="editWeight" value="${user.weight || ''}" class="form-input">
        </div>
        <div class="form-group">
          <label>${t('onboardingHeight')}</label>
          <input type="number" id="editHeight" value="${user.height || ''}" class="form-input">
        </div>
      </div>
    `,
    actions: [
      {
        id: 'save',
        label: '💾 ' + t('save'),
        class: 'btn-primary',
        onClick: () => {
          store.setUser({
            ...user,
            name: document.getElementById('editName').value,
            age: parseInt(document.getElementById('editAge').value) || user.age,
            weight: parseInt(document.getElementById('editWeight').value) || user.weight,
            height: parseInt(document.getElementById('editHeight').value) || user.height,
          });
          showToast('✅ ' + t('save'), 'success');
          navigateTo('profile');
        },
      },
    ],
  });
}
