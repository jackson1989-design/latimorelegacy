/* js/config.js */
window.LLL_CONFIG = {
  GA4_ID: "G-XXXXXXXXXX",      // set your real GA4 Measurement ID or leave blank to disable GA
  STORAGE_KEY: "lll_events",   // localStorage key for your event log
  MAX_EVENTS: 200,             // keep last N events
};


/* js/analytics.js */
(function () {
  "use strict";

  var cfg = window.LLL_CONFIG || {};
  var gaId = String(cfg.GA4_ID || "");

  function loadGtag(id) {
    if (!id || id.indexOf("G-") !== 0) return;
    if (window.__LLL_GTAG_LOADED__) return;
    window.__LLL_GTAG_LOADED__ = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtag() {
        window.dataLayer.push(arguments);
      };

    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(s);

    window.gtag("js", new Date());
    window.gtag("config", id, { send_page_view: true });
  }

  loadGtag(gaId);
})();


/* js/main.js */
(function () {
  "use strict";

  var cfg = window.LLL_CONFIG || {};
  var STORAGE_KEY = String(cfg.STORAGE_KEY || "lll_events");
  var MAX_EVENTS = Number(cfg.MAX_EVENTS || 200);

  function safeJsonParse(text, fallback) {
    try {
      return JSON.parse(text);
    } catch (_e) {
      return fallback;
    }
  }

  function getEventLog() {
    var raw = localStorage.getItem(STORAGE_KEY);
    var arr = safeJsonParse(raw || "[]", []);
    return Array.isArray(arr) ? arr : [];
  }

  function setEventLog(arr) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (_e) {
      // ignore storage errors (private mode, quota, etc.)
    }
  }

  function appendEvent(evt) {
    var arr = getEventLog();
    arr.push(evt);

    if (arr.length > MAX_EVENTS) {
      arr = arr.slice(arr.length - MAX_EVENTS);
    }

    setEventLog(arr);
  }

  function track(name, params) {
    var evt = {
      name: String(name),
      params: params || {},
      ts: new Date().toISOString(),
      path: window.location.pathname,
    };

    appendEvent(evt);

    if (typeof window.gtag === "function" && (window.LLL_CONFIG || {}).GA4_ID) {
      window.gtag("event", evt.name, evt.params);
    }
  }

  function setAriaExpanded(btn, isExpanded) {
    if (!btn) return;
    btn.setAttribute("aria-expanded", isExpanded ? "true" : "false");
  }

  function isMenuOpen(menu) {
    return !!menu && menu.classList.contains("active");
  }

  function openMenu(btn, menu) {
    if (!menu) return;
    menu.classList.add("active");
    setAriaExpanded(btn, true);
  }

  function closeMenu(btn, menu) {
    if (!menu) return;
    menu.classList.remove("active");
    setAriaExpanded(btn, false);
  }

  function toggleMenu(btn, menu) {
    if (!menu) return;
    if (isMenuOpen(menu)) closeMenu(btn, menu);
    else openMenu(btn, menu);
  }

  function findMenuButton() {
    return (
      document.querySelector(".mobile-menu-btn") ||
      document.getElementById("mobile-menu") ||
      document.querySelector('[data-mobile-menu-button]')
    );
  }

  function findMenuList() {
    return (
      document.querySelector(".nav-links") ||
      document.querySelector(".nav-list") ||
      document.querySelector('[data-mobile-menu]')
    );
  }

  function initMobileNav() {
    var btn = findMenuButton();
    var menu = findMenuList();
    if (!btn || !menu) return;

    setAriaExpanded(btn, isMenuOpen(menu));

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      toggleMenu(btn, menu);
    });

    document.addEventListener("click", function (e) {
      if (!isMenuOpen(menu)) return;
      var target = e.target;
      if (btn.contains(target) || menu.contains(target)) return;
      closeMenu(btn, menu);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu(btn, menu);
    });

    menu.addEventListener("click", function (e) {
      var link = e.target && e.target.closest ? e.target.closest("a") : null;
      if (link) closeMenu(btn, menu);
    });
  }

  function initStickyShadow() {
    var header =
      document.querySelector(".navbar") ||
      document.querySelector("header") ||
      document.querySelector(".site-header");
    if (!header) return;

    function onScroll() {
      if (window.scrollY > 8) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function initActiveNavLink() {
    var current = window.location.pathname.split("/").pop();
    if (!current) current = "index.html";

    var links = document.querySelectorAll("nav a[href]");
    for (var i = 0; i < links.length; i += 1) {
      var a = links[i];
      var href = (a.getAttribute("href") || "").split("#")[0];
      if (href && href === current) a.classList.add("current");
    }
  }

  function initClickTracking() {
    document.addEventListener("click", function (e) {
      var a = e.target && e.target.closest ? e.target.closest("a") : null;
      var btn = e.target && e.target.closest ? e.target.closest("button") : null;
      var el = a || btn;
      if (!el) return;

      var label = String((el.textContent || "").trim()).slice(0, 120);
      var href = a ? String(a.getAttribute("href") || "") : "";

      if (href.indexOf("tel:") === 0) {
        track("phone_click", { href: href, label: label });
        return;
      }

      if (href.indexOf("mailto:") === 0) {
        track("email_click", { href: href, label: label });
        return;
      }

      if (href && href.toLowerCase().indexOf("quote") !== -1) {
        track("quote_form_open", { href: href, label: label });
        return;
      }
    });
  }

  function initExportButton() {
    var exportBtn = document.querySelector("[data-export-activity]");
    if (!exportBtn) return;

    exportBtn.addEventListener("click", function () {
      var data = getEventLog();

      var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);

      var a = document.createElement("a");
      a.href = url;
      a.download = "latimore-activity.json";
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);

      track("analytics_export", { count: data.length });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMobileNav();
    initStickyShadow();
    initActiveNavLink();
    initClickTracking();
    initExportButton();
  });
})();