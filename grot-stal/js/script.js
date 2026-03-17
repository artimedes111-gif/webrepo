'use strict';

/* ── HELPERS ─────────────────────────────────────────────────── */
const qs  = (sel, ctx) => (ctx || document).querySelector(sel);
const qsa = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

/* ════════════════════════════════════════════════════════════════
   Czekamy aż DOM będzie gotowy
════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {

  /* ── 1. NAWIGACJA ──────────────────────────────────────────── */
  var navbar    = qs('#navbar');
  var hamburger = qs('#hamburger');
  var navLinks  = qs('#navLinks');
  var scrollTop = qs('#scrollTop');

  window.addEventListener('scroll', function () {
    if (navbar)    navbar.classList.toggle('scrolled', window.scrollY > 40);
    if (scrollTop) scrollTop.classList.toggle('visible', window.scrollY > 400);
  });

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      var open = hamburger.classList.toggle('open');
      navLinks.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    qsa('.nav-link', navLinks).forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  if (scrollTop) {
    scrollTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── 2. AKTYWNY LINK W MENU ────────────────────────────────── */
  var sections = qsa('section[id]');
  var navLinkEls = qsa('.nav-link');
  if (sections.length && 'IntersectionObserver' in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          navLinkEls.forEach(function (l) {
            l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id);
          });
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    sections.forEach(function (s) { navIO.observe(s); });
  }

  /* ── 3. REVEAL ON SCROLL ───────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          revealIO.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.1 });
    qsa('.reveal').forEach(function (el) { revealIO.observe(el); });
  } else {
    /* Fallback dla starych przeglądarek */
    qsa('.reveal').forEach(function (el) { el.classList.add('visible'); });
  }

  /* ── 4. GALERIA ────────────────────────────────────────────── */
  var grid        = qs('#galleryGrid');
  var placeholder = qs('#galleryPlaceholder');
  var filterBtns  = qsa('.filter-btn');

  if (!grid) {
    console.warn('Brak elementu #galleryGrid');
    return;
  }

  if (typeof galleryData === 'undefined' || !Array.isArray(galleryData)) {
    console.warn('Brak galleryData – sprawdź js/gallery-data.js');
    if (placeholder) placeholder.style.display = 'block';
    return;
  }

  if (galleryData.length === 0) {
    if (placeholder) placeholder.style.display = 'block';
    return;
  }

  /* Renderuj zdjęcia */
  galleryData.forEach(function (item, index) {
    var el = document.createElement('div');
    el.className        = 'gallery-item';
    el.dataset.filter   = item.category || 'inne';
    el.dataset.index    = index;

    var img = document.createElement('img');
    img.src     = item.src;
    img.alt     = item.title || 'Realizacja Grot-Stal';
    img.loading = 'lazy';

    var overlay = document.createElement('div');
    overlay.className = 'gallery-item-overlay';
    overlay.innerHTML =
      '<div>' +
        '<div class="gallery-item-title">' + (item.title || '') + '</div>' +
        '<div class="gallery-item-cat">' + categoryLabel(item.category) + '</div>' +
      '</div>';

    var zoom = document.createElement('div');
    zoom.className = 'gallery-zoom';
    zoom.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/></svg>';

    el.appendChild(img);
    el.appendChild(overlay);
    el.appendChild(zoom);

    el.addEventListener('click', function () { openLightbox(index); });
    grid.appendChild(el);
  });

  /* Filtrowanie */
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      var filter  = btn.dataset.filter;
      var items   = qsa('.gallery-item');
      var visible = 0;

      items.forEach(function (item) {
        var match = (filter === 'all' || item.dataset.filter === filter);
        item.classList.toggle('hidden', !match);
        if (match) visible++;
      });

      if (placeholder) placeholder.style.display = (visible === 0) ? 'block' : 'none';
    });
  });

  function categoryLabel(cat) {
    var map = { ogrodzenia: 'Ogrodzenia', bramy: 'Bramy i Furtki', balustrady: 'Balustrady', inne: 'Inne' };
    return map[cat] || cat || '';
  }

  /* ── 5. LIGHTBOX ───────────────────────────────────────────── */
  var lb       = qs('#lightbox');
  var backdrop = qs('#lbBackdrop');
  var lbImg    = qs('#lbImg');
  var lbCap    = qs('#lbCaption');
  var lbClose  = qs('#lbClose');
  var lbPrev   = qs('#lbPrev');
  var lbNext   = qs('#lbNext');

  var currentIndex = 0;
  var visibleItems = [];

  window.openLightbox = function (index) {
    visibleItems = qsa('.gallery-item:not(.hidden)').map(function (el) {
      return parseInt(el.dataset.index);
    });
    var pos = visibleItems.indexOf(index);
    currentIndex = pos >= 0 ? pos : 0;
    showLbImage(currentIndex);
    if (lb)       lb.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  function showLbImage(pos) {
    var dataIdx = visibleItems[pos];
    if (dataIdx === undefined) return;
    var item = galleryData[dataIdx];
    if (!item) return;
    if (lbImg) { lbImg.src = item.src; lbImg.alt = item.title || ''; }
    if (lbCap) lbCap.textContent = item.title || '';
    var multi = visibleItems.length > 1;
    if (lbPrev) lbPrev.style.display = multi ? '' : 'none';
    if (lbNext) lbNext.style.display = multi ? '' : 'none';
  }

  function closeLb() {
    if (lb)       lb.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
    if (lbImg) lbImg.src = '';
  }

  function lbPrevFn() {
    currentIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length;
    showLbImage(currentIndex);
  }
  function lbNextFn() {
    currentIndex = (currentIndex + 1) % visibleItems.length;
    showLbImage(currentIndex);
  }

  if (lbClose)  lbClose.addEventListener('click', closeLb);
  if (backdrop) backdrop.addEventListener('click', closeLb);
  if (lbPrev)   lbPrev.addEventListener('click', function (e) { e.stopPropagation(); lbPrevFn(); });
  if (lbNext)   lbNext.addEventListener('click', function (e) { e.stopPropagation(); lbNextFn(); });

  document.addEventListener('keydown', function (e) {
    if (!lb || !lb.classList.contains('active')) return;
    if (e.key === 'Escape')      closeLb();
    if (e.key === 'ArrowLeft')   lbPrevFn();
    if (e.key === 'ArrowRight')  lbNextFn();
  });

  var touchX = null;
  if (lb) {
    lb.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) { dx < 0 ? lbNextFn() : lbPrevFn(); }
      touchX = null;
    });
  }

  /* ── 6. FORMULARZ ──────────────────────────────────────────── */
  var form    = qs('#contactForm');
  var success = qs('#formSuccess');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name  = (qs('#fname',  form).value  || '').trim();
      var email = (qs('#femail', form).value  || '').trim();
      var msg   = (qs('#fmsg',   form).value  || '').trim();
      var rodo  = qs('#frodo',   form).checked;
      if (!name || !email || !msg || !rodo) return;
      if (form)    form.style.display    = 'none';
      if (success) success.style.display = 'block';
    });
  }

  /* ── 7. ROK W STOPCE ───────────────────────────────────────── */
  var yearEl = qs('#footerYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

});
