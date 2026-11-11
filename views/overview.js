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

  let _lastTrajW = 0;
  let _lastTrajArgs = null;

  function renderHeroBalanceTrajectory(flow6, netWorth, monthNet, dues) {
    const host = document.getElementById('heroBalanceSpark');
    if (!host) return;
    _lastTrajArgs = [flow6, netWorth, monthNet, dues];

    const shortTry = (State && State.shortTry) ? State.shortTry : (v) => `${Math.round(v / 1000)}B ₺`;

    // Son 12 işlem gününün gerçek nakit akışından geriye dönük dalgalı bakiye seyri oluştur
    const byDay = {};
    (Array.isArray(State.tx) ? State.tx : []).forEach((t) => {
      if (!t || !t.date) return;
      const dStr = String(t.date).slice(0, 10);
      const amt = Number((t.amount ?? t.tutar) || 0);
      if (amt <= 0) return;
      if (!byDay[dStr]) byDay[dStr] = { date: dStr, inc: 0, exp: 0 };
      if (t.type === 'Gelir') byDay[dStr].inc += amt;
      else if (t.type === 'Gider' || t.type === 'Kart Borcu Ödeme') byDay[dStr].exp += amt;
    });

    const sortedDays = Object.values(byDay).sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-10);
    let series = [];
    if (sortedDays.length >= 3) {
      let running = netWorth;
      const fmtDay = (iso) => {
        const p = iso.split('-').map(Number);
        const dt = new Date(p[0], p[1] - 1, p[2]);
        return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(dt);
      };
      for (let i = sortedDays.length - 1; i >= 0; i--) {
        const d = sortedDays[i];
        series.unshift({ label: fmtDay(d.date), fullDate: d.date, val: round2(running), net: round2(d.inc - d.exp) });
        running -= (d.inc - d.exp);
      }
    } else {
      const ptsData = Array.isArray(flow6) && flow6.length ? flow6 : [
        { m: 'Haz', inc: 0, exp: 0 }, { m: 'Tem', inc: 0, exp: 0 }, { m: 'Ağu', inc: 0, exp: 0 },
        { m: 'Eyl', inc: 0, exp: 0 }, { m: 'Eki', inc: 0, exp: 0 }, { m: 'Kas', inc: 0, exp: 0 },
      ];
      let running = netWorth;
      for (let i = ptsData.length - 1; i >= 0; i--) {
        series.unshift({ label: ptsData[i].m, fullDate: ptsData[i].m, val: round2(running), net: round2(ptsData[i].inc - ptsData[i].exp) });
        running -= (ptsData[i].inc - ptsData[i].exp);
      }
    }

    const duesSum = round2((dues || []).reduce((s, x) => s + remainingAmount(x), 0));
    const projMid = round2(netWorth - duesSum * 0.45 + (monthNet > 0 ? monthNet * 0.12 : 0));
    const projEnd = round2(netWorth - duesSum + (monthNet > 0 ? monthNet * 0.35 : 0));
    const projPts = [
      { label: '7 Gün', fullDate: '7 Günlük Tahmin', val: projMid, net: projMid - netWorth, isForecast: true },
      { label: 'Ay Sonu', fullDate: 'Ay Sonu Öngörü', val: projEnd, net: projEnd - netWorth, isForecast: true },
    ];

    const allPts = [...series, ...projPts];
    const allVals = allPts.map((p) => p.val);
    const rawMin = Math.min(...allVals);
    const rawMax = Math.max(...allVals);
    const pad = Math.max(2000, (rawMax - rawMin) * 0.18);
    const minV = rawMin - pad * 0.5;
    const maxV = rawMax + pad;
    const span = maxV - minV || 1000;

    const W = Math.max(460, Math.round(host.clientWidth || 720));
    _lastTrajW = W;
    const H = 154;
    const L = 58;
    const R = 22;
    const T = 28;
    const B = 24;
    const splitIdx = series.length - 1;

    const xOf = (idx) => L + (idx * (W - L - R)) / Math.max(1, allPts.length - 1);
    const yOf = (v) => T + (1 - (v - minV) / span) * (H - T - B);

    const coords = allPts.map((p, i) => [xOf(i), yOf(p.val)]);
    const realCoords = coords.slice(0, series.length);
    const foreCoords = coords.slice(splitIdx);

    const realPath = realCoords.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
    const areaPath = `${realPath} L${realCoords[splitIdx][0].toFixed(1)} ${H - B} L${realCoords[0][0].toFixed(1)} ${H - B} Z`;
    const forecastPath = foreCoords.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

    const todayX = realCoords[splitIdx][0];

    // Yatay kilavuz cizgileri ve Y ekseni olcegi (3 seviye)
    let gridHtml = '';
    for (let g = 0; g <= 2; g++) {
      const v = minV + (span / 2) * g;
      const py = yOf(v);
      gridHtml += `<line x1="${L}" x2="${W - R}" y1="${py.toFixed(1)}" y2="${py.toFixed(1)}" stroke="var(--border-subtle)" stroke-width="1"/>`;
      gridHtml += `<text x="${L - 10}" y="${(py + 3.5).toFixed(1)}" text-anchor="end" fill="var(--text-muted)" font-size="11">${shortTry(v)}</text>`;
    }

    const dotsHtml = coords.map((p, i) => {
      const pt = allPts[i];
      const col = pt.isForecast ? '#FBBF24' : (pt.net >= 0 ? '#3B82F6' : '#FB7185');
      const r = i === splitIdx ? 5 : 3.6;
      return `<circle class="vy-traj-dot" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${r}" fill="${col}" stroke="var(--bg-surface)" stroke-width="1.8" style="--i:${i}" data-traj-i="${i}"/>`;
    }).join('');

    // X ekseni etiketleri (sikismayi onlemek icin seyrelt)
    const xLabelsHtml = allPts.map((pt, i) => {
      const show = i === 0 || i === splitIdx || i === allPts.length - 1 || (allPts.length <= 9 ? i % 2 === 0 : i % 3 === 0);
      if (!show) return '';
      const anchor = i === allPts.length - 1 ? 'end' : 'middle';
      return `<text x="${coords[i][0].toFixed(1)}" y="${H - 5}" text-anchor="${anchor}" fill="var(--text-muted)" font-size="11">${esc(pt.label)}</text>`;
    }).join('');

    const hitSlotsHtml = coords.map((p, i) => {
      const slotW = (W - L - R) / Math.max(1, allPts.length - 1);
      return `<rect class="vy-traj-hit" data-traj-i="${i}" x="${(p[0] - slotW / 2).toFixed(1)}" y="${T - 4}" width="${slotW.toFixed(1)}" height="${H - T - B + 8}" fill="transparent"/>`;
    }).join('');

    host.innerHTML = `
      <div class="vy-traj-box">
        <div class="vy-traj-svg-wrap">
          <svg class="vy-traj-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Bakiye seyri ve tahmin grafiği">
            <defs>
              <linearGradient id="vyTrajArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#2F6BFF" stop-opacity="0.32"/>
                <stop offset="100%" stop-color="#2F6BFF" stop-opacity="0"/>
              </linearGradient>
            </defs>
            ${gridHtml}
            <line x1="${todayX.toFixed(1)}" y1="22" x2="${todayX.toFixed(1)}" y2="${H - B}" stroke="var(--border-blue)" stroke-width="1.2" stroke-dasharray="3 3"/>
            <line class="vy-traj-cross" id="vyTrajCross" x1="0" y1="${T}" x2="0" y2="${H - B}" stroke="var(--electric)" stroke-width="1" stroke-dasharray="2 2" style="opacity:0;"/>
            <path class="vy-traj-area" d="${areaPath}" fill="url(#vyTrajArea)"/>
            <path class="vy-traj-line" d="${realPath}" fill="none" stroke="#2F6BFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>
            <path d="${forecastPath}" fill="none" stroke="var(--text-muted)" stroke-width="1.8" stroke-dasharray="4 4" stroke-linecap="round"/>
            ${dotsHtml}
            <rect x="${(todayX - 25).toFixed(1)}" y="2" width="50" height="18" rx="9" fill="var(--bg-muted)" stroke="var(--border)"/>
            <text x="${todayX.toFixed(1)}" y="14" text-anchor="middle" fill="var(--text-1)" font-size="10" font-weight="700">Bugün</text>
            ${xLabelsHtml}
            ${hitSlotsHtml}
          </svg>
          <div class="tip vy-traj-tip" id="vyTrajTip"></div>
        </div>
        <div class="vy-traj-foot">
          <div class="vy-traj-legend">
            <span><i class="vy-l-line"></i>Bakiye Seyri</span>
            <span><i class="vy-l-dash"></i>Tahmin</span>
            <span><i class="vy-l-dot" style="background:#3B82F6"></i>Artış</span>
            <span><i class="vy-l-dot" style="background:#FB7185"></i>Çıkış</span>
            <span><i class="vy-l-dot" style="background:#FBBF24"></i>Öngörü</span>
          </div>
          <div class="vy-traj-proj mono" data-privacy-blur>Ay sonu öngörü: <strong>${tryFmt(projEnd)}</strong></div>
        </div>
      </div>`;

    const wrap = host.querySelector('.vy-traj-svg-wrap');
    const tip = document.getElementById('vyTrajTip');
    const cross = document.getElementById('vyTrajCross');
    if (wrap && tip) {
      wrap.querySelectorAll('.vy-traj-hit').forEach((rect) => {
        rect.addEventListener('mousemove', () => {
          const i = Number(rect.dataset.trajI);
          const pt = allPts[i];
          if (!pt) return;
          const xPct = (coords[i][0] / W) * 100;
          if (cross) {
            cross.setAttribute('x1', coords[i][0].toFixed(1));
            cross.setAttribute('x2', coords[i][0].toFixed(1));
            cross.style.opacity = '0.7';
          }
          const delta = pt.net;
          tip.innerHTML = `<strong>${esc(pt.fullDate)}</strong><br>Bakiye: <span class="mono">${tryFmt(pt.val)}</span><br><span style="color:${delta >= 0 ? 'var(--ink-green)' : 'var(--ink-red)'}">${delta >= 0 ? '+' : '−'}${tryFmt(Math.abs(delta))}</span>`;
          tip.style.display = 'block';
          tip.style.left = `clamp(68px, ${xPct.toFixed(1)}%, calc(100% - 68px))`;
          tip.style.transform = 'translateX(-50%)';
          tip.style.top = '4px';
        });
      });
      wrap.addEventListener('mouseleave', () => {
        tip.style.display = 'none';
        if (cross) cross.style.opacity = '0';
      });
    }
  }

  function updateSidebarChrome(monthNet, dues, duesTotal) {
    const bellDot = document.getElementById('vyBellDot');
    const bellBtn = document.getElementById('vyBellBtn');
    if (bellDot) {
      bellDot.hidden = dues.length === 0;
    }
    if (bellBtn) {
      bellBtn.classList.toggle('has-notif', dues.length > 0);
    }
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

      const insightEl = document.getElementById('dashHeroInsight');
      if (insightEl) {
        if (dues.length > 0) {
          insightEl.textContent = `Önümüzdeki 14 günde ${dues.length} ödeme (${tryFmt(duesTotal)}) bekliyor · ${monthName} net nakit: ${monthNet >= 0 ? '+' : '−'}${tryFmt(Math.abs(monthNet))}`;
        } else {
          insightEl.textContent = `${monthName} ayında ${monthNet >= 0 ? '+' : '−'}${tryFmt(Math.abs(monthNet))} net akış · ${State.accounts.length} aktif hesap`;
        }
      }

      kpiHost.innerHTML = `
        <div class="vy-balance-hero">
          <div class="vy-balance-hero__val mono" data-privacy-blur data-count="${Math.abs(netWorth)}" data-prefix="${netWorth < 0 ? '−' : ''}">${netWorth < 0 ? '−' : ''}${tryFmt(Math.abs(netWorth))}</div>
          <div class="vy-balance-hero__meta">
            <span class="dash-pill ${monthNet >= 0 ? 'dash-pill--emerald' : 'dash-pill--rose'} mono">
              ${monthNet >= 0 ? '▲' : '▼'} ${monthNet >= 0 ? '+' : '−'}${tryFmt(Math.abs(monthNet))}
            </span>
            <span class="vy-balance-hero__sub">${monthName} ayı net nakit farkı</span>
          </div>
        </div>
        <div class="vy-mini-stats">
          <div class="vy-mini-stat">
            <span class="vy-mini-stat__lbl">Likit Nakit</span>
            <strong class="vy-mini-stat__val mono" data-privacy-blur data-count="${totalLiquidity}">${tryFmt(totalLiquidity)}</strong>
            <span class="vy-mini-stat__sub">${liquidAccs.length} hesap</span>
          </div>
          <div class="vy-mini-stat">
            <span class="vy-mini-stat__lbl">Alacaklar</span>
            <strong class="vy-mini-stat__val mono" data-privacy-blur data-count="${totalRec}">${tryFmt(totalRec)}</strong>
            <span class="vy-mini-stat__sub">${activeRecs.length} açık kayıt</span>
          </div>
          <div class="vy-mini-stat">
            <span class="vy-mini-stat__lbl">Kart Borcu</span>
            <strong class="vy-mini-stat__val mono" data-privacy-blur data-count="${totalCardDebt}">${tryFmt(totalCardDebt)}</strong>
            <span class="vy-mini-stat__sub">${creditAccs.length} kredi kartı</span>
          </div>
          <div class="vy-mini-stat">
            <span class="vy-mini-stat__lbl">${overdueCount ? overdueCount + ' Gecikmiş Vade' : '14 Gün Vade'}</span>
            <strong class="vy-mini-stat__val mono" style="${overdueCount ? 'color:var(--ink-red)' : ''}" data-privacy-blur data-count="${duesTotal}">${tryFmt(duesTotal)}</strong>
            <span class="vy-mini-stat__sub">${dues.length} yaklaşan ödeme</span>
          </div>
        </div>`;

      renderHeroBalanceTrajectory(flow6, netWorth, monthNet, dues);
      updateSidebarChrome(monthNet, dues, duesTotal);
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
          <div class="dash-kpi" style="padding: 14px; background: var(--bg-subtle); border: 1px solid var(--border); border-radius: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">GEÇEN AYA KIYASLA</span>
              <span class="dash-pill ${momPillCls} mono" style="font-size: 10px;">MoM Trend</span>
            </div>
            <div style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">${momText}</div>
            <span style="font-size: 11px; color: var(--text-secondary);">Geçen ay toplam: <strong class="mono" data-privacy-blur>${tryFmt(lastMonthExp)}</strong></span>
          </div>

          <!-- Kart 2: Tasarruf Oranı -->
          <div class="dash-kpi" style="padding: 14px; background: var(--bg-subtle); border: 1px solid var(--border); border-radius: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">AYLIK TASARRUF ORANI</span>
              <span class="dash-pill ${savingsRate >= 20 ? 'dash-pill--emerald' : 'dash-pill--amber'} mono" style="font-size: 10px;">%${savingsRate}</span>
            </div>
            <div style="font-size: 15px; font-weight: 700; color: var(--ink-green); margin-bottom: 4px;">%${savingsRate} Tasarruf</div>
            <span style="font-size: 11px; color: var(--text-secondary);">Gelirin birikime dönen payı</span>
          </div>

          <!-- Kart 3: Lider Kategori -->
          <div class="dash-kpi" style="padding: 14px; background: var(--bg-subtle); border: 1px solid var(--border); border-radius: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">EN ÇOK HARCANAN ALAN</span>
              <span class="dash-pill dash-pill--rose mono" style="font-size: 10px;">%${topCatShare} pay</span>
            </div>
            <div style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">${esc(topCat)}</div>
            <span style="font-size: 11px; color: var(--text-secondary);">Bu ay harcanan: <strong class="mono" data-privacy-blur>${tryFmt(topCatAmt)}</strong></span>
          </div>

          <!-- Kart 4: En Yoğun Gün -->
          <div class="dash-kpi" style="padding: 14px; background: var(--bg-subtle); border: 1px solid var(--border); border-radius: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; font-weight: 600; color: var(--text-secondary);">EN YOĞUN HARCAMA GÜNÜ</span>
              <span class="dash-pill dash-pill--indigo mono" style="font-size: 10px;">Davranışsal</span>
            </div>
            <div style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">${peakDayName} Günleri</div>
            <span style="font-size: 11px; color: var(--text-secondary);">Haftalık pik harcama noktası</span>
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
    document.getElementById('dashAllCardsLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.Vaulty.Sidebar?.activateNavItem?.('assets');
    });

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

    const sparkHost = document.getElementById('heroBalanceSpark');
    if (sparkHost && window.ResizeObserver) {
      let rafTraj = 0;
      const ro = new ResizeObserver(() => {
        const w = Math.round(sparkHost.clientWidth || 0);
        if (w < 120 || Math.abs(w - _lastTrajW) <= 12) return;
        cancelAnimationFrame(rafTraj);
        rafTraj = requestAnimationFrame(() => {
          if (_lastTrajArgs) renderHeroBalanceTrajectory(..._lastTrajArgs);
        });
      });
      ro.observe(sparkHost);
    }
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

