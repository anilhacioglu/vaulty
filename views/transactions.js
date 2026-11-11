/* =========================================================================
   VAULTY VIEW: TRANSACTIONS (İşlemler Görünümü, 3'lü KPI Şeridi & Filtreler)
   ========================================================================= */
(() => {
  const { State } = window.Vaulty;
  const { esc, tryFmt, round2 } = State;
  const { toggleCustomDropdown, closeAllCustomPopovers } = window.Vaulty.ModalBase;

  const RAIL_COLORS = ['#2F6BFF', '#10B981', '#F59E0B', '#A78BFA', '#FB7185', '#38BDF8'];

  function syncTxTypeChipsUI() {
    const typeVal = document.getElementById('txFilterType')?.value || 'all';
    document.querySelectorAll('#txTypeQuickChips .tx-type-chip').forEach((chip) => {
      const on = chip.dataset.txType === typeVal;
      chip.classList.toggle('is-active', on);
      chip.setAttribute('aria-pressed', String(on));
    });
  }

  function buildSparkBarsSvg(values, color) {
    const arr = values && values.length ? values : [0, 0, 0, 0, 0, 0, 0];
    const maxV = Math.max(1, ...arr.map((v) => Math.abs(v)));
    const bars = arr.map((v, idx) => {
      const h = v === 0 ? 4 : Math.max(6, Math.round((Math.abs(v) / maxV) * 26));
      const y = 30 - h;
      const opacity = (0.42 + (idx / Math.max(1, arr.length - 1)) * 0.58).toFixed(2);
      return `<rect x="${idx * 10 + 1}" y="${y}" width="6" height="${h}" rx="2.5" fill="${color}" fill-opacity="${opacity}"/>`;
    }).join('');
    return `<svg class="tx-kpi-bars" viewBox="0 0 70 32" width="70" height="32" aria-hidden="true">${bars}</svg>`;
  }

  function compute7Buckets(items, mode) {
    const sorted = [...items].sort((a, b) => (a.date > b.date ? 1 : -1));
    if (!sorted.length) return [0, 0, 0, 0, 0, 0, 0];
    const buckets = [0, 0, 0, 0, 0, 0, 0];
    sorted.forEach((t, idx) => {
      const b = Math.min(6, Math.floor((idx * 7) / sorted.length));
      const amt = Number((t.amount ?? t.tutar) || 0);
      if (mode === 'income' && t.type === 'Gelir') buckets[b] += amt;
      else if (mode === 'expense' && (t.type === 'Gider' || t.type === 'Kart Borcu Ödeme')) buckets[b] += amt;
      else if (mode === 'net') buckets[b] += t.type === 'Gelir' ? amt : (t.type === 'Gider' || t.type === 'Kart Borcu Ödeme' ? -amt : 0);
    });
    return buckets;
  }

  function renderTxSideRail(items) {
    const railHost = document.getElementById('txSideRail');
    if (!railHost) return;

    const typeFilter = document.getElementById('txFilterType')?.value || 'all';
    const hasExp = items.some((t) => t.type === 'Gider' || t.type === 'Kart Borcu Ödeme');
    const focusExpOnly = typeFilter === 'all' && hasExp;
    const focusItems = focusExpOnly
      ? items.filter((t) => t.type === 'Gider' || t.type === 'Kart Borcu Ödeme')
      : items;

    const catTotals = {};
    let focusTotal = 0;
    focusItems.forEach((t) => {
      const amt = Number((t.amount ?? t.tutar) || 0);
      if (amt <= 0) return;
      const c = t.cat || 'Diğer';
      catTotals[c] = (catTotals[c] || 0) + amt;
      focusTotal += amt;
    });

    const catsSorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const topCats = catsSorted.slice(0, 4);
    const otherCatAmt = catsSorted.slice(4).reduce((s, [, v]) => s + v, 0);

    const donutSegments = [...topCats];
    if (otherCatAmt > 0) donutSegments.push(['Diğer', otherCatAmt]);

    let cumOffset = 0;
    const donutCircles = focusTotal > 0
      ? donutSegments.map(([name, val], i) => {
          const pct = (val / focusTotal) * 100;
          const col = i === 4 ? '#94A3B8' : RAIL_COLORS[i % RAIL_COLORS.length];
          const seg = `<circle cx="21" cy="21" r="15.915" fill="none" stroke="${col}" stroke-width="4" stroke-dasharray="${pct.toFixed(2)} ${(100 - pct).toFixed(2)}" stroke-dashoffset="${(-cumOffset).toFixed(2)}" transform="rotate(-90 21 21)"/>`;
          cumOffset += pct;
          return seg;
        }).join('')
      : '';

    const donutTotalText = Math.abs(focusTotal) >= 10000 ? tryFmt(Math.round(focusTotal)) : tryFmt(focusTotal);

    const activeSearch = (document.getElementById('txSearchInput')?.value || '').trim().toLowerCase();

    const catBarsHtml = topCats.length === 0
      ? `<div class="tx-rail-empty">Seçili filtre için dağılım bulunmuyor.</div>`
      : topCats.map(([cat, val], i) => {
          const pct = focusTotal > 0 ? Math.max(2, Math.round((val / focusTotal) * 100)) : 0;
          const col = RAIL_COLORS[i % RAIL_COLORS.length];
          const isPicked = activeSearch && activeSearch === cat.toLowerCase();
          return `
            <button type="button" class="tx-rail-cat ${isPicked ? 'is-selected' : ''}" data-tx-cat-filter="${esc(cat)}" title="Kategoriye göre filtrele">
              <div class="tx-rail-cat__top">
                <span class="tx-rail-cat__name"><i style="background:${col}"></i>${esc(cat)}</span>
                <span class="tx-rail-cat__vals">
                  <em class="mono">%${pct}</em>
                  <strong class="mono" data-privacy-blur>${tryFmt(val)}</strong>
                </span>
              </div>
              <div class="tx-rail-cat__track"><span style="width:${pct}%;background:${col};"></span></div>
            </button>`;
        }).join('');

    // Hesap & Kart Kanalları
    const accMap = {};
    let totalAccVol = 0;
    items.forEach((t) => {
      const amt = Number((t.amount ?? t.tutar) || 0);
      if (amt <= 0) return;
      const acc = State.getAccountById(t.accountId);
      const key = acc ? acc.id : (t.accountName || 'other');
      if (!accMap[key]) {
        accMap[key] = {
          label: acc ? acc.nickname : (t.accountName || 'Diğer Hesap'),
          last4: acc?.last4 || '',
          total: 0,
          count: 0,
        };
      }
      accMap[key].total += amt;
      accMap[key].count += 1;
      totalAccVol += amt;
    });

    const accTop = Object.values(accMap).sort((a, b) => b.total - a.total).slice(0, 4);
    const accRowsHtml = accTop.length === 0
      ? `<div class="tx-rail-empty">Hesap hareketi bulunmuyor.</div>`
      : accTop.map((a) => {
          const pct = totalAccVol > 0 ? Math.max(4, Math.round((a.total / totalAccVol) * 100)) : 0;
          return `
            <div class="tx-rail-acc">
              <div class="tx-rail-acc__top">
                <span class="tx-rail-acc__name">${esc(a.label)}${a.last4 ? ` <small class="mono">••${esc(a.last4)}</small>` : ''}</span>
                <strong class="mono" data-privacy-blur>${tryFmt(a.total)}</strong>
              </div>
              <div class="tx-rail-acc__bar">
                <div class="tx-rail-acc__track"><span style="width:${pct}%;"></span></div>
                <span class="tx-rail-acc__pct mono">%${pct}</span>
              </div>
            </div>`;
        }).join('');

    const recItems = items.filter((t) => t.isRecurring);
    const recSum = round2(recItems.reduce((s, t) => s + Number((t.amount ?? t.tutar) || 0), 0));
    const expItemsOnly = items.filter((t) => t.type === 'Gider' || t.type === 'Kart Borcu Ödeme');
    const expTotalSum = round2(expItemsOnly.reduce((s, t) => s + Number((t.amount ?? t.tutar) || 0), 0));
    const avgTicket = expItemsOnly.length > 0 ? round2(expTotalSum / expItemsOnly.length) : 0;
    const topExpense = expItemsOnly.reduce((best, t) => {
      const a = Number((t.amount ?? t.tutar) || 0);
      return !best || a > best.amt ? { desc: t.desc || t.cat || 'Gider', amt: a } : best;
    }, null);
    const transferItems = items.filter((t) => t.type === 'Transfer' || String(t.type).toLowerCase() === 'transfer');
    const transferSum = round2(transferItems.reduce((s, t) => s + Number((t.amount ?? t.tutar) || 0), 0));

    const focusSub = focusExpOnly
      ? 'Harcama & kart ödemesi payları'
      : (typeFilter === 'Gelir' ? 'Tahsilat kategorileri' : 'Filtrelenen kategori payları');

    railHost.innerHTML = `
      <section class="tx-rail-card tx-rail-card--cats" aria-label="Kategori dağılım özeti">
        <header class="tx-rail-card__head">
          <div>
            <h3 class="tx-rail-card__title">Kategori Dağılımı</h3>
            <p class="tx-rail-card__sub">${esc(focusSub)}</p>
          </div>
          <span class="tx-rail-pill mono">${catsSorted.length} kategori</span>
        </header>

        <div class="tx-rail-donut-row">
          <div class="tx-rail-donut">
            <svg viewBox="0 0 42 42" width="84" height="84" aria-hidden="true">
              <circle cx="21" cy="21" r="15.915" fill="none" stroke="var(--bg-muted)" stroke-width="4"/>
              ${donutCircles}
            </svg>
            <div class="tx-rail-donut__center">
              <span class="tx-rail-donut__lbl">Toplam</span>
              <strong class="mono" data-privacy-blur>${donutTotalText}</strong>
            </div>
          </div>
          <div class="tx-rail-donut-legend">
            ${topCats.slice(0, 3).map(([cat, val], i) => {
              const pct = focusTotal > 0 ? Math.round((val / focusTotal) * 100) : 0;
              return `<div class="tx-rail-legend-item"><span><i style="background:${RAIL_COLORS[i % RAIL_COLORS.length]}"></i>${esc(cat)}</span><strong class="mono">%${pct}</strong></div>`;
            }).join('') || '<span class="tx-rail-empty">Veri yok</span>'}
          </div>
        </div>

        <div class="tx-rail-cats">${catBarsHtml}</div>
      </section>

      <section class="tx-rail-card tx-rail-card--accs" aria-label="Ödeme kanalları">
        <header class="tx-rail-card__head">
          <div>
            <h3 class="tx-rail-card__title">Ödeme Kanalları</h3>
            <p class="tx-rail-card__sub">Kart ve hesap işlem hacmi</p>
          </div>
          <span class="tx-rail-pill mono">${items.length} kayıt</span>
        </header>

        <div class="tx-rail-accs">${accRowsHtml}</div>
      </section>

      <section class="tx-rail-card tx-rail-card--pulse" aria-label="Dönem ve akış nabzı">
        <header class="tx-rail-card__head">
          <div>
            <h3 class="tx-rail-card__title">Dönem &amp; Akış Nabzı</h3>
            <p class="tx-rail-card__sub">Filtrelenen aralık özeti</p>
          </div>
          <span class="tx-rail-pill mono">${expItemsOnly.length} çıkış</span>
        </header>

        <div class="tx-rail-commits">
          <div class="tx-rail-commit">
            <span class="tx-rail-commit__lbl">En Yüksek Çıkış</span>
            <strong class="mono" data-privacy-blur>${topExpense ? tryFmt(topExpense.amt) : '0 ₺'}</strong>
            <small title="${esc(topExpense?.desc || '')}">${esc(topExpense ? topExpense.desc : 'Kayıt yok')}</small>
          </div>
          <div class="tx-rail-commit">
            <span class="tx-rail-commit__lbl">Ort. Harcama</span>
            <strong class="mono" data-privacy-blur>${tryFmt(avgTicket)}</strong>
            <small>${expItemsOnly.length} işlem ortalaması</small>
          </div>
          <div class="tx-rail-commit">
            <span class="tx-rail-commit__lbl">Sabit İşlemler</span>
            <strong class="mono" data-privacy-blur>${tryFmt(recSum)}</strong>
            <small>${recItems.length} düzenli kayıt</small>
          </div>
          <div class="tx-rail-commit">
            <span class="tx-rail-commit__lbl">İç Transfer</span>
            <strong class="mono" data-privacy-blur>${tryFmt(transferSum)}</strong>
            <small>${transferItems.length} virman hareketi</small>
          </div>
        </div>
      </section>
    `;
  }

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

      const baseMatches = (t, ignoreType) => {
        if (!t) return false;
        if (!isAll(activeFilters.account)) {
          if (t.accountId !== activeFilters.account && t.sourceAccountId !== activeFilters.account) {
            return false;
          }
        }
        if (!ignoreType && !isAll(activeFilters.type)) {
          const tType = String(t.type || '').trim().toLowerCase();
          const fType = String(activeFilters.type).trim().toLowerCase();
          if (fType === 'transfer' && tType !== 'transfer') return false;
          else if (fType === 'gider' && tType !== 'gider') return false;
          else if (fType === 'gelir' && tType !== 'gelir') return false;
          else if (fType.includes('kart') && !tType.includes('kart')) return false;
          else if (fType !== 'transfer' && fType !== 'gider' && fType !== 'gelir' && !fType.includes('kart') && t.type !== activeFilters.type) return false;
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
      };

      const allTx = Array.isArray(State.tx) ? State.tx : [];
      const list = allTx.filter((t) => baseMatches(t, true));
      const railList = allTx.filter((t) => baseMatches(t, false));

      const incomeItems = list.filter((t) => t.type === 'Gelir');
      const expenseItems = list.filter((t) => t.type === 'Gider' || t.type === 'Kart Borcu Ödeme');
      const incomeTotal = round2(incomeItems.reduce((s, t) => s + Number((t.amount ?? t.tutar) || 0), 0));
      const expenseTotal = round2(expenseItems.reduce((s, t) => s + Number((t.amount ?? t.tutar) || 0), 0));
      const netFlow = round2(incomeTotal - expenseTotal);

      const volume = incomeTotal + expenseTotal;
      const incomePct = volume > 0 ? Math.round((incomeTotal / volume) * 100) : 50;
      const expensePct = volume > 0 ? Math.round((expenseTotal / volume) * 100) : 50;

      const incBars = buildSparkBarsSvg(compute7Buckets(list, 'income'), '#10B981');
      const expBars = buildSparkBarsSvg(compute7Buckets(list, 'expense'), '#F43F5E');
      const netBars = buildSparkBarsSvg(compute7Buckets(list, 'net'), '#2F6BFF');

      kpiHost.innerHTML = `
        <article class="dc-kpi-card tx-kpi-card tx-kpi-card--income">
          <div class="tx-kpi-card__head">
            <div>
              <span class="dc-kpi-card__label">Toplam Gelir</span>
              <div class="dc-kpi-card__value mono tx-kpi-val--income" data-privacy-blur>+${tryFmt(incomeTotal)}</div>
            </div>
            ${incBars}
          </div>
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

        <article class="dc-kpi-card tx-kpi-card tx-kpi-card--expense">
          <div class="tx-kpi-card__head">
            <div>
              <span class="dc-kpi-card__label">Toplam Gider</span>
              <div class="dc-kpi-card__value mono tx-kpi-val--expense" data-privacy-blur>−${tryFmt(expenseTotal)}</div>
            </div>
            ${expBars}
          </div>
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

        <article class="dc-kpi-card tx-kpi-card tx-kpi-card--net">
          <div class="tx-kpi-card__head">
            <div>
              <span class="dc-kpi-card__label">Net Akış</span>
              <div class="dc-kpi-card__value mono ${netFlow >= 0 ? 'tx-kpi-val--income' : 'tx-kpi-val--expense'}" data-privacy-blur>
                ${netFlow >= 0 ? '+' : '−'}${tryFmt(Math.abs(netFlow))}
              </div>
            </div>
            ${netBars}
          </div>
          <div class="tx-kpi-spark-row">
            <div class="tx-kpi-dual-track" title="Gelir %${incomePct} / Gider %${expensePct}">
              <span class="tx-kpi-dual-in" style="width: ${incomePct}%;"></span>
              <span class="tx-kpi-dual-out" style="width: ${expensePct}%;"></span>
            </div>
            <div class="tx-kpi-foot">
              <span class="tx-kpi-caption">Gelir − Gider Dengesi</span>
              <span class="dc-kpi-badge ${netFlow >= 0 ? 'dc-kpi-badge--emerald' : 'dc-kpi-badge--rose'} mono">${netFlow >= 0 ? 'Pozitif Denge' : 'Açık Denge'}</span>
            </div>
          </div>
        </article>
      `;

      syncTxTypeChipsUI();
      renderTxSideRail(railList);
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
    document.querySelectorAll('#txTypeQuickChips .tx-type-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const typeVal = chip.dataset.txType || 'all';
        const sel = document.getElementById('txFilterType');
        if (sel) {
          sel.value = typeVal;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
        syncTxTypeChipsUI();
      });
    });

    document.getElementById('txSearchInput')?.addEventListener('input', renderTxKpiStrip);
    document.getElementById('txFilterAccount')?.addEventListener('change', renderTxKpiStrip);
    document.getElementById('txFilterType')?.addEventListener('change', renderTxKpiStrip);
    document.getElementById('txFilterRange')?.addEventListener('change', renderTxKpiStrip);

    document.getElementById('txSideRail')?.addEventListener('click', (e) => {
      const catBtn = e.target.closest('[data-tx-cat-filter]');
      if (!catBtn) return;
      const cat = catBtn.dataset.txCatFilter || '';
      const searchEl = document.getElementById('txSearchInput');
      if (!searchEl) return;
      searchEl.value = searchEl.value.trim().toLowerCase() === cat.toLowerCase() ? '' : cat;
      searchEl.dispatchEvent(new Event('input', { bubbles: true }));
    });

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
