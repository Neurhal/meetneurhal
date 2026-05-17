/**
 * Compliance Readiness: Control traceability animation hook.
 * CSS owns the motion; this module provides an isolated lifecycle marker.
 */
(function registerComplianceControlTraceAnimation() {
  function init(scope) {
    const root = (scope || document).querySelector(".cert-control-animation");
    if (!root) return;
    root.dataset.animationModule = "compliance-control-trace";
    root.classList.add("is-animation-ready");
  }

  window.NeurHALAnimations = window.NeurHALAnimations || {};
  window.NeurHALAnimations["compliance-control-trace"] = init;
  init(document);
})();
