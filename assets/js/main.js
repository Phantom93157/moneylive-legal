/*
 * MoneyLive website — shared animation/interaction system.
 * No frameworks, no external animation libraries: CSS transitions/animations
 * + IntersectionObserver + a little vanilla JS, per spec. Respects
 * prefers-reduced-motion throughout.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () { document.body.classList.remove('nav-open'); });
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Hero entrance sequence ---------- */
  var heroEls = document.querySelectorAll('[data-hero-in]');
  if (!reduceMotion && heroEls.length) {
    requestAnimationFrame(function () {
      heroEls.forEach(function (el, i) {
        setTimeout(function () { el.classList.add('hero-in'); }, 90 * i);
      });
    });
  } else {
    heroEls.forEach(function (el) { el.classList.add('hero-in'); });
  }

  /* ---------- Subtle hero parallax (pointer + scroll) ---------- */
  var parallaxTarget = document.querySelector('[data-parallax]');
  if (parallaxTarget && !reduceMotion && window.matchMedia('(min-width: 981px)').matches) {
    var px = 0, py = 0, tx = 0, ty = 0;
    window.addEventListener('pointermove', function (e) {
      var w = window.innerWidth, h = window.innerHeight;
      tx = ((e.clientX / w) - 0.5) * 16;
      ty = ((e.clientY / h) - 0.5) * 16;
    });
    (function raf() {
      px += (tx - px) * 0.06;
      py += (ty - py) * 0.06;
      parallaxTarget.style.transform = 'translate(' + px.toFixed(2) + 'px,' + py.toFixed(2) + 'px)';
      requestAnimationFrame(raf);
    })();
  }

  /* ---------- Nav shadow / active link on scroll (index only) ---------- */
  var sections = document.querySelectorAll('main section[id]');
  var navLinks = document.querySelectorAll('.nav-links a[href^="#"], .nav-links a[href*="#"]');
  if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    navLinks.forEach(function (a) {
      var id = a.getAttribute('href').split('#')[1];
      if (id) byId[id] = a;
    });
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = byId[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach(function (a) { a.classList.remove('active'); });
          link.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { navIo.observe(s); });
  }

  /* ---------- Legal page: active table-of-contents ---------- */
  var tocLinks = document.querySelectorAll('.legal-toc a[href^="#"]');
  var legalSections = document.querySelectorAll('.legal-body section[id]');
  if (tocLinks.length && legalSections.length && 'IntersectionObserver' in window) {
    var tocById = {};
    tocLinks.forEach(function (a) {
      tocById[a.getAttribute('href').slice(1)] = a;
    });
    var tocIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = tocById[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          tocLinks.forEach(function (a) { a.classList.remove('active'); });
          link.classList.add('active');
        }
      });
    }, { rootMargin: '-10% 0px -75% 0px' });
    legalSections.forEach(function (s) { tocIo.observe(s); });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
