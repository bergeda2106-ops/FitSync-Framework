import { t, i18n } from '../i18n/index.js';
import { store } from '../store.js';
import { categories, getExercisesByCategory, getExerciseById } from '../data/exercises.js';
import { showModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { launchConfetti } from '../components/confetti.js';
import { calculateWorkoutXP, getStreakMultiplier } from '../utils/xp.js';
import { checkAndAwardBadges } from '../utils/gamification.js';
import { calculateWarmupSets, estimateWarmupTime } from '../utils/warmup.js';

let restTimerInterval = null;
let workoutTimerInterval = null;
let timerStartTime = null; // Track the current workout's startTime
let restStartTime = null;  // ⏱️ Track when rest started (for discipline score)
let disciplineScores = []; // 📊 Collect rest discipline scores per set

// Preset workout templates
const presetTemplates = [
  {
    id: 'preset_push',
    nameKey: 'templatePush',
    icon: '🏋️',
    exercises: ['bench_press', 'incline_bench', 'dumbbell_fly', 'overhead_press', 'lateral_raise', 'tricep_pushdown']
  },
  {
    id: 'preset_pull',
    nameKey: 'templatePull',
    icon: '🔙',
    exercises: ['deadlift', 'lat_pulldown', 'barbell_row', 'seated_cable_row', 'face_pull', 'bicep_curl']
  },
  {
    id: 'preset_legs',
    nameKey: 'templateLegs',
    icon: '🦵',
    exercises: ['squat', 'leg_press', 'romanian_deadlift', 'leg_extension', 'leg_curl', 'calf_raise']
  },
  {
    id: 'preset_fullbody',
    nameKey: 'templateFullBody',
    icon: '💪',
    exercises: ['squat', 'bench_press', 'barbell_row', 'overhead_press', 'bicep_curl', 'crunch']
  },
  {
    id: 'preset_upper',
    nameKey: 'templateUpperBody',
    icon: '🏋️',
    exercises: ['bench_press', 'barbell_row', 'overhead_press', 'lat_pulldown', 'bicep_curl', 'tricep_pushdown']
  },
  {
    id: 'preset_lower',
    nameKey: 'templateLowerBody',
    icon: '🦵',
    exercises: ['squat', 'leg_press', 'romanian_deadlift', 'lunges', 'leg_curl', 'calf_raise']
  },
];

export function renderWorkout() {
  const activeWorkout = store.getActiveWorkout();
  const workoutHistory = store.getWorkouts();
  const lang = i18n.getLang();

  if (activeWorkout) {
    return renderActiveWorkout(activeWorkout, lang);
  }

  const customTemplates = store.getWorkoutTemplates();

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

      <!-- Templates Section -->
      <div class="templates-section">
        <h2 class="section-title">📋 ${t('templateTitle')}</h2>
        
        <!-- Preset Templates -->
        <div class="template-subsection">
          <h3 class="subsection-title">${t('templatePresets')}</h3>
          <div class="templates-grid">
            ${presetTemplates.map(tpl => `
              <button class="template-card glass-card" data-template-preset="${tpl.id}">
                <span class="template-icon">${tpl.icon}</span>
                <span class="template-name">${t(tpl.nameKey)}</span>
                <span class="template-count">${tpl.exercises.length} ${lang === 'tr' ? 'egzersiz' : 'exercises'}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Custom Templates -->
        ${customTemplates.length > 0 ? `
          <div class="template-subsection">
            <h3 class="subsection-title">${t('templateCustom')}</h3>
            <div class="templates-grid">
              ${customTemplates.map(tpl => `
                <div class="template-card glass-card custom-template" data-template-custom="${tpl.id}">
                  <span class="template-icon">📋</span>
                  <span class="template-name">${tpl.name}</span>
                  <span class="template-count">${tpl.exercises.length} ${lang === 'tr' ? 'egzersiz' : 'exercises'}</span>
                  <button class="template-delete-btn" data-delete-template="${tpl.id}">✕</button>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Rest Timer Settings -->
      <div class="rest-timer-settings glass-card">
        <h3>⏱️ ${t('restTimerSettings')}</h3>
        <div class="rest-timer-options">
          ${[60, 90, 120, 180].map(sec => {
            const prefs = store.getRestTimerPrefs();
            return `
              <button class="rest-option-btn ${prefs.default === sec ? 'active' : ''}" data-rest-time="${sec}">
                ${t('restTimer' + sec)}
              </button>
            `;
          }).join('')}
        </div>
      </div>

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
  const restPrefs = store.getRestTimerPrefs();

  return `
    <div class="page page-workout active-workout" id="pageWorkout">
      <header class="page-header workout-active-header">
        <h1>${t('workoutActive')}</h1>
        <div class="workout-timer" id="workoutTimer">0:00</div>
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
                <div class="exercise-header-actions">
                  <button class="warmup-btn" data-warmup-ex="${exIndex}" title="${t('warmupBtnLabel')}">
                    🔥
                  </button>
                  <button class="exercise-remove-btn" data-remove-exercise="${exIndex}" title="🗑️">🗑️</button>
                </div>
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
          <span class="rest-timer-value" id="restTimerValue">${restPrefs.default}</span>
          <span class="rest-timer-label">${t('workoutRest')}</span>
        </div>
        <button class="rest-timer-skip" id="restTimerSkip">⏭</button>
      </div>

      <!-- Action Buttons -->
      <div class="workout-action-row">
        <button class="save-template-btn glass-card" id="saveTemplateBtn">
          📋 ${t('templateSave')}
        </button>
        <button class="finish-workout-btn" id="finishWorkoutBtn">
          <span>🏁 ${t('workoutFinish')}</span>
        </button>
      </div>
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
      window.dispatchEvent(new CustomEvent('rerender')); // instant — router handles immediately
    });
  }

  // Preset templates
  document.querySelectorAll('[data-template-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetId = btn.dataset.templatePreset;
      const preset = presetTemplates.find(p => p.id === presetId);
      if (preset) {
        store.startWorkout();
        preset.exercises.forEach(exId => store.addExerciseToWorkout(exId));
        showToast(`📋 ${t('templateLoaded')}`, 'success');
        window.dispatchEvent(new CustomEvent('rerender'));
      }
    });
  });

  // Custom templates
  document.querySelectorAll('[data-template-custom]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (e.target.classList.contains('template-delete-btn')) return;
      const tplId = btn.dataset.templateCustom;
      const templates = store.getWorkoutTemplates();
      const tpl = templates.find(t => t.id === tplId);
      if (tpl) {
        store.startWorkout();
        tpl.exercises.forEach(exId => store.addExerciseToWorkout(exId));
        showToast(`📋 ${t('templateLoaded')}`, 'success');
        window.dispatchEvent(new CustomEvent('rerender'));
      }
    });
  });

  // Delete template
  document.querySelectorAll('[data-delete-template]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tplId = btn.dataset.deleteTemplate;
      store.deleteWorkoutTemplate(tplId);
      showToast(`🗑️ ${t('templateDelete')}`, 'info');
      window.dispatchEvent(new CustomEvent('rerender'));
    });
  });

  // Rest timer option buttons
  document.querySelectorAll('[data-rest-time]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = parseInt(btn.dataset.restTime);
      store.setRestTimerDefault(sec);
      document.querySelectorAll('[data-rest-time]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      showToast(`⏱️ ${sec}s`, 'success', 1500);
    });
  });

  // Save as template button
  const saveTemplateBtn = document.getElementById('saveTemplateBtn');
  if (saveTemplateBtn) {
    saveTemplateBtn.addEventListener('click', () => {
      const workout = store.getActiveWorkout();
      if (!workout || workout.exercises.length === 0) return;

      const lang = i18n.getLang();
      showModal({
        title: `📋 ${t('templateSave')}`,
        content: `
          <div class="form-group">
            <label>${t('templateName')}</label>
            <input type="text" id="templateNameInput" class="form-input" placeholder="${lang === 'tr' ? 'Örn: Pazartesi Antrenmanı' : 'e.g. Monday Workout'}">
          </div>
        `,
        actions: [{
          id: 'saveTpl',
          label: `💾 ${t('save')}`,
          class: 'btn-primary',
          onClick: () => {
            const name = document.getElementById('templateNameInput')?.value.trim();
            if (!name) return;
            store.saveWorkoutTemplate({
              name,
              exercises: workout.exercises.map(ex => ex.exerciseId),
            });
            showToast(`📋 ${t('templateSaved')}`, 'success');
          },
        }],
      });
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

      // ❌ XP istismar koruması: en az 1 tekrar VE pozitif ağırlık
      if (reps < 1) {
        showToast(i18n.getLang() === 'tr' ? '⚠️ En az 1 tekrar girmelisin!' : '⚠️ Enter at least 1 rep!', 'warning', 2000);
        return;
      }
      if (weight <= 0) {
        showToast(i18n.getLang() === 'tr' ? '⚠️ Ağırlık sıfırdan büyük olmalı!' : '⚠️ Weight must be greater than 0!', 'warning', 2000);
        return;
      }

      // ⏱️ Disiplin skoru hesapla (başlangıçta restStartTime null ise atla)
      if (restStartTime !== null) {
        const restPrefs = store.getRestTimerPrefs();
        const actualRest = (Date.now() - restStartTime) / 1000;
        const targetRest = restPrefs.default;
        const score = Math.min(actualRest / targetRest, 2.0); // cap at 200%
        // Score of 1.0 = perfect, <0.5 = rushed, >1.5 = too long
        const normalizedScore = score <= 1 ? score : Math.max(0, 2 - score); // penalize going too long too
        disciplineScores.push(Math.round(normalizedScore * 100));
      }

      store.addSetToExercise(exIndex, { weight, reps });

      // Check for PR
      const workout = store.getActiveWorkout();
      const exerciseId = workout.exercises[exIndex].exerciseId;
      const prResult = store.checkPR(exerciseId, weight);

      if (prResult.isNewPR && weight > 0) {
        launchConfetti();
        showToast(`${t('workoutPR')} ${weight}kg`, 'pr', 4000);
      }

      // Add XP per set (only with valid weight)
      const xpGain = weight >= 60 ? 8 : weight >= 30 ? 6 : 5;
      store.addXP(xpGain);

      // Start rest timer — track rest start
      const restPrefs = store.getRestTimerPrefs();
      restStartTime = Date.now();
      startRestTimer(restPrefs.default);

      // XP toast
      showToast(`+${xpGain} XP`, 'xp', 1500);

      // Use rerender instead of navigateTo to avoid full page flash
      window.dispatchEvent(new CustomEvent('rerender'));
    });
  });

  // Delete set buttons
  document.querySelectorAll('.set-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const exIndex = parseInt(btn.dataset.ex);
      const setIndex = parseInt(btn.dataset.set);
      store.removeSetFromExercise(exIndex, setIndex);
      window.dispatchEvent(new CustomEvent('rerender'));
    });
  });

  // Remove exercise buttons
  document.querySelectorAll('.exercise-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const exIndex = parseInt(btn.dataset.removeExercise);
      store.removeExerciseFromWorkout(exIndex);
      showToast('🗑️', 'info', 1000);
      window.dispatchEvent(new CustomEvent('rerender'));
    });
  });

  const finishBtn = document.getElementById('finishWorkoutBtn');
  if (finishBtn) {
    finishBtn.addEventListener('click', () => {
      // Prevent finishing empty workout
      const currentWorkout = store.getActiveWorkout();
      if (currentWorkout) {
        const totalValidSets = (currentWorkout.exercises || []).reduce((sum, ex) =>
          sum + (ex.sets || []).filter(s => s.weight > 0 && s.reps >= 1).length, 0
        );
        if (totalValidSets === 0) {
          showToast(i18n.getLang() === 'tr' ? '⚠️ En az 1 geçerli set ekle!' : '⚠️ Add at least 1 valid set!', 'warning');
          return;
        }
      }

      // Disable button immediately to prevent double tap
      finishBtn.disabled = true;
      finishBtn.textContent = '⏳';

      // 🏋️‍♂️ Show RPE modal before finishing
      showRpeModal((rpeValue) => {
        _doFinishWorkout(rpeValue, finishBtn, navigateTo);
      });
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
        window.dispatchEvent(new CustomEvent('rerender'));
      }
    });
  });

  // Workout timer — start only once per workout session, survive re-renders
  const timerEl = document.getElementById('workoutTimer');
  if (timerEl) {
    const workout = store.getActiveWorkout();
    if (workout) {
      const workoutStart = workout.startTime;

      // Update display immediately (no 1-second wait)
      const updateTimer = () => {
        const el = document.getElementById('workoutTimer');
        if (!el) return;
        const elapsed = Date.now() - workoutStart;
        const m = Math.floor(elapsed / 60000);
        const s = Math.floor((elapsed % 60000) / 1000);
        el.textContent = `${m}:${String(s).padStart(2, '0')}`;
      };

      // Only restart if this is a different workout
      if (timerStartTime !== workoutStart) {
        timerStartTime = workoutStart;
        if (workoutTimerInterval) clearInterval(workoutTimerInterval);
        workoutTimerInterval = setInterval(updateTimer, 1000);
      }

      // Always update display right now (instant tick)
      updateTimer();
    }
  }

  // Rest timer skip
  const skipBtn = document.getElementById('restTimerSkip');
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      clearRestTimer();
      restStartTime = Date.now(); // reset rest start after manual skip
    });
  }

  // 🔥 Warmup buttons
  document.querySelectorAll('[data-warmup-ex]').forEach(btn => {
    btn.addEventListener('click', () => {
      const exIndex = parseInt(btn.dataset.warmupEx);
      const workout = store.getActiveWorkout();
      if (!workout) return;
      const ex = workout.exercises[exIndex];
      if (!ex) return;
      // Get last entered weight for this exercise as target
      const lastSet = ex.sets.length > 0 ? ex.sets[ex.sets.length - 1] : null;
      const targetWeight = lastSet?.weight || 0;
      showWarmupModal(exIndex, targetWeight);
    });
  });
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
        const pickerContainer = modal.querySelector('.exercise-picker');
        if (pickerContainer && pickerContainer.parentNode) {
          pickerContainer.parentNode.innerHTML = renderPicker(selectedCategory);
        }
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
    const el = document.getElementById('restTimerValue');
    if (el) el.textContent = remaining;
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

// 🧠 RPE Modal — shown before finishing workout
function showRpeModal(onComplete) {
  let selectedRPE = 5;

  showModal({
    title: t('rpeTitle'),
    content: `
      <div class="rpe-modal">
        <p class="rpe-subtitle">${t('rpeSubtitle')}</p>
        <div class="rpe-scale">
          ${[1,2,3,4,5,6,7,8,9,10].map(v => `
            <button class="rpe-btn ${v === selectedRPE ? 'active' : ''}" data-rpe="${v}">
              <span class="rpe-num">${v}</span>
            </button>
          `).join('')}
        </div>
        <div class="rpe-labels">
          <span>${t('rpeEasy')}</span>
          <span>${t('rpeHard')}</span>
        </div>
      </div>
    `,
    actions: [
      {
        id: 'rpeSave',
        label: `📊 ${t('rpeSave')}`,
        class: 'btn-primary',
        onClick: () => {
          const activeBtn = document.querySelector('.rpe-btn.active');
          const rpe = activeBtn ? parseInt(activeBtn.dataset.rpe) : selectedRPE;
          onComplete(rpe);
        },
      },
      {
        id: 'rpeSkip',
        label: t('rpeSkip'),
        class: 'btn-secondary',
        onClick: () => onComplete(null),
      },
    ],
    className: 'modal-rpe',
  });

  // RPE button selection
  setTimeout(() => {
    document.querySelectorAll('.rpe-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.rpe-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedRPE = parseInt(btn.dataset.rpe);
      });
    });
  }, 50);
}

// 🏋️‍♂️ Do the actual workout finish logic after RPE
function _doFinishWorkout(rpe, finishBtn, navigateTo) {
  // Store RPE in the workout before finishing
  const activeWo = store.getActiveWorkout();
  if (activeWo && rpe !== null) {
    activeWo.rpe = rpe;
    store.set('activeWorkout', activeWo);
  }

  const workout = store.finishWorkout();
  if (!workout) return;

  // Calculate XP with streak multiplier
  const streak = store.get('streak');
  const multiplier = getStreakMultiplier(streak.current);
  const baseXP = calculateWorkoutXP(workout);
  const xp = Math.round(baseXP * multiplier);
  store.addXP(xp);
  const newBadges = checkAndAwardBadges();

  // 📊 Discipline Score
  let avgDiscipline = null;
  if (disciplineScores.length > 0) {
    avgDiscipline = Math.round(disciplineScores.reduce((a, b) => a + b, 0) / disciplineScores.length);
    disciplineScores = []; // reset
  }

  // 🛡️ Shield / Shield earned
  const shieldUsed = store._shieldUsed;
  const shieldEarned = store._shieldEarned;
  store._shieldUsed = false;
  store._shieldEarned = false;

  // Clear timers
  clearRestTimer();
  restStartTime = null;
  if (workoutTimerInterval) {
    clearInterval(workoutTimerInterval);
    workoutTimerInterval = null;
  }
  timerStartTime = null;

  // Navigate IMMEDIATELY to dashboard
  if (navigateTo) navigateTo('dashboard');
  else window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'dashboard' } }));

  // Show celebration toasts
  launchConfetti();
  setTimeout(() => showToast(`🏁 ${t('workoutCongrats')}`, 'success', 3000), 100);
  setTimeout(() => {
    const bonusText = multiplier > 1 ? ` (x${multiplier} 🔥)` : '';
    showToast(`+${xp} XP ${t('xpEarned')}${bonusText}`, 'xp', 3000);
  }, 900);

  // Discipline score toast
  if (avgDiscipline !== null) {
    setTimeout(() => {
      let dLabel;
      if (avgDiscipline >= 85) dLabel = t('disciplinePerfect');
      else if (avgDiscipline >= 65) dLabel = t('disciplineGood');
      else if (avgDiscipline >= 40) dLabel = t('disciplineFair');
      else dLabel = t('disciplinePoor');
      showToast(`⏱️ ${t('disciplineScore')}: %${avgDiscipline} — ${dLabel}`, 'info', 4000);
    }, 1600);
  }

  // Shield toasts
  if (shieldUsed) {
    setTimeout(() => showToast(t('streakShieldUsed'), 'badge', 4000), 2200);
  }
  if (shieldEarned) {
    setTimeout(() => showToast(t('streakShieldEarned'), 'badge', 4000), 2400);
  }

  // RPE confirmation
  if (rpe !== null) {
    setTimeout(() => showToast(`${t('rpeSaved')} (RPE: ${rpe}/10)`, 'info', 2500), 2800);
  }

  newBadges.forEach((badge, i) => {
    setTimeout(() => {
      showToast(`${badge.icon} ${t(badge.nameKey)}!`, 'badge', 4000);
    }, 3200 + i * 800);
  });
}

// 🔥 Warmup Modal
function showWarmupModal(exerciseIndex, targetWeight) {
  const lang = i18n.getLang();
  const sets = calculateWarmupSets(targetWeight);
  const timeMin = sets.length > 0 ? Math.ceil(estimateWarmupTime(sets) / 60) : 0;

  const intensityColors = { low: '#4ade80', medium: '#facc15', high: '#f87171' };

  const content = sets.length === 0
    ? `<p class="warmup-no-need">${t('warmupNoNeed')}</p>`
    : `
      <div class="warmup-modal-content">
        <p class="warmup-estimate">⏱️ ${t('warmupEstimate')}: ~${timeMin} ${t('warmupMin')}</p>
        <div class="warmup-sets-list">
          ${sets.map((s, i) => `
            <div class="warmup-set-row" style="--intensity-color: ${intensityColors[s.intensity] || '#fff'}">
              <span class="warmup-set-num">${i + 1}</span>
              <span class="warmup-set-pct">${s.label}</span>
              <span class="warmup-set-weight">${s.weight} kg</span>
              <span class="warmup-set-reps">× ${s.reps} ${t('warmupReps')}</span>
            </div>
          `).join('')}
        </div>
        <p class="warmup-note">${lang === 'tr' ? 'ℹ️ Hedef ağırlığınızı girmeden önce bu setleri tamamlayın.' : 'ℹ️ Complete these sets before entering your working weight.'}</p>
      </div>
    `;

  const workout_ = store.getActiveWorkout();
  const exData = workout_ ? getExerciseById(workout_.exercises[exerciseIndex]?.exerciseId) : null;
  const exName = exData ? (exData.name[lang] || exData.name.tr) : '';

  showModal({
    title: `${t('warmupTitle')} — ${exName} (${targetWeight}kg)`,
    content,
    className: 'modal-warmup',
  });
}
