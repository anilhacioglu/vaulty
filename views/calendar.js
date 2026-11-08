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

    host.innerHTML = `
      <article class="dc-kpi-card dc-kpi-card--debt">
        <div class="dc-kpi-card__top">
          <span class="dc-kpi-card__label">Aylık Çıkışlar (Gider, Borç &amp; Ekstre)</span>
        </div>
        <div class="dc-kpi-card__value mono" style="color:#E11D48;">${tryFmt(totalOut)}</div>
        <span class="dc-kpi-badge dc-kpi-badge--rose mono">
          ${outCount} adet işlem / ödeme
        </span>
      </article>

      <article class="dc-kpi-card dc-kpi-card--debt">
        <div class="dc-kpi-card__top">
          <span class="dc-kpi-card__label">Aylık Girişler (Gelir &amp; Tahsilat)</span>
        </div>
        <div class="dc-kpi-card__value mono" style="color:#059669;">${tryFmt(totalIn)}</div>
        <span class="dc-kpi-badge dc-kpi-badge--emerald mono">
          ${inCount} adet gelir / tahsilat
        </span>
      </article>

      <article class="dc-kpi-card dc-kpi-card--debt">
        <div class="dc-kpi-card__top">
          <span class="dc-kpi-card__label">Net Nakit Akışı Pozisyonu</span>
        </div>
        <div class="dc-kpi-card__value mono ${isPos ? 'is-pos' : 'is-neg'}" style="color:${isPos ? '#059669' : '#E11D48'};">
          ${isPos ? '+' : '−'}${tryFmt(Math.abs(netPos))}
        </div>
        <span class="dc-kpi-badge ${isPos ? 'dc-kpi-badge--net-pos' : 'dc-kpi-badge--net-neg'} mono">
          ${isPos ? '▲ Pozitif Nakit Akışı' : '▼ Net Nakit Açığı'}
        </span>
      </article>
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
    const net = round2(totalIn - totalOut);

    let listHtml = '';
    if (dayEvents.length === 0) {
      listHtml = `
        <div style="padding:36px 12px; text-align:center; color:#94A3B8; font-size:13px;">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.8" style="margin:0 auto 10px; display:block; opacity:0.6;">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Bu tarihte kayıtlı bir işlem, gelir veya ödeme bulunmuyor.
        </div>`;
    } else {
      listHtml = dayEvents.map((ev) => {
        const isIncome = ev.direction === 'in';
        let badgeText = isIncome ? 'Gelir' : 'Gider';
        let badgeBg = isIncome ? '#ECFDF5' : '#FEF2F2';
        let badgeColor = isIncome ? '#059669' : '#DC2626';

        if (ev.type === 'card') {
          badgeText = 'Kredi Kartı';
          badgeBg = '#EFF6FF';
          badgeColor = '#2563EB';
        } else if (ev.type === 'recurring') {
          badgeText = isIncome ? 'Düzenli Gelir' : 'Sabit Gider';
          badgeBg = isIncome ? '#ECFDF5' : '#FEF3C7';
          badgeColor = isIncome ? '#059669' : '#D97706';
        } else if (ev.type === 'installment') {
          badgeText = 'Taksit';
          badgeBg = '#F5F3FF';
          badgeColor = '#7C3AED';
        } else if (ev.type === 'ledger') {
          badgeText = isIncome ? 'Tahsilat' : 'Borç';
          badgeBg = isIncome ? '#ECFDF5' : '#FEF3C7';
          badgeColor = isIncome ? '#059669' : '#D97706';
        } else if (ev.type === 'card-pay') {
          badgeText = 'Borç Ödeme';
          badgeBg = '#EFF6FF';
          badgeColor = '#2563EB';
        }

        return `
          <div class="cal-event-item" style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #F1F5F9; gap:8px;">
            <div style="display:flex; flex-direction:column; gap:3px; min-width:0; flex:1;">
              <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                <span style="font-weight:600; font-size:13px; color:#0F172A; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${esc(ev.title)}</span>
                <span style="font-size:10px; font-weight:700; background:${badgeBg}; color:${badgeColor}; padding:1px 6px; border-radius:4px; flex-shrink:0;">${badgeText}</span>
              </div>
              <span style="font-size:11.5px; color:#64748B;">${esc(ev.subtitle)}</span>
            </div>
            <span class="mono" style="font-weight:700; font-size:13.5px; color:${isIncome ? '#059669' : '#E11D48'}; flex-shrink:0;">
              ${isIncome ? '+' : '−'}${tryFmt(ev.amount)}
            </span>
          </div>`;
      }).join('');
    }

    host.innerHTML = `
      <div class="cal-detail-head" style="margin-bottom:14px; padding-bottom:12px; border-bottom:1px solid #E2E8F0;">
        <span style="font-size:11px; font-weight:700; color:#64748B; text-transform:uppercase; letter-spacing:0.04em;">GÜNLÜK HAREKET ÖZETİ</span>
        <h3 style="font-size:16px; font-weight:700; color:#0F172A; margin:4px 0;">${dayName}</h3>
        <div style="display:flex; gap:14px; margin-top:8px; font-size:12px;" class="mono">
          <span style="color:#059669; font-weight:600;">Giriş: +${tryFmt(totalIn)}</span>
          <span style="color:#E11D48; font-weight:600;">Çıkış: −${tryFmt(totalOut)}</span>
        </div>
      </div>
      <div class="cal-detail-list" style="max-height:380px; overflow-y:auto; padding-right:4px;">
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
        (day) => `<div class="cal-weekday" style="text-align:center; font-weight:700; font-size:12px; color:#64748B; padding:8px 0;">${day}</div>`
      ).join('');
      weekdaysHost.style.display = 'grid';
      weekdaysHost.style.gridTemplateColumns = 'repeat(7, 1fr)';
      weekdaysHost.style.borderBottom = '1px solid #E2E8F0';
    }

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const startOffset = (firstDayIndex + 6) % 7; // Convert to Monday-first (0 is Monday, 6 is Sunday)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const todayStr = new Date().toISOString().slice(0, 10);
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

    // Filter events based on active tab
    const filteredEvents = filterEvents(allMonthEvents);

    let cellsHtml = '';

    // Önceki aydan taşan günler
    for (let i = startOffset - 1; i >= 0; i--) {
      const prevD = daysInPrevMonth - i;
      cellsHtml += `<div class="cal-cell cal-cell--muted" style="min-height:92px; padding:6px; background:#FAFAFA; border:1px solid #F1F5F9; color:#CBD5E1; font-size:12px;">${prevD}</div>`;
    }

    // Bu ayın günleri
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${monthKey}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDateStr;
      const dayEvs = filteredEvents.filter((e) => e.date === dateStr);

      const pillsHtml = dayEvs.slice(0, 3).map((ev) => {
        const isIncome = ev.direction === 'in';
        const bg = isIncome 
          ? '#ECFDF5' 
          : (ev.type === 'card' ? '#EFF6FF' : (ev.type === 'installment' ? '#F5F3FF' : '#FEF2F2'));
        const color = isIncome 
          ? '#059669' 
          : (ev.type === 'card' ? '#2563EB' : (ev.type === 'installment' ? '#7C3AED' : '#DC2626'));
        const shortAmt = tryFmt(ev.amount);
        return `
          <div class="cal-pill" style="background:${bg}; color:${color}; font-size:10px; font-weight:600; padding:2px 5px; border-radius:4px; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${esc(ev.title)} (${shortAmt})">
            ${isIncome ? '+' : '−'}${shortAmt} ${esc(ev.title)}
          </div>`;
      }).join('');

      const moreCount = dayEvs.length > 3 ? dayEvs.length - 3 : 0;
      const moreHtml = moreCount > 0 ? `<div style="font-size:9.5px; font-weight:600; color:#64748B; margin-top:2px;">+${moreCount} diğer</div>` : '';

      cellsHtml += `
        <div class="cal-cell ${isToday ? 'cal-cell--today' : ''} ${isSelected ? 'cal-cell--selected' : ''}" data-date="${dateStr}" style="min-height:92px; padding:7px; border:1px solid ${isSelected ? '#3B82F6' : '#E2E8F0'}; border-radius:10px; cursor:pointer; background:${isSelected ? '#EFF6FF' : isToday ? '#FEFCE8' : '#FFFFFF'}; box-shadow:${isSelected ? '0 0 0 1px #3B82F6' : 'none'}; transition:all 120ms ease;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="mono" style="font-weight:700; font-size:12.5px; color:${isToday ? '#B45309' : '#0F172A'};">${d}</span>
            ${isToday ? '<span style="font-size:9px; background:#FDE68A; color:#92400E; padding:1px 5px; border-radius:4px; font-weight:700;">BUGÜN</span>' : ''}
          </div>
          <div class="cal-pills-wrap" style="margin-top:2px;">${pillsHtml}${moreHtml}</div>
        </div>`;
    }

    daysHost.innerHTML = cellsHtml;
    daysHost.style.display = 'grid';
    daysHost.style.gridTemplateColumns = 'repeat(7, 1fr)';
    daysHost.style.gap = '6px';
    daysHost.style.marginTop = '8px';

    // Gün Seçimi Olayı
    daysHost.querySelectorAll('.cal-cell[data-date]').forEach((cell) => {
      cell.addEventListener('click', () => {
        selectedDateStr = cell.dataset.date;
        const currentEvents = getMonthEvents(year, month);
        const dayEvs = currentEvents.filter((e) => e.date === selectedDateStr);
        renderGrid(year, month, currentEvents);
        renderDayDetail(selectedDateStr, dayEvs);
      });
    });

    const activeDayEvs = allMonthEvents.filter((e) => e.date === selectedDateStr);
    renderDayDetail(selectedDateStr, activeDayEvs);
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
          const on = b === btn;
          b.classList.toggle('is-active', on);
          b.style.background = on ? '#FFFFFF' : 'transparent';
          b.style.color = on ? '#0F172A' : '#64748B';
          b.style.boxShadow = on ? '0 1px 3px rgba(0,0,0,0.08)' : 'none';
        });
        render();
      });
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
