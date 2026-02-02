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