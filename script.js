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

  /* ============================================================
     STAFF PORTRAIT HOVER — GSAP diagonal clip-path reveal.

     The base image stays put. On hover, a wrapper containing the hover
     image opens via clip-path from the cursor's entry corner, sweeping
     across the portrait. The hover image starts at scale 1.08 and settles
     to 1.00 across the reveal, giving the impression of the image
     resolving into place. The base image scales 1.03 in the same direction,
     so motion is unified rather than feeling like two layers.

     No-GSAP, no-hover, and reduced-motion all fall back gracefully — CSS
     handles them. We add `body.js-gsap-ready` only when GSAP is loaded
     and we're on a hover-capable device that isn't reduced-motion. */

  function initStaffHover() {
    if (reducedMotion || isTouch) return;
    if (typeof window.gsap === 'undefined') return;

    const cards = document.querySelectorAll('.staff-card');
    if (!cards.length) return;

    document.body.classList.add('js-gsap-ready');

    cards.forEach((card) => {
      const wrap = card.querySelector('.photo-hover-wrap');
      const baseImg = card.querySelector('.photo-base');
      const hoverImg = card.querySelector('.photo-hover-img');
      if (!wrap || !baseImg || !hoverImg) return;

      // Reset state: hover wrap fully clipped, hover image slightly oversized.
      gsap.set(wrap, { clipPath: 'polygon(100% 0%, 100% 0%, 100% 0%, 100% 0%)' });
      gsap.set(hoverImg, { scale: 1.08, transformOrigin: 'center center' });
      gsap.set(baseImg, { scale: 1, transformOrigin: 'center center' });

      let entryCorner = 'tr'; // top-right by default
      let tl = null;

      // Determine which corner the cursor came from on enter.
      // The clip-path will open from that corner diagonally to the opposite.
      card.addEventListener('mouseenter', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const inLeftHalf = x < rect.width / 2;
        const inTopHalf  = y < rect.height / 2;
        entryCorner = (inTopHalf ? 't' : 'b') + (inLeftHalf ? 'l' : 'r');

        // Define start and end clip-path polygons based on entry corner.
        // We want the reveal to sweep diagonally across the whole image.
        const clips = {
          // Sweep from top-right corner to bottom-left.
          'tr': {
            from: 'polygon(100% 0%, 100% 0%, 100% 0%, 100% 0%)',
            to:   'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            baseShift: { x: -8, y: 4 },
          },
          // Sweep from top-left.
          'tl': {
            from: 'polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%)',
            to:   'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            baseShift: { x: 8, y: 4 },
          },
          // Sweep from bottom-right.
          'br': {
            from: 'polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)',
            to:   'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            baseShift: { x: -8, y: -4 },
          },
          // Sweep from bottom-left.
          'bl': {
            from: 'polygon(0% 100%, 0% 100%, 0% 100%, 0% 100%)',
            to:   'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            baseShift: { x: 8, y: -4 },
          },
        };
        const c = clips[entryCorner];

        // Kill any in-flight timeline so rapid hover doesn't queue up.
        if (tl) tl.kill();

        // Snap to start state, then animate to revealed state.
        gsap.set(wrap, { clipPath: c.from });

        tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
          .to(wrap, {
            clipPath: c.to,
            duration: 0.85,
          }, 0)
          .to(hoverImg, {
            scale: 1.0,
            duration: 1.1,
            ease: 'expo.out',
          }, 0)
          .to(baseImg, {
            scale: 1.03,
            x: c.baseShift.x,
            y: c.baseShift.y,
            duration: 1.1,
            ease: 'expo.out',
          }, 0);
      });

      card.addEventListener('mouseleave', () => {
        // Reverse, but faster — exit should feel light, not laboured.
        if (tl) tl.kill();
        const c = {
          'tr': 'polygon(100% 0%, 100% 0%, 100% 0%, 100% 0%)',
          'tl': 'polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%)',
          'br': 'polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)',
          'bl': 'polygon(0% 100%, 0% 100%, 0% 100%, 0% 100%)',
        }[entryCorner];

        tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } })
          .to(wrap, { clipPath: c, duration: 0.5 }, 0)
          .to(hoverImg, { scale: 1.08, duration: 0.55 }, 0)
          .to(baseImg, { scale: 1, x: 0, y: 0, duration: 0.55 }, 0);
      });
    });
  }

  // GSAP may load asynchronously. If it's already there at this point, run
  // immediately. Otherwise wait briefly and check again, then give up.
  function whenGsapReady(maxWaitMs, cb) {
    if (typeof window.gsap !== 'undefined') return cb();
    const start = performance.now();
    const tick = () => {
      if (typeof window.gsap !== 'undefined') return cb();
      if (performance.now() - start > maxWaitMs) return; // give up; CSS fallback handles it
      requestAnimationFrame(tick);
    };
    tick();
  }

  whenGsapReady(2000, initStaffHover);

})();
