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
// Once the sixth star is caught, the constellation glides to the middle, waits for one more tap,
// and the stars write the wordmark: the leaves grow to meet them and the sprig flies beside Tentrem.
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
  const halo = scene.querySelector('.senja-halo');
  const bloomButton = scene.querySelector('.senja-bloom');
  const keepsake = scene.querySelector('.senja-keepsake');
  const linePath = sky.querySelector('path');
  const coarse = matchMedia('(pointer: coarse)');
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
  const spot = ([x, y], w, h) => [geo.left + x / w * geo.W, geo.top + y / h * geo.H];

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
      if (dark) say(caught ? `Kunang-kunang tertangkap: ${caught} dari ${SLOTS.length}.` : `Kunang-kunang keluar. Ketuk untuk menangkap: 0 dari ${SLOTS.length}.`);
      else say('Geser mataharinya. Saat gelap, kunang-kunang keluar.');
    }
    // one tab stop for the fireflies: the first one still flying, and only at night
    const flying = [...field.children].filter(fly => !fly.classList.contains('is-caught'));
    flying.forEach((fly, i) => { fly.tabIndex = dark && i === 0 ? 0 : -1; });
    field.setAttribute('aria-hidden', String(!(dark && flying.length)));
  }
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
    const along = 76 * p;
    let x = narrow.matches ? 12 + along : 88 - along;
    let y = p <= 1 ? 82 - 62 * Math.sin(Math.PI * p) : 82 + 140 * (p - 1);
    // a sun focused from the keyboard stays on screen, so the focus ring never disappears below the hills
    if (sun.matches(':focus-visible')) { x = clamp(x, 6, 94); y = Math.min(y, 72); }
    sun.style.left = `${x}%`;
    sun.style.top = `${y}%`;
    sun.setAttribute('aria-valuenow', String(Math.round(p / MAX * 100)));
    sun.setAttribute('aria-valuetext', phase(p));
    story();
  }
  const tick = () => {
    p += (target - p) * .14;
    if (Math.abs(target - p) < .002) p = target;
    paint();
    frame = p === target ? 0 : requestAnimationFrame(tick);
  };
  function goTo(next) {
    target = clamp(next, 0, MAX);
    if (!motionAllowed()) { p = target; paint(); return; }
    if (!frame) frame = requestAnimationFrame(tick);
  }
  const fromX = clientX => {
    const box = scene.getBoundingClientRect();
    const share = (clientX - box.left) / box.width;
    return narrow.matches ? (share - .12) / .76 : (.88 - share) / .76;
  };
  // the clock for the recap starts at the first real touch, not when the sun only gets keyboard focus
  const touch = (clock = true) => { touched = true; if (clock && !stats.start) stats.start = performance.now(); scene.classList.add('is-touched'); };

  // Only a sideways drag moves the sun, so vertical scrolling over the scene stays a scroll.
  let press = null;
  let dragged = false;
  scene.addEventListener('pointerdown', event => {
    if (event.target.closest('.firefly, .senja-reset, .senja-keepsake, .senja-bloom')) return;
    if (FINALE.includes(stage)) return;
    press = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, dragging: false, slack: event.pointerType === 'mouse' ? 3 : 8 };
    dragged = false;
  });
  scene.addEventListener('pointermove', event => {
    if (!press || press.id !== event.pointerId) return;
    if (!press.dragging) {
      const dx = Math.abs(event.clientX - press.x), dy = Math.abs(event.clientY - press.y);
      if (dx < press.slack || dx < dy) return;
      press.dragging = dragged = true;
      scene.setPointerCapture(event.pointerId);
      scene.classList.add('is-dragging');
      touch();
      if (stage === 'mark') { if (motionAllowed()) stats.sways += 1; } else stats.moves += 1;
    }
    // after the finale the same gesture blows wind through the sprig instead of moving the sun
    if (stage === 'mark') { gust(clamp(event.clientX - press.lastX, -30, 30) * 1.4); press.lastX = event.clientX; return; }
    goTo(fromX(event.clientX));
  });
  const release = event => {
    if (!press || press.id !== event.pointerId) return;
    press = null;
    scene.classList.remove('is-dragging');
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
    goTo(fromX(event.clientX));
  });
  sun.addEventListener('keydown', event => {
    const step = { ArrowRight: .05, ArrowUp: .05, ArrowLeft: -.05, ArrowDown: -.05, PageUp: .2, PageDown: -.2 }[event.key];
    if (step === undefined && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    touch();
    if (!event.repeat) stats.moves += 1;
    goTo(event.key === 'Home' ? 0 : event.key === 'End' ? MAX : target + step);
  });
  sun.addEventListener('focus', () => { touch(false); paint(); });
  sun.addEventListener('blur', paint);
  narrow.addEventListener('change', paint);

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
      reset.hidden = false;
      complete(now);
    }
    story();
    if (document.activeElement === fly || document.activeElement === document.body) {
      const next = [...field.children].find(item => !item.classList.contains('is-caught'));
      (next || bloomButton).focus({ preventScroll: true });
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
  // one layout read; the mark is already laid out at its final place while it is still invisible
  function measure() {
    const area = scene.getBoundingClientRect(), box = sky.getBoundingClientRect(), R = markSprig.getBoundingClientRect(), M = mark.getBoundingClientRect();
    const cx = M.left + M.width / 2, cy = M.top + M.height / 2;
    const H = Math.min(area.height * .42, area.width * .4), S = H / R.height, W = R.width * S;
    const O = [R.left + R.width * .019, R.top + R.height * .975], c = [R.left + R.width / 2, R.top + R.height / 2];
    geo = {
      box, W, H, left: cx - W / 2, top: cy - H / 2,
      stars: SLOTS.map(([sx, sy]) => [box.left + box.width * sx / 100, box.top + box.height * sy / 100]),
      sprigT: `translate(${(cx - O[0] - S * (c[0] - O[0])).toFixed(2)}px,${(cy - O[1] - S * (c[1] - O[1])).toFixed(2)}px) scale(${S.toFixed(4)})`
    };
    scene.style.setProperty('--stage-x', `${(cx - area.left).toFixed(1)}px`);
    scene.style.setProperty('--stage-y', `${(cy - area.top).toFixed(1)}px`);
    scene.style.setProperty('--stage-w', `${W.toFixed(1)}px`);
  }
  function startFinale() {
    const id = ++generation;
    stage = 'gather';
    scene.dataset.finale = 'gather';
    bloomButton.hidden = false;
    if (document.activeElement === sun) bloomButton.focus({ preventScroll: true });
    sun.tabIndex = -1;
    sun.setAttribute('aria-hidden', 'true');
    snapStars();
    measure();
    if (!motionAllowed()) {
      say('Enam bintang lengkap.');
      holdTimer = setTimeout(() => { if (id === generation) endFinale(); }, 1500);
      return;
    }
    say('Enam bintang lengkap. Rasinya bergerak ke tengah.');
    const phone = narrow.matches, A0 = phone ? 1700 : 1900, DA = phone ? 1100 : 1300, set = [];
    const run = (el, keyframes, delay, duration, easing = EASE, fill = 'backwards') => { const a = el.animate(keyframes, { delay, duration, easing, fill }); anims.push(a); set.push(a); return a; };
    const { box, left, top, W, H } = geo;
    // the box and its stars share timing and easing, so the lines stay on the stars
    run(sky, [{ transform: 'translate(0px,0px) scale(1,1)' }, { transform: `translate(${left - box.left}px,${top - box.top}px) scale(${W / box.width},${H / box.height})` }], A0, DA, GLIDE, 'forwards');
    caughtFlies().forEach(fly => {
      const i = Number(fly.dataset.slot), [x, y] = geo.stars[i], [ax, ay] = spot(SLOTS[i], 100, 100);
      run(fly.firstElementChild, [{ transform: 'scale(1)' }, { transform: 'scale(1.9)', offset: .4 }, { transform: 'scale(1)' }], A0 - 380 + i * 35, 380, 'ease-in-out', 'none');
      run(fly, [{ transform: 'translate(0px,0px) scale(1)' }, { transform: `translate(${ax - x}px,${ay - y}px) scale(1.5)` }], A0, DA, GLIDE, 'forwards');
    });
    run(veil, [{ opacity: 0 }, { opacity: 1 }], A0, 1200, 'ease');
    run(halo, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: .55, transform: 'none' }], A0 + DA / 2, DA / 2 + 300, 'ease-out', 'forwards');
    Promise.all(set.map(a => a.finished)).then(() => { if (id === generation && stage === 'gather') toAwait(); }, () => {});
    if (!inView()) set.forEach(a => a.pause());
  }
  function toAwait() {
    stage = 'await';
    scene.dataset.finale = 'await';
    if (bloomQueued) { bloom(); return; }
    say(coarse.matches ? 'Ketuk rasinya untuk menyalakannya.' : 'Klik rasinya untuk menyalakannya.');
    armAuto();
  }
  // with no tap, the constellation lights itself, but only while someone can see it
  function armAuto() {
    clearTimeout(autoTimer);
    if (stage === 'await' && inView()) autoTimer = setTimeout(() => { if (stage === 'await') bloom(); }, 2600);
  }
  // a tap while the stars glide speeds them up; a tap in the bloom speeds it up, and a second one finishes it
  function advance() {
    if (!motionAllowed()) { endFinale(); return; }
    if (stage === 'gather') {
      if (!bloomQueued) { bloomQueued = true; live().forEach(a => a.updatePlaybackRate(4)); }
      return;
    }
    if (stage === 'await') { bloom(); return; }
    if (hurried) { endFinale(); return; }
    hurried = true;
    live().forEach(a => a.updatePlaybackRate(3));
  }
  function bloom() {
    if (stage !== 'await') return;
    clearTimeout(autoTimer);
    const id = generation;
    stage = 'bloom';
    scene.dataset.finale = 'bloom';
    hurried = false;
    say('Bintang-bintang menulis nama kami.');
    if (!motionAllowed()) { endFinale(); return; }
    const phone = narrow.matches, C0 = phone ? 1350 : 1500, FLY = phone ? 900 : 1000, set = [];
    const run = (el, keyframes, delay, duration, easing = EASE, fill = 'backwards') => { const a = el.animate(keyframes, { delay, duration, easing, fill }); anims.push(a); set.push(a); return a; };
    // each star steps onto the tip of its leaf, then hands its light to a glint
    caughtFlies().forEach(fly => {
      const i = Number(fly.dataset.slot), [x, y] = geo.stars[i], [ax, ay] = spot(SLOTS[i], 100, 100), [bx, by] = spot(TIPS[i], 264, 244);
      run(fly, [{ transform: `translate(${ax - x}px,${ay - y}px) scale(1.5)` }, { transform: `translate(${bx - x}px,${by - y}px) scale(1.15)` }], 0, 500, EASE, 'forwards');
      run(fly, [{ opacity: 1 }, { opacity: 0 }], 520 + i * 60, 320, 'ease-out', 'forwards');
    });
    run(linePath, [{ opacity: .85 }, { opacity: 0 }], 0, 500, 'ease-out', 'forwards');
    run(halo, [{ opacity: .55, transform: 'none' }, { opacity: 1, transform: 'scale(1.12)', offset: .3 }, { opacity: 0, transform: 'scale(1.2)' }], 0, C0 + 900, 'ease-out', 'forwards');
    run(mark.querySelector('.mark-stem'), [{ transform: 'scale(0)' }, { transform: 'none' }], 0, 600);
    [[1, 150], [4, 250], [2, 350], [3, 450]].forEach(([n, d]) => run(mark.querySelector(`.mark-leaf-${n}`), [{ transform: `rotate(${FOLDS[n]}deg) scale(0)` }, { transform: 'none' }], d, 700, SPRING));
    glints.forEach((g, i) => run(g, [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1.6)', offset: .5 }, { opacity: 1, transform: 'none' }], 420 + i * 70, 420, 'ease-out'));
    // the sprig flies into its place beside Tentrem while a star writes the name
    run(markSprig, [{ transform: geo.sprigT }, { transform: 'translate(0px,0px) scale(1)' }], C0, FLY, GLIDE);
    lineEls.forEach((line, k) => {
      const wipe = line.querySelector('.mark-wipe'), pen = line.querySelector('.mark-pen'), start = C0 + (k ? 650 : 100);
      const from = wipe.offsetLeft, to = from + wipe.offsetWidth; // offsets ignore transforms; the offset parent is .mark-line
      run(wipe, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], start, 700, WRITE);
      run(pen, [{ transform: `translateX(${from}px)`, opacity: 0 }, { opacity: 1, offset: .12 }, { opacity: 1, offset: .85 }, { transform: `translateX(${to}px)`, opacity: 0 }], start, 700, WRITE, 'none');
    });
    run(dot, [{ opacity: 0, transform: 'translateY(-1.1em) scale(.5)' }, { opacity: 1, transform: 'translateY(.06em) scale(1.2,.85)', offset: .55 }, { opacity: 1, transform: 'translateY(-.04em) scale(.95,1.05)', offset: .8 }, { opacity: 1, transform: 'none' }], C0 + 1250, 750);
    Promise.all(set.map(a => a.finished)).then(() => { if (id === generation && stage === 'bloom') endFinale(); }, () => {});
    if (!inView()) set.forEach(a => a.pause());
  }
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
    if (document.activeElement === bloomButton || document.activeElement === document.body) keepsake.focus({ preventScroll: true });
    bloomButton.hidden = true; // only after focus has moved
    say(SIGNOFF);
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
    ['--stage-x', '--stage-y', '--stage-w'].forEach(name => scene.style.removeProperty(name));
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
    goTo(.3);
    if (focusSun) sun.focus({ preventScroll: true });
  }
  reset.addEventListener('click', event => restart(event.detail === 0));
  scene.addEventListener('senja-restart', () => restart(true));

  // After the finale, a sideways swipe is wind: a damped spring sways the sprig, and the words lean a few frames late.
  const wind = { angle: 0, speed: 0, frame: 0, last: 0, trail: [] };
  function gust(push) {
    if (!motionAllowed() || stage !== 'mark') return;
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
    swayGroup.style.transform = `rotate(${wind.angle.toFixed(2)}deg)`;
    leaners.forEach((el, i) => {
      const lean = wind.trail[Math.min(wind.trail.length - 1, 2 + i * 3)];
      el.style.transform = `skewX(${(-lean * .35).toFixed(2)}deg)`;
    });
    if (Math.abs(wind.angle) < .03 && Math.abs(wind.speed) < .3) { stopWind(); return; }
    wind.frame = requestAnimationFrame(blow);
  }
  function stopWind() {
    cancelAnimationFrame(wind.frame);
    Object.assign(wind, { angle: 0, speed: 0, frame: 0, trail: [] });
    swayGroup.style.transform = '';
    leaners.forEach(el => { el.style.transform = ''; });
  }
  // the site's own spark burst, as on the title
  function spark(el) {
    const rect = el.getBoundingClientRect(), s = document.createElement('span');
    s.className = 'spark';
    s.setAttribute('aria-hidden', 'true');
    s.append(document.querySelector('#spark-icon').content.cloneNode(true));
    s.style.left = `${rect.left + rect.width / 2 - 9}px`;
    s.style.top = `${rect.top}px`;
    s.style.setProperty('--dx', `${Math.round((Math.random() - .5) * 24)}px`);
    s.style.setProperty('--dy', '-30px');
    document.body.append(s);
    setTimeout(() => s.remove(), 900);
  }
  // a tapped word hops and its meaning, read from the name gloss in the Pakem section, shows in the caption
  function poke(word) {
    if (motionAllowed()) stats.sways += 1;
    const gloss = document.querySelector(`.gloss-meaning[data-word="${word.dataset.word}"]`);
    if (gloss) {
      const line = gloss.textContent.replace(/\s+/g, ' ').trim();
      say(line.charAt(0).toUpperCase() + line.slice(1));
      clearTimeout(glossTimer);
      glossTimer = setTimeout(() => { if (stage === 'mark') say(SIGNOFF, true); }, 4200);
    }
    if (!motionAllowed()) return;
    word.animate([{ transform: 'none' }, { transform: 'translateY(-.16em)', offset: .32 }, { transform: 'translateY(.03em) scaleY(.96)', offset: .62 }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.3,.7,.4,1)' });
    spark(word);
    gust(word.dataset.word === 'pakem' ? -26 : 26);
  }
  // tapping the sprig or the period rings its six stars
  function ring() {
    if (motionAllowed()) stats.sways += 1;
    if (!motionAllowed()) { mark.classList.toggle('is-bright'); return; }
    [0, 1, 3, 4, 5, 2].forEach((n, i) => glints[n].animate([{ transform: 'none' }, { transform: 'scale(2.4)', offset: .35 }, { transform: 'none' }], { duration: 560, delay: i * 90, easing: 'ease-out' }));
    gust(60);
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
    const on = inView();
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
    if (lastSize && size !== lastSize && FINALE.includes(stage)) endFinale();
    lastSize = size;
  }).observe(scene);
  const settle = () => {
    if (motionAllowed()) return;
    if (FINALE.includes(stage)) endFinale();
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
    goTo(.78 + .36 * rise);
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
    set('flip-hint', coarse.matches ? 'Ketuk kartu untuk membaliknya.' : 'Klik kartu untuk membaliknya.');
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
    const units = box.querySelector('.countdown-units'), message = box.querySelector('.countdown-message');
    return {
      heading: (box.querySelector('.countdown-heading')?.textContent || '').trim(),
      date: (box.querySelector('.countdown-date')?.textContent || '').replace(/^[\s·]+/, '').trim(),
      units: units && !units.hidden ? [...box.querySelectorAll('.countdown-unit')].map(unit => [(unit.querySelector('.countdown-value')?.textContent || '').trim(), (unit.querySelector('.countdown-label')?.textContent || '').trim()]) : [],
      message: message && !message.hidden ? message.textContent.trim() : ''
    };
  };
  function countdownCard(ctx, x, y, w, h) {
    const now = readCountdown();
    if (!now || (!now.units.length && !now.message)) return false;
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
    } else {
      label(ctx, now.message, 'italic 40px Georgia, "Times New Roman", serif', '#2f3d2c', x + w / 2, y + h / 2 + 34);
    }
    return true;
  }
  // 1080 x 1920 for Instagram Story: the visitor's sky, the wordmark, the countdown under it, then Senja di Pakem.
  // Nothing important sits in the top 220px or the bottom 280px, where Instagram draws its own bars.
  function drawStory() {
    const at = Date.now();
    const { canvas, ctx } = paintNight(1080, 1920, { starCount: 210, starDepth: 1300, hills: [-1177, 1033, 1.7], shade: [540, 960, 720], sky: [150, 220, 780, 520], mark: [150, 540, 900, 1038] });
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
      if (name) card.setAttribute('aria-label', `${name}, membuka tab baru`); // the visible name comes first (label in name)
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
    const cx = 18 - w, cy = 1 - h, sx = cx - 30 - Math.random() * 40, sy = cy - 50 - Math.random() * 30; // perches on the top edge, left, clear of the logo and the link arrow
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
