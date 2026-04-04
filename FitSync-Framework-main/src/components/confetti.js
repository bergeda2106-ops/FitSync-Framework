export function launchConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  container.id = 'confettiContainer';
  document.body.appendChild(container);

  const colors = ['#FF6B35', '#00E676', '#FFD600', '#FF4081', '#448AFF', '#E040FB', '#00BCD4'];
  const shapes = ['circle', 'square', 'triangle'];

  for (let i = 0; i < 80; i++) {
    const confetti = document.createElement('div');
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    confetti.className = `confetti confetti-${shape}`;
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = `${Math.random() * 0.5}s`;
    confetti.style.animationDuration = `${1.5 + Math.random() * 2}s`;

    if (shape === 'triangle') {
      confetti.style.backgroundColor = 'transparent';
      confetti.style.borderBottomColor = colors[Math.floor(Math.random() * colors.length)];
    }

    container.appendChild(confetti);
  }

  // Clean up after animation
  setTimeout(() => container.remove(), 4000);
}

// Also add a smaller celebration for XP gains
export function xpBurst(element) {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const burst = document.createElement('div');
  burst.className = 'xp-burst';
  burst.style.left = `${rect.left + rect.width / 2}px`;
  burst.style.top = `${rect.top}px`;
  burst.textContent = '+XP';
  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 1000);
}
