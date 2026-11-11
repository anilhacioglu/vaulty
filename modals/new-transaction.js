/* =========================================================================
   VAULTY MODAL: NEW TRANSACTION (Yeni İşlem, Harcama & Tahsilat Girişi)
   ========================================================================= */
(() => {
  const { State } = window.Vaulty;
  const { esc, tryFmt, round2, parseMoney } = State;
  const { mountModal, openModal, closeModal, renderCustomAccountDropdown, renderCustomCategoryDropdown } = window.Vaulty.ModalBase;

  mountModal('addTxDlg', `
<!-- =====================================================================
     MODAL 2: "+ YENİ İŞLEM / HARCAMA EKLE" (640px Genişlik, Özel Açılır Popover)
     ===================================================================== -->
<div id="addTxDlg" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="txModalTitle" hidden style="display: none !important; pointer-events: none !important;">
  <div class="modal-box modal-box--tx">
    <form id="addTxForm" class="modal-form modal-form--tx" novalidate autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
      <input type="hidden" id="editingTxId" value="">
      <header class="tx-modal-header">
        <div class="modal-box__titles">
          <h3 class="modal-box__title" id="txModalTitle">Yeni İşlem veya Harcama Kaydet</h3>
          <p class="modal-box__sub" id="txModalSub">Seçilen hesap bakiyesi veya kredi kartı borcu otomatik güncellenir</p>
        </div>
        <button type="button" class="modal-close-btn" id="closeAddTxIcon" data-action="close-modal" aria-label="Kapat" title="Kapat">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </header>

      <div class="tx-modal-body">
        <!-- İşlem Türü Seçici (3 Sütunlu Toggle, 46px Yükseklik, 10px Radius) -->
        <div class="tx-type-group" role="radiogroup" aria-label="İşlem Türü Seçimi">
          <button type="button" class="tx-type-card is-selected" data-tx-type="Gider" role="radio" aria-checked="true">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 5v14M19 12l-7 7-7-7"/>
            </svg>
            <span>Gider / Harcama</span>
          </button>
          <button type="button" class="tx-type-card" data-tx-type="Gelir" role="radio" aria-checked="false">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 19V5M5 12l7-7 7 7"/>
            </svg>
            <span>Gelir / Tahsilat</span>
          </button>
          <button type="button" class="tx-type-card" data-tx-type="Kart Borcu Ödeme" role="radio" aria-checked="false">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <path d="M2 10h20M6 15h4"/>
            </svg>
            <span>Kart Borcu Ödeme</span>
          </button>
        </div>

        <div class="modal-stack">
          <!-- Ödeme Yöntemi / Hesap Özel Popover Seçici -->
          <div class="m-field">
            <span class="m-field__label" id="txAccountLabel">Ödeme Yöntemi / Hesap</span>
            <div class="custom-select" id="txAccountDropdown" data-select-target="txAccountSelect">
              <select id="txAccountSelect" class="sr" tabindex="-1" required></select>
              <button type="button" class="custom-select__trigger" id="txAccountTrigger" aria-haspopup="listbox" aria-expanded="false">
                <span class="cso-left">
                  <span class="cso-name">Hesap Seçin</span>
                  <span class="cso-badge"></span>
                </span>
                <span class="cso-right">
                  <span class="cso-balance mono"></span>
                  <svg class="custom-select__chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </button>
              <div class="custom-select__popover scroll" id="txAccountPopover" role="listbox" hidden style="display: none !important; pointer-events: none !important;"></div>
            </div>
          </div>

          <!-- Kart Borcu Ödeme Seçildiğinde Ödemenin Çekildiği Banka/Nakit Hesabı -->
          <div class="dynamic-group" id="txSourceAccountWrap" hidden>
            <div class="m-field">
              <span class="m-field__label">Ödemenin Çekildiği Banka / Nakit Hesabı</span>
              <div class="custom-select" id="txSourceAccountDropdown" data-select-target="txSourceAccountSelect">
                <select id="txSourceAccountSelect" class="sr" tabindex="-1"></select>
                <button type="button" class="custom-select__trigger" id="txSourceAccountTrigger" aria-haspopup="listbox" aria-expanded="false">
                  <span class="cso-left">
                    <span class="cso-name">Kaynak Hesap Seçin</span>
                    <span class="cso-badge"></span>
                  </span>
                  <span class="cso-right">
                    <span class="cso-balance mono"></span>
                    <svg class="custom-select__chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                  </span>
                </button>
                <div class="custom-select__popover scroll" id="txSourceAccountPopover" role="listbox" hidden style="display: none !important; pointer-events: none !important;"></div>
              </div>
            </div>
          </div>

          <label class="m-field">
            <span class="m-field__label">İşlem / Harcama Açıklaması</span>
            <input id="txDescInput" name="tx_memo_note" type="text" class="m-input" placeholder="Örn: Macrocenter Market Alışverişi" required autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
          </label>

          <!-- Tutar (%60 Genişlik, Kalın Tabular + Para Birimi Soneki) & Tarih (%40 Genişlik, Sağda Tek Takvim İkonlu) -->
          <div class="tx-amount-date-row">
            <label class="m-field">
              <span class="m-field__label">Tutar</span>
              <div class="tx-input-wrap">
                <input id="txAmountInput" name="tx_amt_val" type="text" inputmode="decimal" placeholder="1.250,00" class="m-input tx-amount-field mono" required autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
                <span class="tx-currency-suffix mono" aria-hidden="true">₺</span>
              </div>
            </label>
            <label class="m-field">
              <span class="m-field__label">İşlem Tarihi</span>
              <div class="tx-input-wrap tx-date-wrap">
                <input id="txDateInput" name="tx_date_val" type="date" class="m-input tx-date-field mono" required autocomplete="off">
                <svg class="tx-date-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
            </label>
          </div>

          <div class="m-field">
            <span class="m-field__label">Kategori</span>
            <div class="custom-select" id="txCategoryDropdown" data-select-target="txCategorySelect">
              <select id="txCategorySelect" class="sr" tabindex="-1">
                <option value="Market">Market</option>
                <option value="Restoran & Kafe">Restoran &amp; Kafe</option>
                <option value="Ulaşım & Akaryakıt">Ulaşım &amp; Akaryakıt</option>
                <option value="Teknoloji">Teknoloji</option>
                <option value="Yazılım & Abonelik">Yazılım &amp; Abonelik</option>
                <option value="Faturalar">Faturalar</option>
                <option value="Konut & Kira">Konut &amp; Kira</option>
                <option value="Seyahat">Seyahat</option>
                <option value="Sağlık">Sağlık</option>
                <option value="Maaş Geliri">Maaş Geliri</option>
                <option value="Serbest Gelir">Serbest Gelir</option>
                <option value="Yatırım">Yatırım</option>
                <option value="Kart Borcu Ödeme">Kart Borcu Ödeme</option>
                <option value="Diğer">Diğer</option>
              </select>
              <button type="button" class="custom-select__trigger" id="txCategoryTrigger" aria-haspopup="listbox" aria-expanded="false">
                <span class="cso-left">
                  <span class="cso-name">Market</span>
                  <span class="cso-badge">Harcama Kategorisi</span>
                </span>
                <span class="cso-right">
                  <svg class="custom-select__chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </button>
              <div class="custom-select__popover scroll" id="txCategoryPopover" role="listbox" hidden style="display: none !important; pointer-events: none !important;"></div>
            </div>
          </div>

          <!-- Canlı Etki Önizlemesi (Kart Borcu / Bakiye Değişimi) -->
          <div class="tx-live-preview" id="txLivePreview"></div>

          <!-- Tekrarlayan İşlem / Abonelik Ayarları -->
          <div class="recurring-toggle-box" id="recurringToggleBox">
            <div class="recurring-toggle-header">
              <div class="recurring-toggle-label-wrap">
                <div class="recurring-icon-badge" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                  </svg>
                </div>
                <div>
                  <span class="recurring-toggle-title">Bu işlemi düzenli tekrar et</span>
                  <span class="recurring-toggle-desc">Abonelik, kira veya sabit fatura olarak takip edin</span>
                </div>
              </div>
              <label class="switch-control" for="txRecurringToggle" aria-label="Bu işlemi düzenli tekrar et">
                <input type="checkbox" id="txRecurringToggle" class="switch-input">
                <span class="switch-slider"></span>
              </label>
            </div>

            <!-- Slide-down Panel -->
            <div class="recurring-settings-panel" id="txRecurringPanel" hidden>
              <!-- Periyot Seçimi (Segmented) -->
              <div class="rec-field-group">
                <label class="rec-field-label">Tekrar Sıklığı</label>
                <div class="rec-seg-control" id="recIntervalSeg" role="radiogroup" aria-label="Tekrar sıklığı">
                  <button type="button" class="rec-seg-btn is-active" data-interval="monthly" role="radio" aria-checked="true">Aylık</button>
                  <button type="button" class="rec-seg-btn" data-interval="weekly" role="radio" aria-checked="false">Haftalık</button>
                  <button type="button" class="rec-seg-btn" data-interval="yearly" role="radio" aria-checked="false">Yıllık</button>
                </div>
                <input type="hidden" id="txRecurringInterval" value="monthly">
              </div>

              <!-- Tekrar Günü & İsteğe Bağlı Bitiş Tarihi -->
              <div class="rec-fields-row">
                <div class="rec-field-col" id="recDayCol">
                  <label class="rec-field-label" id="recDayLabel" for="txRecurringDay">Tekrar Günü</label>
                  <div class="rec-input-wrap">
                    <span class="rec-input-prefix">Her ayın</span>
                    <input type="number" id="txRecurringDay" class="rec-num-input mono" min="1" max="31" value="1">
                    <span class="rec-input-suffix">. günü</span>
                  </div>
                </div>

                <div class="rec-field-col">
                  <label class="rec-field-label" for="txRecurringEndDate">Bitiş Tarihi (İsteğe Bağlı)</label>
                  <input type="date" id="txRecurringEndDate" class="rec-date-input">
                </div>
              </div>

              <!-- Canlı Sonraki Vade Bilgisi -->
              <div class="rec-preview-strip" id="recNextDuePreview">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>İlk sonraki onay tarihi: <strong id="recNextDueText" class="mono">-</strong></span>
              </div>
            </div>
          </div>

          <!-- Taksitli İşlem Ayarları (Yalnızca Kredi Kartı Giderlerinde Görünür) -->
          <div class="installment-toggle-box" id="installmentToggleBox" hidden style="display: none;">
            <div class="installment-toggle-header">
              <div class="installment-toggle-label-wrap">
                <div class="installment-icon-badge" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2"/>
                    <line x1="2" y1="10" x2="22" y2="10"/>
                  </svg>
                </div>
                <div>
                  <span class="installment-toggle-title">Taksitli Alışveriş Olarak Kaydet</span>
                  <span class="installment-toggle-desc">Kart limitinden toplamı düşer, ekstre ve takvime aylık taksitleri dağıtır</span>
                </div>
              </div>
              <label class="switch-control" for="txInstallmentToggle" aria-label="Taksitli işlem olarak kaydet">
                <input type="checkbox" id="txInstallmentToggle" class="switch-input">
                <span class="switch-slider"></span>
              </label>
            </div>

            <!-- Slide-down Panel -->
            <div class="installment-settings-panel" id="txInstallmentPanel" hidden>
              <!-- Taksit Sayısı Hızlı Seçicisi (Segmented) -->
              <div class="inst-field-group">
                <label class="inst-field-label">Taksit Sayısı</label>
                <div class="inst-seg-control" id="instCountSeg" role="radiogroup" aria-label="Taksit sayısı">
                  <button type="button" class="inst-seg-btn" data-count="2" role="radio" aria-checked="false">2 Taksit</button>
                  <button type="button" class="inst-seg-btn is-active" data-count="3" role="radio" aria-checked="true">3 Taksit</button>
                  <button type="button" class="inst-seg-btn" data-count="6" role="radio" aria-checked="false">6 Taksit</button>
                  <button type="button" class="inst-seg-btn" data-count="9" role="radio" aria-checked="false">9 Taksit</button>
                  <button type="button" class="inst-seg-btn" data-count="12" role="radio" aria-checked="false">12 Taksit</button>
                </div>
                <input type="hidden" id="txInstallmentCount" value="3">
              </div>

              <!-- Canlı Hesaplama Özeti -->
              <div class="inst-calc-summary" id="instCalcSummary">
                <div class="inst-calc-row">
                  <span class="inst-calc-label">Karttan Bloke Edilecek Tutar:</span>
                  <span class="inst-calc-val mono" id="instTotalSummary">0,00 ₺</span>
                </div>
                <div class="inst-calc-row inst-calc-row--highlight">
                  <span class="inst-calc-label">Aylık Yansıyacak Taksit:</span>
                  <span class="inst-calc-val mono" id="instMonthlySummary">0,00 ₺ / ay</span>
                </div>
                <div class="inst-schedule-note" id="instScheduleNote">
                  1. taksit işlem tarihinde ödendi görünecek, kalan taksitler sonraki ayların ekstre günlerine planlanacaktır.
                </div>
              </div>
            </div>
          </div>
        </div>

        <p class="form-error" id="txFormError" role="alert" hidden></p>
      </div>

      <footer class="tx-modal-footer">
        <button type="button" class="tx-cancel-btn" id="cancelAddTxBtn" data-action="close-modal">Vazgeç</button>
        <button type="submit" class="tx-submit-btn" id="submitAddTxBtn">İşlemi Kaydet</button>
      </footer>
    </form>
  </div>
</div>
`);

  const addTxDlg = document.getElementById('addTxDlg');
  const addTxForm = document.getElementById('addTxForm');
  const txDescInput = document.getElementById('txDescInput');
  const txAmountInput = document.getElementById('txAmountInput');
  const txDateInput = document.getElementById('txDateInput');
  const txCategorySelect = document.getElementById('txCategorySelect');
  const txAccountSelect = document.getElementById('txAccountSelect');
  const txSourceAccountSelect = document.getElementById('txSourceAccountSelect');
  const txSourceAccountWrap = document.getElementById('txSourceAccountWrap');
  const txLivePreview = document.getElementById('txLivePreview');
  const txFormError = document.getElementById('txFormError');
  const editingTxIdInput = document.getElementById('editingTxId');

  function populateTxAccountDropdowns(preferredAccId = null) {
    const prevVal = preferredAccId || txAccountSelect?.value || State.selectedAccountId;
    const isCardPayment = State.modalTxType === 'Kart Borcu Ödeme';

    const targetList = isCardPayment
      ? State.accounts.filter((a) => a.type === 'credit')
      : State.accounts;

    renderCustomAccountDropdown(
      document.getElementById('txAccountDropdown'),
      txAccountSelect,
      targetList,
      prevVal
    );

    const liquidList = State.accounts.filter((a) => a.type === 'checking' || a.type === 'cash');
    renderCustomAccountDropdown(
      document.getElementById('txSourceAccountDropdown'),
      txSourceAccountSelect,
      liquidList,
      txSourceAccountSelect?.value || liquidList[0]?.id,
      [{ value: 'external', name: 'Harici Kaynak', badge: '', balance: 'Kasa Dışı' }]
    );

    renderCustomCategoryDropdown();
    updateTxLivePreview();
  }

  function setModalTxType(type, preferredAccId = null) {
    if (type === 'Kart Borcu Ödeme') {
      closeModal(addTxDlg);
      if (window.Vaulty.Modals?.DebtPayDesk?.openPayCardDebtModal) {
        window.Vaulty.Modals.DebtPayDesk.openPayCardDebtModal(preferredAccId);
      }
      return;
    }
    State.modalTxType = type;
    document.querySelectorAll('.tx-type-card').forEach((card) => {
      const on = card.dataset.txType === type;
      card.classList.toggle('is-selected', on);
      card.setAttribute('aria-checked', String(on));
    });

    const isCardPay = type === 'Kart Borcu Ödeme';
    const acctLbl = document.getElementById('txAccountLabel');
    if (acctLbl) {
      acctLbl.textContent = isCardPay ? 'Borcu Ödenecek Kredi Kartı' : 'Ödeme Yöntemi / Hesap';
    }
    if (txSourceAccountWrap) txSourceAccountWrap.hidden = !isCardPay;

    if (isCardPay) {
      if (txCategorySelect) txCategorySelect.value = 'Kart Borcu Ödeme';
      if (txDescInput && (!txDescInput.value || txDescInput.value.includes('Harcama'))) {
        txDescInput.placeholder = 'Örn: Dönem Borcu / Ekstre Ödemesi';
      }
    } else if (type === 'Gelir') {
      if (txCategorySelect && (txCategorySelect.value === 'Kart Borcu Ödeme' || txCategorySelect.value === 'Market')) {
        txCategorySelect.value = 'Maaş Geliri';
      }
      if (txDescInput) txDescInput.placeholder = 'Örn: Maaş veya Danışmanlık Tahsilatı';
    } else {
      if (txCategorySelect && (txCategorySelect.value === 'Kart Borcu Ödeme' || txCategorySelect.value === 'Maaş Geliri')) {
        txCategorySelect.value = 'Market';
      }
      if (txDescInput) txDescInput.placeholder = 'Örn: Macrocenter Market Alışverişi';
    }

    populateTxAccountDropdowns(preferredAccId);
  }

  function updateTxLivePreview() {
    updateInstallmentVisibility();
    if (!txLivePreview || !txAccountSelect) return;
    const acc = State.getAccountById(txAccountSelect.value);
    const amt = Math.max(0, parseMoney(txAmountInput?.value || '0'));

    if (!acc) {
      txLivePreview.innerHTML = `<span>Lütfen işlem yapılacak bir hesap veya kart seçin.</span>`;
      return;
    }

    if (State.modalTxType === 'Kart Borcu Ödeme') {
      const oldDebt = Number(acc.debt || 0);
      const newDebt = Math.max(0, round2(oldDebt - amt));
      const limit = Number(acc.limit || 1);
      const newPct = Math.min(100, Math.round((newDebt / limit) * 100));
      txLivePreview.innerHTML = `
        <span><strong>${esc(acc.nickname)}</strong> Güncel Borç: <span class="mono">${tryFmt(oldDebt)} → <strong>${tryFmt(newDebt)}</strong></span></span>
        <span class="mono" style="color:var(--ink-green);font-weight:600">Yeni Doluluk: %${newPct}</span>
      `;
      return;
    }

    if (acc.type === 'credit') {
      const oldDebt = Number(acc.debt || 0);
      const newDebt = State.modalTxType === 'Gider' ? round2(oldDebt + amt) : Math.max(0, round2(oldDebt - amt));
      const limit = Number(acc.limit || 1);
      const newPct = Math.min(100, Math.round((newDebt / limit) * 100));
      txLivePreview.innerHTML = `
        <span><strong>${esc(acc.nickname)}</strong> Kart Borcu: <span class="mono">${tryFmt(oldDebt)} → <strong>${tryFmt(newDebt)}</strong></span></span>
        <span class="mono" style="color:${State.modalTxType === 'Gider' ? '#E11D48' : '#059669'};font-weight:600">Limit Doluluğu: %${newPct}</span>
      `;
    } else {
      const oldBal = Number(acc.balance || 0);
      const newBal = State.modalTxType === 'Gelir' ? round2(oldBal + amt) : round2(oldBal - amt);
      txLivePreview.innerHTML = `
        <span><strong>${esc(acc.nickname)}</strong> Bakiye: <span class="mono">${tryFmt(oldBal)} → <strong>${tryFmt(newBal)}</strong></span></span>
        <span class="mono" style="color:${State.modalTxType === 'Gelir' ? '#059669' : '#64748B'};font-weight:600">${State.modalTxType === 'Gelir' ? '+Tahsilat' : '−Harcama'}</span>
      `;
    }
  }

  function revertTransactionFromAccounts(t) {
    if (State.revertTransactionFromAccounts) {
      return State.revertTransactionFromAccounts(t);
    }
    if (!t || !t.accountId) return;
    const acc = State.getAccountById(t.accountId);
    const amt = round2(parseMoney(t.amount || 0));
    if (!acc || amt <= 0) return;

    if (t.type === 'Transfer' || String(t.type).toLowerCase() === 'transfer') {
      if (acc.type === 'credit') {
        acc.debt = round2(Number(acc.debt || 0) + amt);
      } else {
        acc.balance = round2(Number(acc.balance || 0) - amt);
      }
      if (t.sourceAccountId) {
        const srcAcc = State.getAccountById(t.sourceAccountId);
        if (srcAcc) {
          if (srcAcc.type === 'credit') {
            srcAcc.debt = Math.max(0, round2(Number(srcAcc.debt || 0) - amt));
          } else {
            srcAcc.balance = round2(Number(srcAcc.balance || 0) + amt);
          }
        }
      }
    } else if (t.type === 'Kart Borcu Ödeme') {
      acc.debt = round2(Number(acc.debt || 0) + amt);
      if (t.sourceAccountId && t.sourceAccountId !== 'external') {
        const srcAcc = State.getAccountById(t.sourceAccountId);
        if (srcAcc) {
          srcAcc.balance = round2(Number(srcAcc.balance || 0) + amt);
        }
      }
    } else if (acc.type === 'credit') {
      if (t.type === 'Gider') {
        acc.debt = Math.max(0, round2(Number(acc.debt || 0) - amt));
      } else {
        acc.debt = round2(Number(acc.debt || 0) + amt);
      }
    } else {
      if (t.type === 'Gelir') {
        acc.balance = round2(Number(acc.balance || 0) - amt);
      } else {
        acc.balance = round2(Number(acc.balance || 0) + amt);
      }
    }
  }

  function updateRecurringPreview() {
    const textEl = document.getElementById('recNextDueText');
    const dayInput = document.getElementById('txRecurringDay');
    const intervalInput = document.getElementById('txRecurringInterval');
    const RE = window.Vaulty?.RecurringEngine;
    if (!textEl || !RE) return;

    const baseDate = txDateInput?.value || new Date().toISOString().slice(0, 10);
    const interval = intervalInput?.value || 'monthly';
    const day = Number(dayInput?.value) || (baseDate ? new Date(baseDate).getDate() : 1);

    const nextDate = RE.calculateNextDueDate(baseDate, interval, day);
    textEl.textContent = RE.formatDateTr(nextDate);
  }

  function setRecurringInterval(interval) {
    const intervalInput = document.getElementById('txRecurringInterval');
    if (intervalInput) intervalInput.value = interval;

    const instToggle = document.getElementById('txInstallmentToggle');
    const instPanel = document.getElementById('txInstallmentPanel');
    if (instToggle && instPanel) {
      instToggle.addEventListener('change', () => {
        if (instToggle.checked) {
          instPanel.hidden = false;
          requestAnimationFrame(() => instPanel.classList.add('is-open'));
          updateInstallmentCalculation();
        } else {
          instPanel.classList.remove('is-open');
          setTimeout(() => {
            if (!instToggle.checked) instPanel.hidden = true;
          }, 250);
        }
      });
    }

    document.querySelectorAll('.inst-seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        setInstallmentCount(Number(btn.dataset.count) || 3);
      });
    });

    txAmountInput?.addEventListener('input', () => {
      updateInstallmentCalculation();
    });

    txDateInput?.addEventListener('change', () => {
      updateInstallmentCalculation();
    });

    document.querySelectorAll('.rec-seg-btn').forEach((btn) => {
      const active = btn.dataset.interval === interval;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-checked', String(active));
    });

    const dayLabel = document.getElementById('recDayLabel');
    const prefixEl = document.querySelector('.rec-input-prefix');
    const suffixEl = document.querySelector('.rec-input-suffix');

    if (interval === 'weekly') {
      if (prefixEl) prefixEl.textContent = 'Her';
      if (suffixEl) suffixEl.textContent = '. gün';
      if (dayLabel) dayLabel.textContent = 'Haftalık Tekrar Günü';
    } else if (interval === 'yearly') {
      if (prefixEl) prefixEl.textContent = 'Yılda bir';
      if (suffixEl) suffixEl.textContent = '. gün';
      if (dayLabel) dayLabel.textContent = 'Yıllık Periyot Günü';
    } else {
      if (prefixEl) prefixEl.textContent = 'Her ayın';
      if (suffixEl) suffixEl.textContent = '. günü';
      if (dayLabel) dayLabel.textContent = 'Tekrar Günü';
    }

    updateRecurringPreview();
  }

  function updateInstallmentCalculation() {
    const totalEl = document.getElementById('instTotalSummary');
    const monthlyEl = document.getElementById('instMonthlySummary');
    const noteEl = document.getElementById('instScheduleNote');
    const amtInp = document.getElementById('txAmountInput');
    const countInp = document.getElementById('txInstallmentCount');
    const dateInp = document.getElementById('txDateInput');
    if (!totalEl || !monthlyEl) return;

    const total = Math.max(0, parseMoney(amtInp?.value || '0'));
    const count = Math.max(2, parseInt(countInp?.value || '3', 10));
    const monthly = round2(total / count);

    totalEl.textContent = tryFmt(total);
    monthlyEl.textContent = `${tryFmt(monthly)} / ay`;

    if (noteEl) {
      const dateVal = dateInp?.value || new Date().toISOString().slice(0, 10);
      noteEl.textContent = `1. taksit ${dateVal} tarihinde yansıyacak, kalan ${count - 1} taksit sonraki aylara planlanacaktır.`;
    }
  }

  function setInstallmentCount(count) {
    const countInp = document.getElementById('txInstallmentCount');
    if (countInp) countInp.value = count;
    document.querySelectorAll('.inst-seg-btn').forEach((btn) => {
      const active = Number(btn.dataset.count) === Number(count);
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-checked', String(active));
    });
    updateInstallmentCalculation();
  }

  function updateInstallmentVisibility() {
    const acc = State.getAccountById(txAccountSelect?.value);
    const isCreditExpense = Boolean(acc && acc.type === 'credit' && State.modalTxType === 'Gider');
    const instBox = document.getElementById('installmentToggleBox');
    const recBox = document.getElementById('recurringToggleBox');

    if (instBox) {
      if (isCreditExpense) {
        instBox.style.display = 'block';
        instBox.hidden = false;
      } else {
        instBox.style.display = 'none';
        instBox.hidden = true;
        const instToggle = document.getElementById('txInstallmentToggle');
        if (instToggle) instToggle.checked = false;
        const instPanel = document.getElementById('txInstallmentPanel');
        if (instPanel) {
          instPanel.classList.remove('is-open');
          instPanel.hidden = true;
        }
      }
    }

    if (recBox) {
      if (State.modalTxType === 'Kart Borcu Ödeme') {
        recBox.style.display = 'none';
        recBox.hidden = true;
        const recToggle = document.getElementById('txRecurringToggle');
        if (recToggle) recToggle.checked = false;
        const recPanel = document.getElementById('txRecurringPanel');
        if (recPanel) {
          recPanel.classList.remove('is-open');
          recPanel.hidden = true;
        }
      } else {
        recBox.style.display = 'block';
        recBox.hidden = false;
      }
    }

    updateInstallmentCalculation();
  }

  function openNewTransactionModal(defaultType = 'Gider', preferredAccId = null) {
    if (defaultType === 'Kart Borcu Ödeme') {
      if (window.Vaulty.Modals?.DebtPayDesk?.openPayCardDebtModal) {
        window.Vaulty.Modals.DebtPayDesk.openPayCardDebtModal(preferredAccId);
      }
      return;
    }
    addTxForm?.reset();
    if (editingTxIdInput) editingTxIdInput.value = '';
    const titleEl = document.getElementById('txModalTitle');
    if (titleEl) titleEl.textContent = 'Yeni İşlem veya Harcama Kaydet';
    const subTitleEl = document.getElementById('txModalSub');
    if (subTitleEl) subTitleEl.textContent = 'Seçilen hesap bakiyesi veya kredi kartı borcu otomatik güncellenir';
    const btnEl = document.getElementById('submitAddTxBtn');
    if (btnEl) btnEl.textContent = 'İşlemi Kaydet';
    if (txFormError) txFormError.hidden = true;
    if (txDateInput) txDateInput.value = new Date().toISOString().slice(0, 10);

    // Tekrarlayan panel sıfırlama
    const toggle = document.getElementById('txRecurringToggle');
    const panel = document.getElementById('txRecurringPanel');
    if (toggle) toggle.checked = false;
    if (panel) {
      panel.classList.remove('is-open');
      panel.hidden = true;
    }
    setRecurringInterval('monthly');
    const instToggle = document.getElementById('txInstallmentToggle');
    const instPanel = document.getElementById('txInstallmentPanel');
    if (instToggle) instToggle.checked = false;
    if (instPanel) {
      instPanel.classList.remove('is-open');
      instPanel.hidden = true;
    }
    setInstallmentCount(3);
    const dayInput = document.getElementById('txRecurringDay');
    if (dayInput) dayInput.value = new Date().getDate();
    const endInput = document.getElementById('txRecurringEndDate');
    if (endInput) endInput.value = '';
    updateRecurringPreview();

    setModalTxType(defaultType, preferredAccId || State.selectedAccountId);
    openModal(addTxDlg);
    setTimeout(() => txDescInput?.focus(), 40);
  }

  function startEditTransaction(txId) {
    const target = State.tx.find((item) => item.id === txId);
    if (!target) return;

    if (target.type === 'Transfer' || String(target.type).toLowerCase() === 'transfer') {
      if (window.Vaulty.Modals?.TransferModal?.openTransferModal) {
        window.Vaulty.Modals.TransferModal.openTransferModal(target.sourceAccountId, target.accountId, target.amount);
      } else if (window.openTransferModal) {
        window.openTransferModal(target.sourceAccountId, target.accountId, target.amount);
      }
      return;
    }

    addTxForm?.reset();
    if (txFormError) txFormError.hidden = true;
    const titleEl = document.getElementById('txModalTitle');
    const subTitleEl = document.getElementById('txModalSub');
    const btnEl = document.getElementById('submitAddTxBtn');
    if (btnEl) btnEl.textContent = 'Değişiklikleri Kaydet';

    const isInst = Boolean(target.isInstallment && target.installment && target.installment.groupId);
    const instToggle = document.getElementById('txInstallmentToggle');
    const instPanel = document.getElementById('txInstallmentPanel');
    const recToggle = document.getElementById('txRecurringToggle');
    const recPanel = document.getElementById('txRecurringPanel');

    if (isInst) {
      const groupId = target.installment.groupId;
      const group = State.tx.filter((x) => x && x.installment?.groupId === groupId);
      const firstTx = group.find((x) => x.installment?.currentInstallment === 1) || group[0] || target;
      
      const cleanDesc = (firstTx.desc || target.desc || '').replace(/\s*\(\d+\/\d+\)$/, '').replace(/\s*\(\d+\s*Taksit\)$/, '').trim();
      const totalAmount = Number(firstTx.installment?.totalAmount || target.installment?.totalAmount || (target.amount * (target.installment?.totalInstallments || 1)));
      const totalInst = Number(firstTx.installment?.totalInstallments || target.installment?.totalInstallments || group.length || 3);
      const baseDate = firstTx.date || target.date || new Date().toISOString().slice(0, 10);

      if (editingTxIdInput) editingTxIdInput.value = 'instgrp:' + groupId;
      if (titleEl) titleEl.textContent = 'Taksitli Harcamayı Düzenle';
      if (subTitleEl) subTitleEl.textContent = `Toplam ${totalInst} taksitli işlem. Yapılan değişiklikler tüm taksitlere ve kart borcuna yansıtılır.`;

      if (txDescInput) txDescInput.value = cleanDesc;
      if (txAmountInput) txAmountInput.value = totalAmount;
      if (txDateInput) txDateInput.value = baseDate;

      setModalTxType('Gider', firstTx.accountId);
      if (firstTx.cat && txCategorySelect && Array.from(txCategorySelect.options).some((o) => o.value === firstTx.cat)) {
        txCategorySelect.value = firstTx.cat;
        renderCustomCategoryDropdown();
      }

      // Taksit panelini aç ve adedi ayarla
      if (instToggle) instToggle.checked = true;
      if (instPanel) {
        instPanel.hidden = false;
        requestAnimationFrame(() => instPanel.classList.add('is-open'));
      }
      setInstallmentCount(totalInst);

      // Tekrarlayan panelini kapat
      if (recToggle) recToggle.checked = false;
      if (recPanel) {
        recPanel.classList.remove('is-open');
        recPanel.hidden = true;
      }
      setRecurringInterval('monthly');
    } else {
      if (editingTxIdInput) editingTxIdInput.value = target.id;
      if (titleEl) titleEl.textContent = 'İşlem Kaydını Düzenle';
      if (subTitleEl) subTitleEl.textContent = 'Seçilen hesap bakiyesi veya kredi kartı borcu otomatik güncellenir';

      if (txDescInput) txDescInput.value = target.desc || '';
      if (txAmountInput) txAmountInput.value = target.amount || '';
      if (txDateInput) txDateInput.value = target.date || new Date().toISOString().slice(0, 10);
      setModalTxType(target.type || 'Gider', target.accountId);
      if (target.cat && txCategorySelect && Array.from(txCategorySelect.options).some((o) => o.value === target.cat)) {
        txCategorySelect.value = target.cat;
        renderCustomCategoryDropdown();
      }

      // Taksit panelini kapat
      if (instToggle) instToggle.checked = false;
      if (instPanel) {
        instPanel.classList.remove('is-open');
        instPanel.hidden = true;
      }
      setInstallmentCount(3);

      // Tekrarlayan işlem verilerini yükle
      if (recToggle && recPanel) {
        if (target.isRecurring) {
          recToggle.checked = true;
          recPanel.hidden = false;
          requestAnimationFrame(() => recPanel.classList.add('is-open'));
          setRecurringInterval(target.recurringInterval || 'monthly');
          const dayInput = document.getElementById('txRecurringDay');
          if (dayInput) dayInput.value = target.recurringDay != null ? target.recurringDay : (target.date ? new Date(target.date).getDate() : 1);
          const endInput = document.getElementById('txRecurringEndDate');
          if (endInput) endInput.value = target.recurringEndDate || '';
          updateRecurringPreview();
        } else {
          recToggle.checked = false;
          recPanel.classList.remove('is-open');
          recPanel.hidden = true;
        }
      }
    }

    updateInstallmentCalculation();
    updateTxLivePreview();
    openModal(addTxDlg);
    setTimeout(() => txDescInput?.focus(), 40);
  }

  function deleteTransactionById(txId) {
    if (State.deleteTransaction) {
      return State.deleteTransaction(txId);
    }
    const target = State.tx.find((item) => item.id === txId);
    if (!target) return;

    if (target.isInstallment && target.installment?.groupId && State.deleteInstallmentGroup) {
      return State.deleteInstallmentGroup(target.installment.groupId);
    }

    revertTransactionFromAccounts(target);
    State.tx = State.tx.filter((item) => item.id !== txId);

    State.saveAccounts();
    State.saveTransactions();
    State.showToast(`"${target.desc}" işlemi silindi ve hesap bakiyesi güncellendi.`);
  }

  function init() {
    document.querySelectorAll('.tx-type-card').forEach((card) => {
      card.addEventListener('click', () => setModalTxType(card.dataset.txType));
    });

    txAccountSelect?.addEventListener('change', updateTxLivePreview);
    txAmountInput?.addEventListener('input', updateTxLivePreview);

    document.getElementById('closeAddTxIcon')?.addEventListener('click', () => closeModal(addTxDlg));
    document.getElementById('cancelAddTxBtn')?.addEventListener('click', () => closeModal(addTxDlg));

    // Tekrarlayan işlem ve Taksitli işlem olay dinleyicileri (Karşılıklı Senkron / Birini açınca diğeri kapanır)
    const toggle = document.getElementById('txRecurringToggle');
    const panel = document.getElementById('txRecurringPanel');
    const instToggle = document.getElementById('txInstallmentToggle');
    const instPanel = document.getElementById('txInstallmentPanel');

    if (toggle && panel) {
      toggle.addEventListener('change', () => {
        if (toggle.checked) {
          // Taksit açık ise otomatik kapat
          if (instToggle && instToggle.checked) {
            instToggle.checked = false;
            if (instPanel) {
              instPanel.classList.remove('is-open');
              instPanel.hidden = true;
            }
          }
          panel.hidden = false;
          requestAnimationFrame(() => panel.classList.add('is-open'));
          const dayInput = document.getElementById('txRecurringDay');
          if (dayInput && txDateInput?.value) {
            const d = new Date(txDateInput.value).getDate();
            if (!isNaN(d)) dayInput.value = d;
          }
          updateRecurringPreview();
        } else {
          panel.classList.remove('is-open');
          setTimeout(() => {
            if (!toggle.checked) panel.hidden = true;
          }, 250);
        }
      });
    }

    if (instToggle && instPanel) {
      instToggle.addEventListener('change', () => {
        if (instToggle.checked) {
          // Tekrarlayan açık ise otomatik kapat
          if (toggle && toggle.checked) {
            toggle.checked = false;
            if (panel) {
              panel.classList.remove('is-open');
              panel.hidden = true;
            }
          }
          instPanel.hidden = false;
          requestAnimationFrame(() => instPanel.classList.add('is-open'));
          updateInstallmentCalculation();
        } else {
          instPanel.classList.remove('is-open');
          setTimeout(() => {
            if (!instToggle.checked) instPanel.hidden = true;
          }, 250);
        }
      });
    }

    document.querySelectorAll('.inst-seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        setInstallmentCount(Number(btn.dataset.count) || 3);
      });
    });

    txAmountInput?.addEventListener('input', () => {
      updateInstallmentCalculation();
    });

    txDateInput?.addEventListener('change', () => {
      updateInstallmentCalculation();
    });

    document.querySelectorAll('.rec-seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        setRecurringInterval(btn.dataset.interval);
      });
    });

    document.getElementById('txRecurringDay')?.addEventListener('input', updateRecurringPreview);
    document.getElementById('txRecurringEndDate')?.addEventListener('change', updateRecurringPreview);
    txDateInput?.addEventListener('change', () => {
      const dayInput = document.getElementById('txRecurringDay');
      if (dayInput && txDateInput.value) {
        const d = new Date(txDateInput.value).getDate();
        if (!isNaN(d)) dayInput.value = d;
      }
      updateRecurringPreview();
    });

    addTxForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const acc = State.getAccountById(txAccountSelect.value);
      const desc = (txDescInput?.value || '').trim();
      const amount = parseMoney(txAmountInput?.value);
      const date = txDateInput?.value || new Date().toISOString().slice(0, 10);
      const cat = txCategorySelect?.value || 'Diğer';
      const editTxId = editingTxIdInput?.value || '';

      if (!acc) {
        if (txFormError) {
          txFormError.textContent = 'Lütfen geçerli bir ödeme yöntemi veya hesap seçin.';
          txFormError.hidden = false;
        }
        return;
      }
      if (!desc) {
        if (txFormError) {
          txFormError.textContent = 'Lütfen işlem açıklamasını girin.';
          txFormError.hidden = false;
        }
        txDescInput?.focus();
        return;
      }
      if (isNaN(amount) || amount <= 0) {
        if (txFormError) {
          txFormError.textContent = 'Lütfen sıfırdan büyük geçerli bir tutar girin.';
          txFormError.hidden = false;
        }
        txAmountInput?.focus();
        return;
      }

      const isEditingInstGroup = Boolean(editTxId && editTxId.startsWith('instgrp:'));
      const editingInstGroupId = isEditingInstGroup ? editTxId.slice('instgrp:'.length) : null;

      if (isEditingInstGroup && editingInstGroupId) {
        // Eski taksit grubunu ve kart borcunu tamamen geri al
        const groupTxs = State.tx.filter((x) => x && x.installment?.groupId === editingInstGroupId);
        if (groupTxs.length > 0) {
          const firstTx = groupTxs[0];
          const oldAcc = firstTx ? State.getAccountById(firstTx.accountId) : null;
          const oldTotal = Number(firstTx?.installment?.totalAmount || 0);

          if (oldAcc && oldAcc.type === 'credit' && oldTotal > 0) {
            oldAcc.debt = Math.max(0, round2(Number(oldAcc.debt || 0) - oldTotal));
            if (oldAcc.transactions) {
              const cleanFirstDesc = (firstTx.desc || '').replace(/\s*\(\d+\/\d+\)$/, '').trim();
              oldAcc.transactions = oldAcc.transactions.filter((at) => 
                !(at.desc && cleanFirstDesc && at.desc.includes(cleanFirstDesc))
              );
            }
          } else {
            groupTxs.forEach((t) => revertTransactionFromAccounts(t));
          }
          State.tx = State.tx.filter((x) => !(x && x.installment?.groupId === editingInstGroupId));
        }
      } else if (editTxId) {
        const oldTx = State.tx.find((item) => item.id === editTxId);
        if (oldTx) {
          if (oldTx.isInstallment && oldTx.installment?.groupId) {
            const grpId = oldTx.installment.groupId;
            const groupTxs = State.tx.filter((x) => x && x.installment?.groupId === grpId);
            const firstTx = groupTxs[0] || oldTx;
            const oldAcc = firstTx ? State.getAccountById(firstTx.accountId) : null;
            const oldTotal = Number(firstTx?.installment?.totalAmount || 0);
            if (oldAcc && oldAcc.type === 'credit' && oldTotal > 0) {
              oldAcc.debt = Math.max(0, round2(Number(oldAcc.debt || 0) - oldTotal));
            } else {
              groupTxs.forEach((t) => revertTransactionFromAccounts(t));
            }
            State.tx = State.tx.filter((x) => !(x && x.installment?.groupId === grpId));
          } else {
            revertTransactionFromAccounts(oldTx);
            State.tx = State.tx.filter((item) => item.id !== editTxId);
          }
        }
      }

      // Tekrarlayan işlem verisi
      const isRecurring = Boolean(document.getElementById('txRecurringToggle')?.checked);
      let recurringInterval = 'monthly';
      let recurringDay = 1;
      let nextDueDate = undefined;
      let recurringEndDate = undefined;
      let autoConfirm = false;

      if (isRecurring) {
        recurringInterval = document.getElementById('txRecurringInterval')?.value || 'monthly';
        recurringDay = Number(document.getElementById('txRecurringDay')?.value) || (date ? new Date(date).getDate() : 1);
        const endVal = document.getElementById('txRecurringEndDate')?.value;
        recurringEndDate = endVal ? endVal.trim() : undefined;
        const RE = window.Vaulty?.RecurringEngine;
        nextDueDate = RE?.calculateNextDueDate
          ? RE.calculateNextDueDate(date, recurringInterval, recurringDay)
          : date;
        autoConfirm = false;
      }

      const recurringData = isRecurring ? {
        isRecurring: true,
        recurringInterval,
        recurringDay,
        nextDueDate,
        recurringEndDate,
        autoConfirm,
      } : { isRecurring: false };

      // KART BORCU ÖDEME AKIŞI
      if (State.modalTxType === 'Kart Borcu Ödeme' || (acc.type === 'credit' && cat === 'Kart Borcu Ödeme')) {
        acc.debt = Math.max(0, round2(Number(acc.debt || 0) - amount));
        acc.transactions = acc.transactions || [];
        acc.transactions.unshift({
          id: 'at-' + Date.now(),
          date,
          desc,
          cat: 'Kart Borcu Ödeme',
          amount: round2(Math.abs(amount)),
        });

        const sourceId = txSourceAccountSelect?.value;
        const sourceAcc = sourceId !== 'external' ? State.getAccountById(sourceId) : null;
        if (sourceAcc) {
          sourceAcc.balance = round2(Number(sourceAcc.balance || 0) - amount);
          sourceAcc.transactions = sourceAcc.transactions || [];
          sourceAcc.transactions.unshift({
            id: 'at-src-' + Date.now(),
            date,
            desc: `${acc.nickname} – ${desc}`,
            cat: 'Kart Borcu Ödeme',
            amount: round2(-Math.abs(amount)),
          });
        }

        State.tx.unshift({
          id: editTxId || 'tx-' + Date.now(),
          date,
          desc,
          cat: 'Kart Borcu Ödeme',
          type: 'Kart Borcu Ödeme',
          status: 'Ödendi',
          amount: round2(amount),
          accountId: acc.id,
          sourceAccountId: sourceAcc?.id || null,
          ...recurringData,
        });

        State.selectedAccountId = acc.id;
      } else if (acc.type === 'credit') {
        // KREDİ KARTI HARCAMASI VEYA İADESİ
        const isInstallment = Boolean(
          State.modalTxType === 'Gider' &&
          document.getElementById('txInstallmentToggle')?.checked
        );

        if (isInstallment) {
          const instCount = Math.max(2, parseInt(document.getElementById('txInstallmentCount')?.value || '3', 10));
          const totalAmt = round2(amount);
          const monthlyBase = round2(totalAmt / instCount);
          const groupId = editingInstGroupId || ('inst-grp-' + Date.now());

          // Limit / Borç güncellenir: Kart borcu toplam tutar kadar artar
          acc.debt = round2(Number(acc.debt || 0) + totalAmt);
          acc.transactions = acc.transactions || [];
          acc.transactions.unshift({
            id: 'at-' + Date.now(),
            date,
            desc: `${desc} (${instCount} Taksit)`,
            cat,
            amount: round2(-Math.abs(totalAmt)),
          });

          // Taksitleri oluştur (1. taksit işlem tarihinde, diğerleri sonraki aylara)
          const baseDate = new Date(date);
          for (let i = 1; i <= instCount; i++) {
            let instDateStr = date;
            if (i > 1) {
              const d = new Date(baseDate);
              const origDay = d.getDate();
              d.setMonth(d.getMonth() + (i - 1));
              if (d.getDate() !== origDay) d.setDate(0);
              instDateStr = d.toISOString().slice(0, 10);
            }
            // Kuruş yuvarlama farkını son taksitte denkleştir
            const thisInstAmt = i === instCount
              ? round2(totalAmt - (monthlyBase * (instCount - 1)))
              : monthlyBase;

            State.tx.unshift({
              id: `tx-inst-${Date.now()}-${i}`,
              date: instDateStr,
              desc: `${desc} (${i}/${instCount})`,
              cat,
              type: 'Gider',
              status: i === 1 ? 'Ödendi' : 'Planlandı',
              amount: thisInstAmt,
              accountId: acc.id,
              isInstallment: true,
              installment: {
                groupId,
                totalAmount: totalAmt,
                currentInstallment: i,
                totalInstallments: instCount,
                installmentAmount: thisInstAmt,
              },
            });
          }

          State.selectedAccountId = acc.id;
        } else {
          if (State.modalTxType === 'Gider') {
            acc.debt = round2(Number(acc.debt || 0) + amount);
            acc.transactions = acc.transactions || [];
            acc.transactions.unshift({
              id: 'at-' + Date.now(),
              date,
              desc,
              cat,
              amount: round2(-Math.abs(amount)),
            });
          } else {
            acc.debt = Math.max(0, round2(Number(acc.debt || 0) - amount));
            acc.transactions = acc.transactions || [];
            acc.transactions.unshift({
              id: 'at-' + Date.now(),
              date,
              desc,
              cat,
              amount: round2(Math.abs(amount)),
            });
          }

          State.tx.unshift({
            id: editTxId || 'tx-' + Date.now(),
            date,
            desc,
            cat,
            type: State.modalTxType,
            status: 'Ödendi',
            amount: round2(amount),
            accountId: acc.id,
            ...recurringData,
          });

          State.selectedAccountId = acc.id;
        }
      } else {
        // VADESİZ BANKA VEYA NAKİT KASA
        if (State.modalTxType === 'Gelir') {
          acc.balance = round2(Number(acc.balance || 0) + amount);
          acc.transactions = acc.transactions || [];
          acc.transactions.unshift({
            id: 'at-' + Date.now(),
            date,
            desc,
            cat,
            amount: round2(Math.abs(amount)),
          });
        } else {
          acc.balance = round2(Number(acc.balance || 0) - amount);
          acc.transactions = acc.transactions || [];
          acc.transactions.unshift({
            id: 'at-' + Date.now(),
            date,
            desc,
            cat,
            amount: round2(-Math.abs(amount)),
          });
        }

        State.tx.unshift({
          id: editTxId || 'tx-' + Date.now(),
          date,
          desc,
          cat,
          type: State.modalTxType,
          status: 'Ödendi',
          amount: round2(amount),
          accountId: acc.id,
          ...recurringData,
        });

        State.selectedAccountId = acc.id;
      }

      if (editingTxIdInput) editingTxIdInput.value = '';
      State.saveAccounts();
      State.saveTransactions();
      populateTxAccountDropdowns();
      closeModal(addTxDlg);

      if (acc.type === 'credit' && State.modalTxType === 'Gider' && document.getElementById('txInstallmentToggle')?.checked) {
        const count = Math.max(2, parseInt(document.getElementById('txInstallmentCount')?.value || '3', 10));
        State.showToast(
          isEditingInstGroup || editTxId
            ? `"${desc}" taksitli harcaması güncellendi. Tüm ${count} taksit ve kart borcu yeniden hesaplandı.`
            : `"${desc}" ${count} taksit olarak kaydedildi. Toplam borç karta işlendi, ekstreler planlandı.`
        );
      } else if (isRecurring) {
        State.showToast(
          editTxId
            ? `Tekrarlayan işlem başarıyla güncellendi.`
            : `"${desc}" tekrarlayan işlem olarak kaydedildi. Vadesi geldiğinde onay bandında hatırlatılacak.`
        );
      } else {
        State.showToast(
          editTxId
            ? `İşlem güncellendi ve "${acc.nickname}" bakiyesi yeniden hesaplandı.`
            : `İşlem kaydedildi ve "${acc.nickname}" bakiyesi/borcu otomatik güncellendi.`
        );
      }
    });
  }

  const NewTransaction = {
    init,
    openNewTransactionModal,
    startEditTransaction,
    deleteTransactionById,
    populateTxAccountDropdowns,
    updateTxLivePreview,
  };

  window.openNewTransactionModal = openNewTransactionModal;
  window.startEditTransaction = startEditTransaction;
  window.deleteTransactionById = deleteTransactionById;
  window.Vaulty = window.Vaulty || {};
  window.Vaulty.NewTransaction = NewTransaction;
  window.Vaulty.Modals = window.Vaulty.Modals || {};
  window.Vaulty.Modals.NewTransaction = NewTransaction;
})();

