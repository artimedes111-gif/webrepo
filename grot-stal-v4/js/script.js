'use strict';

document.addEventListener('DOMContentLoaded', function () {

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.from((c || document).querySelectorAll(s)); };

  /* ── NAVBAR SCROLL ──────────────────────────────────────────── */
  var navbar = $('#navbar');
  var goTop  = $('#goTop');

  window.addEventListener('scroll', function () {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 60);
    if (goTop)  goTop.classList.toggle('on',        window.scrollY > 500);
  }, { passive: true });

  if (goTop) {
    goTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── BURGER ─────────────────────────────────────────────────── */
  var burger    = $('#burger');
  var navLinks  = $('#navLinks');

  if (burger && navLinks) {
    burger.addEventListener('click', function () {
      var open = burger.classList.toggle('open');
      navLinks.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    $$('.nav-a', navLinks).forEach(function (a) {
      a.addEventListener('click', function () {
        burger.classList.remove('open');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('click', function (e) {
      if (navLinks.classList.contains('open') && navbar && !navbar.contains(e.target)) {
        burger.classList.remove('open');
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  /* ── ACTIVE NAV ─────────────────────────────────────────────── */
  var navAs = $$('.nav-a');
  if ('IntersectionObserver' in window) {
    var nIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          navAs.forEach(function (l) {
            l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id);
          });
        }
      });
    }, { rootMargin: '-40% 0px -40% 0px' });
    $$('section[id]').forEach(function (s) { nIO.observe(s); });
  }

  /* ── REVEAL ANIMATION ───────────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    var rIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          rIO.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.08 });
    $$('.reveal').forEach(function (el) { rIO.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('visible'); });
  }

  /* ── GALERIA ────────────────────────────────────────────────── */
  var grid    = $('#galleryGrid');
  var filters = $$('.gf');

  if (grid && typeof galleryData !== 'undefined' && galleryData.length) {

    galleryData.forEach(function (item, index) {
      var el = document.createElement('div');
      el.className      = 'gal-item';
      el.dataset.filter = item.category || 'inne';
      el.dataset.index  = index;

      var img = document.createElement('img');
      img.src     = item.src;
      img.alt     = item.title || 'Realizacja';
      img.loading = 'lazy';

      var ov = document.createElement('div');
      ov.className = 'gal-overlay';
      ov.innerHTML =
        '<div class="gal-title">' + (item.title || '') + '</div>' +
        '<div class="gal-cat">'   + catLabel(item.category) + '</div>';

      var zm = document.createElement('div');
      zm.className = 'gal-zoom';
      zm.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/></svg>';

      el.appendChild(img);
      el.appendChild(ov);
      el.appendChild(zm);
      el.addEventListener('click', function () { openLb(index); });
      grid.appendChild(el);
    });

    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filters.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var f = btn.dataset.filter;
        $$('.gal-item').forEach(function (it) {
          it.classList.toggle('hidden', f !== 'all' && it.dataset.filter !== f);
        });
      });
    });
  }

  function catLabel(cat) {
    return { ogrodzenia: 'Ogrodzenia', bramy: 'Bramy i Furtki', balustrady: 'Balustrady', inne: 'Pergole i Wiaty' }[cat] || cat || '';
  }

  /* ── LIGHTBOX ───────────────────────────────────────────────── */
  var lb    = $('#lightbox');
  var lbBg  = $('#lbBackdrop');
  var lbImg = $('#lbImg');
  var lbCap = $('#lbCap');
  var lbX   = $('#lbClose');
  var lbP   = $('#lbPrev');
  var lbN   = $('#lbNext');
  var cur = 0, vis = [];

  window.openLb = function (index) {
    vis = $$('.gal-item:not(.hidden)').map(function (el) { return parseInt(el.dataset.index); });
    var p = vis.indexOf(index);
    cur = p >= 0 ? p : 0;
    showLb(cur);
    if (lb)   lb.classList.add('on');
    if (lbBg) lbBg.classList.add('on');
    document.body.style.overflow = 'hidden';
  };

  function showLb(pos) {
    var item = galleryData[vis[pos]];
    if (!item) return;
    lbImg.src = item.src;
    lbImg.alt = item.title || '';
    lbCap.textContent = item.title || '';
    var m = vis.length > 1;
    if (lbP) lbP.style.display = m ? '' : 'none';
    if (lbN) lbN.style.display = m ? '' : 'none';
  }

  function closeLb() {
    if (lb)   lb.classList.remove('on');
    if (lbBg) lbBg.classList.remove('on');
    document.body.style.overflow = '';
    if (lbImg) lbImg.src = '';
  }

  function prevLb() { cur = (cur - 1 + vis.length) % vis.length; showLb(cur); }
  function nextLb() { cur = (cur + 1) % vis.length; showLb(cur); }

  if (lbX)  lbX.addEventListener('click', closeLb);
  if (lbBg) lbBg.addEventListener('click', closeLb);
  if (lbP)  lbP.addEventListener('click', function (e) { e.stopPropagation(); prevLb(); });
  if (lbN)  lbN.addEventListener('click', function (e) { e.stopPropagation(); nextLb(); });

  document.addEventListener('keydown', function (e) {
    if (!lb || !lb.classList.contains('on')) return;
    if (e.key === 'Escape')     closeLb();
    if (e.key === 'ArrowLeft')  prevLb();
    if (e.key === 'ArrowRight') nextLb();
  });

  var tx = null;
  if (lb) {
    lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 50) { dx < 0 ? nextLb() : prevLb(); }
      tx = null;
    });
  }

  /* ── FORMULARZ ──────────────────────────────────────────────── */
  var form = $('#contactForm');
  var ok   = $('#formSuccess');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid =
        ($('#fname',  form).value || '').trim() &&
        ($('#femail', form).value || '').trim() &&
        ($('#fmsg',   form).value || '').trim() &&
        $('#frodo', form).checked;
      if (!valid) return;
      form.style.display = 'none';
      if (ok) ok.style.display = 'block';
    });
  }

  /* ── ROK ────────────────────────────────────────────────────── */
  var yr = $('#fyear');
  if (yr) yr.textContent = new Date().getFullYear();

});
