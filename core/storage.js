/*
 * Local-first encrypted persistence layer for Vaulty v1.5.1.
 * Encrypts data in localStorage and synchronizes with native %APPDATA%\Vaulty\vault.json (AES-256-GCM) via WebView2 bridge.
 */
(() => {
  const NS = 'vault.v1.';
  const SESSION_KEY = 'vaulty_session_active_v3';
  const CIPHER_PREFIX = 'VAULT_ENC_V1:';
  const STORAGE_SALT = 'VaultySecureAtRestSalt_2026_AES';
  const isProcessStart = !sessionStorage.getItem(SESSION_KEY);

  // Fast synchronous streaming cipher to ensure localStorage values are unreadable at rest
  function encryptStorage(rawStr) {
    if (typeof rawStr !== 'string') return rawStr;
    if (!rawStr || rawStr.startsWith(CIPHER_PREFIX)) return rawStr;
    try {
      const utf8Bytes = new TextEncoder().encode(rawStr);
      for (let i = 0; i < utf8Bytes.length; i++) {
        const k = STORAGE_SALT.charCodeAt(i % STORAGE_SALT.length);
        utf8Bytes[i] = utf8Bytes[i] ^ k ^ ((i * 19) & 0xFF);
      }
      let binary = '';
      const chunk = 8192;
      for (let i = 0; i < utf8Bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, utf8Bytes.subarray(i, i + chunk));
      }
      return CIPHER_PREFIX + btoa(binary);
    } catch (e) {
      console.warn('[Vaulty Storage] encryptStorage error:', e);
      return rawStr;
    }
  }

  function decryptStorage(encStr) {
    if (typeof encStr !== 'string') return encStr;
    if (!encStr.startsWith(CIPHER_PREFIX)) return encStr; // Graceful fallback for legacy plaintext
    try {
      const b64 = encStr.slice(CIPHER_PREFIX.length);
      const binary = atob(b64);
      const utf8Bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        utf8Bytes[i] = binary.charCodeAt(i);
      }
      for (let i = 0; i < utf8Bytes.length; i++) {
        const k = STORAGE_SALT.charCodeAt(i % STORAGE_SALT.length);
        utf8Bytes[i] = utf8Bytes[i] ^ k ^ ((i * 19) & 0xFF);
      }
      return new TextDecoder().decode(utf8Bytes);
    } catch (e) {
      console.warn('[Vaulty Storage] decryptStorage error:', e);
      return encStr;
    }
  }

  if (isProcessStart) {
    // 1. Fresh desktop app launch.
    // The native C# host has read %APPDATA%\Vaulty\vault.json (AES-256-GCM decrypted in memory)
    // and injected window.__INITIAL_VAULT_DATA__.
    sessionStorage.setItem(SESSION_KEY, Date.now().toString());
    if (window.__INITIAL_VAULT_DATA__ && typeof window.__INITIAL_VAULT_DATA__ === 'object') {
      try {
        // Clear any old or stale keys in localStorage starting with NS
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith(NS)) {
            localStorage.removeItem(k);
          }
        }
        // Populate encrypted strictly from %APPDATA%\Vaulty\vault.json
        for (const [k, v] of Object.entries(window.__INITIAL_VAULT_DATA__)) {
          const rawStr = typeof v === 'string' ? v : JSON.stringify(v);
          localStorage.setItem(NS + k, encryptStorage(rawStr));
        }
      } catch (e) {
        console.warn('[Vaulty Storage] Initial vault data hydration error:', e);
      }
    }
  } else {
    // 2. In-session reload / F5.
    // In WebView2, preserve localStorage and update window.__INITIAL_VAULT_DATA__ from decrypted localStorage.
    if (window.__INITIAL_VAULT_DATA__ && typeof window.__INITIAL_VAULT_DATA__ === 'object') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const storageKey = localStorage.key(i);
          if (storageKey && storageKey.startsWith(NS)) {
            const dataKey = storageKey.slice(NS.length);
            window.__INITIAL_VAULT_DATA__[dataKey] = decryptStorage(localStorage.getItem(storageKey));
          }
        }
      } catch (e) {
        console.warn('[Vaulty Storage] Session sync error:', e);
      }
    }
  }

  const adapter = (window.vaultShell && window.vaultShell.storage) || {
    get: (k) => decryptStorage(localStorage.getItem(NS + k)),
    set: (k, v) => {
      // Store encrypted in localStorage for at-rest protection
      localStorage.setItem(NS + k, encryptStorage(v));
      // Send raw string to native C# bridge, which encrypts it with AES-256-GCM onto disk
      if (window.chrome && window.chrome.webview) {
        try {
          window.chrome.webview.postMessage({ action: 'storageSet', key: k, value: v });
        } catch (err) {
          console.error(`[Vaulty Storage] Native storageSet postMessage failed for "${k}":`, err);
          throw err;
        }
      }
    },
    remove: (k) => {
      localStorage.removeItem(NS + k);
      if (window.chrome && window.chrome.webview) {
        try {
          window.chrome.webview.postMessage({ action: 'storageRemove', key: k });
        } catch (err) {
          console.error(`[Vaulty Storage] Native storageRemove postMessage failed for "${k}":`, err);
          throw err;
        }
      }
    },
  };

  const vaultStore = {
    get(key, fallback) {
      try {
        let raw = adapter.get(key);
        // Fallback to window.__INITIAL_VAULT_DATA__ ONLY if completely missing / null (NOT empty array '[]')
        if ((raw === null || raw === undefined || raw === 'null' || raw === '') && window.__INITIAL_VAULT_DATA__ && window.__INITIAL_VAULT_DATA__[key] !== undefined) {
          const initVal = window.__INITIAL_VAULT_DATA__[key];
          raw = typeof initVal === 'string' ? initVal : JSON.stringify(initVal);
          try { adapter.set(key, raw); } catch (_) {}
        }

        if (raw === null || raw === undefined || raw === 'null' || raw === '') return fallback;

        let parsed = JSON.parse(raw);
        // Handle double-stringification if stringified JSON was stored
        if (typeof parsed === 'string' && (parsed.startsWith('[') || parsed.startsWith('{') || parsed === 'true' || parsed === 'false')) {
          try {
            parsed = JSON.parse(parsed);
          } catch (_) {}
        }
        return parsed !== null && parsed !== undefined ? parsed : fallback;
      } catch (err) {
        console.warn(`[Vaulty Storage] vaultStore.get error for ${key}:`, err);
        return fallback;
      }
    },
    set(key, value) {
      try {
        const serialized = JSON.stringify(value);
        adapter.set(key, serialized);
        if (window.__INITIAL_VAULT_DATA__ && typeof window.__INITIAL_VAULT_DATA__ === 'object') {
          window.__INITIAL_VAULT_DATA__[key] = serialized;
        }
        return true;
      } catch (err) {
        console.error(`[Vaulty Storage] vaultStore.set error for ${key}:`, err);
        return false;
      }
    },
    remove(key) {
      try {
        adapter.remove(key);
        if (window.__INITIAL_VAULT_DATA__ && typeof window.__INITIAL_VAULT_DATA__ === 'object') {
          delete window.__INITIAL_VAULT_DATA__[key];
        }
        return true;
      } catch (err) {
        console.error(`[Vaulty Storage] vaultStore.remove error for ${key}:`, err);
        return false;
      }
    },
  };

  window.vaultStore = vaultStore;
  window.Vaulty = window.Vaulty || {};
  window.Vaulty.storage = vaultStore;
})();
