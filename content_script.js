(() => {
"use strict";

const SCORING_CONFIG = { APPROVAL_FLOOR: 0.92, APPROVAL_CEILING: 0.98, VELOCITY_REF: 50 };
const WEIGHTS = { APPROVAL: 0.45, REACH: 0.25, ENGAGEMENT: 0.20, VOL: 0.10 };
const UI_CONFIG = {
  PILL_ID:    "fodder-pill",
  BENTO_ID:   "fodder-bento-portal",
  CONTAINERS: "yt-lockup-view-model, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-rich-grid-media",
};

const TIER_MAP = {
  organic:   { verdict: "Certified Fresh", detail: "High signal, pure content." },
  filler:    { verdict: "Edible",           detail: "Processed, caloric but empty." },
  synthetic: { verdict: "Bio-Hazard",       detail: "Do not consume." },
};

const SLOP_CLASS = {
  SYNTHETIC: "slop-synthetic",
  ASSISTED:  "slop-filler",
  HYBRID:    "slop-hybrid",
  SCRIPTED:  "slop-scripted",
  ORGANIC:   "slop-organic",
  UNKNOWN:   "slop-unknown",
};

const DRIFT_MAP = {
  VIRAL:       { cls: "drift-viral",       label: "VIRAL",       arrow: "↑↑" },
  BUILDING:    { cls: "drift-building",    label: "BUILDING",    arrow: "↑"  },
  STABLE:      { cls: "drift-stable",      label: "STABLE",      arrow: "→"  },
  SOURING:     { cls: "drift-souring",     label: "SOURING",     arrow: "↓"  },
  SPOILING:    { cls: "drift-spoiling",    label: "SPOILING",    arrow: "↓↓" },
  ASTROTURFED: { cls: "drift-astroturfed", label: "ASTROTURFED", arrow: "⚠"  },
};

const AUTH_CLASS = { high: "llm-signal-high", medium: "llm-signal-medium", low: "llm-signal-low" };

// ─── ICON LOADER ────────────────────────────────────────────────────────────
const getIconUrl = (tier) => {
  const isDark = document.documentElement.hasAttribute("dark");
  const suffix = isDark ? "" : "-light";
  return chrome.runtime.getURL(`icons/badge-${tier}${suffix}.png`);
};

const activePills   = new Map();
const analysisCache = new Map();
let pinnedVideoId   = null;

function checkTheme() {
  const isDark = document.documentElement.hasAttribute("dark");
  document.body.classList.toggle("fodder-light-theme", !isDark);
  document.querySelectorAll(".fodder-icon-dock img, .fodder-watermark").forEach(img => {
    if (img.dataset.tier) {
      img.src = getIconUrl(img.dataset.tier);
    }
  });
}

// ─── RYD SCORING ────────────────────────────────────────────────────────────
function computeScore(data) {
  const { likes: L = 0, dislikes: D = 0, viewCount: V = 0, subscribers: S = 1 } = data;
  const A   = Math.min(Math.max((((L+1)/(L+D+2)) - SCORING_CONFIG.APPROVAL_FLOOR) / (SCORING_CONFIG.APPROVAL_CEILING - SCORING_CONFIG.APPROVAL_FLOOR), 0), 1);
  const G   = Math.min(Math.max(Math.log(1+(V/S)) / Math.log(1+SCORING_CONFIG.VELOCITY_REF), 0), 1);
  const I   = Math.min(((L+D)/V) / 0.03, 1);
  const Vol = Math.min(Math.log(1+L) / 10, 1);
  const score = Math.round(Math.max(0, (A*45)+(G*25)+(I*20)+(Vol*10)) * 10) / 10;

  const impact = (val, w) => {
    if (val >= 0.95) return "positive";
    const loss = (1-val)*w;
    return loss > 0.15 ? "severe" : loss > 0.08 ? "moderate" : loss > 0.03 ? "light" : "none";
  };

  return {
    score,
    tier: score >= 70 ? "organic" : score >= 40 ? "filler" : "synthetic",
    stats: {
      APPROVAL:   { val: A,   glow: impact(A,   WEIGHTS.APPROVAL)   },
      REACH:      { val: G,   glow: impact(G,   WEIGHTS.REACH)      },
      ENGAGEMENT: { val: I,   glow: impact(I,   WEIGHTS.ENGAGEMENT) },
    },
  };
}

// ─── BENTO RENDERER ─────────────────────────────────────────────────────────
function renderBento(result, parent, analysis = null, pinned = false) {
  document.getElementById(UI_CONFIG.BENTO_ID)?.remove();

  const bento = document.createElement("div");
  bento.id        = UI_CONFIG.BENTO_ID;
  bento.className = `fodder-reset tier-${result.tier}${pinned ? " bento-pinned" : ""}`;
  bento.style.cssText = "position:absolute;top:42px;left:0;z-index:2147483647;width:272px;overflow:hidden;";

  const metric = (label, d) =>
    `<div class="fodder-metric glow-${d.glow}"><span class="label">${label}</span><span class="val">${(d.val*100).toFixed(0)}%</span></div>`;

  let slopHtml = "", driftHtml = "", insightHtml = "";

  if (analysis === "loading") {
    slopHtml = `<div class="fodder-slop-row"><span class="fodder-slop-label">SLOP DENSITY</span><span class="fodder-slop-loading">Analyzing transcript…</span></div>`;
  } else if (analysis?.slopData) {
    const { slopScore, humanScore, verdict } = analysis.slopData;
    const cls = SLOP_CLASS[verdict] || "slop-unknown";

    // Source tag: show where transcript came from
    const src = analysis.transcript?.source;
    const srcTag = src === "supadata-api"
      ? `<span class="fodder-auto-tag fodder-manual-tag">API</span>`
      : src === "none"
        ? `<span class="fodder-auto-tag">NO DATA</span>`
        : `<span class="fodder-auto-tag">${(src || "?").toUpperCase()}</span>`;

    slopHtml = `
      <div class="fodder-slop-row">
        <span class="fodder-slop-label">SLOP DENSITY</span>
        <span class="fodder-slop-verdict ${cls}">${verdict}</span>
        ${srcTag}
      </div>
      <div class="fodder-slop-bars">
        <div class="fodder-bar-row">
          <span class="bar-label">AI</span>
          <div class="fodder-bar-track"><div class="fodder-bar-fill slop-fill" style="width:${slopScore}%"></div></div>
          <span class="bar-val">${slopScore}%</span>
        </div>
        <div class="fodder-bar-row">
          <span class="bar-label">HUMAN</span>
          <div class="fodder-bar-track"><div class="fodder-bar-fill human-fill" style="width:${humanScore}%"></div></div>
          <span class="bar-val">${humanScore}%</span>
        </div>
      </div>`;

    // Show error hint if transcript failed
    if (analysis.transcript?.error && !analysis.transcript?.text) {
      slopHtml += `<div class="fodder-slop-error">${analysis.transcript.error}</div>`;
    }

    const llm = analysis.llm;
    if (llm?.drift_state) {
      const dm = DRIFT_MAP[llm.drift_state] || DRIFT_MAP.STABLE;
      const scoreLabel = typeof llm.drift_score === "number"
        ? `<span class="drift-score">${llm.drift_score > 0 ? "+" : ""}${llm.drift_score}%</span>`
        : "";
      const botLine = llm.botsDetected > 0
        ? `<div class="drift-bot-warn"><span class="drift-bot-icon">⚠</span>${llm.botRatio}% inorganic — ${llm.botsDetected} clones removed</div>`
        : "";

      driftHtml = `
        <div class="fodder-drift-card ${dm.cls}">
          <div class="drift-header">
            <span class="drift-label-text">AUDIENCE DRIFT</span>
            <div class="drift-state-row">
              <span class="drift-arrow">${dm.arrow}</span>
              <span class="drift-state">${dm.label}</span>
              ${scoreLabel}
            </div>
          </div>
          ${botLine}
          ${llm.community_insight ? `<p class="drift-insight">${llm.community_insight}</p>` : ""}
        </div>`;
    } else if (llm !== null && !llm?.drift_state && analysis.comments === null) {
      driftHtml = `
        <div class="fodder-drift-card drift-empty">
          <div class="drift-header">
            <span class="drift-label-text">AUDIENCE DRIFT</span>
            <span class="drift-no-key">Add YouTube API key for audience analysis →</span>
          </div>
        </div>`;
    }

    if (llm?.transcript_verdict) {
      const sigClass = AUTH_CLASS[llm.authenticity_signal] || "llm-signal-medium";
      insightHtml = `
        <div class="fodder-clinical">
          <span class="fodder-clinical-label">VERDICT <span class="fodder-llm-badge">AI</span></span>
          <p class="fodder-clinical-text ${sigClass}">${llm.transcript_verdict}</p>
        </div>`;
    } else if (llm === null) {
      insightHtml = `<div class="fodder-clinical fodder-clinical-dim"><span class="fodder-clinical-label">VERDICT</span><p class="fodder-clinical-text">Add an OpenRouter key in the extension popup to enable AI analysis.</p></div>`;
    }
  }

  const pinHint = pinned
    ? `<span class="bento-pin-hint">click pill to unpin</span>`
    : `<span class="bento-pin-hint">click to pin</span>`;

  bento.innerHTML = `
    <img class="fodder-watermark" data-tier="${result.tier}" src="${getIconUrl(result.tier)}">
    <div class="fodder-bento-header">
      <span class="fodder-brand">FODDER SYSTEM</span>
      <span class="fodder-verdict">${TIER_MAP[result.tier].verdict}</span>
    </div>
    <div class="fodder-score-main">${result.score}</div>
    <div class="fodder-metric-grid">
      ${metric("APPROVAL", result.stats.APPROVAL)}
      ${metric("REACH",    result.stats.REACH)}
      ${metric("ENGAGEMENT", result.stats.ENGAGEMENT)}
    </div>
    ${slopHtml}
    ${driftHtml}
    ${insightHtml}
    <div class="fodder-bento-footer">${TIER_MAP[result.tier].detail}</div>
    <div class="bento-pin-row">${pinHint}</div>`;

  parent.appendChild(bento);
}

// ─── MAIN PIPELINE ──────────────────────────────────────────────────────────
async function analyzeMainVideo() {
  const vId = new URLSearchParams(window.location.search).get("v");
  if (!vId || activePills.has(vId)) return;
  const target = document.querySelector("h1.ytd-watch-metadata, #title h1, ytd-watch-metadata #title");
  if (!target) return;

  document.getElementById(UI_CONFIG.PILL_ID)?.remove();

  try {
    const ryd = await new Promise(res => chrome.runtime.sendMessage({ type: "FETCH_RYD", videoId: vId }, res));
    if (!ryd) return;
    const result = computeScore(ryd);

    const wrapper = document.createElement("div");
    wrapper.id        = UI_CONFIG.PILL_ID;
    wrapper.className = `fodder-reset fodder-unified-dock tier-${result.tier}`;
    wrapper.style.position = "relative";
    wrapper.innerHTML = `
      <div class="fodder-icon-dock"><img data-tier="${result.tier}" src="${getIconUrl(result.tier)}"></div>
      <div class="fodder-score-pill">
        <span class="fodder-score">${result.score}</span>
        <span class="fodder-label">${result.tier.toUpperCase()}</span>
        <span class="fodder-slp-inline" id="fodder-slp-inline">SLP…</span>
      </div>`;

    wrapper.addEventListener("click", (e) => {
      e.stopPropagation();
      if (pinnedVideoId === vId) {
        pinnedVideoId = null;
        document.getElementById(UI_CONFIG.BENTO_ID)?.remove();
      } else {
        pinnedVideoId = vId;
        const a = analysisCache.get(vId);
        renderBento(result, wrapper, a !== undefined ? a : "loading", true);
      }
    });

    wrapper.addEventListener("mouseenter", () => {
      if (pinnedVideoId === vId) return;
      const a = analysisCache.get(vId);
      renderBento(result, wrapper, a !== undefined ? a : "loading", false);
    });
    wrapper.addEventListener("mouseleave", () => {
      if (pinnedVideoId === vId) return;
      document.getElementById(UI_CONFIG.BENTO_ID)?.remove();
    });

    document.addEventListener("click", (e) => {
      if (pinnedVideoId !== vId) return;
      const bento = document.getElementById(UI_CONFIG.BENTO_ID);
      if (bento && !bento.contains(e.target) && !wrapper.contains(e.target)) {
        pinnedVideoId = null;
        bento.remove();
      }
    }, { capture: true });

    target.prepend(wrapper);
    activePills.set(vId, true);
    checkTheme();

    // Fire analysis — background handles everything via Supadata API
    chrome.runtime.sendMessage({
      type:    "FETCH_ANALYSIS",
      videoId: vId,
    }, (analysis) => {
      if (!analysis) return;
      analysisCache.set(vId, analysis);

      const badge = document.getElementById("fodder-slp-inline");
      if (badge && analysis.slopData) {
        const { slopScore, verdict } = analysis.slopData;
        badge.textContent = `SLP ${slopScore}%`;
        badge.className   = `fodder-slp-inline ${SLOP_CLASS[verdict] || ""}`;
      }

      const openBento = document.getElementById(UI_CONFIG.BENTO_ID);
      const isPinned  = pinnedVideoId === vId;
      if (openBento && (isPinned || wrapper.matches(":hover"))) {
        renderBento(result, wrapper, analysis, isPinned);
      }
    });

  } catch (e) { /* silent */ }
}

async function processVideo(container) {
  const link = container.querySelector("a.yt-lockup-view-model__content-image, a#thumbnail, a.ytd-thumbnail, #video-title-link");
  if (!link) return;
  const vId = (link.getAttribute("href") || "").match(/[?&]v=([^&]+)/)?.[1];
  if (!vId || (link.getAttribute("href") || "").includes("list=") || container.dataset.processedId === vId) return;
  container.dataset.processedId = vId;
  try {
    const ryd    = await new Promise(res => chrome.runtime.sendMessage({ type: "FETCH_RYD", videoId: vId }, res));
    const result = computeScore(ryd);
    container.querySelector(".fodder-mini-badge")?.remove();
    const badge       = document.createElement("div");
    badge.className   = `fodder-mini-badge tier-${result.tier}`;
    badge.textContent = result.score;
    container.style.position = "relative";
    container.appendChild(badge);
  } catch (e) { /* silent */ }
}

new MutationObserver(checkTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["dark"] });
new MutationObserver(() => { document.querySelectorAll(UI_CONFIG.CONTAINERS).forEach(processVideo); })
  .observe(document.body, { childList: true, subtree: true });
window.addEventListener("yt-navigate-finish", () => {
  activePills.clear(); analysisCache.clear(); pinnedVideoId = null;
  document.getElementById(UI_CONFIG.BENTO_ID)?.remove();
  setTimeout(() => { analyzeMainVideo(); checkTheme(); }, 600);
});
document.querySelectorAll(UI_CONFIG.CONTAINERS).forEach(processVideo);
if (location.pathname === "/watch") setTimeout(analyzeMainVideo, 800);
checkTheme();
})();
