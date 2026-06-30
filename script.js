/* ════════════════════════════════════════════════════
   THE IRON LEAF — GLOBAL SCRIPT
   Shared interactive behaviour used across every page:
   scroll reveal, mobile nav toggle, sticky sub-nav active
   state, FAQ accordions, generic filter/search bars, and
   newsletter form handling. Page-specific logic (the
   Get Started assessment engine, Library tab data, etc.)
   stays inline in each page's own <script> block.
   ════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── SCROLL REVEAL ─────────────────────────────────
     Any element with class="reveal" fades/slides in once
     it enters the viewport. Staggers slightly within
     batches of simultaneously-visible elements. */
  function initScrollReveal() {
    const revealEls = document.querySelectorAll('.reveal');
    if (!revealEls.length) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), (i % 5) * 70);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.07 });

    revealEls.forEach((el) => obs.observe(el));
  }

  /* ─── MOBILE NAV HAMBURGER ──────────────────────────
     Toggles aria-expanded; pages that implement a full
     mobile menu panel can listen for this same button. */
  function initMobileNav() {
    const hamburger = document.querySelector('.nav-hamburger');
    if (!hamburger) return;
    hamburger.addEventListener('click', () => {
      const expanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!expanded));
    });
  }

  /* ─── STICKY PILLAR SUB-NAV: ACTIVE SECTION HIGHLIGHT ──
     Long-form pillar pages (Nutrition, Strength, Mobility,
     Recovery, Longevity, Trail Running, Plant-Based Living)
     use a sticky .pillar-nav with .pillar-nav-link[data-section]
     entries that track which <section id="..."> is in view. */
  function initPillarNavActiveState() {
    const navLinks = document.querySelectorAll('.pillar-nav-link[data-section]');
    if (!navLinks.length) return;

    const sections = document.querySelectorAll('section[id]');
    if (!sections.length) return;

    const navHeight = 68; // var(--nav-h)
    const subNavHeight = 44; // approximate height of the sticky pillar-nav bar

    const sectionObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.classList.toggle('active', link.dataset.section === entry.target.id);
          });
        }
      });
    }, { rootMargin: `-${navHeight + subNavHeight}px 0px -60% 0px` });

    sections.forEach((s) => sectionObs.observe(s));
  }

  /* ─── FAQ / ACCORDION TOGGLES ───────────────────────
     Works for both `.faq-item` (button.faq-q) and
     `.scenario-item` (button.scenario-toggle) patterns,
     since both follow the same open/close structure. */
  function initAccordions() {
    function wireGroup(buttonSelector, itemClass) {
      const buttons = document.querySelectorAll(buttonSelector);
      if (!buttons.length) return;
      buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const item = btn.closest('.' + itemClass);
          if (!item) return;
          const isOpen = item.classList.contains('open');
          document.querySelectorAll('.' + itemClass).forEach((i) => i.classList.remove('open'));
          document.querySelectorAll(buttonSelector).forEach((b) => b.setAttribute('aria-expanded', 'false'));
          if (!isOpen) {
            item.classList.add('open');
            btn.setAttribute('aria-expanded', 'true');
          }
        });
      });
    }
    wireGroup('.faq-q', 'faq-item');
    wireGroup('.scenario-toggle', 'scenario-item');
  }

  /* ─── GENERIC CARD FILTER + SEARCH ──────────────────
     Wires any `.filter-bar` containing `.filter-chip[data-filter]`
     buttons and an optional `input[type="search"]` to show/hide
     sibling cards matching `data-category` (or fall back to
     `data-cat`) plus a free-text match against card textContent.
     Looks for cards via a configurable list of common card
     classes so this works across guides.html, research.html, etc.
     without per-page JS duplication. */
  function initGenericFilters() {
    const filterBars = document.querySelectorAll('.filter-bar');
    if (!filterBars.length) return;

    const cardSelectors = [
      '.guide-card', '.research-card', '.db-card', '.tracker-card'
    ].join(', ');

    filterBars.forEach((bar) => {
      const chips = bar.querySelectorAll('.filter-chip');
      const searchInput = bar.querySelector('input[type="search"]');
      if (!chips.length) return;

      // Find the nearest following section that contains cards
      let container = bar.nextElementSibling;
      while (container && !container.querySelector(cardSelectors)) {
        container = container.nextElementSibling;
      }
      if (!container) return;

      const cards = container.querySelectorAll(cardSelectors);
      const countEl = container.querySelector('[id$="Count"], .guides-count, .research-count, .lib-count');
      let activeFilter = 'all';

      function applyFilters() {
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        let visible = 0;
        cards.forEach((card) => {
          const cat = card.dataset.category || card.dataset.cat || 'all';
          const matchesFilter = activeFilter === 'all' || cat === activeFilter;
          const text = card.textContent.toLowerCase();
          const matchesSearch = query === '' || text.includes(query);
          const show = matchesFilter && matchesSearch;
          card.classList.toggle('hidden', !show);
          if (show) visible += 1;
        });
        if (countEl) {
          const total = cards.length;
          countEl.textContent = visible === total
            ? `Showing all ${total}`
            : `Showing ${visible} of ${total}`;
        }
      }

      chips.forEach((chip) => {
        chip.addEventListener('click', () => {
          chips.forEach((c) => c.classList.remove('active'));
          chip.classList.add('active');
          activeFilter = chip.dataset.filter || 'all';
          applyFilters();
        });
      });

      if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
      }
    });
  }

  /* ─── NEWSLETTER / EMAIL FORM HANDLER ───────────────
     Wires `.nl-form` and `.email-row` (the two markup
     patterns used across pages) to a lightweight client-
     side success state. No real submission endpoint. */
  function initNewsletterForms() {
    const forms = document.querySelectorAll('.nl-form, .email-row');
    forms.forEach((form) => {
      const btn = form.querySelector('button');
      const input = form.querySelector('input[type="email"], input');
      if (!btn || !input) return;

      btn.addEventListener('click', () => {
        if (input.value && input.value.includes('@')) {
          btn.textContent = 'Welcome.';
          btn.style.background = 'var(--moss)';
          input.disabled = true;
        } else {
          const errorColor = 'var(--amber)';
          if (form.classList.contains('email-row')) {
            input.style.borderColor = errorColor;
            setTimeout(() => { input.style.borderColor = ''; }, 1800);
          } else {
            input.style.outline = `1px solid ${errorColor}`;
            setTimeout(() => { input.style.outline = ''; }, 1800);
          }
        }
      });
    });
  }

  /* ─── INIT ───────────────────────────────────────────
     Runs once the DOM is ready. Each init function is
     defensive (checks for the relevant elements before
     wiring anything), so this is safe to load on every
     page regardless of which components are present. */
  function init() {
    initScrollReveal();
    initMobileNav();
    initPillarNavActiveState();
    initAccordions();
    initGenericFilters();
    initNewsletterForms();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
