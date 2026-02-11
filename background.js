// background.js — Fodder v5.0
// Service worker for API calls (RYD + channel subscribers)

"use strict";

const RYD_CACHE = new Map();
const RYD_CACHE_TTL = 60 * 60 * 1000;
const RYD_CACHE_MAX_SIZE = 500;
const CHANNEL_CACHE_KEY = "fodder_channel_cache";
const CHANNEL_CACHE_TTL = 24 * 60 * 60 * 1000;

async function fetchRYD(videoId) {
  const cached = RYD_CACHE.get(videoId);
  if (cached && Date.now() - cached.timestamp < RYD_CACHE_TTL) {
    return cached.data;
  }
  
  try {
    const response = await fetch(
      `https://returnyoutubedislikeapi.com/Votes?videoId=${videoId}`
    );
    
    if (!response.ok) throw new Error(`RYD API returned ${response.status}`);
    
    const data = await response.json();
    RYD_CACHE.set(videoId, { data, timestamp: Date.now() });
    
    if (RYD_CACHE.size > RYD_CACHE_MAX_SIZE) {
      const firstKey = RYD_CACHE.keys().next().value;
      RYD_CACHE.delete(firstKey);
    }
    
    return data;
  } catch (error) {
    console.error("RYD fetch error:", error);
    return { error: error.message };
  }
}

async function fetchChannelSubs(channelHandle) {
  if (!channelHandle) return 0;
  
  try {
    const cacheData = await chrome.storage.local.get(CHANNEL_CACHE_KEY);
    const cache = cacheData[CHANNEL_CACHE_KEY] || {};
    const cached = cache[channelHandle];
    
    if (cached && Date.now() - cached.timestamp < CHANNEL_CACHE_TTL) {
      return cached.subscribers;
    }
  } catch (error) {
    console.warn("Cache read error:", error);
  }
  
  try {
    const url = channelHandle.startsWith('@') 
      ? `https://www.youtube.com/${channelHandle}`
      : `https://www.youtube.com/channel/${channelHandle}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Channel page returned ${response.status}`);
    
    const html = await response.text();
    const match = html.match(/"subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"\}\}\}/);
    
    if (!match) {
      console.warn("Could not parse subscriber count");
      return 0;
    }
    
    const subscribers = parseSubscriberCount(match[1]);
    
    try {
      const cacheData = await chrome.storage.local.get(CHANNEL_CACHE_KEY);
      const cache = cacheData[CHANNEL_CACHE_KEY] || {};
      cache[channelHandle] = { subscribers, timestamp: Date.now() };
      
      const entries = Object.entries(cache);
      if (entries.length > 100) {
        entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
        const pruned = Object.fromEntries(entries.slice(0, 100));
        await chrome.storage.local.set({ [CHANNEL_CACHE_KEY]: pruned });
      } else {
        await chrome.storage.local.set({ [CHANNEL_CACHE_KEY]: cache });
      }
    } catch (error) {
      console.warn("Cache write error:", error);
    }
    
    return subscribers;
  } catch (error) {
    console.error("Channel fetch error:", error);
    return 0;
  }
}

function parseSubscriberCount(text) {
  const match = text.match(/([\d.]+)([KMB]?)\s*subscriber/i);
  if (!match) return 0;
  
  let num = parseFloat(match[1]);
  const suffix = match[2].toUpperCase();
  const multipliers = { K: 1000, M: 1000000, B: 1000000000 };
  
  if (suffix && multipliers[suffix]) {
    num *= multipliers[suffix];
  }
  
  return Math.round(num);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "FETCH_RYD") {
    fetchRYD(request.videoId).then(sendResponse);
    return true;
  }
  
  if (request.type === "FETCH_CHANNEL_SUBS") {
    fetchChannelSubs(request.channelHandle).then((subscribers) => {
      sendResponse({ subscribers });
    });
    return true;
  }
});
