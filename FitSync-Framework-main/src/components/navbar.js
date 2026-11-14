import { t } from '../i18n/index.js';

export function renderNavbar(activePage) {
  const tabs = [
    { id: 'dashboard', icon: '🏠', labelKey: 'navDashboard' },
    { id: 'workout', icon: '💪', labelKey: 'navWorkout' },
    { id: 'gymreal', icon: '📸', labelKey: 'navCommunity' },
    { id: 'aicoach', icon: '🤖', labelKey: 'navAICoach' },
    { id: 'profile', icon: '👤', labelKey: 'navProfile' },
  ];

  return `
    <nav class="bottom-nav" id="bottomNav">
      ${tabs.map(tab => `
        <button class="nav-tab ${activePage === tab.id ? 'active' : ''}"
                data-page="${tab.id}"
                id="nav-${tab.id}">
          <span class="nav-icon">${tab.icon}</span>
          <span class="nav-label">${t(tab.labelKey)}</span>
          ${activePage === tab.id ? '<span class="nav-indicator"></span>' : ''}
        </button>
      `).join('')}
    </nav>
  `;
}

export function initNavbar(onNavigate) {
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      onNavigate(page);
    });
  });
}
