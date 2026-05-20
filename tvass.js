/* VIRKA — Jazz og Tvass page reveal logic.

   Each .post element has a data-tilt attribute (e.g. "-0.4"). We set its
   --tilt CSS variable accordingly, so the card sits at its tilt angle
   in the layout. On scroll into view, the card animates from
   opacity:0 / translateY(20px) to opacity:1 / translateY(0) while keeping
   the tilt. The effect is a feed that drifts gently into place as you scroll. */

(function () {
  'use strict';

  if (!document.body.classList.contains('page-tvass')) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isNarrow = window.matchMedia('(max-width: 540px)').matches;

  // Set the --tilt CSS variable on every post from its data-tilt attribute.
  // 1 unit ≈ 1 degree. On narrow viewports we skip tilt to avoid layout wobble.
  document.querySelectorAll('.post').forEach((card) => {
    const tilt = isNarrow ? 0 : parseFloat(card.dataset.tilt || '0');
    card.style.setProperty('--tilt', tilt + 'deg');
  });

  // Reduced motion: reveal everything statically, skip GSAP.
  if (reducedMotion) {
    document.querySelectorAll('.post').forEach((c) => c.classList.add('is-revealed'));
    return;
  }

  // Wait for GSAP + ScrollTrigger.
  function whenReady(maxMs, cb) {
    const start = performance.now();
    const tick = () => {
      if (typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined') {
        window.gsap.registerPlugin(window.ScrollTrigger);
        return cb();
      }
      if (performance.now() - start > maxMs) {
        // Fall back: reveal everything statically.
        document.querySelectorAll('.post').forEach((c) => c.classList.add('is-revealed'));
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  }

  whenReady(3000, init);

  function init() {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;

    const cards = gsap.utils.toArray('.post');

    cards.forEach((card) => {
      // Each card gets its own ScrollTrigger so the reveal tracks scroll.
      ScrollTrigger.create({
        trigger: card,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          // Slight per-card duration variation so the feed feels alive,
          // not metronome-mechanical. Random within a tight band.
          const dur = 0.9 + Math.random() * 0.4;
          const delay = Math.random() * 0.08;
          gsap.to(card, {
            opacity: 1,
            y: 0,
            duration: dur,
            delay: delay,
            ease: 'expo.out',
            onStart: () => card.classList.add('is-revealed'),
          });
        },
      });
    });

    // Safety: refresh on resize.
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
    });
  }
})();
