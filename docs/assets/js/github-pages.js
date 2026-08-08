(function () {
  "use strict";

  var header = document.getElementById("siteHeader");
  var nav = document.getElementById("primaryNav");
  var navToggle = document.getElementById("navToggle");
  var dialog = document.getElementById("imageDialog");
  var toTopButton = document.getElementById("toTopButton");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function closeNav(returnFocus) {
    if (!nav || !navToggle) return;
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    if (returnFocus) navToggle.focus();
  }

  function updateScrollState() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
    if (toTopButton) toTopButton.classList.toggle("is-shown", window.scrollY > 600);
  }

  if (nav && navToggle) {
    navToggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { closeNav(false); });
    });
    document.addEventListener("click", function (event) {
      if (nav.classList.contains("is-open") && !nav.contains(event.target) && !navToggle.contains(event.target)) closeNav(false);
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 860) closeNav(false); });
  }

  document.querySelectorAll("[data-image]").forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      if (!dialog || typeof dialog.showModal !== "function") return;
      var image = dialog.querySelector("img");
      var title = dialog.querySelector("#dialogTitle");
      image.src = trigger.dataset.image;
      image.alt = trigger.dataset.alt || "Application screenshot";
      if (title) {
        var captureTitle = trigger.querySelector(".capture-meta strong");
        title.textContent = captureTitle ? captureTitle.textContent : "Application screenshot";
      }
      dialog.showModal();
      document.body.classList.add("dialog-open");
    });
  });

  if (dialog) {
    var closeDialog = function () {
      dialog.close();
      document.body.classList.remove("dialog-open");
    };
    dialog.querySelector(".dialog-close").addEventListener("click", closeDialog);
    dialog.addEventListener("click", function (event) { if (event.target === dialog) closeDialog(); });
    dialog.addEventListener("close", function () { document.body.classList.remove("dialog-open"); });
  }

  if (toTopButton) {
    toTopButton.addEventListener("click", function () {
      if (window.location.hash) window.history.replaceState(null, "", window.location.pathname + window.location.search);
      window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && nav && nav.classList.contains("is-open")) closeNav(true);
  });
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  updateScrollState();
  window.addEventListener("scroll", updateScrollState, { passive: true });
})();
