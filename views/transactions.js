/* =========================================================================
   VAULTY VIEW: TRANSACTIONS (İşlemler Görünümü, 3'lü KPI Şeridi & Filtreler)
   ========================================================================= */
(() => {
  const { State } = window.Vaulty;
  const { esc, tryFmt, round2 } = State;
  const { toggleCustomDropdown, closeAllCustomPopovers } = window.Vaulty.ModalBase;

  function renderTxKpiStrip() {
    const kpiHost = document.getElementById('txKpis');
    if (!kpiHost) return;

    try {
      const activeFilters = window.Vaulty.Tables?.getActiveTxFilters
        ? window.Vaulty.Tables.getActiveTxFilters()
        : {
            search: (document.getElementById('txSearchInput')?.value || '').trim().toLowerCase(),
            account: document.getElementById('txFilterAccount')?.value || 'all',
            type: document.getElementById('txFilterType')?.value || 'all',
            range: document.getElementById('txFilterRange')?.value || 'all',
          };

      const isAll = (v) => !v || v === 'all' || v === '' || v === 'undefined';

      // KPI'lar aktif hesap ve zaman filtresi kapsamındaki gelir, gider ve net akışı yansıtır
      const list = (Array.isArray(State.tx) ? State.tx : []).filter((t) => {
        if (!t) return false;
        if (!isAll(activeFilters.account)) {
          if (t.accountId !== activeFilters.account && t.sourceAccountId !== activeFilters.account) {
            return false;
          }
        }
        if (!isAll(activeFilters.range)) {
          const days = State.daysTo ? -State.daysTo(t.date) : 0;
          if (activeFilters.range === '7') {
            if (days > 7 || days < 0) return false;
          } else if (activeFilters.range === '30') {
            if (days > 30 || days < 0) return false;
          } else if (activeFilters.range === 'month') {
            const now = new Date();
            const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            if (!String(t.date || '').startsWith(monthKey)) return false;
          }
        }
        if (activeFilters.search) {
          const acc = State.getAccountById(t.accountId);
          const srcAcc = t.sourceAccountId ? State.getAccountById(t.sourceAccountId) : null;
          const hay = `${t.desc || ''} ${t.cat || ''} ${t.type || ''} ${acc?.nickname || ''} ${acc?.institution || ''} ${srcAcc?.nickname || ''} ${srcAcc?.institution || ''}`.toLowerCase();
          if (!hay.includes(activeFilters.search)) return false;
        }
        return true;
      });

      const incomeItems = list.filter((t) => t.type === 'Gelir');
      const expenseItems = list.filter((t) => t.type === 'Gider' || t.type === 'Kart Borcu Ödeme');
      const incomeTotal = round2(incomeItems.reduce((s, t) => s + Number((t.amount ?? t.tutar) || 0), 0));
      const expenseTotal = round2(expenseItems.reduce((s, t) => s + Number((t.amount ?? t.tutar) || 0), 0));
      const netFlow = round2(incomeTotal - expenseTotal);

      const volume = incomeTotal + expenseTotal;
      const incomePct = volume > 0 ? Math.round((incomeTotal / volume) * 100) : 50;
      const expensePct = volume > 0 ? Math.round((expenseTotal / volume) * 100) : 50;

      kpiHost.innerHTML = `
        <article class="dc-kpi-card tx-kpi-card">
          <div class="tx-kpi-card__top">
            <span class="dc-kpi-card__label">Toplam Gelir</span>
            <span class="tx-kpi-icon tx-kpi-icon--emerald" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 17 17 7M7 7h10v10"/>
              </svg>
            </span>
          </div>
          <div class="dc-kpi-card__value mono" style="color:#059669;">+${tryFmt(incomeTotal)}</div>
          <div class="tx-kpi-spark-row">
            <div class="tx-kpi-spark-track">
              <span class="tx-kpi-spark-fill tx-kpi-spark-fill--emerald" style="width: ${incomePct}%;"></span>
            </div>
            <div class="tx-kpi-foot">
              <span class="tx-kpi-caption">${incomeItems.length} tahsilat kaydı</span>
              <span class="dc-kpi-badge dc-kpi-badge--emerald mono">%${incomePct} pay</span>
            </div>
          </div>
        </article>

        <article class="dc-kpi-card tx-kpi-card">
          <div class="tx-kpi-card__top">
            <span class="dc-kpi-card__label">Toplam Gider</span>
            <span class="tx-kpi-icon tx-kpi-icon--rose" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="m7 7 10 10M17 7v10H7"/>
              </svg>
            </span>
          </div>
          <div class="dc-kpi-card__value mono" style="color:#E11D48;">−${tryFmt(expenseTotal)}</div>
          <div class="tx-kpi-spark-row">
            <div class="tx-kpi-spark-track">
              <span class="tx-kpi-spark-fill tx-kpi-spark-fill--rose" style="width: ${expensePct}%;"></span>
            </div>
            <div class="tx-kpi-foot">
              <span class="tx-kpi-caption">${expenseItems.length} harcama &amp; kart ödemesi</span>
              <span class="dc-kpi-badge dc-kpi-badge--rose mono">%${expensePct} pay</span>
            </div>
          </div>
        </article>

        <article class="dc-kpi-card tx-kpi-card">
          <div class="tx-kpi-card__top">
            <span class="dc-kpi-card__label">Net Akış</span>
            <span class="tx-kpi-icon tx-kpi-icon--blue" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </span>
          </div>
          <div class="dc-kpi-card__value mono" style="color:${netFlow >= 0 ? '#059669' : '#E11D48'};">
            ${netFlow >= 0 ? '+' : '-'}${tryFmt(Math.abs(netFlow))}
          </div>
          <div class="tx-kpi-spark-row">
            <div class="tx-kpi-spark-track">
              <span class="tx-kpi-spark-fill tx-kpi-spark-fill--blue" style="width: 100%;"></span>
            </div>
            <div class="tx-kpi-foot">
              <span class="tx-kpi-caption">Gelir − Gider Dengesi</span>
              <span class="dc-kpi-badge ${netFlow >= 0 ? 'dc-kpi-badge--emerald' : 'dc-kpi-badge--rose'} mono">${netFlow >= 0 ? 'Pozitif Denge' : 'Açık Denge'}</span>
            </div>
          </div>
        </article>
      `;
    } catch (err) {
      console.error('renderTxKpiStrip error:', err);
    }
  }

  function renderTxFilterPopover(dropdownEl, selectEl) {
    if (!dropdownEl || !selectEl) return;
    const trigger = dropdownEl.querySelector('.tx-filter-dropdown__trigger');
    const labelEl = dropdownEl.querySelector('.tx-filter-dropdown__label');
    const popover = dropdownEl.querySelector('.tx-filter-dropdown__popover');
    if (!trigger || !labelEl || !popover) return;

    const opts = Array.from(selectEl.options).map((o) => ({
      value: o.value,
      label: o.textContent,
    }));

    const activeVal = selectEl.value ?? '';

    const updateFilterTriggerUI = (val) => {
      const chosen = opts.find((x) => x.value === val) || opts[0];
      if (chosen && labelEl) {
        labelEl.textContent = chosen.label;
      }
      popover.querySelectorAll('.tx-filter-dropdown__item').forEach((btn) => {
        const isSel = btn.dataset.value === (chosen?.value ?? '');
        btn.classList.toggle('is-selected', isSel);
        btn.setAttribute('aria-selected', String(isSel));
      });
    };

    popover.innerHTML = opts
      .map(
        (item) => `
        <button type="button" class="tx-filter-dropdown__item ${item.value === activeVal ? 'is-selected' : ''}" role="option" data-value="${esc(item.value)}" aria-selected="${item.value === activeVal}">
          <span>${esc(item.label)}</span>
          <svg class="tx-filter-dropdown__check" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        </button>`
      )
      .join('');

    updateFilterTriggerUI(activeVal);

    if (!dropdownEl.dataset.boundTrigger) {
      dropdownEl.dataset.boundTrigger = 'true';
      trigger.addEventListener('click', () => {
        toggleCustomDropdown(dropdownEl, trigger, popover);
      });
    }

    popover.querySelectorAll('.tx-filter-dropdown__item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.value ?? '';
        selectEl.value = val;
        updateFilterTriggerUI(val);
        closeAllCustomPopovers();
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }

  function syncAccountFilters() {
    const filterAccSel = document.getElementById('txFilterAccount');
    if (filterAccSel) {
      const curFilter = filterAccSel.value;
      filterAccSel.innerHTML =
        `<option value="all">Tüm Hesaplar &amp; Kartlar</option>` +
        State.accounts
          .map((a) => `<option value="${a.id}">${esc(a.nickname)}</option>`)
          .join('');
      if (State.accounts.some((a) => a.id === curFilter)) {
        filterAccSel.value = curFilter;
      } else {
        filterAccSel.value = 'all';
      }
      renderTxFilterPopover(document.getElementById('txFilterAccountDropdown'), filterAccSel);
    }

    const filterTypeSel = document.getElementById('txFilterType');
    if (filterTypeSel) {
      renderTxFilterPopover(document.getElementById('txFilterTypeDropdown'), filterTypeSel);
    }

    const filterRangeSel = document.getElementById('txFilterRange');
    if (filterRangeSel) {
      renderTxFilterPopover(document.getElementById('txFilterRangeDropdown'), filterRangeSel);
    }
  }

  function exportTransactionsCsv() {
    try {
      if (!Array.isArray(State.tx) || State.tx.length === 0) {
        State.showToast('Dışa aktarılacak işlem bulunamadı.');
        return;
      }

      const rows = [
        ['Tarih', 'Aciklama', 'Kategori', 'Tur', 'Tutar', 'Hesap', 'Tekrarlayan'].join(';'),
      ];

      State.tx.forEach((t) => {
        const acc = State.getAccountById(t.accountId);
        const row = [
          t.date || '',
          `"${(t.desc || '').replace(/"/g, '""')}"`,
          `"${(t.cat || '').replace(/"/g, '""')}"`,
          t.type || '',
          t.amount || 0,
          `"${(acc?.nickname || '').replace(/"/g, '""')}"`,
          t.isRecurring ? 'Evet' : 'Hayir',
        ];
        rows.push(row.join(';'));
      });

      const csvContent = '\uFEFF' + rows.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Vaulty_Islemler_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      State.showToast('İşlem hareketleri CSV olarak dışa aktarıldı.');
    } catch (err) {
      console.error('exportTransactionsCsv error:', err);
      State.showToast('Dışa aktarma sırasında bir hata oluştu.');
    }
  }

  function render() {
    syncAccountFilters();
    renderTxKpiStrip();
    window.Vaulty.Tables?.renderTransactionsView?.();
  }

  function init() {
    // Note: Action buttons (openNewTxModalBtn, emptyTxAddNewBtn, openPayCardDebtFromTxBtn, exportTxBtn)
    // are delegated centrally in core/events.js to prevent double-execution.

    State.on('accounts:changed', () => {
      syncAccountFilters();
      renderTxKpiStrip();
    });

    State.on('transactions:changed', () => {
      renderTxKpiStrip();
      window.Vaulty.Tables?.renderTransactionsView?.();
    });
  }

  const TransactionsView = {
    init,
    render,
    renderTxKpiStrip,
    syncAccountFilters,
    renderTxFilterPopover,
    exportTransactionsCsv,
  };

  window.Vaulty = window.Vaulty || {};
  window.Vaulty.Views = window.Vaulty.Views || {};
  window.Vaulty.Views.Transactions = TransactionsView;
  window.exportTransactionsCsv = exportTransactionsCsv;
})();
