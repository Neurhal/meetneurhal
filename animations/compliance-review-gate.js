/**
 * Compliance Readiness: Review gate confidence animation hook.
 * CSS owns the motion; this module provides an isolated lifecycle marker.
 */
(function registerComplianceReviewGateAnimation() {
  function init(scope) {
    const root = (scope || document).querySelector(".cert-gate-animation");
    if (!root) return;
    root.dataset.animationModule = "compliance-review-gate";
    root.classList.add("is-animation-ready");
  }

  window.NeurHALAnimations = window.NeurHALAnimations || {};
  window.NeurHALAnimations["compliance-review-gate"] = init;
  init(document);
})();
