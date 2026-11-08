/* =========================================================================
   VAULTY COMPONENT: RECURRING TRANSACTIONS ENGINE (Tekrarlayan İşlem Motoru)
   components/recurring/recurring-engine.js
   ========================================================================= */

(() => {
  'use strict';

  if (window.Vaulty?.ModalBase?.mountModal) {
    window.Vaulty.ModalBase.mountModal('reviewRecurringDlg', `
<!-- =====================================================================
     MODAL: "VADESİ GELEN SABİT ÖDEMELER & ABONELİKLER" (İnceleme & Onay Masası)
     ===================================================================== -->
<div id="reviewRecurringDlg" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="reviewRecurringTitle" hidden style="display: none !important; pointer-events: none !important;">
  <div class="modal-box modal-box--recurring">
    <header class="rec-modal-header">
      <div class="rec-modal-titles">
        <div class="rec-header-badge">
          <span class="rec-badge-dot"></span>
          <span>Abonelik &amp; Sabit Gider Motoru</span>
        </div>
        <h3 class="rec-modal-title" id="reviewRecurringTitle">Vadesi Gelen Sabit Ödemeler</h3>
        <p class="rec-modal-sub">Bekleyen periyodik harcamalarınızı tek tek inceleyin, onaylayın veya bu ay için pas geçin</p>
      </div>
      <button type="button" class="rec-modal-close" id="closeReviewRecurringIcon" data-action="close-modal" aria-label="Kapat" title="Kapat">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </header>

    <div class="rec-modal-body">
      <div class="rec-items-list" id="recItemsList"></div>
    </div>

    <footer class="modal-box__footer rec-modal-footer">
      <div class="rec-footer-total">
        <span class="rec-total-label">Onay Bekleyen Toplam:</span>
        <span class="rec-total-val mono" id="recPendingTotalVal">0,00 ₺</span>
      </div>
      <div class="rec-footer-actions">
        <button type="button" class="btn btn--ghost" id="cancelReviewRecurringBtn" data-action="close-modal">Kapat</button>
        <button type="button" class="rec-btn-approve-all" id="recModalApproveAllBtn" data-action="approve-all-recurring">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>Tümünü Onayla</span>
        </button>
      </div>
    </footer>
  </div>
</div>
`);
  }

  const TR_MONTHS = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  function formatDateTr(isoStr) {
    if (!isoStr || typeof isoStr !== 'string') return '-';
    const parts = isoStr.split('-');
    if (parts.length !== 3) return isoStr;
    const y = parts[0];
    const m = Number(parts[1]) - 1;
    const d = Number(parts[2]);
    if (isNaN(m) || m < 0 || m > 11 || isNaN(d)) return isoStr;
    return `${d} ${TR_MONTHS[m]} ${y}`;
  }

  function calculateNextDueDate(fromDateStr, interval = 'monthly', targetDay = null) {
    if (!fromDateStr) fromDateStr = new Date().toISOString().slice(0, 10);
    const parts = fromDateStr.split('-').map(Number);
    const y = parts[0];
    const m = parts[1]; // 1-indexed
    const d = parts[2];

    if (interval === 'weekly') {
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() + 7);
      return dt.toISOString().slice(0, 10);
    }

    if (interval === 'yearly') {
      const nextYear = y + 1;
      const maxDays = new Date(nextYear, m, 0).getDate();
      const day = Math.min(targetDay || d, maxDays);
      return `${nextYear}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // Monthly
    const dayNum = Number(targetDay) || d || 1;
    let targetYear = y;
    let targetMonth = m - 1; // 0-indexed

    if (dayNum > d) {
      // In current month, target day hasn't arrived yet
      const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
      const actualDay = Math.min(dayNum, maxDays);
      return `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`;
    } else {
      // Advance to next month
      targetMonth += 1;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear += 1;
      }
      const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
      const actualDay = Math.min(dayNum, maxDays);
      return `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(actualDay).padStart(2, '0')}`;
    }
  }

  function getDueRecurringTransactions() {
    const State = window.Vaulty?.State;
    if (!State || !Array.isArray(State.tx)) return [];

    const today = new Date().toISOString().slice(0, 10);
    return State.tx.filter((t) => {
      if (!t || !t.isRecurring) return false;
      if (!t.nextDueDate) return false;
      if (t.recurringEndDate && t.nextDueDate > t.recurringEndDate) return false;
      return t.nextDueDate <= today;
    });
  }

  function renderDashboardAlertBanner() {
    const banner = document.getElementById('recurringAlertBanner');
    if (!banner) return;

    const dueList = getDueRecurringTransactions();
    if (dueList.length === 0) {
      banner.hidden = true;
      banner.setAttribute('hidden', '');
      banner.style.setProperty('display', 'none', 'important');
      banner.innerHTML = '';
      return;
    }

    const State = window.Vaulty?.State;
    const tryFmt = State?.tryFmt || ((v) => `${Number(v).toFixed(2)} ₺`);
    const totalAmount = dueList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    banner.innerHTML = `
      <div class="rec-banner-left">
        <div class="rec-banner-icon-pulse" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
        </div>
        <div class="rec-banner-text">
          <span class="rec-banner-title">
            Vadesi gelen <span class="rec-badge-count">${dueList.length}</span> adet sabit ödemeniz var
          </span>
          <span class="rec-banner-sub">
            Toplam <strong>${tryFmt(totalAmount)}</strong> tutarında periyodik harcama onayınızı bekliyor
          </span>
        </div>
      </div>

      <div class="rec-banner-actions">
        <button type="button" class="rec-btn-review" data-action="open-review-recurring">
          <span>İncele</span>
        </button>
        <button type="button" class="rec-btn-approve-all" data-action="approve-all-recurring">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>Tümünü Onayla</span>
        </button>
      </div>
    `;

    banner.hidden = false;
    banner.removeAttribute('hidden');
    banner.style.setProperty('display', 'flex', 'important');
  }

  function openReviewModal() {
    const dlg = document.getElementById('reviewRecurringDlg');
    if (!dlg) return;

    renderReviewModalList();

    if (window.Vaulty?.ModalBase?.openModal) {
      window.Vaulty.ModalBase.openModal(dlg);
    } else if (window.openModal) {
      window.openModal(dlg);
    } else {
      dlg.classList.add('is-open');
      dlg.hidden = false;
      dlg.removeAttribute('hidden');
      dlg.style.setProperty('display', 'flex', 'important');
      dlg.style.setProperty('pointer-events', 'auto', 'important');
    }
  }

  function renderReviewModalList() {
    const listEl = document.getElementById('recItemsList');
    const totalEl = document.getElementById('recPendingTotalVal');
    const dlg = document.getElementById('reviewRecurringDlg');
    if (!listEl) return;

    const State = window.Vaulty?.State;
    const { esc, tryFmt } = State || { esc: (s) => s, tryFmt: (v) => `${Number(v).toFixed(2)} ₺` };

    const dueList = getDueRecurringTransactions();

    if (dueList.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center;padding:32px 16px;color:#64748B;">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 12px;display:block;">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <strong style="color:#0F172A;font-size:15px;display:block;margin-bottom:4px;">Harika! Vadesi gelen ödeme kalmadı</strong>
          <span>Tüm tekrarlayan işlemleriniz güncel ve kontrol altında.</span>
        </div>
      `;
      if (totalEl) totalEl.textContent = tryFmt(0);
      if (dlg && dlg.classList.contains('is-open')) {
        setTimeout(() => {
          if (window.Vaulty?.ModalBase?.closeModal) {
            window.Vaulty.ModalBase.closeModal(dlg);
          } else if (window.closeModal) {
            window.closeModal(dlg);
          }
        }, 1200);
      }
      return;
    }

    const totalAmount = dueList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    if (totalEl) totalEl.textContent = tryFmt(totalAmount);

    listEl.innerHTML = dueList.map((rule) => {
      const acc = State?.getAccountById(rule.accountId);
      const accName = acc ? acc.nickname : 'Banka / Nakit';
      const isInc = rule.type === 'Gelir';
      const intervalLabel = rule.recurringInterval === 'weekly' ? 'Haftalık' : (rule.recurringInterval === 'yearly' ? 'Yıllık' : 'Aylık');
      const today = new Date().toISOString().slice(0, 10);
      const isOverdue = rule.nextDueDate && rule.nextDueDate < today;
      const isToday = rule.nextDueDate && rule.nextDueDate === today;

      let dueBadgeHtml = '';
      if (isOverdue) {
        dueBadgeHtml = `<span class="rec-due-wrap"><span class="rec-due-label"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Vade:</span> <span class="rec-status-pill is-overdue mono">${formatDateTr(rule.nextDueDate)} (Gecikmiş)</span></span>`;
      } else if (isToday) {
        dueBadgeHtml = `<span class="rec-due-wrap"><span class="rec-due-label"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>Vade:</span> <span class="rec-status-pill is-today mono">Bugün</span></span>`;
      } else {
        dueBadgeHtml = `<span class="rec-due-wrap"><span class="rec-due-label"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>Vade:</span> <strong class="rec-due-date-val mono">${formatDateTr(rule.nextDueDate)}</strong></span>`;
      }

      return `
        <div class="rec-item-card" data-rec-id="${esc(rule.id)}">
          <div class="rec-item-top">
            <div class="rec-item-left">
              <div class="rec-item-avatar ${isInc ? 'is-inc' : 'is-exp'}" aria-hidden="true">
                ${isInc
                  ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`
                  : `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>`}
              </div>
              <div class="rec-item-headline">
                <strong class="rec-item-title" title="${esc(rule.desc)}">${esc(rule.desc)}</strong>
                <span class="rec-cat-pill">${esc(rule.cat || 'Sabit Gider')}</span>
                <span class="rec-interval-pill">${intervalLabel}</span>
              </div>
            </div>
            <div class="rec-item-amount mono ${isInc ? 'is-pos' : 'is-neg'}">
              ${isInc ? '+' : '−'}${tryFmt(rule.amount)}
            </div>
          </div>

          <div class="rec-item-bottom">
            <div class="rec-item-meta">
              <span class="rec-acc-pill" title="${esc(accName)}">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px;"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                ${esc(accName)}
              </span>
              <span class="rec-meta-dot">•</span>
              ${dueBadgeHtml}
            </div>

            <div class="rec-item-actions">
              <button type="button" class="rec-btn-skip" data-action="skip-recurring" data-rec-id="${esc(rule.id)}" title="Bu Ay Pas Geç">
                Bu Ay Pas Geç
              </button>
              <button type="button" class="rec-btn-approve" data-action="approve-recurring" data-rec-id="${esc(rule.id)}" title="Onayla ve Hesaba İşle">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Onayla</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function approveRecurring(txId) {
    const State = window.Vaulty?.State;
    if (!State) return false;

    const rule = State.tx.find((t) => t && t.id === txId);
    if (!rule) return false;

    const amt = State.round2(State.parseMoney(rule.amount || 0));
    const acc = State.getAccountById(rule.accountId);
    const dueDate = rule.nextDueDate || new Date().toISOString().slice(0, 10);

    // 1. Resmi hareketler listesine yeni bir işlem kopyası kaydet
    const occurrenceTx = {
      id: `tx-rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: dueDate,
      desc: rule.desc,
      cat: rule.cat || 'Abonelik',
      type: rule.type || 'Gider',
      status: 'Ödendi',
      amount: amt,
      accountId: rule.accountId,
      isRecurring: false,
      recurringParentId: rule.id,
    };

    // 2. İlgili hesap bakiyesinden düş / kredi kartı borcuna ekle
    if (acc && amt > 0) {
      if (acc.type === 'credit') {
        if (rule.type === 'Gider') {
          acc.debt = State.round2(Number(acc.debt || 0) + amt);
        } else {
          acc.debt = Math.max(0, State.round2(Number(acc.debt || 0) - amt));
        }
      } else {
        if (rule.type === 'Gelir') {
          acc.balance = State.round2(Number(acc.balance || 0) + amt);
        } else {
          acc.balance = State.round2(Number(acc.balance || 0) - amt);
        }
      }

      acc.transactions = acc.transactions || [];
      acc.transactions.unshift({
        id: 'at-' + Date.now(),
        date: dueDate,
        desc: rule.desc,
        cat: rule.cat || 'Abonelik',
        amount: rule.type === 'Gelir' ? State.round2(amt) : State.round2(-amt),
      });
    }

    State.tx.unshift(occurrenceTx);

    // 3. Ana kuralın nextDueDate değerini bir sonraki döneme ötele
    rule.nextDueDate = calculateNextDueDate(rule.nextDueDate, rule.recurringInterval, rule.recurringDay);
    if (rule.recurringEndDate && rule.nextDueDate > rule.recurringEndDate) {
      rule.isRecurring = false;
    }

    // 4. Kalıcı olarak kaydet
    State.saveAccounts();
    State.saveTransactions();

    State.showToast(`"${rule.desc}" (${State.tryFmt(amt)}) onaylandı ve "${acc ? acc.nickname : 'hesap'}" bakiyesine işlendi.`);

    renderReviewModalList();
    renderDashboardAlertBanner();
    return true;
  }

  function skipRecurring(txId) {
    const State = window.Vaulty?.State;
    if (!State) return false;

    const rule = State.tx.find((t) => t && t.id === txId);
    if (!rule) return false;

    const prevDueDate = rule.nextDueDate;
    // Kaydetmeden bir sonraki periyoda ötele
    rule.nextDueDate = calculateNextDueDate(rule.nextDueDate, rule.recurringInterval, rule.recurringDay);
    if (rule.recurringEndDate && rule.nextDueDate > rule.recurringEndDate) {
      rule.isRecurring = false;
    }

    State.saveTransactions();
    State.showToast(`"${rule.desc}" bu ay pas geçildi. Sonraki vade: ${formatDateTr(rule.nextDueDate)}`);

    renderReviewModalList();
    renderDashboardAlertBanner();
    return true;
  }

  function approveAllRecurring() {
    const State = window.Vaulty?.State;
    if (!State) return false;

    const dueList = getDueRecurringTransactions();
    if (dueList.length === 0) return false;

    let approvedCount = 0;
    dueList.forEach((rule) => {
      const amt = State.round2(State.parseMoney(rule.amount || 0));
      const acc = State.getAccountById(rule.accountId);
      const dueDate = rule.nextDueDate || new Date().toISOString().slice(0, 10);

      const occurrenceTx = {
        id: `tx-rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date: dueDate,
        desc: rule.desc,
        cat: rule.cat || 'Abonelik',
        type: rule.type || 'Gider',
        status: 'Ödendi',
        amount: amt,
        accountId: rule.accountId,
        isRecurring: false,
        recurringParentId: rule.id,
      };

      if (acc && amt > 0) {
        if (acc.type === 'credit') {
          if (rule.type === 'Gider') {
            acc.debt = State.round2(Number(acc.debt || 0) + amt);
          } else {
            acc.debt = Math.max(0, State.round2(Number(acc.debt || 0) - amt));
          }
        } else {
          if (rule.type === 'Gelir') {
            acc.balance = State.round2(Number(acc.balance || 0) + amt);
          } else {
            acc.balance = State.round2(Number(acc.balance || 0) - amt);
          }
        }

        acc.transactions = acc.transactions || [];
        acc.transactions.unshift({
          id: 'at-' + Date.now(),
          date: dueDate,
          desc: rule.desc,
          cat: rule.cat || 'Abonelik',
          amount: rule.type === 'Gelir' ? State.round2(amt) : State.round2(-amt),
        });
      }

      State.tx.unshift(occurrenceTx);

      rule.nextDueDate = calculateNextDueDate(rule.nextDueDate, rule.recurringInterval, rule.recurringDay);
      if (rule.recurringEndDate && rule.nextDueDate > rule.recurringEndDate) {
        rule.isRecurring = false;
      }
      approvedCount++;
    });

    State.saveAccounts();
    State.saveTransactions();

    State.showToast(`Vadesi gelen ${approvedCount} adet sabit ödeme onaylandı ve hesaplara işlendi.`);

    const dlg = document.getElementById('reviewRecurringDlg');
    if (dlg) {
      if (window.Vaulty?.ModalBase?.closeModal) {
        window.Vaulty.ModalBase.closeModal(dlg);
      } else if (window.closeModal) {
        window.closeModal(dlg);
      }
    }

    renderDashboardAlertBanner();
    return true;
  }

  let bgTimer = null;
  function startBackgroundCheck() {
    if (bgTimer) clearInterval(bgTimer);
    let lastCheckedDate = new Date().toISOString().slice(0, 10);
    bgTimer = setInterval(() => {
      const today = new Date().toISOString().slice(0, 10);
      const isNewDay = today !== lastCheckedDate;
      if (isNewDay) {
        lastCheckedDate = today;
      }
      renderDashboardAlertBanner();
      if (isNewDay) {
        const dueList = getDueRecurringTransactions();
        if (dueList.length > 0 && window.Vaulty?.State?.showToast) {
          window.Vaulty.State.showToast(`Yeni gün başladı: ${dueList.length} adet vadesi gelen sabit gider onayınızı bekliyor.`);
        }
      }
    }, 60 * 1000);
  }

  function init() {
    renderDashboardAlertBanner();
    startBackgroundCheck();

    const State = window.Vaulty?.State;
    if (State && typeof State.on === 'function') {
      State.on('transactions:changed', () => {
        renderDashboardAlertBanner();
        const dlg = document.getElementById('reviewRecurringDlg');
        if (dlg && dlg.classList.contains('is-open')) {
          renderReviewModalList();
        }
      });

      State.on('accounts:changed', () => {
        renderDashboardAlertBanner();
      });
    }

    // Modal close button bindings
    document.getElementById('closeReviewRecurringIcon')?.addEventListener('click', () => {
      const dlg = document.getElementById('reviewRecurringDlg');
      if (dlg && window.Vaulty?.ModalBase?.closeModal) {
        window.Vaulty.ModalBase.closeModal(dlg);
      }
    });

    document.getElementById('cancelReviewRecurringBtn')?.addEventListener('click', () => {
      const dlg = document.getElementById('reviewRecurringDlg');
      if (dlg && window.Vaulty?.ModalBase?.closeModal) {
        window.Vaulty.ModalBase.closeModal(dlg);
      }
    });
  }

  const RecurringEngine = {
    init,
    formatDateTr,
    calculateNextDueDate,
    getDueRecurringTransactions,
    renderDashboardAlertBanner,
    openReviewModal,
    renderReviewModalList,
    approveRecurring,
    skipRecurring,
    approveAllRecurring,
    startBackgroundCheck,
  };

  window.Vaulty = window.Vaulty || {};
  window.Vaulty.RecurringEngine = RecurringEngine;
})();

