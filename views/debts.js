/* =========================================================================
   VAULTY VIEW: DEBTS (Borç & Alacak Defteri Görünümü)
   ========================================================================= */
(() => {
  const { State } = window.Vaulty;
  const { esc, tryFmt, round2, remainingAmount, paidAmount, isArchived, formatDuePill } = State;

  function renderDebtKpis() {
    try {
      const activeRecs = State.ledgerItems.filter((x) => x && x.kind === 'receivable' && !isArchived(x));
      const activePays = State.ledgerItems.filter((x) => x && x.kind === 'payable' && !isArchived(x));

      const totalRec = round2(activeRecs.reduce((s, x) => s + remainingAmount(x), 0));
      const totalPay = round2(activePays.reduce((s, x) => s + remainingAmount(x), 0));
      const netDiff = round2(totalRec - totalPay);

      const recOrig = round2(activeRecs.reduce((s, x) => s + Number(x.total || 0), 0));
      const payOrig = round2(activePays.reduce((s, x) => s + Number(x.total || 0), 0));
      const recCollected = round2(Math.max(0, recOrig - totalRec));
      const paySettled = round2(Math.max(0, payOrig - totalPay));
      const recProgressPct = recOrig > 0 ? Math.round((recCollected / recOrig) * 100) : 0;
      const payProgressPct = payOrig > 0 ? Math.round((paySettled / payOrig) * 100) : 0;

      const volume = totalRec + totalPay;
      const recShare = volume > 0 ? Math.round((totalRec / volume) * 100) : 50;
      const payShare = volume > 0 ? Math.round((totalPay / volume) * 100) : 50;

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
          <article class="dc-kpi-card dc-kpi-card--debt tx-kpi-card tx-kpi-card--income">
            <div class="tx-kpi-card__head">
              <div>
                <span class="dc-kpi-card__label">Toplam Alacaklarım</span>
                <div class="dc-kpi-card__value mono tx-kpi-val--income" data-privacy-blur>${tryFmt(totalRec)}</div>
              </div>
              <span class="dc-kpi-badge dc-kpi-badge--emerald mono">%${recShare} pay</span>
            </div>
            <div class="tx-kpi-spark-row">
              <div class="tx-kpi-spark-track">
                <span class="tx-kpi-spark-fill tx-kpi-spark-fill--emerald" style="width: ${Math.max(6, recProgressPct)}%;"></span>
              </div>
              <div class="tx-kpi-foot">
                <span class="tx-kpi-caption">${activeRecs.length} aktif • ${upcomingRecCount} yaklaşan tahsilat</span>
                <span class="tx-kpi-caption mono">%${recProgressPct} tahsil</span>
              </div>
            </div>
          </article>

          <article class="dc-kpi-card dc-kpi-card--debt tx-kpi-card tx-kpi-card--expense">
            <div class="tx-kpi-card__head">
              <div>
                <span class="dc-kpi-card__label">Toplam Borçlarım</span>
                <div class="dc-kpi-card__value mono tx-kpi-val--expense" data-privacy-blur>${tryFmt(totalPay)}</div>
              </div>
              <span class="dc-kpi-badge dc-kpi-badge--rose mono">%${payShare} pay</span>
            </div>
            <div class="tx-kpi-spark-row">
              <div class="tx-kpi-spark-track">
                <span class="tx-kpi-spark-fill tx-kpi-spark-fill--rose" style="width: ${Math.max(6, payProgressPct)}%;"></span>
              </div>
              <div class="tx-kpi-foot">
                <span class="tx-kpi-caption">30 gün vade: ${tryFmt(due30Pay)}</span>
                <span class="tx-kpi-caption mono">%${payProgressPct} ödendi</span>
              </div>
            </div>
          </article>

          <article class="dc-kpi-card dc-kpi-card--debt tx-kpi-card tx-kpi-card--net">
            <div class="tx-kpi-card__head">
              <div>
                <span class="dc-kpi-card__label">Net Bakiye Durumu</span>
                <div class="dc-kpi-card__value mono ${isPositive ? 'tx-kpi-val--income' : 'tx-kpi-val--expense'}" data-privacy-blur>
                  ${isPositive ? '+' : '−'}${tryFmt(Math.abs(netDiff))}
                </div>
              </div>
              <span class="dc-kpi-badge ${isPositive ? 'dc-kpi-badge--emerald' : 'dc-kpi-badge--rose'} mono">
                ${isPositive ? 'Alacak Fazlası' : 'Borç Fazlası'}
              </span>
            </div>
            <div class="tx-kpi-spark-row">
              <div class="tx-kpi-dual-track" title="Alacak %${recShare} / Borç %${payShare}">
                <span class="tx-kpi-dual-in" style="width: ${recShare}%;"></span>
                <span class="tx-kpi-dual-out" style="width: ${payShare}%;"></span>
              </div>
              <div class="tx-kpi-foot">
                <span class="tx-kpi-caption">Alacak − Borç Dengesi</span>
                <span class="tx-kpi-caption mono">${activeRecs.length + activePays.length} açık kayıt</span>
              </div>
            </div>
          </article>
        `;
      }
    } catch (err) {
      console.error('renderDebtKpis error:', err);
    }
  }

  function renderDebtSideRail() {
    const railHost = document.getElementById('dcSideRail');
    if (!railHost) return;

    const allActive = State.ledgerItems.filter((x) => x && !isArchived(x));
    const recs = allActive.filter((x) => x.kind === 'receivable');
    const pays = allActive.filter((x) => x.kind === 'payable');

    const totalRec = round2(recs.reduce((s, x) => s + remainingAmount(x), 0));
    const totalPay = round2(pays.reduce((s, x) => s + remainingAmount(x), 0));
    const totalVol = round2(totalRec + totalPay);
    const recPct = totalVol > 0 ? Math.round((totalRec / totalVol) * 100) : 50;
    const payPct = totalVol > 0 ? 100 - recPct : 50;

    const allRecs = State.ledgerItems.filter((x) => x && x.kind === 'receivable');
    const allPays = State.ledgerItems.filter((x) => x && x.kind === 'payable');
    const recOrigSum = round2(allRecs.reduce((s, x) => s + Number(x.total || 0), 0));
    const recPaidSum = round2(allRecs.reduce((s, x) => s + paidAmount(x), 0));
    const payOrigSum = round2(allPays.reduce((s, x) => s + Number(x.total || 0), 0));
    const payPaidSum = round2(allPays.reduce((s, x) => s + paidAmount(x), 0));
    const recPaidPct = recOrigSum > 0 ? Math.min(100, Math.round((recPaidSum / recOrigSum) * 100)) : 0;
    const payPaidPct = payOrigSum > 0 ? Math.min(100, Math.round((payPaidSum / payOrigSum) * 100)) : 0;

    const donutTotalText = totalVol >= 10000 ? tryFmt(Math.round(totalVol)) : tryFmt(totalVol);

    let overdueAmt = 0; let overdueCnt = 0;
    let weekAmt = 0; let weekCnt = 0;
    let monthAmt = 0; let monthCnt = 0;
    let laterAmt = 0; let laterCnt = 0;

    allActive.forEach((x) => {
      const d = State.daysTo(x.dueDate);
      const rem = remainingAmount(x);
      if (d < 0) { overdueAmt += rem; overdueCnt += 1; }
      else if (d <= 7) { weekAmt += rem; weekCnt += 1; }
      else if (d <= 30) { monthAmt += rem; monthCnt += 1; }
      else { laterAmt += rem; laterCnt += 1; }
    });

    const urgentRows = [...allActive]
      .sort((a, b) => State.daysTo(a.dueDate) - State.daysTo(b.dueDate))
      .slice(0, 3)
      .map((item) => {
        const due = formatDuePill(item);
        const isRec = item.kind === 'receivable';
        return `
          <button type="button" class="dc-rail-due-item" data-open-debt="${esc(item.id)}">
            <span class="dc-rail-due-dot ${isRec ? 'is-rec' : 'is-pay'}"></span>
            <div class="dc-rail-due-meta">
              <strong>${esc(item.party)}</strong>
              <small>${esc(item.category || 'Diğer')} · ${due.text}</small>
            </div>
            <span class="dc-rail-due-amt mono ${isRec ? 'is-rec' : 'is-pay'}" data-privacy-blur>${tryFmt(remainingAmount(item))}</span>
          </button>`;
      }).join('');

    railHost.innerHTML = `
      <section class="dc-rail-card dc-rail-card--balance" aria-label="Borç ve alacak dengesi">
        <header class="tx-rail-card__head">
          <div>
            <h3 class="tx-rail-card__title">Denge &amp; İlerleme</h3>
            <p class="tx-rail-card__sub">Alacak ve yükümlülük dağılımı</p>
          </div>
          <span class="tx-rail-pill mono">${allActive.length} açık</span>
        </header>

        <div class="tx-rail-donut-row">
          <div class="tx-rail-donut">
            <svg viewBox="0 0 42 42" width="84" height="84" aria-hidden="true">
              <circle cx="21" cy="21" r="15.915" fill="none" stroke="var(--bg-muted)" stroke-width="4.2"/>
              <circle cx="21" cy="21" r="15.915" fill="none" stroke="#10B981" stroke-width="4.2" stroke-dasharray="${recPct} ${100 - recPct}" transform="rotate(-90 21 21)"/>
              <circle cx="21" cy="21" r="15.915" fill="none" stroke="#F43F5E" stroke-width="4.2" stroke-dasharray="${payPct} ${100 - payPct}" stroke-dashoffset="${-recPct}" transform="rotate(-90 21 21)"/>
            </svg>
            <div class="tx-rail-donut__center">
              <span class="tx-rail-donut__lbl">Hacim</span>
              <strong class="mono" data-privacy-blur>${donutTotalText}</strong>
            </div>
          </div>
          <div class="tx-rail-donut-legend">
            <div class="tx-rail-legend-item"><span><i style="background:#10B981"></i>Alacaklar</span><strong class="mono">%${recPct}</strong></div>
            <div class="tx-rail-legend-item"><span><i style="background:#F43F5E"></i>Borçlar</span><strong class="mono">%${payPct}</strong></div>
            <div class="tx-rail-legend-item"><span><i style="background:#2F6BFF"></i>Kapalı</span><strong class="mono">${State.ledgerItems.length - allActive.length}</strong></div>
          </div>
        </div>

        <div class="dc-rail-bars">
          <div class="dc-rail-bar">
            <div class="dc-rail-bar__top">
              <span>Alacak Tahsilat İlerlemesi</span>
              <strong class="mono">%${recPaidPct}</strong>
            </div>
            <div class="tx-rail-cat__track"><span style="width:${recPaidPct}%;background:linear-gradient(90deg,#10B981,#34D399);"></span></div>
            <small class="mono" data-privacy-blur>${tryFmt(recPaidSum)} / ${tryFmt(recOrigSum)}</small>
          </div>

          <div class="dc-rail-bar">
            <div class="dc-rail-bar__top">
              <span>Borç Ödeme İlerlemesi</span>
              <strong class="mono">%${payPaidPct}</strong>
            </div>
            <div class="tx-rail-cat__track"><span style="width:${payPaidPct}%;background:linear-gradient(90deg,#FB7185,#F43F5E);"></span></div>
            <small class="mono" data-privacy-blur>${tryFmt(payPaidSum)} / ${tryFmt(payOrigSum)}</small>
          </div>
        </div>
      </section>

      <section class="dc-rail-card dc-rail-card--dues" aria-label="Vade durumu">
        <header class="tx-rail-card__head">
          <div>
            <h3 class="tx-rail-card__title">Yaklaşan Vadeler</h3>
            <p class="tx-rail-card__sub">Öncelikli vade penceresi</p>
          </div>
          <span class="tx-rail-pill mono">${overdueCnt + weekCnt} kritik</span>
        </header>

        <div class="tx-rail-commits">
          <div class="tx-rail-commit">
            <span class="tx-rail-commit__lbl">Gecikmiş</span>
            <strong class="mono ${overdueCnt ? 'tx-kpi-val--expense' : ''}" data-privacy-blur>${tryFmt(round2(overdueAmt))}</strong>
            <small>${overdueCnt} kayıt</small>
          </div>
          <div class="tx-rail-commit">
            <span class="tx-rail-commit__lbl">7 Gün İçinde</span>
            <strong class="mono" data-privacy-blur>${tryFmt(round2(weekAmt))}</strong>
            <small>${weekCnt} kayıt</small>
          </div>
          <div class="tx-rail-commit">
            <span class="tx-rail-commit__lbl">8–30 Gün</span>
            <strong class="mono" data-privacy-blur>${tryFmt(round2(monthAmt))}</strong>
            <small>${monthCnt} kayıt</small>
          </div>
          <div class="tx-rail-commit">
            <span class="tx-rail-commit__lbl">30+ Gün</span>
            <strong class="mono" data-privacy-blur>${tryFmt(round2(laterAmt))}</strong>
            <small>${laterCnt} kayıt</small>
          </div>
        </div>

        <div class="dc-rail-due-list">
          ${urgentRows || '<div class="tx-rail-empty">Yaklaşan aktif vade kaydı yok.</div>'}
        </div>
      </section>
    `;
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
    renderDebtSideRail();
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

    document.getElementById('dcSideRail')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-open-debt]');
      if (!btn) return;
      const id = btn.dataset.openDebt;
      if (!id) return;
      if (window.Vaulty.DebtPayDesk?.openDrawer) {
        window.Vaulty.DebtPayDesk.openDrawer(id, false);
      } else if (window.openDrawer) {
        window.openDrawer(id, false);
      }
    });

    // Note: openNewDebtModalBtn is delegated centrally in core/events.js.
    syncSortDropdown();

    State.on('ledger:changed', () => {
      renderDebtKpis();
      renderDebtSideRail();
      syncSegmentCounts();
      window.Vaulty.Tables?.renderDebtList?.();
    });

    State.on('accounts:changed', () => {
      renderDebtKpis();
      renderDebtSideRail();
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

