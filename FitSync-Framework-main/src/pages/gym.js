import { t, i18n } from '../i18n/index.js';
import { store, getSimulatedGyms, getSimulatedGymMembers, getLeaderboard, getSimulatedBuddyRequests } from '../store.js';
import { showModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

export function renderGym() {
  const lang = i18n.getLang();
  const selectedGym = store.getSelectedGym();
  const isCheckedIn = store.isCheckedIn();
  const gyms = getSimulatedGyms();
  const members = getSimulatedGymMembers();
  const user = store.getUser();
  const leaderboard = getLeaderboard('self', user?.name);
  const buddyRequests = getSimulatedBuddyRequests();

  if (!selectedGym) {
    return renderGymSelection(gyms);
  }

  return `
    <div class="page page-gym" id="pageGym">
      <header class="page-header">
        <h1>🏢 ${t('gymTitle')}</h1>
      </header>

      <!-- Selected Gym Card -->
      <div class="gym-card glass-card">
        <div class="gym-info">
          <h2 class="gym-name">${selectedGym.name}</h2>
          <p class="gym-address">📍 ${selectedGym.address}</p>
          <div class="gym-meta">
            <span>👥 ${selectedGym.members} members</span>
            <span>⭐ ${selectedGym.rating}</span>
          </div>
        </div>
        <div class="gym-actions">
          ${!isCheckedIn ? `
            <button class="checkin-btn pulse-glow" id="checkInBtn">
              <span>📍 ${t('gymCheckIn')}</span>
            </button>
          ` : `
            <div class="checked-in-status">
              <span class="checkin-badge">${t('gymCheckedIn')}</span>
              <button class="checkout-btn" id="checkOutBtn">${t('gymCheckOut')}</button>
            </div>
          `}
          <button class="change-gym-btn" id="changeGymBtn">🔄</button>
        </div>
      </div>

      <!-- Members Currently at Gym -->
      ${isCheckedIn ? `
        <div class="gym-members glass-card">
          <h3>${t('gymMembers')} <span class="member-count">${members.length}</span></h3>
          <div class="members-list">
            ${members.map(m => `
              <div class="member-item">
                <span class="member-avatar">${m.avatar}</span>
                <div class="member-info">
                  <strong>${m.name}</strong>
                  <span class="member-exercise">${m.exercise} • ${lang === 'tr' ? 'saat' : 'since'} ${m.since}</span>
                </div>
                <span class="member-status ${m.status}">${m.status === 'working_out' ? '🏋️' : '😤'}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Gym Buddy -->
      <div class="gym-buddy-section glass-card">
        <h3>🤝 ${t('gymBuddy')}</h3>
        ${buddyRequests.map(req => `
          <div class="buddy-request">
            <span class="buddy-avatar">${req.user.avatar}</span>
            <div class="buddy-info">
              <strong>${req.user.name}</strong>
              <p class="buddy-message">${req.message}</p>
            </div>
            <div class="buddy-actions">
              <button class="buddy-accept" data-buddy="${req.user.id}">✓</button>
              <button class="buddy-decline" data-buddy="${req.user.id}">✕</button>
            </div>
          </div>
        `).join('')}
        <button class="buddy-find-btn" id="buddyFindBtn">
          <span>🔍 ${t('gymBuddy')}</span>
        </button>
      </div>

      <!-- Leaderboard -->
      <div class="leaderboard glass-card">
        <h3>🏆 ${t('gymLeaderboard')}</h3>
        <div class="leaderboard-list">
          ${leaderboard.slice(0, 10).map((entry, i) => `
            <div class="leaderboard-item ${entry.isSelf ? 'is-self' : ''} ${i < 3 ? 'top-three' : ''}">
              <span class="lb-rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : entry.rank}</span>
              <span class="lb-avatar">${entry.avatar}</span>
              <div class="lb-info">
                <strong>${entry.name}${entry.isSelf ? (lang === 'tr' ? ' (Sen)' : ' (You)') : ''}</strong>
                <span class="lb-level">Lv.${entry.level}</span>
              </div>
              <div class="lb-xp">
                <span class="lb-xp-value">${entry.xp.toLocaleString()}</span>
                <span class="lb-xp-label">XP</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderGymSelection(gyms) {
  return `
    <div class="page page-gym" id="pageGym">
      <header class="page-header">
        <h1>🏢 ${t('gymTitle')}</h1>
      </header>

      <div class="gym-select-prompt glass-card">
        <span class="select-icon">🏢</span>
        <h2>${t('gymSelectGym')}</h2>
        <p>${t('gymNoGym')}</p>
      </div>

      <div class="gym-list">
        ${gyms.map(gym => `
          <div class="gym-select-card glass-card" data-gym-id="${gym.id}">
            <div class="gym-select-info">
              <h3>${gym.name}</h3>
              <p>📍 ${gym.address}</p>
              <div class="gym-select-meta">
                <span>👥 ${gym.members}</span>
                <span>⭐ ${gym.rating}</span>
              </div>
            </div>
            <button class="gym-select-btn" data-gym-id="${gym.id}">${t('gymSelectGym')}</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function initGym(navigateTo) {
  // Check in
  const checkInBtn = document.getElementById('checkInBtn');
  if (checkInBtn) {
    checkInBtn.addEventListener('click', () => {
      store.checkIn();
      showToast('📍 ' + t('gymCheckedIn'), 'success');
      navigateTo('gym');
    });
  }

  // Check out
  const checkOutBtn = document.getElementById('checkOutBtn');
  if (checkOutBtn) {
    checkOutBtn.addEventListener('click', () => {
      store.checkOut();
      showToast(t('gymCheckOut'), 'info');
      navigateTo('gym');
    });
  }

  // Change gym
  const changeGymBtn = document.getElementById('changeGymBtn');
  if (changeGymBtn) {
    changeGymBtn.addEventListener('click', () => {
      store.update('gym', g => ({ ...g, selectedGym: null, checkedIn: false }));
      navigateTo('gym');
    });
  }

  // Gym selection
  document.querySelectorAll('.gym-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const gymId = btn.dataset.gymId;
      const gyms = getSimulatedGyms();
      const gym = gyms.find(g => g.id === gymId);
      if (gym) {
        store.selectGym(gym);
        showToast(`🏢 ${gym.name}`, 'success');
        navigateTo('gym');
      }
    });
  });

  // Buddy accept/decline
  document.querySelectorAll('.buddy-accept').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('🤝 ' + t('gymBuddyRequest') + ' ✅', 'success');
      btn.closest('.buddy-request').style.opacity = '0.5';
    });
  });

  document.querySelectorAll('.buddy-decline').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.buddy-request').style.display = 'none';
    });
  });

  // Find buddy
  const findBuddyBtn = document.getElementById('buddyFindBtn');
  if (findBuddyBtn) {
    findBuddyBtn.addEventListener('click', () => {
      showModal({
        title: '🤝 ' + t('gymBuddy'),
        content: `
          <div class="buddy-modal">
            <button class="buddy-type-btn" data-type="heavy">🏋️ ${i18n.getLang() === 'tr' ? 'Ağır gireceğim, spotter lazım' : 'Going heavy, need a spotter'}</button>
            <button class="buddy-type-btn" data-type="cardio">🏃 ${i18n.getLang() === 'tr' ? 'Beraber kardiyo yapalım' : 'Let\'s do cardio together'}</button>
            <button class="buddy-type-btn" data-type="general">💪 ${i18n.getLang() === 'tr' ? 'Beraber antrenman yapalım' : 'Let\'s work out together'}</button>
          </div>
        `,
      });

      setTimeout(() => {
        document.querySelectorAll('.buddy-type-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            showToast('📤 ' + t('gymBuddyRequest'), 'success');
            import('../components/modal.js').then(m => m.closeModal());
          });
        });
      }, 100);
    });
  }
}
