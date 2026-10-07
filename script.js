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
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-revealed');
    entry.target.dispatchEvent(new CustomEvent('reveal'));
    reveal.unobserve(entry.target);
  }), { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('[data-reveal]').forEach(element => reveal.observe(element));
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

// The theme statement and its four cards point at each other: a phrase lights its card, and a card lights its phrase.
(() => {
  const terms = [...document.querySelectorAll('.theme-term')];
  const pillars = [...document.querySelectorAll('.theme-pillar')];
  let pinned = null;
  const show = key => {
    terms.forEach(term => term.classList.toggle('is-active', term.dataset.term === key));
    pillars.forEach(pillar => pillar.classList.toggle('is-active', pillar.dataset.term === key));
  };
  // The phrases are inline spans so their underline wraps with the sentence; Enter and Space work like a button.
  terms.forEach(term => term.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    term.click();
  }));
  terms.forEach(term => term.addEventListener('click', () => {
    pinned = pinned === term.dataset.term ? null : term.dataset.term;
    terms.forEach(item => item.setAttribute('aria-pressed', String(item.dataset.term === pinned)));
    show(pinned);
    const pillar = pillars.find(item => item.dataset.term === pinned);
    if (!pillar) return;
    const rect = pillar.getBoundingClientRect();
    if (rect.top < 70 || rect.bottom > innerHeight) pillar.scrollIntoView({ block: 'center', behavior: motionAllowed() ? 'smooth' : 'auto' });
  }));
  pillars.forEach(pillar => {
    pillar.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') show(pillar.dataset.term); });
    pillar.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') show(pinned); });
  });
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
    current = place;
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

  gmap.querySelector('.gmap-load').addEventListener('click', () => loadMap().focus());
  // The in-panel button scrolls to the Google map and opens it on the chosen kalurahan.
  section.querySelectorAll('.place-button.is-map').forEach(link => link.addEventListener('click', () => loadMap()));
  viewButtons.forEach(button => button.addEventListener('click', () => {
    view = button.dataset.view;
    viewButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    loadMap();
  }));
  select(placeTabs[0].dataset.place);
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
