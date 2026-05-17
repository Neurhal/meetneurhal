/**
 * Compliance Readiness: Evidence dossier assembly animation hook.
 * CSS owns the motion; this module provides an isolated lifecycle marker.
 */
(function registerComplianceDossierAnimation() {
  function init(scope) {
    const root = (scope || document).querySelector(".cert-dossier-animation");
    if (!root) return;
    root.dataset.animationModule = "compliance-dossier";
    root.classList.add("is-animation-ready");
  }

  window.NeurHALAnimations = window.NeurHALAnimations || {};
  window.NeurHALAnimations["compliance-dossier"] = init;
  init(document);
})();
