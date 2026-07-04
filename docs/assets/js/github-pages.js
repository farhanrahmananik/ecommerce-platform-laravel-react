/*
  GitHub Pages portfolio landing page behavior.
  Vanilla JS only: mobile navigation toggle with basic keyboard accessibility.
  No external dependencies.
*/
(function () {
  'use strict';

  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('navMenu');

  if (!toggle || !menu) {
    return;
  }

  function openMenu() {
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  function isOpen() {
    return menu.classList.contains('is-open');
  }

  toggle.addEventListener('click', function () {
    if (isOpen()) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close the menu after choosing a link, so the anchor scroll target is visible.
  menu.addEventListener('click', function (event) {
    if (event.target.closest('a')) {
      closeMenu();
    }
  });

  // Close on Escape and return focus to the toggle button.
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isOpen()) {
      closeMenu();
      toggle.focus();
    }
  });

  // Close when clicking outside the open menu.
  document.addEventListener('click', function (event) {
    if (!isOpen()) {
      return;
    }

    var clickedInsideMenu = menu.contains(event.target);
    var clickedToggle = toggle.contains(event.target);

    if (!clickedInsideMenu && !clickedToggle) {
      closeMenu();
    }
  });

  // Collapse the mobile menu automatically if the viewport grows into desktop
  // width. Matches the CSS breakpoint where the toggle itself is hidden.
  var desktopQuery = window.matchMedia('(min-width: 992px)');

  function handleViewportChange(event) {
    if (event.matches) {
      closeMenu();
    }
  }

  if (typeof desktopQuery.addEventListener === 'function') {
    desktopQuery.addEventListener('change', handleViewportChange);
  } else if (typeof desktopQuery.addListener === 'function') {
    desktopQuery.addListener(handleViewportChange);
  }
})();
