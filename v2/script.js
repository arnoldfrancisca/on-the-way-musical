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
    dialog.showModal();
  }));
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => lastTrigger && lastTrigger.focus());

  /* Follow spot: reveals the golden photo under the cobalt print */
  const stage = document.getElementById('stage');
  const frame = stage.querySelector('.stage__frame');
  const TARGETS = {
    reiziger: { x: 44, y: 56, r: 0.34 },
    kruis: { x: 87, y: 43, r: 0.22 },
    lampen: { x: 9, y: 16, r: 0.32 },
    zaal: { x: 50, y: 50, r: 1.6 },
  };
  const spotButtons = [...stage.querySelectorAll('[data-spot]')];
  function aim(x, y, r) {
    stage.style.setProperty('--sx', `${x}%`);
    stage.style.setProperty('--sy', `${y}%`);
    stage.style.setProperty('--r', `${Math.round(frame.clientWidth * r)}px`);
  }
  function select(name) {
    stage.dataset.target = name;
    const t = TARGETS[name];
    aim(t.x, t.y, t.r);
    spotButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.spot === name)));
  }
  spotButtons.forEach(b => b.addEventListener('click', () => select(b.dataset.spot)));
  function track(e) {
    const r = frame.getBoundingClientRect();
    stage.classList.add('is-tracking');
    aim(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100, TARGETS[stage.dataset.target === 'zaal' ? 'reiziger' : stage.dataset.target].r);
  }
  frame.addEventListener('pointermove', track);
  frame.addEventListener('pointerdown', track);
  frame.addEventListener('pointerleave', () => { stage.classList.remove('is-tracking'); select(stage.dataset.target); });
  select('reiziger');
  addEventListener('resize', () => select(stage.dataset.target));

  /* Cast billing: one role at a time in the spot */
  const roles = [...document.querySelectorAll('[data-billing] button')];
  roles.forEach(btn => btn.addEventListener('click', () => {
    const on = btn.getAttribute('aria-pressed') !== 'true';
    roles.forEach(b => b.setAttribute('aria-pressed', String(on && b === btn)));
  }));

  /* Scroll-linked type drift */
  const drifters = [...document.querySelectorAll('[data-drift]')];
  let ticking = false;
  function drift() {
    ticking = false;
    if (reduce.matches) return;
    const mid = innerHeight / 2;
    drifters.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      const base = el.classList.contains('drift--outline') ? -30 : 0;
      el.style.transform = `translate3d(calc(${base}% + ${((r.top + r.height / 2 - mid) * el.dataset.drift).toFixed(1)}px), 0, 0)`;
    });
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(drift); } }, { passive: true });
  drift();
  reduce.addEventListener('change', () => { drifters.forEach(el => { el.style.transform = ''; }); drift(); });

  if (!('IntersectionObserver' in window)) return;

  /* Current section on the rail */
  const links = new Map([...document.querySelectorAll('.rail__nav a')].map(a => [a.hash.slice(1), a]));
  const spy = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    links.forEach(a => { a.classList.remove('is-current'); a.removeAttribute('aria-current'); });
    const a = links.get(en.target.id);
    if (a) { a.classList.add('is-current'); a.setAttribute('aria-current', 'location'); }
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((_, id) => { const el = document.getElementById(id); if (el) spy.observe(el); });

  /* Reveal: enhancement only, content starts dimmed but readable */
  if (reduce.matches) return;
  root.classList.add('js-reveal');
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
})();
