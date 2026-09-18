const dialog = document.querySelector('#pakem-story');
const discover = document.querySelector('.discover');
const closeButton = dialog.querySelector('.close-dialog');
const motionButton = document.querySelector('.motion-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const tabs = [...dialog.querySelectorAll('[role="tab"]')];
const panels = [...dialog.querySelectorAll('[role="tabpanel"]')];
const nextButton = dialog.querySelector('.next-story');
const postcardPhoto = dialog.querySelector('.postcard-photo');
let currentStory = 0;
let closeTimer;
let panelAnimation;
const motionAllowed = () => !reducedMotion.matches && !document.body.classList.contains('motion-paused');

function openStory() {
  if (dialog.open) return;
  clearTimeout(closeTimer);
  dialog.classList.remove('is-closing');
  dialog.showModal();
  document.body.classList.add('story-open');
  dialog.querySelector('.postcard').scrollTop = 0;
  closeButton.focus({ preventScroll: true });
}
function closeStory() {
  if (!dialog.open || dialog.classList.contains('is-closing')) return;
  const finish = () => {
    dialog.close();
    dialog.classList.remove('is-closing');
    document.body.classList.remove('story-open');
    discover.focus({ preventScroll: true });
  };
  if (!motionAllowed()) return finish();
  dialog.classList.add('is-closing');
  closeTimer = setTimeout(finish, 240);
}
discover.addEventListener('click', openStory);
closeButton.addEventListener('click', closeStory);
dialog.addEventListener('cancel', event => { event.preventDefault(); closeStory(); });
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeStory();
});

function selectStory(index, moveFocus = false) {
  panelAnimation?.cancel();
  currentStory = (index + tabs.length) % tabs.length;
  tabs.forEach((tab, i) => {
    tab.setAttribute('aria-selected', String(i === currentStory));
    tab.tabIndex = i === currentStory ? 0 : -1;
    panels[i].hidden = i !== currentStory;
  });
  if (moveFocus) tabs[currentStory].focus({ preventScroll: true });
  document.querySelector('.story-count').innerHTML = `0${currentStory + 1} <span>/ 03</span>`;
  nextButton.innerHTML = currentStory === 2 ? 'Kembali ke alam <span aria-hidden="true">↺</span>' : 'Cerita berikutnya <span aria-hidden="true">→</span>';
  postcardPhoto.style.objectPosition = ['62% 65%', '40% 85%', '78% 55%'][currentStory];
  if (motionAllowed()) {
    panelAnimation = panels[currentStory].animate([
      { opacity: 0, transform: 'translateY(13px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' });
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
  if (paused) panelAnimation?.finish();
});
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  let frame;
  window.addEventListener('pointermove', event => {
    if (!motionAllowed() || dialog.open) return;
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
    spark.textContent = '✦';
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
reducedMotion.addEventListener('change', () => { if (!motionAllowed()) panelAnimation?.finish(); });
