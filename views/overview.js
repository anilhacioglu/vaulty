/* =========================================================================
   VAULTY VIEW: OVERVIEW (Genel Bakış / Bento Grid Kokpiti)
   ========================================================================= */
(() => {
  const State = window.Vaulty?.State;
  const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const tryFmt = (n) => (State && State.tryFmt ? State.tryFmt(n) : `${round2(n)} ₺`);
  const esc = (s) => (State && State.esc ? State.esc(s) : (s ? String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]) : ''));
  const remainingAmount = (item) => (State && State.remainingAmount ? State.remainingAmount(item) : 0);
  const isArchived = (item) => (State && State.isArchived ? State.isArchived(item) : false);
  const parseMoney = (n) => (State && State.parseMoney ? State.parseMoney(n) : Number(n) || 0);

  function dashSparkline(values, color) {
    if (!values || !Array.isArray(values) || values.length === 0) return '';
    const cleanVals = values.map((v) => Number(v) || 0);
    const W = 120, H = 34, P = 3;
    const min = Math.min(...cleanVals), max = Math.max(...cleanVals);
    const span = max - min || 1;
    const pts = cleanVals.map((v, i) => [
      P + (i * (W - 2 * P)) / Math.max(1, cleanVals.length - 1),
      H - P - ((v - min) / span) * (H - 2 * P),
    ]);
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
    const gid = 'dsg' + String(color || '#10B981').replace('#', '');
    return `<svg class="dash-spark" viewBox="0 0 ${W} ${H}" fill="none" aria-hidden="true">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity="0.25"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      <path d="${line} L${W - P} ${H} L${P} ${H} Z" fill="url(#${gid})"/>
      <path class="dash-spark__line" d="${line}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>
    </svg>`;
  }

  function animateDashCounters() {
    document.querySelectorAll('#dashboardView [data-count]').forEach((el) => {
      const target = parseMoney(el.dataset.count) || 0;
      const hasDecimals = Math.abs(target % 1) > 0.0001;
      const prefix = el.dataset.prefix || '';
      const t0 = performance.now();
      const dur = 750;
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - p, 3);
        const current = hasDecimals ? round2(target * e) : Math.round(target * e);
        el.textContent = prefix + tryFmt(current);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = prefix + tryFmt(target);
      };
      requestAnimationFrame(step);
    });
  }

  function playDashEntrance() {
    const view = document.getElementById('dashboardView');
    if (!view) return;
    view.classList.remove('dash-enter');
    void view.offsetWidth;
    view.classList.add('dash-enter');
    animateDashCounters();
  }

  function renderMetrics() {
    const kpiHost = document.getElementById('kpis');
    if (!kpiHost) return;

    try {
      const liquidAccs = State.accounts.filter((a) => a && (a.type === 'checking' || a.type === 'cash'));
      const creditAccs = State.accounts.filter((a) => a && a.type === 'credit');
      const activeRecs = State.ledgerItems.filter((x) => x && x.kind === 'receivable' && !isArchived(x));
      const activePays = State.ledgerItems.filter((x) => x && x.kind === 'payable' && !isArchived(x));

      const totalLiquidity = round2(liquidAccs.reduce((s, a) => s + Number(a.balance || 0), 0));
      const totalCardDebt = round2(creditAccs.reduce((s, a) => s + Number(a.debt || 0), 0));
      const totalRec = round2(activeRecs.reduce((s, x) => s + remainingAmount(x), 0));
      const totalPay = round2(activePays.reduce((s, x) => s + remainingAmount(x), 0));
      const netWorth = round2(totalLiquidity + totalRec - totalPay - totalCardDebt);

      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const monthName = new Intl.DateTimeFormat('tr-TR', { month: 'long' }).format(now);

      const monthInc = round2(
        State.tx
          .filter((t) => t && t.type === 'Gelir' && String(t.date || '').startsWith(monthKey))
          .reduce((s, t) => s + Number((t.amount ?? t.tutar) || 0), 0)
      );
      const monthExp = round2(
        State.tx
          .filter((t) => t && (t.type === 'Gider' || t.type === 'Kart Borcu Ödeme') && String(t.date || '').startsWith(monthKey))
          .reduce((s, t) => s + Number((t.amount ?? t.tutar) || 0), 0)
      );
      const monthNet = round2(monthInc - monthExp);

      const dues = activePays
        .filter((x) => State.daysTo(x.dueDate) <= 14)
        .sort((a, b) => State.daysTo(a.dueDate) - State.daysTo(b.dueDate));
      const duesTotal = round2(dues.reduce((s, x) => s + remainingAmount(x), 0));
      const overdueCount = dues.filter((x) => State.daysTo(x.dueDate) < 0).length;

      const flow6 = window.Vaulty.Charts?.getCashflowLast6Months ? window.Vaulty.Charts.getCashflowLast6Months() : [];
      const netTrend = flow6.map((d) => d.inc - d.exp);
      const netColor = monthNet >= 0 ? '#10B981' : '#E11D48';

      kpiHost.innerHTML = `
        <article class="dash-card dash-kpi dash-anim" style="--i:0">
          <div class="dash-kpi__top">
            <span class="dash-kpi__label">Net Varlık Değeri</span>
            <span class="dash-pill dash-pill--slate mono">${State.accounts.length} aktif hesap</span>
          </div>
          <div class="dash-kpi__value mono" data-count="${netWorth}">${tryFmt(netWorth)}</div>
          <div class="dash-kpi__foot"><span>Likidite + Alacak − Borçlar</span></div>
        </article>

        <article class="dash-card dash-kpi dash-anim" style="--i:1">
          <div class="dash-kpi__top">
            <span class="dash-kpi__label">Bu Ayın Nakit Dengesi</span>
            <span class="dash-pill ${monthNet >= 0 ? 'dash-pill--emerald' : 'dash-pill--rose'} mono">${monthNet >= 0 ? 'Pozitif' : 'Negatif'}</span>
          </div>
          <div class="dash-kpi__value mono ${monthNet >= 0 ? 'is-pos' : 'is-neg'}" data-count="${Math.abs(monthNet)}" data-prefix="${monthNet >= 0 ? '+' : '-'}">${monthNet >= 0 ? '+' : '-'}${tryFmt(Math.abs(monthNet))}</div>
          <div class="dash-kpi__foot"><span>Gelir − Gider · ${monthName}</span>${dashSparkline(netTrend, netColor)}</div>
        </article>

        <article class="dash-card dash-kpi dash-anim" style="--i:2">
          <div class="dash-kpi__top">
            <span class="dash-kpi__label">14 Gün İçinde Vadesi Gelenler</span>
            <span class="dash-pill ${overdueCount ? 'dash-pill--rose' : 'dash-pill--amber'} mono">${overdueCount ? overdueCount + ' gecikmiş' : '14 gün içinde'}</span>
          </div>
          <div class="dash-kpi__value mono" data-count="${duesTotal}">${tryFmt(duesTotal)}</div>
          <div class="dash-kpi__foot"><span>${dues.length} ödeme · Yaklaşan ve geciken borçlar</span></div>
        </article>`;
    } catch (err) {
      console.error('KPI metrics error:', err);
    }
  }

  const DAYS_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

  function renderAnalytics() {
    const host = document.getElementById('dashAnalyticsSection');
    if (!host) return;

    try {
      const now = new Date();
      const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

      const allTx = Array.isArray(State.tx) ? State.tx : [];

      // 1. Bu ayki ve geçen ayki toplam gelir/gider
      const thisMonthInc = allTx
        .filter((t) => t && t.type === 'Gelir' && String(t.date || '').startsWith(thisMonthKey))
        .reduce((s, t) => s + Number((t.amount ?? t.tutar) || 0), 0);

      const thisMonthExp = allTx
        .filter((t) => t && (t.type === 'Gider' || t.type === 'Kart Borcu Ödeme') && String(t.date || '').startsWith(thisMonthKey))
        .reduce((s, t) => s + Number((t.amount ?? t.tutar) || 0), 0);

      const lastMonthExp = allTx
        .filter((t) => t && (t.type === 'Gider' || t.type === 'Kart Borcu Ödeme') && String(t.date || '').startsWith(lastMonthKey))
        .reduce((s, t) => s + Number((t.amount ?? t.tutar) || 0), 0);

      // MoM Trend
      let momText = 'Veri toplanıyor';
      let momPillCls = 'dash-pill--slate';
      if (lastMonthExp > 0) {
        const diff = round2(((thisMonthExp - lastMonthExp) / lastMonthExp) * 100);
        if (diff <= 0) {
          momText = `▼ %${Math.abs(diff)} daha az harcama`;
          momPillCls = 'dash-pill--emerald';
        } else {
          momText = `▲ %${diff} harcama artışı`;
          momPillCls = 'dash-pill--rose';
        }
      }

      // 2. Tasarruf Oranı
      let savingsRate = 0;
      if (thisMonthInc > 0) {
        const savingsAmt = thisMonthInc - thisMonthExp;
        savingsRate = Math.max(0, Math.round((savingsAmt / thisMonthInc) * 100));
      }

      // 3. Lider Harcama Kategorisi
      const catMap = {};
      allTx
        .filter((t) => t && (t.type === 'Gider' || t.type === 'Kart Borcu Ödeme') && String(t.date || '').startsWith(thisMonthKey))
        .forEach((t) => {
          const c = t.cat || 'Diğer';
          catMap[c] = (catMap[c] || 0) + Number((t.amount ?? t.tutar) || 0);
        });

      let topCat = 'Henüz Harcama Yok';
      let topCatAmt = 0;
      for (const [k, v] of Object.entries(catMap)) {
        if (v > topCatAmt) {
          topCatAmt = v;
          topCat = k;
        }
      }
      const topCatShare = thisMonthExp > 0 ? Math.round((topCatAmt / thisMonthExp) * 100) : 0;

      // 4. En Yoğun Harcama Günü
      const dayCounts = [0, 0, 0, 0, 0, 0, 0];
      allTx
        .filter((t) => t && (t.type === 'Gider' || t.type === 'Kart Borcu Ödeme'))
        .forEach((t) => {
          if (t.date) {
            const d = new Date(t.date).getDay();
            if (!isNaN(d)) dayCounts[d]++;
          }
        });
      let peakDayIdx = 5; // Default Cuma
      let maxDayCount = -1;
      dayCounts.forEach((cnt, idx) => {
        if (cnt > maxDayCount) {
          maxDayCount = cnt;
          peakDayIdx = idx;
        }
      });
      const peakDayName = DAYS_TR[peakDayIdx];

      host.innerHTML = `
        <header class="dash-panel__head">
          <div>
            <h2 class="dash-panel__title">Harcama Analitiği &amp; Karşılaştırma Raporu</h2>
            <p class="dash-panel__sub">Aylık trend, tasarruf oranı ve davranışsal finansal metrikler</p>
          </div>
        </header>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px;">
          <!-- Kart 1: MoM Karşılaştırma -->
          <div class="dash-kpi" style="padding: 14px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; font-weight: 600; color: #64748B;">GEÇEN AYA KIYASLA</span>
              <span class="dash-pill ${momPillCls} mono" style="font-size: 10px;">MoM Trend</span>
            </div>
            <div style="font-size: 15px; font-weight: 700; color: #0F172A; margin-bottom: 4px;">${momText}</div>
            <span style="font-size: 11px; color: #64748B;">Geçen ay toplam: <strong class="mono" data-privacy-blur>${tryFmt(lastMonthExp)}</strong></span>
          </div>

          <!-- Kart 2: Tasarruf Oranı -->
          <div class="dash-kpi" style="padding: 14px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; font-weight: 600; color: #64748B;">AYLIK TASARRUF ORANI</span>
              <span class="dash-pill ${savingsRate >= 20 ? 'dash-pill--emerald' : 'dash-pill--amber'} mono" style="font-size: 10px;">%${savingsRate}</span>
            </div>
            <div style="font-size: 15px; font-weight: 700; color: #059669; margin-bottom: 4px;">%${savingsRate} Tasarruf</div>
            <span style="font-size: 11px; color: #64748B;">Gelirin birikime dönen payı</span>
          </div>

          <!-- Kart 3: Lider Kategori -->
          <div class="dash-kpi" style="padding: 14px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; font-weight: 600; color: #64748B;">EN ÇOK HARCANAN ALAN</span>
              <span class="dash-pill dash-pill--rose mono" style="font-size: 10px;">%${topCatShare} pay</span>
            </div>
            <div style="font-size: 15px; font-weight: 700; color: #0F172A; margin-bottom: 4px;">${esc(topCat)}</div>
            <span style="font-size: 11px; color: #64748B;">Bu ay harcanan: <strong class="mono" data-privacy-blur>${tryFmt(topCatAmt)}</strong></span>
          </div>

          <!-- Kart 4: En Yoğun Gün -->
          <div class="dash-kpi" style="padding: 14px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; font-weight: 600; color: #64748B;">EN YOĞUN HARCAMA GÜNÜ</span>
              <span class="dash-pill dash-pill--indigo mono" style="font-size: 10px;">Davranışsal</span>
            </div>
            <div style="font-size: 15px; font-weight: 700; color: #0F172A; margin-bottom: 4px;">${peakDayName} Günleri</div>
            <span style="font-size: 11px; color: #64748B;">Haftalık pik harcama noktası</span>
          </div>
        </div>
      `;
    } catch (err) {
      console.error('renderAnalytics error:', err);
    }
  }

  function render() {
    renderMetrics();
    window.Vaulty.RecurringEngine?.renderDashboardAlertBanner?.();
    window.Vaulty.Charts?.drawCash?.();
    window.Vaulty.Charts?.drawSpend?.();
    renderAnalytics();
    window.Vaulty.Tables?.renderRecentTxTable?.();
    window.Vaulty.Cards?.renderDashboardWalletCards?.();
    window.Vaulty.Tables?.renderRadarTable?.();
    playDashEntrance();
  }

  function init() {
    // Note: Action buttons (dashAllTxLink, dashAddAccBtn, openNewTxFromDashBtn)
    // are delegated centrally in core/events.js to prevent double-execution.

    State.on('transactions:changed', () => {
      renderMetrics();
      window.Vaulty.RecurringEngine?.renderDashboardAlertBanner?.();
      window.Vaulty.Charts?.drawCash?.();
      window.Vaulty.Charts?.drawSpend?.();
      renderAnalytics();
      window.Vaulty.Tables?.renderRecentTxTable?.();
      window.Vaulty.Tables?.renderRadarTable?.();
    });

    State.on('accounts:changed', () => {
      renderMetrics();
      renderAnalytics();
      window.Vaulty.RecurringEngine?.renderDashboardAlertBanner?.();
      window.Vaulty.Cards?.renderDashboardWalletCards?.();
      window.Vaulty.Charts?.drawCash?.();
      window.Vaulty.Tables?.renderRadarTable?.();
    });

    State.on('ledger:changed', () => {
      renderMetrics();
      window.Vaulty.Tables?.renderRadarTable?.();
    });
  }

  const Overview = {
    init,
    render,
    renderMetrics,
  };

  window.Vaulty = window.Vaulty || {};
  window.Vaulty.Views = window.Vaulty.Views || {};
  window.Vaulty.Views.Overview = Overview;
})();

