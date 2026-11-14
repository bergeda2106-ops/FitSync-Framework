import { t, i18n } from '../i18n/index.js';
import { store, getSimulatedGymRealPosts } from '../store.js';
import { showToast } from '../components/toast.js';
import { formatTimeAgo } from '../utils/gamification.js';
import {
  db,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  deleteDoc,
  getDocs,
} from '../firebase.js';

// ─── Module-level state ───────────────────────────────────────────────────────
let countdownInterval = null;
let countdownSeconds  = 120;

// Voice note state
let mediaRecorder       = null;
let voiceChunks         = []  ;
let voiceRecording      = false;
let voiceDataURL        = null;
let voiceDuration       = 0;
let voiceTimerInterval  = null;
let voiceTimerMs        = 0;

// Reactions state — in-memory map for simulated posts; Firestore for real posts
// { [postId]: { [emoji]: { count, reactedByMe } } }
const reactionsState = {};

// Firestore unsubscribers
let unsubRealPosts   = null;
let unsubByPost      = {};   // { [postId]: unsub fn }

// Real Firestore posts (adds to top of feed)
let firestorePosts   = [];

// Reaction definitions
const REACTIONS = [
  { emoji: '💪', label: 'Beast!'    },
  { emoji: '🔥', label: 'On Fire!' },
  { emoji: '👏', label: 'Respect!' },
];

// ─── Render ───────────────────────────────────────────────────────────────────
export function renderGymReal() {
  const lang          = i18n.getLang();
  const hasTodayPost  = store.hasTodayGymReal();
  const simulatedPosts = getSimulatedGymRealPosts();
  const myPosts       = store.getGymRealPosts();
  const isCheckedIn   = store.isCheckedIn();

  /* Seed in-memory reactions for simulated posts on first render */
  simulatedPosts.forEach(p => {
    if (!reactionsState[p.id]) {
      reactionsState[p.id] = {
        '💪': { count: Math.floor(Math.random() * 8) + 1, reactedByMe: false },
        '🔥': { count: Math.floor(Math.random() * 5),     reactedByMe: false },
        '👏': { count: Math.floor(Math.random() * 10) + 2, reactedByMe: false },
      };
    }
  });

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

        <!-- ── Voice Note Recorder ── -->
        <div class="voice-note-area" id="voiceNoteArea">
          <div class="voice-note-header">
            <span class="voice-note-icon">🎙️</span>
            <div>
              <p class="voice-note-title">${lang === 'tr' ? 'Sesli Not Ekle' : 'Add a Voice Note'}</p>
              <p class="voice-note-sub">${lang === 'tr' ? 'Maks. 5 saniye · Sadece bugün check-in yapanlar görebilir' : 'Max 5 sec · Only visible to checked-in members'}</p>
            </div>
          </div>
          <div class="voice-controls">
            <button class="voice-record-btn" id="voiceRecordBtn">
              <span class="voice-record-icon">⏺</span>
              <span id="voiceRecordLabel">${lang === 'tr' ? 'Kaydet' : 'Record'}</span>
            </button>
            <div class="voice-progress-wrap" id="voiceProgressWrap" style="display:none;">
              <div class="voice-progress-bar" id="voiceProgressBar"></div>
              <span class="voice-timer-text" id="voiceTimerText">0.0s</span>
            </div>
          </div>
          <div class="voice-preview-area" id="voicePreviewArea" style="display:none;">
            <audio id="voiceAudioPreview" controls class="voice-audio-preview"></audio>
            <button class="voice-clear-btn" id="voiceClearBtn">✕ ${lang === 'tr' ? 'Sil' : 'Remove'}</button>
          </div>
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

      <!-- Real Firestore Posts (live feed top) -->
      <div id="firestoreFeedSection"></div>

      <!-- GymReal Feed (simulated) -->
      <div class="gymreal-feed">
        <h2 class="section-title">${t('gymRealFeed')}</h2>
        ${simulatedPosts.map(post => renderPostCard(post, hasTodayPost, isCheckedIn, lang)).join('')}
      </div>
    </div>
  `;
}

// ─── Render a single post card ────────────────────────────────────────────────
function renderPostCard(post, hasTodayPost, isCheckedIn, lang) {
  const r = reactionsState[post.id] || {};

  return `
    <div class="gymreal-post glass-card ${!hasTodayPost ? 'blurred' : ''}" data-post-id="${post.id}">
      ${!hasTodayPost ? `<div class="blur-overlay"><p>🔒 ${t('gymRealBlurred')}</p></div>` : ''}
      <div class="post-header">
        <span class="post-avatar">${post.user?.avatar || post.userAvatar || '🏋️'}</span>
        <div class="post-user-info">
          <strong>${post.user?.name || post.userName || 'Anonymous'}</strong>
          <span class="post-time">${formatTimeAgo(post.timestamp?.toMillis ? post.timestamp.toMillis() : post.timestamp, lang)}</span>
        </div>
        <span class="post-badge ${post.onTime ? 'on-time' : 'late'}">${post.onTime ? t('gymRealOnTime') : t('gymRealLate')}</span>
      </div>
      <div class="post-content">
        <div class="post-photo-placeholder">
          <span>📸</span>
        </div>
        <div class="post-tags">
          ${post.exercise ? `<span class="post-tag">${post.exercise}</span>` : ''}
          ${post.weight   ? `<span class="post-tag">${post.weight}kg</span>` : ''}
          ${post.set      ? `<span class="post-tag">Set ${post.set}</span>` : ''}
          ${post.gym      ? `<span class="post-tag">📍 ${post.gym}</span>` : ''}
        </div>
      </div>

      <!-- Voice Note Playback (checked-in gate) -->
      ${post.voiceNoteURL
        ? isCheckedIn
          ? `<div class="voice-playback glass-card">
               <span class="voice-playback-icon">🎙️</span>
               <audio src="${post.voiceNoteURL}" controls class="voice-audio-playback"></audio>
               <span class="voice-playback-label">${lang === 'tr' ? `${post.voiceNoteDuration || ''}s ses notu` : `${post.voiceNoteDuration || ''}s voice note`}</span>
             </div>`
          : `<div class="voice-gate-msg">
               🔒 ${lang === 'tr' ? 'Ses notu sadece bugün check-in yapan üyeler için' : 'Voice note only for today\'s checked-in members'}
             </div>`
        : ''
      }

      <!-- Reactions Bar -->
      <div class="reactions-bar" data-post-id="${post.id}">
        ${REACTIONS.map(rx => {
          const state = r[rx.emoji] || { count: 0, reactedByMe: false };
          return `
            <button class="reaction-pill ${state.reactedByMe ? 'reacted' : ''}"
                    data-post-id="${post.id}"
                    data-emoji="${rx.emoji}"
                    data-label="${rx.label}">
              <span class="reaction-emoji">${rx.emoji}</span>
              <span class="reaction-label">${rx.label}</span>
              <span class="reaction-count" id="rc-${post.id}-${encodeEmoji(rx.emoji)}">${state.count > 0 ? state.count : ''}</span>
            </button>`;
        }).join('')}
      </div>

      <div class="post-actions">
        <button class="post-like-btn ${post.liked ? 'liked' : ''}" data-post-id="${post.id}">
          ${post.liked ? '❤️' : '🤍'} ${post.likes || 0}
        </button>
        <button class="post-share-btn">📤</button>
      </div>
    </div>
  `;
}

// helper: safe ID fragment from emoji
function encodeEmoji(e) {
  return e.codePointAt(0).toString(16);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
export function initGymReal(navigateTo) {
  /* Clean up previous intervals / listeners */
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
  stopVoiceRecording();
  cleanupFirestoreListeners();

  // Buttons
  const captureBtn = document.getElementById('gymRealCaptureBtn');
  if (captureBtn) captureBtn.addEventListener('click', () => startGymRealCountdown());

  const shareBtn = document.getElementById('gymRealShareBtn');
  if (shareBtn) shareBtn.addEventListener('click', () => finishGymReal(navigateTo));

  // Like buttons (simulated)
  document.querySelectorAll('.post-like-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const isLiked = btn.classList.toggle('liked');
      const count   = parseInt(btn.textContent.trim().split(' ').pop()) || 0;
      btn.innerHTML = `${isLiked ? '❤️' : '🤍'} ${isLiked ? count + 1 : Math.max(0, count - 1)}`;
    });
  });

  // Reaction pills
  document.querySelectorAll('.reaction-pill').forEach(pill => {
    pill.addEventListener('click', () => handleReaction(pill));
  });

  // Voice recorder
  initVoiceRecorder();

  // Subscribe to real Firestore posts
  subscribeToFirestorePosts();
}

// ─── Countdown ────────────────────────────────────────────────────────────────
function startGymRealCountdown() {
  const el = document.getElementById('gymRealCountdown');
  if (!el) return;

  el.style.display = 'block';
  countdownSeconds  = 120;
  tryAccessCamera();
  updateCountdownDisplay();

  countdownInterval = setInterval(() => {
    countdownSeconds--;
    updateCountdownDisplay();
    if (countdownSeconds <= 0) {
      clearInterval(countdownInterval);
      showToast('⏰ ' + t('gymRealLate'), 'warning');
    }
  }, 1000);
}

function updateCountdownDisplay() {
  const text   = document.getElementById('countdownText');
  const circle = document.getElementById('countdownCircle');
  if (!text) return;

  const minutes = Math.floor(countdownSeconds / 60);
  const seconds = countdownSeconds % 60;
  text.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;

  if (circle) {
    const c = 2 * Math.PI * 45;
    circle.style.strokeDasharray  = c;
    circle.style.strokeDashoffset = c * (1 - countdownSeconds / 120);
  }
}

async function tryAccessCamera() {
  try {
    const stream      = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    const preview     = document.getElementById('cameraPreview');
    const placeholder = document.querySelector('.camera-placeholder');
    if (preview) {
      preview.srcObject  = stream;
      preview.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
    }
  } catch (e) {
    console.log('Camera not available:', e);
  }
}

// ─── Voice Recorder ───────────────────────────────────────────────────────────
const MAX_VOICE_MS = 5000;

function initVoiceRecorder() {
  const btn = document.getElementById('voiceRecordBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (!voiceRecording) startVoiceRecording();
    else                 stopVoiceRecording();
  });

  const clearBtn = document.getElementById('voiceClearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      voiceDataURL  = null;
      voiceDuration = 0;
      const preview = document.getElementById('voicePreviewArea');
      const wrap    = document.getElementById('voiceProgressWrap');
      if (preview) preview.style.display = 'none';
      if (wrap)    wrap.style.display    = 'none';
      const lbl = document.getElementById('voiceRecordLabel');
      if (lbl) lbl.textContent = i18n.getLang() === 'tr' ? 'Kaydet' : 'Record';
      const recordBtn = document.getElementById('voiceRecordBtn');
      if (recordBtn) recordBtn.classList.remove('recording');
    });
  }
}

async function startVoiceRecording() {
  if (!navigator.mediaDevices?.getUserMedia) {
    showToast('🎙️ Mikrofon erişimi yok / Mic not available', 'error');
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    voiceChunks  = [];
    voiceTimerMs = 0;

    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) voiceChunks.push(e.data); };
    mediaRecorder.onstop = () => {
      const blob   = new Blob(voiceChunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onload = ev => {
        voiceDataURL  = ev.target.result;
        voiceDuration = Math.round(voiceTimerMs / 100) / 10;
        renderVoicePreview();
      };
      reader.readAsDataURL(blob);
      // stop mic tracks
      stream.getTracks().forEach(t => t.stop());
    };

    mediaRecorder.start();
    voiceRecording = true;

    const btn  = document.getElementById('voiceRecordBtn');
    const lbl  = document.getElementById('voiceRecordLabel');
    const wrap = document.getElementById('voiceProgressWrap');
    if (btn)  btn.classList.add('recording');
    if (lbl)  lbl.textContent = i18n.getLang() === 'tr' ? 'Durdur' : 'Stop';
    if (wrap) wrap.style.display = 'flex';

    // progress
    voiceTimerInterval = setInterval(() => {
      voiceTimerMs += 100;
      const pct = Math.min((voiceTimerMs / MAX_VOICE_MS) * 100, 100);
      const bar  = document.getElementById('voiceProgressBar');
      const txt  = document.getElementById('voiceTimerText');
      if (bar) bar.style.width = pct + '%';
      if (txt) txt.textContent = (voiceTimerMs / 1000).toFixed(1) + 's';
      if (voiceTimerMs >= MAX_VOICE_MS) stopVoiceRecording(); // auto-stop
    }, 100);

  } catch (e) {
    console.error('Mic error:', e);
    showToast('🎙️ ' + (i18n.getLang() === 'tr' ? 'Mikrofon izni gerekli' : 'Microphone permission required'), 'error');
  }
}

function stopVoiceRecording() {
  if (voiceTimerInterval) { clearInterval(voiceTimerInterval); voiceTimerInterval = null; }
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  voiceRecording = false;

  const btn = document.getElementById('voiceRecordBtn');
  const lbl = document.getElementById('voiceRecordLabel');
  if (btn) btn.classList.remove('recording');
  if (lbl) lbl.textContent = i18n.getLang() === 'tr' ? 'Kaydet' : 'Record';
}

function renderVoicePreview() {
  const previewArea = document.getElementById('voicePreviewArea');
  const audio       = document.getElementById('voiceAudioPreview');
  if (previewArea && audio && voiceDataURL) {
    audio.src                 = voiceDataURL;
    previewArea.style.display = 'flex';
  }
}

// ─── Reactions ────────────────────────────────────────────────────────────────
async function handleReaction(pill) {
  const postId = pill.dataset.postId;
  const emoji  = pill.dataset.emoji;
  const label  = pill.dataset.label;

  if (!reactionsState[postId]) reactionsState[postId] = {};
  const entry = reactionsState[postId][emoji] || { count: 0, reactedByMe: false };

  if (entry.reactedByMe) {
    // toggle off
    entry.count      = Math.max(0, entry.count - 1);
    entry.reactedByMe = false;
    pill.classList.remove('reacted');
    tryDeleteFirestoreReaction(postId, emoji);
  } else {
    // toggle on
    entry.count      += 1;
    entry.reactedByMe = true;
    pill.classList.add('reacted');
    spawnReactionBurst(pill, emoji);
    tryAddFirestoreReaction(postId, emoji, label);
  }

  reactionsState[postId][emoji] = entry;

  // Update count badge in DOM
  const countEl = document.getElementById(`rc-${postId}-${encodeEmoji(emoji)}`);
  if (countEl) countEl.textContent = entry.count > 0 ? entry.count : '';
}

async function tryAddFirestoreReaction(postId, emoji, label) {
  if (!db) return;
  try {
    const user = store.getUser();
    await addDoc(collection(db, 'gymreal_posts', postId, 'reactions'), {
      emoji,
      label,
      userId:   store.deviceId,
      userName: user?.name || 'Anonymous',
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.warn('Firestore reaction write failed (ok for simulated posts):', e.code);
  }
}

async function tryDeleteFirestoreReaction(postId, emoji) {
  if (!db) return;
  try {
    const snap = await getDocs(collection(db, 'gymreal_posts', postId, 'reactions'));
    snap.forEach(async d => {
      if (d.data().emoji === emoji && d.data().userId === store.deviceId) {
        await deleteDoc(doc(db, 'gymreal_posts', postId, 'reactions', d.id));
      }
    });
  } catch (e) {
    console.warn('Firestore reaction delete failed (ok for simulated posts):', e.code);
  }
}

function spawnReactionBurst(pill, emoji) {
  const rect  = pill.getBoundingClientRect();
  const burst = document.createElement('div');
  burst.className   = 'reaction-burst';
  burst.textContent = emoji;
  burst.style.left  = rect.left + rect.width / 2 + 'px';
  burst.style.top   = rect.top  + 'px';
  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 800);
}

// ─── Finish / Publish ─────────────────────────────────────────────────────────
async function finishGymReal(navigateTo) {
  if (countdownInterval) clearInterval(countdownInterval);

  const onTime   = countdownSeconds > 0;
  const xpAmount = onTime ? 50 : 10;

  // Stop camera
  const preview = document.getElementById('cameraPreview');
  if (preview?.srcObject) preview.srcObject.getTracks().forEach(t => t.stop());

  const activeWorkout = store.getActiveWorkout();
  let exerciseTag = '';
  if (activeWorkout?.exercises?.length > 0) {
    const lastEx = activeWorkout.exercises[activeWorkout.exercises.length - 1];
    exerciseTag  = lastEx.exerciseId;
  }

  const user    = store.getUser();
  const gymName = store.getSelectedGym()?.name || '';

  // Write to local store
  store.addGymRealPost({ onTime, exercise: exerciseTag, gym: gymName });
  store.addXP(xpAmount);

  // Publish to Firestore
  publishGymRealPost({
    onTime,
    exercise:      exerciseTag,
    gym:           gymName,
    voiceNoteURL:  voiceDataURL || null,
    voiceNoteDuration: voiceDuration || null,
    userId:        store.deviceId,
    userName:      user?.name || 'Me',
    userAvatar:    user?.avatar || '🏋️',
  });

  // Reset voice state
  voiceDataURL  = null;
  voiceDuration = 0;

  showToast(onTime ? t('gymRealXpBonus') : t('gymRealXpLate'), 'xp', 3000);
  navigateTo('gymreal');
}

async function publishGymRealPost(postData) {
  if (!db) return;
  try {
    await addDoc(collection(db, 'gymreal_posts'), {
      ...postData,
      timestamp: serverTimestamp(),
      likes: 0,
    });
  } catch (e) {
    console.error('Firestore post publish error:', e);
  }
}

// ─── Real-time listener for Firestore posts ───────────────────────────────────
function subscribeToFirestorePosts() {
  if (!db) return;
  try {
    const q = query(collection(db, 'gymreal_posts'), orderBy('timestamp', 'desc'));
    unsubRealPosts = onSnapshot(q, snap => {
      firestorePosts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderFirestoreFeed();
    }, err => {
      console.warn('Firestore post listener error:', err.code);
    });
  } catch (e) {
    console.warn('Could not subscribe to gymreal_posts:', e);
  }
}

function renderFirestoreFeed() {
  const container = document.getElementById('firestoreFeedSection');
  if (!container || firestorePosts.length === 0) return;

  const lang        = i18n.getLang();
  const isCheckedIn = store.isCheckedIn();
  const hasTodayPost = store.hasTodayGymReal();

  container.innerHTML = `
    <div class="gymreal-feed" style="margin-bottom:0;">
      <h2 class="section-title" style="display:flex;align-items:center;gap:8px;">
        🔴 <span style="font-size:12px;color:var(--accent-red);font-weight:700;letter-spacing:1px;text-transform:uppercase;">LIVE</span>
        ${lang === 'tr' ? 'Gerçek Paylaşımlar' : 'Live Posts'}
      </h2>
      ${firestorePosts.slice(0, 5).map(post => {
        if (!reactionsState[post.id]) {
          reactionsState[post.id] = {
            '💪': { count: 0, reactedByMe: false },
            '🔥': { count: 0, reactedByMe: false },
            '👏': { count: 0, reactedByMe: false },
          };
        }
        return renderPostCard(post, hasTodayPost, isCheckedIn, lang);
      }).join('')}
    </div>
  `;

  // Re-attach reaction listeners for freshly rendered cards
  container.querySelectorAll('.reaction-pill').forEach(pill => {
    pill.addEventListener('click', () => handleReaction(pill));
  });
  container.querySelectorAll('.post-like-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const isLiked = btn.classList.toggle('liked');
      const count   = parseInt(btn.textContent.trim().split(' ').pop()) || 0;
      btn.innerHTML = `${isLiked ? '❤️' : '🤍'} ${isLiked ? count + 1 : Math.max(0, count - 1)}`;
    });
  });
}

function cleanupFirestoreListeners() {
  if (unsubRealPosts) { unsubRealPosts(); unsubRealPosts = null; }
  Object.values(unsubByPost).forEach(fn => fn());
  unsubByPost = {};
  firestorePosts = [];
}
