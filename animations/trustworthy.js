/**
 * Reviewable AI Work route animation hook.
 * CSS owns the motion; this module provides isolated lifecycle markers.
 */
(function registerTrustworthyAnimations() {
  function init(scope) {
    const root = scope || document;
    root.querySelectorAll(".broken-flow-track, .governance-tabs-lab").forEach((node) => {
      node.dataset.animationModule = "trustworthy";
      node.classList.add("is-animation-ready");
    });
  }

  window.NeurHALAnimations = window.NeurHALAnimations || {};
  window.NeurHALAnimations.trustworthy = init;
  init(document);
})();
