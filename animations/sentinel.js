/**
 * Vulnerability Assessment route animation hook.
 * CSS owns the motion; this module provides isolated lifecycle markers.
 */
(function registerSentinelAnimations() {
  function init(scope) {
    const root = scope || document;
    root
      .querySelectorAll(
        ".suite-animation, .surface-map-animation, .evidence-bag-animation, .release-console-animation, .file-scan-lab"
      )
      .forEach((node) => {
        node.dataset.animationModule = "sentinel";
        node.classList.add("is-animation-ready");
      });
  }

  window.NeurHALAnimations = window.NeurHALAnimations || {};
  window.NeurHALAnimations.sentinel = init;
  init(document);
})();
