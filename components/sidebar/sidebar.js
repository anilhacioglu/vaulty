/* =========================================================================
   VAULTY SIDEBAR COMPONENT (Sol Navigasyon Menüsü & Kullanıcı Kartı)
   ========================================================================= */
(() => {
  const { esc, safeRun } = window.Vaulty.State;

  const DEFAULT_AVATAR_34_SVG = `
    <svg viewBox="0 0 36 36" width="34" height="34" fill="none">
      <rect width="36" height="36" rx="18" fill="#EFF6FF"/>
      <circle cx="18" cy="14" r="5.5" fill="#2563EB"/>
      <path d="M7.5 31c1.7-5.6 6-8.4 10.5-8.4s8.8 2.8 10.5 8.4" fill="#2563EB"/>
    </svg>`;

  const DEFAULT_AVATAR_72_SVG = `
    <svg viewBox="0 0 72 72" width="72" height="72" fill="none">
      <rect width="72" height="72" rx="36" fill="#EFF6FF"/>
      <circle cx="36" cy="28" r="11" fill="#2563EB"/>
      <path d="M15 62c3.4-11.2 12-16.8 21-16.8s17.6 5.6 21 16.8" fill="#2563EB"/>
    </svg>`;

  function renderProfileIdentityUI() {
    const State = window.Vaulty.State;
    const isTest = State?.isTestMode;
    const { vaultProfile } = State;
    const name = isTest ? 'Test Kullanıcısı' : ((vaultProfile.username || 'Usta').trim() || 'Usta');
    const sidebarNameEl = document.getElementById('sidebarUserName');
    if (sidebarNameEl) sidebarNameEl.textContent = name;

    const subEl = document.querySelector('.user-card__sub');
    if (subEl) {
      subEl.textContent = isTest ? '🧪 Örnek Test Kasası' : 'Kişisel Kasa';
    }

    const usernameInput = document.getElementById('profileUsernameInput');
    if (usernameInput && document.activeElement !== usernameInput) {
      usernameInput.value = name;
    }

    const sidebarAvatarEl = document.getElementById('sidebarUserAvatar');
    const settingsAvatarEl = document.getElementById('settingsAvatarPreview');
    const removeBtn = document.getElementById('removeAvatarBtn');

    if (!isTest && vaultProfile.avatarDataUrl) {
      if (sidebarAvatarEl) {
        sidebarAvatarEl.innerHTML = `<img src="${esc(vaultProfile.avatarDataUrl)}" alt="${esc(name)}">`;
      }
      if (settingsAvatarEl) {
        settingsAvatarEl.innerHTML = `<img src="${esc(vaultProfile.avatarDataUrl)}" alt="${esc(name)}">`;
      }
      if (removeBtn) removeBtn.disabled = false;
    } else {
      if (sidebarAvatarEl) sidebarAvatarEl.innerHTML = DEFAULT_AVATAR_34_SVG;
      if (settingsAvatarEl) settingsAvatarEl.innerHTML = DEFAULT_AVATAR_72_SVG;
      if (removeBtn) removeBtn.disabled = false;
    }
  }

  function setPopoverOpen(open) {
    const userPopover = document.getElementById('userPopover');
    const userCardBtn = document.getElementById('userCardBtn');
    if (!userPopover) return;
    userPopover.hidden = !open;
    if (!open) {
      userPopover.setAttribute('hidden', '');
      userPopover.style.setProperty('display', 'none', 'important');
      userPopover.style.setProperty('pointer-events', 'none', 'important');
    } else {
      userPopover.removeAttribute('hidden');
      userPopover.style.setProperty('display', 'flex', 'important');
      userPopover.style.setProperty('pointer-events', 'auto', 'important');
    }
    userCardBtn?.setAttribute('aria-expanded', String(open));
  }

  function activateNavItem(target) {
    if (!target) return;
    const link = typeof target === 'string'
      ? document.querySelector(`.nav__item[data-view="${target}"]`)
      : target;
    if (!link) return;

    document.querySelectorAll('.nav__item').forEach((n) => {
      n.classList.remove('is-active');
      n.removeAttribute('aria-current');
    });
    link.classList.add('is-active');
    link.setAttribute('aria-current', 'page');

    const view = link.dataset.view;

    const aView = document.getElementById('assetsView');
    const tView = document.getElementById('transactionsView');
    const dView = document.getElementById('debtView');
    const dashV = document.getElementById('dashboardView');
    const pView = document.getElementById('plannedView');

    const views = [aView, tView, dView, dashV, pView];
    views.forEach((v) => {
      if (v) {
        v.hidden = true;
        v.setAttribute('hidden', '');
      }
    });

    // Çekmece açıksa kapat
    if (window.Vaulty.Modals?.DebtPayDesk?.closeDrawer) {
      window.Vaulty.Modals.DebtPayDesk.closeDrawer();
    }

    if (view === 'assets') {
      if (aView) {
        aView.hidden = false;
        aView.removeAttribute('hidden');
      }
      safeRun(() => window.Vaulty.Views?.Assets?.render(), 'renderAssetsView');
    } else if (view === 'transactions') {
      if (tView) {
        tView.hidden = false;
        tView.removeAttribute('hidden');
      }
      safeRun(() => window.Vaulty.Views?.Transactions?.render(), 'renderTransactionsView');
    } else if (view === 'debt') {
      if (dView) {
        dView.hidden = false;
        dView.removeAttribute('hidden');
      }
      safeRun(() => window.Vaulty.Views?.Debts?.render(), 'renderDebtsView');
    } else if (view === 'dashboard') {
      if (dashV) {
        dashV.hidden = false;
        dashV.removeAttribute('hidden');
      }
      safeRun(() => window.Vaulty.Views?.Overview?.render(), 'renderOverviewView');
    } else if (view === 'planned') {
      if (pView) {
        pView.hidden = false;
        pView.removeAttribute('hidden');
      }
      safeRun(() => window.Vaulty.Views?.Calendar?.render(), 'renderCalendarView');
    }

    window.Vaulty.State.emit('route:changed', view);
  }

  function initSidebar() {
    document.querySelectorAll('.nav__item').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        activateNavItem(link);
      });
    });

    const userCardBtn = document.getElementById('userCardBtn');
    const userPopover = document.getElementById('userPopover');
    const userMenuWrap = document.getElementById('userMenuWrap');

    userCardBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target.closest('#userCardMoreBtn')) {
        setPopoverOpen(userPopover ? userPopover.hidden : false);
      } else {
        if (window.Vaulty.Modals?.AccountModals?.openProfileSettingsModal) {
          window.Vaulty.Modals.AccountModals.openProfileSettingsModal();
        }
      }
    });

    document.addEventListener('click', (e) => {
      if (userPopover && !userPopover.hidden && userMenuWrap && !userMenuWrap.contains(e.target)) {
        setPopoverOpen(false);
      }
    });

    renderProfileIdentityUI();
    window.Vaulty.State.on('profile:changed', renderProfileIdentityUI);
    window.Vaulty.State.on('mode:changed', renderProfileIdentityUI);
  }

  const Sidebar = {
    init: initSidebar,
    activateNavItem,
    renderProfileIdentityUI,
    setPopoverOpen,
  };

  window.activateNavItem = activateNavItem;
  window.Vaulty = window.Vaulty || {};
  window.Vaulty.Sidebar = Sidebar;
})();

