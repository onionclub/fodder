"use strict";

const EYE_OPEN = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_SHUT = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

function maskKey(key) {
  if (!key || key.length < 10) return key;
  return key.slice(0, 7) + "••••••••" + key.slice(-4);
}

let toastTimer = null;
function showToast(msg, type = "success") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.className = "toast";
    setTimeout(() => { el.textContent = ""; }, 300);
  }, 2800);
}

function setStatus(rowId, active) {
  const row = document.getElementById(rowId);
  if (!row) return;
  row.classList.toggle("active", active);
  row.querySelector(".status-label").textContent = active ? "Configured" : "Not configured";
}

function initEyeButtons() {
  document.querySelectorAll(".eye-btn").forEach(btn => {
    btn.innerHTML = EYE_OPEN;
    btn.addEventListener("click", () => {
      const input   = document.getElementById(btn.dataset.target);
      const showing = input.type === "text";
      input.type    = showing ? "password" : "text";
      btn.innerHTML = showing ? EYE_OPEN : EYE_SHUT;
    });
  });
}

// Key map: { storageKey: { inputId, statusId } }
const KEY_MAP = {
  openrouterApiKey: { inputId: "openrouterKey", statusId: "status-or" },
  ytApiKey:         { inputId: "ytKey",          statusId: "status-yt" },
  supadataApiKey:   { inputId: "supadataKey",    statusId: "status-sd" },
};

async function loadSettings() {
  const stored = await chrome.storage.sync.get(Object.keys(KEY_MAP));

  for (const [storageKey, { inputId, statusId }] of Object.entries(KEY_MAP)) {
    const val = stored[storageKey];
    if (val) {
      const el = document.getElementById(inputId);
      el.placeholder = maskKey(val);
      el.classList.add("is-set");
      setStatus(statusId, true);
    }
  }
}

async function saveSettings() {
  const payload = {};
  let saved = 0;

  for (const [storageKey, { inputId }] of Object.entries(KEY_MAP)) {
    const val = document.getElementById(inputId).value.trim();
    if (val) {
      payload[storageKey] = val;
      saved++;
    }
  }

  if (saved === 0) {
    showToast("Nothing to save.", "error");
    return;
  }

  try {
    await chrome.storage.sync.set(payload);

    // Update UI for each saved key
    for (const [storageKey, { inputId, statusId }] of Object.entries(KEY_MAP)) {
      if (payload[storageKey]) {
        const el = document.getElementById(inputId);
        el.value       = "";
        el.placeholder = maskKey(payload[storageKey]);
        el.classList.add("is-set");
        setStatus(statusId, true);
      }
    }

    showToast(`${saved} key${saved > 1 ? "s" : ""} saved.`, "success");
  } catch (e) {
    showToast("Save failed.", "error");
  }
}

async function clearSettings() {
  if (!confirm("Remove all saved keys?")) return;
  await chrome.storage.sync.remove(Object.keys(KEY_MAP));
  location.reload();
}

document.addEventListener("DOMContentLoaded", () => {
  initEyeButtons();
  loadSettings();
  document.getElementById("saveBtn").addEventListener("click", saveSettings);
  document.getElementById("clearBtn").addEventListener("click", clearSettings);
});
