import { t } from '../i18n/index.js';
import { askAiCoach } from '../api/ai.js';
import { store } from '../store.js';

export function renderAICoach() {
  return `
    <div class="aicoach-page">
      <div class="page-header">
        <h1>🤖 AI Koç</h1>
        <p>Fitness hedeflerinize ulaşmak için kişisel asistanınız</p>
      </div>

      <div class="chat-container glass-card" id="chatContainer">
        <div class="chat-messages" id="chatMessages">
          <div class="message ai-message">
            <div class="message-avatar">🤖</div>
            <div class="message-bubble">
              Merhaba! Antrenman, beslenme veya toparlanma süreci hakkında ne öğrenmek istersin?
            </div>
          </div>
        </div>
        
        <div class="chat-input-area">
          <input type="text" id="chatInput" placeholder="Yapay zekaya bir soru sor..." autocomplete="off">
          <button id="sendBtn" class="primary-btn pulse-glow">Gönder</button>
        </div>
      </div>
    </div>
  `;
}

export function initAICoach() {
  const sendBtn = document.getElementById('sendBtn');
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');

  function addMessage(text, isAi = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isAi ? 'ai-message' : 'user-message'}`;
    
    if (isAi) {
      msgDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-bubble">${text.replace(/\\n/g, '<br>')}</div>
      `;
    } else {
      msgDiv.innerHTML = `
        <div class="message-bubble">${text}</div>
      `;
    }
    
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = '';
    
    // User message
    addMessage(text, false);
    
    // Loading indicator
    const loadingId = 'loading-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai-message';
    loadingDiv.id = loadingId;
    loadingDiv.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="message-bubble typing-indicator">
        <span></span><span></span><span></span>
      </div>
    `;
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Call API
    const user = store.getUser() || {};
    const context = `Boy: ${user.height||'-'}, Kilo: ${user.weight||'-'}, Hedef: ${user.goal||'-'}`;
    
    try {
      const response = await askAiCoach(text, context);
      document.getElementById(loadingId)?.remove();
      addMessage(response, true);
    } catch (e) {
      document.getElementById(loadingId)?.remove();
      addMessage('Bir hata oluştu, lütfen tekrar dene.', true);
    }
  }

  sendBtn?.addEventListener('click', handleSend);
  chatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
  });
}
