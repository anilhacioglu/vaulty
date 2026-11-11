/**
 * Vaulty - Financial Cashflow Calendar View (Nakit Akışı Takvimi)
 * views/calendar.js
 * Hem planlanan hem de gerçekleşen tüm gelir, gider, taksit, ekstre ve borç/alacak hareketlerini takvimde listeler.
 */

(() => {
  'use strict';

  const State = window.Vaulty?.State;
  const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const tryFmt = (n) => (State && State.tryFmt ? State.tryFmt(n) : `${round2(n)} ₺`);
  const esc = (s) => (State && State.esc ? State.esc(s) : (s ? String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]) : ''));

  const MONTHS_TR = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  const WEEKDAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  let viewDate = new Date();
  let selectedDateStr = new Date().toISOString().slice(0, 10);
  let activeFilter = 'all'; // 'all', 'in', 'out', 'planned'

  function getMonthKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  function getMonthEvents(year, month) {
    const events = [];
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 1. Kredi Kartı Son Ödeme Günleri (Ekstreler)
    (State.accounts || []).forEach((acc) => {
      if (acc && acc.type === 'credit') {
        const debt = Number(acc.debt || 0);
        if (debt > 0) {
          const rawDueDay = Number(acc.dueDay || 15);
          const actualDay = Math.min(Math.max(1, rawDueDay), daysInMonth);
          const dateStr = `${monthKey}-${String(actualDay).padStart(2, '0')}`;
          events.push({
            id: `ev-card-${acc.id}`,
            date: dateStr,
            title: `${acc.nickname} Ekstre Ödemesi`,
            subtitle: `${acc.institution} Kredi Kartı • Son Ödeme`,
            type: 'card',
            amount: debt,
            direction: 'out',
            color: '#2563EB',
            accountId: acc.id,
          });
        }
      }
    });

    // 2. Tekrarlayan Sabit Giderler ve Düzenli Gelirler
    (State.tx || []).forEach((t) => {
      if (t && t.isRecurring) {
        let dayNum = Number(t.recurringDay) || 1;
        const amt = Number((t.amount ?? t.tutar) || 0);
        const isIncome = t.type === 'Gelir' || t.direction === 'in';
        if (t.recurringInterval === 'weekly') {
          // Haftalık tekrar: Ayın her 7 gününe bir yerleştir
          for (let d = dayNum; d <= daysInMonth; d += 7) {
            const dateStr = `${monthKey}-${String(d).padStart(2, '0')}`;
            events.push({
              id: `ev-rec-${t.id}-${d}`,
              date: dateStr,
              title: t.desc || (isIncome ? 'Düzenli Gelir' : 'Düzenli Ödeme'),
              subtitle: `${t.cat || (isIncome ? 'Gelir' : 'Abonelik')} (Haftalık)`,
              type: 'recurring',
              amount: amt,
              direction: isIncome ? 'in' : 'out',
              color: isIncome ? '#059669' : '#E11D48',
              txId: t.id,
            });
          }
        } else {
          // Aylık veya yıllık
          const actualDay = Math.min(Math.max(1, dayNum), daysInMonth);
          const dateStr = `${monthKey}-${String(actualDay).padStart(2, '0')}`;
          events.push({
            id: `ev-rec-${t.id}`,
            date: dateStr,
            title: t.desc || (isIncome ? 'Düzenli Gelir' : 'Düzenli Sabit Gider'),
            subtitle: `${t.cat || (isIncome ? 'Maaş / Düzenli Gelir' : 'Sabit Gider')} • Tekrarlayan`,
            type: 'recurring',
            amount: amt,
            direction: isIncome ? 'in' : 'out',
            color: isIncome ? '#059669' : '#E11D48',
            txId: t.id,
          });
        }
      }
    });

    // 3. Borç ve Alacak Defteri Vadeleri
    (State.ledgerItems || []).forEach((item) => {
      if (item && !State.isArchived?.(item) && item.dueDate) {
        if (String(item.dueDate).startsWith(monthKey)) {
          const rem = State.remainingAmount ? State.remainingAmount(item) : Number(item.total || 0);
          if (rem > 0) {
            const isRec = item.kind === 'receivable';
            events.push({
              id: `ev-debt-${item.id}`,
              date: item.dueDate,
              title: item.party,
              subtitle: `${item.category || 'Defter'} • ${isRec ? 'Tahsilat Bekleniyor' : 'Borç Vadesi'}`,
              type: 'ledger',
              amount: rem,
              direction: isRec ? 'in' : 'out',
              color: isRec ? '#059669' : '#D97706',
              ledgerId: item.id,
            });
          }
        }
      }
    });

    // 4. Taksitli İşlem Vadeleri
    (State.tx || []).forEach((t) => {
      if (t && t.isInstallment && t.installment && t.date && String(t.date).startsWith(monthKey)) {
        events.push({
          id: `ev-inst-${t.id}`,
          date: t.date,
          title: t.desc || 'Taksitli Harcama',
          subtitle: `${t.cat || 'Taksit'} • ${t.installment.currentInstallment}/${t.installment.totalInstallments} Taksit`,
          type: 'installment',
          amount: Number(t.installment.installmentAmount || t.amount || 0),
          direction: 'out',
          color: '#8B5CF6',
          txId: t.id,
        });
      }
    });

    // 5. TÜM GERÇEKLEŞEN & KAYITLI İŞLEMLER (Gelirler, Harcamalar, Kart Borcu Ödemeleri)
    (State.tx || []).forEach((t) => {
      if (!t || t.isRecurring || t.isInstallment) return; // Tekrarlayanlar ve taksitler yukarıda işlendi

      const dateStr = (t.date ? String(t.date).slice(0, 10) : '');
      if (!dateStr || !dateStr.startsWith(monthKey)) return;

      const amt = Number((t.amount ?? t.tutar) || 0);
      if (amt <= 0) return;

      const acc = State.getAccountById ? State.getAccountById(t.accountId) : null;
      const accName = acc ? acc.nickname : (t.accountName || '');

      const isIncome = t.type === 'Gelir' || t.direction === 'in';
      const isCardPay = t.type === 'Kart Borcu Ödeme';
      const isTransfer = t.type === 'Transfer';

      let evType = isIncome ? 'income' : (isCardPay ? 'card-pay' : (isTransfer ? 'transfer' : 'expense'));
      let evDirection = isIncome ? 'in' : 'out';
      let evColor = isIncome ? '#059669' : (isCardPay ? '#2563EB' : (isTransfer ? '#6366F1' : '#E11D48'));

      let evTitle = t.desc || (isIncome ? 'Gelir Kaydı' : (isCardPay ? 'Kart Borcu Ödemesi' : (isTransfer ? 'Transfer' : 'Harcama')));
      let evSub = `${t.cat || (isIncome ? 'Gelir' : 'Gider')}${accName ? ' • ' + accName : ''}`;

      events.push({
        id: `ev-tx-${t.id}`,
        date: dateStr,
        title: evTitle,
        subtitle: evSub,
        type: evType,
        amount: amt,
        direction: evDirection,
        color: evColor,
        txId: t.id,
        category: t.cat || '',
      });
    });

    return events;
  }

  function filterEvents(events) {
    if (activeFilter === 'in') {
      return events.filter((e) => e.direction === 'in');
    }
    if (activeFilter === 'out') {
      return events.filter((e) => e.direction === 'out');
    }
    if (activeFilter === 'planned') {
      return events.filter((e) => e.type === 'recurring' || e.type === 'card' || e.type === 'ledger' || e.type === 'installment');
    }
    return events; // 'all'
  }

  function renderCalendarKpis(events) {
    const host = document.getElementById('calKpis');
    if (!host) return;

    const totalOut = round2(events.filter((e) => e.direction === 'out').reduce((s, e) => s + e.amount, 0));
    const totalIn = round2(events.filter((e) => e.direction === 'in').reduce((s, e) => s + e.amount, 0));
    const netPos = round2(totalIn - totalOut);
    const isPos = netPos >= 0;

    const outCount = events.filter((e) => e.direction === 'out').length;
    const inCount = events.filter((e) => e.direction === 'in').length;
    const volume = totalIn + totalOut;
    const inPct = volume > 0 ? Math.round((totalIn / volume) * 100) : 50;
    const outPct = volume > 0 ? 100 - inPct : 50;

    host.innerHTML = `
      <article class="dc-kpi-card tx-kpi-card tx-kpi-card--income">
        <div class="tx-kpi-card__head">
          <div>
            <span class="dc-kpi-card__label">Aylık Girişler</span>
            <div class="dc-kpi-card__value mono tx-kpi-val--income" data-privacy-blur>+${tryFmt(totalIn)}</div>
          </div>
          <span class="dc-kpi-badge dc-kpi-badge--emerald mono">%${inPct} pay</span>
        </div>
        <div class="tx-kpi-spark-row">
          <div class="tx-kpi-spark-track">
            <span class="tx-kpi-spark-fill tx-kpi-spark-fill--emerald" style="width: ${inPct}%;"></span>
          </div>
          <div class="tx-kpi-foot">
            <span class="tx-kpi-caption">${inCount} gelir &amp; tahsilat kaydı</span>
            <span class="tx-kpi-caption mono">Gelir Akışı</span>
          </div>
        </div>
      </article>

      <article class="dc-kpi-card tx-kpi-card tx-kpi-card--expense">
        <div class="tx-kpi-card__head">
          <div>
            <span class="dc-kpi-card__label">Aylık Çıkışlar</span>
            <div class="dc-kpi-card__value mono tx-kpi-val--expense" data-privacy-blur>−${tryFmt(totalOut)}</div>
          </div>
          <span class="dc-kpi-badge dc-kpi-badge--rose mono">%${outPct} pay</span>
        </div>
        <div class="tx-kpi-spark-row">
          <div class="tx-kpi-spark-track">
            <span class="tx-kpi-spark-fill tx-kpi-spark-fill--rose" style="width: ${outPct}%;"></span>
          </div>
          <div class="tx-kpi-foot">
            <span class="tx-kpi-caption">${outCount} harcama, kart &amp; vade</span>
            <span class="tx-kpi-caption mono">Çıkış Akışı</span>
          </div>
        </div>
      </article>

      <article class="dc-kpi-card tx-kpi-card tx-kpi-card--net">
        <div class="tx-kpi-card__head">
          <div>
            <span class="dc-kpi-card__label">Net Nakit Pozisyonu</span>
            <div class="dc-kpi-card__value mono ${isPos ? 'tx-kpi-val--income' : 'tx-kpi-val--expense'}" data-privacy-blur>
              ${isPos ? '+' : '−'}${tryFmt(Math.abs(netPos))}
            </div>
          </div>
          <span class="dc-kpi-badge ${isPos ? 'dc-kpi-badge--emerald' : 'dc-kpi-badge--rose'} mono">
            ${isPos ? 'Pozitif Akış' : 'Açık Akış'}
          </span>
        </div>
        <div class="tx-kpi-spark-row">
          <div class="tx-kpi-dual-track" title="Giriş %${inPct} / Çıkış %${outPct}">
            <span class="tx-kpi-dual-in" style="width: ${inPct}%;"></span>
            <span class="tx-kpi-dual-out" style="width: ${outPct}%;"></span>
          </div>
          <div class="tx-kpi-foot">
            <span class="tx-kpi-caption">Giriş − Çıkış Dengesi</span>
            <span class="tx-kpi-caption mono">${events.length} toplam kayıt</span>
          </div>
        </div>
      </article>
    `;
  }

  function renderMonthSummaryCard(year, month, allMonthEvents) {
    const host = document.getElementById('calMonthSummaryCard');
    if (!host) return;

    const plannedTypes = new Set(['recurring', 'card', 'ledger', 'installment']);
    const plannedEvs = allMonthEvents.filter((e) => plannedTypes.has(e.type));

    const recAmt = round2(plannedEvs.filter((e) => e.type === 'recurring' && e.direction === 'out').reduce((s, e) => s + e.amount, 0));
    const cardAmt = round2(plannedEvs.filter((e) => e.type === 'card').reduce((s, e) => s + e.amount, 0));
    const ledgerAmt = round2(plannedEvs.filter((e) => e.type === 'ledger').reduce((s, e) => s + e.amount, 0));
    const instAmt = round2(plannedEvs.filter((e) => e.type === 'installment').reduce((s, e) => s + e.amount, 0));

    const upcomingList = [...plannedEvs]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);

    const upcomingHtml = upcomingList.length === 0
      ? '<div class="tx-rail-empty">Bu ay planlı ödeme veya vade yok.</div>'
      : upcomingList.map((ev) => {
          const dayPart = ev.date.slice(8, 10);
          const isRec = ev.direction === 'in';
          return `
            <button type="button" class="dc-rail-due-item" data-cal-jump="${esc(ev.date)}">
              <span class="cal-jump-day mono">${dayPart}</span>
              <div class="dc-rail-due-meta">
                <strong>${esc(ev.title)}</strong>
                <small>${esc(ev.subtitle)}</small>
              </div>
              <span class="dc-rail-due-amt mono ${isRec ? 'is-rec' : 'is-pay'}" data-privacy-blur>${isRec ? '+' : '−'}${tryFmt(ev.amount)}</span>
            </button>`;
        }).join('');

    host.innerHTML = `
      <header class="tx-rail-card__head">
        <div>
          <h3 class="tx-rail-card__title">${MONTHS_TR[month]} Planlı Akışlar</h3>
          <p class="tx-rail-card__sub">Sabit, ekstre ve vade özeti</p>
        </div>
        <span class="tx-rail-pill mono">${plannedEvs.length} planlı</span>
      </header>

      <div class="tx-rail-commits">
        <div class="tx-rail-commit">
          <span class="tx-rail-commit__lbl">Sabit Giderler</span>
          <strong class="mono" data-privacy-blur>${tryFmt(recAmt)}</strong>
        </div>
        <div class="tx-rail-commit">
          <span class="tx-rail-commit__lbl">Kart Ekstreleri</span>
          <strong class="mono" data-privacy-blur>${tryFmt(cardAmt)}</strong>
        </div>
        <div class="tx-rail-commit">
          <span class="tx-rail-commit__lbl">Defter Vadeleri</span>
          <strong class="mono" data-privacy-blur>${tryFmt(ledgerAmt)}</strong>
        </div>
        <div class="tx-rail-commit">
          <span class="tx-rail-commit__lbl">Taksit Planı</span>
          <strong class="mono" data-privacy-blur>${tryFmt(instAmt)}</strong>
        </div>
      </div>

      <div class="cal-upcoming-list">${upcomingHtml}</div>
    `;
  }

  function renderDayDetail(dateStr, dayEvents) {
    const host = document.getElementById('calDetailContent');
    if (!host) return;

    const parts = dateStr.split('-').map(Number);
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    const dayName = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }).format(dateObj);

    const totalOut = round2(dayEvents.filter((e) => e.direction === 'out').reduce((s, e) => s + e.amount, 0));
    const totalIn = round2(dayEvents.filter((e) => e.direction === 'in').reduce((s, e) => s + e.amount, 0));

    let listHtml = '';
    if (dayEvents.length === 0) {
      listHtml = `
        <div class="cal-detail-empty">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>Bu tarihte kayıtlı işlem veya ödeme bulunmuyor.</span>
        </div>`;
    } else {
      listHtml = dayEvents.map((ev) => {
        const isIncome = ev.direction === 'in';
        let badgeText = isIncome ? 'Gelir' : 'Gider';
        let badgeBg = isIncome ? 'var(--tint-green)' : 'var(--tint-red)';
        let badgeColor = isIncome ? 'var(--ink-green)' : 'var(--ink-red)';

        if (ev.type === 'card') {
          badgeText = 'Kredi Kartı';
          badgeBg = 'var(--tint-blue)';
          badgeColor = 'var(--ink-blue)';
        } else if (ev.type === 'recurring') {
          badgeText = isIncome ? 'Düzenli Gelir' : 'Sabit Gider';
          badgeBg = isIncome ? 'var(--tint-green)' : 'var(--tint-amber)';
          badgeColor = isIncome ? 'var(--ink-green)' : 'var(--ink-amber)';
        } else if (ev.type === 'installment') {
          badgeText = 'Taksit';
          badgeBg = 'var(--tint-violet)';
          badgeColor = 'var(--ink-violet)';
        } else if (ev.type === 'ledger') {
          badgeText = isIncome ? 'Tahsilat' : 'Borç';
          badgeBg = isIncome ? 'var(--tint-green)' : 'var(--tint-amber)';
          badgeColor = isIncome ? 'var(--ink-green)' : 'var(--ink-amber)';
        } else if (ev.type === 'card-pay') {
          badgeText = 'Borç Ödeme';
          badgeBg = 'var(--tint-blue)';
          badgeColor = 'var(--ink-blue)';
        }

        return `
          <div class="cal-event-item">
            <div class="cal-event-item__left">
              <div class="cal-event-item__top">
                <span class="cal-event-item__title">${esc(ev.title)}</span>
                <span class="cal-event-item__badge" style="background:${badgeBg}; color:${badgeColor};">${badgeText}</span>
              </div>
              <span class="cal-event-item__sub">${esc(ev.subtitle)}</span>
            </div>
            <span class="mono cal-event-item__amt ${isIncome ? 'is-in' : 'is-out'}" data-privacy-blur>
              ${isIncome ? '+' : '−'}${tryFmt(ev.amount)}
            </span>
          </div>`;
      }).join('');
    }

    host.innerHTML = `
      <div class="cal-detail-head">
        <div>
          <span class="cal-detail-kicker">GÜNLÜK HAREKET ÖZETİ</span>
          <h3 class="cal-detail-date">${dayName}</h3>
        </div>
        <div class="cal-detail-totals mono">
          <span class="is-in" data-privacy-blur>+${tryFmt(totalIn)}</span>
          <span class="is-out" data-privacy-blur>−${tryFmt(totalOut)}</span>
        </div>
      </div>
      <div class="cal-detail-list">
        ${listHtml}
      </div>
    `;
  }

  function renderGrid(year, month, allMonthEvents) {
    const weekdaysHost = document.getElementById('calWeekdaysRow');
    const daysHost = document.getElementById('calDaysGrid');
    const titleEl = document.getElementById('calMonthTitle');
    if (!daysHost) return;

    if (titleEl) {
      titleEl.textContent = `${MONTHS_TR[month]} ${year}`;
    }

    if (weekdaysHost) {
      weekdaysHost.innerHTML = WEEKDAYS_TR.map(
        (day) => `<div class="cal-weekday">${day}</div>`
      ).join('');
    }

    const firstDayIndex = new Date(year, month, 1).getDay();
    const startOffset = (firstDayIndex + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
    const rowCount = totalCells / 7;

    const todayStr = new Date().toISOString().slice(0, 10);
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const filteredEvents = filterEvents(allMonthEvents);

    let cellsHtml = '';

    for (let i = startOffset - 1; i >= 0; i--) {
      const prevD = daysInPrevMonth - i;
      cellsHtml += `<div class="cal-cell cal-cell--muted"><span class="cal-day-num mono">${prevD}</span></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${monthKey}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDateStr;
      const dayEvs = filteredEvents.filter((e) => e.date === dateStr);

      const pillsHtml = dayEvs.slice(0, 2).map((ev) => {
        const isIncome = ev.direction === 'in';
        const pillCls = isIncome
          ? 'cal-pill--in'
          : (ev.type === 'card' || ev.type === 'card-pay' ? 'cal-pill--card' : (ev.type === 'installment' ? 'cal-pill--inst' : 'cal-pill--out'));
        const shortAmt = tryFmt(ev.amount);
        return `
          <div class="cal-pill ${pillCls}" title="${esc(ev.title)} (${shortAmt})">
            <span class="mono">${isIncome ? '+' : '−'}${shortAmt}</span> ${esc(ev.title)}
          </div>`;
      }).join('');

      const moreCount = dayEvs.length > 2 ? dayEvs.length - 2 : 0;
      const moreHtml = moreCount > 0 ? `<div class="cal-pill-more mono">+${moreCount} işlem daha</div>` : '';

      cellsHtml += `
        <div class="cal-cell ${isToday ? 'cal-cell--today' : ''} ${isSelected ? 'cal-cell--selected' : ''}" data-date="${dateStr}">
          <div class="cal-cell-top">
            <span class="cal-day-num mono">${d}</span>
            ${isToday ? '<span class="cal-today-tag">BUGÜN</span>' : ''}
          </div>
          <div class="cal-pills-wrap">${pillsHtml}${moreHtml}</div>
        </div>`;
    }

    const trailingCount = totalCells - (startOffset + daysInMonth);
    for (let t = 1; t <= trailingCount; t++) {
      cellsHtml += `<div class="cal-cell cal-cell--muted"><span class="cal-day-num mono">${t}</span></div>`;
    }

    daysHost.style.gridTemplateRows = `repeat(${rowCount}, minmax(0, 1fr))`;
    daysHost.innerHTML = cellsHtml;

    daysHost.querySelectorAll('.cal-cell[data-date]').forEach((cell) => {
      cell.addEventListener('click', () => {
        selectedDateStr = cell.dataset.date;
        const currentEvents = getMonthEvents(year, month);
        const dayEvs = currentEvents.filter((e) => e.date === selectedDateStr);
        renderGrid(year, month, currentEvents);
        renderDayDetail(selectedDateStr, dayEvs);
      });
    });

    const activeDayEvs = filteredEvents.filter((e) => e.date === selectedDateStr);
    renderDayDetail(selectedDateStr, activeDayEvs);
    renderMonthSummaryCard(year, month, allMonthEvents);
  }

  function render() {
    try {
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const allEvents = getMonthEvents(year, month);
      renderCalendarKpis(allEvents);
      renderGrid(year, month, allEvents);
    } catch (err) {
      console.error('Calendar render error:', err);
    }
  }

  function init() {
    document.getElementById('calPrevMonthBtn')?.addEventListener('click', () => {
      viewDate.setMonth(viewDate.getMonth() - 1);
      render();
    });

    document.getElementById('calNextMonthBtn')?.addEventListener('click', () => {
      viewDate.setMonth(viewDate.getMonth() + 1);
      render();
    });

    document.getElementById('calTodayBtn')?.addEventListener('click', () => {
      viewDate = new Date();
      selectedDateStr = new Date().toISOString().slice(0, 10);
      render();
    });

    // Filtreleme butonları
    document.querySelectorAll('.cal-filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeFilter = btn.dataset.calFilter || 'all';
        document.querySelectorAll('.cal-filter-btn').forEach((b) => {
          b.classList.toggle('is-active', b === btn);
        });
        render();
      });
    });

    document.getElementById('calMonthSummaryCard')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cal-jump]');
      if (!btn) return;
      selectedDateStr = btn.dataset.calJump || selectedDateStr;
      render();
    });

    State.on('transactions:changed', render);
    State.on('accounts:changed', render);
    State.on('ledger:changed', render);
  }

  const Calendar = {
    init,
    render,
  };

  window.Vaulty = window.Vaulty || {};
  window.Vaulty.Views = window.Vaulty.Views || {};
  window.Vaulty.Views.Calendar = Calendar;
})();
