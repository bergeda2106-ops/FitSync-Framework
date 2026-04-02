import { t, i18n } from '../i18n/index.js';
import { store } from '../store.js';
import { exercises, categories, getExercisesByCategory, getExerciseById } from '../data/exercises.js';
import { showModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { launchConfetti } from '../components/confetti.js';
import { calculateWorkoutXP } from '../utils/xp.js';
import { checkAndAwardBadges } from '../utils/gamification.js';

let restTimerInterval = null;

export function renderWorkout() {
  const activeWorkout = store.getActiveWorkout();
  const workoutHistory = store.getWorkouts();
  const lang = i18n.getLang();

  if (activeWorkout) {
    return renderActiveWorkout(activeWorkout, lang);
  }

  return `
    <div class="page page-workout" id="pageWorkout">
      <header class="page-header">
        <h1>${t('workoutTitle')}</h1>
      </header>

      <!-- Start Workout Button -->
      <button class="start-workout-btn pulse-glow" id="startWorkoutBtn">
        <span class="btn-icon">🏋️</span>
        <span>${t('workoutStart')}</span>
      </button>

      <!-- Workout History -->
      <div class="workout-history">
        <h2 class="section-title">${t('workoutHistory')}</h2>
        ${workoutHistory.length === 0
          ? `<div class="empty-state glass-card"><p>🏋️ ${t('workoutEmpty')}</p></div>`
          : workoutHistory.slice().reverse().slice(0, 10).map(w => renderWorkoutHistoryItem(w, lang)).join('')
        }
      </div>
    </div>
  `;
}

function renderActiveWorkout(workout, lang) {
  const elapsed = Date.now() - workout.startTime;
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);

  return `
    <div class="page page-workout active-workout" id="pageWorkout">
      <header class="page-header workout-active-header">
        <h1>${t('workoutActive')}</h1>
        <div class="workout-timer" id="workoutTimer">${minutes}:${String(seconds).padStart(2, '0')}</div>
      </header>

      <!-- Exercise List -->
      <div class="exercise-list" id="exerciseList">
        ${workout.exercises.map((ex, exIndex) => {
          const exerciseData = getExerciseById(ex.exerciseId);
          const exName = exerciseData ? (exerciseData.name[lang] || exerciseData.name.tr) : ex.exerciseId;
          return `
            <div class="exercise-card glass-card" data-exercise-index="${exIndex}">
              <div class="exercise-header">
                <span class="exercise-icon">${exerciseData?.icon || '💪'}</span>
                <h3>${exName}</h3>
              </div>
              <div class="sets-list">
                <div class="set-header-row">
                  <span>${t('workoutSet')}</span>
                  <span>${t('workoutWeight')}</span>
                  <span>${t('workoutReps')}</span>
                  <span></span>
                </div>
                ${ex.sets.map((s, sIndex) => `
                  <div class="set-row completed">
                    <span class="set-num">${sIndex + 1}</span>
                    <span class="set-weight">${s.weight}kg</span>
                    <span class="set-reps">${s.reps}</span>
                    <button class="set-delete" data-ex="${exIndex}" data-set="${sIndex}">✕</button>
                  </div>
                `).join('')}
                <div class="add-set-row">
                  <span class="set-num">${ex.sets.length + 1}</span>
                  <input type="number" class="set-input weight-input" placeholder="kg" data-ex="${exIndex}" min="0" step="2.5">
                  <input type="number" class="set-input reps-input" placeholder="${t('workoutReps')}" data-ex="${exIndex}" min="0">
                  <button class="set-add-btn" data-ex="${exIndex}">✓</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Add Exercise Button -->
      <button class="add-exercise-btn glass-card" id="addExerciseBtn">
        <span>+ ${t('workoutAddExercise')}</span>
      </button>

      <!-- Rest Timer -->
      <div class="rest-timer-floating" id="restTimerFloating" style="display:none;">
        <div class="rest-timer-circle">
          <span class="rest-timer-value" id="restTimerValue">90</span>
          <span class="rest-timer-label">${t('workoutRest')}</span>
        </div>
        <button class="rest-timer-skip" id="restTimerSkip">⏭</button>
      </div>

      <!-- Finish Button -->
      <button class="finish-workout-btn" id="finishWorkoutBtn">
        <span>🏁 ${t('workoutFinish')}</span>
      </button>
    </div>
  `;
}

function renderWorkoutHistoryItem(workout, lang) {
  const date = new Date(workout.startTime);
  const duration = workout.duration ? Math.floor(workout.duration / 60000) : 0;
  const exerciseCount = workout.exercises?.length || 0;
  const totalSets = (workout.exercises || []).reduce((sum, ex) => sum + (ex.sets?.length || 0), 0);
  let totalVolume = 0;
  (workout.exercises || []).forEach(ex => {
    (ex.sets || []).forEach(s => {
      totalVolume += (s.weight || 0) * (s.reps || 0);
    });
  });

  return `
    <div class="history-item glass-card" data-workout-id="${workout.id}">
      <div class="history-date">
        <span class="history-day">${date.getDate()}</span>
        <span class="history-month">${date.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US', { month: 'short' })}</span>
      </div>
      <div class="history-details">
        <div class="history-exercises">
          ${(workout.exercises || []).slice(0, 3).map(ex => {
            const exData = getExerciseById(ex.exerciseId);
            return `<span class="history-ex-tag">${exData?.icon || '💪'} ${exData?.name[lang] || ex.exerciseId}</span>`;
          }).join('')}
          ${exerciseCount > 3 ? `<span class="history-ex-more">+${exerciseCount - 3}</span>` : ''}
        </div>
        <div class="history-stats">
          <span>${totalSets} ${t('workoutSets')}</span>
          <span>•</span>
          <span>${duration} ${t('minutes')}</span>
          <span>•</span>
          <span>${totalVolume.toLocaleString()}kg</span>
        </div>
      </div>
      <button class="clone-workout-btn" data-workout-id="${workout.id}" title="${t('workoutClone')}">📋</button>
    </div>
  `;
}

export function initWorkout(navigateTo) {
  // Start workout
  const startBtn = document.getElementById('startWorkoutBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      store.startWorkout();
      navigateTo('workout');
    });
  }

  // Add exercise
  const addExBtn = document.getElementById('addExerciseBtn');
  if (addExBtn) {
    addExBtn.addEventListener('click', () => showExercisePicker());
  }

  // Add set buttons
  document.querySelectorAll('.set-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const exIndex = parseInt(btn.dataset.ex);
      const row = btn.closest('.add-set-row');
      const weight = parseFloat(row.querySelector('.weight-input').value) || 0;
      const reps = parseInt(row.querySelector('.reps-input').value) || 0;

      if (reps > 0) {
        store.addSetToExercise(exIndex, { weight, reps });

        // Check for PR
        const workout = store.getActiveWorkout();
        const exerciseId = workout.exercises[exIndex].exerciseId;
        const prResult = store.checkPR(exerciseId, weight);

        if (prResult.isNewPR && weight > 0) {
          launchConfetti();
          showToast(`${t('workoutPR')} ${weight}kg`, 'pr', 4000);
        }

        // Start rest timer
        startRestTimer(90);

        // XP toast
        showToast('+5 XP', 'xp', 1500);

        navigateTo('workout');
      }
    });
  });

  // Delete set buttons
  document.querySelectorAll('.set-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const exIndex = parseInt(btn.dataset.ex);
      const setIndex = parseInt(btn.dataset.set);
      store.removeSetFromExercise(exIndex, setIndex);
      navigateTo('workout');
    });
  });

  // Finish workout
  const finishBtn = document.getElementById('finishWorkoutBtn');
  if (finishBtn) {
    finishBtn.addEventListener('click', () => {
      const workout = store.finishWorkout();
      if (workout) {
        const xp = calculateWorkoutXP(workout);
        const xpResult = store.addXP(xp);
        const newBadges = checkAndAwardBadges();

        launchConfetti();
        showToast(`${t('workoutCongrats')}`, 'success', 4000);

        setTimeout(() => {
          showToast(`+${xp} XP ${t('xpEarned')}`, 'xp', 3000);
        }, 1000);

        newBadges.forEach((badge, i) => {
          setTimeout(() => {
            showToast(`${badge.icon} ${t(badge.nameKey)}!`, 'badge', 4000);
          }, 2000 + i * 1000);
        });

        clearRestTimer();
        navigateTo('dashboard');
      }
    });
  }

  // Clone workout
  document.querySelectorAll('.clone-workout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const workoutId = btn.dataset.workoutId;
      const workouts = store.getWorkouts();
      const original = workouts.find(w => w.id === workoutId);
      if (original) {
        store.startWorkout();
        original.exercises.forEach(ex => {
          store.addExerciseToWorkout(ex.exerciseId);
        });
        showToast(`📋 ${t('workoutClone')}`, 'success');
        navigateTo('workout');
      }
    });
  });

  // Workout timer update
  const timer = document.getElementById('workoutTimer');
  if (timer) {
    const workout = store.getActiveWorkout();
    if (workout) {
      setInterval(() => {
        const elapsed = Date.now() - workout.startTime;
        const m = Math.floor(elapsed / 60000);
        const s = Math.floor((elapsed % 60000) / 1000);
        timer.textContent = `${m}:${String(s).padStart(2, '0')}`;
      }, 1000);
    }
  }

  // Rest timer skip
  const skipBtn = document.getElementById('restTimerSkip');
  if (skipBtn) {
    skipBtn.addEventListener('click', clearRestTimer);
  }
}

function showExercisePicker() {
  const lang = i18n.getLang();
  let selectedCategory = 'all';

  function renderPicker(catId) {
    const filtered = getExercisesByCategory(catId);
    return `
      <div class="exercise-picker">
        <div class="category-tabs">
          ${categories.map(cat => `
            <button class="cat-tab ${cat.id === catId ? 'active' : ''}" data-cat="${cat.id}">
              ${cat.icon} ${t('cat' + cat.id.charAt(0).toUpperCase() + cat.id.slice(1))}
            </button>
          `).join('')}
        </div>
        <div class="exercise-grid">
          ${filtered.map(ex => `
            <button class="exercise-pick-btn" data-exercise-id="${ex.id}">
              <span class="pick-icon">${ex.icon}</span>
              <span class="pick-name">${ex.name[lang] || ex.name.tr}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  const modal = showModal({
    title: t('workoutSelectExercise'),
    content: renderPicker('all'),
    className: 'modal-large',
  });

  // Category tab clicks
  function setupCatTabs() {
    modal.querySelectorAll('.cat-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        selectedCategory = tab.dataset.cat;
        modal.querySelector('.exercise-picker').outerHTML = renderPicker(selectedCategory);
        setupCatTabs();
        setupExPicks();
      });
    });
  }

  function setupExPicks() {
    modal.querySelectorAll('.exercise-pick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        store.addExerciseToWorkout(btn.dataset.exerciseId);
        closeModal();
        // Re-render will happen via navigation
        window.dispatchEvent(new CustomEvent('rerender'));
      });
    });
  }

  setupCatTabs();
  setupExPicks();
}

function startRestTimer(seconds) {
  clearRestTimer();
  const container = document.getElementById('restTimerFloating');
  const value = document.getElementById('restTimerValue');
  if (!container || !value) return;

  container.style.display = 'flex';
  let remaining = seconds;
  value.textContent = remaining;

  restTimerInterval = setInterval(() => {
    remaining--;
    value.textContent = remaining;
    if (remaining <= 0) {
      clearRestTimer();
      showToast('⏰ ' + t('workoutRest') + '!', 'info');
    }
  }, 1000);
}

function clearRestTimer() {
  if (restTimerInterval) {
    clearInterval(restTimerInterval);
    restTimerInterval = null;
  }
  const container = document.getElementById('restTimerFloating');
  if (container) container.style.display = 'none';
}
