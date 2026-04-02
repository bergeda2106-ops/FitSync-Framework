let activeModal = null;

export function showModal({ title, content, actions = [], onClose = null, className = '' }) {
  closeModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modalOverlay';

  const actionsHTML = actions.map(a =>
    `<button class="modal-btn ${a.class || 'btn-secondary'}" data-action="${a.id}">${a.label}</button>`
  ).join('');

  overlay.innerHTML = `
    <div class="modal ${className}">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="modal-close" id="modalClose">✕</button>
      </div>
      <div class="modal-body">
        ${content}
      </div>
      ${actionsHTML ? `<div class="modal-actions">${actionsHTML}</div>` : ''}
    </div>
  `;

  document.body.appendChild(overlay);

  // Animate in
  requestAnimationFrame(() => overlay.classList.add('active'));

  // Close button
  overlay.querySelector('#modalClose').addEventListener('click', () => {
    closeModal();
    if (onClose) onClose();
  });

  // Overlay click to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
      if (onClose) onClose();
    }
  });

  // Action buttons
  actions.forEach(action => {
    const btn = overlay.querySelector(`[data-action="${action.id}"]`);
    if (btn && action.onClick) {
      btn.addEventListener('click', () => {
        action.onClick();
        if (action.closeOnClick !== false) closeModal();
      });
    }
  });

  activeModal = overlay;
  return overlay;
}

export function closeModal() {
  if (activeModal) {
    activeModal.classList.remove('active');
    setTimeout(() => {
      activeModal?.remove();
      activeModal = null;
    }, 300);
  }
}
