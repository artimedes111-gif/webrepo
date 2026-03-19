'use strict';

/* ═══════════════════════════════════════════
   NAWIGACJA — sticky + hamburger
════════════════════════════════════════════ */
(function initNav() {
  const header    = document.getElementById('site-header');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');

  // Scroll → ciemne tło
  function onScroll() {
    if (window.scrollY > 80) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hamburger toggle
  hamburger.addEventListener('click', function () {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  // Zamknij menu po kliknięciu linku
  navLinks.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
})();

/* ═══════════════════════════════════════════
   SCROLL REVEAL (IntersectionObserver)
════════════════════════════════════════════ */
(function initReveal() {
  const elements = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    elements.forEach(function (el) { el.classList.add('visible'); });
    return;
  }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(function (el) { observer.observe(el); });
})();

/* ═══════════════════════════════════════════
   GALERIA — lightbox
════════════════════════════════════════════ */
(function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lbImg    = document.getElementById('lightbox-img');
  const lbClose  = document.getElementById('lightbox-close');
  const lbPrev   = document.getElementById('lightbox-prev');
  const lbNext   = document.getElementById('lightbox-next');
  const items    = Array.from(document.querySelectorAll('.gallery-item'));

  let currentIndex = 0;

  function getSrc(item) {
    return item.getAttribute('data-src') || item.querySelector('img').src;
  }

  function getAlt(item) {
    return item.querySelector('img').getAttribute('alt') || '';
  }

  function open(index) {
    currentIndex = index;
    lbImg.src = getSrc(items[currentIndex]);
    lbImg.alt = getAlt(items[currentIndex]);
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // Avoid memory leaks / flash: delay src clear
    setTimeout(function () { lbImg.src = ''; }, 300);
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    lbImg.src = getSrc(items[currentIndex]);
    lbImg.alt = getAlt(items[currentIndex]);
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % items.length;
    lbImg.src = getSrc(items[currentIndex]);
    lbImg.alt = getAlt(items[currentIndex]);
  }

  // Open on item click
  items.forEach(function (item, index) {
    item.addEventListener('click', function () { open(index); });
    item.setAttribute('tabindex', '0');
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(index);
      }
    });
  });

  lbClose.addEventListener('click', close);
  lbPrev.addEventListener('click', function (e) { e.stopPropagation(); showPrev(); });
  lbNext.addEventListener('click', function (e) { e.stopPropagation(); showNext(); });

  // Close on backdrop click
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) close();
  });

  // Keyboard navigation
  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')       close();
    if (e.key === 'ArrowLeft')    showPrev();
    if (e.key === 'ArrowRight')   showNext();
  });
})();

/* ═══════════════════════════════════════════
   FORMULARZ KONTAKTOWY — walidacja
════════════════════════════════════════════ */
(function initContactForm() {
  const form    = document.getElementById('contact-form');
  const success = document.getElementById('form-success');

  if (!form) return;

  function showError(fieldId, msg) {
    var field = document.getElementById(fieldId);
    var error = document.getElementById(fieldId + '-error');
    if (field)  field.classList.add('error');
    if (error)  error.textContent = msg;
  }

  function clearError(fieldId) {
    var field = document.getElementById(fieldId);
    var error = document.getElementById(fieldId + '-error');
    if (field)  field.classList.remove('error');
    if (error)  error.textContent = '';
  }

  function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }

  function validate() {
    var name    = document.getElementById('name').value.trim();
    var email   = document.getElementById('email').value.trim();
    var phone   = document.getElementById('phone').value.trim();
    var message = document.getElementById('message').value.trim();
    var valid   = true;

    ['name', 'email', 'phone', 'message'].forEach(clearError);

    if (!name) {
      showError('name', 'Proszę podać imię i nazwisko.');
      valid = false;
    }

    if (!email) {
      showError('email', 'Proszę podać adres email.');
      valid = false;
    } else if (!isValidEmail(email)) {
      showError('email', 'Niepoprawny format adresu email.');
      valid = false;
    }

    if (!phone) {
      showError('phone', 'Proszę podać numer telefonu.');
      valid = false;
    }

    if (!message) {
      showError('message', 'Proszę wpisać wiadomość.');
      valid = false;
    }

    return valid;
  }

  // Live error clearing
  ['name', 'email', 'phone', 'message'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', function () { clearError(id); });
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;

    // Symulacja wysłania (brak backendu)
    var submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled  = true;
    submitBtn.textContent = 'Wysyłanie...';

    setTimeout(function () {
      form.reset();
      success.classList.add('visible');
      submitBtn.disabled  = false;
      submitBtn.textContent = 'Wyślij wiadomość';

      // Ukryj komunikat po 6s
      setTimeout(function () {
        success.classList.remove('visible');
      }, 6000);
    }, 800);
  });
})();
