(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const NS = 'http://www.w3.org/2000/svg';

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

  /* Sketchbook lightbox */
  const box = document.getElementById('lightbox');
  const boxImg = box.querySelector('img');
  const boxCap = box.querySelector('figcaption');
  let lastSketch = null;
  document.querySelectorAll('[data-lightbox]').forEach(btn => btn.addEventListener('click', () => {
    boxImg.src = btn.dataset.full;
    boxImg.alt = btn.querySelector('img').alt;
    boxCap.textContent = btn.querySelector('.cap').textContent;
    lastSketch = btn;
    box.showModal();
  }));
  box.querySelector('[data-lightbox-close]').addEventListener('click', () => box.close());
  box.addEventListener('click', e => { if (e.target === box) box.close(); });
  box.addEventListener('close', () => lastSketch && lastSketch.focus());

  /* Packing list ticks */
  document.querySelectorAll('.packing button').forEach(b => b.addEventListener('click', () => {
    b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
  }));

  /* Margin route that draws itself while you read */
  const journal = document.querySelector('.journal');
  const svg = journal.querySelector('.route');
  const pencil = svg.querySelector('.route__pencil');
  const ink = svg.querySelector('.route__ink');
  const marks = svg.querySelector('.route__marks');
  const stops = [...journal.querySelectorAll(':scope > section'), document.getElementById('contact')];
  const tabs = new Map([...document.querySelectorAll('.tabs a')].map(a => [a.hash.slice(1), a]));
  const stamps = new Map([...document.querySelectorAll('[data-stamp]')].map(li => [li.dataset.stamp, li]));
  const whereami = document.querySelector('[data-whereami]');
  stamps.forEach(li => li.classList.add('is-waiting'));
  let length = 0;
  let stopY = [];

  function spline(pts) {
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  }

  function build() {
    const w = journal.clientWidth;
    const first = journal.querySelector('.entry');
    const contentLeft = first.getBoundingClientRect().left + parseFloat(getComputedStyle(first).paddingLeft);
    const lane = Math.max(9, contentLeft * 0.45);
    const sway = Math.min(lane * 0.5, 46);
    const top = journal.getBoundingClientRect().top + scrollY;
    stopY = stops.map(s => s.getBoundingClientRect().top + scrollY - top + (s.id === 'contact' ? 40 : 90));
    const pts = [];
    stopY.forEach((y, i) => {
      pts.push([lane + (i % 2 ? sway : -sway * 0.6), y]);
      if (i < stopY.length - 1) pts.push([lane + (i % 2 ? -sway * 0.4 : sway * 0.9), (y + stopY[i + 1]) / 2]);
    });
    svg.setAttribute('viewBox', `0 0 ${w} ${journal.scrollHeight}`);
    const d = spline(pts);
    pencil.setAttribute('d', d);
    ink.setAttribute('d', d);
    length = ink.getTotalLength();
    ink.style.strokeDasharray = `${length} ${length}`;
    marks.replaceChildren(...stopY.map((y, i) => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', pts[i * 2][0]);
      c.setAttribute('cy', y);
      c.setAttribute('r', lane > 30 ? 7 : 4.5);
      return c;
    }));
    update();
  }

  function update() {
    ticking = false;
    const top = journal.getBoundingClientRect().top;
    const reach = innerHeight * 0.65 - top;
    const progress = reduce.matches ? 1 : Math.min(1, Math.max(0, reach / journal.scrollHeight));
    ink.style.strokeDashoffset = (length * (1 - progress)).toFixed(1);
    let current = stops[0];
    stopY.forEach((y, i) => {
      const passed = y <= reach || reduce.matches;
      marks.children[i]?.classList.toggle('is-passed', passed);
      if (y - 90 <= innerHeight * 0.4 - top) current = stops[i];
      const stamp = stamps.get(stops[i].id);
      if (stamp && y <= reach && stamp.classList.contains('is-waiting')) {
        stamp.classList.remove('is-waiting');
        stamp.classList.add('just-stamped');
      }
    });
    whereami.textContent = current.dataset.waypoint;
    tabs.forEach((a, id) => a.classList.toggle('is-current', id === current.id));
  }

  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', build);
  addEventListener('load', build);
  document.fonts?.ready.then(build);
  if ('ResizeObserver' in window) new ResizeObserver(() => build()).observe(journal);
  build();
  reduce.addEventListener('change', update);

  /* Reveal: enhancement only, content starts dimmed but readable */
  if (reduce.matches || !('IntersectionObserver' in window)) return;
  root.classList.add('js-reveal');
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
})();
