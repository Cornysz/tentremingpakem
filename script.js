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
  trigger.addEventListener('click', () => open());
  closeButton.addEventListener('click', close);
  modal.addEventListener('cancel', event => { event.preventDefault(); close(); });
  modal.addEventListener('click', event => {
    if (event.target !== modal) return;
    const rect = modal.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  });
  return { open, close };
}
const story = connectDialog(dialog, discover, '.postcard');
const philosophy = connectDialog(philosophyDialog, brand, '.philosophy-card');
philosophyDialog.querySelector('.return-to-pakem').addEventListener('click', philosophy.close);

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

// Counts down to deployment day. Every date carries the +07:00 offset, so every visitor sees Western Indonesia Time.
(() => {
  const countdown = document.querySelector('.countdown');
  const target = Date.parse(countdown.dataset.target);
  const day = 864e5;
  const digits = [...countdown.querySelectorAll('.countdown-value > span')];
  const units = countdown.querySelector('.countdown-units');
  const heading = countdown.querySelector('.countdown-heading');
  const message = countdown.querySelector('.countdown-message');
  const journey = countdown.querySelector('.countdown-journey');
  const list = countdown.querySelector('.countdown-stops');
  let timer;
  let state;
  let countingUp = false;

  // The journey line has a stop for every dated journal chapter, plus deployment day. Stops sit evenly apart,
  // so chapters only two days apart stay easy to tap, and a new chapter appears here by itself.
  const shortDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' });
  const longDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const stops = panels.flatMap((panel, chapter) => {
    const time = panel.querySelector('time[datetime]');
    return time ? [{ at: Date.parse(`${time.getAttribute('datetime')}T00:00:00+07:00`), chapter }] : [];
  });
  stops.push({ at: target });
  stops.sort((a, b) => a.at - b.at);
  stops.forEach((stop, i) => {
    stop.place = stops.length > 1 ? i / (stops.length - 1) : 1;
    stop.item = make('li', 'countdown-stop');
    stop.item.style.setProperty('--at', `${stop.place * 100}%`);
    const date = make('span', 'countdown-stop-date', shortDate.format(stop.at));
    date.setAttribute('aria-hidden', 'true');
    if (stop.chapter === undefined) {
      stop.item.classList.add('is-destination');
      stop.item.append(make('span', 'countdown-dot'), date, make('span', 'sr-only', `Penerjunan, ${longDate.format(stop.at)}`));
    } else {
      const title = journalPhotos[stop.chapter].querySelector('.journal-photo-title').textContent;
      const button = make('button', 'countdown-stop-button');
      button.type = 'button';
      button.setAttribute('aria-haspopup', 'dialog');
      button.setAttribute('aria-controls', 'pakem-story');
      button.setAttribute('aria-label', `Buka jurnal ${longDate.format(stop.at)}: ${title}`);
      const tip = make('span', 'countdown-tip', title);
      tip.setAttribute('aria-hidden', 'true');
      tip.append(make('small', '', 'Baca jurnal'));
      button.append(make('span', 'countdown-dot'), date, tip);
      button.addEventListener('click', () => {
        selectStory(stop.chapter);
        story.open(button);
      });
      stop.item.append(button);
    }
    list.append(stop.item);
  });
  // Where now sits on the evenly spaced line: between the two stops around it, in proportion to the days.
  const place = now => {
    const next = stops.findIndex(stop => stop.at > now);
    if (next === 0) return 0;
    if (next === -1) return 1;
    const from = stops[next - 1];
    const to = stops[next];
    return from.place + (to.place - from.place) * (now - from.at) / (to.at - from.at);
  };
  // With many chapters, middle dates would collide; the end dates stay and the rest show on hover.
  new ResizeObserver(() => {
    const gap = list.clientWidth / Math.max(1, stops.length - 1);
    journey.classList.toggle('is-crowded', gap < 52);
    list.style.setProperty('--stop-width', `${Math.min(44, gap)}px`);
  }).observe(list);

  const roll = (digit, text, animate) => {
    if (digit.textContent === text) return;
    digit.textContent = text;
    if (!animate || !motionAllowed() || document.hidden) return;
    digit.animate([{ transform: 'translateY(-75%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 450, easing: 'cubic-bezier(.22,1,.36,1)' });
  };
  // `share` scales the numbers and the journey line together, so the opening can count up from zero.
  const render = (share = 1) => {
    const now = Date.now();
    const left = Math.max(0, target - now);
    const reached = place(now) * share;
    countdown.style.setProperty('--progress', `${(reached * 100).toFixed(2)}%`);
    stops.forEach(stop => stop.item.classList.toggle('is-passed', stop.place <= reached + 1e-9));
    const current = now < target ? 'counting' : now < target + day ? 'today' : 'arrived';
    if (current !== state) {
      state = current;
      units.hidden = state !== 'counting';
      message.hidden = state === 'counting';
      if (state !== 'counting') {
        heading.textContent = heading.dataset[state];
        message.textContent = message.dataset[state];
      }
    }
    [left / day, left / 36e5 % 24, left / 6e4 % 60, left / 1e3 % 60].forEach((value, i) => {
      roll(digits[i], pad(Math.floor(Math.floor(value) * share)), share === 1);
    });
    return left;
  };
  const tick = () => {
    countingUp = false;
    clearTimeout(timer);
    const left = render();
    // Waking just after the next whole second keeps the seconds from skipping; after the day, once a minute is enough.
    timer = setTimeout(tick, left ? left % 1000 + 30 : 6e4);
  };
  // The numbers count up while the card rises in with the rest of the opening.
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
