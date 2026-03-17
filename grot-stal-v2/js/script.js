'use strict';

document.addEventListener('DOMContentLoaded', function () {

  var qs  = function(s,c){ return (c||document).querySelector(s); };
  var qsa = function(s,c){ return Array.from((c||document).querySelectorAll(s)); };

  /* ── HEADER SCROLL ─────────────────────────────────────────── */
  var header   = qs('#header');
  var scrollUp = qs('#scrollUp');

  window.addEventListener('scroll', function () {
    if (header)   header.classList.toggle('scrolled', window.scrollY > 50);
    if (scrollUp) scrollUp.classList.toggle('on',     window.scrollY > 400);
  }, { passive: true });

  if (scrollUp) {
    scrollUp.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── BURGER MENU ───────────────────────────────────────────── */
  var burger = qs('#burger');
  var nav    = qs('#nav');

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = burger.classList.toggle('open');
      nav.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    qsa('.nav-a', nav).forEach(function (a) {
      a.addEventListener('click', function () {
        burger.classList.remove('open');
        nav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('open') && !header.contains(e.target)) {
        burger.classList.remove('open');
        nav.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  /* ── ACTIVE NAV LINK ───────────────────────────────────────── */
  var sections  = qsa('section[id], div[id]');
  var navLinks  = qsa('.nav-a');
  if ('IntersectionObserver' in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          navLinks.forEach(function (l) {
            l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id);
          });
        }
      });
    }, { rootMargin: '-40% 0px -40% 0px' });
    sections.forEach(function (s) { navIO.observe(s); });
  }

  /* ── FADE-UP SCROLL ANIMATION ──────────────────────────────── */
  if ('IntersectionObserver' in window) {
    var fadeIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          fadeIO.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.08 });
    qsa('.fade-up').forEach(function (el) { fadeIO.observe(el); });
  } else {
    qsa('.fade-up').forEach(function (el) { el.classList.add('visible'); });
  }

  /* ── GALERIA ───────────────────────────────────────────────── */
  var grid    = qs('#galleryGrid');
  var filters = qsa('.gfbtn');

  if (grid && typeof galleryData !== 'undefined' && galleryData.length) {

    galleryData.forEach(function (item, index) {
      var el = document.createElement('div');
      el.className      = 'gallery-item';
      el.dataset.filter = item.category || 'inne';
      el.dataset.index  = index;

      var img = document.createElement('img');
      img.src     = item.src;
      img.alt     = item.title || 'Realizacja';
      img.loading = 'lazy';

      var overlay = document.createElement('div');
      overlay.className = 'gallery-overlay';
      overlay.innerHTML =
        '<div class="gallery-overlay-title">' + (item.title || '') + '</div>' +
        '<div class="gallery-overlay-cat">' + catLabel(item.category) + '</div>';

      var zoom = document.createElement('div');
      zoom.className = 'gallery-zoom-icon';
      zoom.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/></svg>';

      el.appendChild(img);
      el.appendChild(overlay);
      el.appendChild(zoom);
      el.addEventListener('click', function () { openLb(index); });
      grid.appendChild(el);
    });

    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filters.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var f = btn.dataset.filter;
        qsa('.gallery-item').forEach(function (item) {
          item.classList.toggle('hidden', f !== 'all' && item.dataset.filter !== f);
        });
      });
    });
  }

  function catLabel(cat) {
    var m = { ogrodzenia:'Ogrodzenia', bramy:'Bramy i Furtki', balustrady:'Balustrady', inne:'Pergole i Wiaty' };
    return m[cat] || cat || '';
  }

  /* ── LIGHTBOX ──────────────────────────────────────────────── */
  var lb       = qs('#lightbox');
  var lbBd     = qs('#lbBackdrop');
  var lbImg    = qs('#lbImg');
  var lbCap    = qs('#lbCap');
  var lbClose  = qs('#lbClose');
  var lbPrev   = qs('#lbPrev');
  var lbNext   = qs('#lbNext');
  var cur = 0, vis = [];

  window.openLb = function (index) {
    vis = qsa('.gallery-item:not(.hidden)').map(function (el) { return parseInt(el.dataset.index); });
    var p = vis.indexOf(index);
    cur = p >= 0 ? p : 0;
    showLb(cur);
    lb.classList.add('on');
    lbBd.classList.add('on');
    document.body.style.overflow = 'hidden';
  };

  function showLb(pos) {
    var item = galleryData[vis[pos]];
    if (!item) return;
    lbImg.src = item.src; lbImg.alt = item.title || '';
    lbCap.textContent = item.title || '';
    var multi = vis.length > 1;
    if (lbPrev) lbPrev.style.display = multi ? '' : 'none';
    if (lbNext) lbNext.style.display = multi ? '' : 'none';
  }
  function closeLb() {
    lb.classList.remove('on'); lbBd.classList.remove('on');
    document.body.style.overflow = '';
    lbImg.src = '';
  }
  function prevLb() { cur = (cur - 1 + vis.length) % vis.length; showLb(cur); }
  function nextLb() { cur = (cur + 1) % vis.length; showLb(cur); }

  if (lbClose) lbClose.addEventListener('click', closeLb);
  if (lbBd)    lbBd.addEventListener('click', closeLb);
  if (lbPrev)  lbPrev.addEventListener('click', function (e) { e.stopPropagation(); prevLb(); });
  if (lbNext)  lbNext.addEventListener('click', function (e) { e.stopPropagation(); nextLb(); });

  document.addEventListener('keydown', function (e) {
    if (!lb || !lb.classList.contains('on')) return;
    if (e.key === 'Escape')     closeLb();
    if (e.key === 'ArrowLeft')  prevLb();
    if (e.key === 'ArrowRight') nextLb();
  });

  var tx = null;
  if (lb) {
    lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive:true });
    lb.addEventListener('touchend', function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 50) { dx < 0 ? nextLb() : prevLb(); }
      tx = null;
    });
  }

  /* ── FORMULARZ ─────────────────────────────────────────────── */
  var form    = qs('#contactForm');
  var success = qs('#formSuccess');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = (qs('#fname',  form).value || '').trim() &&
               (qs('#femail', form).value || '').trim() &&
               (qs('#fmsg',   form).value || '').trim() &&
               qs('#frodo', form).checked;
      if (!ok) return;
      form.style.display    = 'none';
      success.style.display = 'block';
    });
  }

  /* ── ROK STOPKA ────────────────────────────────────────────── */
  var yr = qs('#fyear');
  if (yr) yr.textContent = new Date().getFullYear();

});
