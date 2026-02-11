// content_script.js — Fodder v5.0 (Self-Contained)
// All modules combined to avoid ES6 import issues in Chrome extensions

(() => {
"use strict";

// ═══════════════════════════════════════════════════════════════
//  CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const WEIGHTS = {
  approval: 0.45,
  velocity: 0.25,
  integrity: 0.15,
  volume: 0.10,
  clickbait: 0.025,
};

const SCORING_CONFIG = {
  K: 10,
  MU: 0.5,
  APPROVAL_FLOOR: 0.92,
  APPROVAL_CEILING: 0.98,
  VOLUME_REF_LIKES: 10000,
  VELOCITY_REF: 50,
  VELOCITY_DAYS_OPTIMAL: 7,
  VELOCITY_DAYS_PENALTY: 365,
  VELOCITY_ENGAGEMENT_WEIGHT: 0.3,
  INTEGRITY_TARGET: 0.03,
  SLOP_FLOOR_THRESHOLD: 0.001,
  SLOP_FLOOR_PENALTY: 0.5,
  SLOP_MIN_VIEWS: 5000,
  DECAY_RATE: 0.95,
  CLICKBAIT_CAPS_THRESHOLD: 0.5,
  CLICKBAIT_EMOJI_THRESHOLD: 3,
  CLICKBAIT_WORDS: [
    "you won't believe", "insane", "shocking", "no way", "mind blown",
    "gone wrong", "not clickbait", "i tried", "challenge", "prank",
    "hack", "exposed", "destroyed", "impossible", "unbelievable",
    "secret", "they don't want you", "finally revealed", "truth about",
    "you need to see", "will shock you", "can't believe", "never expected"
  ],
  CONFIDENCE_FULL: 50,
  CONFIDENCE_LOW: 5,
  TIER_ORGANIC: 70,
  TIER_FILLER: 40,
};

const UI_CONFIG = {
  PILL_ID: "fodder-pill",
  BENTO_ID: "fodder-bento-portal",
  MINI_BADGE_CLASS: "fodder-mini-badge",
  DESAT_CLASS: "fodder-desaturated",
  DEBOUNCE_MS: 500,
  INITIAL_SCAN_DELAY_MS: 1000,
};

const TIER_CONFIG = {
  organic: {
    label: "ORGANIC",
    verdict: "Certified Fresh",
    detail: "High signal, pure content.",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3C9.5 3 7.5 4.5 6.5 6.5C5.5 8.5 5 11 6 13C7 15 8.5 16.5 10.5 17.5C11.5 18 12.5 18 13.5 17.5C15.5 16.5 17 15 18 13C19 11 18.5 8.5 17.5 6.5C16.5 4.5 14.5 3 12 3Z" stroke-linejoin="round"/><path d="M12 3L12 1" stroke-linecap="round"/></svg>`,
    cssClass: "tier-organic",
  },
  filler: {
    label: "FILLER",
    verdict: "Edible",
    detail: "Processed, caloric but empty.",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="4" width="8" height="16" rx="1"/><path d="M8 9H16M8 12H16M8 15H16"/><path d="M8 3C8 3 10 2 12 2C14 2 16 3 16 3"/></svg>`,
    cssClass: "tier-filler",
  },
  synthetic: {
    label: "SYNTHETIC",
    verdict: "Bio-Hazard",
    detail: "Do not consume.",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L20 7L20 17L12 22L4 17L4 7L12 2Z" stroke-linejoin="bevel"/><path d="M12 2L12 22 M12 12L20 17 M12 12L4 17" opacity="0.5"/></svg>`,
    cssClass: "tier-synthetic",
  },
};

// ═══════════════════════════════════════════════════════════════
//  SCORE CACHE — ensures same videoId always shows same score
// ═══════════════════════════════════════════════════════════════

const SCORE_CACHE = new Map();
const SCORE_CACHE_MAX = 200;

function cacheScore(videoId, result) {
  SCORE_CACHE.set(videoId, result);
  if (SCORE_CACHE.size > SCORE_CACHE_MAX) {
    const firstKey = SCORE_CACHE.keys().next().value;
    SCORE_CACHE.delete(firstKey);
  }
}

// ═══════════════════════════════════════════════════════════════
//  SCORING ENGINE
//  ──────────────────────────────────────────────────────────────
//  🧮 MODIFY THIS SECTION TO CHANGE THE EQUATION
// ═══════════════════════════════════════════════════════════════

function computeClickbait(title) {
  if (!title) return 0;
  
  let signals = 0;
  const lower = title.toLowerCase();
  
  const letters = title.replace(/[^a-zA-Z]/g, "");
  if (letters.length > 3) {
    const upperRatio = letters.replace(/[^A-Z]/g, "").length / letters.length;
    if (upperRatio > SCORING_CONFIG.CLICKBAIT_CAPS_THRESHOLD) {
      signals += 0.4;
    }
  }
  
  let keywordHits = 0;
  for (const word of SCORING_CONFIG.CLICKBAIT_WORDS) {
    if (lower.includes(word)) keywordHits++;
  }
  signals += Math.min(keywordHits * 0.2, 0.4);
  
  const emojiCount = (title.match(/[\u{1F600}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}]/gu) || []).length;
  if (emojiCount >= SCORING_CONFIG.CLICKBAIT_EMOJI_THRESHOLD) {
    signals += 0.2;
  }
  
  return Math.min(signals, 1.0);
}

function computeScore({ likes, dislikes, viewCount, subscribers, daysOld, title }) {
  const L = likes || 0;
  const D = dislikes || 0;
  const V = viewCount || 0;
  const S = Math.max(subscribers || 1, 1);
  const Veff = L + D;
  
  // Approval
  const alpha = (L + 1) / (L + D + 2);
  const bayesian = (alpha * Veff + SCORING_CONFIG.K * SCORING_CONFIG.MU) / 
                   (Veff + SCORING_CONFIG.K);
  const range = SCORING_CONFIG.APPROVAL_CEILING - SCORING_CONFIG.APPROVAL_FLOOR;
  const A = Math.min(Math.max((bayesian - SCORING_CONFIG.APPROVAL_FLOOR) / range, 0), 1);
  
  // Volume
  const volumeRaw = Math.log(1 + L) / Math.log(1 + SCORING_CONFIG.VOLUME_REF_LIKES);
  const volumeScore = Math.min(Math.max(volumeRaw, 0), 1.0);
  
  // Velocity
  const rawRatio = V / S;
  const gammaBase = Math.log(1 + rawRatio) / Math.log(1 + SCORING_CONFIG.VELOCITY_REF);
  
  const ageInDays = Math.max(daysOld, 0.1);
  const engagementVelocity = V > 0 ? (Veff / V) / ageInDays : 0;
  
  const recencyBonus = daysOld <= SCORING_CONFIG.VELOCITY_DAYS_OPTIMAL 
    ? 1.0 + (0.2 * (1 - daysOld / SCORING_CONFIG.VELOCITY_DAYS_OPTIMAL))
    : 1.0 / (1 + Math.log(1 + daysOld / SCORING_CONFIG.VELOCITY_DAYS_PENALTY));
  
  const velocityModifier = 1.0 + Math.min(
    engagementVelocity * 100 * SCORING_CONFIG.VELOCITY_ENGAGEMENT_WEIGHT, 
    0.3
  );
  
  const gamma = Math.min(Math.max(gammaBase * recencyBonus * velocityModifier, 0), 1.0);
  
  // Integrity
  const interactionRate = V > 0 ? Veff / V : 0;
  const I = Math.min(interactionRate / SCORING_CONFIG.INTEGRITY_TARGET, 1.0);
  
  // Clickbait
  const C = computeClickbait(title || "");
  
  // Composite
  let composite = 
    WEIGHTS.approval * A +
    WEIGHTS.velocity * gamma +
    WEIGHTS.integrity * I +
    WEIGHTS.volume * volumeScore -
    WEIGHTS.clickbait * C;
  
  composite = Math.min(Math.max(composite, 0), 1);
  
  // Temporal decay
  const decay = Math.pow(SCORING_CONFIG.DECAY_RATE, daysOld / 365);
  
  let score = composite * decay * 100;
  score = Math.min(100, Math.max(0, score));
  
  // Hard floor for extreme slop
  let slopFlag = false;
  if (interactionRate < SCORING_CONFIG.SLOP_FLOOR_THRESHOLD && 
      V > SCORING_CONFIG.SLOP_MIN_VIEWS) {
    score *= SCORING_CONFIG.SLOP_FLOOR_PENALTY;
    slopFlag = true;
  }
  
  // Confidence
  let confidence;
  if (Veff >= SCORING_CONFIG.CONFIDENCE_FULL) {
    confidence = "full";
  } else if (Veff >= SCORING_CONFIG.CONFIDENCE_LOW) {
    confidence = "low_sample";
  } else {
    confidence = "low_confidence";
  }
  
  // Tier
  let tier;
  if (score >= SCORING_CONFIG.TIER_ORGANIC) {
    tier = "organic";
  } else if (score >= SCORING_CONFIG.TIER_FILLER) {
    tier = "filler";
  } else {
    tier = "synthetic";
  }
  
  return {
    score: Math.round(score * 10) / 10,
    tier,
    slopFlag,
    confidence,
    clickbaitScore: C,
    interactionDensity: (interactionRate * 100).toFixed(2),
    raw: {
      A, bayesian, gamma, gammaBase, recencyBonus, velocityModifier,
      engagementVelocity, I, C, volumeScore, composite, decay,
      ratio: rawRatio, Veff, interactionRate, ageInDays
    },
  };
}

// ═══════════════════════════════════════════════════════════════
//  DATA FETCHERS
// ═══════════════════════════════════════════════════════════════

function fetchChannelSubs(channelHandle) {
  return new Promise((resolve) => {
    if (!channelHandle) return resolve(0);
    chrome.runtime.sendMessage(
      { type: "FETCH_CHANNEL_SUBS", channelHandle },
      (response) => {
        if (chrome.runtime.lastError) return resolve(0);
        resolve(response?.subscribers || 0);
      }
    );
  });
}

function fetchRYD(videoId) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: "FETCH_RYD", videoId },
      (response) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        if (response?.error) {
          return reject(new Error(response.error));
        }
        resolve(response);
      }
    );
  });
}

function parseDaysOld(text) {
  if (!text) return 0;
  const match = text.match(/(\d+)\s*(second|minute|hour|day|week|month|year)/i);
  if (!match) return 0;
  const num = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const conversionTable = {
    second: 1 / 86400, minute: 1 / 1440, hour: 1 / 24,
    day: 1, week: 7, month: 30, year: 365
  };
  return num * (conversionTable[unit] || 0);
}

// Compute daysOld from an ISO date string (e.g. from RYD API dateCreated)
function daysOldFromDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return Math.max(0, (Date.now() - d.getTime()) / 86400000);
}

function extractChannelHandle(container) {
  if (!container) return null;
  const links = container.querySelectorAll(
    'a[href*="/@"], a[href*="/channel/"], ytd-channel-name a'
  );
  for (const link of links) {
    const href = link.getAttribute("href") || "";
    const handleMatch = href.match(/\/@([^/?]+)/);
    if (handleMatch) return `@${handleMatch[1]}`;
    const idMatch = href.match(/\/channel\/(UC[^/?]+)/);
    if (idMatch) return idMatch[1];
  }
  return null;
}

function scrapeWatchPageData() {
  const result = { title: null, daysOld: 0, channelHandle: null };
  result.title = document.title.replace(" - YouTube", "");
  
  const infoEl = document.querySelector("#info-strings yt-formatted-string");
  if (infoEl) {
    const dateMatch = infoEl.textContent.match(/(?:premiered|streamed live|published)\s+(.+)/i);
    if (dateMatch) {
      const d = new Date(dateMatch[1]);
      if (!isNaN(d)) {
        result.daysOld = Math.max(0, (Date.now() - d) / 86400000);
      }
    }
    if (result.daysOld === 0) {
      result.daysOld = parseDaysOld(infoEl.textContent);
    }
  }
  
  const ownerContainer = document.querySelector("#owner") || document.body;
  result.channelHandle = extractChannelHandle(ownerContainer);
  return result;
}

function scrapeThumbnailData(container) {
  const result = {
    videoId: null, title: null, daysOld: 0,
    channelHandle: null, thumbnailLink: null
  };
  
  const link = container.querySelector("a#thumbnail");
  if (!link) return null;
  
  const href = link.getAttribute("href");
  if (!href) return null;
  
  const match = href.match(/[?&]v=([^&]+)/);
  if (!match) return null;
  
  result.videoId = match[1];
  result.thumbnailLink = link;
  
  const titleEl = container.querySelector("#video-title");
  result.title = titleEl ? titleEl.textContent.trim() : "";
  
  const spans = container.querySelectorAll("span, yt-formatted-string");
  for (const span of spans) {
    const days = parseDaysOld(span.textContent);
    if (days > 0) {
      result.daysOld = days;
      break;
    }
  }
  
  result.channelHandle = extractChannelHandle(container);
  
  // Fallback: on channel pages, individual renderers may lack channel links
  if (!result.channelHandle) {
    result.channelHandle = extractPageChannelHandle();
  }
  
  return result;
}

// Extract channel handle from page-level context (channel page URL or header)
function extractPageChannelHandle() {
  const urlMatch = window.location.pathname.match(/^\/@([^/?]+)/);
  if (urlMatch) return `@${urlMatch[1]}`;
  
  const channelMatch = window.location.pathname.match(/^\/channel\/(UC[^/?]+)/);
  if (channelMatch) return channelMatch[1];
  
  return null;
}

// ═══════════════════════════════════════════════════════════════
//  UI RENDERING
// ═══════════════════════════════════════════════════════════════

function getTierConfig(tier) {
  return TIER_CONFIG[tier] || TIER_CONFIG.synthetic;
}

function renderMainBadge(result, targetElement) {
  const existing = document.getElementById(UI_CONFIG.PILL_ID);
  if (existing) existing.remove();
  
  const config = getTierConfig(result.tier);
  
  const pill = document.createElement("div");
  pill.id = UI_CONFIG.PILL_ID;
  pill.className = `fodder-reset ${config.cssClass}`;
  pill.innerHTML = `
    <div class="fodder-icon">${config.icon}</div>
    <span class="fodder-score">${result.score}</span>
    <span class="fodder-label">${config.label}</span>
  `;
  
  pill.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleBento(pill, result, config);
  });
  
  if (targetElement) {
    targetElement.style.display = "flex";
    targetElement.style.alignItems = "center";
    targetElement.insertBefore(pill, targetElement.firstChild);
  }
  
  return pill;
}

function renderMiniBadge(result, thumbnailLink) {
  const config = getTierConfig(result.tier);
  
  const badge = document.createElement("div");
  badge.className = `${UI_CONFIG.MINI_BADGE_CLASS} ${config.cssClass}`;
  badge.textContent = result.score;
  
  thumbnailLink.appendChild(badge);
  return badge;
}

function toggleBento(pill, result, config) {
  const existing = document.getElementById(UI_CONFIG.BENTO_ID);
  if (existing) {
    existing.remove();
    return;
  }
  
  const bento = document.createElement("div");
  bento.id = UI_CONFIG.BENTO_ID;
  bento.className = "fodder-reset";
  bento.innerHTML = `
    <div class="fodder-bento-header">
      <span class="fodder-brand">FODDER</span>
      <span class="fodder-verdict ${config.cssClass}">${config.verdict}</span>
    </div>
    <div class="fodder-score-main ${config.cssClass}">${result.score}</div>
    <div class="fodder-metric-grid">
      <div class="fodder-metric">
        <span class="label">DNA</span>
        <span class="val">${(result.raw.A * 100).toFixed(0)}%</span>
      </div>
      <div class="fodder-metric">
        <span class="label">VOL</span>
        <span class="val">${(result.raw.volumeScore * 100).toFixed(0)}%</span>
      </div>
      <div class="fodder-metric">
        <span class="label">VEL</span>
        <span class="val">${(result.raw.gamma * 100).toFixed(0)}%</span>
      </div>
    </div>
    <div class="fodder-bento-footer">${config.detail}</div>
  `;
  
  document.body.appendChild(bento);
  
  const rect = pill.getBoundingClientRect();
  bento.style.top = `${rect.bottom + 8 + window.scrollY}px`;
  bento.style.left = `${Math.min(rect.left, window.innerWidth - 220)}px`;
  
  setTimeout(() => {
    document.addEventListener('click', function closeBento(e) {
      if (!bento.contains(e.target) && !pill.contains(e.target)) {
        bento.remove();
        document.removeEventListener('click', closeBento);
      }
    });
  }, 100);
}

// ═══════════════════════════════════════════════════════════════
//  MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════

let currentVideoId = null;
let debounceTimer = null;

async function analyzeMainVideo(retryCount = 0) {
  const videoId = new URLSearchParams(window.location.search).get("v");
  if (!videoId) return;
  
  if (videoId === currentVideoId) {
    const existingBadge = document.getElementById(UI_CONFIG.PILL_ID);
    if (existingBadge) return;
  }
  
  currentVideoId = videoId;
  
  try {
    const pageData = scrapeWatchPageData();
    
    const [ryd, subs] = await Promise.all([
      fetchRYD(videoId),
      fetchChannelSubs(pageData.channelHandle),
    ]);
    
    // Use RYD dateCreated as primary date source (consistent across all contexts)
    // Fall back to DOM-scraped date only if RYD doesn't provide one
    const rydDaysOld = daysOldFromDate(ryd.dateCreated);
    const daysOld = rydDaysOld !== null ? rydDaysOld : pageData.daysOld;
    
    const result = computeScore({
      likes: ryd.likes,
      dislikes: ryd.dislikes,
      viewCount: ryd.viewCount,
      subscribers: subs,
      daysOld: daysOld,
      title: pageData.title,
    });
    
    // Cache authoritative score
    cacheScore(videoId, result);
    
    // Sync any existing thumbnail badges for this video
    syncThumbnailBadge(videoId, result);
    
    const titleEl = document.querySelector("h1.ytd-watch-metadata");
    if (!titleEl) {
      if (retryCount < 5) {
        setTimeout(() => {
          currentVideoId = null;
          analyzeMainVideo(retryCount + 1);
        }, 100 * (retryCount + 1));
      }
      return;
    }
    
    renderMainBadge(result, titleEl);
    
  } catch (error) {
    console.error("Fodder: Watch page analysis failed:", error);
  }
}

// Sync sidebar/related thumbnail badges with the authoritative watch-page score
function syncThumbnailBadge(videoId, result) {
  const allLinks = document.querySelectorAll(`a#thumbnail[href*="${videoId}"]`);
  allLinks.forEach((link) => {
    const existing = link.querySelector(`.${UI_CONFIG.MINI_BADGE_CLASS}`);
    if (existing) existing.remove();
    renderMiniBadge(result, link);
    link.dataset.fodder = "done";
  });
}

function processThumbnails() {
  const selectors = [
    "ytd-compact-video-renderer",
    "ytd-video-renderer",
    "ytd-grid-video-renderer",
    "ytd-rich-item-renderer"
  ];
  
  const containers = document.querySelectorAll(selectors.join(","));
  
  containers.forEach(async (container) => {
    const link = container.querySelector("a#thumbnail");
    if (!link || link.dataset.fodder === "done") return;
    
    link.dataset.fodder = "done";
    
    const thumbData = scrapeThumbnailData(container);
    if (!thumbData || !thumbData.videoId) return;
    
    // Use cached score if available (ensures consistency with watch page)
    const cached = SCORE_CACHE.get(thumbData.videoId);
    if (cached) {
      renderMiniBadge(cached, thumbData.thumbnailLink);
      return;
    }
    
    try {
      const [ryd, subs] = await Promise.all([
        fetchRYD(thumbData.videoId),
        fetchChannelSubs(thumbData.channelHandle)
      ]);
      
      if (!ryd || ryd.error) return;
      
      // Use RYD dateCreated as primary date source (same as watch page)
      const rydDaysOld = daysOldFromDate(ryd.dateCreated);
      const daysOld = rydDaysOld !== null ? rydDaysOld : thumbData.daysOld;
      
      const result = computeScore({
        likes: ryd.likes,
        dislikes: ryd.dislikes,
        viewCount: ryd.viewCount,
        subscribers: subs,
        daysOld: daysOld,
        title: thumbData.title,
      });
      
      // Cache (won't override watch-page score if one exists)
      if (!SCORE_CACHE.has(thumbData.videoId)) {
        cacheScore(thumbData.videoId, result);
      }
      
      renderMiniBadge(result, thumbData.thumbnailLink);
      
    } catch (error) {
      console.error(`Fodder: Thumbnail analysis failed:`, error);
    }
  });
}

// ═══════════════════════════════════════════════════════════════
//  YOUTUBE SPA NAVIGATION HANDLING
// ═══════════════════════════════════════════════════════════════

// Listen for YouTube's SPA navigation events
document.addEventListener('yt-navigate-finish', () => {
  // Reset currentVideoId to force re-analysis on navigation
  currentVideoId = null;
  
  if (window.location.pathname === "/watch") {
    // Small delay to let YouTube render the new page
    setTimeout(analyzeMainVideo, 300);
  }
  processThumbnails();
});

// Also listen for URL changes (backup for yt-navigate-finish)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    currentVideoId = null; // Reset cache
    
    if (window.location.pathname === "/watch") {
      setTimeout(analyzeMainVideo, 300);
    }
    processThumbnails();
  }
}).observe(document.body, {
  childList: true,
  subtree: true
});

// General mutation observer for dynamic content (thumbnails, etc.)
const observer = new MutationObserver(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
  
  debounceTimer = setTimeout(() => {
    processThumbnails();
  }, UI_CONFIG.DEBOUNCE_MS);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Initial load
setTimeout(() => {
  if (window.location.pathname === "/watch") {
    analyzeMainVideo();
  }
  processThumbnails();
}, UI_CONFIG.INITIAL_SCAN_DELAY_MS);

})();
