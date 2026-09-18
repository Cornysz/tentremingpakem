const dialog = document.querySelector('#pakem-story');
const discover = document.querySelector('.discover');
const closeDialog = () => { dialog.close(); discover.focus(); };
discover.addEventListener('click', () => dialog.showModal());
dialog.querySelector('.close-dialog').addEventListener('click', closeDialog);
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog();
});
const motionButton = document.querySelector('.motion-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
motionButton.addEventListener('click', () => {
  const paused = document.body.classList.toggle('motion-paused');
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.innerHTML = paused ? 'Lanjutkan animasi <span aria-hidden="true">▷</span>' : 'Jeda animasi <span aria-hidden="true">Ⅱ</span>';
});
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  window.addEventListener('pointermove', event => {
    if (reducedMotion.matches || document.body.classList.contains('motion-paused') || dialog.open) return;
    document.documentElement.style.setProperty('--scene-x', `${(event.clientX / innerWidth - .5) * -10}px`);
    document.documentElement.style.setProperty('--scene-y', `${(event.clientY / innerHeight - .5) * -6}px`);
  }, {passive:true});
}
