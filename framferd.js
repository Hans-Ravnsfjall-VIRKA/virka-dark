/* VIRKA — Tilgongd page scrollytelling.

   Architecture:
   - Each .stage-verb section is PINNED via ScrollTrigger while the user
     scrolls one viewport's worth of distance through it.
   - During that pinned scroll, the verb word scales up from a starting
     size, holds, then scales-and-fades out.
   - The conclusion paragraph reveals line by line via clip-path masking,
     with a deliberate pause before the final line so it lands as a
     statement rather than a third item in a list.
   - The page background stays at the standard dark ink-blue throughout.

   Reduced motion: skip every scroll-pinned animation, show the page as a
   straightforward vertical scroll. Static is still readable, the page
   works without the choreography.
*/

(function () {
  'use strict';

  // Only run on the framferð page.
  if (!document.body.classList.contains('page-framferd')) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // If reduced motion, just reveal the prose lines statically and bail.
  if (reducedMotion) {
    document.querySelectorAll('.stage-prose .line').forEach(l => {
      l.style.opacity = '1';
      l.style.transform = 'none';
      l.style.clipPath = 'none';
    });
    return;
  }

  // Wait for GSAP + ScrollTrigger to be ready.
  function whenReady(maxMs, cb) {
    const start = performance.now();
    const tick = () => {
      if (typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined') {
        window.gsap.registerPlugin(window.ScrollTrigger);
        return cb();
      }
      if (performance.now() - start > maxMs) {
        // Give up — page still works without the choreography.
        document.querySelectorAll('.stage-prose .line').forEach(l => {
          l.style.opacity = '1';
          l.style.transform = 'none';
          l.style.clipPath = 'none';
        });
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

    // ===== Stage 0: opening lede ===
    // Simple fade-up reveal on entry, no pinning.
    gsap.from('.stage-intro .stage-lede', {
      opacity: 0,
      y: 24,
      duration: 1.2,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: '.stage-intro',
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    });

    gsap.from('.stage-intro .stage-cue', {
      opacity: 0,
      y: 12,
      duration: 1,
      delay: 0.5,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: '.stage-intro',
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    });

    // ===== Stages 1–5: pinned giant verbs ===
    // Each verb section pins itself while the user scrolls one viewport
    // through it. During that pin, the word scales up and fades out.

    const verbStages = document.querySelectorAll('.stage-verb');
    verbStages.forEach((section) => {
      const word = section.querySelector('.stage-word');
      const caption = section.querySelector('.stage-caption');
      const eyebrow = section.querySelector('.stage-eyebrow');
      const number = section.querySelector('.stage-number');

      // Initial state — slightly small, fully opaque.
      gsap.set(word, { scale: 0.85, opacity: 0, transformOrigin: '50% 50%' });
      gsap.set([eyebrow, caption, number], { opacity: 0, y: 16 });

      // Entry timeline: when the section comes into view, the word
      // grows to full size and the supporting copy fades in.
      const entryTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 70%',
          end: 'top 30%',
          scrub: 0.6,
        },
      });
      entryTl
        .to(number, { opacity: 1, y: 0, duration: 0.4 }, 0)
        .to(eyebrow, { opacity: 1, y: 0, duration: 0.4 }, 0.05)
        .to(word, { scale: 1, opacity: 1, duration: 0.6, ease: 'power2.out' }, 0)
        .to(caption, { opacity: 1, y: 0, duration: 0.4 }, 0.2);

      // Exit timeline: as the section scrolls out the bottom, the word
      // continues to scale up huge and fade, like it's filling the screen
      // and dissolving. The caption fades earlier.
      const exitTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'bottom 75%',
          end: 'bottom 25%',
          scrub: 0.6,
        },
      });
      exitTl
        .to(caption, { opacity: 0, y: -16, duration: 0.3 }, 0)
        .to(eyebrow, { opacity: 0, y: -8, duration: 0.3 }, 0.05)
        .to(number, { opacity: 0, duration: 0.3 }, 0)
        .to(word, { scale: 1.45, opacity: 0, duration: 0.6, ease: 'power2.in' }, 0);
    });

    // ===== Stage 6: the conclusion — clip-path unveiling reveal ===
    // Each line uncovers from top to bottom via clip-path, then the final
    // line (which has its own visual separator above) lands with a longer
    // beat after the two preceding parallels. The pacing is deliberate:
    // statement, statement, [breath], conclusion.
    const proseLines = gsap.utils.toArray('.stage-prose .line');
    proseLines.forEach((line, idx) => {
      const isFinal = line.classList.contains('line-final');
      // First two lines: 0s and 0.55s. The final line waits an extra
      // beat (1.3s) so the contrast lands as a separate statement, not a
      // third item in a list.
      const delay = isFinal ? 1.3 : idx * 0.55;
      const duration = isFinal ? 1.4 : 1.0;

      gsap.to(line, {
        opacity: 1,
        y: 0,
        clipPath: 'inset(0 0 0% 0)',
        duration: duration,
        delay: delay,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: '.stage-prose',
          start: 'top 60%',
          toggleActions: 'play none none reverse',
        },
      });
    });

    // ===== Stage 7: CTA fade up ===
    gsap.from('.stage-cta .cta-eyebrow', {
      opacity: 0,
      y: 16,
      duration: 0.9,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: '.stage-cta',
        start: 'top 70%',
        toggleActions: 'play none none reverse',
      },
    });

    gsap.from('.stage-cta .cta-title', {
      opacity: 0,
      y: 32,
      duration: 1.1,
      delay: 0.15,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: '.stage-cta',
        start: 'top 70%',
        toggleActions: 'play none none reverse',
      },
    });

    gsap.from('.stage-cta .cta-foot', {
      opacity: 0,
      y: 16,
      duration: 0.9,
      delay: 0.45,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: '.stage-cta',
        start: 'top 70%',
        toggleActions: 'play none none reverse',
      },
    });

    // Refresh on resize for safety.
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
    });
  }
})();
