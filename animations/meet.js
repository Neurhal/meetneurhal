/**
 * Research Problem route animation hook.
 * CSS owns the motion; this module provides an isolated lifecycle marker.
 */
(function registerMeetAnimations() {
  function init(scope) {
    const root = (scope || document).querySelector(".partnership-takeoff-lab");
    if (!root) return;
    root.dataset.animationModule = "meet";
    root.classList.add("is-animation-ready");
  }

  window.NeurHALAnimations = window.NeurHALAnimations || {};
  window.NeurHALAnimations.meet = init;
  init(document);
})();
