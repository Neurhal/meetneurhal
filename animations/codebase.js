/**
 * Codebase Optimization route animation hook.
 * CSS owns the motion; this module provides isolated lifecycle markers.
 */
(function registerCodebaseAnimations() {
  function init(scope) {
    const root = scope || document;
    root
      .querySelectorAll(".baseline-map-animation, .candidate-stack-animation, .packet-handoff-animation, .broken-kanban-lab")
      .forEach((node) => {
        node.dataset.animationModule = "codebase";
        node.classList.add("is-animation-ready");
      });
  }

  window.NeurHALAnimations = window.NeurHALAnimations || {};
  window.NeurHALAnimations.codebase = init;
  init(document);
})();
