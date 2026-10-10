const dialog = document.querySelector('#pakem-story');
const discover = document.querySelector('.discover');
const brand = document.querySelector('.brand');
const philosophyDialog = document.querySelector('#logo-philosophy');
const motionButton = document.querySelector('.motion-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const tabs = [...dialog.querySelectorAll('[role="tab"]')];
const panels = [...dialog.querySelectorAll('[role="tabpanel"]')];
const nextButton = dialog.querySelector('.next-story');
const previousButton = dialog.querySelector('.previous-story');
const journalPhotos = [...dialog.querySelectorAll('[data-journey-photo]')];
let currentStory = 0;
let logoAnimation;
let panelAnimation;
let photoAnimation;
const motionAllowed = () => !reducedMotion.matches && !document.body.classList.contains('motion-paused');

// Both previews share focus management, animated dismissal, and backdrop behavior.
// Other buttons may open a dialog too; focus returns to whichever one did.
function connectDialog(modal, trigger, surfaceSelector) {
  let closeTimer;
  let opener = trigger;
  const closeButton = modal.querySelector('.close-dialog');
  const close = () => {
    if (!modal.open || modal.classList.contains('is-closing')) return;
    const finish = () => {
      modal.close();
      modal.classList.remove('is-closing');
      document.body.classList.remove('story-open');
      opener.focus({ preventScroll: true });
    };
    if (!motionAllowed()) return finish();
    modal.classList.add('is-closing');
    closeTimer = setTimeout(finish, 240);
  };
  const open = (from = trigger) => {
    if (document.querySelector('dialog[open]')) return;
    opener = from;
    clearTimeout(closeTimer);
    modal.classList.remove('is-closing');
    modal.showModal();
    document.body.classList.add('story-open');
    modal.querySelector(surfaceSelector).scrollTop = 0;
    closeButton.focus({ preventScroll: true });
    modal.dispatchEvent(new Event("dialog-open"));
    if (from === brand && motionAllowed()) {
      logoAnimation?.cancel();
      logoAnimation = brand.querySelector('.brand-logo').animate([
        { transform: 'rotate(0) scale(1)' },
        { transform: 'rotate(-12deg) scale(.9)', offset: .22 },
        { transform: 'rotate(8deg) scale(1.12)', offset: .6 },
        { transform: 'rotate(0) scale(1)' }
      ], { duration: 550, easing: 'cubic-bezier(.22,1,.36,1)' });
    }
  };
  trigger?.addEventListener('click', () => open());
  closeButton.addEventListener('click', close);
  modal.addEventListener('cancel', event => { event.preventDefault(); close(); });
  modal.addEventListener('click', event => {
    if (event.target !== modal) return;
    const rect = modal.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  });
  return { open, close };
}
// the journal opens from Jurnal in the nav and footer, and from the Perjalanan prints; the hero button is Instagram
const story = connectDialog(dialog, null, '.postcard');
const philosophy = connectDialog(philosophyDialog, brand, '.philosophy-card');

const pad = number => String(number).padStart(2, '0');
// The count and the next label come from the markup, so a new chapter needs only its tab, panel, and photos.
function updateNavigation() {
  document.querySelector('.story-count').innerHTML = `${pad(currentStory + 1)} <span>/ ${pad(tabs.length)}</span>`;
  nextButton.querySelector('.next-story-label').textContent = panels[currentStory].dataset.next;
  nextButton.classList.toggle('is-restart', currentStory === tabs.length - 1);
  previousButton.disabled = currentStory === 0;
}
updateNavigation();

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
  // the tab strip scrolls sideways when the dates no longer fit, so the chosen date slides into view
  const strip = tabs[currentStory].parentElement, chosen = tabs[currentStory].getBoundingClientRect(), view = strip.getBoundingClientRect();
  if (chosen.left < view.left || chosen.right > view.right) strip.scrollTo({ left: strip.scrollLeft + chosen.left - view.left - (view.width - chosen.width) / 2, behavior: motionAllowed() ? 'smooth' : 'instant' });
  updateNavigation();
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
previousButton.addEventListener('click', () => selectStory(currentStory - 1, true));

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
    if (!motionAllowed() || document.body.classList.contains('story-open') || document.body.classList.contains('is-past-hero')) return;
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

// Journal photos open in a larger preview that grows out of the print and settles back into it.
(() => {
  const viewer = document.querySelector('#photo-preview');
  const view = viewer.querySelector('.photo-view');
  const full = viewer.querySelector('.photo-full');
  const date = viewer.querySelector('.photo-date');
  const text = viewer.querySelector('.photo-text');
  const position = viewer.querySelector('.photo-position');
  const controls = viewer.querySelector('.photo-controls');
  const count = viewer.querySelector('.photo-count');
  const [back, forward] = viewer.querySelectorAll('.photo-step');
  const closeButton = viewer.querySelector('.close-dialog');
  let photos = [];
  let current = 0;
  let zoom;
  let closeTimer;
  let opening = false;
  let closing = false;
  let swipe;

  // The tilt a print rests at, so the zoom starts exactly where the photo sits.
  const tilt = element => {
    const matrix = getComputedStyle(element).transform;
    if (matrix === 'none') return 0;
    const [a, b] = matrix.match(/-?[\d.]+(?:e-?\d+)?/g).map(Number);
    return Math.atan2(b, a) * 180 / Math.PI;
  };
  const printTransform = thumb => {
    const from = thumb.getBoundingClientRect();
    const to = full.getBoundingClientRect();
    const x = from.left + from.width / 2 - (to.left + to.width / 2);
    const y = from.top + from.height / 2 - (to.top + to.height / 2);
    return `translate(${x}px, ${y}px) scale(${thumb.offsetWidth / full.offsetWidth}) rotate(${tilt(thumb) + tilt(thumb.parentElement)}deg)`;
  };
  const onScreen = element => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.bottom > 0 && rect.top < innerHeight;
  };

  const show = index => {
    current = index;
    const photo = photos[current];
    full.setAttribute('width', photo.getAttribute('width'));
    full.setAttribute('height', photo.getAttribute('height'));
    full.src = photo.currentSrc || photo.src;
    text.textContent = photo.alt;
    position.textContent = `Foto ${current + 1} dari ${photos.length}.`;
    count.innerHTML = `${current + 1} <span>/ ${photos.length}</span>`;
    back.disabled = current === 0;
    forward.disabled = current === photos.length - 1;
  };
  const open = async thumb => {
    if (opening || viewer.open) return;
    opening = true;
    const spread = thumb.closest('.journal-spread');
    photos = [...spread.querySelectorAll('.journal-collage img')];
    date.textContent = spread.querySelector('figcaption .chapter-label')?.textContent ?? '';
    controls.hidden = photos.length < 2;
    show(photos.indexOf(thumb));
    // Decoding first keeps the preview from measuring or flashing an image that has not arrived.
    await full.decode().catch(() => {});
    opening = false;
    closing = false;
    viewer.classList.remove('is-closing');
    viewer.showModal();
    closeButton.focus({ preventScroll: true });
    if (!motionAllowed()) return;
    zoom?.cancel();
    zoom = full.animate([{ transform: printTransform(thumb) }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)' });
  };
  const close = () => {
    if (!viewer.open || closing) return;
    closing = true;
    const thumb = photos[current];
    const finish = () => {
      clearTimeout(closeTimer);
      zoom?.cancel();
      viewer.close();
      viewer.classList.remove('is-closing');
      closing = false;
      thumb.focus({ preventScroll: true });
    };
    if (!motionAllowed()) return finish();
    zoom?.cancel();
    const returns = onScreen(thumb);
    viewer.classList.add('is-closing');
    zoom = full.animate([
      { transform: 'none', opacity: 1 },
      { transform: returns ? printTransform(thumb) : 'scale(.92)', opacity: returns ? 1 : 0 }
    ], { duration: 320, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    // A timer, not the animation's finish event: a tab hidden mid-close would otherwise never close.
    closeTimer = setTimeout(finish, 320);
  };
  const step = async delta => {
    const target = current + delta;
    if (closing || target < 0 || target >= photos.length) return;
    show(target);
    await full.decode().catch(() => {});
    if (!motionAllowed()) return;
    zoom?.cancel();
    zoom = full.animate([
      { opacity: 0, transform: `translateX(${delta * 28}px)` },
      { opacity: 1, transform: 'none' }
    ], { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)' });
  };

  document.querySelectorAll('.journal-collage img').forEach(img => {
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-haspopup', 'dialog');
    img.setAttribute('aria-label', `Perbesar foto: ${img.alt}`);
    img.addEventListener('click', () => open(img));
    img.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      open(img);
    });
  });
  closeButton.addEventListener('click', close);
  back.addEventListener('click', () => step(-1));
  forward.addEventListener('click', () => step(1));
  viewer.addEventListener('cancel', event => { event.preventDefault(); close(); });
  viewer.addEventListener('click', event => { if (event.target === viewer) close(); });
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
  });
  // A sideways swipe turns to the next photo on touch screens; vertical pans and pinch-zoom stay native.
  view.addEventListener('pointerdown', event => { if (event.pointerType !== 'mouse') swipe = { x: event.clientX, y: event.clientY }; });
  view.addEventListener('pointerup', event => {
    if (!swipe) return;
    const dx = event.clientX - swipe.x;
    const dy = event.clientY - swipe.y;
    swipe = undefined;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  });
  view.addEventListener('pointercancel', () => { swipe = undefined; });
})();

// Counts down to deployment day, then counts the operational days up to the last one. Every date carries the
// +07:00 offset, so every visitor sees Western Indonesia Time.
(() => {
  const countdown = document.querySelector('.countdown');
  const day = 864e5;
  const start = Date.parse(countdown.dataset.target);
  const end = Date.parse(countdown.dataset.end) + day; // the last day counts in full
  const total = Math.round((end - start) / day);
  const digits = [...countdown.querySelectorAll('.countdown-value > span')];
  const units = countdown.querySelector('.countdown-units');
  const heading = countdown.querySelector('.countdown-heading');
  const dateSlot = countdown.querySelector('.countdown-date');
  const message = countdown.querySelector('.countdown-message');
  const ops = countdown.querySelector('.countdown-ops');
  const opsDay = ops.querySelector('.countdown-ops-n');
  const opsOf = ops.querySelector('.countdown-ops-of');
  const opsBar = ops.querySelector('.countdown-ops-bar');
  const opsLeft = ops.querySelector('.countdown-ops-left');
  let timer;
  let state;
  let countingUp = false;

  const roll = (digit, text, animate) => {
    if (digit.textContent === text) return;
    digit.textContent = text;
    if (!animate || !motionAllowed() || document.hidden) return;
    digit.animate([{ transform: 'translateY(-75%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 450, easing: 'cubic-bezier(.22,1,.36,1)' });
  };
  // `share` scales what the card shows, so the opening can count up from zero.
  const render = (share = 1) => {
    const now = Date.now();
    const left = Math.max(0, start - now);
    const current = now < start ? 'counting' : now < end ? 'ops' : 'done';
    if (current !== state) {
      state = current;
      countdown.dataset.state = state;
      units.hidden = state !== 'counting';
      ops.hidden = state !== 'ops';
      message.hidden = state !== 'done';
      if (state !== 'counting') {
        heading.textContent = heading.dataset[state];
        dateSlot.textContent = ` · ${dateSlot.dataset.ops}`;
        message.textContent = message.dataset.done;
      }
    }
    if (state === 'counting') {
      [left / day, left / 36e5 % 24, left / 6e4 % 60, left / 1e3 % 60].forEach((value, i) => {
        roll(digits[i], pad(Math.floor(Math.floor(value) * share)), share === 1);
      });
    } else if (state === 'ops') {
      const n = Math.min(total, Math.floor((now - start) / day) + 1);
      const shown = Math.max(1, Math.round(n * share));
      const rest = total - n;
      opsDay.textContent = `Hari ke-${shown}`;
      opsOf.textContent = `dari ${total}`;
      opsBar.style.setProperty('--done', `${(shown / total * 100).toFixed(2)}%`);
      opsBar.setAttribute('aria-valuemax', String(total));
      opsBar.setAttribute('aria-valuenow', String(n));
      opsBar.setAttribute('aria-valuetext', `Hari ke-${n} dari ${total}${rest ? `, ${rest} hari lagi` : ', hari terakhir'}`);
      opsLeft.textContent = n === 1 ? 'Hari penerjunan' : rest ? `${rest} hari lagi` : 'Hari terakhir';
    }
    return left;
  };
  const tick = () => {
    countingUp = false;
    clearTimeout(timer);
    const left = render();
    // Waking just after the next whole second keeps the seconds from skipping; after that, once a minute is enough.
    timer = setTimeout(tick, left ? left % 1000 + 30 : 6e4);
  };
  // The card counts up while it rises in with the rest of the opening.
  if (motionAllowed() && !document.hidden) {
    countingUp = true;
    const begin = performance.now() + 1350;
    const frame = time => {
      if (!countingUp) return;
      const t = Math.min(1, Math.max(0, (time - begin) / 1100));
      if (t === 1) return tick();
      render(1 - (1 - t) ** 3);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    // If the browser pauses frames, this still lands the real numbers on time.
    timer = setTimeout(tick, 2600);
  } else {
    tick();
  }
  // Background tabs throttle timers, so a returning visitor gets the exact time at once.
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
})();

// Below the hero: reveal on scroll, the section nav with its current-section marker, and a resting landscape.
(() => {
  const hero = document.querySelector('.page');
  const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]:not(.site-nav-home)')];
  // Once the hero has slid under the nav area, the nav appears and the hidden landscape stops animating.
  // The margin is larger than html's 84px scroll padding, so a jump to #tema also counts as past the hero.
  new IntersectionObserver(([entry]) => {
    document.body.classList.toggle('is-past-hero', !entry.isIntersecting);
  }, { rootMargin: '-120px 0px 0px 0px' }).observe(hero);
  // As soon as reading starts near the bottom of the screen, the pause button steps aside.
  new IntersectionObserver(([entry]) => {
    document.body.classList.toggle('is-reading', !entry.isIntersecting);
  }, { rootMargin: '-88% 0px 0px 0px' }).observe(hero);
  const onScroll = () => document.body.classList.toggle('is-scrolled', scrollY > 40);
  // If nobody has moved after six seconds, the slope breathes once and the leaf falls, as a nudge to scroll.
  let stirred = false;
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(type => addEventListener(type, () => { stirred = true; }, { once: true, passive: true }));
  addEventListener('pointermove', function moved(event) { if (event.pointerType !== 'mouse') return; stirred = true; removeEventListener('pointermove', moved); }, { passive: true });
  setTimeout(() => {
    if (stirred || scrollY >= 40 || document.hidden || !motionAllowed()) return;
    document.querySelectorAll('.slope, .scroll-cue').forEach(element => {
      element.classList.add('is-nudging');
      element.addEventListener('animationend', function done(event) {
        if (event.animationName !== 'slope-nudge' && event.animationName !== 'chev-nudge') return;
        element.classList.remove('is-nudging');
        element.removeEventListener('animationend', done);
      });
    });
  }, 6000);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-revealed');
    entry.target.dispatchEvent(new CustomEvent('reveal'));
    reveal.unobserve(entry.target);
  }), { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('[data-reveal]').forEach(element => reveal.observe(element));
  // The contour rings behind Pakem draw outward when its heading arrives.
  const contours = document.querySelector('.contours');
  document.querySelector('#pakem .section-eyebrow').addEventListener('reveal', () => contours.classList.add('is-drawn'), { once: true });
  // Tells the failsafe in the page head that reveals are handled, so it leaves the content hidden until then.
  document.documentElement.setAttribute('data-reveal-ready', '');

  // The link for whichever section crosses the middle of the screen is marked as current.
  const spy = new IntersectionObserver(entries => entries.forEach(entry => {
    const link = navLinks.find(item => item.hash === `#${entry.target.id}`);
    if (entry.isIntersecting) navLinks.forEach(item => (item === link ? item.setAttribute('aria-current', 'true') : item.removeAttribute('aria-current')));
    else if (link.hasAttribute('aria-current')) link.removeAttribute('aria-current');
  }), { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach(link => spy.observe(document.querySelector(link.hash)));
  const journalButton = document.querySelector('.site-nav-journal');
  journalButton.addEventListener('click', () => story.open(journalButton));
  const footerJournal = document.querySelector('.footer-journal');
  footerJournal.addEventListener('click', () => story.open(footerJournal));
  const footerPhilosophy = document.querySelector('.footer-philosophy');
  footerPhilosophy.addEventListener('click', () => philosophy.open(footerPhilosophy));
})();

// The theme statement explains itself: each underlined phrase opens its meaning inside the card, one at a time.
// The paper moves with it: it unfolds on open, the next meaning slides in over the last one, and it folds away on close.
// A tap in the middle of a move carries on from the height on screen, so the page never jumps.
(() => {
  const statement = document.querySelector('.theme-statement');
  const gloss = statement.querySelector('.theme-gloss');
  const status = statement.querySelector('.term-status');
  const terms = [...statement.querySelectorAll('.theme-term')];
  const panels = [...statement.querySelectorAll('.term-panel')];
  const order = panels.map(panel => panel.dataset.term);
  const EASE = 'cubic-bezier(.22,1,.36,1)', FOLD = 'cubic-bezier(.55,0,.7,.2)';
  let current = null;
  let moving = [];
  const play = (el, keyframes, options) => {
    const animation = el.animate(keyframes, { easing: EASE, fill: 'backwards', ...options });
    moving.push(animation);
    return animation;
  };
  const settle = () => {
    moving.forEach(animation => animation.cancel());
    moving = [];
    gloss.classList.remove('is-moving');
    panels.forEach(panel => { panel.classList.remove('is-leaving'); panel.inert = false; });
  };
  // the height of the paper animates between two sizes while the page below follows it
  const grow = (from, to, options) => {
    gloss.classList.add('is-moving');
    return play(gloss, [{ height: `${from.height}px`, marginTop: `${from.margin}px` }, { height: `${to.height}px`, marginTop: `${to.margin}px` }], options);
  };
  const size = () => ({ height: gloss.getBoundingClientRect().height, margin: parseFloat(getComputedStyle(gloss).marginTop) || 0 });
  // the parts of a meaning arrive one after another: the icon pops, then the words rise.
  // When switching, the Lanjut row stays put, so the button never blinks under the thumb.
  const arrive = (panel, delay, quick = false) => {
    play(panel.querySelector('.term-icon'), [{ opacity: 0, transform: 'scale(.4) rotate(-35deg)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay, easing: 'cubic-bezier(.34,1.56,.64,1)' });
    panel.querySelectorAll(quick ? '.term-kicker, .term-title, .term-text, .term-source' : '.term-kicker, .term-title, .term-text, .term-source, .term-foot')
      .forEach((el, i) => play(el, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 440, delay: delay + (quick ? 30 : 60) + i * (quick ? 30 : 45) }));
  };
  const mark = () => terms.forEach(term => {
    const on = term.dataset.term === current;
    term.classList.toggle('is-active', on);
    term.setAttribute('aria-expanded', String(on));
  });
  const putAway = () => {
    statement.classList.remove('has-gloss');
    panels.forEach(panel => panel.classList.remove('is-current'));
  };
  // the paper folds up from the bottom while the page below closes the gap
  const fold = from => {
    const panel = panels.find(item => item.classList.contains('is-current'));
    if (panel) {
      panel.inert = true;
      play(panel, [{ clipPath: 'inset(0 0 0% 0 round 20px)' }, { clipPath: 'inset(0 0 100% 0 round 20px)', transform: 'translateY(-6px) scale(.985)' }], { duration: 300, easing: FOLD, fill: 'forwards' });
    }
    gloss.classList.add('is-moving');
    play(gloss, [{ height: `${from.height}px`, marginTop: `${from.margin}px`, opacity: 1 }, { height: '0px', marginTop: '0px', opacity: 0 }], { duration: 300, easing: FOLD, fill: 'forwards' })
      .finished.then(() => {
        if (current) return;
        putAway();
        settle();
      }, () => {});
  };
  const show = (key, focusTarget, { instant = false } = {}) => {
    const previous = current;
    const wasMoving = gloss.classList.contains('is-moving');
    const from = size();
    current = key || null;
    settle();
    mark();
    if (!current) {
      if (previous && motionAllowed() && !instant) fold(from);
      else putAway();
      return;
    }
    const panel = panels.find(item => item.dataset.term === current);
    const old = panels.find(item => item.dataset.term === previous);
    panels.forEach(item => item.classList.toggle('is-current', item === panel));
    statement.classList.add('has-gloss');
    status.textContent = `${panel.querySelector('.term-title').textContent}. ${panel.querySelector('.term-text').textContent}`;
    // measured before anything moves, so the scroll below aims at where the card will end up
    const to = size();
    const finalBottom = panel.getBoundingClientRect().bottom;
    if (motionAllowed()) {
      if (!old) {
        // the paper unfolds from the top (or keeps opening from where a fold was stopped) while the page below makes room
        grow(wasMoving ? from : { height: 0, margin: 0 }, to, { duration: 460 }).finished.then(() => gloss.classList.remove('is-moving'), () => {});
        play(panel, [{ opacity: .3, transform: 'translateY(-6px) scale(.985)', clipPath: 'inset(0 0 100% 0 round 20px)' }, { opacity: 1, transform: 'none', clipPath: 'inset(0 0 0% 0 round 20px)' }], { duration: 560 });
        arrive(panel, 140);
      } else if (old !== panel) {
        // the next meaning slides in over the last one, like a card laid on top
        if (wasMoving) grow(from, to, { duration: 380 }).finished.then(() => gloss.classList.remove('is-moving'), () => {});
        const dir = order.indexOf(current) > order.indexOf(previous) ? 1 : -1;
        old.classList.add('is-leaving');
        old.inert = true;
        play(old, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-18 * dir}px) scale(.97)` }], { duration: 380, fill: 'forwards' })
          .finished.then(() => { old.classList.remove('is-leaving'); old.inert = false; }, () => {});
        play(panel, [{ opacity: 0, transform: `translateX(${34 * dir}px) rotate(${dir * .8}deg)` }, { opacity: 1, transform: 'none' }], { duration: 480 });
        arrive(panel, 40, true);
      }
    }
    if (focusTarget) panel.querySelector(focusTarget)?.focus({ preventScroll: true });
    if (finalBottom > innerHeight - 12) scrollBy({ top: finalBottom - innerHeight + 12, behavior: motionAllowed() ? 'smooth' : 'auto' });
  };
  const closeTo = () => {
    if (!current) return;
    const term = terms.find(item => item.dataset.term === current);
    show(null);
    term?.focus();
  };
  // The phrases are inline spans so their underline wraps with the sentence; Enter and Space work like a button.
  terms.forEach(term => {
    term.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      term.click();
    });
    term.addEventListener('click', () => show(current === term.dataset.term ? null : term.dataset.term));
  });
  panels.forEach(panel => {
    panel.querySelector('.term-close').addEventListener('click', closeTo);
    const next = panel.querySelector('.term-next');
    next.addEventListener('click', () => {
      if (next.dataset.next) return show(next.dataset.next, '.term-next');
      // the page scrolls away to the clusters, so the meaning is put away at once instead of folding under the scroll
      show(null, null, { instant: true });
      document.querySelector('.theme-grove').scrollIntoView({ block: 'start', behavior: motionAllowed() ? 'smooth' : 'auto' });
      document.querySelector('.cluster-open').focus({ preventScroll: true });
    });
  });
  statement.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !current) return;
    event.preventDefault();
    closeTo();
  });
  motionButton.addEventListener('click', () => { if (document.body.classList.contains('motion-paused')) moving.slice().forEach(animation => animation.finish()); });
})();

// Each cluster card opens the same member preview, already turned to its cluster.
(() => {
  const modal = document.querySelector('#klaster-anggota');
  const openers = [...document.querySelectorAll('.cluster-open')];
  const tabs = [...modal.querySelectorAll('[role="tab"]')];
  const panels = [...modal.querySelectorAll('[role="tabpanel"]')];
  const card = modal.querySelector('.members-card');
  const nameSlot = modal.querySelector('.members-name');
  const nextButton = modal.querySelector('.members-next');
  const nextLabel = nextButton.querySelector('.members-next-label');
  let current = 0;
  let rowAnimations = [];
  // Initials come from the names, so editing a name in index.html is enough.
  const initial = word => (word.match(/\p{L}/u) || [''])[0];
  modal.querySelectorAll('.member').forEach(row => {
    const words = row.querySelector('.member-name').textContent.trim().split(/\s+/);
    row.querySelector('.member-mono').textContent = (initial(words[0]) + (words.length > 1 ? initial(words[words.length - 1]) : '')).toUpperCase();
  });
  const select = (index, { focusTab = false, animate = true } = {}) => {
    current = (index + tabs.length) % tabs.length;
    const tab = tabs[current];
    tabs.forEach((item, i) => {
      item.setAttribute('aria-selected', String(i === current));
      item.tabIndex = i === current ? 0 : -1;
    });
    const hadFocus = panels.some(panel => panel.contains(document.activeElement));
    panels.forEach((panel, i) => { panel.hidden = i !== current; });
    if (hadFocus && !focusTab) panels[current].focus({ preventScroll: true });
    modal.dataset.cluster = tab.dataset.cluster;
    nameSlot.textContent = tab.dataset.name;
    nextLabel.textContent = current === tabs.length - 1 ? `Kembali ke ${tabs[0].dataset.name}` : `Lanjut ke ${tabs[current + 1].dataset.name}`;
    if (focusTab) tab.focus({ preventScroll: true });
    card.scrollTop = 0;
    rowAnimations.forEach(animation => animation.cancel());
    rowAnimations = [];
    if (!animate || !motionAllowed()) return;
    rowAnimations = [...panels[current].querySelectorAll('.members-subtema, .member')].map((row, i) => row.animate(
      [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
      { duration: 420, delay: 80 + i * 35, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }
    ));
  };
  const indexOf = key => Math.max(0, tabs.findIndex(tab => tab.dataset.cluster === key));
  // Order matters: this listener runs before the one connectDialog adds to the first card,
  // so the dialog always opens on the cluster that was tapped.
  openers.forEach(button => button.addEventListener('click', () => { modal.dataset.cluster = button.dataset.cluster; }));
  const members = connectDialog(modal, openers[0], '.members-card');
  openers.slice(1).forEach(button => button.addEventListener('click', () => members.open(button)));
  modal.addEventListener('dialog-open', () => {
    modal.style.transform = '';
    select(indexOf(modal.dataset.cluster));
  });
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', event => {
      let target;
      if (event.key === 'ArrowRight') target = index + 1;
      if (event.key === 'ArrowLeft') target = index - 1;
      if (event.key === 'Home') target = 0;
      if (event.key === 'End') target = tabs.length - 1;
      if (target === undefined) return;
      event.preventDefault();
      select(target, { focusTab: true });
    });
  });
  nextButton.addEventListener('click', () => select(current + 1, { focusTab: true }));
  // A sideways swipe over the list turns to the next or previous cluster; vertical drags still scroll.
  const list = modal.querySelector('.members-panels');
  let swipe = null;
  list.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' || event.clientX < 24 || event.clientX > innerWidth - 24) return;
    swipe = { x: event.clientX, y: event.clientY };
  });
  list.addEventListener('pointercancel', () => { swipe = null; });
  list.addEventListener('pointerup', event => {
    if (!swipe) return;
    const dx = event.clientX - swipe.x;
    const dy = event.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const target = current + (dx < 0 ? 1 : -1);
    if (target >= 0 && target < tabs.length) select(target);
  });
  // On phones the sheet follows a downward pull on its handle or title, and closes past 96px or on a quick flick.
  const sheet = matchMedia('(max-width: 760px)');
  let drag = null;
  const startDrag = event => {
    if (!sheet.matches || event.button !== 0 || event.target.closest('button')) return;
    drag = { y: event.clientY, t: performance.now(), dy: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
    modal.style.transition = 'none';
  };
  const moveDrag = event => {
    if (!drag) return;
    drag.dy = Math.max(0, event.clientY - drag.y);
    modal.style.transform = `translateY(${drag.dy}px)`;
  };
  const endDrag = () => {
    if (!drag) return;
    const { dy, t } = drag;
    drag = null;
    if (dy > 96 || (dy > 24 && dy / Math.max(1, performance.now() - t) > .6)) return members.close();
    modal.style.transition = motionAllowed() ? 'transform .3s cubic-bezier(.22,1,.36,1)' : '';
    modal.style.transform = '';
  };
  modal.querySelectorAll('.members-grab, .members-intro').forEach(handle => {
    handle.addEventListener('pointerdown', startDrag);
    handle.addEventListener('pointermove', moveDrag);
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);
  });
  modal.addEventListener('close', () => { modal.style.transform = ''; modal.style.transition = ''; });
  motionButton.addEventListener('click', () => { if (document.body.classList.contains('motion-paused')) rowAnimations.forEach(animation => animation.finish()); });
})();

// Numbers count up once their row comes into view.
(() => {
  const format = (value, decimals) => value.toLocaleString('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  document.querySelectorAll('[data-count]').forEach(number => {
    const target = Number(number.dataset.count);
    const decimals = (number.dataset.count.split('.')[1] || '').length;
    number.textContent = format(target, decimals);
    const row = number.closest('[data-reveal]');
    if (!row) return;
    row.addEventListener('reveal', () => {
      if (!motionAllowed()) return;
      const start = performance.now();
      const frame = time => {
        const t = Math.min(1, Math.max(0, (time - start) / 1400));
        number.textContent = format(target * (1 - (1 - t) ** 3), decimals);
        if (t < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
      // If frames are paused, the real figure is still in place a moment later.
      setTimeout(() => { number.textContent = format(target, decimals); }, 1600);
    }, { once: true });
  });
})();

// The location map, the kalurahan tabs and the Google map always point at the same place.
(() => {
  const section = document.querySelector('#lokasi');
  const placeTabs = [...section.querySelectorAll('.place-tabs [role="tab"]')];
  const placePanels = [...section.querySelectorAll('.place')];
  const regions = [...section.querySelectorAll('.region')];
  const labels = [...section.querySelectorAll('.region-label')];
  const pins = [...section.querySelectorAll('.map-pin')];
  const figure = section.querySelector('.places-map');
  const tip = figure.querySelector('.map-tip');
  const gmap = section.querySelector('.gmap');
  const gmapTitle = gmap.querySelector('.gmap-title');
  const ghost = gmap.querySelector('.gmap-ghost');
  const selection = figure.querySelector('.region-outline.is-selection');
  const focusRing = figure.querySelector('.region-outline.is-focus');
  const viewButtons = [...gmap.querySelectorAll('.gmap-view button')];
  const switches = [...figure.querySelectorAll('.map-switch button')];
  let current;
  let view = 'k';

  const panelFor = place => placePanels.find(panel => panel.dataset.place === place);
  // Google Maps loads only when asked, so the page itself sets no third-party cookies.
  // Each change swaps in a fresh frame: navigating the old one would add a Back step per click.
  const loadMap = () => {
    const panel = panelFor(current);
    const url = `https://maps.google.com/maps?q=${encodeURIComponent(panel.dataset.query)}&t=${view}&z=${panel.dataset.zoom}&ie=UTF8&output=embed`;
    const old = gmap.querySelector('iframe');
    if (old && old.src === url) return old;
    const frame = document.createElement('iframe');
    frame.referrerPolicy = 'no-referrer-when-downgrade';
    frame.allowFullscreen = true;
    frame.title = `Google Maps: ${panel.dataset.name}`;
    frame.src = url;
    if (old) old.replaceWith(frame); else gmap.append(frame);
    gmap.classList.add('is-loaded');
    return frame;
  };
  const select = (place, { focusTab = false } = {}) => {
    if (place === current) return;
    const first = current === undefined;
    current = place;
    if (!first && motionAllowed()) pins.filter(pin => pin.dataset.place === place).forEach(pin => {
      pin.classList.remove('is-dropping');
      void pin.getBoundingClientRect();
      pin.classList.add('is-dropping');
    });
    placeTabs.forEach(tab => {
      const on = tab.dataset.place === place;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && focusTab) tab.focus();
    });
    placePanels.forEach(panel => {
      const on = panel.dataset.place === place;
      panel.hidden = !on;
      panel.classList.remove('is-entering');
      if (on && motionAllowed()) {
        void panel.offsetWidth;
        panel.classList.add('is-entering');
      }
    });
    regions.forEach(region => {
      const on = region.dataset.place === place;
      region.classList.toggle('is-selected', on);
      if (region.classList.contains('is-target')) region.setAttribute('aria-pressed', String(on));
    });
    labels.forEach(label => label.classList.toggle('is-selected', label.dataset.place === place));
    selection.setAttribute('d', regions.find(region => region.dataset.place === place).getAttribute('d'));
    gmapTitle.textContent = panelFor(place).dataset.name;
    // The waiting card previews the chosen outline, dashed like the boundary Google draws.
    const outline = regions.find(region => region.dataset.place === place);
    const box = outline.getBBox();
    const pad = Math.max(box.width, box.height) * .08;
    ghost.setAttribute('viewBox', `${box.x - pad} ${box.y - pad} ${box.width + 2 * pad} ${box.height + 2 * pad}`);
    ghost.firstElementChild.setAttribute('d', outline.getAttribute('d'));
    if (gmap.classList.contains('is-loaded')) loadMap();
  };

  placeTabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab.dataset.place));
    tab.addEventListener('keydown', event => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      select(placeTabs[(i + step + placeTabs.length) % placeTabs.length].dataset.place, { focusTab: true });
    });
  });
  regions.filter(region => region.classList.contains('is-target')).forEach(region => {
    // The focus ring is drawn on a top layer, so neighbouring shapes never cover it.
    region.addEventListener('focus', () => focusRing.setAttribute('d', region.getAttribute('d')));
    region.addEventListener('blur', () => focusRing.removeAttribute('d'));
    region.addEventListener('click', () => select(region.dataset.place));
    region.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      select(region.dataset.place);
    });
  });

  // A small label follows the pointer over the map; a pin also shows it while focused or tapped.
  const showTip = (target, x, y) => {
    const isPin = target.classList.contains('map-pin');
    const name = isPin ? target.dataset.name : section.querySelector(`.region-label[data-place="${target.dataset.place}"]`).textContent;
    const note = document.createElement('small');
    note.textContent = isPin ? target.dataset.kind : target.classList.contains('is-target') ? 'Lokasi KKN, klik untuk memilih' : 'Kalurahan lain di Pakem';
    tip.replaceChildren(name, note);
    // Kept inside the card, so a long name near the edge is never cut off.
    const half = tip.offsetWidth / 2 + 4;
    tip.style.left = `${Math.min(Math.max(x, half), figure.clientWidth - half)}px`;
    tip.style.top = `${y}px`;
    tip.classList.add('is-shown');
  };
  const hideTip = () => tip.classList.remove('is-shown');
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hideTip(); });
  [...regions, ...pins].forEach(target => {
    target.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') return;
      const box = figure.getBoundingClientRect();
      showTip(target, event.clientX - box.left, event.clientY - box.top);
    });
    target.addEventListener('pointerleave', hideTip);
  });
  pins.forEach(pin => pin.addEventListener('animationend', event => { if (event.animationName === 'pin-drop') pin.classList.remove('is-dropping'); }));
  pins.forEach(pin => {
    const reveal = () => {
      const box = figure.getBoundingClientRect();
      const dot = pin.getBoundingClientRect();
      showTip(pin, dot.left + dot.width / 2 - box.left, dot.top - box.top);
    };
    pin.addEventListener('focus', reveal);
    pin.addEventListener('blur', hideTip);
    const selectable = () => placePanels.some(panel => panel.dataset.place === pin.dataset.place);
    pin.addEventListener('click', () => { if (selectable()) select(pin.dataset.place); reveal(); });
    pin.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      if (selectable()) select(pin.dataset.place);
      reveal();
    });
  });

  // The map card shows either the schematic map or Google's map in the same place; Google still loads only on request.
  const setView = name => {
    figure.dataset.view = name;
    switches.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mapview === name)));
    hideTip();
  };
  switches.forEach(button => button.addEventListener('click', () => setView(button.dataset.mapview)));
  gmap.querySelector('.gmap-load').addEventListener('click', () => loadMap().focus());
  // The in-panel button turns the card to Google's map on the chosen kalurahan, and brings the card into view if needed.
  section.querySelectorAll('.place-button.is-map').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    setView('google');
    loadMap().focus({ preventScroll: true });
    const box = figure.getBoundingClientRect();
    if (box.top < 70 || box.bottom > innerHeight) figure.scrollIntoView({ block: 'center', behavior: motionAllowed() ? 'smooth' : 'auto' });
  }));
  viewButtons.forEach(button => button.addEventListener('click', () => {
    view = button.dataset.view;
    viewButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    loadMap();
  }));
  select(placeTabs[0].dataset.place);
  const fromHash = () => { if (location.hash === '#peta-google') setView('google'); };
  fromHash();
  addEventListener('hashchange', fromHash);
})();

// Each word of the name shows its own meaning.
(() => {
  const words = [...document.querySelectorAll('.gloss-word')];
  const meanings = [...document.querySelectorAll('.gloss-meaning')];
  words.forEach(word => word.addEventListener('click', () => {
    words.forEach(item => item.setAttribute('aria-pressed', String(item === word)));
    meanings.forEach(meaning => {
      const on = meaning.dataset.word === word.dataset.word;
      meaning.hidden = !on;
      meaning.classList.remove('is-entering');
      if (on && motionAllowed()) {
        void meaning.offsetWidth;
        meaning.classList.add('is-entering');
      }
    });
  }));
})();
// Filosofi logo: a shape, its label, and its reading are one choice. The logo builds itself each time the dialog opens.
(() => {
  const stage = philosophyDialog.querySelector('.anatomy-stage');
  const order = ['utuh', 'matahari', 'gunung', 'huruf-p', 'daun'];
  const parts = [...stage.querySelectorAll('.part')];
  const leaders = [...stage.querySelectorAll('.anatomy-leaders g')];
  const labels = [...stage.querySelectorAll('.anatomy-label')];
  // The arrow buttons borrow each part's name from its label, so renaming a label renames them too.
  const names = { utuh: 'Utuh' };
  labels.forEach(label => { names[label.dataset.part] = label.lastChild.textContent.trim(); });
  const readings = [...philosophyDialog.querySelectorAll('.makna')];
  const dots = [...philosophyDialog.querySelectorAll('.anatomy-dots li')];
  const previous = philosophyDialog.querySelector('.anatomy-prev');
  const next = philosophyDialog.querySelector('.anatomy-next');
  const card = philosophyDialog.querySelector('.philosophy-card');
  const seen = new Set();
  let current = 'utuh';
  let readingAnimation;
  let assembly = [];

  // Any choice ends the opening animation at once, so nothing the visitor picks is still invisible or fading.
  const settle = () => { assembly.forEach(animation => animation.finish()); assembly = []; };

  function show(part) {
    settle();
    const from = order.indexOf(current);
    const to = order.indexOf(part);
    current = part;
    stage.dataset.active = part;
    if (part !== 'utuh') seen.add(part);
    parts.forEach(item => item.classList.toggle('is-active', item.dataset.part === part));
    leaders.forEach(item => item.classList.toggle('is-active', item.dataset.part === part));
    labels.forEach(item => item.setAttribute('aria-pressed', String(item.dataset.part === part)));
    readings.forEach(item => { item.hidden = item.dataset.part !== part; });
    dots.forEach(dot => {
      dot.classList.toggle('is-current', dot.dataset.part === part);
      dot.classList.toggle('is-seen', seen.has(dot.dataset.part));
    });
    if (to === 0 && document.activeElement === previous) next.focus({ preventScroll: true });
    previous.hidden = to === 0;
    const before = names[order[Math.max(0, to - 1)]];
    const after = to === 0 ? `Mulai dari ${names.matahari.toLowerCase()}` : to === order.length - 1 ? 'Lihat utuh' : names[order[to + 1]];
    previous.querySelector('.anatomy-prev-label').textContent = before;
    previous.setAttribute('aria-label', `Sebelumnya: ${before}`);
    next.querySelector('.anatomy-next-label').textContent = after;
    next.setAttribute('aria-label', to === 0 || to === order.length - 1 ? after : `Berikutnya: ${after}`);
    // On a tall phone the logo stays pinned above the text; keep the new reading in view below it.
    if (from !== to && getComputedStyle(stage).position === 'sticky') {
      const gap = readings[to].getBoundingClientRect().top - stage.getBoundingClientRect().bottom;
      if (gap < 0) card.scrollBy({ top: gap - 12, behavior: motionAllowed() ? 'smooth' : 'instant' });
    }
    readingAnimation?.cancel();
    if (from !== to && motionAllowed()) {
      const direction = to > from ? 1 : -1;
      readingAnimation = readings[to].animate([
        { opacity: 0, transform: `translateX(${direction * 18}px)` },
        { opacity: 1, transform: 'none' }
      ], { duration: 460, easing: 'cubic-bezier(.22,1,.36,1)' });
    }
  }
  const step = delta => show(order[(order.indexOf(current) + delta + order.length) % order.length]);

  const hover = (part, on) => {
    parts.concat(labels).forEach(item => { if (item.dataset.part === part) item.classList.toggle('is-hover', on); });
  };
  parts.forEach(item => {
    item.addEventListener('click', event => { event.stopPropagation(); show(item.dataset.part); });
    item.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') hover(item.dataset.part, true); });
    item.addEventListener('pointerleave', () => hover(item.dataset.part, false));
  });
  labels.forEach(label => {
    // Pressing the chosen label again goes back to the whole logo.
    label.addEventListener('click', () => show(label.getAttribute('aria-pressed') === 'true' ? 'utuh' : label.dataset.part));
    label.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') hover(label.dataset.part, true); });
    label.addEventListener('pointerleave', () => hover(label.dataset.part, false));
  });
  // A tap on the empty disc shows the whole logo again.
  stage.addEventListener('click', event => {
    if (!event.target.closest('.part, .anatomy-label')) show('utuh');
  });
  previous.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  philosophyDialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
  });

  function assemble() {
    assembly.forEach(animation => animation.cancel());
    assembly = [];
    if (!motionAllowed()) return;
    const body = part => stage.querySelector(`.part[data-part="${part}"] .part-body`);
    const play = (element, keyframes, delay, duration, easing = 'cubic-bezier(.22,1,.36,1)') => {
      assembly.push(element.animate(keyframes, { delay, duration, easing, fill: 'backwards' }));
    };
    play(body('gunung'), [{ opacity: 0, transform: 'translateY(120px)' }, { opacity: 1, transform: 'none' }], 120, 900);
    play(body('daun'), [{ opacity: 0, transform: 'scale(.35) rotate(-28deg)' }, { opacity: 1, transform: 'none' }], 520, 1000, 'cubic-bezier(.34,1.45,.64,1)');
    // The sun sits behind Merapi, so it rises from behind the slope.
    play(body('matahari'), [{ opacity: 0, transform: 'translateY(190px)' }, { opacity: 1, transform: 'none' }], 820, 1100);
    play(stage.querySelector('.part-p .part-line'), [
      { opacity: 1, strokeDashoffset: 1 },
      { opacity: 1, strokeDashoffset: 0, offset: .7 },
      { opacity: 0, strokeDashoffset: 0 }
    ], 1150, 1500, 'ease-in-out');
    play(stage.querySelector('.anatomy-leaders'), [{ opacity: 0 }, { opacity: 1 }], 1500, 600, 'ease-out');
    labels.forEach((label, i) => play(label, [{ opacity: 0, transform: 'translateY(8px) scale(.9)' }, { opacity: 1, transform: 'none' }], 1600 + i * 110, 520));
  }
  stage.addEventListener('focusin', settle);
  stage.addEventListener('pointerdown', settle);
  philosophyDialog.addEventListener('dialog-open', () => {
    show('utuh');
    assemble();
  });
  motionButton.addEventListener('click', () => {
    if (document.body.classList.contains('motion-paused')) assembly.forEach(animation => animation.finish());
  });
  show('utuh');
})();

// The Pakem figures show the two kalurahan inside them. Pointing at one lights it everywhere; choosing one opens it in Lokasi.
(() => {
  const section = document.querySelector('#pakem');
  const stats = section.querySelector('.pakem-stats');
  const tip = document.createElement('span');
  tip.className = 'stat-tip';
  tip.setAttribute('aria-hidden', 'true');
  section.append(tip);
  const map = document.querySelector('.pakem-map');
  const mini = stats.querySelector('.stat-map');
  mini.setAttribute('viewBox', map.getAttribute('viewBox'));
  map.querySelectorAll('.region').forEach((region, n) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'mini-region');
    path.setAttribute('d', region.getAttribute('d'));
    path.style.setProperty('--n', n);
    if (region.classList.contains('is-target')) {
      path.dataset.place = region.dataset.place;
      path.dataset.tip = region.getAttribute('aria-label').split(',')[0];
    }
    mini.append(path);
  });
  const light = place => { if (place) section.dataset.hl = place; else delete section.dataset.hl; };
  // The tip stays inside the page width, like the map's own tip.
  const showTip = target => {
    const box = target.getBoundingClientRect();
    const frame = section.getBoundingClientRect();
    tip.textContent = target.dataset.tip;
    const half = tip.offsetWidth / 2 + 6;
    tip.style.left = `${Math.min(Math.max(box.left + box.width / 2 - frame.left, half), frame.width - half)}px`;
    tip.style.top = `${box.bottom - frame.top}px`;
    tip.classList.add('is-visible');
  };
  const hideTip = () => { light(null); tip.classList.remove('is-visible'); };
  addEventListener('keydown', event => { if (event.key === 'Escape') hideTip(); });
  const open = (place, from) => {
    const tab = document.getElementById(`tab-${place}`);
    tab.click();
    if (from && from.tagName === 'BUTTON') tab.focus({ preventScroll: true });
    const stacked = matchMedia('(max-width: 900px)').matches;
    document.querySelector(stacked ? '#lokasi .places-panel' : '#lokasi .places').scrollIntoView({ block: 'start', behavior: motionAllowed() ? 'smooth' : 'instant' });
  };
  stats.querySelectorAll('[data-place]').forEach(piece => {
    piece.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse') return;
      light(piece.dataset.place);
      showTip(piece);
    });
    piece.addEventListener('pointerleave', hideTip);
    piece.addEventListener('click', () => open(piece.dataset.place));
  });
  section.querySelectorAll('.stats-legend button').forEach(button => {
    ['pointerenter', 'focus'].forEach(type => button.addEventListener(type, () => light(button.dataset.place)));
    ['pointerleave', 'blur'].forEach(type => button.addEventListener(type, () => light(null)));
    button.addEventListener('click', () => open(button.dataset.place, button));
  });
})();

// Senja di Pakem: the sun follows a sideways drag (or a tap by day) through the day. At night the fireflies
// come out; each one caught flies up as a star, and all six draw the sprig from the title.
// On phones the arc is mirrored, so the sun rises over Merapi and sets on the open side.
// Once the sixth star is caught, the whole page dims, the constellation lifts to the middle of the screen,
// waits for one more tap, and the stars write the wordmark large; closing it sends the name down into the scene.
(() => {
  const footer = document.querySelector('.site-footer');
  const scene = footer.querySelector('.senja');
  const sun = scene.querySelector('.senja-sun');
  const field = scene.querySelector('.senja-fireflies');
  const sky = scene.querySelector('.senja-constellation');
  const text = scene.querySelector('.senja-text');
  const liveText = scene.querySelector('.senja-live');
  const reset = scene.querySelector('.senja-reset');
  const narrow = matchMedia('(max-width: 599px)');
  // star positions inside the square constellation box: stem, then the leaves
  const SLOTS = [[8, 92], [40, 58], [88, 10], [12, 50], [42, 14], [88, 64]];
  const STOPS = [
    [0, '#e6ece0', '#f6d9ae', '#55704a', '#43603a', '#2f4a2a', .9],
    [.35, '#e6ece0', '#f1efdc', '#5a744c', '#46633c', '#2f4a2a', .45],
    [.75, '#e7e6d3', '#f5d7a3', '#46603e', '#384f33', '#2a4126', .75],
    [.95, '#d8c3c3', '#efa56d', '#35492f', '#2c3f29', '#243520', 1],
    [1.06, '#4a5878', '#cf8a6a', '#263830', '#213129', '#1d2b1f', .4],
    [1.2, '#111e33', '#263a50', '#1a2925', '#16231d', '#162019', 0]
  ];
  const MAX = 1.2;
  const NIGHT = 1.06;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const mix = (a, b, t) => `rgb(${rgb(a).map((v, i) => Math.round(v + (rgb(b)[i] - v) * t)).join(',')})`;
  const phase = p => (p < .2 ? 'Pagi' : p < .55 ? 'Siang' : p < .85 ? 'Sore' : p < NIGHT ? 'Senja' : 'Malam');
  let p = .8;
  let target = p;
  let frame = 0;
  let touched = false;
  let caught = 0;
  let night = 0;
  let message = '';
  let quietUntil = 0;
  const mark = scene.querySelector('.senja-mark');
  const markSprig = mark.querySelector('.mark-sprig');
  const swayGroup = mark.querySelector('.mark-sway');
  const lineEls = [...mark.querySelectorAll('.mark-line')];
  const words = [...mark.querySelectorAll('.mark-word')];
  const dot = mark.querySelector('.mark-dot');
  const leaners = [...words, dot];
  const glints = [...mark.querySelectorAll('.mark-glint')];
  const veil = scene.querySelector('.senja-veil');
  const bloomButton = scene.querySelector('.senja-bloom');
  const keepsake = scene.querySelector('.senja-keepsake');
  const linePath = sky.querySelector('path');
  // where each star lands on the drawn sprig (264 x 244 units), in SLOTS order: stem base, junction, stem tip, leaf 1, leaf 2, leaf 4
  const TIPS = [[6, 238], [112, 154], [258, 5], [62, 88], [111, 20], [258, 174]];
  const FOLDS = { 1: 50, 4: -45, 2: 40, 3: -20 };
  const EASE = 'cubic-bezier(.22,1,.36,1)', GLIDE = 'cubic-bezier(.65,0,.35,1)', WRITE = 'cubic-bezier(.45,0,.25,1)', SPRING = 'cubic-bezier(.34,1.56,.64,1)';
  const SIGNOFF = 'Matur nuwun sampun mampir. Sugeng dalu!';
  const FINALE = ['gather', 'await', 'bloom'];
  let stage = 'play'; // play, gather, await, bloom, mark
  let anims = [];
  let geo = null;
  let generation = 0;
  let holdTimer = 0, autoTimer = 0, glossTimer = 0;
  let bloomQueued = false, hurried = false, wasNight = false;
  const stats = { rounds: 0 };
  const resetStats = () => Object.assign(stats, { start: 0, moves: 0, sunsets: 0, keyCatches: 0, catches: [], trails: [], date: null, duration: 0, fastest: 0, sways: 0 });
  resetStats();
  keepsake.prepend(document.querySelector('#spark-icon').content.cloneNode(true));
  const inView = () => scene.classList.contains('is-inview') && !document.hidden;
  const live = () => anims.filter(a => a.playState === 'running' || a.playState === 'paused');
  const caughtFlies = () => [...field.children].filter(fly => fly.classList.contains('is-caught'));

  const isNight = () => p > NIGHT;
  // quiet updates change only what is seen, so screen readers are not told the same sign-off again
  function say(words, quiet = false) {
    if (words === message) return;
    message = words;
    text.textContent = words;
    if (!quiet) liveText.textContent = words;
  }
  function story() {
    const dark = isNight();
    if (stage === 'play') {
      if (dark) say(caught ? `Kunang-kunang tertangkap: ${caught} dari ${SLOTS.length}.` : `Kunang-kunang keluar: 0 dari ${SLOTS.length}.`);
      else say('Benamkan mataharinya di balik bukit.');
    }
    // one tab stop for the fireflies: the first one still flying, and only at night
    const flying = [...field.children].filter(fly => !fly.classList.contains('is-caught'));
    flying.forEach((fly, i) => { fly.tabIndex = dark && i === 0 ? 0 : -1; });
    field.setAttribute('aria-hidden', String(!(dark && flying.length)));
  }
  // where the sun sits for a time of day, in % of the scene: along the arc by day, then down behind the hills
  const sunPath = q => [narrow.matches ? 12 + 76 * q : 88 - 76 * q, q <= 1 ? 82 - 62 * Math.sin(Math.PI * q) : 82 + 140 * (q - 1)];
  function paint() {
    let i = STOPS.findIndex(stop => stop[0] > p);
    i = i === -1 ? STOPS.length - 1 : Math.max(1, i);
    const [a, b] = [STOPS[i - 1], STOPS[i]];
    const t = clamp((p - a[0]) / (b[0] - a[0]), 0, 1);
    ['--sky-top', '--sky-bottom', '--hill-back', '--hill-mid', '--hill-front'].forEach((name, k) => footer.style.setProperty(name, mix(a[k + 1], b[k + 1], t)));
    footer.style.setProperty('--glow', (a[6] + (b[6] - a[6]) * t).toFixed(2));
    night = clamp((p - .98) / .2, 0, 1);
    footer.style.setProperty('--night', night.toFixed(3));
    scene.classList.toggle('is-night', isNight());
    const dark = isNight();
    if (dark && !wasNight) stats.sunsets += 1;
    wasNight = dark;
    let [x, y] = free ? [free.x, free.y] : sunPath(p);
    // a sun focused from the keyboard stays on screen, so the focus ring never disappears below the hills
    if (sun.matches(':focus-visible')) { x = clamp(x, 6, 94); y = Math.min(y, 72); }
    sun.style.left = `${x}%`;
    sun.style.top = `${y}%`;
    // near the top edge the glow would be cut straight by the scene, so it fades out there
    sun.style.setProperty('--edge', clamp((y - 8) / 16, .2, 1).toFixed(2));
    sun.setAttribute('aria-valuenow', String(Math.round(p / MAX * 100)));
    sun.setAttribute('aria-valuetext', phase(p));
    story();
  }
  const tick = () => {
    p += (target - p) * .14;
    if (Math.abs(target - p) < .002) p = target;
    let moving = p !== target;
    if (free && goal) {
      if (goal.arc) [goal.x, goal.y] = sunPath(p);
      const k = goal.fast ? .45 : .2;
      free.x += (goal.x - free.x) * k;
      free.y += (goal.y - free.y) * k;
      if (Math.hypot(goal.x - free.x, goal.y - free.y) < .05) {
        free.x = goal.x;
        free.y = goal.y;
        if (goal.arc && p === target) toArc();
        else if (goal.arc) moving = true;
      } else moving = true;
    }
    paint();
    frame = moving ? requestAnimationFrame(tick) : 0;
  };
  function goTo(next) {
    target = clamp(next, 0, MAX);
    if (!motionAllowed()) { p = target; if (goal && goal.arc) toArc(); else if (free && goal) Object.assign(free, goal); paint(); return; }
    if (!frame) frame = requestAnimationFrame(tick);
  }
  // The sun can also be put anywhere in the sky (a drag or a tap). Then its time of day comes from how high it stands
  // over the hills right under it: high is midday, low is late afternoon, and with its middle behind the ridge it is night.
  // free is where it stands now (in % of the scene), goal is where it is going; keyboard and auto setting use the arc.
  let free = null, goal = null, pick = null, horizon = null;
  const hills = scene.querySelector('.senja-hills'), ridge = hills.querySelector('.hill-back');
  // the top of the hills at 49 points across the scene, in % of its height, read from the drawn ridge itself
  const measureHorizon = () => {
    const box = scene.getBoundingClientRect(), m = hills.getScreenCTM();
    if (!m || !box.width || !box.height) return null;
    const inv = m.inverse(), pt = hills.createSVGPoint(), out = [];
    for (let c = 0; c <= 48; c += 1) {
      pt.x = box.left + box.width * c / 48;
      let lo = box.top, hi = box.bottom + 1;
      for (let k = 0; k < 12; k += 1) {
        pt.y = (lo + hi) / 2;
        if (ridge.isPointInFill(pt.matrixTransform(inv))) hi = pt.y; else lo = pt.y;
      }
      out.push((hi - box.top) / box.height * 100);
    }
    return out;
  };
  const horizonAt = x => {
    horizon ||= measureHorizon();
    if (!horizon) return 82;
    const f = clamp(x, 0, 100) / 100 * 48, i = Math.min(47, Math.floor(f));
    return horizon[i] + (horizon[i + 1] - horizon[i]) * (f - i);
  };
  const timeAt = (x, y) => {
    const h = horizonAt(x);
    // the upper third of the sky reads as midday, then the light warms quickly as the sun nears the ridge
    if (y <= h) return 1 - .55 * Math.sqrt(clamp((h - y) / Math.max(1, h - 8), 0, 1));
    return 1 + .2 * clamp((y - h) / 10, 0, 1);
  };
  const toScene = (clientX, clientY) => {
    const box = scene.getBoundingClientRect();
    return [(clientX - box.left) / box.width * 100, (clientY - box.top) / box.height * 100];
  };
  // fast: a held sun follows the finger tightly; a tap or a pull glides there
  function place(x, y, fast = false) {
    x = clamp(x, 4, 96);
    y = clamp(y, (sun.offsetWidth / 2 + 3) / Math.max(1, scene.clientHeight) * 100, Math.min(horizonAt(x) + 16, 106));
    if (!free) { const [sx, sy] = sunPath(p); free = { x: sx, y: sy }; pick = { x: sx, y: sy, bias: p - timeAt(sx, sy) }; }
    goal = { x, y, fast };
    // a sun picked up from the arc keeps its sky: the difference to the free reading fades over the first stretch
    const fade = pick ? clamp(1 - Math.hypot(x - pick.x, y - pick.y) / 15, 0, 1) : 0;
    goTo(timeAt(x, y) + (pick ? pick.bias * fade : 0));
  }
  const toArc = () => { free = goal = pick = null; };
  // the clock for the recap starts at the first real touch, not when the sun only gets keyboard focus
  const touch = (clock = true) => { touched = true; if (clock && !stats.start) stats.start = performance.now(); scene.classList.add('is-touched'); };

  // A drag that starts on the sun moves it freely, held where it was picked up. A drag that starts anywhere else moves
  // the sun to the finger once it goes sideways, so vertical scrolling over the scene stays a scroll.
  let press = null;
  let dragged = false;
  scene.addEventListener('pointerdown', event => {
    if (event.target.closest('.firefly, .senja-reset, .senja-keepsake, .senja-bloom')) return;
    if (FINALE.includes(stage)) return;
    const onSun = stage === 'play' && !isNight() && !!event.target.closest('.senja-sun');
    const grab = onSun ? (() => { const q = sun.getBoundingClientRect(); return [q.left + q.width / 2 - event.clientX, q.top + q.height / 2 - event.clientY]; })() : [0, 0];
    press = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, dragging: false, sun: onSun, grab, slack: event.pointerType === 'mouse' ? 3 : onSun ? 4 : 8 };
    dragged = false;
  });
  scene.addEventListener('pointermove', event => {
    if (!press || press.id !== event.pointerId) return;
    if (!press.dragging) {
      const dx = Math.abs(event.clientX - press.x), dy = Math.abs(event.clientY - press.y);
      if (press.sun ? Math.hypot(dx, dy) < press.slack : dx < press.slack || dx < dy) return;
      press.dragging = dragged = true;
      scene.setPointerCapture(event.pointerId);
      scene.classList.add('is-dragging');
      touch();
      if (stage === 'mark') { if (motionAllowed()) stats.sways += 1; } else stats.moves += 1;
    }
    // after the finale the same gesture blows wind through the sprig instead of moving the sun
    if (stage === 'mark') { gust(clamp(event.clientX - press.lastX, -30, 30) * 1.4); press.lastX = event.clientX; return; }
    const vx = event.clientX + press.grab[0], vy = event.clientY + press.grab[1];
    if (press.sun && reach(vx, vy)) return;
    place(...toScene(vx, vy), press.sun);
  });
  const release = event => {
    if (!press || press.id !== event.pointerId) return;
    press = null;
    scene.classList.remove('is-dragging');
    letGo();
  };
  scene.addEventListener('pointerup', release);
  scene.addEventListener('pointercancel', release);
  // A real tap by day sends the sun there. Browsers drop the click when a tap only stops a scroll.
  // During the finale a tap moves the show along instead; the bloom button's own clicks bubble here too.
  scene.addEventListener('click', event => {
    if (FINALE.includes(stage)) {
      if (performance.now() < quietUntil || event.target.closest('.firefly, .senja-reset')) return;
      advance();
      return;
    }
    if (dragged || isNight() || performance.now() < quietUntil) return;
    if (event.target.closest('.firefly, .senja-reset, .senja-sun')) return;
    touch();
    stats.moves += 1;
    place(...toScene(event.clientX, event.clientY));
  });
  sun.addEventListener('keydown', event => {
    const step = { ArrowRight: .05, ArrowUp: .05, ArrowLeft: -.05, ArrowDown: -.05, PageUp: .2, PageDown: -.2 }[event.key];
    if (step === undefined && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    touch();
    if (!event.repeat) stats.moves += 1;
    // a sun put by hand glides back onto the arc instead of jumping there
    if (free) { goal = { x: free.x, y: free.y, arc: true }; pick = null; }
    goTo(event.key === 'Home' ? 0 : event.key === 'End' ? MAX : target + step);
  });
  sun.addEventListener('focus', () => { touch(false); paint(); });
  sun.addEventListener('blur', paint);
  narrow.addEventListener('change', paint);

  // The sun can also be carried up out of the scene into the sponsor panel just above it: the panel draws it in and the
  // thanks to the sponsors play (Panggung sponsor, below). On the way, a sun held against the scene's top or side edges
  // makes the panel light up along its edges and call from its bottom edge, more the harder it is pushed, and a sun pushed
  // up past the top leans toward the panel. The panel takes the sun as soon as the sun touches it from below, but a quick
  // flick off the sun is not a carry: then the finger has to stay there until the sun has been held for a moment.
  const sponsorPanel = document.querySelector('#sponsor .sponsor-night');
  const stageModal = document.querySelector('.sponsor-stage');
  const HOLD = 260;
  let aura = null, call = null, auraK = 0, lean = 0, pressedAt = 0, waitTimer = 0;
  scene.addEventListener('pointerdown', () => { pressedAt = performance.now(); });
  function glow(k, x = 0, pull = 0) {
    if (!sponsorPanel) return;
    // the held sun stretches a little toward the panel while it is pushed up past the top of the scene
    lean = motionAllowed() ? pull : 0;
    sun.style.scale = lean ? `${(1 - .07 * lean).toFixed(3)} ${(1 + .1 * lean).toFixed(3)}` : '';
    if (!k && !auraK) return;
    if (!aura) {
      aura = document.createElement('span');
      call = document.createElement('span');
      aura.className = 'sponsor-aura';
      call.className = 'sponsor-call';
      aura.setAttribute('aria-hidden', 'true');
      call.setAttribute('aria-hidden', 'true');
      sponsorPanel.after(aura);
      sponsorPanel.append(call);
    }
    if (k && !auraK) {
      // the panel's own box in its section (its reveal shift is long over); read once per push
      const { offsetLeft: left, offsetTop: top, offsetWidth: width, offsetHeight: height } = sponsorPanel;
      Object.assign(aura.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`, borderRadius: getComputedStyle(sponsorPanel).borderRadius });
    }
    if (k) call.style.translate = `${x.toFixed(1)}px 0`;
    if (Math.abs(k - auraK) < .01 && k) return;
    auraK = k;
    aura.style.opacity = k.toFixed(3);
    call.style.opacity = Math.min(1, k * 1.15).toFixed(3);
    sponsorPanel.parentElement.classList.toggle('is-calling', k > 0);
  }
  // the finger lifts (or the sun is given): the clue fades and a waiting flick is dropped
  function letGo() {
    clearTimeout(waitTimer);
    waitTimer = 0;
    glow(0);
  }
  const ready = () => stage === 'play' && !isNight() && !document.querySelector('dialog[open]') && typeof stageModal.showModal === 'function';
  // vx, vy: where the held sun would stand (its centre on screen) if the scene did not keep it inside
  function reach(vx, vy) {
    if (!sponsorPanel || !stageModal) return false;
    const P = sponsorPanel.getBoundingClientRect();
    if (!P.width) return false;
    const r = sun.offsetWidth / 2, box = scene.getBoundingClientRect(), roof = box.top + r + 3;
    // under the panel and touching it (or inside it), with the panel at least partly on screen
    const inside = vx >= P.left && vx <= P.right && vy - r <= P.bottom && vy >= Math.max(0, P.top) && P.bottom > 0 && P.top < innerHeight;
    if (inside && ready()) {
      const wait = pressedAt + HOLD - performance.now();
      if (wait <= 0) {
        give(vx, vy, P);
        return true;
      }
      press.want = [vx, vy];
      if (!waitTimer) {
        const held = press;
        waitTimer = setTimeout(() => {
          waitTimer = 0;
          if (press === held && held.want) reach(...held.want);
        }, wait + 5);
      }
    } else press.want = null;
    const up = roof - vy, side = Math.max(box.left + box.width * .04 - vx, vx - box.left - box.width * .96);
    const near = up > 0 ? clamp(up / Math.max(40, roof - P.bottom - r), 0, 1) : 0;
    const k = Math.max(up > 0 ? .3 + .7 * near : 0, side > 0 ? .3 + .7 * clamp(side / 36, 0, 1) : 0);
    glow(k, clamp(vx - P.left, 40, P.width - 40), near);
    return false;
  }
  // the sun leaves the scene: the stage takes it from where it stands now and draws it a little way into the panel
  function give(vx, vy, P) {
    const id = press.id, stretch = lean;
    press = null;
    try { scene.releasePointerCapture(id); } catch { /* already released */ }
    scene.classList.remove('is-dragging');
    letGo();
    const from = sun.getBoundingClientRect(), size = sun.offsetWidth;
    const at = [clamp(vx, P.left + 36, P.right - 36), clamp(Math.min(vy, P.bottom) - Math.min(120, innerHeight * .14), Math.max(0, P.top) + 36, Math.min(P.bottom, innerHeight) - 30)];
    scene.classList.add('is-given');
    scene.dispatchEvent(new CustomEvent('senja-sponsor', { detail: { from, size, lean: stretch, at, panel: P } }));
    if (!stageModal.open) scene.classList.remove('is-given');
  }
  // Back from the stage: the sun stands high in the sky again, and the game is as it was. keep: it is only put there,
  // still hidden, while the stage flies its light back down; pop: it springs into place by itself.
  scene.addEventListener('senja-sunrise', event => {
    const { keep = false, pop = false } = event.detail || {};
    cancelAnimationFrame(frame);
    frame = 0;
    toArc();
    p = target = .45;
    quietUntil = performance.now() + 450;
    paint();
    if (keep) return;
    scene.classList.remove('is-given');
    if (pop && motionAllowed() && scene.classList.contains('is-inview')) sun.animate([{ transform: 'scale(.2)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 750, easing: SPRING });
  });

  function spawn() {
    field.replaceChildren(...SLOTS.map(() => {
      const fly = document.createElement('button');
      fly.type = 'button';
      fly.className = 'firefly';
      fly.tabIndex = -1;
      fly.setAttribute('aria-label', 'Tangkap kunang-kunang');
      fly.style.left = `${10 + Math.random() * 80}%`;
      fly.style.top = `${52 + Math.random() * 26}%`;
      fly.style.setProperty('--dx', `${(Math.random() < .5 ? -1 : 1) * (10 + Math.random() * 16)}px`);
      fly.style.setProperty('--dy', `${8 + Math.random() * 12}px`);
      fly.style.setProperty('--dur', `${5 + Math.random() * 4}s`);
      fly.style.setProperty('--delay', `${-Math.random() * 6}s`);
      fly.append(document.createElement('span'));
      return fly;
    }));
  }
  field.addEventListener('click', event => {
    const fly = event.target.closest('.firefly');
    if (!fly || fly.classList.contains('is-caught') || !isNight() || stage !== 'play') return;
    touch();
    quietUntil = performance.now() + 450;
    const slot = caught;
    const [sx, sy] = SLOTS[slot];
    caught += 1;
    // fly from where the drifting dot is now to its star in the sprig
    const box = sky.getBoundingClientRect(), area = scene.getBoundingClientRect(), here = fly.getBoundingClientRect();
    const now = performance.now();
    stats.catches.push(now);
    if (event.detail === 0) stats.keyCatches += 1;
    fly.style.translate = getComputedStyle(fly).translate;
    fly.classList.add('is-caught');
    fly.tabIndex = -1;
    fly.setAttribute('aria-hidden', 'true');
    fly.dataset.slot = String(slot);
    const to = [(box.left - area.left + box.width * sx / 100) / area.width * 100, (box.top - area.top + box.height * sy / 100) / area.height * 100];
    stats.trails[slot] = { from: [(here.left + here.width / 2 - box.left) / box.width * 100, (here.top + here.height / 2 - box.top) / box.height * 100], to: SLOTS[slot].slice() };
    fly.style.left = `${to[0]}%`;
    fly.style.top = `${to[1]}%`;
    requestAnimationFrame(() => { fly.style.translate = '0px 0px'; });
    if (caught === SLOTS.length) {
      scene.classList.add('is-complete');
      complete(now);
    }
    story();
    if (document.activeElement === fly || document.activeElement === document.body) {
      const next = [...field.children].find(item => !item.classList.contains('is-caught'));
      if (next) next.focus({ preventScroll: true });
      else fly.blur();
    }
  });

  function complete(now) {
    const c = stats.catches;
    stats.rounds += 1;
    stats.duration = now - (stats.start || c[0]);
    stats.fastest = Math.min(...c.slice(1).map((t, i) => t - c[i]));
    stats.date = new Date();
    stats.sways = 0;
    startFinale();
  }
  // re-aim every caught star at its slot in the box as it is laid out now (e.g. after a rotation mid-game)
  function snapStars() {
    const box = sky.getBoundingClientRect(), area = scene.getBoundingClientRect();
    caughtFlies().forEach(fly => {
      const [sx, sy] = SLOTS[fly.dataset.slot];
      fly.style.left = `${(box.left - area.left + box.width * sx / 100) / area.width * 100}%`;
      fly.style.top = `${(box.top - area.top + box.height * sy / 100) / area.height * 100}%`;
    });
  }
  // The finale is an easter egg over the whole page: the screen dims, the constellation lifts out of the scene
  // to the middle, waits for one more tap, and the stars write the wordmark large. "Kilas balik" opens the recap;
  // closing it sends the name back down into the night scene.
  const egg = document.querySelector('.senja-egg');
  const eggSky = egg.querySelector('.egg-sky');
  const eggLine = eggSky.querySelector('path');
  const eggStars = [...eggSky.querySelectorAll('.egg-star')];
  const eggHalo = egg.querySelector('.egg-halo');
  const eggMark = egg.querySelector('.egg-mark');
  const eggSprig = eggMark.querySelector('.mark-sprig');
  const eggLines = [...eggMark.querySelectorAll('.mark-line')];
  const eggDot = eggMark.querySelector('.mark-dot');
  const eggGlints = [...eggMark.querySelectorAll('.mark-glint')];
  const eggHint = egg.querySelector('.egg-hint');
  const eggActions = egg.querySelector('.egg-actions');
  const eggKilas = egg.querySelector('.egg-kilas');
  eggKilas.prepend(document.querySelector('#spark-icon').content.cloneNode(true));
  // a tap on a word, a tap on the sprig and the wind all work on a face: the small name in the scene or the large one here
  const sceneFace = { mark, sway: swayGroup, leaners, glints };
  const eggFace = { mark: eggMark, sway: eggMark.querySelector('.mark-sway'), leaners: [...eggMark.querySelectorAll('.mark-word'), eggDot], glints: eggGlints, egg: true };
  let eggPress = null, eggSwiped = false;
  const step = name => { egg.dataset.step = name; };
  let wantKilas = false, doneAt = 0;
  const hint = words => { eggHint.textContent = words; };
  const run = (set, el, keyframes, delay, duration, easing = EASE, fill = 'backwards') => {
    const a = el.animate(keyframes, { delay, duration, easing, fill });
    anims.push(a);
    set.push(a);
    return a;
  };
  // one layout read; the large name is already laid out in the middle while it is still invisible
  function measure() {
    const box = eggSky.getBoundingClientRect(), R = eggSprig.getBoundingClientRect(), M = eggMark.getBoundingClientRect();
    const cx = M.left + M.width / 2, cy = M.top + M.height / 2;
    const H = Math.min(innerHeight * .36, innerWidth * .6), S = H / R.height, W = R.width * S;
    const O = [R.left + R.width * .019, R.top + R.height * .975], c = [R.left + R.width / 2, R.top + R.height / 2];
    geo = {
      box, W, H, left: cx - W / 2, top: cy - H / 2,
      sprigT: `translate(${(cx - O[0] - S * (c[0] - O[0])).toFixed(2)}px,${(cy - O[1] - S * (c[1] - O[1])).toFixed(2)}px) scale(${S.toFixed(4)})`
    };
    egg.style.setProperty('--stage-x', `${cx.toFixed(1)}px`);
    egg.style.setProperty('--stage-y', `${cy.toFixed(1)}px`);
    egg.style.setProperty('--stage-w', `${W.toFixed(1)}px`);
  }
  function startFinale() {
    const id = ++generation;
    stage = 'gather';
    scene.dataset.finale = 'gather';
    sun.tabIndex = -1;
    sun.setAttribute('aria-hidden', 'true');
    snapStars();
    say('Enam bintang lengkap.');
    // the sixth star lands in the scene first, then the screen dims
    holdTimer = setTimeout(() => { if (id === generation) openEgg(id); }, motionAllowed() ? 1500 : 400);
  }
  function openEgg(id) {
    // another dialog is open (or the browser has no dialogs): the finale simply ends in the scene
    // so does a visitor who scrolled away during the hold: the name waits in the scene for their return
    if (document.querySelector('dialog[open]') || typeof egg.showModal !== 'function' || !scene.classList.contains('is-inview')) { endFinale(); return; }
    const box = sky.getBoundingClientRect();
    Object.assign(eggSky.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
    eggActions.hidden = true;
    hint('');
    eggHint.style.top = '';
    step('gather');
    egg.showModal();
    document.documentElement.classList.add('egg-open');
    document.body.classList.add('egg-open');
    scene.classList.add('is-egg');
    if (!motionAllowed()) { finishEgg(); return; }
    measure();
    const set = [], phone = narrow.matches, A0 = 350, DA = phone ? 1200 : 1350;
    const { left, top, W, H } = geo;
    eggStars.forEach((star, i) => run(set, star, [{ transform: 'scale(1)' }, { transform: 'scale(1.9)', offset: .4 }, { transform: 'scale(1)' }], 120 + i * 40, 420, 'ease-in-out', 'none'));
    run(set, eggSky, [{ transform: 'translate(0px,0px) scale(1,1)' }, { transform: `translate(${left - box.left}px,${top - box.top}px) scale(${W / box.width},${H / box.height})` }], A0, DA, GLIDE, 'forwards');
    run(set, eggHalo, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: .6, transform: 'none' }], A0 + DA / 2, DA / 2 + 300, 'ease-out', 'forwards');
    if (document.hidden) set.forEach(a => a.pause());
    Promise.all(set.map(a => a.finished)).then(() => { if (id === generation && stage === 'gather') toAwait(); }, () => {});
  }
  function toAwait() {
    stage = 'await';
    scene.dataset.finale = 'await';
    step('await');
    if (bloomQueued) { bloom(); return; }
    armAuto();
  }
  // with no tap, the constellation lights itself, but only while someone can see it
  function armAuto() {
    clearTimeout(autoTimer);
    if (stage === 'await' && !document.hidden) autoTimer = setTimeout(() => { if (stage === 'await') bloom(); }, 2600);
  }
  // a tap while the stars glide speeds them up; a tap in the bloom speeds it up, and a second one finishes it
  function advance() {
    if (stage === 'gather' && !egg.open) return; // the hold before the egg opens
    if (!motionAllowed()) { finishEgg(); return; }
    if (stage === 'gather') {
      if (!bloomQueued) { bloomQueued = true; live().forEach(a => a.updatePlaybackRate(4)); }
      return;
    }
    if (stage === 'await') { bloom(); return; }
    if (hurried) { finishEgg(); return; }
    hurried = true;
    live().forEach(a => a.updatePlaybackRate(3));
  }
  function bloom() {
    if (stage !== 'await') return;
    clearTimeout(autoTimer);
    const id = generation;
    stage = 'bloom';
    scene.dataset.finale = 'bloom';
    step('bloom');
    hurried = false;
    hint('');
    if (!motionAllowed()) { finishEgg(); return; }
    const set = [], phone = narrow.matches, C0 = phone ? 1350 : 1500, FLY = phone ? 900 : 1000;
    const { box } = geo;
    // each star steps onto the tip of its leaf (the box already has the sprig's shape), then hands its light to a glint
    eggStars.forEach((star, i) => {
      const dx = (TIPS[i][0] / 264 - SLOTS[i][0] / 100) * box.width, dy = (TIPS[i][1] / 244 - SLOTS[i][1] / 100) * box.height;
      run(set, star, [{ transform: 'translate(0px,0px)' }, { transform: `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px)` }], 0, 500, EASE, 'forwards');
      run(set, star, [{ opacity: 1 }, { opacity: 0 }], 520 + i * 60, 320, 'ease-out', 'forwards');
    });
    run(set, eggLine, [{ opacity: .85 }, { opacity: 0 }], 0, 500, 'ease-out', 'forwards');
    run(set, eggHalo, [{ opacity: .6, transform: 'none' }, { opacity: 1, transform: 'scale(1.12)', offset: .3 }, { opacity: 0, transform: 'scale(1.2)' }], 0, C0 + 900, 'ease-out', 'forwards');
    run(set, eggMark.querySelector('.mark-stem'), [{ transform: 'scale(0)' }, { transform: 'none' }], 0, 600);
    [[1, 150], [4, 250], [2, 350], [3, 450]].forEach(([n, d]) => run(set, eggMark.querySelector(`.mark-leaf-${n}`), [{ transform: `rotate(${FOLDS[n]}deg) scale(0)` }, { transform: 'none' }], d, 700, SPRING));
    eggGlints.forEach((g, i) => run(set, g, [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1.6)', offset: .5 }, { opacity: 1, transform: 'none' }], 420 + i * 70, 420, 'ease-out'));
    // the sprig flies into its place beside Tentrem while a star writes the name
    run(set, eggSprig, [{ transform: geo.sprigT }, { transform: 'translate(0px,0px) scale(1)' }], C0, FLY, GLIDE);
    eggLines.forEach((line, k) => {
      const wipe = line.querySelector('.mark-wipe'), pen = line.querySelector('.mark-pen'), start = C0 + (k ? 650 : 100);
      const from = wipe.offsetLeft, to = from + wipe.offsetWidth; // offsets ignore transforms; the offset parent is .mark-line
      run(set, wipe, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], start, 700, WRITE);
      run(set, pen, [{ transform: `translateX(${from}px)`, opacity: 0 }, { opacity: 1, offset: .12 }, { opacity: 1, offset: .85 }, { transform: `translateX(${to}px)`, opacity: 0 }], start, 700, WRITE, 'none');
    });
    run(set, eggDot, [{ opacity: 0, transform: 'translateY(-1.1em) scale(.5)' }, { opacity: 1, transform: 'translateY(.06em) scale(1.2,.85)', offset: .55 }, { opacity: 1, transform: 'translateY(-.04em) scale(.95,1.05)', offset: .8 }, { opacity: 1, transform: 'none' }], C0 + 1250, 750);
    Promise.all(set.map(a => a.finished)).then(() => { if (id === generation && stage === 'bloom') finishEgg(); }, () => {});
  }
  // the name stands written in the middle; the scene behind already holds its own end state for later
  function finishEgg() {
    if (FINALE.includes(stage)) endFinale();
    if (!egg.open) return;
    step('done');
    doneAt = performance.now();
    hint('');
    eggActions.hidden = false;
    eggKilas.focus({ preventScroll: true });
  }
  // the page is scroll-locked under the egg, so a rotation can leave the scene off screen; bring it back
  function bringScene() {
    const r = mark.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight) mark.scrollIntoView({ block: 'center', behavior: 'instant' });
  }
  function closeEgg(toKilas = false) {
    if (!egg.open || egg.classList.contains('is-closing')) return;
    if (FINALE.includes(stage)) endFinale();
    wantKilas = toKilas;
    const done = () => { if (egg.open) egg.close(); };
    if (toKilas || !motionAllowed()) { done(); return; }
    // the large name shrinks back down into its place in the night scene
    bringScene();
    const from = eggMark.getBoundingClientRect(), to = mark.getBoundingClientRect();
    const k = to.width / Math.max(1, from.width);
    egg.classList.add('is-closing');
    eggMark.animate([{ transform: 'none' }, { transform: `translate(${(to.left + to.width / 2 - from.left - from.width / 2).toFixed(1)}px,${(to.top + to.height / 2 - from.top - from.height / 2).toFixed(1)}px) scale(${k.toFixed(4)})` }], { duration: 700, easing: GLIDE, fill: 'forwards' })
      .finished.then(done, done);
  }
  egg.addEventListener('click', event => {
    if (event.target.closest('button')) return;
    // during the show any tap moves it along
    if (FINALE.includes(stage)) { advance(); return; }
    if (eggSwiped) { eggSwiped = false; return; } // that was wind, not a tap
    // afterwards the name plays as in the scene: a word hops and says what it means, anything else rings the stars
    if (event.target.closest('.egg-mark')) {
      const word = event.target.closest('.mark-word');
      if (word) poke(word, eggFace);
      else ring(eggFace);
      return;
    }
    // a tap in the dark closes it, but not in the first second, when it is more likely a late one meant to hurry the show
    if (performance.now() - doneAt > 1000 && !event.target.closest('.egg-actions')) closeEgg();
  });
  // a sideways swipe over the written name is wind, as in the scene
  egg.addEventListener('pointerdown', event => {
    eggSwiped = false;
    eggPress = stage === 'mark' && !egg.classList.contains('is-closing') && !event.target.closest('button') ? { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, on: false } : null;
  });
  egg.addEventListener('pointermove', event => {
    if (!eggPress || eggPress.id !== event.pointerId) return;
    if (!eggPress.on) {
      const dx = Math.abs(event.clientX - eggPress.x), dy = Math.abs(event.clientY - eggPress.y);
      if (dx < 8 || dx < dy) return;
      eggPress.on = eggSwiped = true;
      if (motionAllowed()) stats.sways += 1;
    }
    gust(clamp(event.clientX - eggPress.lastX, -30, 30) * 1.4, eggFace);
    eggPress.lastX = event.clientX;
  });
  const eggRelease = event => { if (eggPress && eggPress.id === event.pointerId) eggPress = null; };
  egg.addEventListener('pointerup', eggRelease);
  egg.addEventListener('pointercancel', eggRelease);
  egg.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && FINALE.includes(stage) && !event.target.closest('button')) {
      event.preventDefault();
      advance();
    }
    // the arrow keys blow wind through the written name, as on the scene's words
    const push = { ArrowRight: 70, ArrowLeft: -70 }[event.key];
    if (push !== undefined && stage === 'mark' && !egg.classList.contains('is-closing')) {
      event.preventDefault();
      if (motionAllowed()) stats.sways += 1;
      gust(push, eggFace);
    }
  });
  // Escape skips to the written name first, and closes on the second press
  egg.addEventListener('cancel', event => {
    if (!event.cancelable) return; // the browser closes it anyway; the close event tidies up
    event.preventDefault();
    if (FINALE.includes(stage)) finishEgg();
    else closeEgg();
  });
  eggKilas.addEventListener('click', () => closeEgg(true));
  egg.addEventListener('close', () => {
    const toKilas = wantKilas;
    wantKilas = false;
    egg.classList.remove('is-closing');
    eggMark.getAnimations().forEach(a => a.cancel());
    if (wind.face === eggFace) stopWind();
    eggMark.classList.remove('is-bright');
    hint('');
    eggHint.style.top = '';
    eggPress = null;
    document.documentElement.classList.remove('egg-open');
    document.body.classList.remove('egg-open');
    scene.classList.remove('is-egg');
    if (FINALE.includes(stage)) endFinale();
    if (stage !== 'mark') return; // a restart closed it
    bringScene();
    if (toKilas) { keepsake.click(); return; }
    if (!keepsake.hidden) keepsake.focus({ preventScroll: true });
    // the sign-off was written while the caption was hidden under the egg; say it now that it shows
    setTimeout(() => { if (stage === 'mark' && !egg.open && message === SIGNOFF && liveText.textContent !== SIGNOFF) liveText.textContent = SIGNOFF; }, 150);
  });
  addEventListener('resize', () => { if (egg.open && FINALE.includes(stage)) finishEgg(); });
  function endFinale() {
    if (!FINALE.includes(stage)) return;
    clearTimeout(holdTimer);
    clearTimeout(autoTimer);
    anims.forEach(a => a.cancel()); // CSS now holds the same end state, with no transforms left
    anims = [];
    bloomQueued = hurried = false;
    stage = 'mark';
    scene.dataset.finale = 'mark';
    mark.inert = false;
    keepsake.hidden = false;
    if (!egg.open && (document.activeElement === bloomButton || document.activeElement === document.body)) keepsake.focus({ preventScroll: true });
    bloomButton.hidden = true; // only after focus has moved
    say(SIGNOFF, egg.open);
    scene.dispatchEvent(new CustomEvent('senja-done', { detail: stats }));
  }

  function clearFinale() {
    generation += 1;
    clearTimeout(holdTimer);
    clearTimeout(autoTimer);
    clearTimeout(glossTimer);
    bloomQueued = hurried = false;
    anims.forEach(a => a.cancel());
    anims = [];
    stopWind();
    mark.inert = true;
    mark.classList.remove('is-bright');
    keepsake.hidden = true;
    bloomButton.hidden = true;
    sun.tabIndex = 0;
    sun.removeAttribute('aria-hidden');
    wantKilas = false;
    if (egg.open) egg.close();
    egg.classList.remove('is-closing');
    eggMark.getAnimations().forEach(a => a.cancel());
    document.documentElement.classList.remove('egg-open');
    document.body.classList.remove('egg-open');
    scene.classList.remove('is-egg');
    stage = 'play';
  }
  // the leaves fold away and the name fades while the sun comes up
  function fold(id) {
    const set = [
      mark.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 520, easing: 'ease-in', fill: 'forwards' }),
      veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, easing: 'ease', fill: 'forwards' }),
      ...[3, 2, 4, 1].map((n, i) => mark.querySelector(`.mark-leaf-${n}`).animate([{ transform: 'none' }, { transform: `rotate(${FOLDS[n]}deg) scale(0)` }], { duration: 380, delay: i * 50, easing: 'cubic-bezier(.55,0,.75,.2)', fill: 'forwards' }))
    ];
    anims = set;
    Promise.all(set.map(a => a.finished)).then(() => {
      if (id !== generation) return;
      delete scene.dataset.finale;
      set.forEach(a => a.cancel());
      anims = [];
    }, () => {});
  }
  function restart(focusSun) {
    const fromMark = stage === 'mark';
    clearFinale();
    if (fromMark && motionAllowed()) fold(generation);
    else delete scene.dataset.finale;
    quietUntil = performance.now() + 450;
    caught = 0;
    // the box returns to its corner unseen, so skip the lines' slow fade once
    linePath.style.transition = 'none';
    scene.classList.remove('is-complete');
    getComputedStyle(linePath).opacity;
    requestAnimationFrame(() => { linePath.style.transition = ''; });
    reset.hidden = true;
    resetStats();
    spawn();
    touch();
    toArc();
    goTo(.3);
    if (focusSun) sun.focus({ preventScroll: true });
  }
  reset.addEventListener('click', event => restart(event.detail === 0));
  scene.addEventListener('senja-restart', () => restart(true));

  // After the finale, a sideways swipe is wind: a damped spring sways the sprig, and the words lean a few frames late.
  const wind = { angle: 0, speed: 0, frame: 0, last: 0, trail: [], face: null };
  function gust(push, face = sceneFace) {
    if (!motionAllowed() || stage !== 'mark') return;
    if (wind.face && wind.face !== face) stopWind();
    wind.face = face;
    wind.speed += push;
    if (!wind.frame) { wind.last = performance.now(); wind.frame = requestAnimationFrame(blow); }
  }
  function blow(now) {
    const dt = Math.max(0, Math.min(.05, (now - wind.last) / 1000));
    wind.last = now;
    wind.speed += (-60 * wind.angle - 6 * wind.speed) * dt;
    wind.angle = clamp(wind.angle + wind.speed * dt, -14, 14);
    wind.trail.unshift(wind.angle);
    wind.trail.length = Math.min(wind.trail.length, 16);
    wind.face.sway.style.transform = `rotate(${wind.angle.toFixed(2)}deg)`;
    wind.face.leaners.forEach((el, i) => {
      const lean = wind.trail[Math.min(wind.trail.length - 1, 2 + i * 3)];
      el.style.transform = `skewX(${(-lean * .35).toFixed(2)}deg)`;
    });
    if (Math.abs(wind.angle) < .03 && Math.abs(wind.speed) < .3) { stopWind(); return; }
    wind.frame = requestAnimationFrame(blow);
  }
  function stopWind() {
    cancelAnimationFrame(wind.frame);
    const face = wind.face || sceneFace;
    Object.assign(wind, { angle: 0, speed: 0, frame: 0, trail: [], face: null });
    face.sway.style.transform = '';
    face.leaners.forEach(el => { el.style.transform = ''; });
  }
  // the site's own spark burst, as on the title
  function spark(el, host = document.body) {
    const rect = el.getBoundingClientRect(), s = document.createElement('span');
    s.className = 'spark';
    s.setAttribute('aria-hidden', 'true');
    s.append(document.querySelector('#spark-icon').content.cloneNode(true));
    s.style.left = `${rect.left + rect.width / 2 - 9}px`;
    s.style.top = `${rect.top}px`;
    s.style.setProperty('--dx', `${Math.round((Math.random() - .5) * 24)}px`);
    s.style.setProperty('--dy', '-30px');
    host.append(s);
    setTimeout(() => s.remove(), 900);
  }
  // a tapped word hops and its meaning, read from the name gloss in the Pakem section, shows in the caption
  // (in the egg, just above the large name)
  function poke(word, face = sceneFace) {
    if (motionAllowed()) stats.sways += 1;
    const gloss = document.querySelector(`.gloss-meaning[data-word="${word.dataset.word}"]`);
    if (gloss) {
      const line = gloss.textContent.replace(/\s+/g, ' ').trim(), meaning = line.charAt(0).toUpperCase() + line.slice(1);
      clearTimeout(glossTimer);
      if (face.egg) {
        hint(meaning);
        eggHint.style.top = `${Math.round(eggMark.getBoundingClientRect().top - 14)}px`;
        glossTimer = setTimeout(() => hint(''), 4200);
      } else {
        say(meaning);
        glossTimer = setTimeout(() => { if (stage === 'mark') say(SIGNOFF, true); }, 4200);
      }
    }
    if (!motionAllowed()) return;
    word.animate([{ transform: 'none' }, { transform: 'translateY(-.16em)', offset: .32 }, { transform: 'translateY(.03em) scaleY(.96)', offset: .62 }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.3,.7,.4,1)' });
    spark(word, face.egg ? egg : document.body);
    gust(word.dataset.word === 'pakem' ? -26 : 26, face);
  }
  // tapping the sprig or the period rings its six stars
  function ring(face = sceneFace) {
    if (motionAllowed()) stats.sways += 1;
    if (!motionAllowed()) { face.mark.classList.toggle('is-bright'); return; }
    [0, 1, 3, 4, 5, 2].forEach((n, i) => face.glints[n].animate([{ transform: 'none' }, { transform: 'scale(2.4)', offset: .35 }, { transform: 'none' }], { duration: 560, delay: i * 90, easing: 'ease-out' }));
    gust(60, face);
  }
  mark.addEventListener('click', event => {
    if (stage !== 'mark' || (dragged && event.detail !== 0)) return;
    const word = event.target.closest('.mark-word');
    if (word) poke(word);
    else ring();
  });
  mark.addEventListener('keydown', event => {
    const push = { ArrowRight: 70, ArrowLeft: -70 }[event.key];
    if (push === undefined || stage !== 'mark' || !event.target.closest('.mark-word')) return;
    event.preventDefault();
    if (motionAllowed()) stats.sways += 1;
    gust(push);
  });

  // Nothing plays unseen: animations pause off screen or in a hidden tab and resume on return.
  const pauseOrPlay = () => {
    const on = egg.open ? !document.hidden : inView();
    anims.forEach(a => {
      if (!on && a.playState === 'running') a.pause();
      else if (on && a.playState === 'paused') a.play(); // never play() a finished animation
    });
    if (on) armAuto();
    else { clearTimeout(autoTimer); stopWind(); }
  };
  document.addEventListener('visibilitychange', pauseOrPlay);
  // the pixel geometry is stale after a real resize, and the end state is pure CSS, so jump to it
  let lastSize = '';
  new ResizeObserver(([entry]) => {
    const size = `${Math.round(entry.contentRect.width)}x${Math.round(entry.contentRect.height)}`;
    if (lastSize && size !== lastSize && FINALE.includes(stage)) finishEgg();
    if (size !== lastSize) {
      // a free sun keeps its height over the ridge under it, so night stays night and day stays day after a rotation
      const keep = free && horizon ? [free, goal].map(q => q && q.y - horizonAt(q.x)) : null;
      horizon = null;
      if (keep) {
        [free, goal].forEach((q, i) => { if (q) q.y = clamp(horizonAt(q.x) + keep[i], 6, Math.min(horizonAt(q.x) + 16, 106)); });
        paint();
      }
    }
    lastSize = size;
  }).observe(scene);
  const settle = () => {
    if (motionAllowed()) return;
    if (FINALE.includes(stage)) finishEgg();
    stopWind();
  };
  motionButton.addEventListener('click', settle);
  reducedMotion.addEventListener('change', settle);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !FINALE.includes(stage) || document.querySelector('dialog[open]') || !scene.classList.contains('is-inview')) return;
    endFinale();
  });

  // Until someone touches it, the sun sets on its own as the scene rises to the middle of the screen,
  // or when the page ends first. The listener only runs while the scene is on screen.
  let queued = 0;
  const follow = () => {
    queued = 0;
    if (touched || !motionAllowed()) return;
    const box = scene.getBoundingClientRect();
    const atEnd = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
    const rise = atEnd ? 1 : clamp((innerHeight - (box.top + box.height / 2)) / (innerHeight * .55), 0, 1);
    goTo(.78 + .2 * rise); // down to the ridge, golden; sinking it is the visitor's move
  };
  const onScroll = () => { if (!queued) queued = requestAnimationFrame(follow); };
  new IntersectionObserver(([entry]) => {
    scene.classList.toggle('is-inview', entry.isIntersecting);
    pauseOrPlay();
    if (entry.isIntersecting) { addEventListener('scroll', onScroll, { passive: true }); onScroll(); }
    else removeEventListener('scroll', onScroll);
  }).observe(scene);
  spawn();
  paint();
})();

// Kilas balik senjamu: six cards about the visitor's own night, opened from the Senja caption.
(() => {
  const scene = document.querySelector('.senja');
  const modal = document.querySelector('#senja-kilas');
  const opener = scene.querySelector('.senja-keepsake');
  const kilas = connectDialog(modal, opener, '.kilas-card');
  const card = modal.querySelector('.kilas-card');
  const slides = [...modal.querySelectorAll('.kilas-slide')];
  const segments = [...modal.querySelectorAll('.kilas-progress i')];
  const stack = modal.querySelector('.kilas-slides');
  let openedAt = 0;
  const prev = modal.querySelector('.kilas-prev');
  const next = modal.querySelector('.kilas-next');
  const count = modal.querySelector('.kilas-count');
  const status = modal.querySelector('.kilas-status');
  const post = modal.querySelector('.kilas-post');
  const [front, back] = post.querySelectorAll('.kilas-face');
  const flipButton = modal.querySelector('.kilas-flip');
  const shareButton = modal.querySelector('.kilas-share');
  const saveButton = modal.querySelector('.kilas-save');
  const storyButton = modal.querySelector('.kilas-story');
  const shot = modal.querySelector('.kilas-shot');
  const shotImg = shot.querySelector('.kilas-shot-img');
  const shotNote = shot.querySelector('.kilas-shot-note');
  const shotSave = shot.querySelector('.kilas-shot-save');
  const shotClose = shot.querySelector('.kilas-shot-close');
  const shareStatus = modal.querySelector('.kilas-share-status');
  const linkField = modal.querySelector('.kilas-link');
  const coarse = matchMedia('(pointer: coarse)');
  const dayFormat = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const clockFormat = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' });
  const START = Date.parse(document.querySelector('.countdown')?.dataset.target || '2026-10-19T00:00:00+07:00');
  const END = Date.parse('2026-12-07T00:00:00+07:00');
  const url = `${document.querySelector('link[rel="canonical"]')?.href || location.href.split('#')[0]}#senja`;
  const EDGES = [[0, 1], [1, 2], [0, 3], [1, 4], [1, 5]]; // the constellation path, by slot
  const TIPS = [[6, 238], [112, 154], [258, 5], [62, 88], [111, 20], [258, 174]]; // where the stars landed on the sprig, in slot order
  const NS = 'http://www.w3.org/2000/svg', EASE = 'cubic-bezier(.22,1,.36,1)', SPRING = 'cubic-bezier(.34,1.56,.64,1)';
  // team figures come from the klaster dialog, so there is one source of truth
  const TEAM = (() => {
    const found = [...document.querySelectorAll('#klaster-anggota [role="tab"][data-cluster]')]
      .map(tab => [tab.dataset.name, document.querySelectorAll(`#klaster-${tab.dataset.cluster} .members-list > .member`).length])
      .filter(([name, n]) => name && n);
    return found.length ? found : [['Medika', 9], ['Saintek', 7], ['Soshum', 6]];
  })();
  const TOTAL = TEAM.reduce((sum, [, n]) => sum + n, 0);
  let stats = null, slide = 0, moving = [], counting = [], flipped = false, image = null, story = null, storyAt = 0, shotUrl = '', press = null, swiped = false, title = '';

  const set = (name, value) => modal.querySelectorAll(`[data-fill="${name}"]`).forEach(el => { el.textContent = value; });
  const setCount = (name, n) => modal.querySelectorAll(`[data-fill="${name}"]`).forEach(el => { el.textContent = n; el.dataset.count = n; });
  const node = (name, attrs, parent) => { const el = document.createElementNS(NS, name); Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v)); parent.append(el); return el; };
  const tell = words => { shareStatus.textContent = words; };
  const lama = ms => {
    const s = Math.max(1, Math.round(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), r = s % 60;
    const parts = (h ? [[h, 'jam'], [m, 'menit']] : m ? [[m, 'menit'], [r, 'detik']] : [[r, 'detik']]).filter(([n]) => n);
    return { parts, text: parts.map(([n, u]) => `${n} ${u}`).join(' ') };
  };
  const big = parts => parts.flatMap(([n, unit]) => {
    const b = document.createElement('b');
    b.textContent = n;
    b.dataset.count = n;
    const small = document.createElement('small');
    small.textContent = unit;
    return [b, small];
  });
  const wib = t => Math.floor((t + 252e5) / 864e5); // calendar day in WIB
  function whenLine() {
    const d0 = wib(START), d1 = wib(END), now = wib(Date.now());
    if (now < d0) return d0 - now === 1 ? 'Besok kami tiba di Pakem.' : `${d0 - now} hari lagi kami tiba di Pakem.`;
    if (now === d0) return 'Hari ini kami tiba di Pakem.';
    if (now <= d1) return `Hari ke-${now - d0 + 1} kami di Pakem.`;
    return 'Tugas kami di Pakem selesai 7 Desember 2026.';
  }
  // playful and deterministic: the first rule that matches names the night
  function rank(s, time) {
    if (s.keyCatches === 6) return ['Penjelajah Papan Ketik', 'Keenam kunang-kunang kamu tangkap dengan papan ketik.'];
    if (s.duration <= 20000) return ['Penangkap Kilat', `Rasimu selesai dalam ${time}.`];
    if (s.sunsets >= 3) return ['Penikmat Senja', `Senja turun ${s.sunsets} kali selama kamu di sini.`];
    if (s.rounds >= 2) return ['Pengunjung Setia', `Ini rasi ke-${s.rounds} di kunjungan ini.`];
    return ['Pemetik Bintang', 'Enam kunang-kunang kini jadi bintang di atas Merapi.'];
  }
  const seeded = () => { let seed = Math.round(stats.duration) % 2147483646 + 1; return () => (seed = seed * 16807 % 2147483647) / 2147483647; };
  // stars and trail starts in constellation-box units; a far catch is pulled in so the shape stays readable on wide screens
  const points = () => {
    const stars = stats.trails.map(t => t.to), REACH = 110;
    const froms = stats.trails.map((t, i) => {
      const [sx, sy] = stars[i], dx = t.from[0] - sx, dy = t.from[1] - sy, k = Math.min(1, REACH / Math.max(1, Math.hypot(dx, dy)));
      return [sx + dx * k, sy + dy * k];
    });
    return { stars, froms };
  };
  function fitter(pts, x, y, w, h, pad) {
    const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
    const minX = Math.min(...xs), minY = Math.min(...ys), bw = Math.max(1, Math.max(...xs) - minX), bh = Math.max(1, Math.max(...ys) - minY);
    const k = Math.min((w - 2 * pad) / bw, (h - 2 * pad) / bh), ox = x + (w - bw * k) / 2 - minX * k, oy = y + (h - bh * k) / 2 - minY * k;
    return Object.assign(q => [+(ox + q[0] * k).toFixed(1), +(oy + q[1] * k).toFixed(1)], { k });
  }

  // the team card: one small star per member, a cluster of stars per klaster
  const teamSvg = modal.querySelector('.kilas-team svg');
  TEAM.forEach(([, size], g) => {
    const cx = 50 + g * 100;
    for (let i = 0; i < size; i += 1) {
      const r = 7 * Math.sqrt(i + .5), t = i * 2.39996, x = (cx + r * Math.cos(t)).toFixed(1), y = (60 + r * Math.sin(t)).toFixed(1);
      const star = node('g', { class: 'kilas-star' }, teamSvg);
      node('circle', { cx: x, cy: y, r: 5, 'fill-opacity': .2 }, star);
      node('circle', { cx: x, cy: y, r: 2.2 }, star);
    }
  });
  modal.querySelector('.kilas-clusters').replaceChildren(...TEAM.map(([name, n]) => Object.assign(document.createElement('li'), { textContent: `${name} · ${n}` })));
  setCount('total', TOTAL);
  set('total-text', TOTAL);

  function drawStars(svg, at) {
    node('path', { class: 'kilas-lines', 'stroke-opacity': .8, d: EDGES.map(([a, b]) => `M${at[a].join(' ')}L${at[b].join(' ')}`).join('') }, svg);
    at.forEach(([x, y]) => {
      const g = node('g', { class: 'kilas-star' }, svg);
      node('circle', { cx: x, cy: y, r: 5.5, 'fill-opacity': .2 }, g);
      node('circle', { cx: x, cy: y, r: 2.3 }, g);
    });
  }
  function drawSky(svg, { ghost = false, trails = false, fitH = 1 } = {}) {
    svg.replaceChildren();
    const { width: vw, height: vh } = svg.viewBox.baseVal, rand = seeded();
    for (let i = 0; i < 34; i += 1) node('circle', { class: 'kilas-dust', cx: (rand() * vw).toFixed(1), cy: (rand() * vh * .9).toFixed(1), r: (.4 + rand() * .7).toFixed(2), 'fill-opacity': (.3 + rand() * .5).toFixed(2) }, svg);
    if (ghost) { // the cover shows the stars where they landed in the finale: on the tips of the sprig
      const at = fitter(TIPS.concat([[0, 0], [264, 244]]), 0, 0, vw, vh * fitH, 26), [gx, gy] = at([0, 0]);
      node('use', { href: '#sprig-shape', class: 'kilas-ghost', 'fill-opacity': .16, transform: `translate(${gx} ${gy}) scale(${at.k.toFixed(4)})` }, svg);
      drawStars(svg, TIPS.map(at));
      return;
    }
    const { stars, froms } = points(), at = fitter(trails ? stars.concat(froms) : stars, 0, 0, vw, vh * fitH, 18);
    if (trails) froms.forEach((f, i) => {
      const g = node('g', { class: 'kilas-trail' }, svg), [x1, y1] = at(f), [x2, y2] = at(stars[i]);
      node('line', { x1, y1, x2, y2, 'stroke-opacity': .55 }, g);
      node('circle', { cx: x1, cy: y1, r: 1.6, 'fill-opacity': .7 }, g);
    });
    drawStars(svg, stars.map(at));
  }

  function fill() {
    const s = stats, time = lama(s.duration), date = dayFormat.format(s.date);
    const fastest = (s.fastest / 1000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const [name, why] = rank(s, time.text);
    title = name;
    set('date', date);
    set('stamp-date', date.toUpperCase());
    set('stamp-time', clockFormat.format(s.date));
    modal.querySelector('[data-fill="duration"]').replaceChildren(...big(time.parts));
    setCount('sunsets', s.sunsets);
    setCount('moves', s.moves);
    set('fastest', fastest);
    set('title', name);
    set('reason', why);
    modal.querySelectorAll('[data-gloss]').forEach(dd => {
      const g = document.querySelector(`.gloss-meaning[data-word="${dd.dataset.gloss}"]`);
      if (g?.lastChild) dd.textContent = g.lastChild.textContent.trim();
    });
    const when = whenLine();
    set('when', when);
    set('tally-time', `Rasi selesai: ${time.text}`);
    set('tally-sun', s.moves ? `Matahari digeser: ${s.moves} kali` : 'Matahari turun sendiri');
    set('tally-dusk', `Senja turun: ${s.sunsets} kali`);
    set('tally-title', `Gelar: ${name}`);
    const sway = modal.querySelector('[data-fill="tally-sway"]');
    sway.hidden = !s.sways;
    sway.textContent = `Daun digoyang: ${s.sways} kali`;
    const says = [
      'Enam bintang, setangkai daun. Kamu menyalakan langit di kaki Merapi.',
      `Waktumu ${time.text}, dari sentuhan pertama sampai bintang keenam. Senja turun ${s.sunsets} kali, matahari kamu geser ${s.moves} kali, tangkapan tercepat ${fastest} detik.`,
      `Gelarmu malam ini: ${name}. ${why}`,
      'Yang kamu tulis: Tentrem ing Pakem, artinya tenteram di Pakem.',
      `${TOTAL} mahasiswa dari tiga klaster: ${TEAM.map(([n, k]) => `${n} ${k}`).join(', ')}. ${when}`,
      'Kartu posmu. Matur nuwun sampun mampir. Sugeng dalu!'
    ];
    slides.forEach((item, i) => { item.dataset.say = says[i]; });
    drawSky(modal.querySelector('[data-sky="cover"]'), { ghost: true });
    drawSky(modal.querySelector('[data-sky="trails"]'), { trails: true });
    drawSky(modal.querySelector('[data-sky="post"]'), { trails: true, fitH: .76 }); // clear of the name below
  }

  function countUp(el) {
    const end = Number(el.dataset.count);
    if (!Number.isFinite(end)) return;
    const t0 = performance.now();
    const step = now => {
      const k = Math.min(1, Math.max(0, (now - t0) / 900));
      el.textContent = String(Math.round(end * (1 - (1 - k) ** 3)));
      if (k < 1) counting.push(requestAnimationFrame(step));
    };
    el.textContent = '0';
    counting.push(requestAnimationFrame(step));
  }
  function enter(item, dir) {
    const play = (el, kf, delay, duration, easing = EASE) => moving.push(el.animate(kf, { delay, duration, easing, fill: 'backwards' }));
    play(item, [{ opacity: 0, transform: `translateX(${dir * 28}px) rotate(${dir * 1.2}deg)` }, { opacity: 1, transform: 'none' }], 0, 460);
    item.querySelectorAll('[data-k]').forEach(el => play(el, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], 90 + 80 * Number(el.dataset.k), 520));
    const stars = item.querySelectorAll('.kilas-star'), step = Math.min(70, 900 / Math.max(1, stars.length));
    stars.forEach((el, i) => play(el, [{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'none' }], 260 + i * step, 420, SPRING));
    item.querySelectorAll('.kilas-trail').forEach((el, i) => play(el, [{ opacity: 0 }, { opacity: 1 }], 300 + i * 160, 500));
    item.querySelectorAll('.kilas-lines').forEach(el => play(el, [{ opacity: 0 }, { opacity: 1 }], 700, 600));
    item.querySelectorAll('.kilas-ghost').forEach(el => play(el, [{ opacity: 0 }, { opacity: 1 }], 1000, 600));
    item.querySelectorAll('[data-count]').forEach(countUp);
  }
  function show(index, { animate = true, announce = true } = {}) {
    moving.forEach(a => a.finish());
    moving = [];
    counting.forEach(cancelAnimationFrame);
    counting = [];
    modal.querySelectorAll('[data-count]').forEach(el => { el.textContent = el.dataset.count; });
    const from = slide;
    slide = Math.max(0, Math.min(slides.length - 1, index));
    const last = slide === slides.length - 1;
    if (from !== slide && slides[from].contains(document.activeElement)) next.focus({ preventScroll: true }); // move focus before hiding
    slides.forEach((item, i) => { item.hidden = i !== slide; });
    segments.forEach((seg, i) => { seg.classList.toggle('is-done', i < slide); seg.classList.toggle('is-current', i === slide); });
    count.textContent = `${slide + 1} / ${slides.length}`;
    if (slide === 0 && document.activeElement === prev) next.focus({ preventScroll: true });
    prev.disabled = slide === 0;
    next.classList.toggle('is-last', last);
    next.querySelector('.kilas-next-label').textContent = last ? 'Selesai' : 'Lanjut';
    if (announce) status.textContent = `${slide + 1} dari ${slides.length}. ${slides[slide].dataset.say}`;
    card.scrollTop = 0;
    if (last) prepareImage();
    if (animate && motionAllowed()) enter(slides[slide], slide >= from ? 1 : -1);
  }
  const go = i => { if (i >= 0 && i < slides.length && i !== slide) show(i); };

  // Tap the right side to go on and the left side to go back, swipe sideways, or use the buttons and arrow keys.
  prev.addEventListener('click', () => go(slide - 1));
  next.addEventListener('click', () => { if (slide === slides.length - 1) kilas.close(); else go(slide + 1); });
  modal.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target === linkField || !shot.hidden) return;
    const to = { ArrowRight: slide + 1, ArrowLeft: slide - 1, Home: 0, End: slides.length - 1 }[event.key];
    if (to === undefined) return;
    event.preventDefault();
    go(to);
  });
  stack.addEventListener('pointerdown', event => {
    swiped = false;
    if (event.target.closest('button, a, input')) return;
    press = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  stack.addEventListener('pointerup', event => {
    if (!press || press.id !== event.pointerId) return;
    const dx = event.clientX - press.x, dy = event.clientY - press.y;
    press = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) { swiped = true; go(slide + (dx < 0 ? 1 : -1)); }
  });
  stack.addEventListener('pointercancel', () => { press = null; });
  stack.addEventListener('click', event => {
    if (swiped) { swiped = false; return; }
    if (performance.now() - openedAt < 400) return; // the second half of a double tap on Kilas balik
    if (event.target.closest('.kilas-post, button, a, input')) return;
    const r = stack.getBoundingClientRect();
    go(slide + (event.clientX - r.left < r.width * .3 ? -1 : 1));
  });

  // The postcard turns over on a tap or with its button.
  function flip(to = !flipped) {
    moving.forEach(a => a.finish()); // an opacity animation on an ancestor would flatten the 3D turn
    moving = [];
    flipped = to;
    post.classList.toggle('is-flipped', to);
    flipButton.setAttribute('aria-pressed', String(to));
    front.inert = to;
    back.inert = !to;
    front.setAttribute('aria-hidden', String(to));
    back.setAttribute('aria-hidden', String(!to));
  }
  const sayFace = () => { status.textContent = flipped ? 'Sisi belakang kartu.' : 'Sisi depan kartu.'; };
  flipButton.addEventListener('click', () => { flip(); sayFace(); });
  post.addEventListener('click', event => {
    if (swiped || event.target.closest('button')) return;
    flip();
    sayFace();
  });

  // Share: nothing is awaited before navigator.share, so the tap still counts as the user's gesture.
  const shareText = () => `Aku menyalakan enam bintang di kaki Merapi dalam ${lama(stats.duration).text}. Gelarku: ${title}. Coba juga di Tentrem ing Pakem.`;
  function copy() {
    const line = `${shareText()} ${url}`;
    const fallback = () => {
      linkField.hidden = false;
      linkField.value = line;
      linkField.focus();
      linkField.select();
      tell('Salin teks di kolom ini.');
    };
    if (!navigator.clipboard?.writeText) { fallback(); return; }
    navigator.clipboard.writeText(line).then(() => tell('Teks dan tautan tersalin. Tinggal tempel.'), fallback);
  }
  shareButton.addEventListener('click', () => {
    const data = { title: 'Senja di Pakem', text: shareText(), url };
    if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
      navigator.share(data).catch(error => { if (error.name !== 'AbortError') copy(); });
      return;
    }
    copy();
  });

  // The pictures are an extra: if anything fails, their buttons stay hidden and the text share still works.
  // The Story picture is redrawn when it is older than half a minute, so its countdown stays close to the hero's.
  function prepareImage() {
    if (!stats || typeof Path2D !== 'function' || !HTMLCanvasElement.prototype.toBlob) return;
    const stale = !story || Date.now() - storyAt > 30000;
    if (image && !stale) return;
    (window.requestIdleCallback || (fn => setTimeout(fn, 60)))(() => {
      try { if (!image) drawCard(); } catch { /* the text share still works */ }
      try { if (stale) drawStory(); } catch { /* the text share still works */ }
    });
  }
  function wordmark(ctx, size, cx, base1, base2) {
    const track = -.058 * size, spacing = 'letterSpacing' in ctx;
    const f = (px, italic) => `${italic ? 'italic ' : ''}400 ${px}px Georgia, "Times New Roman", serif`;
    const measure = (s, font) => {
      ctx.font = font;
      if (spacing) { ctx.letterSpacing = `${track}px`; return ctx.measureText(s).width; }
      return [...s].reduce((w, ch) => w + ctx.measureText(ch).width + track, 0);
    };
    const draw = (s, font, color, x, y) => {
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textAlign = 'left';
      if (spacing) { ctx.letterSpacing = `${track}px`; ctx.fillText(s, x, y); return; }
      [...s].forEach(ch => { ctx.fillText(ch, x, y); x += ctx.measureText(ch).width + track; });
    };
    const bigF = f(size), smallF = f(size * .81, true);
    const wT = measure('Tentrem', bigF), x1 = cx - (wT + .937 * size) / 2;
    draw('Tentrem', bigF, '#f6f1e4', x1, base1);
    ctx.save();
    ctx.translate(x1 + wT + .223 * size, base1 + .0435 * size - .66 * size);
    ctx.scale(.714 * size / 264, .66 * size / 244);
    ctx.fillStyle = '#e2c3a0';
    ctx.fill(new Path2D(document.querySelector('#sprig-shape').getAttribute('d')));
    ctx.restore();
    const wI = measure('ing', smallF), wP = measure(' Pakem', bigF), wD = measure('.', bigF), x2 = cx - (wI + wP + wD) / 2 - .0215 * size;
    draw('ing', smallF, '#e2c3a0', x2, base2);
    draw(' Pakem', bigF, '#f6f1e4', x2 + wI, base2);
    draw('.', bigF, '#e2c3a0', x2 + wI + wP, base2);
    if (spacing) ctx.letterSpacing = '0px';
  }
  const label = (ctx, s, font, color, x, y, spacing = 0) => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${spacing}px`;
    ctx.fillText(s, x, y);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  };
  const toFile = (canvas, name, done) => canvas.toBlob(blob => { if (blob) done(new File([blob], name, { type: 'image/png' })); }, 'image/png');
  // One painter for both pictures: the night sky, Merapi from the scene's own paths, the visitor's constellation and the wordmark.
  function paintNight(W, H, L) {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d'), rand = seeded(), hills = document.querySelector('.senja-hills');
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0d1729');
    bg.addColorStop(.6, '#16243a');
    bg.addColorStop(1, '#263a50');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fffbe6';
    for (let i = 0; i < L.starCount; i += 1) { ctx.globalAlpha = .3 + rand() * .5; ctx.beginPath(); ctx.arc(rand() * W, rand() * L.starDepth, .8 + rand() * 1.8, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    const [tx, ty, k] = L.hills;
    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(k, k);
    ctx.fillStyle = '#1a2925';
    ctx.fill(new Path2D(hills.querySelector('.hill-back').getAttribute('d')));
    ctx.fillStyle = '#ffd27a';
    hills.querySelectorAll('.village-lights circle').forEach(c => { ctx.beginPath(); ctx.arc(+c.getAttribute('cx'), +c.getAttribute('cy'), 2.6, 0, 7); ctx.fill(); });
    ctx.fillStyle = '#16231d';
    ctx.fill(new Path2D(hills.querySelector('.hill-mid').getAttribute('d')));
    ctx.fillStyle = '#162019';
    ctx.fill(new Path2D(hills.querySelector('.hill-front').getAttribute('d')));
    ctx.restore();
    const ground = ty + 460 * k;
    if (ground < H) { ctx.fillStyle = '#162019'; ctx.fillRect(0, ground - 1, W, H - ground + 1); }
    const [sx, sy, sr] = L.shade, shade = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    shade.addColorStop(0, '#0a1322b0');
    shade.addColorStop(1, '#0a132200');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);
    const { stars, froms } = points(), at = fitter(stars.concat(froms), ...L.sky, 30);
    ctx.lineCap = 'round';
    ctx.setLineDash([3, 7]);
    ctx.strokeStyle = '#f3e27a';
    ctx.lineWidth = 2;
    froms.forEach((f, i) => {
      const [a, b] = [at(f), at(stars[i])];
      ctx.globalAlpha = .55;
      ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
      ctx.globalAlpha = .7;
      ctx.fillStyle = '#f3e27a';
      ctx.beginPath(); ctx.arc(...a, 3.5, 0, 7); ctx.fill();
    });
    ctx.setLineDash([]);
    ctx.globalAlpha = .8;
    ctx.strokeStyle = '#fff2c4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    EDGES.forEach(([a, b]) => { ctx.moveTo(...at(stars[a])); ctx.lineTo(...at(stars[b])); });
    ctx.stroke();
    ctx.fillStyle = '#fffbe6';
    stars.forEach(q => {
      const [x, y] = at(q);
      ctx.globalAlpha = .2;
      ctx.beginPath(); ctx.arc(x, y, 14, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowColor = '#f3e27a';
      ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill();
      ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1;
    wordmark(ctx, ...L.mark);
    return { canvas, ctx };
  }
  // 1080 x 1350: the postcard front, for saving as a photo
  function drawCard() {
    const { canvas, ctx } = paintNight(1080, 1350, { starCount: 140, starDepth: 900, hills: [-792, 752, 1.3], shade: [540, 760, 520], sky: [180, 110, 720, 450], mark: [128, 540, 820, 938] });
    label(ctx, `Enam bintang dalam ${lama(stats.duration).text}`, 'italic 40px Georgia, "Times New Roman", serif', '#e2c3a0', 540, 1130);
    label(ctx, `Gelar: ${title}`, '30px Georgia, "Times New Roman", serif', '#f6f1e4', 540, 1185);
    label(ctx, `SENJA DI PAKEM · ${dayFormat.format(stats.date).toUpperCase()}`, '24px Arial, Helvetica, sans-serif', '#b9c0a8', 540, 1240);
    label(ctx, 'tentremingpakem.com', '26px Arial, Helvetica, sans-serif', '#b9c0a8', 540, 1295);
    toFile(canvas, 'senja-di-pakem.png', file => { image = file; saveButton.hidden = false; });
  }
  // The hero's countdown card, read from the page as it is now, so the Story follows whatever the card says
  // (counting down to deployment today, and whatever it counts later).
  const readCountdown = () => {
    const box = document.querySelector('.countdown');
    if (!box) return null;
    const units = box.querySelector('.countdown-units'), message = box.querySelector('.countdown-message'), ops = box.querySelector('.countdown-ops');
    return {
      heading: (box.querySelector('.countdown-heading')?.textContent || '').trim(),
      date: (box.querySelector('.countdown-date')?.textContent || '').replace(/^[\s·]+/, '').trim(),
      units: units && !units.hidden ? [...box.querySelectorAll('.countdown-unit')].map(unit => [(unit.querySelector('.countdown-value')?.textContent || '').trim(), (unit.querySelector('.countdown-label')?.textContent || '').trim()]) : [],
      message: message && !message.hidden ? message.textContent.trim() : '',
      ops: ops && !ops.hidden ? {
        day: ops.querySelector('.countdown-ops-n').textContent.trim(),
        of: ops.querySelector('.countdown-ops-of').textContent.trim(),
        done: parseFloat(ops.querySelector('.countdown-ops-bar').style.getPropertyValue('--done')) || 0,
        ends: [...ops.querySelectorAll('.countdown-ops-ends > span')].map(span => span.textContent.trim())
      } : null
    };
  };
  function countdownCard(ctx, x, y, w, h) {
    const now = readCountdown();
    if (!now || (!now.units.length && !now.message && !now.ops)) return false;
    ctx.save();
    ctx.shadowColor = '#0008';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 16;
    ctx.fillStyle = 'rgba(246,241,228,.95)';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, w, h, 34) : ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.restore();
    const heading = (now.date ? `${now.heading} · ${now.date}` : now.heading).toUpperCase();
    ctx.font = '600 20px Arial, Helvetica, sans-serif';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '2.5px';
    const hw = ctx.measureText(heading).width;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    ctx.fillStyle = '#87634c';
    ctx.beginPath(); ctx.arc(x + w / 2 - hw / 2 - 6, y + 44, 7, 0, 7); ctx.fill();
    label(ctx, heading, '600 20px Arial, Helvetica, sans-serif', '#5d6852', x + w / 2 + 12, y + 51, 2.5);
    if (now.units.length) {
      const cw = (w - 48) / now.units.length;
      ctx.strokeStyle = '#d9d4c3';
      ctx.lineWidth = 2;
      now.units.forEach(([value, unit], i) => {
        const cx = x + 24 + cw * (i + .5);
        label(ctx, value, '400 80px Georgia, "Times New Roman", serif', '#2f3d2c', cx, y + 150);
        label(ctx, unit.toUpperCase(), '20px Arial, Helvetica, sans-serif', '#7a8269', cx, y + h - 34, 3);
        if (i) { ctx.beginPath(); ctx.moveTo(x + 24 + cw * i, y + 82); ctx.lineTo(x + 24 + cw * i, y + h - 26); ctx.stroke(); }
      });
    } else if (now.ops) {
      // the operational day, large, then the bar from the first day to the last
      const o = now.ops, big = '400 76px Georgia, "Times New Roman", serif', small = 'italic 38px Georgia, "Times New Roman", serif';
      ctx.font = big;
      const dw = ctx.measureText(o.day).width;
      ctx.font = small;
      const ow = ctx.measureText(o.of).width, x0 = x + w / 2 - (dw + 18 + ow) / 2;
      ctx.textAlign = 'left';
      ctx.font = big; ctx.fillStyle = '#2f3d2c'; ctx.fillText(o.day, x0, y + 136);
      ctx.font = small; ctx.fillStyle = '#7a8269'; ctx.fillText(o.of, x0 + dw + 18, y + 136);
      const bx = x + 56, bw = w - 112, by = y + 160;
      ctx.fillStyle = '#dcdcca';
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, bw, 12, 6) : ctx.rect(bx, by, bw, 12); ctx.fill();
      ctx.fillStyle = '#87634c';
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, Math.max(12, bw * o.done / 100), 12, 6) : ctx.rect(bx, by, bw * o.done / 100, 12); ctx.fill();
      const [first, mid, last] = o.ends, f = '600 19px Arial, Helvetica, sans-serif';
      ctx.font = f; ctx.fillStyle = '#7a8269';
      if ('letterSpacing' in ctx) ctx.letterSpacing = '2px';
      ctx.textAlign = 'left'; ctx.fillText((first || '').toUpperCase(), bx, y + h - 24);
      ctx.textAlign = 'right'; ctx.fillText((last || '').toUpperCase(), bx + bw, y + h - 24);
      ctx.textAlign = 'center'; ctx.fillStyle = '#87634c'; ctx.fillText((mid || '').toUpperCase(), x + w / 2, y + h - 24);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    } else {
      label(ctx, now.message, 'italic 40px Georgia, "Times New Roman", serif', '#2f3d2c', x + w / 2, y + h / 2 + 34);
    }
    return true;
  }
  // the ground under the hills: it darkens towards the bottom and fireflies glow over it, one per column, larger the nearer they are
  function meadow(ctx, W, top, bottom, count) {
    let seed = (Math.round(stats.duration) * 7 + 13) % 2147483646 + 1;
    const rand = () => (seed = seed * 16807 % 2147483647) / 2147483647;
    const depth = ctx.createLinearGradient(0, top, 0, bottom);
    depth.addColorStop(0, 'rgba(8,14,10,0)');
    depth.addColorStop(1, 'rgba(8,14,10,.6)');
    ctx.fillStyle = depth;
    ctx.fillRect(0, top, W, bottom - top);
    for (let i = 0; i < count; i += 1) {
      const near = rand(), x = 50 + (i + .15 + rand() * .7) * (W - 100) / count, y = top + 30 + near * (bottom - top - 60), r = 16 + near * 22;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
      glow.addColorStop(0, `rgba(243,226,122,${(.32 + near * .2).toFixed(2)})`);
      glow.addColorStop(1, 'rgba(243,226,122,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.fillStyle = '#fff6b8';
      ctx.beginPath(); ctx.arc(x, y, 2.4 + near * 2.4, 0, 7); ctx.fill();
    }
  }
  // 1080 x 1920 for Instagram Story: the visitor's sky, the wordmark, the countdown under it, then Senja di Pakem.
  // Nothing important sits in the top 220px or the bottom 280px, where Instagram draws its own bars.
  function drawStory() {
    const at = Date.now();
    const { canvas, ctx } = paintNight(1080, 1920, { starCount: 210, starDepth: 1300, hills: [-1177, 1033, 1.7], shade: [540, 960, 720], sky: [150, 220, 780, 520], mark: [150, 540, 900, 1038] });
    meadow(ctx, 1080, 1700, 1920, 16);
    const card = countdownCard(ctx, 150, 1140, 780, 240);
    const base = card ? 1530 : 1340;
    label(ctx, 'KKN PPM UGM PAKEM 2026', '30px Arial, Helvetica, sans-serif', '#e2c3a0', 540, base, 5);
    // where it came from, in a thin capsule under the unit line
    const source = 'Shared from tentremingpakem.com', font = '28px Arial, Helvetica, sans-serif';
    ctx.font = font;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '1px';
    const pw = ctx.measureText(source).width + 64, ph = 66, px = 540 - pw / 2, py = base + 44;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(px, py, pw, ph, ph / 2) : ctx.rect(px, py, pw, ph);
    ctx.fillStyle = 'rgba(246,241,228,.1)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(246,241,228,.35)';
    ctx.stroke();
    label(ctx, source, font, '#f6f1e4', 540, py + 43, 1);
    toFile(canvas, 'senja-di-pakem-story.png', file => { story = file; storyAt = at; storyButton.hidden = false; });
  }
  // Where a browser cannot hand a picture to other apps (desktop, or Instagram's own in-app browser),
  // the picture opens inside the card with plain steps to save it.
  const inApp = /Instagram|FBAN|FBAV/i.test(navigator.userAgent);
  function openShot(file, forStory) {
    if (shotUrl) URL.revokeObjectURL(shotUrl);
    shotUrl = URL.createObjectURL(file);
    shotImg.src = shotUrl;
    shotImg.alt = forStory ? 'Gambar Story Senja di Pakem' : 'Kartu pos Senja di Pakem';
    shotSave.href = shotUrl;
    shotSave.download = file.name;
    const steps = [];
    if (inApp && forStory) steps.push('Kamu membuka dari aplikasi Instagram. Supaya tombol Story langsung jalan, buka halaman ini di Chrome atau Safari lewat menu di pojok kanan atas.');
    steps.push(coarse.matches ? 'Tekan lama gambarnya lalu simpan, atau ketuk Unduh gambar.' : 'Klik Unduh gambar untuk menyimpannya.');
    if (forStory) steps.push(coarse.matches ? 'Lalu buka Instagram, buat Story, dan pilih gambar ini dari galeri.' : 'Lalu kirim ke HP, buka Instagram, buat Story, dan pilih gambar ini.');
    shotNote.textContent = steps.join(' ');
    card.scrollTop = 0;
    card.classList.add('has-shot');
    shot.hidden = false;
    shotClose.focus({ preventScroll: true });
  }
  function closeShot(refocus = true) {
    if (shot.hidden) return;
    shot.hidden = true;
    card.classList.remove('has-shot');
    if (refocus) (shot.dataset.from === 'story' ? storyButton : saveButton).focus({ preventScroll: true });
  }
  // A picture goes straight to the phone's share sheet (Instagram, then Story); nothing is awaited first,
  // so the tap still counts as the visitor's own gesture.
  const offer = (file, forStory) => {
    shot.dataset.from = forStory ? 'story' : 'photo';
    if (navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file] }).catch(error => { if (error.name !== 'AbortError') openShot(file, forStory); });
      return;
    }
    openShot(file, forStory);
  };
  storyButton.addEventListener('click', () => { if (story) offer(story, true); });
  saveButton.addEventListener('click', () => { if (image) offer(image, false); });
  shotClose.addEventListener('click', () => closeShot());
  shotSave.addEventListener('click', () => tell('Gambar sedang diunduh.'));
  // Escape closes the picture first, and only then the whole recap
  modal.addEventListener('cancel', event => {
    if (shot.hidden) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    closeShot();
  }, true);
  modal.addEventListener('close', () => closeShot(false));

  modal.querySelector('.kilas-again').addEventListener('click', () => {
    kilas.close();
    setTimeout(() => scene.dispatchEvent(new Event('senja-restart')), motionAllowed() ? 260 : 0);
  });
  scene.addEventListener('senja-done', event => { stats = event.detail; image = story = null; saveButton.hidden = storyButton.hidden = true; });
  modal.addEventListener('dialog-open', () => {
    openedAt = performance.now();
    if (!stats) return;
    fill();
    flip(false);
    linkField.hidden = true;
    tell('');
    show(0, { announce: false });
    prepareImage();
    setTimeout(() => { if (modal.open) status.textContent = `1 dari ${slides.length}. ${slides[0].dataset.say}`; }, 450);
  });
  motionButton.addEventListener('click', () => { if (!motionAllowed()) { moving.forEach(a => a.finish()); moving = []; } });
})();

// Sponsor dan mitra: the title rolls through the ways to say thanks and a firefly writes the last words in light,
// then carries that light down to the first sponsor; more fireflies follow, one card at a time.
// The section stays hidden until the first <li class="sponsor"> is added (README, "Menambah sponsor").
(() => {
  const section = document.querySelector('#sponsor');
  if (!section) return;
  const sponsors = [...section.querySelectorAll('.sponsor')];
  const footerLink = document.querySelector('[data-sponsor-link]');
  section.hidden = !sponsors.length;
  if (footerLink) footerLink.hidden = !sponsors.length;
  if (!sponsors.length) return;
  // Empty groups stay hidden; group headings only mean something when two or more groups are used.
  const groups = [...section.querySelectorAll('.sponsor-group')];
  groups.forEach(group => { group.hidden = !group.querySelector('.sponsor'); });
  const used = groups.filter(group => !group.hidden);
  // A list of main sponsors alone still says so; only an untiered list drops its heading.
  if (used.length < 2 && used[0]?.dataset.tier !== 'utama') {
    section.classList.add('is-single-tier');
    used[0]?.querySelector('.sponsor-list')?.setAttribute('aria-label', 'Daftar sponsor dan mitra');
    used[0]?.querySelector('.sponsor-list')?.removeAttribute('aria-labelledby');
  }
  const night = section.querySelector('.sponsor-night');
  const sky = night.querySelector('.sponsor-sky');
  const title = night.querySelector('.sponsor-title');
  const dot = title.querySelector('.sponsor-dot');
  // Screen readers hear the title once, as plain text ("Terima kasih, kawan baik."), not the rolling phrases or the pen.
  const spoken = [...title.querySelectorAll('.sponsor-line')].map(line => {
    const final = line.querySelector('.sponsor-slot .is-final');
    if (final) return final.textContent;
    const copy = line.cloneNode(true);
    copy.querySelectorAll('[aria-hidden="true"], .sr-only').forEach(node => node.remove());
    return copy.textContent;
  }).join(' ').replace(/\s+/g, ' ').replace(/\s+([.,!?])/g, '$1').trim();
  const label = document.createElement('span');
  label.className = 'sr-only';
  label.textContent = spoken;
  title.querySelectorAll('.sponsor-line').forEach(line => line.setAttribute('aria-hidden', 'true'));
  title.prepend(label);
  const narrow = matchMedia('(max-width: 599px)');
  const EASE = 'cubic-bezier(.22,1,.36,1)', GLIDE = 'cubic-bezier(.65,0,.35,1)', WRITE = 'cubic-bezier(.45,0,.25,1)';
  // Title timeline in ms: the credits slot lands "Terima kasih," at about 1750, the firefly writes line 2 from WRITE_AT,
  // the gold dot drops, and the same firefly leaves for the first card at LOGOS_AFTER, just as the pen fades.
  const WRITE_AT = 1490, LINE_MS = 720, DOT_AT = WRITE_AT + LINE_MS - 60, LOGOS_AFTER = 2150, TITLE_DONE = 3000;
  const FLIGHT = 940; // a firefly reaches its card at 78% of its flight, then flashes
  let moving = [];
  const run = (el, keyframes, delay, duration, easing = EASE, fill = 'backwards') => {
    const a = el.animate(keyframes, { delay, duration, easing, fill });
    moving.push(a);
    const drop = () => { moving = moving.filter(x => x !== a); };
    a.finished.then(drop, drop);
    return a;
  };
  const onScreen = el => { const box = el.getBoundingClientRect(); return box.bottom > 0 && box.top < innerHeight; };
  const light = item => { item.classList.add('is-lit'); item.closest('.sponsor-group')?.classList.add('is-open'); };
  const isMain = item => Boolean(item.closest('[data-tier="utama"]'));

  // Links always open a new tab, safely, and say so to screen readers. The visible name is the accessible name.
  sponsors.forEach(item => {
    const card = item.querySelector('.sponsor-card');
    if (card?.matches('a[href]')) {
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      const name = (card.querySelector('.sponsor-name')?.textContent || '').replace(/\s+/g, ' ').trim();
      // a label written in the HTML (e.g. a LinkedIn page) is kept; otherwise the visible name comes first (label in name)
      if (name && !card.hasAttribute('aria-label')) card.setAttribute('aria-label', `${name}, membuka tab baru`);
    }
  });

  // Each logo gets a slot sized by its shape: wide wordmarks grow wider, square marks stay compact, so every sponsor
  // carries about the same weight. Empty margins and white backgrounds inside the file are ignored.
  const SPREAD = .55; // 0 = same width for all, 1 = same height for all, .5 = same area
  function scan(img, w, h) {
    const k = Math.min(1, 128 / Math.max(w, h));
    const cw = Math.max(1, Math.round(w * k)), ch = Math.max(1, Math.round(h * k));
    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, cw, ch);
    const px = ctx.getImageData(0, 0, cw, ch).data;
    const luma = i => (px[i] * .2126 + px[i + 1] * .7152 + px[i + 2] * .0722) / 255;
    // the outer edge says what the background is: see-through, white, or a solid tile
    let clear = 0, white = 0, edge = 0;
    const look = (x, y) => { const i = (y * cw + x) * 4; edge += 1; if (px[i + 3] < 24) clear += 1; else if (luma(i) > .93) white += 1; };
    for (let x = 0; x < cw; x++) { look(x, 0); look(x, ch - 1); }
    for (let y = 1; y < ch - 1; y++) { look(0, y); look(cw - 1, y); }
    const mode = clear > edge * .6 ? 'clear' : white > edge * .6 ? 'white' : 'tile';
    const whole = { x: 0, y: 0, w, h, light: false };
    if (mode === 'tile') return whole;
    let x0 = cw, y0 = ch, x1 = -1, y1 = -1, sum = 0, ink = 0;
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const i = (y * cw + x) * 4;
      if (px[i + 3] < 24 || (mode === 'white' && luma(i) > .93)) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      sum += luma(i); ink += 1;
    }
    if (x1 < 0 || (x1 - x0 + 1) < cw * .04 || (y1 - y0 + 1) < ch * .04) return whole;
    return { x: x0 / k, y: y0 / k, w: (x1 - x0 + 1) / k, h: (y1 - y0 + 1) / k, light: mode === 'clear' && sum / ink > .82 };
  }
  function fit(item, img) {
    let w = img.naturalWidth || Number(img.getAttribute('width')), h = img.naturalHeight || Number(img.getAttribute('height'));
    if (!w || !h) ({ width: w, height: h } = img.getBoundingClientRect()); // an SVG with only a viewBox, in some browsers
    if (!w || !h) { item.classList.add('is-broken'); return; }
    let box = { x: 0, y: 0, w, h, light: false };
    try { box = scan(img, w, h); } catch { /* an unreadable file keeps its whole frame */ }
    const r = box.w / box.h, set = (name, value) => item.style.setProperty(name, value.toFixed(4));
    set('--r', r); set('--lw', r ** SPREAD); set('--zx', w / box.w); set('--ox', box.x / box.w); set('--oy', box.y / box.h);
    item.classList.add('is-fit');
    // data-latar="gelap" or "terang" on the li overrides the automatic choice of card
    const latar = item.dataset.latar;
    item.classList.toggle('is-light', latar ? latar === 'gelap' : box.light);
  }
  // load and error events, not decode(): older Safari rejects decode() for some valid SVG files
  const loaded = img => new Promise(resolve => {
    if (img.complete && (img.naturalWidth || /\.svg([?#]|$)/i.test(img.currentSrc))) return resolve(true);
    if (img.complete && img.currentSrc) return resolve(false); // it failed before this script ran
    img.addEventListener('load', () => resolve(true), { once: true });
    img.addEventListener('error', () => resolve(false), { once: true });
  });
  // one logo per idle moment, so reading two dozen files never stalls a frame
  const jobs = [], idle = window.requestIdleCallback || (fn => setTimeout(fn, 16));
  const pump = () => { jobs.shift()?.(); if (jobs.length) idle(pump, { timeout: 300 }); };
  const later = job => { jobs.push(job); if (jobs.length === 1) idle(pump, { timeout: 300 }); };
  sponsors.forEach(item => {
    const img = item.querySelector('.sponsor-card img');
    if (item.dataset.latar === 'gelap') item.classList.add('is-light');
    if (!img) { item.classList.add('is-broken'); item.ready = Promise.resolve(); return; }
    img.alt = ''; // the visible name is the accessible name
    const logo = document.createElement('span'), mark = document.createElement('span');
    logo.className = 'sponsor-logo';
    mark.className = 'sponsor-mark';
    img.replaceWith(logo);
    logo.append(mark);
    mark.append(img);
    item.ready = loaded(img).then(ok => {
      if (ok) return new Promise(resolve => later(() => { fit(item, img); resolve(); }));
      item.classList.add('is-broken');
      console.warn('Logo sponsor tidak bisa dimuat:', img.getAttribute('src'));
    });
  });

  // a few fireflies wander behind the cards
  for (let i = 0, n = narrow.matches ? 5 : 9; i < n; i++) {
    const fly = document.createElement('span');
    fly.className = 'sponsor-fly';
    fly.style.cssText = `--x:${(5 + Math.random() * 90).toFixed(1)}%;--y:${(4 + Math.random() * 88).toFixed(1)}%;--dx:${Math.round(14 + Math.random() * 26)}px;--dy:${Math.round(10 + Math.random() * 22)}px;--dur:${(7 + Math.random() * 6).toFixed(1)}s;--delay:${(-Math.random() * 8).toFixed(1)}s;--fade:${(.3 + i * .14).toFixed(2)}s`;
    fly.append(document.createElement('span'));
    sky.append(fly);
  }

  // The title plays once it has stayed on screen for a moment (at least 200 ms, and until the panel has mostly faded in),
  // so a fling or the smooth jump back to the top does not spend it. Line 1 is CSS (is-played); line 2 and the dot are written here.
  let titleAt = 0, titleTimer = 0, titleY = 0;
  const settleTitle = () => { clearTimeout(titleTimer); title.classList.add('is-played', 'is-settled'); };
  const playTitle = () => {
    if (title.classList.contains('is-played')) return;
    if (!motionAllowed()) { settleTitle(); return; }
    titleAt = performance.now();
    titleY = scrollY;
    title.classList.add('is-played');
    title.querySelectorAll('.sponsor-line').forEach(line => {
      const wipe = line.querySelector('.sponsor-wipe'), pen = line.querySelector('.sponsor-pen');
      if (!wipe || !pen) return;
      const from = wipe.offsetLeft, to = from + wipe.offsetWidth; // the offset parent is .sponsor-line
      if (wipe.offsetWidth > line.clientWidth + 4) { wipe.style.whiteSpace = 'normal'; run(wipe, [{ opacity: 0 }, { opacity: 1 }], WRITE_AT, 600); return; } // too wide for one stroke: it fades in and wraps
      run(pen, [{ transform: `translate(${from - 30}px,-36px)`, opacity: 0 }, { transform: `translate(${from}px,0px)`, opacity: 1 }], WRITE_AT - 340, 340, EASE, 'none');
      run(wipe, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], WRITE_AT, LINE_MS, WRITE);
      run(pen, [{ transform: `translateX(${from}px)`, opacity: 1 }, { opacity: 1, offset: .86 }, { transform: `translateX(${to}px)`, opacity: 0 }], WRITE_AT, LINE_MS, WRITE, 'none');
    });
    if (dot) run(dot, [{ opacity: 0, transform: 'translateY(-1.1em) scale(.5)' }, { opacity: 1, transform: 'translateY(.06em) scale(1.2,.85)', offset: .55 }, { opacity: 1, transform: 'translateY(-.04em) scale(.95,1.05)', offset: .8 }, { opacity: 1, transform: 'none' }], DOT_AT, 750);
    titleTimer = setTimeout(settleTitle, TITLE_DONE);
    schedule();
  };
  let titleDwell = 0, nightAt = 0;
  night.addEventListener('reveal', () => { nightAt = performance.now(); }, { once: true });
  const titleWatch = new IntersectionObserver(([entry]) => {
    clearTimeout(titleDwell);
    if (!entry.isIntersecting) return;
    const wait = Math.max(200, nightAt ? 650 - (performance.now() - nightAt) : 650);
    titleDwell = setTimeout(() => { titleWatch.disconnect(); playTitle(); }, wait);
  }, { rootMargin: '0px 0px -12% 0px' });
  titleWatch.observe(title);

  // Logos land one at a time, in page order, as they come into view. Only the first one waits for the firefly
  // that writes the title, and only while the title is on screen; a reader who scrolls on releases it at once.
  // A logo that has left the screen before its turn gives up its slot and lands when it is seen again.
  const gap = Math.min(240, Math.max(90, 2000 / Math.max(1, sponsors.length - 1)));
  const queue = [];
  let pumpTimer = 0, lastLand = -1e9, handoff = true, titleVisible = false, waitedFrom = 0;
  const watch = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting && !queue.includes(entry.target)) { watch.unobserve(entry.target); queue.push(entry.target); } });
    queue.sort((a, b) => sponsors.indexOf(a) - sponsors.indexOf(b));
    schedule();
  }, { rootMargin: '0px 0px -6% 0px' });
  // the first logo waits only while the reader is watching: most of the title on screen and the page still
  new IntersectionObserver(([entry]) => { titleVisible = entry.intersectionRatio >= .6; schedule(); }, { threshold: [0, .6] }).observe(title);
  addEventListener('scroll', function moved() {
    if (!handoff) { removeEventListener('scroll', moved); return; }
    if (titleAt && Math.abs(scrollY - titleY) > 160) { handoff = false; schedule(); }
  }, { passive: true });
  function schedule() {
    clearTimeout(pumpTimer);
    if (!queue.length) return;
    const now = performance.now();
    // a title on screen that is about to play goes first (it waits a moment on screen before it starts)
    if (handoff && titleVisible && !title.classList.contains('is-played') && motionAllowed()) {
      waitedFrom ||= now;
      if (now - waitedFrom < 700) { pumpTimer = setTimeout(schedule, 100); return; }
    }
    const gate = handoff && titleVisible && titleAt && !title.classList.contains('is-settled') ? titleAt + LOGOS_AFTER : 0;
    // a reader who scrolls fast brings many logos at once: the spacing shrinks so none is left waiting on screen
    const step = queue.length > 3 ? Math.max(45, gap * 3 / queue.length) : gap;
    const at = Math.max(now, lastLand + step, gate);
    pumpTimer = setTimeout(landNext, at - now);
  }
  function landNext() {
    let item;
    while ((item = queue.shift()) && motionAllowed() && !onScreen(item)) watch.observe(item);
    if (!item) return;
    lastLand = performance.now() + (handoff ? 400 : 0); // the hand-off flight is longer: the next logos wait for it
    Promise.race([item.ready, new Promise(resolve => setTimeout(resolve, 700))]).then(() => {
      if (motionAllowed() && !onScreen(item)) { watch.observe(item); return; }
      land(item);
    });
    schedule();
  }
  function land(item) {
    if (item.classList.contains('is-lit')) return;
    if (!motionAllowed()) { light(item); return; }
    const spark = document.createElement('span');
    spark.className = 'sponsor-spark';
    item.append(spark);
    let sx, sy, flight = FLIGHT, first = { opacity: 0, scale: .5 };
    // the firefly that just wrote "kawan baik" carries its light down to the first card
    const wipe = title.querySelector('.sponsor-line:last-child .sponsor-wipe');
    if (handoff && titleAt && performance.now() - titleAt < LOGOS_AFTER + 1800 && wipe && onScreen(wipe)) {
      const w = wipe.getBoundingClientRect(), c = item.getBoundingClientRect(), fs = parseFloat(getComputedStyle(title).fontSize);
      sx = w.right - fs * .14 - (c.left + c.width / 2);
      sy = w.bottom - fs * .36 - (c.top + c.height / 2);
      flight = Math.round(Math.min(1200, Math.max(FLIGHT, Math.hypot(sx, sy) * 2.2)));
      first = { opacity: 1, scale: .9 };
    } else {
      const R = narrow.matches ? 70 : 150;
      sx = (Math.random() * 2 - 1) * R;
      sy = -(70 + Math.random() * (narrow.matches ? 80 : 130));
    }
    handoff = false;
    const mx = sx * .3 + (Math.random() * 2 - 1) * 26, my = sy * .4;
    run(spark, [
      { transform: `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px) scale(${first.scale})`, opacity: first.opacity },
      { transform: `translate(${mx.toFixed(1)}px,${my.toFixed(1)}px) scale(1)`, opacity: 1, offset: .5 },
      { transform: 'translate(0px,0px) scale(1.15)', opacity: 1, offset: .82 },
      { transform: 'translate(0px,0px) scale(2.8)', opacity: 0 }
    ], 0, flight, GLIDE, 'none').finished.then(() => spark.remove(), () => spark.remove());
    item.style.setProperty('--at', `${Math.round(flight * .78)}ms`);
    light(item);
    item.classList.add('is-landing');
    if (isMain(item)) crown(item, Math.round(flight * .78));
    setTimeout(() => item.classList.remove('is-landing'), flight + 1500);
  }
  sponsors.forEach(item => {
    watch.observe(item);
    // a keyboard user who tabs ahead never waits for a firefly
    item.addEventListener('focusin', () => { if (!item.classList.contains('is-lit')) { watch.unobserve(item); light(item); } });
    item.querySelector('.sponsor-card')?.addEventListener('click', event => {
      if (event.target.closest('.sponsor-via')) return;
      visit(item);
      // a tap keeps the logo in its own colours; a second tap, or a tap anywhere else, lets it go
      const on = !item.classList.contains('is-color');
      sponsors.forEach(other => other.classList.toggle('is-color', other === item && on));
    });
  });
  section.addEventListener('touchstart', () => {}, { passive: true }); // lets iOS Safari show :active on the cards
  document.addEventListener('click', event => { if (!event.target.closest('#sponsor .sponsor')) sponsors.forEach(item => item.classList.remove('is-color')); });
  // A card shows its real colours while it sits in the middle band of the screen, where the eye settles while scrolling.
  const focusBand = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('is-focus', entry.isIntersecting)), { rootMargin: '-30% 0px -30% 0px' });
  sponsors.forEach(item => focusBand.observe(item));

  // Main sponsors are crowned: four more fireflies arrive from every side as the first one lands, a comet of light
  // runs twice round the card, and a gold rim stays (the rim is in the markup below, so it shows even without motion).
  sponsors.filter(isMain).forEach(item => {
    const ring = document.createElement('span');
    ring.className = 'sponsor-crown';
    ring.setAttribute('aria-hidden', 'true');
    ring.append(document.createElement('span'));
    item.append(ring);
  });
  function crown(item, at) {
    const w = item.offsetWidth / 2, h = item.offsetHeight / 2;
    [[-1.25, -1.5], [1.3, -1.35], [-1.45, .95], [1.35, 1.15]].forEach(([fx, fy], i) => {
      const spark = document.createElement('span'), sx = fx * w + (Math.random() * 2 - 1) * 18, sy = fy * h + (Math.random() * 2 - 1) * 18;
      spark.className = 'sponsor-spark';
      item.append(spark);
      run(spark, [
        { transform: `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px) scale(.6)`, opacity: 0 },
        { transform: `translate(${(sx * .35).toFixed(1)}px,${(sy * .35).toFixed(1)}px) scale(1)`, opacity: 1, offset: .55 },
        { transform: 'translate(0px,0px) scale(1.1)', opacity: 1, offset: .86 },
        { transform: 'translate(0px,0px) scale(2.4)', opacity: 0 }
      ], Math.max(0, at - 640 + i * 80), 860, GLIDE, 'none').finished.then(() => spark.remove(), () => spark.remove());
    });
    item.classList.add('is-crowning');
    setTimeout(() => item.classList.remove('is-crowning'), at + 2400);
  }

  // Afterwards, now and then, a firefly visits one of the cards on screen, and its halo swells. Tapping a card calls one too.
  let visitTimer = 0;
  function visit(item) {
    if (!motionAllowed() || !item.classList.contains('is-lit') || item.classList.contains('is-landing') || item.classList.contains('is-visited')) return;
    const spark = document.createElement('span'), w = item.offsetWidth / 2, h = item.offsetHeight / 2;
    const cx = 18 - w, cy = 1 - h, sx = cx - 30 - Math.random() * 40, sy = cy - 50 - Math.random() * 30; // perches on the top edge, left, clear of the logo
    spark.className = 'sponsor-spark';
    item.append(spark);
    run(spark, [
      { transform: `translate(${sx}px,${sy}px) scale(.6)`, opacity: 0 },
      { transform: `translate(${cx}px,${cy}px) scale(1)`, opacity: 1, offset: .4 },
      { transform: `translate(${cx - 3}px,${cy + 2}px) scale(.9)`, opacity: 1, offset: .72 },
      { transform: `translate(${cx + 26}px,${cy - 34}px) scale(.6)`, opacity: 0 }
    ], 0, 2200, 'ease-in-out', 'none').finished.then(() => spark.remove(), () => spark.remove());
    item.classList.add('is-visited');
    setTimeout(() => item.classList.remove('is-visited'), 2250);
  }
  function loopVisits() {
    clearTimeout(visitTimer);
    if (!night.classList.contains('is-inview') || document.hidden || !motionAllowed()) return;
    visitTimer = setTimeout(() => {
      const seen = sponsors.filter(item => item.classList.contains('is-lit') && onScreen(item));
      if (seen.length) visit(seen[Math.floor(Math.random() * seen.length)]);
      loopVisits();
    }, 3800 + Math.random() * 3200);
  }
  new IntersectionObserver(([entry]) => {
    night.classList.toggle('is-inview', entry.isIntersecting);
    loopVisits();
  }).observe(night);
  document.addEventListener('visibilitychange', () => loopVisits());

  // Pausing or reducing motion jumps the whole section to its final state; it does not replay afterwards.
  const settle = () => {
    if (motionAllowed()) { loopVisits(); return; }
    clearTimeout(visitTimer);
    clearTimeout(titleDwell);
    titleWatch.disconnect();
    clearTimeout(pumpTimer);
    moving.slice().forEach(a => a.finish());
    night.querySelectorAll('.sponsor-spark').forEach(spark => spark.remove());
    sponsors.forEach(item => { watch.unobserve(item); item.classList.remove('is-landing', 'is-visited', 'is-crowning'); light(item); });
    queue.length = 0;
    settleTitle();
  };
  motionButton.addEventListener('click', settle);
  reducedMotion.addEventListener('change', settle);
  // Armed last: only now may CSS hide the parts that wait for their turn. If anything above failed, they simply show.
  night.classList.add('is-armed');
})();

// Perjalanan kami: the journal chapters as a strip of prints that the visitor swipes sideways (a mouse gets arrows).
// A tap on a print opens the journal at that chapter. The prints are read from the journal itself,
// so a new chapter there appears here too.
(() => {
  const section = document.querySelector('#perjalanan');
  if (!section) return;
  const track = section.querySelector('.trip-track');
  const rail = section.querySelector('.trip-rail');
  const dots = section.querySelector('.trip-dots');
  const prev = section.querySelector('.trip-step.is-prev');
  const next = section.querySelector('.trip-step.is-next');
  const bird = rail.querySelector('.trip-bird');
  const longDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const cards = journalPhotos.map((figure, chapter) => {
    const li = make('li', 'trip-card');
    const button = make('button', 'trip-open');
    button.type = 'button';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', 'pakem-story');
    const title = figure.querySelector('.journal-photo-title')?.textContent.trim() || '';
    const label = figure.querySelector('.chapter-label')?.textContent.trim() || '';
    const sub = figure.querySelector('figcaption > span:last-child')?.textContent.trim() || '';
    const time = panels[chapter]?.querySelector('time[datetime]');
    const print = make('span', 'trip-print');
    const photo = figure.querySelector('.journal-collage img');
    if (photo) {
      const img = photo.cloneNode();
      img.loading = 'lazy';
      img.alt = '';
      print.append(img);
    } else {
      li.classList.add('is-waiting');
      const blank = make('span');
      const bird = make('img');
      Object.assign(bird, { src: 'assets/bird.png', alt: '', width: 130, height: 150 });
      blank.append(bird, document.createTextNode('bersambung...'));
      print.append(blank);
    }
    button.append(print, make('span', 'trip-date', label), make('span', 'trip-title', title), make('span', 'trip-sub', sub));
    button.setAttribute('aria-label', time ? `Buka jurnal ${longDate.format(Date.parse(`${time.getAttribute('datetime')}T00:00:00+07:00`))}: ${title}` : `Buka jurnal: ${title}`);
    button.addEventListener('click', () => {
      selectStory(chapter);
      story.open(button);
    });
    li.append(button);
    track.append(li);
    return li;
  });
  const marks = cards.map((card, i) => {
    const dot = make('i');
    dot.style.left = `${cards.length > 1 ? i / (cards.length - 1) * 100 : 0}%`;
    dots.append(dot);
    return dot;
  });

  // On its way to the next dot the bird beats its wings twice (the same beat as the birds in the hero) and lifts a little.
  // It uses the separate translate and scale properties, so it never fights the turn, which lives on transform.
  const flap = () => {
    if (!motionAllowed()) return;
    bird.getAnimations().filter(a => a.id === 'flap').forEach(a => a.cancel());
    bird.animate([
      { translate: '0 0', scale: '1 1' },
      { translate: '0 -4px', scale: '1 .56', offset: .25 },
      { translate: '0 -7px', scale: '1 1', offset: .5 },
      { translate: '0 -4px', scale: '1 .6', offset: .75 },
      { translate: '0 0', scale: '1 1' }
    ], { duration: 460, easing: 'ease-in-out', id: 'flap' });
  };
  // The print nearest the middle is the current one: it stands straight, and the route fills up to its dot.
  let current = -1, queued = 0;
  const centreOf = card => card.offsetLeft + card.offsetWidth / 2;
  const update = () => {
    queued = 0;
    const middle = track.scrollLeft + track.clientWidth / 2;
    let near = 0;
    cards.forEach((card, i) => { if (Math.abs(centreOf(card) - middle) < Math.abs(centreOf(cards[near]) - middle)) near = i; });
    if (near === current) return;
    if (current !== -1) {
      rail.dataset.dir = near < current ? 'back' : 'fwd';
      flap();
    }
    current = near;
    cards.forEach((card, i) => card.classList.toggle('is-near', i === near));
    marks.forEach((dot, i) => dot.classList.toggle('is-passed', i <= near));
    rail.style.setProperty('--p', (cards.length > 1 ? near / (cards.length - 1) : 0).toFixed(4));
    prev.disabled = near === 0;
    next.disabled = near === cards.length - 1;
  };
  track.addEventListener('scroll', () => { if (!queued) queued = requestAnimationFrame(update); }, { passive: true });
  addEventListener('resize', () => { current = -1; update(); });
  const go = i => {
    const card = cards[Math.max(0, Math.min(cards.length - 1, i))];
    if (card) track.scrollTo({ left: centreOf(card) - track.clientWidth / 2, behavior: motionAllowed() ? 'smooth' : 'instant' });
  };
  prev.addEventListener('click', () => go(current - 1));
  next.addEventListener('click', () => go(current + 1));
  update();
})();

// Panggung sponsor: the sun carried up from Senja di Pakem into the sponsor panel is drawn in, the whole screen goes dark,
// the swallowed light rises to become a stage light, fireflies stream in from the edges into a halo round the stage, and the
// sponsors rise one by one onto lit cream cards (main sponsors larger, crowned in gold as two fireflies circle them).
// Sponsors are read from the sponsor section at every opening, in order and with their tiers, so a new one appears by itself.
// The dialog rests at its final state in CSS and the show only animates towards it: a first tap hurries it, a second one
// (or Escape, a resize, reduced motion) ends it at once. Afterwards a tap outside the logos, Escape or the close button
// closes it, and the panel gives the sun back: its light arcs down to stand high in the sky again.
(() => {
  const modal = document.querySelector('.sponsor-stage');
  const scene = document.querySelector('.senja');
  const section = document.querySelector('#sponsor');
  if (!modal || !scene || !section) return;
  const pick = name => modal.querySelector(`.stage-${name}`);
  const [night, light, beam, source, pool, dust, halo, closeButton, body, word, pen, wipe, colon, field, sign, ghost, stream, vortex, flash, panelGlow] =
    ['night', 'light', 'beam', 'source', 'pool', 'dust', 'halo', 'close', 'body', 'word', 'pen', 'wipe', 'colon', 'field', 'sign', 'sun', 'stream', 'vortex', 'flash', 'panel'].map(pick);
  const seeds = [...modal.querySelectorAll('.stage-seed')];
  const title = pick('title');
  const narrow = matchMedia('(max-width: 599px)');
  const EASE = 'cubic-bezier(.22,1,.36,1)', GLIDE = 'cubic-bezier(.65,0,.35,1)', WRITE = 'cubic-bezier(.45,0,.25,1)';
  const COMET = [{ opacity: 0, transform: 'rotate(-40deg)' }, { opacity: 1, offset: .12 }, { opacity: 1, offset: .82 }, { opacity: 0, transform: 'rotate(680deg)' }];
  const SHEEN = [{ transform: 'translateX(-115%)' }, { transform: 'translateX(115%)' }];
  const BLOOM = [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1.04)', offset: .35 }, { opacity: 0, transform: 'scale(1.14)' }];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const px = v => `${v.toFixed(1)}px`;
  let anims = [], state = 'idle', generation = 0, hurried = false, closing = false, risen = true, openedAt = 0, doneAt = 0, opener = null, size = '', byKey = false;
  const run = (el, keyframes, delay, duration, easing = EASE, fill = 'backwards') => {
    const a = el.animate(keyframes, { delay, duration, easing, fill });
    anims.push(a);
    return a;
  };
  const live = () => anims.filter(a => a.playState === 'running' || a.playState === 'paused');

  // the cards are copied from the sponsor section as it is now: its order, its tiers, its trimmed logos and its links
  function build() {
    const groups = [...section.querySelectorAll('.sponsor-group')].filter(group => group.querySelector('.sponsor'));
    const single = groups.length < 2 && groups[0]?.dataset.tier !== 'utama';
    modal.classList.toggle('is-one-tier', single);
    field.replaceChildren(...groups.map((group, g) => {
      const box = document.createElement('div'), label = document.createElement('p'), list = document.createElement('ul');
      box.className = 'stage-group';
      box.dataset.tier = group.dataset.tier || '';
      label.className = 'stage-tier';
      label.id = `stage-tier-${g}`;
      label.textContent = (group.querySelector('.sponsor-tier')?.textContent || '').trim();
      list.className = 'stage-list';
      list.setAttribute('role', 'list');
      if (single || !label.textContent) list.setAttribute('aria-label', 'Daftar sponsor dan mitra');
      else list.setAttribute('aria-labelledby', label.id);
      list.append(...[...group.querySelectorAll('.sponsor')].map(item => copy(item, group.dataset.tier === 'utama')));
      box.append(label, list);
      return box;
    }));
  }
  const part = (tag, name) => { const el = document.createElement(tag); el.className = name; el.setAttribute('aria-hidden', 'true'); return el; };
  function copy(item, main) {
    const li = document.createElement('li'), from = item.querySelector('.sponsor-card'), img = item.querySelector('img');
    const name = (item.querySelector('.sponsor-name')?.textContent || '').replace(/\s+/g, ' ').trim();
    const card = document.createElement(from?.matches('a[href]') ? 'a' : 'div');
    li.className = 'stage-item';
    ['is-fit', 'is-light', 'is-broken'].forEach(c => li.classList.toggle(c, item.classList.contains(c)));
    li.classList.toggle('is-main', main);
    li.classList.toggle('is-named', item.dataset.nama !== 'sembunyi' && section.dataset.nama !== 'sembunyi');
    ['--r', '--lw', '--zx', '--ox', '--oy'].forEach(v => { const value = item.style.getPropertyValue(v); if (value) li.style.setProperty(v, value); });
    card.className = 'stage-card';
    if (card.tagName === 'A') {
      card.href = from.href;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.setAttribute('aria-label', from.getAttribute('aria-label') || `${name}, membuka tab baru`);
    }
    if (img && !li.classList.contains('is-broken')) {
      const logo = part('span', 'stage-logo'), fit = document.createElement('span'), pic = document.createElement('img');
      fit.className = 'stage-fit';
      pic.alt = '';
      pic.decoding = 'async';
      pic.src = img.currentSrc || img.src;
      fit.append(pic);
      logo.append(fit);
      card.append(logo);
    }
    const label = document.createElement('span');
    label.className = 'stage-name';
    label.textContent = name;
    card.append(label, part('span', 'stage-sheen'));
    li.append(part('span', 'stage-bloom'), part('span', 'stage-plinth'), card);
    if (main) {
      const crown = part('span', 'stage-crown');
      crown.append(document.createElement('i'), document.createElement('span'));
      li.append(crown);
      [0, 1].forEach(k => { const jewel = part('span', 'stage-jewel'); jewel.style.setProperty('--delay', `${-k * 1.3}s`); li.append(jewel); });
    }
    return li;
  }

  // n points spread evenly along an ellipse (by length, not by angle), from the top, clockwise
  function along(n, a, b) {
    const N = 240, pts = [], len = [0];
    for (let i = 0; i <= N; i++) {
      const t = -Math.PI / 2 + i / N * Math.PI * 2;
      pts.push([a * Math.cos(t), b * Math.sin(t)]);
      if (i) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    }
    const out = [];
    for (let k = 0, j = 0; k < n; k++) {
      const s = k / n * len[N];
      while (len[j + 1] < s) j++;
      const f = (s - len[j]) / Math.max(1e-6, len[j + 1] - len[j]);
      out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * f, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * f]);
    }
    return out;
  }
  // the cards shrink together until the whole stage fits the screen; returns their scale
  function fit() {
    field.style.setProperty('--u', '1');
    const cs = getComputedStyle(body), gap = parseFloat(cs.rowGap) || 0, pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    for (let k = 0; k < 4; k++) {
      const parts = [...body.children], need = parts.reduce((sum, el) => sum + el.offsetHeight, 0) + gap * (parts.length - 1) + pad;
      const over = need - body.clientHeight, h = field.offsetHeight;
      if (over < 1 || !h) break;
      field.style.setProperty('--u', Math.max(.4, parseFloat(field.style.getPropertyValue('--u')) * (h - over - 2) / h).toFixed(3));
    }
    return parseFloat(field.style.getPropertyValue('--u'));
  }
  // fit the stage (a long list on a phone first puts main sponsors two to a row), then lay the light, the pool,
  // the dust and the halo out around the cards
  function layout() {
    field.classList.remove('is-dense');
    if (fit() < .8) { field.classList.add('is-dense'); fit(); }
    const W = modal.clientWidth, H = modal.clientHeight;
    size = `${W}x${H}`;
    let L = W, R = 0, B = 0;
    field.querySelectorAll('.stage-item').forEach(li => { const q = li.getBoundingClientRect(); L = Math.min(L, q.left); R = Math.max(R, q.right); B = Math.max(B, q.bottom); });
    const T = field.getBoundingClientRect().top, t = title.getBoundingClientRect().bottom, s = sign.getBoundingClientRect().top;
    const cx = (L + R) / 2, cy = (T + B) / 2;
    const rx = clamp((R - L) / 2 + Math.max(22, (R - L) * .07), 60, W / 2 - 12);
    const ry = Math.max(36, Math.min((B - T) / 2 + 30, cy - t - 14, s - cy - 16));
    const angle = clamp(Math.atan2((R - L) / 2 * 1.15 + 24, B), .16, .6);
    modal.style.setProperty('--beam', `${(angle * 180 / Math.PI).toFixed(2)}deg`);
    modal.style.setProperty('--pool-x', px(cx));
    modal.style.setProperty('--pool-y', px(B + 10));
    modal.style.setProperty('--pool-w', px((R - L) * 1.3 + 60));
    const perimeter = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
    const n = Math.round(clamp(perimeter / 40, 14, narrow.matches ? 26 : 36));
    halo.replaceChildren(...along(n, rx, ry).map(([x, y]) => {
      const fly = document.createElement('span'), d = Math.hypot(x, y) || 1, j = (Math.random() - .5) * 12;
      fly.className = 'stage-fly';
      fly.style.cssText = `--x:${px(cx + x + x / d * j)};--y:${px(cy + y + y / d * j)};--s:${Math.round(16 + Math.random() * 12)}px;--dx:${Math.round(4 + Math.random() * 7)}px;--dy:${Math.round(3 + Math.random() * 6)}px;--dur:${(5 + Math.random() * 4).toFixed(1)}s;--delay:${(-Math.random() * 6).toFixed(1)}s`;
      return fly;
    }));
    const spread = Math.tan(angle) * H * .45;
    dust.replaceChildren(...Array.from({ length: narrow.matches ? 12 : 18 }, () => {
      const mote = document.createElement('i');
      mote.style.cssText = `--x:${px(W / 2 + (Math.random() * 2 - 1) * spread)};--s:${(1.5 + Math.random() * 1.6).toFixed(1)}px;--o:${(.35 + Math.random() * .5).toFixed(2)};--dx:${Math.round((Math.random() * 2 - 1) * 18)}px;--dur:${(9 + Math.random() * 7).toFixed(1)}s;--delay:${(-Math.random() * 14).toFixed(1)}s`;
      return mote;
    }));
    return { W, H, cx, cy };
  }

  // two fireflies circle a main card once and stay on its top corners; a comet of light runs round its gold rim
  function crown(li, at) {
    const ring = li.querySelector('.stage-crown');
    run(ring.firstElementChild, [{ opacity: 0 }, { opacity: 1 }], at + 350, 1200, 'ease');
    run(ring.lastElementChild, COMET, at, 1900, WRITE, 'none');
    const w = li.offsetWidth, h = li.offsetHeight, r = 18;
    const loop = [[r, 0], [w - r, 0], [w, r], [w, h - r], [w - r, h], [r, h], [0, h - r], [0, r], [r, 0]];
    const len = [0];
    for (let i = 1; i < loop.length; i++) len.push(len[i - 1] + Math.hypot(loop[i][0] - loop[i - 1][0], loop[i][1] - loop[i - 1][1]));
    const total = len[len.length - 1];
    const onRim = s => {
      s = ((s % total) + total) % total;
      let i = 1;
      while (len[i] < s) i++;
      const f = (s - len[i - 1]) / Math.max(1e-6, len[i] - len[i - 1]);
      return [loop[i - 1][0] + (loop[i][0] - loop[i - 1][0]) * f, loop[i - 1][1] + (loop[i][1] - loop[i - 1][1]) * f];
    };
    li.querySelectorAll('.stage-jewel').forEach((jewel, k) => {
      const rest = k ? [w - r, 0] : [r, 0], s0 = k ? w - 2 * r : 0;
      const frames = Array.from({ length: 17 }, (_, i) => {
        const [x, y] = onRim(s0 + total * i / 16);
        return { transform: `translate(${px(x - rest[0])},${px(y - rest[1])})`, opacity: i === 0 ? 0 : 1 };
      });
      run(jewel, frames, at + 180 + k * 140, 1500, 'cubic-bezier(.4,0,.3,1)');
    });
  }
  function play({ from, size = from.width, lean = 0, at, panel }, { W, H }, id) {
    const sx = from.left + from.width / 2, sy = from.top + from.height / 2, [tx, ty] = at;
    const dx = tx - sx, dy = ty - sy, dist = Math.hypot(dx, dy), rot = `rotate(${(Math.atan2(dy, dx) * 180 / Math.PI).toFixed(2)}deg)`;
    // 1. the panel draws the sun in: it gives a little, then is pulled long and thin and swallowed (0 to 0.8 s)
    ghost.style.setProperty('--sun', px(size));
    Object.assign(ghost.style, { left: px(sx), top: px(sy) });
    Object.assign(stream.style, { left: px(sx), top: px(sy), width: px(dist) });
    [vortex, flash].forEach(el => Object.assign(el.style, { left: px(tx), top: px(ty) }));
    Object.assign(panelGlow.style, { left: px(panel.left), top: px(panel.top), width: px(panel.width), height: px(panel.height), borderRadius: getComputedStyle(section.querySelector('.sponsor-night')).borderRadius });
    run(ghost, [
      { transform: `translate(0px,0px) ${rot} scale(${(1 + .1 * lean).toFixed(3)},${(1 - .07 * lean).toFixed(3)})`, opacity: 1, easing: 'cubic-bezier(.3,0,.4,1)' },
      { transform: `translate(${px(-dx * .04)},${px(-dy * .04)}) ${rot} scale(.9,1.08)`, opacity: 1, offset: .2, easing: 'cubic-bezier(.6,0,.9,.45)' },
      { transform: `translate(${px(dx * .72)},${px(dy * .72)}) ${rot} scale(1.75,.5)`, opacity: 1, offset: .84 },
      { transform: `translate(${px(dx)},${px(dy)}) ${rot} scale(.06)`, opacity: .4 }
    ], 0, 800, 'linear', 'none');
    run(stream, [
      { transform: `${rot} translateX(0px) scaleX(0)`, opacity: 0, easing: 'ease-out' },
      { transform: `${rot} translateX(0px) scaleX(1)`, opacity: 1, offset: .3, easing: 'cubic-bezier(.6,0,.9,.45)' },
      { transform: `${rot} translateX(${px(dist * .72)}) scaleX(.28)`, opacity: 1, offset: .84 },
      { transform: `${rot} translateX(${px(dist)}) scaleX(0)`, opacity: 0 }
    ], 0, 800, 'linear', 'none');
    run(vortex, [{ opacity: 0, transform: 'scale(1.9)' }, { opacity: .9, transform: 'scale(1)', offset: .55 }, { opacity: 0, transform: 'scale(.15)' }], 120, 720, 'cubic-bezier(.5,0,.8,.4)', 'none');
    // 2. the panel answers with light, and the whole screen goes dark
    run(flash, [{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1)', offset: .22 }, { opacity: 0, transform: 'scale(2.4)' }], 760, 950, 'ease-out', 'none');
    run(panelGlow, [{ opacity: 0 }, { opacity: 1, offset: .3 }, { opacity: 0 }], 700, 1100, 'ease-out', 'none');
    run(night, [{ opacity: 0 }, { opacity: 1 }], 650, 950, 'ease-in-out');
    run(closeButton, [{ opacity: 0 }, { opacity: 1 }], 1000, 700, 'ease');
    // 3. the swallowed light rises to the top of the screen, a short trail behind it, and opens as a stage light
    const mx = tx + (W / 2 - tx) * .25, my = ty * .45;
    seeds.forEach((seed, i) => {
      const k = 1 - i * .28;
      run(seed, [
        { transform: `translate(${px(tx)},${px(ty)}) scale(${.4 * k})`, opacity: 0 },
        { transform: `translate(${px(tx)},${px(ty)}) scale(${1.1 * k})`, opacity: 1, offset: .14 },
        { transform: `translate(${px(mx)},${px(my)}) scale(${1.4 * k})`, opacity: 1 - i * .25, offset: .6 },
        { transform: `translate(${px(W / 2)},0px) scale(${3 * k})`, opacity: 0 }
      ], 950 + i * 70, 1000, GLIDE, 'none');
    });
    run(source, [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'none' }], 1650, 1000);
    run(beam, [{ opacity: 0, transform: 'scaleX(.12)' }, { opacity: 1, transform: 'none' }], 1750, 1300);
    run(pool, [{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'none' }], 2500, 1200);
    run(dust, [{ opacity: 0 }, { opacity: 1 }], 2400, 1800, 'ease');
    // 4. fireflies stream in from the edges, round the stage clockwise from the top, and settle into a halo
    const C = [W / 2, H / 2];
    [...halo.children].forEach(fly => {
      const x = parseFloat(fly.style.getPropertyValue('--x')), y = parseFloat(fly.style.getPropertyValue('--y'));
      const vx = x - C[0] || .01, vy = y - C[1] || .01;
      const k = Math.min(vx > 0 ? (W + 30 - x) / vx : (-30 - x) / vx, vy > 0 ? (H + 30 - y) / vy : (-30 - y) / vy);
      const ox = vx * k, oy = vy * k, turn = (Math.random() < .5 ? -1 : 1) * .45;
      const mxf = .45 * (ox * Math.cos(turn) - oy * Math.sin(turn)), myf = .45 * (ox * Math.sin(turn) + oy * Math.cos(turn));
      const a = (Math.atan2(vy, vx) + Math.PI * 2.5) % (Math.PI * 2);
      run(fly, [
        { transform: `translate(${px(ox)},${px(oy)}) scale(.5)`, opacity: 0 },
        { transform: `translate(${px(mxf)},${px(myf)}) scale(1)`, opacity: 1, offset: .5 },
        { transform: 'translate(0px,0px) scale(1)', opacity: 1 }
      ], 1250 + a / (Math.PI * 2) * 800 + Math.random() * 150, 1300 + Math.random() * 400, GLIDE);
    });
    // 5. the heading: "Bermitra" rises, a firefly writes "dengan" in light, the gold colon drops
    run(word, [{ opacity: 0, transform: 'translateY(.3em)' }, { opacity: 1, transform: 'none' }], 2150, 900);
    const x0 = wipe.offsetLeft, x1 = x0 + wipe.offsetWidth, WRITE_AT = 2550, LINE = 720; // the offset parent is .stage-line
    run(pen, [{ transform: `translate(${x0 - 30}px,-36px)`, opacity: 0 }, { transform: `translate(${x0}px,0px)`, opacity: 1 }], WRITE_AT - 340, 340, EASE, 'none');
    run(wipe, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], WRITE_AT, LINE, WRITE);
    run(pen, [{ transform: `translateX(${x0}px)`, opacity: 1 }, { opacity: 1, offset: .86 }, { transform: `translateX(${x1}px)`, opacity: 0 }], WRITE_AT, LINE, WRITE, 'none');
    run(colon, [{ opacity: 0, transform: 'translateY(-1.1em) scale(.5)' }, { opacity: 1, transform: 'translateY(.06em) scale(1.2,.85)', offset: .55 }, { opacity: 1, transform: 'translateY(-.04em) scale(.95,1.05)', offset: .8 }, { opacity: 1, transform: 'none' }], WRITE_AT + LINE - 60, 750);
    // 6. the sponsors rise one by one, in page order; main sponsors are crowned, the others catch a sheen of light
    const items = [...field.querySelectorAll('.stage-item')], C0 = 3000, step = items.length > 1 ? clamp(1600 / (items.length - 1), 150, 650) : 0;
    items.forEach((li, i) => {
      const at = C0 + i * step, group = li.closest('.stage-group');
      if (li === group.querySelector('.stage-item')) run(group.querySelector('.stage-tier'), [{ opacity: 0, letterSpacing: '7px' }, { opacity: 1, letterSpacing: '2.4px' }], at - 150, 900);
      run(li.querySelector('.stage-card'), [{ opacity: 0, transform: 'translateY(40px) scale(.9)' }, { opacity: 1, transform: 'translateY(-4px) scale(1.01)', offset: .62 }, { opacity: 1, transform: 'none' }], at, 950);
      run(li.querySelector('.stage-plinth'), [{ opacity: 0, transform: 'scaleX(.3)' }, { opacity: 1, transform: 'none' }], at + 150, 900);
      run(li.querySelector('.stage-bloom'), BLOOM, at + 320, 1400, 'ease-out', 'none');
      if (li.classList.contains('is-main')) crown(li, at + 260);
      else run(li.querySelector('.stage-sheen'), SHEEN, at + 380, 850, WRITE, 'none');
    });
    // 7. it ends calm, signed with the unit's name
    run(sign, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], C0 + (items.length - 1) * step + 800, 1000);
    Promise.all(anims.map(a => a.finished)).then(() => { if (id === generation && state === 'show') finish(); }, () => {});
  }

  scene.addEventListener('senja-sponsor', event => {
    if (modal.open || document.querySelector('dialog[open]') || typeof modal.showModal !== 'function') return;
    opener = scene.querySelector('.senja-sun');
    build();
    // a ring left on the sun from an earlier keyboard close would pass on to the dialog and back to the sun
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    modal.showModal();
    document.documentElement.classList.add('stage-open');
    document.body.classList.add('stage-open');
    modal.focus({ preventScroll: true }); // the dialog itself, so its name is read and no ring sits on the close button
    openedAt = performance.now();
    closing = hurried = risen = byKey = false;
    state = 'show';
    modal.dataset.step = 'show';
    const id = ++generation, geo = layout();
    if (!motionAllowed()) { finish(); return; }
    play(event.detail, geo, id);
    if (document.hidden) pauseOrPlay();
  });
  // the show stands at its end: every animation is dropped and the CSS holds the same picture
  function finish() {
    if (state !== 'show') return;
    anims.forEach(a => a.cancel());
    anims = [];
    hurried = false;
    state = 'done';
    modal.dataset.step = 'done';
    doneAt = performance.now();
  }
  // a tap during the show speeds it up three times; a second one ends it
  function advance() {
    if (state !== 'show') return;
    if (hurried || !motionAllowed()) { finish(); return; }
    hurried = true;
    live().forEach(a => a.updatePlaybackRate(3));
  }
  // a tap on a card after the show lights it once more
  function shine(item) {
    if (!motionAllowed()) return;
    run(item.querySelector('.stage-bloom'), BLOOM, 0, 1400, 'ease-out', 'none');
    if (item.classList.contains('is-main')) run(item.querySelector('.stage-crown>span'), COMET, 0, 1900, WRITE, 'none');
    else run(item.querySelector('.stage-sheen'), SHEEN, 0, 850, WRITE, 'none');
  }
  // the sun shows in the scene again; pop: it springs in by itself, when no light flew it back
  const rise = (pop = false) => { if (risen) return; risen = true; scene.dispatchEvent(new CustomEvent('senja-sunrise', { detail: { pop } })); };
  // The panel gives the sun back: once the cards have faded it flashes where it took the sun, and the light pops out and
  // arcs down to the sun's place, high in the sky, as the dark lifts. Nothing flies when the scene is off screen (a rotation).
  function giveBack() {
    const real = scene.querySelector('.senja-sun'), q = real.getBoundingClientRect(), d = real.offsetWidth;
    if (!d || q.bottom < 0 || q.top > innerHeight) return [];
    const panel = section.querySelector('.sponsor-night'), P = panel.getBoundingClientRect();
    const tx = q.left + q.width / 2, ty = q.top + q.height / 2, seen = P.width && P.bottom > 0 && P.top < innerHeight;
    const sx = seen ? clamp(tx, P.left + 36, P.right - 36) : tx;
    const sy = seen ? clamp(P.bottom - 56, Math.max(0, P.top) + 30, Math.min(P.bottom, innerHeight) - 24) : -d;
    const dx = sx - tx, dy = sy - ty, bend = clamp(-dx * .3, -40, 40) + (dx >= 0 ? 18 : -18);
    ghost.style.setProperty('--sun', px(d));
    Object.assign(ghost.style, { left: px(tx), top: px(ty) });
    Object.assign(flash.style, { left: px(sx), top: px(sy) });
    const out = [];
    if (seen) {
      Object.assign(panelGlow.style, { left: px(P.left), top: px(P.top), width: px(P.width), height: px(P.height), borderRadius: getComputedStyle(panel).borderRadius });
      out.push(run(panelGlow, [{ opacity: 0 }, { opacity: .9, offset: .3 }, { opacity: 0 }], 100, 900, 'ease-out', 'none'));
      out.push(run(flash, [{ opacity: 0, transform: 'scale(.2)' }, { opacity: .85, transform: 'scale(.7)', offset: .25 }, { opacity: 0, transform: 'scale(1.6)' }], 160, 800, 'ease-out', 'none'));
    }
    out.push(run(ghost, [
      { transform: `translate(${px(dx)},${px(dy)}) scale(.15)`, opacity: 0, easing: 'cubic-bezier(.2,.8,.3,1)' },
      { transform: `translate(${px(dx * .94)},${px(dy * .94 + 8)}) scale(1.15)`, opacity: 1, offset: .2, easing: 'cubic-bezier(.45,0,.4,1)' },
      { transform: `translate(${px(dx * .4 + bend)},${px(dy * .4)}) scale(1)`, opacity: 1, offset: .55, easing: 'cubic-bezier(.3,0,.4,1)' },
      { transform: 'translate(0px,-5px) scale(1)', opacity: 1, offset: .84, easing: 'ease-out' },
      { transform: 'translate(0px,2px) scale(1.08,.92)', opacity: 1, offset: .93, easing: 'ease-in-out' },
      { transform: 'none', opacity: 1 }
    ], 200, 900, 'linear', 'forwards'));
    return out;
  }
  // the stage fades, the page comes back, and the sun is up again in the scene
  function close() {
    if (!modal.open || closing) return;
    finish();
    closing = true;
    // the real sun shows under the landed light just before the stage goes, so no frame is without a sun
    const done = () => { rise(); if (modal.open) modal.close(); };
    if (!motionAllowed()) { done(); return; }
    scene.dispatchEvent(new CustomEvent('senja-sunrise', { detail: { keep: true } }));
    const out = [body, halo, light, closeButton].map(el => run(el, [{ opacity: 1 }, { opacity: 0 }], 0, 300, 'ease-in', 'forwards'));
    out.push(run(night, [{ opacity: 1 }, { opacity: 0 }], 200, 650, 'ease', 'forwards'), ...giveBack());
    Promise.all(out.map(a => a.finished)).then(done, done);
  }
  modal.addEventListener('click', event => {
    const link = event.target.closest('a');
    // the end of the drag that opened the stage, or a tap on a card still rising, never follows a link
    if (closing || performance.now() - openedAt < 450) { if (link) event.preventDefault(); return; }
    if (event.target.closest('.stage-close')) { byKey = event.detail === 0; close(); return; }
    if (state === 'show') { if (link) event.preventDefault(); advance(); return; }
    const item = event.target.closest('.stage-item');
    if (item) { if (!link) shine(item); return; }
    // a tap in the dark closes it, but not in the first moment after the end, when it is more likely a late hurry
    if (performance.now() - doneAt > 900) close();
  });
  // Enter or Space moves the show along, as a tap does
  modal.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && state === 'show' && !event.target.closest('a, button')) {
      event.preventDefault();
      advance();
    }
  });
  // Escape ends the show first, and closes on the next press; a press the browser will not let us hold closes it at once
  modal.addEventListener('cancel', event => {
    byKey = true;
    if (!event.cancelable) return; // the close event tidies up
    event.preventDefault();
    if (state === 'show') finish();
    else close();
  });
  modal.addEventListener('close', () => {
    generation += 1;
    anims.forEach(a => a.cancel());
    anims = [];
    state = 'idle';
    closing = hurried = false;
    delete modal.dataset.step;
    modal.classList.remove('is-still');
    document.documentElement.classList.remove('stage-open');
    document.body.classList.remove('stage-open');
    [halo, dust, field].forEach(el => el.replaceChildren());
    rise(true);
    // focus goes back to the sun, with its ring only when the stage was closed from the keyboard
    if (opener?.isConnected) {
      opener.focus({ preventScroll: true, focusVisible: byKey });
      if (!byKey && opener.matches(':focus-visible')) opener.blur(); // a browser that keeps the ring after a tap
    }
    opener = null;
  });
  // nothing plays unseen: a hidden tab pauses the show and its loops
  function pauseOrPlay() {
    if (!modal.open) return;
    modal.classList.toggle('is-still', document.hidden);
    anims.forEach(a => {
      if (document.hidden && a.playState === 'running') a.pause();
      else if (!document.hidden && a.playState === 'paused') a.play();
    });
  }
  document.addEventListener('visibilitychange', pauseOrPlay);
  // a real resize (a rotation) makes the measured light stale: end the show and lay the stage out again
  addEventListener('resize', () => {
    if (!modal.open || closing || `${modal.clientWidth}x${modal.clientHeight}` === size) return;
    finish();
    layout();
  });
  reducedMotion.addEventListener('change', () => { if (modal.open && !motionAllowed()) finish(); });
})();
