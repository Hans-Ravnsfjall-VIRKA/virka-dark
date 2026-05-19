/* VIRKA — interactions */
(function () {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;

  /* ---------- Header bg toggle ---------- */
  const header = document.querySelector('.site-header');
  if (header) {
    let raf = false;
    const update = () => {
      header.classList.toggle('bg', window.scrollY > 80);
      raf = false;
    };
    update();
    window.addEventListener('scroll', () => {
      if (!raf) { requestAnimationFrame(update); raf = true; }
    }, { passive: true });
  }

  /* ---------- Theme toggle ----------
     Preference stored in a cookie named "virka-theme" (dark | light).
     A pre-paint script in <head> already applied the cookie value to
     <html data-theme="..."> before paint. Here we just wire the button. */
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    const setTheme = (theme) => {
      if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      // Cookie: 1 year, SameSite=Lax, path=/.
      // Using max-age (in seconds) is more reliable than expires.
      document.cookie = 'virka-theme=' + theme + '; path=/; max-age=31536000; SameSite=Lax';
    };
    themeToggle.addEventListener('click', () => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      setTheme(isLight ? 'dark' : 'light');
    });
  }

  /* ---------- Mobile menu ---------- */
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const mobileNavClose = document.querySelector('.mobile-nav-close');

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', () => {
      mobileNav.dataset.open = 'true';
      document.body.style.overflow = 'hidden';
    });
  }
  if (mobileNavClose && mobileNav) {
    mobileNavClose.addEventListener('click', () => {
      mobileNav.dataset.open = 'false';
      document.body.style.overflow = '';
    });
  }
  if (mobileNav) {
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileNav.dataset.open = 'false';
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- Spotlight hero ---------- */
  const hero = document.querySelector('.hero');
  const cursor = document.querySelector('.hero-cursor');

  if (hero && !reducedMotion) {
    let targetX = 50, targetY = 50;
    let currentX = 50, currentY = 50;
    let pageX = window.innerWidth / 2, pageY = window.innerHeight / 2;
    let lastMove = 0;

    const setVars = () => {
      hero.style.setProperty('--mx', currentX + '%');
      hero.style.setProperty('--my', currentY + '%');
      if (cursor) {
        cursor.style.transform =
          `translate3d(${pageX}px, ${pageY}px, 0) translate(-50%, -50%)`;
      }
    };

    const tick = (t) => {
      const k = 0.18;
      currentX += (targetX - currentX) * k;
      currentY += (targetY - currentY) * k;

      const idle = (t - lastMove) > 1600;
      if (idle && !isTouch) {
        const a = t / 5000;
        const ox = 50 + Math.cos(a) * 22;
        const oy = 50 + Math.sin(a * 0.85) * 18;
        targetX += (ox - targetX) * 0.04;
        targetY += (oy - targetY) * 0.04;
      }

      setVars();
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);

    if (!isTouch) {
      hero.addEventListener('mouseenter', () => cursor && cursor.classList.add('show'));
      hero.addEventListener('mouseleave', () => {
        if (cursor) cursor.classList.remove('show');
        targetX = 50; targetY = 50;
      });

      hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        targetX = ((e.clientX - rect.left) / rect.width)  * 100;
        targetY = ((e.clientY - rect.top)  / rect.height) * 100;
        pageX = e.clientX;
        pageY = e.clientY;
        lastMove = performance.now();
      });

      const heroLinks = hero.querySelectorAll('a, button');
      heroLinks.forEach(l => {
        l.addEventListener('mouseenter', () => cursor && cursor.classList.add('over-link'));
        l.addEventListener('mouseleave', () => cursor && cursor.classList.remove('over-link'));
      });
    }
  }

  /* ---------- Reveal on scroll ---------- */
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const reveals = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.10, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
  }

  /* ---------- Pause off-screen videos ---------- */
  if ('IntersectionObserver' in window) {
    const videos = document.querySelectorAll('video[autoplay]');
    if (videos.length) {
      const vio = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          const v = e.target;
          if (e.isIntersecting) { v.play().catch(() => {}); }
          else                  { v.pause(); }
        });
      }, { threshold: 0.1 });
      videos.forEach(v => vio.observe(v));
    }
  }

  /* ============================================================
     STARVSFÓLK overlay
     ============================================================ */
  const overlay = document.getElementById('starvsfolk');
  if (overlay) {
    const closeBtn = overlay.querySelector('.staff-overlay-close');
    const scrim    = overlay.querySelector('.staff-overlay-scrim');

    const openOverlay = () => {
      overlay.dataset.open = 'true';
      document.body.classList.add('overlay-open');
      setTimeout(() => overlay.focus(), 50);
    };

    const closeOverlay = (e) => {
      if (e) e.preventDefault();
      overlay.dataset.open = 'false';
      document.body.classList.remove('overlay-open');
      if (location.hash === '#starvsfolk') {
        history.replaceState(null, '', location.pathname + location.search);
      }
    };

    document.querySelectorAll('a[href="#starvsfolk"], a[href$="#starvsfolk"]').forEach(a => {
      a.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        history.pushState(null, '', '#starvsfolk');
        openOverlay();
      });
    });

    if (location.hash === '#starvsfolk') setTimeout(openOverlay, 100);

    if (closeBtn) closeBtn.addEventListener('click', closeOverlay);
    if (scrim)    scrim.addEventListener('click', closeOverlay);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.dataset.open === 'true') closeOverlay();
    });

    window.addEventListener('popstate', () => {
      if (location.hash === '#starvsfolk') openOverlay();
      else if (overlay.dataset.open === 'true') {
        overlay.dataset.open = 'false';
        document.body.classList.remove('overlay-open');
      }
    });
  }


})();
