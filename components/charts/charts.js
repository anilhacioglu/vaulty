/* =========================================================================
   VAULTY CHARTS COMPONENT (Nakit Akışı & Harcama Dağılımı Grafikleri)
   ========================================================================= */
(() => {
  const { State } = window.Vaulty;
  const { esc, tryFmt, shortTry, round2, DASH_DONUT_COLORS } = State;

  function getCashflowLast6Months() {
    const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const res = [];
    try {
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
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
      console.error('getCashflowLast6Months error:', err);
      for (let i = 5; i >= 0; i--) {
        res.push({ m: monthNames[(new Date().getMonth() - i + 12) % 12], year: new Date().getFullYear(), inc: 0, exp: 0 });
      }
    }
    return res;
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

  function drawCash() {
    try {
      const host = document.getElementById('chartCash');
      if (!host) return;
      if (host.clientWidth === 0 || host.offsetParent === null) {
        return;
      }
      host.querySelector('svg')?.remove();
      host.querySelector('.dash-empty-chart')?.remove();

      const flow6 = getCashflowLast6Months();
      const maxVal = Math.max(...flow6.map((d) => Math.max(d.inc || 0, d.exp || 0)), 0);

      if (maxVal === 0) {
        host.innerHTML = `
          <div class="dash-empty-chart" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:160px;text-align:center;padding:24px;gap:8px;">
            <span style="font-size:13px;font-weight:600;color:#0F172A;">Nakit Akışı Hareketi Yok</span>
            <span style="font-size:12px;color:#64748B;max-width:280px;">Gelir ve gider işlemlerinizi kaydettikçe 6 aylık akış grafiği otomatik olarak burada oluşturulacaktır.</span>
          </div>`;
        return;
      }

      const W = Math.max(260, host.clientWidth);
      const H = 188;
      const L = 40, B = 24, T = 8, R = 6;
      const max = niceMax(Math.max(maxVal, 1000));
      const slot = (W - L - R) / Math.max(1, flow6.length);
      const xCenter = (i) => L + (i + 0.5) * slot;
      const yPos = (v) => T + (1 - v / max) * (H - T - B);
      const bw = Math.min(16, Math.max(8, slot * 0.22));
      const baseline = yPos(0);

      let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Aylık gelir ve gider grafiği">`;
      for (let g = 0; g <= 3; g++) {
        const val = (max / 3) * g;
        const py = yPos(val);
        svg += `<line x1="${L}" x2="${W - R}" y1="${py}" y2="${py}" stroke="${g === 0 ? '#E2E8F0' : '#F1F5F9'}" stroke-width="1"/>`;
        svg += `<text x="${L - 8}" y="${py + 4}" text-anchor="end">${shortTry(val)}</text>`;
      }
      flow6.forEach((d, i) => {
        const cx = xCenter(i);
        const incY = yPos(d.inc || 0);
        const expY = yPos(d.exp || 0);
        svg += `<path class="dash-bar" style="--i:${i}" d="${roundedTopBar(cx - bw - 2, incY, bw, baseline - incY, 5)}" fill="#10B981"/>`;
        svg += `<path class="dash-bar" style="--i:${i}" d="${roundedTopBar(cx + 2, expY, bw, baseline - expY, 5)}" fill="#CBD5E1"/>`;
        svg += `<text x="${cx}" y="${H - 6}" text-anchor="middle">${d.m}</text>`;
        svg += `<rect class="hit" data-i="${i}" x="${cx - slot / 2}" y="${T}" width="${slot}" height="${H - T - B}" fill="transparent"/>`;
      });
      svg += '</svg>';
      host.insertAdjacentHTML('afterbegin', svg);

      const tip = tipFor(host);
      host.querySelectorAll('.hit').forEach((rect) => {
        rect.addEventListener('mousemove', (e) => {
          const d = flow6[rect.dataset.i];
          if (!d) return;
          const box = host.getBoundingClientRect();
          tip.innerHTML = `<strong>${d.m} ${d.year}</strong><br><span class="pos">Gelir: ${tryFmt(d.inc)}</span><br><span style="color:#64748B">Gider: ${tryFmt(d.exp)}</span><br><strong>Net: ${d.inc - d.exp >= 0 ? '+' : ''}${tryFmt(d.inc - d.exp)}</strong>`;
          tip.style.display = 'block';

          const tipW = tip.offsetWidth || 150;
          const tipH = tip.offsetHeight || 85;

          // X pozisyonu: İmlecin sağına koy, sağ sınır taşarsa sola çevir, kutu içinde sınırla
          let x = e.clientX - box.left + 12;
          if (x + tipW > box.width - 6) {
            x = e.clientX - box.left - tipW - 12;
          }
          x = Math.max(6, Math.min(x, box.width - tipW - 6));

          // Y pozisyonu: Varsayılan olarak fare imlecinin ÜSTÜNE yerleştir (alt sınır asla kesilmez)
          let y = e.clientY - box.top - tipH - 10;
          if (y < 6) {
            // Eğer yukarıda yeterli alan yoksa imlecin altına yerleştir
            y = e.clientY - box.top + 16;
          }
          // Alt sınırdan panel dışına taşmayı kesin olarak engelle
          if (y + tipH > box.height - 6) {
            y = Math.max(6, box.height - tipH - 6);
          }

          tip.style.left = `${Math.round(x)}px`;
          tip.style.top = `${Math.round(y)}px`;
        });
        rect.addEventListener('mouseleave', () => {
          tip.style.display = 'none';
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
          <div class="dash-donut-empty" style="display:flex;align-items:center;gap:18px;height:100%;min-height:140px;padding:12px;">
            <div class="dash-donut" style="flex-shrink:0;">
              <svg viewBox="0 0 42 42" role="img" aria-label="Harcama dağılımı boş grafiği">
                <circle cx="21" cy="21" r="15.915" fill="none" stroke="#F1F5F9" stroke-width="3.2"/>
              </svg>
              <div class="dash-donut__center"><span>Toplam</span><strong class="mono" style="font-size:12px;" data-privacy-blur>0 ₺</strong></div>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;">
              <span style="font-size:13px;font-weight:600;color:#0F172A;">Harcama Kaydı Yok</span>
              <span style="font-size:12px;color:#64748B;">Henüz bu döneme ait kaydedilmiş bir harcama veya gider bulunmuyor.</span>
            </div>
          </div>`;
      } else {
        let acc0 = 0;
        const segs = topCats
          .map(([name, val], i) => {
            const pct = (val / spendTotal) * 100;
            const seg = `<circle class="dash-donut__seg" cx="21" cy="21" r="15.915" fill="none" stroke="${DASH_DONUT_COLORS[i % 5]}" stroke-width="3.2" stroke-dasharray="${Math.max(0, pct - 1.2).toFixed(2)} ${(100 - Math.max(0, pct - 1.2)).toFixed(2)}" stroke-dashoffset="${(-acc0).toFixed(2)}" style="--i:${i}"/>`;
            acc0 += pct;
            return seg;
          })
          .join('');

        const totalFormatted = tryFmt(spendTotal);
        let totalFont = '12px';
        let totalSpacing = 'normal';
        if (totalFormatted.length > 14) {
          totalFont = '9.5px';
          totalSpacing = '-0.4px';
        } else if (totalFormatted.length > 11) {
          totalFont = '10.5px';
          totalSpacing = '-0.3px';
        } else if (totalFormatted.length > 9) {
          totalFont = '11px';
          totalSpacing = '-0.2px';
        }

        spendHost.innerHTML = `
          <div class="dash-donut">
            <svg viewBox="0 0 42 42" role="img" aria-label="Harcama dağılımı halka grafiği">
              <circle cx="21" cy="21" r="15.915" fill="none" stroke="#F1F5F9" stroke-width="3.2"/>
              <g transform="rotate(-90 21 21)">${segs}</g>
            </svg>
            <div class="dash-donut__center">
              <span>${isCurrentMonth ? monthName : 'Toplam'}</span>
              <strong class="mono" data-privacy-blur style="font-size:${totalFont}; letter-spacing:${totalSpacing};">${totalFormatted}</strong>
            </div>
          </div>
          <ul class="dash-legend">
            ${topCats
              .map(
                ([name, val], i) => `<li><i style="background:${DASH_DONUT_COLORS[i % 5]}"></i><span class="dash-legend__name">${esc(name)}</span><span class="dash-legend__pct mono">%${Math.round((val / spendTotal) * 100)}</span><span class="dash-legend__val mono">${tryFmt(val)}</span></li>`
              )
              .join('')}
          </ul>`;
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
            drawCash();
          } catch (err) {
            console.error('drawCash observer error:', err);
          }
        }).observe(chartCashHost);
      } catch (err) {
        console.error('ResizeObserver error:', err);
      }
    }

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
  };

  window.drawCash = drawCash;
  window.Vaulty = window.Vaulty || {};
  window.Vaulty.Charts = Charts;
})();

