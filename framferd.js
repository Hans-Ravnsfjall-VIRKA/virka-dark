/* VIRKA — Framferð page scrollytelling.

   Architecture:
   - Each .stage-verb section is PINNED via ScrollTrigger while the user
     scrolls one viewport's worth of distance through it.
   - During that pinned scroll, the verb word scales up from a starting
     size, holds, then scales-and-fades out.
   - In parallel, the body's --bg-stage CSS variable cross-fades to the
     next colour in the journey.
   - The final philosophy paragraph reveals line by line as it enters view.
   - The CTA stage has its own coloured background payoff.

   Reduced motion: skip every scroll-pinned animation, show the page as a
   straightforward vertical scroll with static colours. Static is still
   readable — the page works without the choreography.
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

    // ===== Background colour journey =====
    // Each stage maps to a colour. As the user scrolls past a stage's
    // midpoint, we ease the body --bg-stage variable to the next colour.

    // OKLCH values chosen to feel like a gradual journey from the
    // standard ink-blue through cooler / warmer steps to amber payoff.
    const stages = [
      { stage: 0, color: 'oklch(13% 0.012 250)' },  // ink blue (intro)
      { stage: 1, color: 'oklch(15% 0.020 235)' },  // cooler blue
      { stage: 2, color: 'oklch(16% 0.022 90)'  },  // warm slate
      { stage: 3, color: 'oklch(17% 0.030 160)' },  // deep moss
      { stage: 4, color: 'oklch(16% 0.040 320)' },  // smoky violet
      { stage: 5, color: 'oklch(18% 0.060 65)'  },  // warm amber-tinted dark
      { stage: 6, color: 'oklch(11% 0.014 250)' },  // almost-black (reveal)
      { stage: 7, color: 'oklch(74% 0.16 60)'   },  // amber wash (payoff)
    ];

    // For each stage transition, register a ScrollTrigger that lerps
    // --bg-stage on body as the stage scrolls into view.
    stages.forEach((s, i) => {
      const section = document.querySelector(`.framferd-stage[data-stage="${s.stage}"]`);
      if (!section) return;

      ScrollTrigger.create({
        trigger: section,
        start: 'top 70%',
        end: 'top 20%',
        onEnter:     () => gsap.to('body.page-framferd', { '--bg-stage': s.color, duration: 1.0, ease: 'power2.out' }),
        onEnterBack: () => gsap.to('body.page-framferd', { '--bg-stage': s.color, duration: 1.0, ease: 'power2.out' }),
      });
    });

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

    // ===== Stage 6: line-by-line reveal of the philosophy paragraph ===
    gsap.utils.toArray('.stage-prose .line').forEach((line, idx) => {
      gsap.to(line, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        delay: idx * 0.12,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: '.stage-prose',
          start: 'top 65%',
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
