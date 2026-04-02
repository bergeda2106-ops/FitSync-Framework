import { t, i18n } from '../i18n/index.js';
import { store, getSimulatedGymRealPosts } from '../store.js';
import { showToast } from '../components/toast.js';
import { formatTimeAgo } from '../utils/gamification.js';

let countdownInterval = null;
let countdownSeconds = 120;
let gymRealActive = false;

export function renderGymReal() {
  const lang = i18n.getLang();
  const hasTodayPost = store.hasTodayGymReal();
  const simulatedPosts = getSimulatedGymRealPosts();
  const myPosts = store.getGymRealPosts();

  return `
    <div class="page page-gymreal" id="pageGymReal">
      <header class="page-header">
        <h1>📸 ${t('gymRealTitle')}</h1>
      </header>

      <!-- GymReal Status -->
      <div class="gymreal-status glass-card">
        ${!hasTodayPost ? `
          <div class="gymreal-notification">
            <p class="gymreal-notify-text">${t('gymRealNotification')}</p>
            <button class="gymreal-capture-btn pulse-glow" id="gymRealCaptureBtn">
              <span class="capture-icon">📸</span>
              <span>${t('gymRealCapture')}</span>
            </button>
          </div>
        ` : `
          <div class="gymreal-done">
            <span class="done-check">✅</span>
            <p>${t('gymRealOnTime')} — ${t('gymRealXpBonus')}</p>
          </div>
        `}
      </div>

      <!-- Countdown Timer (hidden by default) -->
      <div class="gymreal-countdown glass-card" id="gymRealCountdown" style="display:none;">
        <div class="countdown-circle">
          <svg viewBox="0 0 100 100" class="countdown-svg">
            <circle class="countdown-bg" cx="50" cy="50" r="45"/>
            <circle class="countdown-progress" cx="50" cy="50" r="45" id="countdownCircle"/>
          </svg>
          <div class="countdown-text" id="countdownText">2:00</div>
        </div>
        <p class="countdown-label">${t('gymRealTimer')}</p>
        
        <!-- Camera Preview -->
        <div class="camera-area" id="cameraArea">
          <div class="camera-placeholder">
            <span>📷</span>
            <p>Camera Preview</p>
          </div>
          <video id="cameraPreview" autoplay playsinline style="display:none;"></video>
          <canvas id="cameraCanvas" style="display:none;"></canvas>
        </div>

        <div class="gymreal-actions">
          <button class="gymreal-share-btn" id="gymRealShareBtn">
            <span>📤 ${t('gymRealShare')}</span>
          </button>
        </div>
      </div>

      <!-- My GymReal Posts -->
      ${myPosts.length > 0 ? `
        <div class="my-gymreal-section">
          <h2 class="section-title">📸 My GymReal</h2>
          ${myPosts.slice(0, 3).map(post => `
            <div class="gymreal-post glass-card my-post">
              <div class="post-badge ${post.onTime ? 'on-time' : 'late'}">${post.onTime ? t('gymRealOnTime') : t('gymRealLate')}</div>
              <div class="post-content">
                <div class="post-photo-placeholder">📸</div>
                <div class="post-info">
                  <span class="post-time">${formatTimeAgo(post.timestamp, lang)}</span>
                  ${post.exercise ? `<span class="post-tag">${post.exercise}</span>` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- GymReal Feed -->
      <div class="gymreal-feed">
        <h2 class="section-title">${t('gymRealFeed')}</h2>
        ${simulatedPosts.map(post => `
          <div class="gymreal-post glass-card ${!hasTodayPost ? 'blurred' : ''}" data-post-id="${post.id}">
            ${!hasTodayPost ? `<div class="blur-overlay"><p>🔒 ${t('gymRealBlurred')}</p></div>` : ''}
            <div class="post-header">
              <span class="post-avatar">${post.user.avatar}</span>
              <div class="post-user-info">
                <strong>${post.user.name}</strong>
                <span class="post-time">${formatTimeAgo(post.timestamp, lang)}</span>
              </div>
              <span class="post-badge ${post.onTime ? 'on-time' : 'late'}">${post.onTime ? t('gymRealOnTime') : t('gymRealLate')}</span>
            </div>
            <div class="post-content">
              <div class="post-photo-placeholder">
                <span>📸</span>
              </div>
              <div class="post-tags">
                <span class="post-tag">${post.exercise}</span>
                <span class="post-tag">${post.weight}kg</span>
                <span class="post-tag">Set ${post.set}</span>
                <span class="post-tag">📍 ${post.gym}</span>
              </div>
            </div>
            <div class="post-actions">
              <button class="post-like-btn ${post.liked ? 'liked' : ''}" data-post-id="${post.id}">
                ${post.liked ? '❤️' : '🤍'} ${post.likes}
              </button>
              <button class="post-comment-btn">💬</button>
              <button class="post-share-btn">📤</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function initGymReal(navigateTo) {
  const captureBtn = document.getElementById('gymRealCaptureBtn');
  if (captureBtn) {
    captureBtn.addEventListener('click', () => {
      startGymRealCountdown();
    });
  }

  const shareBtn = document.getElementById('gymRealShareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      finishGymReal(navigateTo);
    });
  }

  // Post like buttons
  document.querySelectorAll('.post-like-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const isLiked = btn.classList.toggle('liked');
      const count = parseInt(btn.textContent.trim().split(' ').pop()) || 0;
      btn.innerHTML = `${isLiked ? '❤️' : '🤍'} ${isLiked ? count + 1 : count - 1}`;
    });
  });
}

function startGymRealCountdown() {
  const countdownContainer = document.getElementById('gymRealCountdown');
  if (!countdownContainer) return;

  countdownContainer.style.display = 'block';
  countdownSeconds = 120;
  gymRealActive = true;

  // Try to access camera
  tryAccessCamera();

  updateCountdownDisplay();

  countdownInterval = setInterval(() => {
    countdownSeconds--;
    updateCountdownDisplay();

    if (countdownSeconds <= 0) {
      clearInterval(countdownInterval);
      // Time's up - can still share but as "late"
      gymRealActive = false;
      showToast('⏰ ' + t('gymRealLate'), 'warning');
    }
  }, 1000);
}

function updateCountdownDisplay() {
  const text = document.getElementById('countdownText');
  const circle = document.getElementById('countdownCircle');
  if (!text) return;

  const minutes = Math.floor(countdownSeconds / 60);
  const seconds = countdownSeconds % 60;
  text.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;

  if (circle) {
    const circumference = 2 * Math.PI * 45;
    const progress = countdownSeconds / 120;
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference * (1 - progress);
  }
}

async function tryAccessCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    const preview = document.getElementById('cameraPreview');
    const placeholder = document.querySelector('.camera-placeholder');
    if (preview) {
      preview.srcObject = stream;
      preview.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
    }
  } catch (e) {
    console.log('Camera not available:', e);
  }
}

function finishGymReal(navigateTo) {
  if (countdownInterval) clearInterval(countdownInterval);

  const onTime = countdownSeconds > 0;
  const xpAmount = onTime ? 50 : 10;

  // Stop camera
  const preview = document.getElementById('cameraPreview');
  if (preview && preview.srcObject) {
    preview.srcObject.getTracks().forEach(t => t.stop());
  }

  // Get current workout info for auto-tag
  const activeWorkout = store.getActiveWorkout();
  let exerciseTag = '';
  if (activeWorkout && activeWorkout.exercises.length > 0) {
    const lastEx = activeWorkout.exercises[activeWorkout.exercises.length - 1];
    exerciseTag = lastEx.exerciseId;
  }

  store.addGymRealPost({
    onTime,
    exercise: exerciseTag,
    gym: store.getSelectedGym()?.name || '',
  });

  store.addXP(xpAmount);

  showToast(onTime ? t('gymRealXpBonus') : t('gymRealXpLate'), 'xp', 3000);

  navigateTo('gymreal');
}
