const dialog = document.querySelector('#pakem-story');
const discover = document.querySelector('.discover');
const brand = document.querySelector('.brand');
const philosophyDialog = document.querySelector('#logo-philosophy');
const motionButton = document.querySelector('.motion-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const tabs = [...dialog.querySelectorAll('[role="tab"]')];
const panels = [...dialog.querySelectorAll('[role="tabpanel"]')];
const nextButton = dialog.querySelector('.next-story');
const journalPhotos = [...dialog.querySelectorAll('[data-journey-photo]')];
let currentStory = 0;
let logoAnimation;
let panelAnimation;
let photoAnimation;
const motionAllowed = () => !reducedMotion.matches && !document.body.classList.contains('motion-paused');

// Both previews share focus management, animated dismissal, and backdrop behavior.
function connectDialog(modal, trigger, surfaceSelector) {
  let closeTimer;
  const closeButton = modal.querySelector('.close-dialog');
  const close = () => {
    if (!modal.open || modal.classList.contains('is-closing')) return;
    const finish = () => {
      modal.close();
      modal.classList.remove('is-closing');
      document.body.classList.remove('story-open');
      trigger.focus({ preventScroll: true });
    };
    if (!motionAllowed()) return finish();
    modal.classList.add('is-closing');
    closeTimer = setTimeout(finish, 240);
  };
  trigger.addEventListener('click', () => {
    if (document.querySelector('dialog[open]')) return;
    clearTimeout(closeTimer);
    modal.classList.remove('is-closing');
    modal.showModal();
    document.body.classList.add('story-open');
    modal.querySelector(surfaceSelector).scrollTop = 0;
    closeButton.focus({ preventScroll: true });
    if (trigger === brand && motionAllowed()) {
      logoAnimation?.cancel();
      logoAnimation = brand.querySelector('.brand-logo').animate([
        { transform: 'rotate(0) scale(1)' },
        { transform: 'rotate(-12deg) scale(.9)', offset: .22 },
        { transform: 'rotate(8deg) scale(1.12)', offset: .6 },
        { transform: 'rotate(0) scale(1)' }
      ], { duration: 550, easing: 'cubic-bezier(.22,1,.36,1)' });
    }
  });
  closeButton.addEventListener('click', close);
  modal.addEventListener('cancel', event => { event.preventDefault(); close(); });
  modal.addEventListener('click', event => {
    if (event.target !== modal) return;
    const rect = modal.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  });
  return close;
}
connectDialog(dialog, discover, '.postcard');
const closePhilosophy = connectDialog(philosophyDialog, brand, '.philosophy-card');
philosophyDialog.querySelector('.return-to-pakem').addEventListener('click', closePhilosophy);

function selectStory(index, moveFocus = false) {
  panelAnimation?.cancel();
  photoAnimation?.cancel();
  const previousStory = currentStory;
  currentStory = (index + tabs.length) % tabs.length;
  tabs.forEach((tab, i) => {
    tab.setAttribute('aria-selected', String(i === currentStory));
    tab.tabIndex = i === currentStory ? 0 : -1;
    panels[i].hidden = i !== currentStory;
  });
  if (moveFocus) tabs[currentStory].focus({ preventScroll: true });
  document.querySelector('.story-count').innerHTML = `0${currentStory + 1} <span>/ 03</span>`;
  nextButton.querySelector('.next-story-label').textContent = ['Dua hari kemudian', 'Lalu, apa lagi?', 'Baca dari awal'][currentStory];
  nextButton.classList.toggle('is-restart', currentStory === 2);
  journalPhotos.forEach((photo, i) => { photo.hidden = i !== currentStory; });
  dialog.querySelector('.postcard').scrollTo({ top: 0, behavior: motionAllowed() ? 'smooth' : 'instant' });
  const direction = currentStory >= previousStory ? 1 : -1;
  if (motionAllowed()) {
    panelAnimation = panels[currentStory].animate([
      { opacity: 0, transform: `translateX(${direction * 16}px)` },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' });
    photoAnimation = journalPhotos[currentStory].animate([
      { opacity: 0, transform: `translateX(${direction * 20}px) rotate(${direction * 1.5}deg)` },
      { opacity: 1, transform: 'translateX(0) rotate(0)' }
    ], { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectStory(index));
  tab.addEventListener('keydown', event => {
    let target;
    if (event.key === 'ArrowRight') target = currentStory + 1;
    if (event.key === 'ArrowLeft') target = currentStory - 1;
    if (event.key === 'Home') target = 0;
    if (event.key === 'End') target = tabs.length - 1;
    if (target !== undefined) { event.preventDefault(); selectStory(target, true); }
  });
});
nextButton.addEventListener('click', () => selectStory(currentStory + 1, true));

motionButton.addEventListener('click', () => {
  const paused = document.body.classList.toggle('motion-paused');
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.setAttribute('aria-label', paused ? 'Lanjutkan animasi' : 'Jeda animasi');
  motionButton.title = paused ? 'Lanjutkan animasi' : 'Jeda animasi';
  if (paused) { panelAnimation?.finish(); photoAnimation?.finish(); logoAnimation?.finish(); }
});
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  let frame;
  window.addEventListener('pointermove', event => {
    if (!motionAllowed() || document.body.classList.contains('story-open')) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      document.documentElement.style.setProperty('--scene-x', `${(event.clientX / innerWidth - .5) * -10}px`);
      document.documentElement.style.setProperty('--scene-y', `${(event.clientY / innerHeight - .5) * -6}px`);
    });
  }, { passive: true });
}
// A restrained little burst when the invitation is hovered or keyboard-focused.
function sparkle() {
  if (!motionAllowed()) return;
  const rect = discover.getBoundingClientRect();
  [-1, 1].forEach((side, i) => {
    const spark = document.createElement('span');
    spark.className = 'spark';
    spark.appendChild(document.querySelector('#spark-icon').content.cloneNode(true));
    spark.setAttribute('aria-hidden', 'true');
    spark.style.left = `${rect.left + rect.width / 2 + side * (rect.width / 2 + 5)}px`;
    spark.style.top = `${rect.top + 12 + i * 12}px`;
    spark.style.setProperty('--dx', `${side * 20}px`);
    spark.style.setProperty('--dy', '-25px');
    document.body.appendChild(spark);
    setTimeout(() => spark.remove(), 900);
  });
}
discover.addEventListener('pointerenter', sparkle);
discover.addEventListener('focus', sparkle);
reducedMotion.addEventListener('change', () => { if (!motionAllowed()) { panelAnimation?.finish(); photoAnimation?.finish(); logoAnimation?.finish(); } });

// A one-time, quiet invitation after 2.5 seconds without interaction.
(() => {
  const storageKey = 'pakem-logo-hint-seen';
  let seen = false;
  let idleTimer;
  let hideTimer;
  try { seen = sessionStorage.getItem(storageKey) === '1'; } catch { /* Storage can be unavailable. */ }

  const hideHint = () => {
    clearTimeout(hideTimer);
    brand.classList.remove('is-idle-hint');
  };
  const rememberHint = () => {
    seen = true;
    clearTimeout(idleTimer);
    try { sessionStorage.setItem(storageKey, '1'); } catch { /* Keep the in-memory fallback. */ }
  };
  const scheduleHint = () => {
    clearTimeout(idleTimer);
    if (seen || document.hidden) return;
    idleTimer = setTimeout(() => {
      if (document.hidden || document.querySelector('dialog[open]')) return;
      const rect = brand.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > innerHeight) return;
      rememberHint();
      brand.classList.add('is-idle-hint');
      hideTimer = setTimeout(hideHint, 6000);
    }, 2500);
  };
  const onActivity = event => {
    // Keep the invitation under the pointer until its click reaches the logo.
    if (brand.classList.contains('is-idle-hint') && brand.contains(event.target)) return;
    hideHint();
    scheduleHint();
  };
  ['pointermove', 'pointerdown', 'keydown', 'scroll'].forEach(type => {
    window.addEventListener(type, onActivity, { passive: true, capture: true });
  });
  brand.addEventListener('click', () => { rememberHint(); hideHint(); });
  document.addEventListener('visibilitychange', () => { hideHint(); scheduleHint(); });
  document.querySelectorAll('dialog').forEach(modal => modal.addEventListener('close', scheduleHint));
  scheduleHint();
})();
