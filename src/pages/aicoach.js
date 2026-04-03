import { t, i18n } from '../i18n/index.js';
import { askAiCoach, PERSONALITIES } from '../api/ai.js';
import { store } from '../store.js';
import { showToast } from '../components/toast.js';

let currentPersonality = 'kanka';

const QUICK_QUESTIONS = {
  tr: [
    '💪 Bench press formum nasıl olmalı?',
    '🍗 Antrenman sonrası ne yemeliyim?',
    '😴 Kas ağrısı normal mi?',
    '🏋️ Bugün ne antrenman yapayım?',
    '🔥 Yağ yakmak için en iyi egzersiz?',
  ],
  en: [
    '💪 How should my bench press form be?',
    '🍗 What should I eat post-workout?',
    '😴 Is muscle soreness normal?',
    '🏋️ What workout should I do today?',
    '🔥 Best exercise for fat burning?',
  ],
};

export function renderAICoach() {
  const lang = i18n.getLang();
  const chatHistory = store.getAIChatHistory();
  const persona = PERSONALITIES[currentPersonality];
  const questions = QUICK_QUESTIONS[lang] || QUICK_QUESTIONS.tr;

  return `
    <div class="aicoach-page">
      <div class="page-header">
        <h1>${persona.icon} ${lang === 'tr' ? 'AI Koç' : 'AI Coach'}</h1>
        <p>${t('aiChatContext')}</p>
      </div>

      <!-- Personality Selector -->
      <div class="personality-selector">
        ${Object.values(PERSONALITIES).map(p => `
          <button class="persona-btn ${p.id === currentPersonality ? 'active' : ''}" data-persona="${p.id}">
            <span class="persona-icon">${p.icon}</span>
            <span class="persona-name">${lang === 'tr' ? p.nameTR : p.nameEN}</span>
          </button>
        `).join('')}
      </div>

      <!-- Quick Questions -->
      <div class="quick-questions" id="quickQuestions">
        ${questions.map((q, i) => `
          <button class="quick-q-btn" data-quick-q="${i}">${q}</button>
        `).join('')}
      </div>

      <div class="chat-container glass-card" id="chatContainer">
        <div class="chat-messages" id="chatMessages">
          <div class="message ai-message">
            <div class="message-avatar">${persona.icon}</div>
            <div class="message-bubble">
              ${getGreeting(lang, currentPersonality)}
            </div>
          </div>
          ${chatHistory.map(msg => `
            <div class="message ${msg.isAi ? 'ai-message' : 'user-message'}">
              ${msg.isAi ? `<div class="message-avatar">${persona.icon}</div>` : ''}
              <div class="message-bubble">${msg.isAi ? msg.text.replace(/\n/g, '<br>') : msg.text}</div>
            </div>
          `).join('')}
        </div>
        
        <div class="chat-input-area">
          <input type="text" id="chatInput" placeholder="${lang === 'tr' ? 'Yapay zekaya bir soru sor...' : 'Ask the AI a question...'}" autocomplete="off">
          <button id="sendBtn" class="primary-btn pulse-glow">${lang === 'tr' ? 'Gönder' : 'Send'}</button>
        </div>
      </div>

      <button class="clear-chat-btn glass-card" id="clearChatBtn">
        🗑️ ${t('aiChatClear')}
      </button>
    </div>
  `;
}

function getGreeting(lang, personality) {
  const greetings = {
    komutan: {
      tr: 'Hazır ol asker! 🎖️ Bugünkü görevin ne? Antrenman, beslenme, toparlanma — söyle, komut ver!',
      en: 'Attention soldier! 🎖️ What\'s your mission today? Training, nutrition, recovery — report!',
    },
    kanka: {
      tr: 'Selam kral! 🤙 Ne var ne yok? Antrenman, beslenme veya toparlanma hakkında sohbet edelim!',
      en: 'Hey bro! 🤙 What\'s up? Let\'s chat about training, nutrition, or recovery!',
    },
    pt: {
      tr: 'Merhaba! 🏋️ Profesyonel antrenör olarak size nasıl yardımcı olabilirim? Form, teknik, beslenme planı — ne isterseniz.',
      en: 'Hello! 🏋️ As your professional trainer, how can I assist you? Form, technique, nutrition plans — anything you need.',
    },
  };
  return greetings[personality]?.[lang] || greetings.kanka[lang];
}

function buildWorkoutContext() {
  const workouts = store.getWorkouts();
  const lang = i18n.getLang();
  const recent = workouts.slice(-3);

  if (recent.length === 0) return '';

  let context = lang === 'tr' ? '\n\nSon antrenman özetleri:\n' : '\n\nRecent workout summaries:\n';
  recent.forEach((w, i) => {
    const date = new Date(w.startTime).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US');
    const duration = w.duration ? Math.floor(w.duration / 60000) : 0;
    const totalSets = (w.exercises || []).reduce((s, ex) => s + (ex.sets?.length || 0), 0);
    const totalVolume = (w.exercises || []).reduce((sum, ex) =>
      sum + (ex.sets || []).reduce((s2, s) => s2 + (s.weight || 0) * (s.reps || 0), 0), 0
    );
    const exerciseCount = (w.exercises || []).length;
    const rpeText = w.rpe ? ` | RPE: ${w.rpe}/10` : '';
    context += `${i + 1}. ${date} — ${exerciseCount} ${lang === 'tr' ? 'egzersiz' : 'exercises'}, ${totalSets} set, ${duration} ${lang === 'tr' ? 'dk' : 'min'}, ${totalVolume >= 1000 ? (totalVolume/1000).toFixed(1)+'k' : totalVolume}kg hacim${rpeText}\n`;
  });

  // Include PR count for context
  const prs = store.get('personalRecords') || {};
  const prCount = Object.keys(prs).length;
  if (prCount > 0) {
    context += lang === 'tr'
      ? `Kişisel Rekordlar: ${prCount} egzersizde PR var.\n`
      : `Personal Records: Has PRs in ${prCount} exercises.\n`;
  }

  return context;
}


export function initAICoach() {
  const sendBtn = document.getElementById('sendBtn');
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  const clearBtn = document.getElementById('clearChatBtn');

  // Scroll to bottom on load
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  const persona = PERSONALITIES[currentPersonality];

  function addMessage(text, isAi = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isAi ? 'ai-message' : 'user-message'}`;
    
    if (isAi) {
      msgDiv.innerHTML = `
        <div class="message-avatar">${persona.icon}</div>
        <div class="message-bubble">${text.replace(/\n/g, '<br>')}</div>
      `;
    } else {
      msgDiv.innerHTML = `
        <div class="message-bubble">${text}</div>
      `;
    }
    
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function handleSend(overrideText) {
    const text = overrideText || chatInput.value.trim();
    if (!text) return;

    if (!overrideText) chatInput.value = '';
    
    // Hide quick questions on first send
    const quickQContainer = document.getElementById('quickQuestions');
    if (quickQContainer) quickQContainer.style.display = 'none';
    
    // User message
    addMessage(text, false);
    store.addAIChatMessage(text, false);
    
    // Loading indicator
    const loadingId = 'loading-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai-message';
    loadingDiv.id = loadingId;
    loadingDiv.innerHTML = `
      <div class="message-avatar">${persona.icon}</div>
      <div class="message-bubble typing-indicator">
        <span></span><span></span><span></span>
      </div>
    `;
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Call API with enriched context
    const user = store.getUser() || {};
    const xpInfo = store.getXPInfo();
    const streak = store.get('streak');
    const workoutContext = buildWorkoutContext();
    const context = `Boy: ${user.height||'-'}cm, Kilo: ${user.weight||'-'}kg, Hedef: ${user.goal||'-'}, Seviye: ${xpInfo.level}, Seri: ${streak.current} gün${workoutContext}`;
    
    try {
      const response = await askAiCoach(text, context, currentPersonality);
      document.getElementById(loadingId)?.remove();
      addMessage(response, true);
      store.addAIChatMessage(response, true);
    } catch (e) {
      document.getElementById(loadingId)?.remove();
      const lang = i18n.getLang();
      const errMsg = lang === 'tr' ? 'Bir hata oluştu, lütfen tekrar dene.' : 'An error occurred, please try again.';
      addMessage(errMsg, true);
    }
  }

  sendBtn?.addEventListener('click', () => handleSend());
  chatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  // Quick questions
  document.querySelectorAll('.quick-q-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.quickQ);
      const lang = i18n.getLang();
      const questions = QUICK_QUESTIONS[lang] || QUICK_QUESTIONS.tr;
      const questionText = questions[idx]?.replace(/^[^\s]+ /, '') || '';
      handleSend(questionText);
    });
  });

  // Personality selector
  document.querySelectorAll('.persona-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPersonality = btn.dataset.persona;
      store.clearAIChatHistory();
      window.dispatchEvent(new CustomEvent('rerender'));
    });
  });

  clearBtn?.addEventListener('click', () => {
    store.clearAIChatHistory();
    showToast(t('aiChatCleared'), 'success');
    window.dispatchEvent(new CustomEvent('rerender'));
  });
}
