/* =========================================================================
   VAULTY MODAL BASE (Ortak Modal, Görünüm Montajı & Özel Popover Yöneticisi)
   ========================================================================= */
(() => {
  const { esc, tryFmt } = window.Vaulty.State;

  function mountModal(id, html) {
    const existing = document.getElementById(id);
    if (existing) return existing;
    let root = document.getElementById('modalRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'modalRoot';
      document.body.appendChild(root);
    }
    root.insertAdjacentHTML('beforeend', html.trim());
    return document.getElementById(id);
  }

  function mountView(id, html) {
    const existing = document.getElementById(id);
    if (existing) return existing;
    const center = document.getElementById('center') || document.querySelector('main.center');
    if (center) {
      center.insertAdjacentHTML('beforeend', html.trim());
    }
    return document.getElementById(id);
  }

  function openModal(overlayEl) {
    if (!overlayEl) return;
    if (typeof overlayEl === 'string') {
      overlayEl = document.querySelector(overlayEl);
    }
    if (!overlayEl) return;
    overlayEl.hidden = false;
    overlayEl.removeAttribute('hidden');
    overlayEl.classList.add('is-open');
    overlayEl.style.setProperty('display', 'flex', 'important');
    overlayEl.style.setProperty('visibility', 'visible', 'important');
    overlayEl.style.setProperty('opacity', '1', 'important');
    overlayEl.style.setProperty('z-index', '10000', 'important');
    overlayEl.style.setProperty('pointer-events', 'auto', 'important');
    overlayEl.setAttribute('aria-hidden', 'false');

    const modalBox = overlayEl.querySelector('.modal-box');
    if (modalBox) {
      modalBox.style.setProperty('pointer-events', 'auto', 'important');
    }
  }

  function closeModal(overlayEl) {
    if (!overlayEl) return;
    if (typeof overlayEl === 'string') {
      overlayEl = document.querySelector(overlayEl);
    }
    if (!overlayEl) return;
    closeAllCustomPopovers();
    overlayEl.classList.remove('is-open');
    overlayEl.hidden = true;
    overlayEl.setAttribute('hidden', '');
    overlayEl.setAttribute('aria-hidden', 'true');
    overlayEl.style.setProperty('display', 'none', 'important');
    overlayEl.style.setProperty('visibility', 'hidden', 'important');
    overlayEl.style.setProperty('opacity', '0', 'important');
    overlayEl.style.setProperty('z-index', '-1', 'important');
    overlayEl.style.setProperty('pointer-events', 'none', 'important');

    if (document.activeElement && overlayEl.contains(document.activeElement)) {
      document.activeElement.blur();
    }
  }

  function closeAllCustomPopovers(exceptDropdown = null) {
    document.querySelectorAll('.custom-select').forEach((dd) => {
      if (dd !== exceptDropdown) {
        dd.classList.remove('is-open');
        dd.style.zIndex = '';
        if (dd.parentElement) dd.parentElement.style.zIndex = '';
        const trig = dd.querySelector('.custom-select__trigger');
        const pop = dd.querySelector('.custom-select__popover');
        if (trig) trig.setAttribute('aria-expanded', 'false');
        if (pop) {
          pop.hidden = true;
          pop.setAttribute('hidden', '');
          pop.style.setProperty('display', 'none', 'important');
          pop.style.setProperty('pointer-events', 'none', 'important');
          pop.style.setProperty('visibility', 'hidden', 'important');
          pop.style.setProperty('opacity', '0', 'important');
          pop.classList.remove('is-dropup');
        }
      }
    });
  }

  function toggleCustomDropdown(dropdownEl, trigger, popover) {
    if (!dropdownEl) return;
    const actualTrigger = trigger || dropdownEl.querySelector('.custom-select__trigger');
    const actualPopover = popover || dropdownEl.querySelector('.custom-select__popover');
    if (!actualTrigger || !actualPopover) return;

    const willOpen = !dropdownEl.classList.contains('is-open');
    closeAllCustomPopovers(dropdownEl);
    if (!willOpen) {
      dropdownEl.classList.remove('is-open');
      dropdownEl.style.zIndex = '';
      if (dropdownEl.parentElement) dropdownEl.parentElement.style.zIndex = '';
      actualTrigger.setAttribute('aria-expanded', 'false');
      actualPopover.hidden = true;
      actualPopover.setAttribute('hidden', '');
      actualPopover.style.setProperty('display', 'none', 'important');
      actualPopover.style.setProperty('pointer-events', 'none', 'important');
      actualPopover.style.setProperty('visibility', 'hidden', 'important');
      actualPopover.style.setProperty('opacity', '0', 'important');
      actualPopover.classList.remove('is-dropup');
      return;
    }

    // Akıllı Yönlendirme: Modal alt kenarına yakın olan seçiciler yukarı doğru açılır
    const modalBox = dropdownEl.closest('.modal-box');
    const trigRect = actualTrigger.getBoundingClientRect();
    const boxBottom = modalBox ? modalBox.getBoundingClientRect().bottom : window.innerHeight;
    const spaceBelow = boxBottom - trigRect.bottom;
    const shouldDropUp = Boolean(modalBox && spaceBelow < 200);

    actualPopover.classList.toggle('is-dropup', shouldDropUp);
    dropdownEl.classList.add('is-open');
    dropdownEl.style.zIndex = '1000';
    if (dropdownEl.parentElement) dropdownEl.parentElement.style.zIndex = '1000';
    actualTrigger.setAttribute('aria-expanded', 'true');
    actualPopover.hidden = false;
    actualPopover.removeAttribute('hidden');
    actualPopover.style.setProperty('display', 'flex', 'important');
    actualPopover.style.setProperty('pointer-events', 'auto', 'important');
    actualPopover.style.setProperty('visibility', 'visible', 'important');
    actualPopover.style.setProperty('opacity', '1', 'important');
    actualPopover.style.setProperty('z-index', '10050', 'important');

    const selectedBtn = actualPopover.querySelector('.custom-select__item.is-selected');
    if (selectedBtn) {
      selectedBtn.scrollIntoView({ block: 'nearest' });
    }
  }

  function getAccountPopoverMeta(acc) {
    if (acc.type === 'credit') {
      const debt = Number(acc.debt || 0);
      return {
        name: acc.nickname,
        badge: '',
        balance: `Borç: ${tryFmt(debt)}`,
      };
    }
    return {
      name: acc.nickname,
      badge: '',
      balance: tryFmt(acc.balance || 0),
    };
  }

  function renderCustomAccountDropdown(dropdownEl, selectEl, itemList, preferredId = null, extraOptions = []) {
    if (!dropdownEl || !selectEl) return;
    const trigger = dropdownEl.querySelector('.custom-select__trigger');
    const popover = dropdownEl.querySelector('.custom-select__popover');
    if (!trigger || !popover) return;

    const allItems = [
      ...itemList.map((acc) => {
        const meta = getAccountPopoverMeta(acc);
        return {
          value: acc.id,
          name: meta.name,
          badge: meta.badge,
          balance: meta.balance,
        };
      }),
      ...extraOptions,
    ];

    if (allItems.length === 0) {
      selectEl.innerHTML = `<option value="">Uygun kart veya hesap bulunamadı</option>`;
      trigger.querySelector('.cso-name').textContent = 'Uygun kart veya hesap bulunamadı';
      trigger.querySelector('.cso-badge').textContent = '';
      const balEl = trigger.querySelector('.cso-balance');
      if (balEl) balEl.textContent = '';
      popover.innerHTML = '';
      return;
    }

    selectEl.innerHTML = allItems
      .map((item) => `<option value="${esc(item.value)}">${esc(item.name)}${item.balance ? ' • ' + esc(item.balance) : ''}</option>`)
      .join('');

    const activeVal = allItems.some((x) => x.value === preferredId)
      ? preferredId
      : allItems[0].value;
    selectEl.value = activeVal;

    const updateTriggerAndSelection = (val) => {
      const chosen = allItems.find((x) => x.value === val) || allItems[0];
      trigger.querySelector('.cso-name').textContent = chosen.name;
      const badgeEl = trigger.querySelector('.cso-badge');
      if (badgeEl) badgeEl.textContent = chosen.badge ? `• ${chosen.badge}` : '';
      const balEl = trigger.querySelector('.cso-balance');
      if (balEl) balEl.textContent = chosen.balance ? `• ${chosen.balance}` : '';

      popover.querySelectorAll('.custom-select__item').forEach((btn) => {
        const isSel = btn.dataset.value === chosen.value;
        btn.classList.toggle('is-selected', isSel);
        btn.setAttribute('aria-selected', String(isSel));
      });
    };

    popover.innerHTML = allItems
      .map(
        (item) => `
        <button type="button" class="custom-select__item ${item.value === activeVal ? 'is-selected' : ''}" role="option" data-value="${esc(item.value)}" aria-selected="${item.value === activeVal}">
          <span class="cso-left">
            <span class="cso-name">${esc(item.name)}</span>
            ${item.badge ? `<span class="cso-badge">• ${esc(item.badge)}</span>` : ''}
          </span>
          <span class="cso-right">
            ${item.balance ? `<span class="cso-balance mono">${esc(item.balance)}</span>` : ''}
            <svg class="cso-check" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </span>
        </button>`
      )
      .join('');

    updateTriggerAndSelection(activeVal);

    if (!dropdownEl.dataset.boundTrigger) {
      dropdownEl.dataset.boundTrigger = 'true';
      trigger.addEventListener('click', () => {
        toggleCustomDropdown(dropdownEl, trigger, popover);
      });
    }

    popover.querySelectorAll('.custom-select__item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.value;
        selectEl.value = val;
        updateTriggerAndSelection(val);
        closeAllCustomPopovers();
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }

  function renderCustomCategoryDropdown() {
    const dropdownEl = document.getElementById('txCategoryDropdown');
    const selectEl = document.getElementById('txCategorySelect');
    if (!dropdownEl || !selectEl) return;
    const trigger = dropdownEl.querySelector('.custom-select__trigger');
    const popover = dropdownEl.querySelector('.custom-select__popover');
    if (!trigger || !popover) return;

    const opts = Array.from(selectEl.options).map((o) => ({
      value: o.value,
      name: o.textContent,
      badge:
        o.value === 'Maaş Geliri' || o.value === 'Serbest Gelir' || o.value === 'Yatırım'
          ? 'Gelir Kategorisi'
          : o.value === 'Kart Borcu Ödeme'
            ? 'Kart Mahsuplaşma'
            : 'Harcama Kategorisi',
    }));

    const activeVal = selectEl.value || opts[0]?.value || 'Market';

    const updateCatUI = (val) => {
      const chosen = opts.find((x) => x.value === val) || opts[0];
      if (!chosen) return;
      const nameEl = trigger.querySelector('.cso-name');
      const badgeEl = trigger.querySelector('.cso-badge');
      if (nameEl) nameEl.textContent = chosen.name;
      if (badgeEl) badgeEl.textContent = chosen.badge;
      popover.querySelectorAll('.custom-select__item').forEach((btn) => {
        const isSel = btn.dataset.value === chosen.value;
        btn.classList.toggle('is-selected', isSel);
        btn.setAttribute('aria-selected', String(isSel));
      });
    };

    popover.innerHTML = opts
      .map(
        (item) => `
        <button type="button" class="custom-select__item ${item.value === activeVal ? 'is-selected' : ''}" role="option" data-value="${esc(item.value)}" aria-selected="${item.value === activeVal}">
          <span class="cso-left">
            <span class="cso-name">${esc(item.name)}</span>
            <span class="cso-badge">${esc(item.badge)}</span>
          </span>
          <span class="cso-right">
            <svg class="cso-check" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </span>
        </button>`
      )
      .join('');

    updateCatUI(activeVal);

    if (!dropdownEl.dataset.boundTrigger) {
      dropdownEl.dataset.boundTrigger = 'true';
      trigger.addEventListener('click', () => {
        toggleCustomDropdown(dropdownEl, trigger, popover);
      });
    }

    popover.querySelectorAll('.custom-select__item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.value;
        selectEl.value = val;
        updateCatUI(val);
        closeAllCustomPopovers();
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }

  let activeConfirmResolve = null;

  function initConfirmModal() {
    let dlg = document.getElementById('vaultyConfirmDlg');
    if (!dlg) {
      dlg = mountModal('vaultyConfirmDlg', `
<div id="vaultyConfirmDlg" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="vaultyConfirmTitle" hidden style="display: none !important; pointer-events: none !important; z-index: 11000 !important;">
  <div class="modal-box modal-box--confirm" style="width: 440px; max-width: 92vw; padding: 24px; border-radius: 18px; box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25); border: 1px solid #E2E8F0; background: #FFFFFF;">
    <div style="display: flex; gap: 16px; align-items: flex-start; margin-bottom: 20px;">
      <div id="vaultyConfirmIconBox" style="width: 44px; height: 44px; border-radius: 12px; background: #FEF2F2; color: #DC2626; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <svg id="vaultyConfirmDangerIcon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 9v4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
        </svg>
        <svg id="vaultyConfirmWarningIcon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:none;">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/>
        </svg>
      </div>
      <div style="flex: 1; min-width: 0;">
        <h3 id="vaultyConfirmTitle" style="margin: 0 0 6px 0; font-size: 16px; font-weight: 700; color: #0F172A; line-height: 1.3;">
          İşlemi Silmek İstiyor Musunuz?
        </h3>
        <p id="vaultyConfirmMessage" style="margin: 0; font-size: 13.5px; color: #64748B; line-height: 1.5;">
          Bu işlem geri alınamaz.
        </p>
        <div id="vaultyConfirmDetail" style="margin-top: 10px; font-size: 12.5px; padding: 10px 14px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; color: #334155; line-height: 1.5; white-space: pre-line; display: none;"></div>
      </div>
    </div>
    <div style="display: flex; justify-content: flex-end; gap: 10px;">
      <button type="button" class="btn btn--secondary" id="vaultyConfirmCancelBtn" style="padding: 9px 18px; font-size: 13.5px; border-radius: 10px; font-weight: 500; min-width: 85px;">
        Vazgeç
      </button>
      <button type="button" class="btn" id="vaultyConfirmOkBtn" style="padding: 9px 18px; font-size: 13.5px; border-radius: 10px; font-weight: 600; min-width: 95px; background: #DC2626; color: #FFFFFF; border: none; box-shadow: 0 2px 6px rgba(220, 38, 38, 0.25);">
        Evet, Sil
      </button>
    </div>
  </div>
</div>
      `);
    }

    if (!dlg.dataset.boundConfirmEvents) {
      dlg.dataset.boundConfirmEvents = 'true';
      const cancelBtn = document.getElementById('vaultyConfirmCancelBtn');
      const okBtn = document.getElementById('vaultyConfirmOkBtn');

      const handleCancel = () => {
        closeModal(dlg);
        if (activeConfirmResolve) {
          const res = activeConfirmResolve;
          activeConfirmResolve = null;
          res(false);
        }
      };

      const handleConfirm = () => {
        closeModal(dlg);
        if (activeConfirmResolve) {
          const res = activeConfirmResolve;
          activeConfirmResolve = null;
          res(true);
        }
      };

      cancelBtn?.addEventListener('click', handleCancel);
      okBtn?.addEventListener('click', handleConfirm);

      dlg.addEventListener('mousedown', (e) => {
        if (e.target === dlg) {
          handleCancel();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (dlg.classList.contains('is-open')) {
          if (e.key === 'Escape') {
            e.stopPropagation();
            handleCancel();
          } else if (e.key === 'Enter') {
            e.stopPropagation();
            handleConfirm();
          }
        }
      });
    }

    return dlg;
  }

  function confirmDialog(options = {}) {
    return new Promise((resolve) => {
      const dlg = initConfirmModal();
      activeConfirmResolve = resolve;

      const titleEl = document.getElementById('vaultyConfirmTitle');
      const msgEl = document.getElementById('vaultyConfirmMessage');
      const detailEl = document.getElementById('vaultyConfirmDetail');
      const okBtn = document.getElementById('vaultyConfirmOkBtn');
      const cancelBtn = document.getElementById('vaultyConfirmCancelBtn');
      const iconBox = document.getElementById('vaultyConfirmIconBox');
      const dangerIcon = document.getElementById('vaultyConfirmDangerIcon');
      const warningIcon = document.getElementById('vaultyConfirmWarningIcon');

      const title = options.title || 'İşlemi Onaylıyor Musunuz?';
      const message = options.message || 'Bu işlem geri alınamaz.';
      const detail = options.subMessage || options.detail || '';
      const confirmText = options.confirmText || 'Evet, Sil';
      const cancelText = options.cancelText || 'Vazgeç';
      const type = options.type || 'danger';

      if (titleEl) titleEl.textContent = title;
      if (msgEl) msgEl.textContent = message;

      if (detailEl) {
        if (detail) {
          detailEl.textContent = detail;
          detailEl.style.display = 'block';
        } else {
          detailEl.textContent = '';
          detailEl.style.display = 'none';
        }
      }

      if (cancelBtn) cancelBtn.textContent = cancelText;

      if (okBtn) {
        okBtn.textContent = confirmText;
        if (type === 'warning') {
          okBtn.style.backgroundColor = '#D97706';
          okBtn.style.boxShadow = '0 2px 6px rgba(217, 119, 6, 0.25)';
          if (iconBox) {
            iconBox.style.backgroundColor = '#FFFBEB';
            iconBox.style.color = '#D97706';
          }
          if (dangerIcon) dangerIcon.style.display = 'none';
          if (warningIcon) warningIcon.style.display = 'block';
        } else {
          okBtn.style.backgroundColor = '#DC2626';
          okBtn.style.boxShadow = '0 2px 6px rgba(220, 38, 38, 0.25)';
          if (iconBox) {
            iconBox.style.backgroundColor = '#FEF2F2';
            iconBox.style.color = '#DC2626';
          }
          if (dangerIcon) dangerIcon.style.display = 'block';
          if (warningIcon) warningIcon.style.display = 'none';
        }
      }

      openModal(dlg);
      setTimeout(() => okBtn?.focus(), 50);
    });
  }

  function initModalOverlays() {
    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.classList.remove('is-open');
      overlay.hidden = true;
      overlay.setAttribute('hidden', '');
      overlay.setAttribute('aria-hidden', 'true');
      overlay.style.setProperty('display', 'none', 'important');
      overlay.style.setProperty('visibility', 'hidden', 'important');
      overlay.style.setProperty('opacity', '0', 'important');
      overlay.style.setProperty('z-index', '-9999', 'important');
      overlay.style.setProperty('pointer-events', 'none', 'important');

      if (!overlay.dataset.boundBackdrop) {
        overlay.dataset.boundBackdrop = 'true';
        overlay.addEventListener('mousedown', (e) => {
          if (e.target === overlay) {
            closeModal(overlay);
          }
        });
      }
    });

    if (!document.body.dataset.boundModalBaseEvents) {
      document.body.dataset.boundModalBaseEvents = 'true';
      document.addEventListener('mousedown', (e) => {
        const insideDropdown = e.target.closest('.custom-select');
        if (!insideDropdown) {
          closeAllCustomPopovers();
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeAllCustomPopovers();
        }
      });
    }
  }

  const ModalBase = {
    mountModal,
    mountView,
    openModal,
    closeModal,
    confirm: confirmDialog,
    closeAllCustomPopovers,
    toggleCustomDropdown,
    renderCustomAccountDropdown,
    renderCustomCategoryDropdown,
    initModalOverlays,
  };

  window.openModal = openModal;
  window.closeModal = closeModal;
  window.renderCustomAccountDropdown = renderCustomAccountDropdown;
  window.renderCustomCategoryDropdown = renderCustomCategoryDropdown;
  window.toggleCustomDropdown = toggleCustomDropdown;
  window.closeAllCustomPopovers = closeAllCustomPopovers;

  window.Vaulty = window.Vaulty || {};
  window.Vaulty.confirm = confirmDialog;
  window.confirmAsync = confirmDialog;
  window.Vaulty.Modal = ModalBase;
  window.Vaulty.ModalBase = ModalBase;
  window.Vaulty.ModalRegistry = window.Vaulty.ModalRegistry || {
    register: mountModal,
  };
  window.Vaulty.Modals = window.Vaulty.Modals || {};
  window.Vaulty.Modals.Modal = ModalBase;
  window.Vaulty.Modals.ModalBase = ModalBase;
})();

