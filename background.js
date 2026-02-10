// background.js — Service Worker (Manifest V3)
// RYD API + Channel page subscriber scraping + caching

const RYD_BASE = "https://returnyoutubedislikeapi.com/Votes";
const RYD_CACHE_TTL = 1000 * 60 * 60;
const CHANNEL_CACHE_TTL = 1000 * 60 * 60 * 24;
const rydCache = new Map();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "FETCH_RYD") {
    fetchRYD(msg.videoId).then(sendResponse).catch((err) => {
      sendResponse({ error: err.message });
    });
    return true;
  }

  if (msg.type === "FETCH_CHANNEL_SUBS") {
    getChannelSubs(msg.channelHandle).then(sendResponse).catch((err) => {
      sendResponse({ subscribers: 0, error: err.message });
    });
    return true;
  }
});

async function fetchRYD(videoId) {
  const cached = rydCache.get(videoId);
  if (cached && Date.now() - cached.ts < RYD_CACHE_TTL) {
    return cached.data;
  }

  const res = await fetch(`${RYD_BASE}?videoId=${videoId}`);
  if (!res.ok) throw new Error(`RYD ${res.status}`);

  const data = await res.json();
  const result = {
    likes: data.likes ?? 0,
    dislikes: data.dislikes ?? 0,
    viewCount: data.viewCount ?? 0,
  };

  rydCache.set(videoId, { data: result, ts: Date.now() });

  if (rydCache.size > 500) {
    const oldest = [...rydCache.entries()].sort((a, b) => a[1].ts - b[1].ts);
    for (let i = 0; i < 100; i++) rydCache.delete(oldest[i][0]);
  }

  return result;
}

async function getChannelSubs(channelHandle) {
  if (!channelHandle) return { subscribers: 0 };

  const cacheKey = `ch_${channelHandle}`;
  const cached = await getChromeCache(cacheKey);
  if (cached && Date.now() - cached.ts < CHANNEL_CACHE_TTL) {
    return { subscribers: cached.subscribers };
  }

  let url;
  if (channelHandle.startsWith("UC")) {
    url = `https://www.youtube.com/channel/${channelHandle}`;
  } else {
    const handle = channelHandle.startsWith("@") ? channelHandle : `@${channelHandle}`;
    url = `https://www.youtube.com/${handle}`;
  }

  try {
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    if (!res.ok) return { subscribers: 0 };

    const html = await res.text();

    // Extract from ytInitialData: "subscriberCountText":{"simpleText":"523K subscribers"}
    const match = html.match(/"subscriberCountText"\s*:\s*\{[^}]*"simpleText"\s*:\s*"([^"]+)"/);
    if (match) {
      const subscribers = parseSubCount(match[1]);
      await setChromeCache(cacheKey, { subscribers, ts: Date.now() });
      return { subscribers };
    }

    // Fallback: {"content":"12.4K subscribers"}
    const match2 = html.match(/"subscriberCountText"\s*:\s*\{[^}]*"content"\s*:\s*"([^"]+)"/);
    if (match2) {
      const subscribers = parseSubCount(match2[1]);
      await setChromeCache(cacheKey, { subscribers, ts: Date.now() });
      return { subscribers };
    }

    return { subscribers: 0 };
  } catch (e) {
    return { subscribers: 0, error: e.message };
  }
}

function parseSubCount(str) {
  if (!str) return 0;
  str = str.toLowerCase().replace(/subscribers?/gi, "").trim();
  const multipliers = { k: 1e3, m: 1e6, b: 1e9 };
  const match = str.match(/([\d.]+)\s*([kmb])?/i);
  if (!match) return 0;
  return Math.round(parseFloat(match[1]) * (multipliers[match[2]?.toLowerCase()] || 1));
}

function getChromeCache(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (data) => resolve(data[key] || null));
  });
}

function setChromeCache(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}
