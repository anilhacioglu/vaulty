/* =========================================================================
   VAULTY CHARTS COMPONENT (Nakit Akışı & Harcama Dağılımı Grafikleri)
   ========================================================================= */
(() => {
  const { State } = window.Vaulty;
  const { esc, tryFmt, shortTry, round2, DASH_DONUT_COLORS } = State;

  let activeCashMonths = 6;

  function getCashflowMonths(months = 6) {
    const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const res = [];
    const count = Math.max(3, Math.min(12, Number(months) || 6));
    try {
      const now = new Date();
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const prefix = `${y}-${String(m + 1).padStart(2, '0')}`;
        const mLabel = monthNames[m];
        const monthInc = (Array.isArray(State.tx) ? State.tx : [])
          .filter((t) => t && t.type === 'Gelir' && String(t.date || '').startsWith(prefix))
          .reduce((s, t) => s + Number((t && (t.amount ?? t.tutar)) || 0), 0);
        const monthExp = (Array.isArray(State.tx) ? State.tx : [])
          .filter((t) => t && (t.type === 'Gider' || t.type === 'Kart Borcu Ödeme') && String(t.date || '').startsWith(prefix))
          .reduce((s, t) => s + Number((t && (t.amount ?? t.tutar)) || 0), 0);
        res.push({
          m: mLabel,
          year: y,
          inc: round2(monthInc),
          exp: round2(monthExp),
        });
      }
    } catch (err) {
      console.error('getCashflowMonths error:', err);
      for (let i = count - 1; i >= 0; i--) {
        res.push({ m: monthNames[(new Date().getMonth() - i + 12) % 12], year: new Date().getFullYear(), inc: 0, exp: 0 });
      }
    }
    return res;
  }

  function getCashflowLast6Months() {
    return getCashflowMonths(6);
  }

  function niceMax(v) {
    if (!v || v <= 0 || isNaN(v)) return 1000;
    const p = 10 ** Math.max(0, Math.floor(Math.log10(v)));
    return (Math.ceil((v / p) * 2) / 2) * p;
  }

  function roundedTopBar(x, y, w, h, r) {
    if (h <= 0 || isNaN(h)) return '';
    const rad = Math.min(r, w / 2, h);
    return `M${x},${y + h} L${x},${y + rad} Q${x},${y} ${x + rad},${y} L${x + w - rad},${y} Q${x + w},${y} ${x + w},${y + rad} L${x + w},${y + h} Z`;
  }

  function tipFor(host) {
    let t = host.querySelector('.tip');
    if (!t) {
      t = document.createElement('div');
      t.className = 'tip';
      host.appendChild(t);
    }
    return t;
  }

  function drawCash(monthsOverride) {
    try {
      if (monthsOverride) activeCashMonths = Number(monthsOverride) || 6;
      const host = document.getElementById('chartCash');
      if (!host) return;
      if (host.clientWidth === 0 || host.offsetParent === null) {
        return;
      }
      host.querySelector('svg')?.remove();
      host.querySelector('.dash-empty-chart')?.remove();

      const flow6 = getCashflowMonths(activeCashMonths);
      const totInc = round2(flow6.reduce((s, d) => s + (d.inc || 0), 0));
      const totExp = round2(flow6.reduce((s, d) => s + (d.exp || 0), 0));
      const totNet = round2(totInc - totExp);

      const subEl = document.getElementById('cashFlowPeriodSub');
      if (subEl) {
        subEl.textContent = activeCashMonths === 3 ? 'Son 3 ay (Çeyrek) nakit akışı' : activeCashMonths === 12 ? 'Son 12 ay (Yıllık) nakit akışı' : 'Son 6 ay nakit akışı';
      }
      const sumHost = document.getElementById('cashFlowSummary');
      if (sumHost) {
        sumHost.innerHTML = `
          <span class="vy-cash-pill"><i style="background:#2F6BFF"></i>Gelir <strong class="mono" data-privacy-blur>${tryFmt(totInc)}</strong></span>
          <span class="vy-cash-pill"><i style="background:var(--bg-switch)"></i>Gider <strong class="mono" data-privacy-blur>${tryFmt(totExp)}</strong></span>
          <span class="vy-cash-pill">Net <strong class="mono ${totNet >= 0 ? 'is-pos' : 'is-neg'}" data-privacy-blur style="color:${totNet >= 0 ? 'var(--ink-green)' : 'var(--ink-red)'}">${totNet >= 0 ? '+' : '−'}${tryFmt(Math.abs(totNet))}</strong></span>`;
      }

      const maxVal = Math.max(...flow6.map((d) => Math.max(d.inc || 0, d.exp || 0)), 0);

      if (maxVal === 0) {
        host.innerHTML = `
          <div class="dash-empty-chart" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:160px;text-align:center;padding:24px;gap:8px;">
            <span style="font-size:13px;font-weight:600;color:var(--text-primary);">Nakit Akışı Hareketi Yok</span>
            <span style="font-size:12px;color:var(--text-secondary);max-width:280px;">Gelir ve gider işlemlerinizi kaydettikçe aylık akış grafiği otomatik olarak burada oluşturulacaktır.</span>
          </div>`;
        return;
      }

      const W = Math.max(260, host.clientWidth);
      const H = 186;
      const L = 56, B = 24, T = 10, R = 10;
      const max = niceMax(Math.max(maxVal, 1000));
      const slot = (W - L - R) / Math.max(1, flow6.length);
      const xCenter = (i) => L + (i + 0.5) * slot;
      const yPos = (v) => T + (1 - v / max) * (H - T - B);
      const bw = Math.min(44, Math.max(12, Math.round(slot * 0.22)));
      const bgap = Math.min(8, Math.max(3, Math.round(bw * 0.18)));
      const colW = Math.min(slot - 8, bw * 2 + bgap + 22);
      const baseline = yPos(0);

      let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Aylık gelir ve gider grafiği">
        <defs>
          <linearGradient id="vyBarBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#60A5FA"/>
            <stop offset="100%" stop-color="#2563EB"/>
          </linearGradient>
        </defs>`;
      for (let g = 0; g <= 3; g++) {
        const val = (max / 3) * g;
        const py = yPos(val);
        svg += `<line x1="${L}" x2="${W - R}" y1="${py}" y2="${py}" stroke="${g === 0 ? 'var(--border)' : 'var(--border-subtle)'}" stroke-width="1"/>`;
        svg += `<text x="${L - 8}" y="${py + 4}" text-anchor="end">${shortTry(val)}</text>`;
      }
      flow6.forEach((d, i) => {
        const cx = xCenter(i);
        const incY = yPos(d.inc || 0);
        const expY = yPos(d.exp || 0);
        const incX = cx - bw - bgap / 2;
        const expX = cx + bgap / 2;
        svg += `<g class="vy-bar-group" data-col-i="${i}">`;
        svg += `<rect class="vy-bar-col-hl" x="${(cx - colW / 2).toFixed(1)}" y="${T - 2}" width="${colW.toFixed(1)}" height="${H - T - B + 4}" rx="10" fill="var(--electric-soft)"/>`;
        svg += `<path class="dash-bar" style="--i:${i}" d="${roundedTopBar(incX, incY, bw, baseline - incY, 6)}" fill="url(#vyBarBlue)"/>`;
        svg += `<path class="dash-bar dash-bar--exp" style="--i:${i}" d="${roundedTopBar(expX, expY, bw, baseline - expY, 6)}" fill="var(--vy-bar-exp, #94A3B8)"/>`;
        svg += `<text x="${cx}" y="${H - 6}" text-anchor="middle">${d.m}</text>`;
        svg += `<rect class="hit" data-i="${i}" x="${cx - slot / 2}" y="${T}" width="${slot}" height="${H - T - B}" fill="transparent"/>`;
        svg += `</g>`;
      });
      svg += '</svg>';
      host.insertAdjacentHTML('afterbegin', svg);
      host._lastW = W;

      const tip = tipFor(host);
      host.querySelectorAll('.hit').forEach((rect) => {
        rect.addEventListener('mousemove', (e) => {
          const idx = rect.dataset.i;
          const d = flow6[idx];
          if (!d) return;
          host.querySelectorAll('.vy-bar-group').forEach((g) => g.classList.toggle('is-hov', g.dataset.colI === String(idx)));
          const box = host.getBoundingClientRect();
          tip.innerHTML = `<strong>${d.m} ${d.year}</strong><br><span class="pos">Gelir: ${tryFmt(d.inc)}</span><br><span style="color:var(--text-secondary)">Gider: ${tryFmt(d.exp)}</span><br><strong>Net: ${d.inc - d.exp >= 0 ? '+' : ''}${tryFmt(d.inc - d.exp)}</strong>`;
          tip.style.display = 'block';

          const tipW = tip.offsetWidth || 150;
          const tipH = tip.offsetHeight || 85;
          let x = e.clientX - box.left + 12;
          if (x + tipW > box.width - 6) x = e.clientX - box.left - tipW - 12;
          x = Math.max(6, Math.min(x, box.width - tipW - 6));

          let y = e.clientY - box.top - tipH - 10;
          if (y < 6) y = e.clientY - box.top + 16;
          if (y + tipH > box.height - 6) y = Math.max(6, box.height - tipH - 6);

          tip.style.left = `${Math.round(x)}px`;
          tip.style.top = `${Math.round(y)}px`;
        });
        rect.addEventListener('mouseleave', () => {
          tip.style.display = 'none';
          host.querySelectorAll('.vy-bar-group.is-hov').forEach((g) => g.classList.remove('is-hov'));
        });
      });
    } catch (err) {
      console.error('drawCash rendering error:', err);
    }
  }

  function drawSpend() {
    try {
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const monthName = new Intl.DateTimeFormat('tr-TR', { month: 'long' }).format(now);
      const byCat = {};

      const currentMonthExpenses = State.tx.filter(
        (t) => t && (t.type === 'Gider' || t.type === 'Kart Borcu Ödeme') && String(t.date || '').startsWith(monthKey)
      );

      const targetList = currentMonthExpenses.length > 0
        ? currentMonthExpenses
        : State.tx.filter((t) => t && (t.type === 'Gider' || t.type === 'Kart Borcu Ödeme'));

      const currentMonthIncome = State.tx
        .filter((t) => t && t.type === 'Gelir' && String(t.date || '').startsWith(monthKey))
        .reduce((s, t) => s + Number((t.amount ?? t.tutar) || 0), 0);

      const isCurrentMonth = currentMonthExpenses.length > 0;

      targetList.forEach((t) => {
        const catKey = t.cat || t.kategori || 'Diğer';
        byCat[catKey] = (byCat[catKey] || 0) + Number((t.amount ?? t.tutar) || 0);
      });

      const sortedCats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
      const topCats = sortedCats.slice(0, 4);
      const restSum = sortedCats.slice(4).reduce((s, c) => s + c[1], 0);
      if (restSum > 0) topCats.push(['Diğer', restSum]);
      const spendTotal = round2(topCats.reduce((s, c) => s + c[1], 0));

      const spendHost = document.getElementById('dashSpend');
      if (!spendHost) return;

      if (spendTotal === 0 || topCats.length === 0) {
        spendHost.innerHTML = `
          <div class="dash-donut-empty" style="display:flex;align-items:center;gap:18px;height:100%;min-height:180px;padding:12px;">
            <div class="dash-donut" style="flex-shrink:0;">
              <svg viewBox="0 0 42 42" role="img" aria-label="Harcama dağılımı boş grafiği">
                <circle cx="21" cy="21" r="15.915" fill="none" stroke="var(--bg-track)" stroke-width="3.4"/>
              </svg>
              <div class="dash-donut__center"><span>Toplam</span><strong class="mono" style="font-size:12px;" data-privacy-blur>0 ₺</strong></div>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;">
              <span style="font-size:13px;font-weight:600;color:var(--text-primary);">Harcama Kaydı Yok</span>
              <span style="font-size:12px;color:var(--text-secondary);">Henüz bu döneme ait kaydedilmiş bir harcama veya gider bulunmuyor.</span>
            </div>
          </div>`;
      } else {
        let acc0 = 0;
        const segs = topCats
          .map(([, val], i) => {
            const pct = (val / spendTotal) * 100;
            const seg = `<circle class="dash-donut__seg" data-seg-i="${i}" cx="21" cy="21" r="15.915" fill="none" stroke="${DASH_DONUT_COLORS[i % 5]}" stroke-width="3.6" stroke-dasharray="${Math.max(0, pct - 1.2).toFixed(2)} ${(100 - Math.max(0, pct - 1.2)).toFixed(2)}" stroke-dashoffset="${(-acc0).toFixed(2)}" style="--i:${i}"/>`;
            acc0 += pct;
            return seg;
          })
          .join('');

        const totalFormatted = tryFmt(spendTotal);
        let totalFont = '12.5px';
        let totalSpacing = 'normal';
        if (totalFormatted.length > 14) {
          totalFont = '10px';
          totalSpacing = '-0.4px';
        } else if (totalFormatted.length > 11) {
          totalFont = '11px';
          totalSpacing = '-0.3px';
        }

        const topCatName = sortedCats[0]?.[0] || '—';
        const topCatPct = sortedCats[0] ? Math.round((sortedCats[0][1] / spendTotal) * 100) : 0;
        const daysSpan = isCurrentMonth ? Math.max(1, now.getDate()) : 30;
        const dailyAvg = round2(spendTotal / daysSpan);
        const avgPerTx = targetList.length > 0 ? round2(spendTotal / targetList.length) : 0;
        const ratioPct = currentMonthIncome > 0 ? Math.min(100, Math.round((spendTotal / currentMonthIncome) * 100)) : 0;
        const ratioLabel = currentMonthIncome > 0
          ? `<span>Aylık Gelir Kullanımı: <strong>%${ratioPct}</strong></span><span>Toplam Gelir: <strong class="mono" data-privacy-blur>${tryFmt(currentMonthIncome)}</strong></span>`
          : `<span><strong>${sortedCats.length}</strong> kategoride dağılım</span><span><strong>${targetList.length}</strong> harcama işlemi</span>`;

        spendHost.innerHTML = `
          <div class="vy-spend-main">
            <div class="dash-donut vy-donut-enter">
              <svg viewBox="0 0 42 42" role="img" aria-label="Harcama dağılımı halka grafiği">
                <circle cx="21" cy="21" r="15.915" fill="none" stroke="var(--bg-track)" stroke-width="3.6"/>
                <g transform="rotate(-90 21 21)">${segs}</g>
              </svg>
              <div class="dash-donut__center">
                <span>${isCurrentMonth ? monthName : 'Toplam'}</span>
                <strong class="mono" data-privacy-blur style="font-size:${totalFont}; letter-spacing:${totalSpacing};">${totalFormatted}</strong>
              </div>
            </div>
            <ul class="dash-legend vy-legend-inline">
              ${topCats
                .map(([name, val], i) => {
                  const pct = Math.round((val / spendTotal) * 100);
                  const col = DASH_DONUT_COLORS[i % 5];
                  return `<li data-seg-i="${i}"><i style="background:${col}"></i><div class="vy-leg-mid"><span class="dash-legend__name">${esc(name)}</span><span class="vy-leg-bar"><b style="width:${pct}%;background:${col}"></b></span></div><span class="dash-legend__pct mono">%${pct}</span><span class="dash-legend__val mono" data-privacy-blur>${tryFmt(val)}</span></li>`;
                })
                .join('')}
            </ul>
          </div>
          <div class="vy-spend-footer">
            <div class="vy-spend-kpis">
              <div class="vy-spend-kpi">
                <span>En Yüksek Kalem</span>
                <strong>${esc(topCatName)} <em class="mono">%${topCatPct}</em></strong>
              </div>
              <div class="vy-spend-kpi">
                <span>Günlük Ortalama</span>
                <strong class="mono" data-privacy-blur>${tryFmt(dailyAvg)}</strong>
              </div>
              <div class="vy-spend-kpi">
                <span>${targetList.length} İşlem · Ort.</span>
                <strong class="mono" data-privacy-blur>${tryFmt(avgPerTx)}</strong>
              </div>
            </div>
            <div class="vy-spend-ratio">
              <div class="vy-spend-ratio__head">${ratioLabel}</div>
              <div class="vy-spend-ratio__track"><i style="width:${currentMonthIncome > 0 ? ratioPct : topCatPct}%;background:${ratioPct >= 85 ? 'var(--ink-red)' : 'var(--primary)'};"></i></div>
            </div>
          </div>`;

        const segEls = spendHost.querySelectorAll('.dash-donut__seg');
        const liEls = spendHost.querySelectorAll('.dash-legend li');
        const highlightSeg = (activeI) => {
          segEls.forEach((s, si) => { s.style.opacity = activeI === null || si === activeI ? '1' : '0.32'; s.style.strokeWidth = si === activeI ? '4.6' : '3.6'; });
          liEls.forEach((el, li) => el.classList.toggle('is-active-seg', li === activeI));
        };
        liEls.forEach((li) => {
          const i = Number(li.dataset.segI);
          li.addEventListener('mouseenter', () => highlightSeg(i));
          li.addEventListener('mouseleave', () => highlightSeg(null));
        });
        segEls.forEach((seg) => {
          const i = Number(seg.dataset.segI);
          seg.addEventListener('mouseenter', () => highlightSeg(i));
          seg.addEventListener('mouseleave', () => highlightSeg(null));
        });
      }
    } catch (err) {
      console.error('Harcama dağılımı grafiği hatası:', err);
    }
  }

  function initCharts() {
    const chartCashHost = document.getElementById('chartCash');
    if (chartCashHost) {
      try {
        new ResizeObserver(() => {
          try {
            const w = chartCashHost.clientWidth;
            if (w > 0 && chartCashHost._lastW && Math.abs(w - chartCashHost._lastW) < 8) return;
            drawCash();
          } catch (err) {
            console.error('drawCash observer error:', err);
          }
        }).observe(chartCashHost);
      } catch (err) {
        console.error('ResizeObserver error:', err);
      }
    }

    document.querySelectorAll('#cashPeriodSeg [data-cash-months]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const m = Number(btn.dataset.cashMonths) || 6;
        document.querySelectorAll('#cashPeriodSeg [data-cash-months]').forEach((b) => b.classList.toggle('is-active', b === btn));
        drawCash(m);
      });
    });

    document.getElementById('dashSpendInsightsLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      window.Vaulty.Sidebar?.activateNavItem?.('transactions');
      setTimeout(() => {
        document.querySelector('#txSubTabs [data-tx-tab="insights"]')?.click();
      }, 40);
    });

    State.on('transactions:changed', () => {
      drawCash();
      drawSpend();
    });
  }

  const Charts = {
    init: initCharts,
    drawCash,
    drawSpend,
    getCashflowLast6Months,
    getCashflowMonths,
  };

  window.drawCash = drawCash;
  window.Vaulty = window.Vaulty || {};
  window.Vaulty.Charts = Charts;
})();

