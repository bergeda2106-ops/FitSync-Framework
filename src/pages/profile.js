import { t, i18n } from '../i18n/index.js';
import { store } from '../store.js';
import { getLevelTitle, formatXP } from '../utils/xp.js';
import { getCurrentLeague } from '../utils/gamification.js';
import { badges, rarityColors } from '../data/badges.js';
import { showModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

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
  const lang = i18n.getLang();
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
