(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  /* Ticket dialog: demo only, no booking */
  const dialog = document.getElementById('ticket-dialog');
  let lastTrigger = null;
  document.querySelectorAll('[data-ticket]').forEach(el => el.addEventListener('click', e => {
    if (!dialog.showModal) return; // without <dialog> support the #tickets anchor still works
    e.preventDefault();
    lastTrigger = el;
    closeNav();
    dialog.showModal();
  }));
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => lastTrigger && lastTrigger.focus());

  /* Mobile navigation */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  function closeNav() {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  toggle.addEventListener('click', () => toggle.setAttribute('aria-expanded', String(nav.classList.toggle('is-open'))));
  nav.querySelectorAll('ul a').forEach(a => a.addEventListener('click', closeNav));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { closeNav(); toggle.focus(); }
  });

  /* Light switch */
  const hero = document.querySelector('.hero');
  const lightButtons = [...document.querySelectorAll('[data-light-set]')];
  lightButtons.forEach(btn => btn.addEventListener('click', () => {
    hero.dataset.light = btn.dataset.lightSet;
    lightButtons.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
  }));

  /* Pin the sun glow behind the cross for whatever crop object-fit produces */
  const frame = hero.querySelector('.hero__frame');
  const photo = hero.querySelector('.hero__photo');
  function placeSun() {
    const { width: w, height: h } = frame.getBoundingClientRect();
    const [px, py] = getComputedStyle(photo).objectPosition.split(' ').map(v => parseFloat(v) / 100);
    const s = Math.max(w / 1024, h / 1536);
    frame.style.setProperty('--sun-x', `${(w - 1024 * s) * px + 905 * s}px`);
    frame.style.setProperty('--sun-y', `${(h - 1536 * s) * py + 690 * s}px`);
  }
  placeSun();
  addEventListener('resize', placeSun);

  /* Warm light follows the pointer */
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--mx', `${e.clientX - r.left}px`);
    hero.style.setProperty('--my', `${e.clientY - r.top}px`);
  });

  /* Scroll: header state, reel progress, hero parallax */
  const header = document.querySelector('.site-header');
  const reel = document.querySelector('.reel');
  const parallax = [...document.querySelectorAll('[data-parallax]')];
  let ticking = false;
  function onScroll() {
    ticking = false;
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    const max = document.documentElement.scrollHeight - innerHeight;
    reel.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);
    if (reduce.matches) return;
    if (y < innerHeight * 1.2) parallax.forEach(el => { el.style.transform = `translate3d(0, ${(y * el.dataset.parallax).toFixed(1)}px, 0)`; });
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  reduce.addEventListener('change', () => { parallax.forEach(el => { el.style.transform = ''; }); onScroll(); });

  if (!('IntersectionObserver' in window)) return;

  /* Current section in the nav */
  const links = new Map([...nav.querySelectorAll('ul a')].map(a => [a.hash.slice(1), a]));
  const spy = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    links.forEach(a => a.classList.remove('is-current'));
    links.get(en.target.id)?.classList.add('is-current');
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((_, id) => { const el = document.getElementById(id); if (el) spy.observe(el); });

  /* Story camera: each shot steers the sticky frame */
  const cam = document.querySelector('.camera__frame');
  const camLabel = cam.querySelector('[data-shot-label]');
  const shotNames = ['Shot 00 · Totaal', 'Shot 01 · De rugzak', 'Shot 02 · Lampen in de lucht', 'Shot 03 · De top'];
  const shotIO = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    const n = en.target.dataset.shotTarget;
    cam.dataset.shot = n;
    camLabel.textContent = shotNames[n];
  }), { rootMargin: '-40% 0px -40% 0px' });
  document.querySelectorAll('[data-shot-target]').forEach(el => shotIO.observe(el));
  new IntersectionObserver(([en]) => {
    if (!en.isIntersecting && en.boundingClientRect.top > 0) { cam.dataset.shot = '0'; camLabel.textContent = shotNames[0]; }
  }).observe(document.querySelector('.shots'));

  /* Filmstrip buttons */
  const strip = document.querySelector('.filmstrip');
  document.querySelectorAll('[data-strip]').forEach(btn => btn.addEventListener('click', () => {
    strip.scrollBy({ left: Number(btn.dataset.strip) * strip.clientWidth * 0.75, behavior: reduce.matches ? 'auto' : 'smooth' });
  }));

  /* Reveal: enhancement only, content starts dimmed but readable */
  if (reduce.matches) return;
  const items = [...document.querySelectorAll('.reveal')];
  root.classList.add('js-reveal');
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  items.forEach(el => io.observe(el));
})();
