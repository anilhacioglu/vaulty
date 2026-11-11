/**
 * Vaulty - Tema & Hareket Katmani
 * motion.js
 *
 * 1. Tema yoneticisi (acik / koyu / sistem) - kalici, ayarlar ile senkron
 * 2. Baslik cubugunda tema dugmesi ve Ctrl+K komut paleti
 * 3. Sayfa gecis, kart spotlight, buton ripple, modal kademeli giris animasyonlari
 * 4. Genel Bakis karsilama basligi (Gunaydin, <isim>)
 */
(function () {
  'use strict';

  var KEY = 'vaulty-theme';
  var root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===================== 1. TEMA ===================== */
  function readPref() {
    try { return localStorage.getItem(KEY) || 'dark'; } catch (e) { return 'dark'; }
  }
  function resolve(pref) {
    if (pref === 'system') return mq && mq.matches ? 'dark' : 'light';
    return pref === 'light' ? 'light' : 'dark';
  }
  function apply(pref, animate) {
    if (animate && !reduceMotion) {
      root.classList.add('vy-theme-anim');
      clearTimeout(apply._t);
      apply._t = setTimeout(function () { root.classList.remove('vy-theme-anim'); }, 480);
    }
    root.setAttribute('data-theme', resolve(pref));
    root.setAttribute('data-theme-pref', pref);
    var meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.setAttribute('content', resolve(pref));
    document.querySelectorAll('.settings-theme-card').forEach(function (c) {
      var on = c.dataset.themeVal === pref;
      c.classList.toggle('is-active', on);
      var badge = c.querySelector('.settings-status-badge');
      if (badge) {
        badge.textContent = on ? 'Aktif' : 'Seç';
        badge.classList.toggle('settings-status-badge--active', on);
      }
    });
  }
  function setTheme(pref, silent) {
    if (['light', 'dark', 'system'].indexOf(pref) < 0) pref = 'dark';
    try { localStorage.setItem(KEY, pref); } catch (e) {}
    apply(pref, true);
    // Sifreli kasa profiline de yaz
    try {
      var S = window.Vaulty && window.Vaulty.State;
      var p = S && S.getVaultProfile && S.getVaultProfile();
      if (p) { p.theme = pref; if (S.saveVaultProfile) S.saveVaultProfile(); }
    } catch (e) {}
    return pref;
  }
  function toggleTheme() {
    return setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  }
  if (mq && mq.addEventListener) {
    mq.addEventListener('change', function () {
      if (readPref() === 'system') apply('system', true);
    });
  }
  window.Vaulty = window.Vaulty || {};
  window.Vaulty.Theme = { set: setTheme, toggle: toggleTheme, get: readPref };
  apply(readPref(), false);

  /* ===================== yardimcilar ===================== */
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  function setStagger(parent, selector, max) {
    var kids = selector ? parent.querySelectorAll(selector) : parent.children;
    var i = 0;
    Array.prototype.forEach.call(kids, function (el) {
      el.style.setProperty('--vy-i', Math.min(i++, max || 12));
    });
  }

  ready(function () {
    /* ===================== 2. UST YARDIMCI CUBUK (TOPBAR) ===================== */
    var topSearch = document.getElementById('vyTopSearchBtn');
    if (topSearch) topSearch.addEventListener('click', openPalette);

    var topTheme = document.getElementById('vyTopThemeBtn');
    if (topTheme) topTheme.addEventListener('click', toggleTheme);

    var bellBtn = document.getElementById('vyBellBtn');
    var bellPop = document.getElementById('vyBellPopover');
    var bellWrap = document.getElementById('vyBellWrap');
    function renderNotificationsPopover() {
      if (!bellPop) return;
      var S = window.Vaulty && window.Vaulty.State;
      var items = (S && S.ledgerItems ? S.ledgerItems : []).filter(function (x) {
        return x && x.kind === 'payable' && !(S.isArchived && S.isArchived(x)) && (S.daysTo ? S.daysTo(x.dueDate) <= 14 : false);
      }).sort(function (a, b) { return (S.daysTo ? S.daysTo(a.dueDate) - S.daysTo(b.dueDate) : 0); });
      if (!items.length) {
        bellPop.innerHTML = '<div class="vy-bell-head">Bildirimler</div><div class="vy-bell-empty">Yaklaşan veya gecikmiş ödeme bulunmuyor.</div>';
        return;
      }
      var rows = items.slice(0, 5).map(function (x) {
        var d = S.daysTo(x.dueDate);
        var tag = d < 0 ? Math.abs(d) + ' gün gecikti' : (d === 0 ? 'Bugün son gün' : d + ' gün kaldı');
        var rem = S.remainingAmount ? S.remainingAmount(x) : x.total;
        return '<button type="button" class="vy-bell-item" data-goto-debt="1"><div><strong>' + (S.esc ? S.esc(x.party) : x.party) + '</strong><small>' + tag + '</small></div><span class="mono">' + (S.tryFmt ? S.tryFmt(rem) : rem) + '</span></button>';
      }).join('');
      bellPop.innerHTML = '<div class="vy-bell-head">Yaklaşan Ödemeler (' + items.length + ')</div><div class="vy-bell-list">' + rows + '</div>';
      bellPop.querySelectorAll('[data-goto-debt]').forEach(function (b) {
        b.addEventListener('click', function () {
          bellPop.hidden = true;
          bellBtn && bellBtn.setAttribute('aria-expanded', 'false');
          window.Vaulty.Sidebar && window.Vaulty.Sidebar.activateNavItem && window.Vaulty.Sidebar.activateNavItem('debt');
        });
      });
    }
    if (bellBtn && bellPop) {
      bellBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var willOpen = bellPop.hidden;
        if (willOpen) renderNotificationsPopover();
        bellPop.hidden = !willOpen;
        bellBtn.setAttribute('aria-expanded', String(willOpen));
      });
      document.addEventListener('click', function (e) {
        if (!bellPop.hidden && bellWrap && !bellWrap.contains(e.target)) {
          bellPop.hidden = true;
          bellBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    /* ===================== Ayarlar > Tema kartlari ===================== */
    document.addEventListener('click', function (e) {
      var card = e.target.closest && e.target.closest('.settings-theme-card');
      if (!card) return;
      e.stopImmediatePropagation();
      setTheme(card.dataset.themeVal);
      var S = window.Vaulty && window.Vaulty.State;
      if (S && typeof S.showToast === 'function') {
        S.showToast({ dark: 'Tema: Koyu (lacivert) tema aktif.', light: 'Tema: Açık tema aktif.', system: 'Tema: Sistemle eşitlendi.' }[card.dataset.themeVal]);
      }
    }, true);
    apply(readPref(), false);

    /* ===================== 3a. SAYFA GECISLERI & CANLI SAYAC ===================== */
    var main = document.getElementById('center');
    function countUpIn(container) {
      if (!container || reduceMotion) return;
      var S = window.Vaulty && window.Vaulty.State;
      var tryFmt = (S && S.tryFmt) ? S.tryFmt : function (n) { return String(Math.round(n * 100) / 100) + ' ₺'; };
      var parseM = (S && S.parseMoney) ? S.parseMoney : function (n) { return Number(n) || 0; };
      container.querySelectorAll('[data-count]').forEach(function (el) {
        var target = parseM(el.dataset.count) || 0;
        var hasDec = Math.abs(target % 1) > 0.0001;
        var prefix = el.dataset.prefix || '';
        var t0 = performance.now();
        var dur = 760;
        function step(now) {
          var p = Math.min(1, (now - t0) / dur);
          var e = 1 - Math.pow(1 - p, 3);
          var val = hasDec ? Math.round(target * e * 100) / 100 : Math.round(target * e);
          el.textContent = prefix + tryFmt(val);
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = prefix + tryFmt(target);
        }
        requestAnimationFrame(step);
      });
    }
    if (main) {
      var animateView = function (view) {
        if (!view || reduceMotion) return;
        setStagger(view, '.dash-anim, .dc-kpi-card, .tx-kpi-card, .card, .dc-ledger-container, .inspector-pane', 14);
        setStagger(view, '.dash-act, .dash-radar__item, .dc-row, .tx-modern-table tbody tr, .wallet-card', 16);
        view.classList.remove('vy-view-enter');
        void view.offsetWidth;
        view.classList.add('vy-view-enter');
        clearTimeout(view._vyT);
        view._vyT = setTimeout(function () { view.classList.remove('vy-view-enter'); }, 1100);
        decorateGreeting();
        countUpIn(view);
      };
      new MutationObserver(function (list) {
        list.forEach(function (m) {
          var t = m.target;
          if (m.attributeName === 'hidden' && t.classList && t.classList.contains('center__inner') && !t.hidden) {
            animateView(t);
          }
        });
      }).observe(main, { attributes: true, subtree: true, attributeFilter: ['hidden'] });
      requestAnimationFrame(function () {
        var first = main.querySelector('.center__inner:not([hidden])');
        if (first) animateView(first);
      });
      var S = window.Vaulty && window.Vaulty.State;
      if (S && typeof S.on === 'function') {
        S.on('mode:changed', function () {
          setTimeout(function () {
            var cur = main.querySelector('.center__inner:not([hidden])');
            if (cur) animateView(cur);
          }, 50);
        });
      }
    }

    /* ===================== 3b. SPOTLIGHT (imlec parlamasi) ===================== */
    var raf = 0;
    document.addEventListener('mousemove', function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var el = e.target.closest && e.target.closest('.card, .dash-card, .dash-panel, .dc-kpi-card, .tx-kpi-card, .dash-kpi, .dash-wallet');
        if (!el) return;
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    }, { passive: true });

    /* ===================== 3c. BUTON RIPPLE ===================== */
    document.addEventListener('pointerdown', function (e) {
      var btn = e.target.closest && e.target.closest('.btn, .dc-add-btn, .dc-secondary-btn, .dc-pay-btn');
      if (!btn || reduceMotion) return;
      var r = btn.getBoundingClientRect();
      var size = Math.max(r.width, r.height);
      var s = document.createElement('span');
      s.className = 'vy-ripple';
      s.style.width = s.style.height = size + 'px';
      s.style.left = (e.clientX - r.left - size / 2) + 'px';
      s.style.top = (e.clientY - r.top - size / 2) + 'px';
      btn.appendChild(s);
      setTimeout(function () { s.remove(); }, 650);
    });

    /* ===================== 3d. MODAL kademeli giris ===================== */
    new MutationObserver(function (list) {
      list.forEach(function (m) {
        var t = m.target;
        if (m.attributeName === 'class' && t.classList && t.classList.contains('modal-overlay') && t.classList.contains('is-open')) {
          var body = t.querySelector('.modal-box__body');
          if (body) setStagger(body, null, 10);
        }
      });
    }).observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });

    /* ===================== 4. KARSILAMA BASLIGI ===================== */
    function greetWord() {
      var h = new Date().getHours();
      if (h < 6) return 'İyi geceler';
      if (h < 12) return 'Günaydın';
      if (h < 18) return 'İyi günler';
      return 'İyi akşamlar';
    }
    function decorateGreeting() {
      var host = document.getElementById('vyTopGreet');
      var title = (host && host.querySelector('.vy-greeting__title')) || document.querySelector('#dashboardView .overview-title');
      if (!title) return;
      var nameEl = document.getElementById('sidebarUserName');
      var name = (nameEl && nameEl.textContent.trim()) || 'Kullanıcı';
      title.classList.add('vy-greeting__title');
      title.innerHTML = greetWord() + ', <em></em>';
      title.querySelector('em').textContent = name;
      var container = host || title.closest('.dash-head');
      var sub = container && container.querySelector('.overview-sub');
      if (sub) sub.classList.add('vy-greeting__sub');
      var dateEl = container && container.querySelector('.vy-greeting__date');
      if (!dateEl && title.parentNode) {
        dateEl = document.createElement('div');
        dateEl.className = 'vy-greeting__date';
        title.parentNode.insertBefore(dateEl, title);
      }
      if (dateEl) {
        dateEl.textContent = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
      }
      var iniEl = document.getElementById('vyTopInitials');
      if (iniEl) {
        var parts = name.split(/\s+/).filter(Boolean);
        iniEl.textContent = (parts.length >= 2 ? (parts[0][0] + parts[1][0]) : name.slice(0, 2)).toUpperCase();
      }
    }
    decorateGreeting();
    var nameNode = document.getElementById('sidebarUserName');
    if (nameNode) new MutationObserver(decorateGreeting).observe(nameNode, { childList: true, characterData: true, subtree: true });

    /* ===================== 5. KOMUT PALETI (Ctrl+K) ===================== */
    var palette, input, list, items = [], sel = 0;
    function click(sel) { var el = document.querySelector(sel); if (el) el.click(); }
    function commands() {
      var nav = Array.prototype.map.call(document.querySelectorAll('.nav__item[data-view]'), function (a) {
        return { label: a.dataset.title || a.textContent.trim(), hint: 'Sayfaya git', run: function () { a.click(); } };
      });
      return nav.concat([
        { label: 'Yeni İşlem Ekle', hint: 'İşlem', run: function () { click('[data-action="open-transaction-modal"]'); } },
        { label: 'Hesaplar Arası Transfer', hint: 'İşlem', run: function () { click('[data-action="open-transfer-modal"]'); } },
        { label: 'Yeni Hesap / Kart Ekle', hint: 'Varlık', run: function () { click('[data-action="open-account-modal"]'); } },
        { label: 'Yeni Borç / Alacak', hint: 'Defter', run: function () { click('[data-action="open-debt-modal"]'); } },
        { label: 'Temayı Değiştir (Açık / Koyu)', hint: 'Görünüm', run: toggleTheme },
        { label: 'Koyu Tema', hint: 'Görünüm', run: function () { setTheme('dark'); } },
        { label: 'Açık Tema', hint: 'Görünüm', run: function () { setTheme('light'); } },
        { label: 'Tutarları Gizle / Göster', hint: 'Gizlilik', run: function () { click('#privacyToggleBtn'); } },
        { label: 'Profil & Kasa Ayarları', hint: 'Ayarlar', run: function () { click('#openSettingsBtn'); } },
        { label: 'Yedek Al (JSON)', hint: 'Veri', run: function () { click('#backupVaultBtn'); } },
        { label: 'Kasayı Kilitle', hint: 'Güvenlik', run: function () { click('#lockVaultBtn'); } }
      ]);
    }
    function build() {
      palette = document.createElement('div');
      palette.className = 'vy-palette';
      palette.setAttribute('role', 'dialog');
      palette.setAttribute('aria-modal', 'true');
      palette.setAttribute('aria-label', 'Komut paleti');
      palette.innerHTML = '<div class="vy-palette__box"><input class="vy-palette__input m-input" type="text" placeholder="Sayfa veya komut ara… (örn: takvim, tema, yeni işlem)" autocomplete="off" spellcheck="false"><div class="vy-palette__list" role="listbox"></div></div>';
      document.body.appendChild(palette);
      input = palette.querySelector('input');
      list = palette.querySelector('.vy-palette__list');
      palette.addEventListener('mousedown', function (e) { if (e.target === palette) closePalette(); });
      input.addEventListener('input', renderList);
      input.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
        else if (e.key === 'Enter') { e.preventDefault(); runSel(); }
        else if (e.key === 'Escape') { e.preventDefault(); closePalette(); }
      });
    }
    function norm(s) { return String(s).toLocaleLowerCase('tr-TR'); }
    function renderList() {
      var q = norm(input.value.trim());
      items = commands().filter(function (c) { return !q || norm(c.label + ' ' + c.hint).indexOf(q) >= 0; });
      sel = 0;
      list.innerHTML = '';
      if (!items.length) { list.innerHTML = '<div class="vy-palette__empty">Sonuç bulunamadı</div>'; return; }
      items.forEach(function (c, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'vy-palette__item' + (i === 0 ? ' is-sel' : '');
        b.style.setProperty('--vy-i', Math.min(i, 10));
        b.innerHTML = '<span></span><small></small>';
        b.firstChild.textContent = c.label;
        b.lastChild.textContent = c.hint;
        b.addEventListener('mouseenter', function () { sel = i; mark(); });
        b.addEventListener('click', function () { sel = i; runSel(); });
        list.appendChild(b);
      });
    }
    function mark() {
      Array.prototype.forEach.call(list.children, function (el, i) {
        el.classList.toggle('is-sel', i === sel);
        if (i === sel && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
      });
    }
    function move(d) { if (!items.length) return; sel = (sel + d + items.length) % items.length; mark(); }
    function runSel() { var c = items[sel]; if (!c) return; closePalette(); setTimeout(c.run, 120); }
    function openPalette() {
      if (!palette) build();
      palette.classList.add('is-open');
      input.value = '';
      renderList();
      setTimeout(function () { input.focus(); }, 30);
    }
    function closePalette() { if (palette) palette.classList.remove('is-open'); }
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (palette && palette.classList.contains('is-open')) closePalette(); else openPalette();
      }
    });
  });
})();
