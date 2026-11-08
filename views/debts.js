/* =========================================================================
   VAULTY VIEW: DEBTS (Borç & Alacak Defteri Görünümü)
   ========================================================================= */
(() => {
  const { State } = window.Vaulty;
  const { tryFmt, round2, remainingAmount, isArchived } = State;

  function renderDebtKpis() {
    try {
      const activeRecs = State.ledgerItems.filter((x) => x && x.kind === 'receivable' && !isArchived(x));
      const activePays = State.ledgerItems.filter((x) => x && x.kind === 'payable' && !isArchived(x));

      const totalRec = round2(activeRecs.reduce((s, x) => s + remainingAmount(x), 0));
      const totalPay = round2(activePays.reduce((s, x) => s + remainingAmount(x), 0));
      const netDiff = round2(totalRec - totalPay);

      const upcomingRecCount = activeRecs.filter((x) => State.daysTo(x.dueDate) <= 14).length;
      const due30Pay = round2(
        activePays
          .filter((x) => State.daysTo(x.dueDate) <= 30)
          .reduce((s, x) => s + remainingAmount(x), 0)
      );

      const isPositive = netDiff >= 0;

      const kpiHost = document.getElementById('dcKpis');
      if (kpiHost) {
        kpiHost.innerHTML = `
          <article class="dc-kpi-card dc-kpi-card--debt">
            <div class="dc-kpi-card__top">
              <span class="dc-kpi-card__label">Toplam Alacaklarım</span>
            </div>
            <span class="dc-kpi-watermark dc-kpi-watermark--emerald" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
              </svg>
            </span>
            <div class="dc-kpi-card__value mono">${tryFmt(totalRec)}</div>
            <span class="dc-kpi-badge dc-kpi-badge--blue mono">
              ${activeRecs.length} aktif borçlu • ${upcomingRecCount} yaklaşan tahsilat
            </span>
          </article>

          <article class="dc-kpi-card dc-kpi-card--debt">
            <div class="dc-kpi-card__top">
              <span class="dc-kpi-card__label">Toplam Borçlarım</span>
            </div>
            <span class="dc-kpi-watermark dc-kpi-watermark--rose" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>
              </svg>
            </span>
            <div class="dc-kpi-card__value mono">${tryFmt(totalPay)}</div>
            <span class="dc-kpi-badge dc-kpi-badge--rose mono">
              30 gün içinde: ${tryFmt(due30Pay)}
            </span>
          </article>

          <article class="dc-kpi-card dc-kpi-card--debt">
            <div class="dc-kpi-card__top">
              <span class="dc-kpi-card__label">Net Bakiye Durumu</span>
            </div>
            <span class="dc-kpi-watermark dc-kpi-watermark--indigo" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
                <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
              </svg>
            </span>
            <div class="dc-kpi-card__value mono ${isPositive ? 'is-pos' : 'is-neg'}">
              ${isPositive ? '+' : '−'}${tryFmt(Math.abs(netDiff))}
            </div>
            <span class="dc-kpi-badge ${isPositive ? 'dc-kpi-badge--net-pos' : 'dc-kpi-badge--net-neg'} mono">
              ${isPositive ? '▲ Alacak fazlası (Pozitif)' : '▼ Borç fazlası (Net Yükümlülük)'}
            </span>
          </article>
        `;
      }
    } catch (err) {
      console.error('renderDebtKpis error:', err);
    }
  }

  function syncSegmentCounts() {
    const allCount = State.ledgerItems.length;
    const payCount = State.ledgerItems.filter((x) => x && x.kind === 'payable').length;
    const recCount = State.ledgerItems.filter((x) => x && x.kind === 'receivable').length;

    const allEl = document.getElementById('segCountAll');
    if (allEl) allEl.textContent = allCount;
    const pEl = document.getElementById('segCountPay');
    if (pEl) pEl.textContent = payCount;
    const rEl = document.getElementById('segCountRec');
    if (rEl) rEl.textContent = recCount;
  }

  function syncSortDropdown() {
    const sortDropdown = document.getElementById('dcSortDropdown');
    const sortSelect = document.getElementById('dcSortSelect');
    if (sortDropdown && sortSelect) {
      if (window.Vaulty.Views?.Transactions?.renderTxFilterPopover) {
        window.Vaulty.Views.Transactions.renderTxFilterPopover(sortDropdown, sortSelect);
      }
    }
  }

  function render() {
    renderDebtKpis();
    syncSegmentCounts();
    syncSortDropdown();
    window.Vaulty.Tables?.renderDebtList?.();
  }

  function init() {
    document.querySelectorAll('[data-seg]').forEach((btn) => {
      btn.addEventListener('click', () => {
        State.activeSegment = btn.dataset.seg || 'all';
        document.querySelectorAll('[data-seg]').forEach((b) => {
          const on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-selected', String(on));
        });
        window.Vaulty.Tables?.renderDebtList?.();
      });
    });

    // Note: openNewDebtModalBtn is delegated centrally in core/events.js.
    syncSortDropdown();

    State.on('ledger:changed', () => {
      renderDebtKpis();
      syncSegmentCounts();
      window.Vaulty.Tables?.renderDebtList?.();
    });

    State.on('accounts:changed', () => {
      renderDebtKpis();
      syncSegmentCounts();
    });
  }

  const DebtsView = {
    init,
    render,
    renderDebtKpis,
    syncSegmentCounts,
    syncSortDropdown,
  };

  window.Vaulty = window.Vaulty || {};
  window.Vaulty.Views = window.Vaulty.Views || {};
  window.Vaulty.Views.Debts = DebtsView;
})();

