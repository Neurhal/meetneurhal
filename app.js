/**
 * NeurHAL.NET static frontend behavior.
 * Handles hash routing, local mailto handoff, section details, and restrained mark motion.
 * No analytics, remote assets, backend form submission, or third-party runtime dependencies.
 */
(function initResearchPortal() {
  const pageHost = document.getElementById("page-host");
  const routeRegistry = {
    meet: {
      partial: "partials/meet.html",
      css: ["animations/meet.css"],
      js: ["animations/meet.js"],
      initializers: ["meet"],
    },
    trustworthy: {
      partial: "partials/trustworthy.html",
      css: ["animations/trustworthy.css"],
      js: ["animations/trustworthy.js"],
      initializers: ["trustworthy"],
    },
    compliance: {
      partial: "partials/compliance.html",
      css: [
        "animations/compliance-dossier.css",
        "animations/compliance-control-trace.css?v=restart-1",
        "animations/compliance-review-gate.css",
        "animations/compliance-readiness-ledger.css?v=stamp-form-1",
      ],
      js: [
        "animations/compliance-dossier.js",
        "animations/compliance-control-trace.js?v=restart-1",
        "animations/compliance-review-gate.js",
        "animations/compliance-readiness-ledger.js?v=stamp-form-1",
      ],
      initializers: [
        "compliance-dossier",
        "compliance-control-trace",
        "compliance-review-gate",
        "compliance-readiness-ledger",
      ],
    },
    sentinel: {
      partial: "partials/sentinel.html",
      css: ["animations/sentinel.css"],
      js: ["animations/sentinel.js"],
      initializers: ["sentinel"],
    },
    codebase: {
      partial: "partials/codebase.html",
      css: ["animations/codebase.css"],
      js: ["animations/codebase.js"],
      initializers: ["codebase"],
    },
  };
  const defaultRoute = "meet";
  const navLinks = Array.from(document.querySelectorAll("[data-route]"));
  const mobileRouteSelect = document.getElementById("mobile-route-select");
  const contactTrigger = document.getElementById("research-contact-trigger");
  const contactModal = document.getElementById("research-contact-modal");
  const contactForm = document.getElementById("research-contact-form");
  const contactCloseButtons = Array.from(document.querySelectorAll("[data-contact-close]"));
  const privacyTrigger = document.querySelector("[data-privacy-trigger]");
  const privacyDisclosure = document.querySelector(".privacy-disclosure");
  const prefersCoarsePointer = window.matchMedia("(hover: none), (pointer: coarse)");
  const loadedRouteScripts = new Set();
  const activeRouteStyles = new Map();
  let routeRequestToken = 0;
  let currentRoute = defaultRoute;
  let governanceDecisionIntervals = [];
  let lastDoctrineFocus = null;
  let activeDoctrineNode = null;
  let tooltipNode = null;
  let tooltipVisibilityToken = 0;
  let detailBackdrop = null;
  let detailTitle = null;
  let detailBody = null;
  let detailClose = null;
  let lastContactFocus = null;
  const maxMailtoLength = 7800;
  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");

  const doctrineDetails = {
    "charter-principles-title:Authoritative": {
      summary: "Approval, scope, ownership, and escalation are established before work affects real systems.",
      tooltip:
        "Authoritative work has an approval basis before it changes a system: the request, scope, owner, environment, and escalation posture are visible enough for a reviewer to judge whether the action belongs there.",
      detail:
        "This principle is about permission before consequence. A security finding, patch, release step, or automation handoff may be technically useful while still lacking the approval context needed to act. Reviewers need to see why the work was allowed, what boundary admitted it, who owns the decision, and when the work must pause or escalate.",
    },
    "charter-principles-title:Observable": {
      summary: "The record stays readable enough for people to explain what happened and why.",
      tooltip:
        "Observable work leaves a usable review record: tested paths, affected systems, tool use, handoffs, approvals, constraints, retest evidence, and decisions remain attached while the work moves.",
      detail:
        "This principle is about avoiding reconstruction after the fact. If evidence is scattered across prompts, tickets, logs, repositories, dashboards, and chat threads, review becomes slower and less reliable. Observable work keeps enough record with the workflow for people to explain what happened and judge what should happen next.",
    },
    "charter-principles-title:Resilient": {
      summary: "Recovery remains part of the work as conditions change or confidence drops.",
      tooltip:
        "Resilient work keeps recovery options visible as conditions change: pause, rollback, containment, narrowed scope, retest, escalation, and degraded-state handling are part of execution rather than an afterthought.",
      detail:
        "This principle is about what remains possible when confidence drops. Systems drift, assumptions fail, dependencies degrade, and AI-assisted work can cross boundaries before people have full context. Resilient workflows preserve the recovery path early enough for reviewers to intervene without rebuilding the entire story.",
    },
    "charter-principles-title:Governed": {
      summary: "Limits and responsibilities stay attached as work crosses tools, teams, and environments.",
      tooltip:
        "Governed work keeps limits and responsibilities attached during movement across tools, teams, environments, and releases, so the next reviewer inherits more than an isolated output.",
      detail:
        "This principle is about continuity across handoff. A task can leave its original context and still carry authority, constraints, evidence, ownership, escalation state, and recovery posture. Without that continuity, downstream systems and reviewers may inherit action without inheriting the reasons and limits that made it acceptable.",
    },
    "charter-principles-title:Accountable": {
      summary: "Human decision authority remains clear when work needs approval, intervention, or recovery.",
      tooltip:
        "Accountable work keeps human responsibility legible: who approved movement, who can intervene, what changed, what evidence supports confidence, and who owns the next decision.",
      detail:
        "This principle is about preserving judgment rather than replacing it. In consequential security and software workflows, people still own approval, escalation, release, exception, and recovery decisions. Accountable work gives them the context to exercise that responsibility after AI-assisted execution has already begun.",
    },
    "authority-boundary-title:Intent and scope": {
      summary: "Intent and scope",
      tooltip:
        "Intent and scope are the requested outcome, systems in scope, excluded actions, and assumptions that can become unclear as work expands.",
      detail:
        "When the original purpose is vague, AI-assisted work can expand beyond what reviewers thought they were approving. That is where stale permission begins: the work still moves, but the reason it was allowed becomes harder to locate.",
    },
    "application-map-title:Certification readiness": {
      summary: "Certification readiness",
      tooltip:
        "Certification review becomes harder when evidence is assembled only after the trail has gone cold.",
      detail:
        "A reviewer may need to know what was requested, who approved it, which systems were touched, what changed, and what recovery path remained. Certification work slows when that record has to be assembled after execution.",
    },
    "application-map-title:Approval workflows": {
      summary: "Approval workflows",
      tooltip:
        "Approval workflows become strained when permission is evaluated after impact instead of understood during the work.",
      detail:
        "The practical gap is between useful output and approved work. Reviewers need to know who allowed the action, what limits applied, and whether the work changed category before it created consequences.",
    },
    "application-map-title:Legacy modernization": {
      summary: "Legacy modernization",
      tooltip:
        "Legacy modernization exposes the review problem because generated changes can move faster than institutional knowledge.",
      detail:
        "A patch may be technically plausible while still leaving reviewers to rediscover dependencies, owners, certification needs, and rollback expectations. The burden is proving the change fits the environment.",
    },
    "application-map-title:Security operations": {
      summary: "Security operations",
      tooltip:
        "Security operations need speed, but speed can obscure who authorized action, which boundaries applied, and when escalation changed.",
      detail:
        "Incident response can move across tickets, tools, infrastructure, and teams. Speed can obscure approval context, evidence, and responsibility even when the response itself is technically useful.",
    },
    "application-map-title:Customer-facing coordination": {
      summary: "Customer-facing coordination",
      tooltip:
        "Customer-facing coordination raises accountability pressure because records, promises, routing, and handoffs can affect external stakeholders.",
      detail:
        "When AI-assisted systems draft responses, update records, or route cases, teams still need to know what was allowed, what changed, and who remains responsible once the interaction leaves the original workflow.",
    },
    "application-map-title:Recovery and rollback": {
      summary: "Recovery and rollback",
      tooltip:
        "Recovery and rollback become harder when degraded work leaves too little history to understand what should be unwound.",
      detail:
        "Organizations become cautious when uncertain work cannot be paused, contained, escalated, or recovered with enough context to understand what changed and who can authorize the next step.",
    },
    "authority-boundary-title:Authority check": {
      summary: "Authority check",
      tooltip:
        "Authority can become unclear when the action being performed no longer matches the approval that admitted the work.",
      detail:
        "Not every action carries the same authority. Review pressure rises when a workflow starts as a suggestion, becomes a commit, requests broader access, or keeps moving after the conditions that justified approval have changed.",
    },
    "authority-boundary-title:Tool access": {
      summary: "Tool access",
      tooltip:
        "Tool, system, environment, API, repository, and record boundaries can blur as workflows expand.",
      detail:
        "An approved task can spread into systems it was never meant to touch, such as APIs, repositories, cloud resources, customer records, or internal tools. That creates approval and recovery burden even when the final output looks useful.",
    },
    "authority-boundary-title:Human review": {
      summary: "Human review",
      tooltip:
        "Human review becomes most important when approval, intervention, narrowing, or responsibility cannot be inferred from the workflow.",
      detail:
        "Some actions need human visibility before they continue, especially when risk, uncertainty, infrastructure impact, customer impact, or policy boundaries are involved. Review becomes painful when it arrives without context.",
    },
    "authority-boundary-title:Action limits": {
      summary: "Action limits",
      tooltip:
        "Action limits become hard to judge when permissions, paths, monitoring expectations, rollback needs, and restrictions are no longer visible.",
      detail:
        "Useful work can outgrow its approved shape. Permissions, workflow scope, evidence, and rollback expectations can separate from the work as it moves from draft to tool use to system change.",
    },
    "authority-boundary-title:Recovery plan": {
      summary: "Recovery plan",
      tooltip:
        "Recovery planning depends on rollback paths, evidence, escalation history, affected systems, and enough context to understand failure.",
      detail:
        "When execution completes or degrades without context, teams struggle to review, investigate, identify owners, roll back, and recover. The longer the workflow ran, the more expensive that reconstruction becomes.",
    },
    "distributed-model-title:Start authority": {
      summary: "Start authority",
      tooltip:
        "Start authority is where the work began, who allowed it, and what assumptions made the first step acceptable.",
      detail:
        "A broken handoff often starts when downstream teams receive the task without knowing who approved it, what scope was granted, or why the first step was considered acceptable.",
    },
    "distributed-model-title:Active limits": {
      summary: "Active limits",
      tooltip:
        "Active limits are the assumptions, safeguards, owners, and conditions that guided the work.",
      detail:
        "Without context, a downstream system may keep acting under assumptions that are no longer true. Relevant limits, owners, safeguards, and recovery expectations can vanish during handoff, leaving the receiver to guess.",
    },
    "distributed-model-title:System handoff": {
      summary: "System handoff",
      tooltip:
        "System handoff is where work moves between tools, workflows, environments, vendors, systems, or people, and context can change during the move.",
      detail:
        "Every handoff can lose approval history, recovery assumptions, or context. Teams may not know what changed, who received responsibility, or whether the next step should continue, pause, narrow, escalate, or be rejected.",
    },
    "distributed-model-title:Handoff history": {
      summary: "Handoff history",
      tooltip:
        "Handoff history is the approval, evidence, execution history, escalation state, ownership, and recovery context that may or may not arrive with the task.",
      detail:
        "Broken handoffs happen when work keeps moving even though its context does not. The next system may inherit the task without the approval basis, recent changes, risk state, or recovery assumptions needed to judge the handoff.",
    },
    "distributed-model-title:Condition drift": {
      summary: "Condition drift",
      tooltip:
        "Instability, interruption, uncertainty, partial failure, or changed assumptions can alter the meaning of an approved task.",
      detail:
        "When dependencies fail or assumptions change, teams need to know what the workflow did, what it touched, whether it paused, and which decisions were made before clarity was lost.",
    },
    "distributed-model-title:Review path": {
      summary: "Review path",
      tooltip:
        "The review path depends on the history needed for investigation, escalation, accountability, rollback, and safe resumption after distributed execution completes or degrades.",
      detail:
        "After distributed work completes or degrades, teams need enough history to investigate, escalate, roll back, recover, or resume operations with the right owner involved and the right assumptions visible.",
    },
  };

  function normalizeRoute(route) {
    return routeRegistry[route] ? route : defaultRoute;
  }

  function updateRouteControls(route) {
    navLinks.forEach((link) => {
      const isActive = link.dataset.route === route;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
    if (mobileRouteSelect && mobileRouteSelect.value !== route) {
      mobileRouteSelect.value = route;
    }
  }

  function nearestVisualId(node) {
    const visual = node.closest(".system-visual");
    const heading = visual ? visual.querySelector("h2[id]") : null;
    return heading ? heading.id : "";
  }

  function nodeTitle(node) {
    const rowHeading = node.querySelector("th");
    const label = node.querySelector("span");
    const title = node.querySelector("strong");
    if (rowHeading) return rowHeading.textContent.trim();
    if (node.parentElement && node.parentElement.classList.contains("stack-model") && label) {
      return label.textContent.trim();
    }
    return title ? title.textContent.trim() : label ? label.textContent.trim() : "Doctrine node";
  }

  function doctrineKey(node) {
    if (node.dataset.doctrineKey) return node.dataset.doctrineKey;
    return `${nearestVisualId(node)}:${nodeTitle(node)}`;
  }

  function ensureDoctrineLayer() {
    if (!tooltipNode) {
      tooltipNode = document.createElement("div");
      tooltipNode.className = "doctrine-tooltip";
      tooltipNode.setAttribute("role", "tooltip");
      tooltipNode.hidden = true;
      document.body.appendChild(tooltipNode);
    }

    if (!detailBackdrop) {
      detailBackdrop = document.createElement("section");
      detailBackdrop.className = "doctrine-detail-backdrop";
      detailBackdrop.hidden = true;

      const panel = document.createElement("article");
      panel.className = "doctrine-detail-panel";
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
      panel.setAttribute("aria-labelledby", "doctrine-detail-title");

      detailClose = document.createElement("button");
      detailClose.className = "doctrine-detail-close";
      detailClose.type = "button";
      detailClose.setAttribute("aria-label", "Close doctrine detail");
      detailClose.textContent = "\u00d7";

      const label = document.createElement("p");
      label.className = "panel-label";
      label.textContent = "Operational doctrine";

      detailTitle = document.createElement("h2");
      detailTitle.id = "doctrine-detail-title";

      detailBody = document.createElement("p");
      detailBody.className = "doctrine-detail-body";

      panel.append(detailClose, label, detailTitle, detailBody);
      detailBackdrop.append(panel);
      document.body.appendChild(detailBackdrop);
      detailClose.addEventListener("click", closeDoctrineDetail);
      detailBackdrop.addEventListener("click", (event) => {
        if (event.target === detailBackdrop) closeDoctrineDetail();
      });
    }
  }

  function doctrineCopy(node) {
    const data = doctrineDetails[doctrineKey(node)] || {};
    const label = node.querySelector("span")?.textContent.trim() || "";
    const titleText = node.querySelector("strong")?.textContent.trim() || "";
    const rowHeading = node.querySelector("th")?.textContent.trim() || "";
    const rowCopy = node.querySelector("td")?.textContent.trim() || "";
    const isStackRow = node.parentElement && node.parentElement.classList.contains("stack-model");
    const title = rowHeading || (isStackRow ? label || titleText || "Doctrine detail" : titleText || label || "Doctrine detail");
    const visibleCopy = rowCopy || node.querySelector("p")?.textContent.trim() || node.querySelector("strong")?.textContent.trim() || "";
    return {
      title: data.title || title,
      summary: data.summary || (isStackRow ? titleText : visibleCopy) || title,
      tooltip:
        data.tooltip ||
        (visibleCopy
          ? `${title}: ${visibleCopy}`
          : `${title} is part of the operational story on this page. Open the detail view to see how it connects to authority, evidence, review, and recovery.`),
      detail:
        data.detail ||
        visibleCopy ||
        data.tooltip ||
        `${title} is a page-specific doctrine point. Its role is to connect the visible model to the operational context described in this section, so the UI adds context instead of only naming a diagram item.`,
    };
  }

  function prepareDoctrineNodes() {
    const doctrineNodes = Array.from(
      (pageHost || document).querySelectorAll(".lineage-flow li, .stack-model > div, .spine-card[data-doctrine-key]")
    );

    doctrineNodes.forEach((node) => {
      node.dataset.doctrineKey = doctrineKey(node);
      const copy = doctrineCopy(node);
      node.classList.add("doctrine-node");
      node.setAttribute("role", "button");
      node.setAttribute("tabindex", "0");
      node.setAttribute("aria-haspopup", "dialog");
      node.setAttribute("aria-label", copy.title + ": " + copy.summary);

      const visibleDetail = node.querySelector("p");
      if (visibleDetail && !(node.parentElement && node.parentElement.classList.contains("stack-model"))) {
        visibleDetail.textContent = copy.summary;
      }

      node.addEventListener("mouseenter", () => showDoctrineTooltip(node));
      node.addEventListener("mouseleave", hideDoctrineTooltip);
      node.addEventListener("focus", () => showDoctrineTooltip(node));
      node.addEventListener("blur", hideDoctrineTooltip);
      node.addEventListener("click", () => openDoctrineDetail(node));
      node.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openDoctrineDetail(node);
      });
    });
  }

  function showDoctrineTooltip(node) {
    ensureDoctrineLayer();
    if (activeDoctrineNode || prefersCoarsePointer.matches) return;
    const visibilityToken = ++tooltipVisibilityToken;
    const copy = doctrineCopy(node);
    tooltipNode.textContent = copy.tooltip;
    tooltipNode.hidden = false;
    tooltipNode.classList.remove("is-visible");

    const rect = node.getBoundingClientRect();
    const gap = 10;
    const maxLeft = window.innerWidth - tooltipNode.offsetWidth - gap;
    const maxTop = window.innerHeight - tooltipNode.offsetHeight - gap;
    const left = Math.max(gap, Math.min(rect.left, maxLeft));
    const top = Math.max(gap, Math.min(rect.bottom + gap, maxTop));
    tooltipNode.style.left = `${left}px`;
    tooltipNode.style.top = `${top}px`;
    window.requestAnimationFrame(() => {
      if (visibilityToken !== tooltipVisibilityToken || !document.contains(node)) return;
      tooltipNode.classList.add("is-visible");
    });
  }

  function showSectionTooltip(node) {
    ensureDoctrineLayer();
    if (activeDoctrineNode || prefersCoarsePointer.matches) return;
    const visibilityToken = ++tooltipVisibilityToken;
    tooltipNode.textContent = node.dataset.sectionTooltip || "";
    tooltipNode.hidden = false;
    tooltipNode.classList.remove("is-visible");

    const rect = node.getBoundingClientRect();
    const gap = 10;
    const maxLeft = window.innerWidth - tooltipNode.offsetWidth - gap;
    const maxTop = window.innerHeight - tooltipNode.offsetHeight - gap;
    const left = Math.max(gap, Math.min(rect.left, maxLeft));
    const top = Math.max(gap, Math.min(rect.bottom + gap, maxTop));
    tooltipNode.style.left = `${left}px`;
    tooltipNode.style.top = `${top}px`;
    window.requestAnimationFrame(() => {
      if (visibilityToken !== tooltipVisibilityToken || !document.contains(node)) return;
      tooltipNode.classList.add("is-visible");
    });
  }

  function hideDoctrineTooltip() {
    if (!tooltipNode) return;
    tooltipVisibilityToken += 1;
    tooltipNode.classList.remove("is-visible");
    window.setTimeout(() => {
      if (!tooltipNode.classList.contains("is-visible")) tooltipNode.hidden = true;
    }, 140);
  }

  function openDoctrineDetail(node) {
    ensureDoctrineLayer();
    const copy = doctrineCopy(node);
    hideDoctrineTooltip();
    activeDoctrineNode = node;
    lastDoctrineFocus = document.activeElement instanceof HTMLElement ? document.activeElement : node;
    detailTitle.textContent = copy.title;
    detailBody.textContent = copy.detail;
    detailBackdrop.hidden = false;
    document.body.classList.add("modal-open", "doctrine-detail-open");
    window.requestAnimationFrame(() => detailBackdrop.classList.add("is-visible"));
    detailClose.focus();
  }

  function openSectionDetail(node) {
    ensureDoctrineLayer();
    hideDoctrineTooltip();
    activeDoctrineNode = node;
    lastDoctrineFocus = document.activeElement instanceof HTMLElement ? document.activeElement : node;
    detailTitle.textContent = node.textContent.trim();
    detailBody.textContent = node.dataset.sectionTooltip || "";
    detailBackdrop.hidden = false;
    document.body.classList.add("modal-open", "doctrine-detail-open");
    window.requestAnimationFrame(() => detailBackdrop.classList.add("is-visible"));
    detailClose.focus();
  }

  function trapFocus(event, container) {
    if (event.key !== "Tab" || !container || container.hidden) return false;
    const focusable = Array.from(container.querySelectorAll(focusableSelector))
      .filter((element) => element.offsetParent !== null || element === document.activeElement);
    if (!focusable.length) return false;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return true;
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
      return true;
    }
    return false;
  }

  function closeDoctrineDetail() {
    if (!detailBackdrop || detailBackdrop.hidden) return;
    detailBackdrop.classList.remove("is-visible");
    window.setTimeout(() => {
      if (!detailBackdrop.classList.contains("is-visible")) detailBackdrop.hidden = true;
    }, 150);
    document.body.classList.remove("doctrine-detail-open");
    if (!contactModal || contactModal.hidden) document.body.classList.remove("modal-open");
    activeDoctrineNode = null;
    if (lastDoctrineFocus && document.contains(lastDoctrineFocus)) lastDoctrineFocus.focus();
  }

  function prepareSectionTooltips() {
    const sectionTooltipTriggers = Array.from((pageHost || document).querySelectorAll("[data-section-tooltip]"));
    sectionTooltipTriggers.forEach((node) => {
      node.setAttribute("aria-label", node.textContent.trim() + ". More information available: " + (node.dataset.sectionTooltip || ""));
      node.addEventListener("mouseenter", () => showSectionTooltip(node));
      node.addEventListener("mouseleave", hideDoctrineTooltip);
      node.addEventListener("focus", () => showSectionTooltip(node));
      node.addEventListener("blur", hideDoctrineTooltip);
      node.addEventListener("click", () => {
        if (prefersCoarsePointer.matches) openSectionDetail(node);
      });
      node.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openSectionDetail(node);
      });
    });
  }

  function organicPolygonPath(baseRadius, variance, pointCount, cx = 50, cy = 50, rotation = -Math.PI / 2) {
    const points = Array.from({ length: pointCount }, (_, index) => {
      const angle = rotation + (Math.PI * 2 * index) / pointCount;
      const jitter = (Math.random() - 0.5) * variance;
      const radius = baseRadius + jitter;
      return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
    });
    return `${points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")}Z`;
  }

  function startHexringNucleusMutator() {
    const nucleus = document.querySelector(".hexring-nucleus");
    if (!nucleus || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rotation = -Math.PI / 2;
    let previousPointCount = 9;
    const mutate = () => {
      const pointCount = 7 + Math.floor(Math.random() * 5);
      const rotationStep = 0.16 + pointCount * 0.012;
      const delay = 2100 - pointCount * 85 + Math.floor(Math.random() * 180);
      const transitionMs = Math.max(780, Math.min(1180, delay * 0.62));

      rotation += rotationStep;
      nucleus.style.transitionDuration = `${transitionMs}ms`;
      if (pointCount !== previousPointCount) {
        previousPointCount = pointCount;
      }
      nucleus.setAttribute("d", organicPolygonPath(13.6, 0.42, pointCount, 50, 50, rotation));
      window.setTimeout(mutate, delay);
    };
    window.setTimeout(mutate, 1400);
  }

  function openContactModal() {
    if (!contactModal) return;
    lastContactFocus = document.activeElement instanceof HTMLElement ? document.activeElement : contactTrigger;
    contactModal.hidden = false;
    document.body.classList.add("modal-open");
    if (contactTrigger) contactTrigger.classList.add("is-active");
    const firstField = contactModal.querySelector("input, select, textarea");
    if (firstField) firstField.focus();
  }

  function closeContactModal() {
    if (!contactModal) return;
    closePrivacyDisclosure();
    contactModal.hidden = true;
    document.body.classList.remove("modal-open");
    if (contactTrigger) contactTrigger.classList.remove("is-active");
    if (lastContactFocus && document.contains(lastContactFocus)) {
      lastContactFocus.focus();
    } else if (contactTrigger) {
      contactTrigger.focus();
    }
  }

  function buildInquiryBody(formData) {
    return [
      "NeurHAL runtime assurance research inquiry",
      "",
      `Name: ${formData.get("name") || ""}`,
      `Email: ${formData.get("email") || ""}`,
      `Organization: ${formData.get("organization") || ""}`,
      `Role / title: ${formData.get("role") || ""}`,
      `Inquiry focus: ${formData.get("interest") || ""}`,
      "",
      "Study or artifact review request:",
      formData.get("message") || "",
    ].join("\n");
  }

  function closePrivacyDisclosure() {
    if (!privacyDisclosure || !privacyTrigger) return;
    privacyDisclosure.classList.remove("is-open");
    privacyTrigger.setAttribute("aria-expanded", "false");
    const panel = privacyDisclosure.querySelector("[data-privacy-panel]");
    if (panel) panel.hidden = true;
  }

  function togglePrivacyDisclosure() {
    if (!privacyDisclosure || !privacyTrigger) return;
    const isOpen = privacyDisclosure.classList.toggle("is-open");
    privacyTrigger.setAttribute("aria-expanded", String(isOpen));
    const panel = privacyDisclosure.querySelector("[data-privacy-panel]");
    if (panel) panel.hidden = !isOpen;
  }

  function clearRouteIntervals() {
    governanceDecisionIntervals.forEach((intervalId) => window.clearInterval(intervalId));
    governanceDecisionIntervals = [];
  }

  function syncRouteStyles(route) {
    const wanted = new Set(routeRegistry[route].css || []);
    activeRouteStyles.forEach((link, href) => {
      if (!wanted.has(href)) {
        link.remove();
        activeRouteStyles.delete(href);
      }
    });

    const pending = [];
    wanted.forEach((href) => {
      if (activeRouteStyles.has(href)) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.dataset.routeAnimationAsset = route;
      activeRouteStyles.set(href, link);
      pending.push(new Promise((resolve, reject) => {
        link.addEventListener("load", resolve, { once: true });
        link.addEventListener("error", () => reject(new Error("Unable to load " + href)), { once: true });
      }));
      document.head.appendChild(link);
    });
    return Promise.all(pending);
  }

  function loadRouteScripts(route) {
    const scripts = routeRegistry[route].js || [];
    return Promise.all(scripts.map((src) => {
      if (loadedRouteScripts.has(src)) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.defer = true;
        script.dataset.routeAnimationAsset = route;
        script.addEventListener("load", () => {
          loadedRouteScripts.add(src);
          resolve();
        }, { once: true });
        script.addEventListener("error", () => reject(new Error("Unable to load " + src)), { once: true });
        document.body.appendChild(script);
      });
    }));
  }

  function runRouteAnimationInitializers(route) {
    const registry = window.NeurHALAnimations || {};
    (routeRegistry[route].initializers || []).forEach((name) => {
      if (typeof registry[name] === "function") registry[name](pageHost || document);
    });
  }

  function setGovernanceDecision(lab) {
    const isApproved = Math.random() < 0.78;
    lab.classList.toggle("decision-approved", isApproved);
    lab.classList.toggle("decision-denied", !isApproved);
  }

  function prepareGovernanceDecisionLabs() {
    clearRouteIntervals();
    const governanceDecisionLabs = Array.from((pageHost || document).querySelectorAll(".governance-tabs-lab"));
    governanceDecisionLabs.forEach((lab) => {
      setGovernanceDecision(lab);
      governanceDecisionIntervals.push(window.setInterval(() => setGovernanceDecision(lab), 8800));
    });
  }

  function renderRouteError(route, error) {
    if (!pageHost) return;
    const page = document.createElement("section");
    page.className = "page is-active";
    page.dataset.page = route;
    page.innerHTML = '<section class="page-hero"><h1 class="eyebrow">Page unavailable</h1><p>The requested NeurHAL page could not be loaded. ' + error.message + '</p></section>';
    pageHost.replaceChildren(page);
  }

  async function setRoute(route, push = true) {
    const nextRoute = normalizeRoute(route);
    const requestToken = ++routeRequestToken;
    currentRoute = nextRoute;
    updateRouteControls(nextRoute);
    if (push) history.replaceState(null, "", "#" + nextRoute);
    hideDoctrineTooltip();
    clearRouteIntervals();

    if (!pageHost) return;
    pageHost.classList.add("is-loading");

    try {
      await syncRouteStyles(nextRoute);
      const response = await fetch(routeRegistry[nextRoute].partial, { cache: "no-cache" });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const partialMarkup = await response.text();
      if (requestToken !== routeRequestToken) return;

      pageHost.innerHTML = partialMarkup;
      const activePage = pageHost.querySelector("[data-page]");
      if (activePage) {
        activePage.hidden = false;
        activePage.classList.add("is-active");
      }

      await loadRouteScripts(nextRoute);
      if (requestToken !== routeRequestToken) return;
      prepareDoctrineNodes();
      prepareSectionTooltips();
      prepareGovernanceDecisionLabs();
      runRouteAnimationInitializers(nextRoute);
      pageHost.classList.remove("is-loading");
      window.scrollTo({ top: 0, behavior: push ? "smooth" : "auto" });
    } catch (error) {
      if (requestToken !== routeRequestToken) return;
      pageHost.classList.remove("is-loading");
      renderRouteError(nextRoute, error);
      console.error(error);
    }
  }


  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const route = link.dataset.route;
      if (!route) return;
      event.preventDefault();
      setRoute(route);
    });
  });

  if (mobileRouteSelect) {
    mobileRouteSelect.addEventListener("change", () => {
      const selectedRoute = mobileRouteSelect.value;
      if (selectedRoute === "contact") {
        openContactModal();
        mobileRouteSelect.value = currentRoute || defaultRoute;
        return;
      }
      setRoute(selectedRoute);
    });
  }

  if (contactTrigger) {
    contactTrigger.addEventListener("click", openContactModal);
  }

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-contact-open]");
    if (!trigger) return;
    event.preventDefault();
    openContactModal();
  });

  if (privacyTrigger) {
    privacyTrigger.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      togglePrivacyDisclosure();
    });
  }

  document.addEventListener("click", (event) => {
    if (!privacyDisclosure || !privacyDisclosure.classList.contains("is-open")) return;
    if (event.target.closest(".privacy-disclosure")) return;
    closePrivacyDisclosure();
  });

  contactCloseButtons.forEach((button) => {
    button.addEventListener("click", closeContactModal);
  });

  if (contactModal) {
    contactModal.addEventListener("click", (event) => {
      if (event.target === contactModal) closeContactModal();
    });
  }

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(contactForm);
      const subject = encodeURIComponent(`NeurHAL inquiry: ${formData.get("interest") || "Contact"}`);
      const body = encodeURIComponent(buildInquiryBody(formData));
      const mailtoUrl = `mailto:founder@neurhal.net?subject=${subject}&body=${body}`;
      if (mailtoUrl.length > maxMailtoLength) {
        const messageField = contactForm.querySelector("textarea[name='message']");
        if (messageField) messageField.focus();
        window.alert("Please shorten the message before opening the email draft. Detailed materials should be handled after the initial contact.");
        return;
      }
      window.location.href = mailtoUrl;
      contactForm.reset();
      closeContactModal();
    });
  }

  window.addEventListener("keydown", (event) => {
    if (trapFocus(event, detailBackdrop) || trapFocus(event, contactModal)) return;
    if (event.key !== "Escape") return;
    if (detailBackdrop && !detailBackdrop.hidden) {
      closeDoctrineDetail();
      return;
    }
    if (privacyDisclosure && privacyDisclosure.classList.contains("is-open")) {
      closePrivacyDisclosure();
      return;
    }
    if (contactModal && !contactModal.hidden) {
      closeContactModal();
    }
  });

  window.addEventListener("hashchange", () => setRoute(window.location.hash.replace("#", ""), false));

  startHexringNucleusMutator();
  setRoute(window.location.hash.replace("#", "") || defaultRoute, false);
})();
