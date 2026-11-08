/*
 * Window-control bridge for Vaulty desktop shell.
 * Connects HTML titlebar controls to native host (WebView2 / Electron / browser fallback).
 */
(() => {
  const bridge = window.vaultShell || {};
  const actions = {
    minimize: () => {
      if (window.chrome && window.chrome.webview) {
        window.chrome.webview.postMessage({ action: 'minimize' });
      } else if (bridge.minimize) {
        bridge.minimize();
      }
    },
    maximize: () => {
      if (window.chrome && window.chrome.webview) {
        window.chrome.webview.postMessage({ action: 'maximize' });
      } else if (bridge.maximize) {
        bridge.maximize();
      } else {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen?.().catch(() => {});
      }
    },
    close: () => {
      if (window.chrome && window.chrome.webview) {
        window.chrome.webview.postMessage({ action: 'close' });
      } else if (bridge.close) {
        bridge.close();
      } else {
        window.close();
      }
    },
  };

  // Delegated click handler for titlebar controls
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-wc]');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      const fn = actions[btn.dataset.wc];
      if (fn) fn();
    }
  });

  document.querySelectorAll('[data-wc]').forEach((b) =>
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const fn = actions[b.dataset.wc];
      if (fn) fn();
    })
  );

  const tb = document.querySelector('.titlebar');
  if (tb) {
    tb.addEventListener('dblclick', (e) => {
      if (!e.target.closest('.titlebar__controls') && !e.target.closest('button, input, a, [data-action], [data-no-drag]')) {
        actions.maximize();
      }
    });

    // Native window drag via WebView2
    tb.addEventListener('mousedown', (e) => {
      if (e.button === 0 && !e.target.closest('.titlebar__controls') && !e.target.closest('button, input, a, [data-action], [data-no-drag]')) {
        if (window.chrome && window.chrome.webview) {
          window.chrome.webview.postMessage({ action: 'dragWindow' });
        }
      }
    });
  }

  // 6px invisible perimeter border native edge & corner resizing
  const RESIZE_BORDER = 6;
  const CURSOR_MAP = {
    'top': 'n-resize',
    'bottom': 's-resize',
    'left': 'w-resize',
    'right': 'e-resize',
    'top-left': 'nwse-resize',
    'bottom-right': 'nwse-resize',
    'top-right': 'nesw-resize',
    'bottom-left': 'nesw-resize',
  };

  function getResizeDirection(e) {
    if (document.body.classList.contains('is-maximized')) return null;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const x = e.clientX;
    const y = e.clientY;

    const top = y <= RESIZE_BORDER;
    const bottom = y >= h - RESIZE_BORDER;
    const left = x <= RESIZE_BORDER;
    const right = x >= w - RESIZE_BORDER;

    if (top && left) return 'top-left';
    if (top && right) return 'top-right';
    if (bottom && left) return 'bottom-left';
    if (bottom && right) return 'bottom-right';
    if (top) return 'top';
    if (bottom) return 'bottom';
    if (left) return 'left';
    if (right) return 'right';
    return null;
  }

  let activeResizeDir = null;

  window.addEventListener('mousemove', (e) => {
    if (document.body.classList.contains('is-maximized')) {
      if (activeResizeDir) {
        document.documentElement.style.cursor = '';
        activeResizeDir = null;
      }
      return;
    }

    const dir = getResizeDirection(e);
    if (dir) {
      activeResizeDir = dir;
      document.documentElement.style.cursor = CURSOR_MAP[dir] || '';
    } else if (activeResizeDir) {
      document.documentElement.style.cursor = '';
      activeResizeDir = null;
    }
  }, { passive: true });

  window.addEventListener('mousedown', (e) => {
    if (e.button === 0 && !document.body.classList.contains('is-maximized')) {
      const dir = getResizeDirection(e);
      if (dir && window.chrome && window.chrome.webview) {
        window.chrome.webview.postMessage({
          action: 'resizeWindow',
          direction: dir
        });
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }, true);

  window.addEventListener('mouseleave', () => {
    if (activeResizeDir) {
      document.documentElement.style.cursor = '';
      activeResizeDir = null;
    }
  });
})();

