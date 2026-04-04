import { i18n, t } from './i18n/index.js';
import { store } from './store.js';
import { router } from './router.js';
import { renderNavbar, initNavbar } from './components/navbar.js';
import { renderDashboard, initDashboard } from './pages/dashboard.js';
import { renderWorkout, initWorkout } from './pages/workout.js';
import { renderGymReal, initGymReal } from './pages/gymreal.js';
import { renderGym, initGym } from './pages/gym.js';
import { renderProfile, initProfile } from './pages/profile.js';
import { renderAICoach, initAICoach } from './pages/aicoach.js';
import { showToast } from './components/toast.js';

class App {
  constructor() {
    this.appEl = document.getElementById('app');
    this.currentPage = 'dashboard';
    this.init();
  }

  init() {
    // Check onboarding
    if (!store.isOnboarded()) {
      this.showOnboarding();
      return;
    }

    this.setupRouter();
    this.render();

    // Listen for language changes
    window.addEventListener('langchange', () => this.render());
    // Listen for re-render requests
    window.addEventListener('rerender', () => this.render());
    // Listen for backend/sync errors
    window.addEventListener('fitsync_error', (e) => showToast(e.detail, 'warning'));
  }

  setupRouter() {
    router.onNavigate = (page) => {
      this.currentPage = page;
      this.render();
    };
    router.start();
    this.currentPage = router.getCurrentPage();
  }

  navigateTo(page) {
    this.currentPage = page;
    router.navigate(page);
  }

  render() {
    const navigate = (page) => this.navigateTo(page);
    // Attach current page info to navigate for settings
    navigate.__currentPage = this.currentPage;

    let pageContent = '';
    switch (this.currentPage) {
      case 'dashboard':
        pageContent = renderDashboard();
        break;
      case 'workout':
        pageContent = renderWorkout();
        break;
      case 'gymreal':
        pageContent = renderGymReal();
        break;
      case 'gym':
        pageContent = renderGym();
        break;
      case 'profile':
        pageContent = renderProfile();
        break;
      case 'aicoach':
        pageContent = renderAICoach();
        break;
      default:
        pageContent = renderDashboard();
    }

    this.appEl.innerHTML = `
      <div class="app-container">
        <div class="page-content" id="pageContent">
          ${pageContent}
        </div>
        ${renderNavbar(this.currentPage)}
      </div>
    `;

    // Init page interactions
    initNavbar((page) => this.navigateTo(page));

    switch (this.currentPage) {
      case 'dashboard':
        initDashboard((page) => this.navigateTo(page));
        break;
      case 'workout':
        initWorkout((page) => this.navigateTo(page));
        break;
      case 'gymreal':
        initGymReal((page) => this.navigateTo(page));
        break;
      case 'gym':
        initGym((page) => this.navigateTo(page));
        break;
      case 'profile':
        initProfile((page) => this.navigateTo(page));
        break;
      case 'aicoach':
        initAICoach((page) => this.navigateTo(page));
        break;
    }

    // Scroll to top
    document.getElementById('pageContent')?.scrollTo(0, 0);
  }

  showOnboarding() {
    this.appEl.innerHTML = `
      <div class="onboarding">
        <div class="onboarding-container glass-card">
          <div class="onboarding-logo">
            <span class="logo-icon">🏋️</span>
            <h1 class="logo-text text-gradient">FitSync</h1>
            <p class="logo-tagline">${t('tagline')}</p>
          </div>

          <div class="onboarding-form">
            <h2>${t('onboardingWelcome')}</h2>
            
            <div class="form-group">
              <label>${t('onboardingName')}</label>
              <input type="text" id="onboardName" class="form-input" placeholder="${t('onboardingName')}">
            </div>
            
            <div class="form-group">
              <label>${t('onboardingAge')}</label>
              <input type="number" id="onboardAge" class="form-input" placeholder="25" min="10" max="100">
            </div>

            <div class="form-group">
              <label>${t('onboardingWeight')}</label>
              <input type="number" id="onboardWeight" class="form-input" placeholder="75" min="30" max="300">
            </div>

            <div class="form-group">
              <label>${t('onboardingHeight')}</label>
              <input type="number" id="onboardHeight" class="form-input" placeholder="175" min="100" max="250">
            </div>

            <div class="form-group">
              <label>${t('onboardingGoal')}</label>
              <div class="goal-options">
                <button class="goal-option" data-goal="muscle">💪 ${t('onboardingGoalMuscle')}</button>
                <button class="goal-option" data-goal="lose">🔥 ${t('onboardingGoalLose')}</button>
                <button class="goal-option" data-goal="fit">🏃 ${t('onboardingGoalFit')}</button>
                <button class="goal-option" data-goal="strength">🏋️ ${t('onboardingGoalStrength')}</button>
              </div>
            </div>

            <div class="onboarding-lang">
              <button class="lang-switch-btn ${i18n.getLang() === 'tr' ? 'active' : ''}" data-lang="tr">🇹🇷 TR</button>
              <button class="lang-switch-btn ${i18n.getLang() === 'en' ? 'active' : ''}" data-lang="en">🇬🇧 EN</button>
            </div>

            <button class="onboarding-start-btn pulse-glow" id="onboardStartBtn">
              ${t('onboardingStart')}
            </button>
          </div>
        </div>
      </div>
    `;

    this.initOnboarding();
  }

  initOnboarding() {
    let selectedGoal = '';

    // Goal options
    document.querySelectorAll('.goal-option').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.goal-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedGoal = btn.dataset.goal;
      });
    });

    // Language switch
    document.querySelectorAll('.lang-switch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        i18n.setLang(btn.dataset.lang);
        this.showOnboarding(); // Re-render with new language
      });
    });

    // Start button
    const startBtn = document.getElementById('onboardStartBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        const name = document.getElementById('onboardName').value.trim();
        if (!name) {
          showToast(i18n.getLang() === 'tr' ? 'Lütfen adınızı girin' : 'Please enter your name', 'warning');
          return;
        }

        store.setUser({
          name,
          age: parseInt(document.getElementById('onboardAge').value) || null,
          weight: parseInt(document.getElementById('onboardWeight').value) || null,
          height: parseInt(document.getElementById('onboardHeight').value) || null,
          goal: selectedGoal || 'fit',
          createdAt: Date.now(),
        });

        // Award welcome XP
        store.addXP(100);
        showToast('🎉 +100 XP', 'xp');

        this.init();
      });
    }
  }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
