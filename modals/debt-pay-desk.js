/**
 * Vaulty - Debt & Card Payment Desk Modal Logic
 * modals/debt-pay-desk.js
 *
 * Encapsulates:
 * 1. Credit Card Debt Payment Modal (#payCardDebtDlg, #payCardDebtForm)
 * 2. Settlement Desk Drawer / Dialog (#settlementDeskDlg, #partialPaymentForm)
 */

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  const State = window.Vaulty?.State;
  const Modal = window.Vaulty?.Modal;
  if (Modal?.mountModal) {
    Modal.mountModal('payCardDebtDlg', `
<!-- =====================================================================
     MODAL: "KART BORCU & EKSTRE ÖDEMESİ" (560px Genişlik, Canlı Radar & Hızlı Mahsup)
     ===================================================================== -->
<div id="payCardDebtDlg" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="payCardTitle" hidden style="display: none !important; pointer-events: none !important;">
  <div class="modal-box modal-box--pay-card">
    <form id="payCardDebtForm" class="modal-form--pay-card" novalidate autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
      <header class="cd-modal-header">
        <div class="cd-modal-titles">
          <div class="cd-header-badge">
            <span class="cd-badge-dot"></span>
            <span>Kredi Kartı Mahsuplaşma</span>
          </div>
          <h3 class="modal-box__title" id="payCardTitle">Kart Borcu &amp; Ekstre Ödemesi</h3>
          <p class="modal-box__sub">Kredi kartı dönem borcunu veya asgari tutarı banka/nakit hesabınızdan anında kapatın</p>
        </div>
        <button type="button" class="modal-close-btn" id="closePayCardDebtIcon" data-action="close-modal" aria-label="Kapat" title="Kapat">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </header>

      <div class="cd-modal-body">
        <!-- Satır 1: Hedef Kart ve Kaynak Hesap Seçimi -->
        <div class="cd-selectors-grid">
          <div class="m-field">
            <span class="m-field__label">Ödenecek Kredi Kartı (Hedef)</span>
            <div class="custom-select" id="cdCardDropdown" data-select-target="cdCardSelect">
              <select id="cdCardSelect" class="sr" tabindex="-1" required></select>
              <button type="button" class="custom-select__trigger" id="cdCardTrigger" aria-haspopup="listbox" aria-expanded="false">
                <span class="cso-left">
                  <span class="cso-name" id="cdCardTriggerName">Kart Seçin</span>
                  <span class="cso-badge" id="cdCardTriggerBadge"></span>
                </span>
                <span class="cso-right">
                  <span class="cso-balance mono" id="cdCardTriggerDebt"></span>
                  <svg class="custom-select__chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </button>
              <div class="custom-select__popover scroll" id="cdCardPopover" role="listbox" hidden style="display: none !important; pointer-events: none !important;"></div>
            </div>
          </div>

          <div class="m-field">
            <span class="m-field__label">Ödemenin Çekileceği Hesap (Kaynak)</span>
            <div class="custom-select" id="cdSourceDropdown" data-select-target="cdSourceSelect">
              <select id="cdSourceSelect" class="sr" tabindex="-1" required></select>
              <button type="button" class="custom-select__trigger" id="cdSourceTrigger" aria-haspopup="listbox" aria-expanded="false">
                <span class="cso-left">
                  <span class="cso-name" id="cdSourceTriggerName">Hesap Seçin</span>
                  <span class="cso-badge" id="cdSourceTriggerBadge"></span>
                </span>
                <span class="cso-right">
                  <span class="cso-balance mono" id="cdSourceTriggerBalance"></span>
                  <svg class="custom-select__chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </button>
              <div class="custom-select__popover scroll" id="cdSourcePopover" role="listbox" hidden style="display: none !important; pointer-events: none !important;"></div>
            </div>
          </div>
        </div>

        <!-- Canlı Borç & Ekstre Radarı (3 Sütunlu Mat Yüzey) -->
        <div class="cd-radar-card" id="cdRadarCard">
          <div class="cd-radar-col">
            <span class="cd-radar-label">TOPLAM EKSTRE BORCU</span>
            <span class="cd-radar-val mono" id="cdRadarTotalDebt">0,00 ₺</span>
          </div>
          <div class="cd-radar-divider"></div>
          <div class="cd-radar-col">
            <span class="cd-radar-label">ASGARİ ÖDEME TUTARI</span>
            <span class="cd-radar-val cd-radar-val--amber mono" id="cdRadarMinDue">0,00 ₺</span>
          </div>
          <div class="cd-radar-divider"></div>
          <div class="cd-radar-col">
            <span class="cd-radar-label">KULLANILABİLİR LİMİT</span>
            <span class="cd-radar-val cd-radar-val--emerald mono" id="cdRadarAvailLimit">0,00 ₺</span>
          </div>
        </div>

        <!-- Hızlı Ödeme Çipleri & Tutar Alanı -->
        <div class="cd-amount-section">
          <div class="cd-chips-row" role="radiogroup" aria-label="Hızlı Ödeme Tutarı">
            <button type="button" class="cd-pill" id="cdPillMin" data-pill="min">
              <span>Asgari Tutar</span>
              <span class="cd-pill-val mono" id="cdPillMinVal">(0 ₺)</span>
            </button>
            <button type="button" class="cd-pill is-active" id="cdPillFull" data-pill="full">
              <span>Ekstre Borcunun Tamamı</span>
              <span class="cd-pill-val mono" id="cdPillFullVal">(0 ₺)</span>
            </button>
            <button type="button" class="cd-pill" id="cdPillCustom" data-pill="custom">
              <span>Özel Tutar</span>
            </button>
          </div>

          <div class="cd-amount-box">
            <div class="cd-amount-field-wrap">
              <input id="cdAmountInput" name="cd_amt_val" type="text" inputmode="decimal" class="cd-amount-input mono" placeholder="0,00" required autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
              <span class="cd-amount-currency mono" aria-hidden="true">₺</span>
            </div>
            <!-- Yetersiz Bakiye Uyarısı -->
            <div class="cd-overdraft-warning" id="cdOverdraftWarning" hidden>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span id="cdOverdraftText">Yetersiz hesap bakiyesi</span>
            </div>
          </div>
        </div>

        <!-- Akıllı Otomatik Açıklama & İşlem Tarihi -->
        <div class="cd-desc-date-row">
          <label class="m-field cd-desc-field">
            <span class="m-field__label">İşlem Açıklaması</span>
            <input id="cdDescInput" name="cd_memo_note" type="text" class="m-input" placeholder="Örn: Kasım 2026 Garanti BBVA Ekstre Ödemesi" required autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
          </label>
          <label class="m-field cd-date-field">
            <span class="m-field__label">İşlem Tarihi</span>
            <div class="tx-input-wrap tx-date-wrap">
              <input id="cdDateInput" name="cd_date_val" type="date" class="m-input tx-date-field mono" required autocomplete="off">
              <svg class="tx-date-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
          </label>
        </div>

        <p class="form-error" id="cdFormError" role="alert" hidden></p>
      </div>

      <footer class="cd-modal-footer">
        <button type="button" class="btn btn--ghost" id="cancelPayCardDebtBtn" data-action="close-modal">Vazgeç</button>
        <button type="submit" class="cd-submit-btn" id="submitPayCardDebtBtn">
          <span id="cdSubmitBtnText">Borç Öde</span>
        </button>
      </footer>
    </form>
  </div>
</div>
`);
    Modal.mountModal('settlementDeskDlg', `
<!-- =====================================================================
     MODAL 3B: İKİ SÜTUNLU ÖDEME & MUTABAKAT MASASI (980px Ortalanmış Modal, %38 | %62)
     ===================================================================== -->
<div id="settlementDeskDlg" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="drawerPartyName" hidden style="display: none !important; pointer-events: none !important;">
  <div class="modal-box modal-box--desk">
    <!-- 1. Modal Üst Başlık Çubuğu -->
    <header class="sd-header">
      <div class="sd-header__left">
        <span class="sd-avatar" id="drawerAvatar" aria-hidden="true"></span>
        <div class="sd-header__titles">
          <div class="sd-header__name-row">
            <h2 class="sd-party-name" id="drawerPartyName">—</h2>
            <span class="sd-kind-badge" id="sdKindBadge">Alacak</span>
          </div>
          <p class="sd-party-meta" id="drawerMeta">—</p>
        </div>
      </div>

      <div class="sd-header__right">
        <div class="sd-rem-pill" id="sdRemPillWrap">
          <span class="sd-rem-pill__label" id="drawerRemLabel">Kalan Bakiye:</span>
          <span class="sd-rem-pill__val mono" id="drawerRemBadge">0 ₺</span>
        </div>
        <button type="button" class="modal-close-btn" id="closeDrawerBtn" aria-label="Pencereyi kapat" title="Kapat">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </header>

    <!-- 2. İki Sütunlu Çalışma Alanı (%38 Sol Geçmiş | %62 Sağ Giriş Masası) -->
    <div class="sd-workspace">
      <!-- SOL SÜTUN: Ödeme Geçmişi ve Döküm (38%, #F8FAFC) -->
      <section class="sd-col sd-col--left" aria-label="Ödeme geçmişi ve döküm">
        <div class="sd-col__head">
          <h3 class="sd-col__title">Ödeme Geçmişi ve Döküm</h3>
          <span class="sd-count-badge mono" id="timelineCount">0 kayıt</span>
        </div>

        <!-- Genel Geri Ödeme İlerleme Çubuğu (8px yükseklik) -->
        <div class="sd-progress-box">
          <div class="sd-progress-box__labels mono">
            <span id="drawerProgressPct">%0 tamamlandı</span>
            <span id="drawerProgressRatio">0 ₺ / <strong id="drawerTotalAmt">0 ₺</strong></span>
          </div>
          <div class="sd-progress-track">
            <i class="sd-progress-fill" id="drawerProgressBar" style="width:0%"></i>
          </div>
        </div>

        <!-- Kaydırılabilir Ödeme Zaman Çizelgesi (max-height: 380px) -->
        <div class="sd-timeline-scroll scroll" id="paymentTimeline"></div>
      </section>

      <!-- SAĞ SÜTUN: Yeni Ödeme / Tahsilat Girişi (62%, #FFFFFF) -->
      <section class="sd-col sd-col--right" aria-label="Yeni ödeme ve tahsilat girişi">
        <div class="sd-col__head">
          <h3 class="sd-col__title" id="paymentFormTitle">Yeni Ödeme / Tahsilat Girişi</h3>
        </div>

        <!-- Hızlı Tutar Seçim Butonları ("Tümü", "Yarısı", "1.000 ₺", "5.000 ₺") -->
        <div class="sd-presets" id="sdPresetsBar" aria-label="Hızlı tutar seçimi">
          <button type="button" class="sd-preset-pill" data-preset="all" aria-pressed="false">Tüm Kalanı Kapat</button>
          <button type="button" class="sd-preset-pill" data-preset="half" aria-pressed="false">Yarısı</button>
          <button type="button" class="sd-preset-pill" data-preset="1000" aria-pressed="false">1.000 ₺</button>
          <button type="button" class="sd-preset-pill" data-preset="5000" aria-pressed="false">5.000 ₺</button>
        </div>

        <form id="partialPaymentForm" class="sd-form" novalidate autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
          <input type="hidden" id="editingPaymentId" value="">

          <!-- Alan 1: Tutar (₺) (48px yüksekliğinde büyük para birimi alanı) -->
          <label class="sd-field">
            <span class="sd-field__label" id="payAmountLabel">Tutar (₺)</span>
            <input id="payAmountInput" name="amount" type="text" inputmode="decimal" placeholder="0,00 ₺" class="sd-amount-input mono" required autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
          </label>

          <!-- Alan 2: Tarih -->
          <label class="sd-field">
            <span class="sd-field__label">Tarih</span>
            <input id="payDateInput" name="date" type="date" class="m-input mono" required autocomplete="off">
          </label>

          <!-- Alan 3: Hesap / Varlık Seçimi (Özel Yüzen Popover Menü) -->
          <div class="sd-field">
            <span class="sd-field__label" id="payAccountLabel">Paranın Aktarılacağı Hesap</span>
            <div class="custom-select" id="payAccountDropdown" data-select-target="payAccountSelect">
              <select id="payAccountSelect" name="accountId" class="sr" tabindex="-1" required></select>
              <button type="button" class="custom-select__trigger" id="payAccountTrigger" aria-haspopup="listbox" aria-expanded="false">
                <span class="cso-left">
                  <span class="cso-name">Hesap Seçin</span>
                  <span class="cso-badge"></span>
                </span>
                <span class="cso-right">
                  <span class="cso-balance mono"></span>
                  <svg class="custom-select__chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </button>
              <div class="custom-select__popover scroll" id="payAccountPopover" role="listbox" hidden style="display: none !important; pointer-events: none !important;"></div>
            </div>
            <p class="form-warning" id="payAccountWarning" role="status" hidden>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>Seçilen hesap bakiyesi eksiye düşecektir</span>
            </p>
          </div>

          <!-- Alan 4: Açıklama / Not -->
          <label class="sd-field">
            <span class="sd-field__label">Açıklama / Not</span>
            <input id="payNoteInput" name="note" type="text" class="m-input" placeholder="Örn: FAST, Elden Nakit, 2. Taksit..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
          </label>

          <p class="form-error" id="payFormError" role="alert" hidden></p>
        </form>
      </section>
    </div>

    <!-- 3. Modal Alt Aksiyon Çubuğu -->
    <footer class="sd-footer">
      <div class="sd-footer__status" id="sdFooterStatus">
        <svg class="sd-info-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <span id="sdFooterStatusText">Kaydedilen tahsilat seçilen hesabın bakiyesine anında eklenir</span>
      </div>
      <div class="sd-footer__actions">
        <button type="button" class="sd-cancel-btn" id="cancelSettlementDeskBtn">Vazgeç</button>
        <button type="submit" form="partialPaymentForm" class="sd-submit-btn" id="submitPaymentBtn">Ödemeyi Kaydet / Yansıt</button>
      </div>
    </footer>
  </div>
</div>
`);
  }

  function getState() {
    return window.Vaulty?.State;
  }

  function round2(num) {
    return getState() ? getState().round2(num) : Math.round((Number(num) || 0) * 100) / 100;
  }

  function parseMoney(val) {
    return getState() ? getState().parseMoney(val) : parseFloat(val) || 0;
  }

  function tryFmt(num) {
    return getState() ? getState().tryFmt(num) : `${Number(num || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
  }

  function esc(s) {
    return getState() ? getState().esc(s) : String(s || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function showToast(msg) {
    if (getState() && getState().showToast) {
      getState().showToast(msg);
    } else if (window.showToast) {
      window.showToast(msg);
    }
  }

  function getAccountById(id) {
    const s = getState();
    return s ? s.getAccountById(id) : (window.accounts || []).find((a) => a.id === id);
  }

  /* -------------------------------------------------------------------------
     1. KART BORCU & EKSTRE ÖDEMESİ MASASI (#payCardDebtDlg)
     ------------------------------------------------------------------------- */
  let cdActivePill = 'full'; // 'min' | 'full' | 'custom'
  let cdDescUserModified = false;

  function getTurkishMonthYear(dateStr) {
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    if (!dateStr) return { month: 'Kasım', year: '2026' };
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      const mIdx = Math.max(0, Math.min(11, parseInt(parts[1], 10) - 1));
      return { month: months[mIdx] || 'Kasım', year: parts[0] || '2026' };
    }
    return { month: 'Kasım', year: '2026' };
  }

  function calculateCardMetrics(card) {
    if (!card) return { debt: 0, minDue: 0, avail: 0 };
    const debt = Math.max(0, round2(Number(card.debt || 0)));
    const limit = Math.max(0, round2(Number(card.limit || 0)));
    const minRatio = limit > 25000 ? 0.40 : 0.20;
    const minDue = debt > 0 ? Math.min(debt, Math.max(0, round2(debt * minRatio))) : 0;
    const avail = Math.max(0, round2(limit - debt));
    return { debt, minDue, avail };
  }

  function updateAutoDescription() {
    if (cdDescUserModified) return;
    const cardSelect = $('#cdCardSelect');
    const descInput = $('#cdDescInput');
    const dateInput = $('#cdDateInput');
    const card = getAccountById(cardSelect?.value);
    if (!card || !descInput) return;
    const { month, year } = getTurkishMonthYear(dateInput?.value);
    const cardName = card.institution ? `${card.institution}` : card.nickname;
    descInput.value = `${month} ${year} ${cardName} Ekstre Ödemesi`;
  }

  function updatePayCardSubmitButton(amount) {
    const cdSubmitBtnText = $('#cdSubmitBtnText');
    if (!cdSubmitBtnText) return;
    const amt = parseMoney(amount || 0);
    if (amt > 0) {
      cdSubmitBtnText.textContent = `${tryFmt(amt)} Borç Öde`;
    } else {
      cdSubmitBtnText.textContent = 'Borç Öde';
    }
  }

  function checkOverdraftGuard() {
    const cdOverdraftWarning = $('#cdOverdraftWarning');
    const submitPayCardDebtBtn = $('#submitPayCardDebtBtn');
    const cdSourceSelect = $('#cdSourceSelect');
    const cdAmountInput = $('#cdAmountInput');
    const cdOverdraftText = $('#cdOverdraftText');

    if (!cdOverdraftWarning || !submitPayCardDebtBtn) return;
    const sourceId = cdSourceSelect?.value;
    const sourceAcc = sourceId && sourceId !== 'external' ? getAccountById(sourceId) : null;
    const amt = parseMoney(cdAmountInput?.value || 0);

    if (sourceAcc && amt > Number(sourceAcc.balance || 0)) {
      cdOverdraftWarning.hidden = false;
      if (cdOverdraftText) {
        cdOverdraftText.textContent = `Yetersiz hesap bakiyesi (Mevcut Bakiye: ${tryFmt(sourceAcc.balance)})`;
      }
      submitPayCardDebtBtn.disabled = true;
    } else {
      cdOverdraftWarning.hidden = true;
      submitPayCardDebtBtn.disabled = false;
    }
  }

  function selectPaymentPill(pillType) {
    cdActivePill = pillType;
    $('#cdPillMin')?.classList.toggle('is-active', pillType === 'min');
    $('#cdPillFull')?.classList.toggle('is-active', pillType === 'full');
    $('#cdPillCustom')?.classList.toggle('is-active', pillType === 'custom');

    const card = getAccountById($('#cdCardSelect')?.value);
    const { debt, minDue } = calculateCardMetrics(card);
    const cdAmountInput = $('#cdAmountInput');

    if (pillType === 'min') {
      if (cdAmountInput) cdAmountInput.value = minDue > 0 ? minDue : '';
      updatePayCardSubmitButton(minDue);
      checkOverdraftGuard();
    } else if (pillType === 'full') {
      if (cdAmountInput) cdAmountInput.value = debt > 0 ? debt : '';
      updatePayCardSubmitButton(debt);
      checkOverdraftGuard();
    } else if (pillType === 'custom') {
      if (cdAmountInput) {
        cdAmountInput.focus();
        updatePayCardSubmitButton(cdAmountInput.value);
      }
      checkOverdraftGuard();
    }
  }

  function refreshPayCardDeskMetrics() {
    const card = getAccountById($('#cdCardSelect')?.value);
    const { debt, minDue, avail } = calculateCardMetrics(card);

    const cdRadarTotalDebt = $('#cdRadarTotalDebt');
    const cdRadarMinDue = $('#cdRadarMinDue');
    const cdRadarAvailLimit = $('#cdRadarAvailLimit');
    const cdPillMinVal = $('#cdPillMinVal');
    const cdPillFullVal = $('#cdPillFullVal');
    const cdAmountInput = $('#cdAmountInput');

    if (cdRadarTotalDebt) cdRadarTotalDebt.textContent = tryFmt(debt);
    if (cdRadarMinDue) cdRadarMinDue.textContent = tryFmt(minDue);
    if (cdRadarAvailLimit) cdRadarAvailLimit.textContent = tryFmt(avail);

    if (cdPillMinVal) cdPillMinVal.textContent = `(${tryFmt(minDue)})`;
    if (cdPillFullVal) cdPillFullVal.textContent = `(${tryFmt(debt)})`;

    updateAutoDescription();

    if (cdActivePill === 'min') {
      if (cdAmountInput) cdAmountInput.value = minDue > 0 ? minDue : '';
      updatePayCardSubmitButton(minDue);
    } else if (cdActivePill === 'full') {
      if (cdAmountInput) cdAmountInput.value = debt > 0 ? debt : '';
      updatePayCardSubmitButton(debt);
    } else {
      if (cdAmountInput) updatePayCardSubmitButton(cdAmountInput.value);
    }

    checkOverdraftGuard();
  }

  function renderPayCardSelectors(preferredCardId = null, preferredSourceId = null) {
    const s = getState();
    const accounts = s ? s.getAccounts() : window.accounts || [];
    const creditCards = accounts.filter((a) => a.type === 'credit');
    const liquidAccounts = accounts.filter((a) => a.type === 'checking' || a.type === 'cash');

    const cdCardDropdown = $('#cdCardDropdown');
    const cdCardSelect = $('#cdCardSelect');
    const cdSourceDropdown = $('#cdSourceDropdown');
    const cdSourceSelect = $('#cdSourceSelect');

    const renderAccountDropdown =
      window.Vaulty?.ModalBase?.renderCustomAccountDropdown ||
      window.Vaulty?.Modal?.renderCustomAccountDropdown ||
      window.renderCustomAccountDropdown;

    const activeCardId = preferredCardId || (creditCards[0] ? creditCards[0].id : '');
    if (renderAccountDropdown) {
      renderAccountDropdown(cdCardDropdown, cdCardSelect, creditCards, activeCardId);
    }

    const activeSourceId = preferredSourceId || (liquidAccounts[0] ? liquidAccounts[0].id : 'external');
    if (renderAccountDropdown) {
      renderAccountDropdown(
        cdSourceDropdown,
        cdSourceSelect,
        liquidAccounts,
        activeSourceId,
        [{ value: 'external', name: 'Harici Kaynak', badge: '', balance: 'Kasa Dışı' }]
      );
    }
  }

  function openPayCardDebtModal(preferredCardId = null, preferredSourceId = null) {
    const s = getState();
    const accounts = s ? s.getAccounts() : window.accounts || [];
    const creditCards = accounts.filter((a) => a.type === 'credit');
    if (creditCards.length === 0) {
      showToast('Önce "Varlıklarım" ekranından bir kredi kartı eklemelisiniz.');
      return;
    }

    cdDescUserModified = false;
    const cdDateInput = $('#cdDateInput');
    if (cdDateInput) {
      cdDateInput.value = '2026-11-02';
    }
    const cdFormError = $('#cdFormError');
    if (cdFormError) cdFormError.hidden = true;

    renderPayCardSelectors(preferredCardId, preferredSourceId);
    selectPaymentPill('full');
    refreshPayCardDeskMetrics();

    const payCardDebtDlg = $('#payCardDebtDlg');
    if (window.openModal) {
      window.openModal(payCardDebtDlg);
    }
  }

  function initPayCardDebtEvents() {
    const payCardDebtDlg = $('#payCardDebtDlg');
    const payCardDebtForm = $('#payCardDebtForm');
    const cdCardSelect = $('#cdCardSelect');
    const cdSourceSelect = $('#cdSourceSelect');
    const cdDateInput = $('#cdDateInput');
    const cdDescInput = $('#cdDescInput');
    const cdAmountInput = $('#cdAmountInput');
    const cdFormError = $('#cdFormError');

    cdCardSelect?.addEventListener('change', () => {
      refreshPayCardDeskMetrics();
    });

    cdSourceSelect?.addEventListener('change', () => {
      checkOverdraftGuard();
    });

    cdDateInput?.addEventListener('change', () => {
      updateAutoDescription();
    });

    cdDescInput?.addEventListener('input', () => {
      cdDescUserModified = Boolean(cdDescInput.value.trim());
    });

    $('#cdPillMin')?.addEventListener('click', () => selectPaymentPill('min'));
    $('#cdPillFull')?.addEventListener('click', () => selectPaymentPill('full'));
    $('#cdPillCustom')?.addEventListener('click', () => selectPaymentPill('custom'));

    cdAmountInput?.addEventListener('input', () => {
      const card = getAccountById(cdCardSelect?.value);
      const { debt, minDue } = calculateCardMetrics(card);
      const currentVal = parseMoney(cdAmountInput.value || 0);

      if (Math.abs(currentVal - minDue) < 0.01 && minDue > 0) {
        cdActivePill = 'min';
      } else if (Math.abs(currentVal - debt) < 0.01 && debt > 0) {
        cdActivePill = 'full';
      } else {
        cdActivePill = 'custom';
      }
      $('#cdPillMin')?.classList.toggle('is-active', cdActivePill === 'min');
      $('#cdPillFull')?.classList.toggle('is-active', cdActivePill === 'full');
      $('#cdPillCustom')?.classList.toggle('is-active', cdActivePill === 'custom');

      updatePayCardSubmitButton(cdAmountInput.value);
      checkOverdraftGuard();
    });

    $('#closePayCardDebtIcon')?.addEventListener('click', () => {
      if (window.closeModal) window.closeModal(payCardDebtDlg);
    });
    $('#cancelPayCardDebtBtn')?.addEventListener('click', () => {
      if (window.closeModal) window.closeModal(payCardDebtDlg);
    });

    payCardDebtForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const s = getState();
      const card = getAccountById(cdCardSelect?.value);
      if (!card) {
        if (cdFormError) {
          cdFormError.hidden = false;
          cdFormError.textContent = 'Lütfen geçerli bir kredi kartı seçin.';
        }
        return;
      }

      const amount = parseMoney(cdAmountInput?.value || 0);
      if (isNaN(amount) || amount <= 0) {
        if (cdFormError) {
          cdFormError.hidden = false;
          cdFormError.textContent = "Lütfen 0'dan büyük geçerli bir ödeme tutarı girin.";
        }
        return;
      }

      const sourceId = cdSourceSelect?.value;
      const sourceAcc = sourceId !== 'external' ? getAccountById(sourceId) : null;
      if (sourceAcc && amount > Number(sourceAcc.balance || 0)) {
        if (cdFormError) {
          cdFormError.hidden = false;
          cdFormError.textContent = `Yetersiz hesap bakiyesi. Seçilen hesapta yalnızca ${tryFmt(sourceAcc.balance)} bulunmaktadır.`;
        }
        return;
      }

      const desc = cdDescInput?.value.trim() || 'Kredi Kartı Ekstre Ödemesi';
      const date = cdDateInput?.value || '2026-11-02';

      // 1. Kart borcunu düşür
      card.debt = Math.max(0, round2(Number(card.debt || 0) - amount));
      card.transactions = card.transactions || [];
      card.transactions.unshift({
        id: 'at-' + Date.now(),
        date,
        desc,
        cat: 'Kart Borcu Ödeme',
        amount: round2(Math.abs(amount)),
      });

      // 2. Kaynak hesaptan düş (harici değilse)
      if (sourceAcc) {
        sourceAcc.balance = round2(Number(sourceAcc.balance || 0) - amount);
        sourceAcc.transactions = sourceAcc.transactions || [];
        sourceAcc.transactions.unshift({
          id: 'at-src-' + Date.now(),
          date,
          desc: `${card.nickname} – ${desc}`,
          cat: 'Kart Borcu Ödeme',
          amount: round2(-Math.abs(amount)),
        });
      }

      // 3. Genel işlem defterine kaydet
      const newTx = {
        id: 'tx-' + Date.now(),
        date,
        desc,
        cat: 'Kart Borcu Ödeme',
        type: 'Kart Borcu Ödeme',
        status: 'Ödendi',
        amount: round2(amount),
        accountId: card.id,
        sourceAccountId: sourceAcc?.id || null,
      };

      if (s) {
        s.addTransaction(newTx);
        s.saveAccounts();
        s.saveTransactions();
        s.emit('accounts:changed', s.getAccounts());
        s.emit('transactions:changed', s.getTransactions());
      } else {
        if (window.tx) window.tx.unshift(newTx);
        if (window.saveAccounts) window.saveAccounts();
        if (window.saveTransactions) window.saveTransactions();
      }

      showToast(`"${desc}" işlemi başarıyla kaydedildi (${tryFmt(amount)}).`);
      if (window.closeModal) window.closeModal(payCardDebtDlg);
    });
  }

  /* -------------------------------------------------------------------------
     2. İKİ SÜTUNLU "ÖDEME & MUTABAKAT MASASI" MODALI (#settlementDeskDlg)
     ------------------------------------------------------------------------- */
  let activeDrawerItemId = null;

  function getActiveItem() {
    const s = getState();
    const items = s ? s.getLedgerItems() : window.ledgerItems || [];
    return items.find((x) => x.id === activeDrawerItemId) || null;
  }

  function clearPresetPillsSelection() {
    $$('.sd-preset-pill').forEach((p) => {
      p.classList.remove('is-active');
      p.setAttribute('aria-pressed', 'false');
    });
  }

  function formatDrawerAccountOption(acc) {
    if (acc.type === 'credit') {
      const avail = Math.max(0, Number(acc.limit || 0) - Number(acc.debt || 0));
      return `${acc.institution} - ${acc.nickname} • [ ${tryFmt(avail)} ]`;
    }
    return `${acc.institution} - ${acc.nickname} • [ ${tryFmt(acc.balance)} ]`;
  }

  function populateDrawerAccountDropdown(preferredAccountId = null) {
    const payAccountSelect = $('#payAccountSelect');
    if (!payAccountSelect) return;
    const s = getState();
    const accounts = s ? s.getAccounts() : window.accounts || [];
    const currentVal = preferredAccountId || payAccountSelect.value || accounts[0]?.id || '';
    const renderAccountDropdown =
      window.Vaulty?.ModalBase?.renderCustomAccountDropdown ||
      window.Vaulty?.Modal?.renderCustomAccountDropdown ||
      window.renderCustomAccountDropdown;
    if (renderAccountDropdown) {
      renderAccountDropdown(
        $('#payAccountDropdown'),
        payAccountSelect,
        accounts,
        currentVal
      );
    }
    checkDrawerBalanceWarning();
  }

  function checkDrawerBalanceWarning() {
    const payAccountWarning = $('#payAccountWarning');
    const payAccountSelect = $('#payAccountSelect');
    const payAmountInput = $('#payAmountInput');
    const editingPaymentIdInput = $('#editingPaymentId');

    if (!payAccountWarning || !payAccountSelect) return;
    const item = getActiveItem();
    const acc = getAccountById(payAccountSelect.value);
    const amount = parseMoney(payAmountInput?.value || '0');

    if (!item || !acc || isNaN(amount) || amount <= 0) {
      payAccountWarning.hidden = true;
      return;
    }

    if (item.kind === 'payable' && (acc.type === 'checking' || acc.type === 'cash')) {
      let availableBalance = Number(acc.balance || 0);
      const editId = editingPaymentIdInput?.value;
      if (editId) {
        const prevPm = (item.payments || []).find((p) => p.id === editId);
        if (prevPm && prevPm.accountId === acc.id) {
          availableBalance += Number(prevPm.amount || 0);
        }
      }
      payAccountWarning.hidden = !(amount > availableBalance);
    } else {
      payAccountWarning.hidden = true;
    }
  }

  function resetPaymentForm() {
    const item = getActiveItem();
    const isRec = item?.kind === 'receivable';

    const editingPaymentIdInput = $('#editingPaymentId');
    const payAmountInput = $('#payAmountInput');
    const payDateInput = $('#payDateInput');
    const payNoteInput = $('#payNoteInput');
    const payFormError = $('#payFormError');
    const payAccountWarning = $('#payAccountWarning');
    const payAccountLabel = $('#payAccountLabel');
    const amtLbl = $('#payAmountLabel');
    const paymentFormTitle = $('#paymentFormTitle');
    const submitPaymentBtn = $('#submitPaymentBtn');

    if (editingPaymentIdInput) editingPaymentIdInput.value = '';
    if (payAmountInput) payAmountInput.value = '';
    if (payDateInput) payDateInput.value = '2026-11-02';
    if (payNoteInput) payNoteInput.value = '';
    if (payFormError) payFormError.hidden = true;
    if (payAccountWarning) payAccountWarning.hidden = true;
    clearPresetPillsSelection();

    if (payAccountLabel) {
      payAccountLabel.textContent = isRec
        ? 'Paranın Aktarılacağı Hesap'
        : 'Paranın Çıkacağı Hesap / Kart';
    }
    if (amtLbl) amtLbl.textContent = 'Tutar (₺)';
    if (paymentFormTitle) paymentFormTitle.textContent = 'Yeni Ödeme / Tahsilat Girişi';
    if (submitPaymentBtn) submitPaymentBtn.textContent = 'Ödemeyi Kaydet / Yansıt';

    const s = getState();
    const accounts = s ? s.getAccounts() : window.accounts || [];
    const defaultLiquid = accounts.find((a) => a.type === 'checking' || a.type === 'cash') || accounts[0];
    populateDrawerAccountDropdown(defaultLiquid?.id || null);
  }

  function revertLedgerPaymentFromAsset(item, pm) {
    if (!pm || !pm.accountId) return;
    const acc = getAccountById(pm.accountId);
    const amt = round2(parseMoney(pm.amount || 0));
    const isRec = item.kind === 'receivable';

    if (acc && amt > 0) {
      if (isRec) {
        if (acc.type === 'credit') {
          acc.debt = round2(Number(acc.debt || 0) + amt);
        } else {
          acc.balance = round2(Number(acc.balance || 0) - amt);
        }
      } else {
        if (acc.type === 'credit') {
          acc.debt = Math.max(0, round2(Number(acc.debt || 0) - amt));
        } else {
          acc.balance = round2(Number(acc.balance || 0) + amt);
        }
      }
      if (pm.accountTxId && Array.isArray(acc.transactions)) {
        acc.transactions = acc.transactions.filter((t) => t.id !== pm.accountTxId);
      }
    }

    const s = getState();
    if (pm.globalTxId) {
      if (s && Array.isArray(s.tx)) {
        s.tx = s.tx.filter((t) => t && t.id !== pm.globalTxId);
      } else if (window.tx) {
        window.tx = window.tx.filter((t) => t && t.id !== pm.globalTxId);
      }
    }
  }

  function applyLedgerPaymentToAsset(item, pm) {
    const acc = getAccountById(pm.accountId);
    if (!acc) return;

    const amt = round2(parseMoney(pm.amount || 0));
    const isRec = item.kind === 'receivable';

    // 1. Varlık Bakiyesi / Kredi Kartı Borcu Güncellemesi
    if (isRec) {
      if (acc.type === 'credit') {
        acc.debt = Math.max(0, round2(Number(acc.debt || 0) - amt));
      } else {
        acc.balance = round2(Number(acc.balance || 0) + amt);
      }
    } else {
      if (acc.type === 'credit') {
        acc.debt = round2(Number(acc.debt || 0) + amt);
      } else {
        acc.balance = round2(Number(acc.balance || 0) - amt);
      }
    }

    // 2. Seçili Varlığın "Bu Hesaba Ait Son Hareketler" Tablosuna Kayıt Ekleme
    const accTxId = 'at-ld-' + pm.id + '-' + Date.now();
    const globalTxId = 'tx-ld-' + pm.id + '-' + Date.now();
    pm.accountTxId = accTxId;
    pm.globalTxId = globalTxId;
    pm.accountLabel = `${acc.institution} - ${acc.nickname}`;

    const descText = pm.note
      ? `${item.party} – ${pm.note}`
      : `${item.party} – ${isRec ? 'Alacak Tahsilatı' : 'Borç Ödemesi'}`;
    const catText = isRec ? 'Alacak Tahsilatı' : 'Borç Ödemesi';
    const signedAmount = isRec ? round2(Math.abs(amt)) : round2(-Math.abs(amt));

    acc.transactions = acc.transactions || [];
    acc.transactions.unshift({
      id: accTxId,
      date: pm.date,
      desc: descText,
      cat: catText,
      amount: signedAmount,
    });

    // 3. Küresel İşlemler Tablosuna Senkronize Kayıt
    const newTx = {
      id: globalTxId,
      date: pm.date,
      desc: descText,
      cat: catText,
      type: isRec ? 'Gelir' : 'Gider',
      status: 'Ödendi',
      amount: round2(Math.abs(amt)),
      accountId: acc.id,
    };

    const s = getState();
    if (s) {
      s.addTransaction(newTx);
    } else if (window.tx) {
      window.tx.unshift(newTx);
    }
  }

  function getLedgerPartyIconMeta(item) {
    if (window.Vaulty?.Tables?.getLedgerPartyIconMeta) {
      return window.Vaulty.Tables.getLedgerPartyIconMeta(item);
    }
    const cat = String(item.category || '').toLowerCase();
    const p = String(item.party || '').toLowerCase();
    const isRec = item.kind === 'receivable';

    if (cat.includes('vergi') || p.includes('vergi') || p.includes('gib')) {
      return {
        sdCls: 'sd-avatar--tax',
        svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M14 8H8"/><path d="M16 12H8"/><path d="M13 16H8"/></svg>`,
      };
    }
    if (cat.includes('finans') || p.includes('bank') || p.includes('kredi')) {
      return {
        sdCls: 'sd-avatar--bank',
        svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></svg>`,
      };
    }
    if (cat.includes('kira') || p.includes('emlak') || p.includes('mülk')) {
      return {
        sdCls: 'sd-avatar--home',
        svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
      };
    }
    return {
      sdCls: isRec ? 'sd-avatar--rec' : 'sd-avatar--pay',
      svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    };
  }

  function paidAmount(item) {
    if (!item || !Array.isArray(item.payments)) return 0;
    return round2(item.payments.reduce((s, p) => s + Number(p.amount || 0), 0));
  }

  function remainingAmount(item) {
    if (!item) return 0;
    return Math.max(0, round2(Number(item.total || 0) - paidAmount(item)));
  }

  function renderDrawerContent() {
    try {
      const item = getActiveItem();
      if (!item) return;

      const paid = paidAmount(item);
      const rem = remainingAmount(item);
      const pct = Math.min(100, Math.round((paid / item.total) * 100));
      const isRec = item.kind === 'receivable';
      const isStrictlyZero = rem <= 0.005;

      const iconMeta = getLedgerPartyIconMeta(item);
      const drawerAvatarEl = $('#drawerAvatar');
      if (drawerAvatarEl) {
        drawerAvatarEl.className = `sd-avatar ${iconMeta.sdCls}`;
        drawerAvatarEl.innerHTML = iconMeta.svg;
      }
      const partyEl = $('#drawerPartyName');
      if (partyEl) partyEl.textContent = item.party;

      const kindBadge = $('#sdKindBadge');
      if (kindBadge) {
        kindBadge.textContent = isRec ? 'Alacak' : 'Borç';
        kindBadge.className = `sd-kind-badge ${isRec ? 'sd-kind-badge--rec' : 'sd-kind-badge--pay'}`;
      }

      const metaEl = $('#drawerMeta');
      if (metaEl) metaEl.textContent = `${item.category} • Kayıt: ${item.createdAt} • Vade: ${item.dueDate}`;

      const remPillWrap = $('#sdRemPillWrap');
      const remLabel = $('#drawerRemLabel');
      const remBadge = $('#drawerRemBadge');
      if (isStrictlyZero) {
        if (remPillWrap) remPillWrap.className = 'sd-rem-pill sd-rem-pill--settled';
        if (remLabel) remLabel.textContent = 'Tamamı Kapandı';
        if (remBadge) {
          remBadge.textContent = '0 ₺';
          remBadge.hidden = true;
        }
      } else {
        if (remPillWrap) remPillWrap.className = 'sd-rem-pill';
        if (remLabel) remLabel.textContent = 'Kalan Bakiye:';
        if (remBadge) {
          remBadge.textContent = tryFmt(rem);
          remBadge.hidden = false;
        }
      }

      const progressPctEl = $('#drawerProgressPct');
      if (progressPctEl) progressPctEl.textContent = `%${pct} tamamlandı`;
      const progressRatioEl = $('#drawerProgressRatio');
      if (progressRatioEl) progressRatioEl.innerHTML = `${tryFmt(paid)} / <strong>${tryFmt(item.total)}</strong>`;

      const bar = $('#drawerProgressBar');
      if (bar) {
        bar.style.width = `${pct}%`;
        bar.className = `sd-progress-fill ${isRec ? 'dc-progress-fill--rec' : 'dc-progress-fill--pay'}`;
      }

      const payAccountLabel = $('#payAccountLabel');
      if (payAccountLabel) {
        payAccountLabel.textContent = isRec
          ? 'Paranın Aktarılacağı Hesap'
          : 'Paranın Çıkacağı Hesap / Kart';
      }

      const footerStatusText = $('#sdFooterStatusText');
      if (footerStatusText) {
        footerStatusText.textContent = 'Kaydedilen tahsilat seçilen hesabın bakiyesine anında eklenir';
      }

      const timelineCountEl = $('#timelineCount');
      if (timelineCountEl) timelineCountEl.textContent = `${(item.payments || []).length} taksit / kayıt`;
      const timelineHost = $('#paymentTimeline');

      if (!item.payments || item.payments.length === 0) {
        if (timelineHost) {
          timelineHost.innerHTML = `
            <div class="sd-empty-state">
              <div class="sd-empty-state__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
                </svg>
              </div>
              <span>Henüz bir ödeme kaydı bulunmuyor.</span>
            </div>`;
        }
      } else {
        const sortedPayments = [...item.payments].sort((a, b) => b.date.localeCompare(a.date));
        if (timelineHost) {
          timelineHost.innerHTML = `
            <div class="sd-timeline-track">
              ${sortedPayments
                .map((p) => {
                  const linkedAcc = p.accountId ? getAccountById(p.accountId) : null;
                  const accTag = linkedAcc
                    ? `${linkedAcc.institution} - ${linkedAcc.nickname}`
                    : p.accountLabel || 'Banka / Nakit Hesabı';
                  return `
                <article class="sd-tl-card" data-pmid="${p.id}">
                  <div class="sd-tl-card__row1">
                    <span class="sd-tl-card__amt mono">${tryFmt(p.amount)}</span>
                    <div class="sd-tl-card__right1">
                      <span class="sd-tl-card__date mono">${p.date}</span>
                      <div class="sd-tl-card__actions">
                        <button type="button" class="tl-icon-btn" data-edit-pm="${p.id}" title="Ödemeyi düzenle" aria-label="Ödemeyi düzenle">
                          <svg viewBox="0 0 24 24" width="13.5" height="13.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                          </svg>
                        </button>
                        <button type="button" class="tl-icon-btn tl-icon-btn--del" data-del-pm="${p.id}" title="Ödemeyi sil" aria-label="Ödemeyi sil">
                          <svg viewBox="0 0 24 24" width="13.5" height="13.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div class="sd-tl-card__row2">
                    <span class="sd-tl-card__acct">${esc(accTag)}</span>
                    <span class="sd-tl-card__note">${esc(p.note || 'Ödeme kaydı')}</span>
                  </div>
                </article>`;
                })
                .join('')}
            </div>`;

          timelineHost.querySelectorAll('[data-edit-pm]').forEach((btn) => {
            btn.addEventListener('click', () => startEditPayment(btn.dataset.editPm));
          });
          timelineHost.querySelectorAll('[data-del-pm]').forEach((btn) => {
            btn.addEventListener('click', () => deletePayment(btn.dataset.delPm));
          });
        }
      }
    } catch (err) {
      console.error('renderDrawerContent error:', err);
    }
  }

  function openDrawer(itemId, focusAmount = true) {
    activeDrawerItemId = itemId;
    resetPaymentForm();
    renderDrawerContent();

    const settlementDeskDlg = $('#settlementDeskDlg');
    if (window.openModal) window.openModal(settlementDeskDlg);

    if (focusAmount) {
      setTimeout(() => $('#payAmountInput')?.focus(), 50);
    }
  }

  function closeDrawer() {
    activeDrawerItemId = null;
    const settlementDeskDlg = $('#settlementDeskDlg');
    if (window.closeModal) window.closeModal(settlementDeskDlg);
  }

  function startEditPayment(pmId) {
    const item = getActiveItem();
    if (!item) return;
    const pm = (item.payments || []).find((x) => x.id === pmId);
    if (!pm) return;

    const editingPaymentIdInput = $('#editingPaymentId');
    const payAmountInput = $('#payAmountInput');
    const payDateInput = $('#payDateInput');
    const payNoteInput = $('#payNoteInput');
    const payFormError = $('#payFormError');
    const paymentFormTitle = $('#paymentFormTitle');
    const submitPaymentBtn = $('#submitPaymentBtn');

    if (editingPaymentIdInput) editingPaymentIdInput.value = pm.id;
    if (payAmountInput) payAmountInput.value = pm.amount;
    if (payDateInput) payDateInput.value = pm.date;
    if (payNoteInput) payNoteInput.value = pm.note || '';

    const s = getState();
    const accounts = s ? s.getAccounts() : window.accounts || [];
    populateDrawerAccountDropdown(pm.accountId || accounts[0]?.id);

    if (payFormError) payFormError.hidden = true;
    clearPresetPillsSelection();
    if (paymentFormTitle) paymentFormTitle.textContent = 'Ödeme Kaydını Düzenle';
    if (submitPaymentBtn) submitPaymentBtn.textContent = 'Ödemeyi Kaydet / Yansıt';
    checkDrawerBalanceWarning();
    payAmountInput?.focus();
  }

  async function deletePayment(pmId) {
    const item = getActiveItem();
    if (!item) return;
    const pm = (item.payments || []).find((x) => x.id === pmId);
    if (!pm) return;

    let ok = false;
    if (window.Vaulty?.confirm) {
      ok = await window.Vaulty.confirm({
        title: 'Ödeme Kaydını Sil',
        message: `Bu ödeme kaydını (${tryFmt(pm.amount)}) silmek istediğinize emin misiniz?`,
        subMessage: 'İlgili hesap bakiyesine tutar otomatik olarak iade edilecektir.',
        confirmText: 'Kaydı Sil',
        cancelText: 'Vazgeç',
        type: 'danger',
      });
    } else {
      ok = confirm(`Bu ödeme kaydını (${tryFmt(pm.amount)}) silmek istediğinize emin misiniz?\nİlgili hesap bakiyesine tutar otomatik olarak iade edilecektir.`);
    }
    if (!ok) return;

    revertLedgerPaymentFromAsset(item, pm);
    item.payments = (item.payments || []).filter((x) => x.id !== pmId);

    const s = getState();
    if (s) {
      s.saveLedger();
      s.saveAccounts();
      s.saveTransactions();
      s.emit('ledger:changed', s.getLedgerItems());
      s.emit('accounts:changed', s.getAccounts());
      s.emit('transactions:changed', s.getTransactions());
    } else {
      if (window.saveLedger) window.saveLedger();
      if (window.saveAccounts) window.saveAccounts();
      if (window.saveTransactions) window.saveTransactions();
    }

    resetPaymentForm();
    renderDrawerContent();
    showToast('Ödeme kaydı silindi ve ilgili hesap bakiyesi güncellendi.');
  }

  function initSettlementDrawerEvents() {
    const settlementDeskDlg = $('#settlementDeskDlg');
    const partialPaymentForm = $('#partialPaymentForm');
    const payAmountInput = $('#payAmountInput');
    const payAccountSelect = $('#payAccountSelect');
    const cancelSettlementDeskBtn = $('#cancelSettlementDeskBtn');
    const editingPaymentIdInput = $('#editingPaymentId');
    const payDateInput = $('#payDateInput');
    const payNoteInput = $('#payNoteInput');
    const payFormError = $('#payFormError');

    $('#closeDrawerBtn')?.addEventListener('click', closeDrawer);
    cancelSettlementDeskBtn?.addEventListener('click', closeDrawer);
    settlementDeskDlg?.addEventListener('mousedown', (e) => {
      if (e.target === settlementDeskDlg) {
        closeDrawer();
      }
    });

    payAmountInput?.addEventListener('input', () => {
      clearPresetPillsSelection();
      checkDrawerBalanceWarning();
    });
    payAccountSelect?.addEventListener('change', checkDrawerBalanceWarning);

    // Preset pills ("Tümü", "Yarısı", "1.000 ₺", "5.000 ₺")
    $$('.sd-preset-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        const item = getActiveItem();
        if (!item) return;
        const editId = editingPaymentIdInput?.value;
        const otherPaymentsSum = (item.payments || [])
          .filter((p) => p.id !== editId)
          .reduce((s, p) => s + Number(p.amount || 0), 0);
        const maxRem = Math.max(0, round2(item.total - otherPaymentsSum));

        const preset = pill.dataset.preset;
        let val = 0;
        if (preset === 'all') {
          val = maxRem;
        } else if (preset === 'half') {
          val = round2(maxRem * 0.5);
        } else {
          const fixedNum = parseMoney(preset);
          val = maxRem > 0 ? Math.min(maxRem, fixedNum) : fixedNum;
        }

        clearPresetPillsSelection();
        pill.classList.add('is-active');
        pill.setAttribute('aria-pressed', 'true');

        if (val > 0 && payAmountInput) {
          payAmountInput.value = val;
          if (payFormError) payFormError.hidden = true;
          checkDrawerBalanceWarning();
          payAmountInput.focus();
        }
      });
    });

    partialPaymentForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const item = getActiveItem();
      if (!item) return;

      const amount = parseMoney(payAmountInput?.value);
      const date = payDateInput?.value || '2026-11-02';
      const accountId = payAccountSelect?.value;
      const selectedAcc = getAccountById(accountId);
      const defaultNote = item.kind === 'receivable' ? 'Alacak Tahsilatı' : 'Borç Ödemesi';
      const note = payNoteInput?.value.trim() || defaultNote;
      const editId = editingPaymentIdInput?.value;

      const otherPaymentsSum = (item.payments || [])
        .filter((p) => p.id !== editId)
        .reduce((s, p) => s + Number(p.amount || 0), 0);
      const maxAllowed = Math.max(0, round2(item.total - otherPaymentsSum));

      if (!amount || amount <= 0) {
        if (payFormError) {
          payFormError.textContent = 'Lütfen geçerli bir tutar girin.';
          payFormError.hidden = false;
        }
        payAmountInput?.focus();
        return;
      }

      if (amount > maxAllowed + 0.005) {
        if (payFormError) {
          payFormError.textContent = `Tutar kalan bakiyeyi (${tryFmt(maxAllowed)}) aşamaz.`;
          payFormError.hidden = false;
        }
        payAmountInput?.focus();
        return;
      }

      if (!selectedAcc) {
        if (payFormError) {
          payFormError.textContent = 'Lütfen işlemin yansıtılacağı bir hesap veya kart seçin.';
          payFormError.hidden = false;
        }
        payAccountSelect?.focus();
        return;
      }

      item.payments = item.payments || [];

      if (editId) {
        const target = item.payments.find((p) => p.id === editId);
        if (target) {
          revertLedgerPaymentFromAsset(item, target);
          target.amount = round2(amount);
          target.date = date;
          target.note = note;
          target.accountId = selectedAcc.id;
          applyLedgerPaymentToAsset(item, target);
        }
      } else {
        const newPm = {
          id: 'pm-' + Date.now(),
          date,
          amount: round2(amount),
          note,
          accountId: selectedAcc.id,
        };
        item.payments.push(newPm);
        applyLedgerPaymentToAsset(item, newPm);
      }

      const s = getState();
      if (s) {
        s.setSelectedAccountId(selectedAcc.id);
        s.saveLedger();
        s.saveAccounts();
        s.saveTransactions();
        s.emit('ledger:changed', s.getLedgerItems());
        s.emit('accounts:changed', s.getAccounts());
        s.emit('transactions:changed', s.getTransactions());
      } else {
        window.selectedAccountId = selectedAcc.id;
        if (window.saveLedger) window.saveLedger();
        if (window.saveAccounts) window.saveAccounts();
        if (window.saveTransactions) window.saveTransactions();
      }

      resetPaymentForm();
      renderDrawerContent();

      const actionVerb = item.kind === 'receivable' ? 'tahsil edildi ve aktarıldı' : 'ödendi ve düşüldü';
      showToast(`${tryFmt(amount)} "${selectedAcc.nickname}" varlığına ${actionVerb}.`);
    });
  }

  function init() {
    initPayCardDebtEvents();
    initSettlementDrawerEvents();
  }

  const DebtPayDesk = {
    init,
    calculateCardMetrics,
    updateAutoDescription,
    updatePayCardSubmitButton,
    checkOverdraftGuard,
    selectPaymentPill,
    refreshPayCardDeskMetrics,
    renderPayCardSelectors,
    openPayCardDebtModal,
    openDrawer,
    closeDrawer,
    renderDrawerContent,
    startEditPayment,
    deletePayment,
    applyLedgerPaymentToAsset,
    revertLedgerPaymentFromAsset,
  };

  window.Vaulty = window.Vaulty || {};
  window.Vaulty.DebtPayDesk = DebtPayDesk;
  window.Vaulty.Modals = window.Vaulty.Modals || {};
  window.Vaulty.Modals.DebtPayDesk = DebtPayDesk;

  // Backwards compatibility globals
  window.calculateCardMetrics = calculateCardMetrics;
  window.refreshPayCardDeskMetrics = refreshPayCardDeskMetrics;
  window.selectPaymentPill = selectPaymentPill;
  window.openPayCardDebtModal = openPayCardDebtModal;
  window.openDrawer = openDrawer;
  window.closeDrawer = closeDrawer;
  window.renderDrawerContent = renderDrawerContent;
  window.startEditPayment = startEditPayment;
  window.deletePayment = deletePayment;
  window.applyLedgerPaymentToAsset = applyLedgerPaymentToAsset;
  window.revertLedgerPaymentFromAsset = revertLedgerPaymentFromAsset;
})();

