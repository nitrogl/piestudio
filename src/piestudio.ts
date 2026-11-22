/**
 * @file Starts PieStudio when the page is ready.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
"use strict";

$.fn.exists = function() {
  return this.length !== 0;
};

$(document).ready(function() {
  // jQuery UI listens to the mouse only: touches drive it on tablets
  TouchMouse.install(".st-seq, .st-palette-item, .st-decl-list, .ui-resizable-handle");

  const studio = PieStudio.getInstance();
  studio.start();

  // Bootstrap tooltips on the toolbar buttons
  $("[data-bs-toggle=\"tooltip\"]").each(function() {
    new bootstrap.Tooltip(this, { trigger: "hover", delay: { show: 400, hide: 0 } });
  });
});
