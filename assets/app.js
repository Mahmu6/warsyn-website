(() => {
  const root = document.documentElement;
  root.classList.add('js-enabled');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.primary-nav');

  const setHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 12);
  setHeader();
  window.addEventListener('scroll', setHeader, { passive: true });

  if (menuButton && nav) {
    const closeMenu = () => {
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', root.lang === 'ar' ? 'فتح القائمة' : 'Open navigation');
      nav.classList.remove('is-open');
    };
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? (root.lang === 'ar' ? 'إغلاق القائمة' : 'Close navigation') : (root.lang === 'ar' ? 'فتح القائمة' : 'Open navigation'));
      nav.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
  }

  const languageLink = document.querySelector('.primary-nav .language-link');
  if (languageLink) languageLink.href = root.lang === 'ar' ? '../index.html' : 'ar/index.html';

  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    root.classList.add('js-motion');
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
  }

  const canvas = document.querySelector('.network-canvas');
  if (!canvas || !canvas.getContext) return;
  const context = canvas.getContext('2d');
  if (!context) return;
  const hero = canvas.closest('.hero');
  let width = 0;
  let height = 0;
  let nodes = [];
  let frame = 0;
  let active = false;
  const pointer = { x: -1000, y: -1000 };
  const colors = [[34, 211, 238], [124, 92, 255]];
  const random = (min, max) => min + Math.random() * (max - min);

  const resize = () => {
    const rect = hero.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.max(30, Math.min(45, Math.round(width / 30)));
    nodes = Array.from({ length: count }, () => ({ x: random(0, width), y: random(0, height), vx: random(-.13, .13), vy: random(-.12, .12), r: random(1, 2.2) }));
    draw(false);
  };
  const draw = (move) => {
    context.clearRect(0, 0, width, height);
    if (move) {
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
      });
    }
    for (let i = 0; i < nodes.length; i += 1) {
      const a = nodes[i];
      const cursorDistance = Math.hypot(a.x - pointer.x, a.y - pointer.y);
      for (let j = i + 1; j < nodes.length; j += 1) {
        const b = nodes[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance < 145) {
          const glow = cursorDistance < 170 ? 1 - cursorDistance / 170 : 0;
          const alpha = .12 + (1 - distance / 145) * .22 + glow * .35;
          const color = glow > .35 ? colors[1] : colors[0];
          context.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.stroke();
        }
      }
      context.fillStyle = cursorDistance < 150 ? 'rgba(197, 246, 255, .8)' : 'rgba(174, 190, 215, .58)';
      context.beginPath();
      context.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      context.fill();
    }
    if (move && active && !reducedMotion.matches) frame = window.requestAnimationFrame(() => draw(true));
  };
  const start = () => { if (!active && !reducedMotion.matches) { active = true; draw(true); } };
  const stop = () => { active = false; window.cancelAnimationFrame(frame); draw(false); };

  resize();
  window.addEventListener('resize', resize, { passive: true });
  hero.addEventListener('pointermove', (event) => {
    const rect = hero.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointer.x = -1000; pointer.y = -1000; }, { passive: true });
  if ('IntersectionObserver' in window) {
    const visibilityObserver = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting ? start() : stop()), { threshold: 0 });
    visibilityObserver.observe(hero);
  } else start();
  reducedMotion.addEventListener?.('change', () => reducedMotion.matches ? stop() : start());
  if (reducedMotion.matches) draw(false);
})();
