/**
 * Vaulty - Transfer Desk Modal Logic (Hesaplar Arası Hızlı Transfer Masası)
 * modals/transfer-modal.js
 *
 * Encapsulates:
 * 1. Fast Transfer Modal (#transferDeskDlg, #transferDeskForm)
 * 2. Swappable Source & Target accounts with live balance indicators
 * 3. Quick chips (+250, +500, +1.000, +2.500, Tüm Bakiye)
 * 4. Internal transfer transaction creation (type: 'Transfer') without income/expense contamination
 * 5. Full hard persistence into %APPDATA%\Vaulty\vault.json
 */

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  const State = window.Vaulty?.State;
  const ModalBase = window.Vaulty?.ModalBase || window.Vaulty?.Modal;
  const Modal = ModalBase;

  if (Modal?.mountModal) {
    Modal.mountModal('transferDeskDlg', `
<!-- =====================================================================
     MODAL: "HESAPLAR ARASI HIZLI TRANSFER MASASI" (#transferDeskDlg)
     ===================================================================== -->
<div id="transferDeskDlg" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="tdTitle" hidden style="display: none !important; pointer-events: none !important;">
  <div class="modal-box modal-box--transfer">
    <form id="transferDeskForm" class="modal-form--transfer" novalidate autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
      <!-- Modal Header -->
      <header class="td-modal-header">
        <div class="td-modal-titles">
          <div class="td-header-badge">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m7 16 5 5 5-5"/><path d="M12 21V3"/><path d="m17 8-5-5-5 5"/>
            </svg>
            <span>Dahili Virman &amp; Mahsup</span>
          </div>
          <h3 class="modal-box__title" id="tdTitle">Hesaplar Arası Para Transferi</h3>
          <p class="modal-box__sub">Banka, nakit ve kredi kartlarınız arasında bakiye aktarın veya borç kapatın</p>
        </div>
        <button type="button" class="modal-close-btn" id="closeTransferDeskIcon" data-action="close-modal" aria-label="Kapat" title="Kapat">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </header>

      <!-- Modal Body -->
      <div class="td-modal-body">
        <!-- Transfer Bridge Card (Kaynak, Takas Butonu, Hedef) -->
        <div class="td-bridge-card">
          <!-- Kaynak Blok -->
          <div class="td-account-block td-account-block--source">
            <div class="td-block-header">
              <span class="td-block-label">
                <span class="td-dot td-dot--source"></span>
                <span>Kaynak Hesap (Nereden Çekilecek)</span>
              </span>
              <span class="td-balance-pill mono" id="tdSourceBalPill">Bakiye: 0,00 ₺</span>
            </div>
            <div class="custom-select" id="tdSourceDropdown" data-select-target="tdSourceSelect">
              <select id="tdSourceSelect" class="sr" tabindex="-1" required></select>
              <button type="button" class="custom-select__trigger" id="tdSourceTrigger" aria-haspopup="listbox" aria-expanded="false">
                <span class="cso-left">
                  <span class="cso-name" id="tdSourceTriggerName">Kaynak Seçin</span>
                  <span class="cso-badge" id="tdSourceTriggerBadge"></span>
                </span>
                <span class="cso-right">
                  <span class="cso-balance mono" id="tdSourceTriggerBal"></span>
                  <svg class="custom-select__chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </button>
              <div class="custom-select__popover scroll" id="tdSourcePopover" role="listbox" hidden style="display: none !important; pointer-events: none !important;"></div>
            </div>
          </div>

          <!-- Dairesel Takas (Swap) Köprüsü -->
          <div class="td-swap-bridge">
            <div class="td-swap-line"></div>
            <button type="button" class="td-swap-btn" id="tdSwapBtn" title="Hesapları Yer Değiştir (Tersyüz Et)" aria-label="Kaynak ve hedefi yer değiştir">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4"/>
              </svg>
            </button>
            <div class="td-swap-line"></div>
          </div>

          <!-- Hedef Blok -->
          <div class="td-account-block td-account-block--target">
            <div class="td-block-header">
              <span class="td-block-label">
                <span class="td-dot td-dot--target"></span>
                <span>Hedef Hesap / Kart (Nereye Aktarılacak)</span>
              </span>
              <span class="td-balance-pill mono" id="tdTargetBalPill">Bakiye: 0,00 ₺</span>
            </div>
            <div class="custom-select" id="tdTargetDropdown" data-select-target="tdTargetSelect">
              <select id="tdTargetSelect" class="sr" tabindex="-1" required></select>
              <button type="button" class="custom-select__trigger" id="tdTargetTrigger" aria-haspopup="listbox" aria-expanded="false">
                <span class="cso-left">
                  <span class="cso-name" id="tdTargetTriggerName">Hedef Seçin</span>
                  <span class="cso-badge" id="tdTargetTriggerBadge"></span>
                </span>
                <span class="cso-right">
                  <span class="cso-balance mono" id="tdTargetTriggerBal"></span>
                  <svg class="custom-select__chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </button>
              <div class="custom-select__popover scroll" id="tdTargetPopover" role="listbox" hidden style="display: none !important; pointer-events: none !important;"></div>
            </div>
          </div>
        </div>

        <!-- Tutar Masası (Büyük Giriş & Hızlı Butonlar) -->
        <div class="td-amount-section">
          <label class="td-amount-label" for="tdAmountInput">Aktarılacak Tutar</label>
          <div class="td-amount-input-box">
            <input
              type="number"
              step="0.01"
              min="0.01"
              id="tdAmountInput"
              class="td-amount-input mono"
              placeholder="0,00"
              required
              autocomplete="off"
            >
            <span class="td-currency-symbol">₺</span>
          </div>

          <!-- Hızlı Seçim Butonları -->
          <div class="td-quick-chips">
            <button type="button" class="td-chip" data-add-amt="500">+500 ₺</button>
            <button type="button" class="td-chip" data-add-amt="1000">+1.000 ₺</button>
            <button type="button" class="td-chip td-chip--all" id="tdChipAll">Tüm Bakiye</button>
          </div>
          <p class="form-warning" id="tdOverdraftWarning" role="alert" hidden></p>
        </div>

        <!-- Opsiyonel Ekstra Alanlar (Tarih ve Açıklama) -->
        <div class="td-extra-grid">
          <div class="m-field">
            <label class="m-field__label" for="tdDateInput">İşlem Tarihi</label>
            <input type="date" id="tdDateInput" class="m-input mono" required>
          </div>
          <div class="m-field">
            <label class="m-field__label" for="tdDescInput">Açıklama (İsteğe Bağlı)</label>
            <input type="text" id="tdDescInput" class="m-input" placeholder="Örn: Nakit çekim / Kredi kartı ödemesi">
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <footer class="td-modal-footer">
        <button type="button" class="btn btn--secondary" id="cancelTransferDeskBtn" data-action="close-modal">Vazgeç</button>
        <button type="submit" class="btn btn--primary td-submit-btn" id="submitTransferDeskBtn">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m7 16 5 5 5-5"/><path d="M12 21V3"/><path d="m17 8-5-5-5 5"/>
          </svg>
          <span>Transferi Gerçekleştir</span>
        </button>
      </footer>
    </form>
  </div>
</div>
    `);
  }

  // --- Mantık ve Olay Yönetimi ---
  let isSwapping = false;

  function updateBalancePills() {
    const srcSelect = $('#tdSourceSelect');
    const targetSelect = $('#tdTargetSelect');
    const srcBalPill = $('#tdSourceBalPill');
    const targetBalPill = $('#tdTargetBalPill');

    const accounts = window.Vaulty?.State?.accounts || [];
    const srcAcc = accounts.find((a) => a.id === srcSelect?.value);
    const targetAcc = accounts.find((a) => a.id === targetSelect?.value);

    if (srcBalPill) {
      if (srcAcc) {
        if (srcAcc.type === 'credit') {
          const avail = Math.max(0, (srcAcc.limit || 0) - (srcAcc.debt || 0));
          srcBalPill.textContent = `Avans Limit: ${window.Vaulty.State.tryFmt(avail)}`;
        } else {
          srcBalPill.textContent = `Bakiye: ${window.Vaulty.State.tryFmt(srcAcc.balance || 0)}`;
        }
      } else {
        srcBalPill.textContent = 'Bakiye: 0,00 ₺';
      }
    }

    if (targetBalPill) {
      if (targetAcc) {
        if (targetAcc.type === 'credit') {
          targetBalPill.textContent = `Güncel Borç: ${window.Vaulty.State.tryFmt(targetAcc.debt || 0)}`;
        } else {
          targetBalPill.textContent = `Bakiye: ${window.Vaulty.State.tryFmt(targetAcc.balance || 0)}`;
        }
      } else {
        targetBalPill.textContent = 'Bakiye: 0,00 ₺';
      }
    }

    checkTransferOverdraft();
  }

  function checkTransferOverdraft() {
    const srcSelect = $('#tdSourceSelect');
    const amountInput = $('#tdAmountInput');
    const srcBalPill = $('#tdSourceBalPill');
    const warningEl = $('#tdOverdraftWarning');
    if (!srcSelect || !amountInput) return;

    const State = window.Vaulty?.State;
    const accounts = State?.accounts || [];
    const srcAcc = accounts.find((a) => a.id === srcSelect.value);
    const amt = State ? State.parseMoney(amountInput.value) : Number(amountInput.value) || 0;

    if (!srcAcc || amt <= 0) {
      if (warningEl) warningEl.hidden = true;
      if (srcBalPill) srcBalPill.classList.remove('td-balance-pill--overdraft');
      return;
    }

    let maxAvail = 0;
    if (srcAcc.type === 'credit') {
      maxAvail = Math.max(0, Number(srcAcc.limit || 0) - Number(srcAcc.debt || 0));
    } else {
      maxAvail = Math.max(0, Number(srcAcc.balance || 0));
    }

    const isOverdraft = amt > maxAvail + 0.005;
    if (srcBalPill) {
      srcBalPill.classList.toggle('td-balance-pill--overdraft', isOverdraft);
    }
    if (warningEl) {
      if (isOverdraft) {
        warningEl.textContent = `Yetersiz bakiye! Kaynak hesapta aktarılabilir kullanılabilir tutar: ${State ? State.tryFmt(maxAvail) : maxAvail + ' ₺'}`;
        warningEl.hidden = false;
      } else {
        warningEl.hidden = true;
      }
    }
  }

  function openTransferModal(preferredSourceId = null, preferredTargetId = null, prefillAmount = null) {
    const modalEl = $('#transferDeskDlg');
    if (!modalEl) return;

    const State = window.Vaulty?.State;
    if (!State) return;

    const accounts = State.accounts || [];
    if (accounts.length === 0) {
      State.showToast('Transfer yapabilmek için en az bir hesap eklemelisiniz.');
      return;
    }

    const srcDropdown = $('#tdSourceDropdown');
    const srcSelect = $('#tdSourceSelect');
    const targetDropdown = $('#tdTargetDropdown');
    const targetSelect = $('#tdTargetSelect');
    const amountInput = $('#tdAmountInput');
    const dateInput = $('#tdDateInput');
    const descInput = $('#tdDescInput');

    // 1. Kaynak ve Hedef Akıllı Belirleme
    let srcId = preferredSourceId;
    let targetId = preferredTargetId;

    if (!srcId && !targetId) {
      // Varsayılan: İlk vadesiz/nakit kaynak, varsa kredi kartı veya ikinci hesap hedef
      const liquid = accounts.find((a) => a.type === 'checking' || a.type === 'cash');
      const other = accounts.find((a) => a.id !== liquid?.id);
      srcId = liquid?.id || accounts[0]?.id;
      targetId = other?.id || accounts[0]?.id;
    } else if (targetId && !srcId) {
      // Hedef verilmiş (örn: kredi kartı rozetine tıklandı), kaynak likit hesaplardan seçilsin
      const liquid = accounts.find((a) => (a.type === 'checking' || a.type === 'cash') && a.id !== targetId);
      srcId = liquid?.id || accounts.find((a) => a.id !== targetId)?.id || accounts[0]?.id;
    } else if (srcId && !targetId) {
      const other = accounts.find((a) => a.id !== srcId);
      targetId = other?.id || accounts[0]?.id;
    }

    // 2. Özel Seçicileri Doldur
    const modalBase = window.Vaulty?.ModalBase || window.Vaulty?.Modal || ModalBase;
    const renderAccountDropdown = modalBase?.renderCustomAccountDropdown || window.renderCustomAccountDropdown;
    if (renderAccountDropdown) {
      renderAccountDropdown(srcDropdown, srcSelect, accounts, srcId);
      renderAccountDropdown(targetDropdown, targetSelect, accounts, targetId);
    }

    // 3. Tutar ve Alanları Sıfırla / Ön-doldur
    if (prefillAmount && Number(prefillAmount) > 0) {
      amountInput.value = State.round2(prefillAmount);
    } else {
      amountInput.value = '';
    }

    if (dateInput) {
      dateInput.value = new Date().toISOString().slice(0, 10);
    }

    if (descInput) {
      descInput.value = '';
    }

    updateBalancePills();

    // 4. Modalı Aç
    if (ModalBase?.openModal) {
      ModalBase.openModal(modalEl);
    } else {
      modalEl.hidden = false;
      modalEl.removeAttribute('hidden');
      modalEl.classList.add('is-open');
      modalEl.style.setProperty('display', 'flex', 'important');
    }

    setTimeout(() => {
      amountInput?.focus();
    }, 120);
  }

  function swapAccounts() {
    if (isSwapping) return;
    isSwapping = true;

    const swapBtn = $('#tdSwapBtn');
    if (swapBtn) {
      swapBtn.style.transform = 'rotate(180deg)';
      setTimeout(() => {
        swapBtn.style.transform = '';
        isSwapping = false;
      }, 250);
    }

    const srcSelect = $('#tdSourceSelect');
    const targetSelect = $('#tdTargetSelect');
    const srcDropdown = $('#tdSourceDropdown');
    const targetDropdown = $('#tdTargetDropdown');

    const oldSrc = srcSelect?.value;
    const oldTarget = targetSelect?.value;

    const State = window.Vaulty?.State;
    const modalBase = window.Vaulty?.ModalBase || window.Vaulty?.Modal || ModalBase;
    const renderAccountDropdown = modalBase?.renderCustomAccountDropdown || window.renderCustomAccountDropdown;

    if (State && renderAccountDropdown) {
      renderAccountDropdown(srcDropdown, srcSelect, State.accounts, oldTarget);
      renderAccountDropdown(targetDropdown, targetSelect, State.accounts, oldSrc);
    }

    updateBalancePills();
  }

  function initListeners() {
    const swapBtn = $('#tdSwapBtn');
    swapBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      swapAccounts();
    });

    $('#tdSourceSelect')?.addEventListener('change', updateBalancePills);
    $('#tdTargetSelect')?.addEventListener('change', updateBalancePills);
    $('#tdAmountInput')?.addEventListener('input', checkTransferOverdraft);

    // Hızlı Tutar Çipleri (+250, +500, +1000, +2500)
    $$('.td-chip[data-add-amt]').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        const addVal = Number(chip.dataset.addAmt) || 0;
        const input = $('#tdAmountInput');
        if (!input) return;
        const cur = Number(input.value) || 0;
        input.value = (cur + addVal).toFixed(2).replace(/\.00$/, '');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });

    // "Tüm Bakiye" Çipi
    $('#tdChipAll')?.addEventListener('click', (e) => {
      e.preventDefault();
      const input = $('#tdAmountInput');
      const srcId = $('#tdSourceSelect')?.value;
      const targetId = $('#tdTargetSelect')?.value;
      const State = window.Vaulty?.State;
      if (!input || !State) return;

      const srcAcc = State.getAccountById(srcId);
      const targetAcc = State.getAccountById(targetId);

      // Hedef kart ve borçlu ise, borcu kapatacak kadar veya kaynak bakiyesi kadar öner
      if (targetAcc && targetAcc.type === 'credit' && Number(targetAcc.debt || 0) > 0) {
        input.value = Number(targetAcc.debt).toFixed(2).replace(/\.00$/, '');
      } else if (srcAcc) {
        const bal = srcAcc.type === 'credit'
          ? Math.max(0, (srcAcc.limit || 0) - (srcAcc.debt || 0))
          : Math.max(0, srcAcc.balance || 0);
        input.value = Number(bal).toFixed(2).replace(/\.00$/, '');
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Form Gönderimi (Transfer Kaydı ve Çift Yönlü Kalıcı Senkronizasyon)
    const form = $('#transferDeskForm');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const State = window.Vaulty?.State;
      if (!State) return;

      const srcId = $('#tdSourceSelect')?.value;
      const targetId = $('#tdTargetSelect')?.value;
      const amountRaw = $('#tdAmountInput')?.value;
      const dateVal = $('#tdDateInput')?.value || new Date().toISOString().slice(0, 10);
      const descVal = ($('#tdDescInput')?.value || '').trim();

      const amt = State.round2(State.parseMoney(amountRaw));

      if (amt <= 0) {
        State.showToast('Lütfen geçerli bir transfer tutarı girin.');
        $('#tdAmountInput')?.focus();
        return;
      }

      if (!srcId || !targetId) {
        State.showToast('Lütfen kaynak ve hedef hesapları seçin.');
        return;
      }

      if (srcId === targetId) {
        State.showToast('Kaynak hesap ile hedef hesap aynı olamaz.');
        return;
      }

      const srcAcc = State.getAccountById(srcId);
      const targetAcc = State.getAccountById(targetId);

      if (!srcAcc || !targetAcc) {
        State.showToast('Seçilen hesap bilgisi bulunamadı.');
        return;
      }

      // Bakiye / Limit Aşım Kontrolü
      if (srcAcc.type !== 'credit') {
        const availBal = Number(srcAcc.balance || 0);
        if (amt > availBal + 0.005) {
          State.showToast(`Yetersiz bakiye! "${srcAcc.nickname}" hesabında aktarılabilir kullanılabilir tutar: ${State.tryFmt(availBal)}`);
          checkTransferOverdraft();
          $('#tdAmountInput')?.focus();
          return;
        }
      } else {
        const availCredit = Math.max(0, Number(srcAcc.limit || 0) - Number(srcAcc.debt || 0));
        if (amt > availCredit + 0.005) {
          State.showToast(`Yetersiz kart limiti! "${srcAcc.nickname}" kartında kullanılabilir avans limiti: ${State.tryFmt(availCredit)}`);
          checkTransferOverdraft();
          $('#tdAmountInput')?.focus();
          return;
        }
      }

      // Yedek durum (rollback güvencesi)
      const prevAccounts = JSON.parse(JSON.stringify(State.accounts));
      const prevTx = [...State.tx];

      try {
        // 1. Kaynak Hesaptan Düş
        if (srcAcc.type === 'credit') {
          // Kredi kartından nakit çekim / transfer (borç artar)
          srcAcc.debt = State.round2(Number(srcAcc.debt || 0) + amt);
        } else {
          srcAcc.balance = State.round2(Number(srcAcc.balance || 0) - amt);
        }

        // 2. Hedef Hesaba Ekle
        if (targetAcc.type === 'credit') {
          // Kredi kartına aktarım (borç kapanır)
          targetAcc.debt = Math.max(0, State.round2(Number(targetAcc.debt || 0) - amt));
        } else {
          targetAcc.balance = State.round2(Number(targetAcc.balance || 0) + amt);
        }

        // 3. Dahili Transfer İşlemini Oluştur (type: 'Transfer')
        const txDesc = descVal || `Transfer: ${srcAcc.nickname} → ${targetAcc.nickname}`;
        const newTx = {
          id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          date: dateVal,
          desc: txDesc,
          cat: 'Transfer',
          type: 'Transfer',
          status: 'Ödendi',
          amount: amt,
          accountId: targetAcc.id,       // Hedef Hesap
          sourceAccountId: srcAcc.id,   // Kaynak Hesap
          isRecurring: false,
        };

        State.tx.unshift(newTx);

        // 4. Hard Persistence: %APPDATA%\Vaulty\vault.json diske yaz
        const okAcc = window.vaultStore.set('vaultAccounts', State.accounts);
        const okTx = window.vaultStore.set('transactionsTr', State.tx);

        if (!okAcc || !okTx) {
          throw new Error('Diske (%APPDATA%\\Vaulty\\vault.json) yazma başarısız oldu.');
        }

        // 5. Olayları ve Bildirimi Yayınla
        State.emit('accounts:changed', State.accounts);
        State.emit('transactions:changed', State.tx);

        const ModalBase = window.Vaulty?.ModalBase || window.Vaulty?.Modal;
        if (ModalBase?.closeModal) {
          ModalBase.closeModal($('#transferDeskDlg'));
        } else {
          const dlg = $('#transferDeskDlg');
          if (dlg) dlg.hidden = true;
        }

        State.showToast(`${State.tryFmt(amt)} transferi başarıyla tamamlandı.`);
      } catch (err) {
        // Rollback
        State.accounts = prevAccounts;
        State.tx = prevTx;
        State.showToast(`Hata: Transfer tamamlanamadı! ${err.message || ''}`);
        console.error('transferDesk submission error:', err);
      }
    });
  }

  // DOM hazır olduğunda dinleyicileri bağla
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initListeners);
  } else {
    initListeners();
  }

  const TransferModal = {
    openTransferModal,
    swapAccounts,
    updateBalancePills,
  };

  window.Vaulty = window.Vaulty || {};
  window.Vaulty.Modals = window.Vaulty.Modals || {};
  window.Vaulty.Modals.TransferModal = TransferModal;
  window.openTransferModal = openTransferModal;
})();

