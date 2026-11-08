/**
 * Vaulty - Global Event Listeners & Input Hygiene
 * core/events.js
 *
 * Encapsulates:
 * 1. Global Keyboard listeners (Escape closing modals/drawers/popovers)
 * 2. Global Document click listeners (Outside click dismissing popovers/dropdowns)
 * 3. Quick Action Button bindings across views
 * 4. Input hygiene for monetary and number fields
 */

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  const MONEY_INPUT_SELECTOR = [
    'input[inputmode="decimal"]',
    'input[data-money-input]',
    '.tx-amount-field',
    '.sd-amount-input',
    '.cd-amount-input',
    '.td-amount-input',
    '#txAmountInput',
    '#cdAmountInput',
    '#payAmountInput',
    '#savingsGoalTargetInput',
    '#savingsGoalCurrentInput',
    '#potTransferAmountInput',
    '#tdAmountInput',
    '#acctBalance',
    '#acctLimit',
    '#acctDebt',
    '#updateBalInput',
    'input[name="balance"]',
    'input[name="limit"]',
    'input[name="debt"]',
    'input[name="total"]',
    'input[name="initialPaid"]'
  ].join(', ');

  function isMoneyInput(el) {
    if (!el || !el.matches) return false;
    return el.matches(MONEY_INPUT_SELECTOR);
  }

  function enforceInputHygiene() {
    // 1. Tutar barlarına harf ve geçersiz sembol yazılmasını engelle (Keydown)
    document.addEventListener('keydown', (e) => {
      const target = e.target;
      if (!isMoneyInput(target)) return;

      // Ctrl / Cmd kısayollarına (Kopyala, Yapıştır, Tümünü Seç vb.) izin ver
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Gezinme ve düzenleme tuşlarına izin ver
      const allowedSpecialKeys = [
        'Backspace', 'Delete', 'Tab', 'Enter', 'Escape',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Home', 'End', 'PageUp', 'PageDown'
      ];
      if (allowedSpecialKeys.includes(e.key)) return;

      // Yalnızca rakamlara (0-9) izin ver
      if (e.key >= '0' && e.key <= '9') return;

      // Yalnızca ondalık / basamak ayracı (. ve ,) izin ver
      if (e.key === '.' || e.key === ',') return;

      // Geriye kalan tüm harf, boşluk ve yabancı karakterleri kesin olarak engelle
      e.preventDefault();
    });

    // 2. Canlı Giriş Denetimi (Input - IME, sanal klavye veya otomatik doldurma harflerini temizle)
    document.addEventListener('input', (e) => {
      const target = e.target;
      if (!isMoneyInput(target)) return;

      if (target.value && /[^0-9.,]/.test(target.value)) {
        const start = target.selectionStart;
        const oldLen = target.value.length;
        target.value = target.value.replace(/[^0-9.,]/g, '');
        if (start != null) {
          const diff = oldLen - target.value.length;
          target.setSelectionRange(Math.max(0, start - diff), Math.max(0, start - diff));
        }
      }
    });

    // 3. Yapıştırma Denetimi (Paste - Yapıştırılan metindeki harfleri ayıkla)
    document.addEventListener('paste', (e) => {
      const target = e.target;
      if (!isMoneyInput(target)) return;

      const clipboardData = e.clipboardData || window.clipboardData;
      const text = clipboardData ? clipboardData.getData('text') : '';
      if (text && /[^0-9.,]/.test(text)) {
        e.preventDefault();
        const clean = text.replace(/[^0-9.,]/g, '');
        if (clean) {
          const start = target.selectionStart || 0;
          const end = target.selectionEnd || 0;
          const val = target.value || '';
          target.value = val.slice(0, start) + clean + val.slice(end);
          const nextPos = start + clean.length;
          target.setSelectionRange(nextPos, nextPos);
          target.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    });

    // 4. Sürükle-Bırak Denetimi (Drop)
    document.addEventListener('drop', (e) => {
      const target = e.target;
      if (!isMoneyInput(target)) return;
      setTimeout(() => {
        if (target.value && /[^0-9.,]/.test(target.value)) {
          target.value = target.value.replace(/[^0-9.,]/g, '');
          target.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, 0);
    });
  }

  function togglePrivacyMode(forceState = null) {
    const isCurrentlyActive = document.body.classList.contains('privacy-active');
    const newState = forceState !== null ? Boolean(forceState) : !isCurrentlyActive;

    document.body.classList.toggle('privacy-active', newState);

    try {
      sessionStorage.setItem('vaulty_privacy_mode', newState ? 'true' : 'false');
    } catch (_) {}

    document.querySelectorAll('#privacyToggleBtn, [data-action="toggle-privacy"]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(newState));
      const eyeIcon = btn.querySelector('.privacy-icon-eye');
      const offIcon = btn.querySelector('.privacy-icon-off');
      const label = btn.querySelector('.privacy-btn-label');
      if (eyeIcon) eyeIcon.style.display = newState ? 'none' : 'inline-block';
      if (offIcon) offIcon.style.display = newState ? 'inline-block' : 'none';
      if (label) {
        if (btn.classList.contains('sidebar-privacy-btn')) {
          label.textContent = newState ? 'Tutarları Göster' : 'Tutarları Gizle';
        } else {
          label.textContent = newState ? 'Gizli' : 'Gizlilik';
        }
      }
    });

    const State = window.Vaulty?.State;
    if (State && State.showToast && forceState === null) {
      State.showToast(newState ? 'Gizlilik modu aktif (Tutarlar sansürlendi)' : 'Gizlilik modu kapatıldı');
    }
  }

  function restorePrivacyMode() {
    try {
      const saved = sessionStorage.getItem('vaulty_privacy_mode');
      const prof = window.Vaulty?.State ? window.Vaulty.State.getVaultProfile() : window.vaultProfile;
      const startInPrivacy = prof?.startInPrivacyMode === true;
      if (saved === 'true' || (saved === null && startInPrivacy)) {
        togglePrivacyMode(true);
      }
    } catch (_) {}
  }

  function bindGlobalShortcuts() {
    document.addEventListener('keydown', (e) => {
      const tag = (e.target && e.target.tagName) || '';
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable);

      if (e.key === 'Escape') {
        // 1. First priority: Close any open modal dialog
        const openOverlay = $$('.modal-overlay').find(
          (el) => !el.hidden && el.classList.contains('is-open')
        );
        if (openOverlay) {
          if (window.Vaulty?.ModalBase?.closeModal) {
            window.Vaulty.ModalBase.closeModal(openOverlay);
          } else if (window.Vaulty?.Modal?.closeModal) {
            window.Vaulty.Modal.closeModal(openOverlay);
          } else if (window.closeModal) {
            window.closeModal(openOverlay);
          }
          return;
        }

        // 2. Second priority: Close settlement desk drawer
        if (window.Vaulty?.DebtPayDesk?.closeDrawer) {
          window.Vaulty.DebtPayDesk.closeDrawer();
        } else if (window.closeDrawer) {
          window.closeDrawer();
        }

        // 3. Third priority: Dismiss user popover menu
        if (window.Vaulty?.Sidebar?.setPopoverOpen) {
          window.Vaulty.Sidebar.setPopoverOpen(false);
        } else if (window.setPopoverOpen) {
          window.setPopoverOpen(false);
        }
      }

      // Kısayol: "H" tuşu ile Gizlilik (Röntgenci) Modu Aç/Kapat
      if (!isInput && (e.key === 'h' || e.key === 'H') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        togglePrivacyMode();
      }
    });
  }

  function bindGlobalActionDelegation() {
    document.addEventListener('click', async (e) => {
      // 1. Identify clicked button / interactive element
      const btn = e.target.closest('[data-action], [data-modal-target], button, [role="button"], a');
      if (!btn) return;

      const action = btn.dataset.action;
      const modalTarget = btn.dataset.modalTarget;

      // Helper to retrieve active account
      const getActiveAccId = () => {
        const State = window.Vaulty?.State;
        return (State && State.selectedAccountId) || window.selectedAccountId || null;
      };

      // Helper to open modal cleanly
      const safeOpen = (selector) => {
        const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!el) return;
        if (window.openModal) {
          window.openModal(el);
        } else if (window.Vaulty?.ModalBase?.openModal) {
          window.Vaulty.ModalBase.openModal(el);
        } else if (window.Vaulty?.Modal?.openModal) {
          window.Vaulty.Modal.openModal(el);
        } else {
          el.hidden = false;
          el.removeAttribute('hidden');
          el.classList.add('is-open');
          el.style.setProperty('display', 'flex', 'important');
          el.style.setProperty('visibility', 'visible', 'important');
          el.style.setProperty('opacity', '1', 'important');
          el.style.setProperty('z-index', '10000', 'important');
          el.style.setProperty('pointer-events', 'auto', 'important');
        }
      };

      // Helper to close modal cleanly
      const safeClose = (el) => {
        if (!el) return;
        if (window.closeModal) {
          window.closeModal(el);
        } else if (window.Vaulty?.ModalBase?.closeModal) {
          window.Vaulty.ModalBase.closeModal(el);
        } else if (window.Vaulty?.Modal?.closeModal) {
          window.Vaulty.Modal.closeModal(el);
        } else {
          el.classList.remove('is-open');
          el.hidden = true;
          el.setAttribute('hidden', '');
          el.style.setProperty('display', 'none', 'important');
          el.style.setProperty('visibility', 'hidden', 'important');
          el.style.setProperty('opacity', '0', 'important');
          el.style.setProperty('pointer-events', 'none', 'important');
        }
      };

      // Direct modal target
      if (modalTarget) {
        if (btn.tagName === 'A' || btn.tagName === 'BUTTON') e.preventDefault();
        safeOpen(modalTarget);
        return;
      }

      // Check actions
      if (
        action === 'open-transaction-modal' ||
        btn.id === 'openNewTxModalBtn' ||
        btn.id === 'openNewTxFromDashBtn' ||
        btn.id === 'emptyTxAddNewBtn' ||
        btn.id === 'openQuickTxFromAssetsBtn'
      ) {
        if (btn.tagName === 'A' || btn.tagName === 'BUTTON') e.preventDefault();
        const preferredType = btn.dataset.txType || 'Gider';
        const accId = btn.dataset.accId || getActiveAccId();
        if (window.Vaulty?.NewTransaction?.openNewTransactionModal) {
          window.Vaulty.NewTransaction.openNewTransactionModal(preferredType, accId);
        } else if (window.Vaulty?.Modals?.NewTransaction?.openNewTransactionModal) {
          window.Vaulty.Modals.NewTransaction.openNewTransactionModal(preferredType, accId);
        } else if (window.openNewTransactionModal) {
          window.openNewTransactionModal(preferredType, accId);
        } else {
          safeOpen('#addTxDlg');
        }
        return;
      }

      if (
        action === 'open-account-modal' ||
        btn.id === 'openAddAccountBtn' ||
        btn.id === 'dashAddAccBtn' ||
        btn.id === 'emptyWalletAddBtn' ||
        btn.id === 'emptyInspAddAccBtn'
      ) {
        if (btn.tagName === 'A' || btn.tagName === 'BUTTON') e.preventDefault();
        if (window.Vaulty?.AccountModals?.openAddOrEditAccountModal) {
          window.Vaulty.AccountModals.openAddOrEditAccountModal(null);
        } else if (window.Vaulty?.Modals?.AccountModals?.openAddOrEditAccountModal) {
          window.Vaulty.Modals.AccountModals.openAddOrEditAccountModal(null);
        } else if (window.openAddOrEditAccountModal) {
          window.openAddOrEditAccountModal(null);
        } else {
          safeOpen('#addAccountDlg');
        }
        return;
      }

      if (
        action === 'open-debt-modal' ||
        btn.id === 'openNewDebtModalBtn' ||
        btn.id === 'emptyDebtAddBtn'
      ) {
        if (btn.tagName === 'A' || btn.tagName === 'BUTTON') e.preventDefault();
        const preferredKind = btn.dataset.ledgerKind || null;
        if (window.Vaulty?.AccountModals?.openNewLedgerModal) {
          window.Vaulty.AccountModals.openNewLedgerModal(preferredKind);
        } else if (window.Vaulty?.Modals?.AccountModals?.openNewLedgerModal) {
          window.Vaulty.Modals.AccountModals.openNewLedgerModal(preferredKind);
        } else if (window.openNewLedgerModal) {
          window.openNewLedgerModal(preferredKind);
        } else {
          safeOpen('#newLedgerDlg');
        }
        return;
      }

      if (
        action === 'open-pay-card-debt' ||
        btn.id === 'openPayCardDebtFromTxBtn' ||
        btn.id === 'btnPayCardDebtInspector'
      ) {
        if (btn.tagName === 'A' || btn.tagName === 'BUTTON') e.preventDefault();
        const cardId = btn.dataset.cardId || getActiveAccId();
        if (window.Vaulty?.DebtPayDesk?.openPayCardDebtModal) {
          window.Vaulty.DebtPayDesk.openPayCardDebtModal(cardId);
        } else if (window.Vaulty?.Modals?.DebtPayDesk?.openPayCardDebtModal) {
          window.Vaulty.Modals.DebtPayDesk.openPayCardDebtModal(cardId);
        } else if (window.openPayCardDebtModal) {
          window.openPayCardDebtModal(cardId);
        } else {
          safeOpen('#payCardDebtDlg');
        }
        return;
      }

      if (action === 'open-update-balance' || btn.id === 'btnUpdateBalance') {
        if (btn.tagName === 'A' || btn.tagName === 'BUTTON') e.preventDefault();
        const accId = btn.dataset.accId || getActiveAccId();
        const State = window.Vaulty?.State;
        const acc = State ? State.getAccountById(accId) : null;
        if (window.Vaulty?.AccountModals?.openUpdateBalanceModal) {
          window.Vaulty.AccountModals.openUpdateBalanceModal(acc);
        } else if (window.openUpdateBalanceModal) {
          window.openUpdateBalanceModal(acc);
        }
        return;
      }

      if (action === 'open-edit-account' || btn.id === 'btnEditAccount') {
        if (btn.tagName === 'A' || btn.tagName === 'BUTTON') e.preventDefault();
        const accId = btn.dataset.accId || getActiveAccId();
        const State = window.Vaulty?.State;
        const acc = State ? State.getAccountById(accId) : null;
        if (window.Vaulty?.AccountModals?.openAddOrEditAccountModal) {
          window.Vaulty.AccountModals.openAddOrEditAccountModal(acc);
        } else if (window.openAddOrEditAccountModal) {
          window.openAddOrEditAccountModal(acc);
        }
        return;
      }

      if (action === 'delete-account' || btn.id === 'btnDeleteAccount') {
        if (btn.tagName === 'A' || btn.tagName === 'BUTTON') e.preventDefault();
        const accId = btn.dataset.accId || getActiveAccId();
        const State = window.Vaulty?.State;
        const acc = State ? State.getAccountById(accId) : null;
        if (!acc) return;
        let ok = false;
        if (window.Vaulty?.confirm) {
          ok = await window.Vaulty.confirm({
            title: 'Hesabı Silmek İstiyor Musunuz?',
            message: `"${acc.nickname}" hesabını kalıcı olarak silmek istediğinize emin misiniz?`,
            subMessage: 'Bu hesaba ait tüm geçmiş işlemler de kalıcı olarak silinecektir.',
            confirmText: 'Hesabı Sil',
            cancelText: 'Vazgeç',
            type: 'danger',
          });
        } else {
          ok = confirm(`"${acc.nickname}" hesabını silmek istediğinize emin misiniz?\nBu hesaba ait tüm geçmiş işlemler de kalıcı olarak silinecektir.`);
        }
        if (ok) {
          State.deleteAccount(acc.id);
        }
        return;
      }

      if (btn.dataset.editTx) {
        if (btn.tagName === 'A' || btn.tagName === 'BUTTON') e.preventDefault();
        e.stopPropagation();
        const txId = btn.dataset.editTx;
        if (window.Vaulty?.Modals?.NewTransaction?.startEditTransaction) {
          window.Vaulty.Modals.NewTransaction.startEditTransaction(txId);
        } else if (window.Vaulty?.NewTransaction?.startEditTransaction) {
          window.Vaulty.NewTransaction.startEditTransaction(txId);
        } else if (window.startEditTransaction) {
          window.startEditTransaction(txId);
        }
        return;
      }

      if (btn.dataset.delTx) {
        if (btn.tagName === 'A' || btn.tagName === 'BUTTON') e.preventDefault();
        e.stopPropagation();
        const txId = btn.dataset.delTx;
        const State = window.Vaulty?.State;
        const target = State?.tx?.find((x) => x && x.id === txId);
        const desc = target?.desc || 'Bu';
        let ok = false;

        if (target && target.isInstallment && target.installment && target.installment.groupId) {
          const inst = target.installment;
          const msg = `"${desc}" harcaması ${inst.totalInstallments} taksitli bir işlemin parçasıdır (${inst.currentInstallment}/${inst.totalInstallments}).`;
          const sub = `Tüm taksit grubunu (${inst.totalInstallments} taksit) silmek ve kart bakiyesini iade etmek istiyor musunuz?`;
          if (window.Vaulty?.confirm) {
            ok = await window.Vaulty.confirm({
              title: 'Taksitli İşlemi Sil',
              message: msg,
              subMessage: sub,
              confirmText: 'Tüm Taksitleri Sil',
              cancelText: 'Vazgeç',
              type: 'danger',
            });
          } else {
            ok = confirm(`${msg}\n${sub}`);
          }
          if (!ok) return;
          if (State?.deleteInstallmentGroup) {
            State.deleteInstallmentGroup(inst.groupId);
          } else if (State?.deleteTransaction) {
            State.deleteTransaction(txId, true);
          }
          return;
        }

        if (window.Vaulty?.confirm) {
          ok = await window.Vaulty.confirm({
            title: 'İşlemi Silmek İstiyor Musunuz?',
            message: `"${desc}" işlemini silmek istediğinize emin misiniz?`,
            subMessage: 'İlgili hesap bakiyesi otomatik olarak eski haline getirilecektir.',
            confirmText: 'İşlemi Sil',
            cancelText: 'Vazgeç',
            type: 'danger',
          });
        } else {
          ok = confirm(`"${desc}" işlemini silmek istediğinize emin misiniz?`);
        }
        if (!ok) return;
        if (State && State.deleteTransaction) {
          State.deleteTransaction(txId, true);
        } else if (window.deleteTransaction) {
          window.deleteTransaction(txId, true);
        }
        return;
      }

      if (btn.dataset.delDebt) {
        if (btn.tagName === 'A' || btn.tagName === 'BUTTON') e.preventDefault();
        e.stopPropagation();
        const debtId = btn.dataset.delDebt;
        const State = window.Vaulty?.State;
        const item = State && State.ledgerItems.find((x) => x && x.id === debtId);
        if (item) {
          if (window.Vaulty.AccountModals?.openConfirmDeleteDebtModal) {
            window.Vaulty.AccountModals.openConfirmDeleteDebtModal(item);
          } else if (window.openConfirmDeleteDebtModal) {
            window.openConfirmDeleteDebtModal(item);
          }
        }
        return;
      }

      // Tekrarlayan İşlem Motoru Aksiyonları
      if (action === 'open-review-recurring') {
        if (btn.tagName === 'A' || btn.tagName === 'BUTTON') e.preventDefault();
        window.Vaulty?.RecurringEngine?.openReviewModal?.();
        return;
      }

      if (action === 'approve-all-recurring') {
        if (btn.tagName === 'A' || btn.tagName === 'BUTTON') e.preventDefault();
        window.Vaulty?.RecurringEngine?.approveAllRecurring?.();
        return;
      }

      if (action === 'approve-recurring') {
        if (btn.tagName === 'A' || btn.tagName === 'BUTTON') e.preventDefault();
        const recId = btn.dataset.recId;
        if (recId) window.Vaulty?.RecurringEngine?.approveRecurring?.(recId);
        return;
      }

      if (action === 'skip-recurring') {
        if (btn.tagName === 'A' || btn.tagName === 'BUTTON') e.preventDefault();
        const recId = btn.dataset.recId;
        if (recId) window.Vaulty?.RecurringEngine?.skipRecurring?.(recId);
        return;
      }

      if (action === 'open-settings-modal' || btn.id === 'openSettingsBtn') {
        if (btn.tagName === 'A' || btn.tagName === 'BUTTON') e.preventDefault();
        if (window.Vaulty?.AccountModals?.openProfileSettingsModal) {
          window.Vaulty.AccountModals.openProfileSettingsModal('profile');
        } else if (window.openProfileSettingsModal) {
          window.openProfileSettingsModal('profile');
        } else {
          safeOpen('#settingsDlg');
        }
        return;
      }

      if (action === 'open-preferences-modal' || btn.id === 'openPreferencesBtn') {
        if (btn.tagName === 'A' || btn.tagName === 'BUTTON') e.preventDefault();
        if (window.Vaulty?.AccountModals?.openProfileSettingsModal) {
          window.Vaulty.AccountModals.openProfileSettingsModal('preferences');
        } else if (window.openProfileSettingsModal) {
          window.openProfileSettingsModal('preferences');
        } else {
          safeOpen('#settingsDlg');
        }
        return;
      }

      if (action === 'close-modal' || btn.classList.contains('modal-close-btn')) {
        if (btn.tagName === 'A' || btn.tagName === 'BUTTON') e.preventDefault();
        const overlay = btn.closest('.modal-overlay');
        if (overlay) safeClose(overlay);
        return;
      }

      if (action === 'backup-vault' || btn.id === 'backupVaultBtn' || btn.id === 'settingsBackupBtn' || btn.id === 'sectionBackupBtn') {
        if (btn.tagName === 'A' || btn.tagName === 'BUTTON') e.preventDefault();
        if (window.Vaulty?.AccountModals?.triggerBackupExport) {
          window.Vaulty.AccountModals.triggerBackupExport();
        } else if (window.triggerBackupExport) {
          window.triggerBackupExport();
        }
        return;
      }

      if (action === 'restore-vault' || btn.id === 'restoreVaultBtn' || btn.id === 'settingsRestoreBtn' || btn.id === 'sectionRestoreBtn') {
        if (btn.tagName === 'A' || btn.tagName === 'BUTTON') e.preventDefault();
        if (window.Vaulty?.AccountModals?.triggerRestoreBackup) {
          window.Vaulty.AccountModals.triggerRestoreBackup();
        } else if (window.triggerRestoreBackup) {
          window.triggerRestoreBackup();
        }
        return;
      }

      if (action === 'lock-vault' || btn.id === 'lockVaultBtn' || btn.id === 'settingsLockBtn') {
        if (btn.tagName === 'A' || btn.tagName === 'BUTTON') e.preventDefault();
        if (window.Vaulty?.AccountModals?.triggerLockVault) {
          window.Vaulty.AccountModals.triggerLockVault();
        } else if (window.triggerLockVault) {
          window.triggerLockVault();
        }
        return;
      }

      // Hızlı Transfer Masası Aksiyonu
      if (
        action === 'open-transfer-modal' ||
        btn.id === 'openTransferModalBtn' ||
        btn.id === 'openTransferDeskBtn'
      ) {
        if (btn.tagName === 'A' || btn.tagName === 'BUTTON') e.preventDefault();
        e.stopPropagation();
        const srcId = btn.dataset.sourceId || btn.dataset.srcId || null;
        const targetId = btn.dataset.targetId || btn.dataset.accId || null;
        const amount = btn.dataset.amount || null;

        if (window.Vaulty?.Modals?.TransferModal?.openTransferModal) {
          window.Vaulty.Modals.TransferModal.openTransferModal(srcId, targetId, amount);
        } else if (window.openTransferModal) {
          window.openTransferModal(srcId, targetId, amount);
        } else {
          safeOpen('#transferDeskDlg');
        }
        return;
      }

      // Birikim Hedefi / Kumbara Açma Aksiyonu
      if (action === 'open-savings-goal-modal' || btn.id === 'openAddSavingsGoalBtn' || btn.id === 'emptyAddSavingsGoalBtn') {
        if (btn.tagName === 'A' || btn.tagName === 'BUTTON') e.preventDefault();
        window.Vaulty?.Modals?.SavingsGoal?.openGoalModal(null);
        return;
      }

      // Gizlilik / Röntgenci Modu Toggle Aksiyonu
      if (action === 'toggle-privacy' || btn.id === 'privacyToggleBtn') {
        if (btn.tagName === 'A' || btn.tagName === 'BUTTON') e.preventDefault();
        togglePrivacyMode();
        return;
      }

      // İşlemleri CSV Olarak Dışa Aktar Aksiyonu
      if (action === 'export-transactions' || btn.id === 'exportTxBtn') {
        e.preventDefault();
        if (window.Vaulty?.Views?.Transactions?.exportTransactionsCsv) {
          window.Vaulty.Views.Transactions.exportTransactionsCsv();
        } else if (window.exportTransactionsCsv) {
          window.exportTransactionsCsv();
        }
        return;
      }

      if (btn.id === 'backToDashBtn') {
        e.preventDefault();
        window.Vaulty?.Sidebar?.activateNavItem?.('dashboard');
        return;
      }

      if (btn.id === 'dashAllTxLink') {
        e.preventDefault();
        window.Vaulty?.Sidebar?.activateNavItem?.('transactions');
        return;
      }
    });
  }

  function init() {
    enforceInputHygiene();
    bindGlobalShortcuts();
    bindGlobalActionDelegation();
    restorePrivacyMode();
  }

  const Events = {
    init,
    enforceInputHygiene,
    bindGlobalShortcuts,
    bindGlobalActionDelegation,
    togglePrivacyMode,
    restorePrivacyMode,
  };

  window.Vaulty = window.Vaulty || {};
  window.Vaulty.Events = Events;
  window.togglePrivacyMode = togglePrivacyMode;
  window.bindGlobalEventListeners = init;
})();

