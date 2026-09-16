/* Crispr Learning · Candidate portal
   Small shell helpers shared by every page. No page logic lives here; the
   Angular controllers own all behaviour. */
(function () {
  'use strict';

  // The report controllers colour the subject-strength donut through
  // Utility.getBrandColor(name). Map the old theme names onto the portal palette.
  var brandColors = {
    'default':      '#e2e8f0',
    'gray':         '#94a3b8',
    'inverse':      '#334155',
    'primary':      '#005f73',
    'success':      '#8fdc9a',
    'warning':      '#ffb703',
    'danger':       '#ff3b6b',
    'info':         '#2e9da1',
    'midnightblue': '#005f73',
    'teal':         '#2e9da1',
    'green':        '#146a62',
    'orange':       '#ffb703',
    'pink':         '#ff3b6b'
  };
  window.Utility = window.Utility || {};
  window.Utility.getBrandColor = function (name) {
    return brandColors[name] || brandColors['default'];
  };

  // Highlight the sidebar / tab-bar link that matches the current page.
  document.addEventListener('DOMContentLoaded', function () {
    var page = (window.location.pathname.split('/').pop() || 'dashboard.html').toLowerCase();
    var links = document.querySelectorAll('[data-nav]');
    for (var i = 0; i < links.length; i++) {
      if ((links[i].getAttribute('data-nav') || '').toLowerCase() === page) {
        links[i].classList.add('is-active');
      }
    }
  });
})();
