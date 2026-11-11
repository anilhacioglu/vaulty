/* =========================================================================
   VAULTY CARDS COMPONENT (Banka, Nakit ve Kredi Kartı Kartları & Limit Barları)
   ========================================================================= */
(() => {
  const { State } = window.Vaulty;
  const { esc, tryFmt, round2, ACCENT_PALETTE } = State;

  let activeWalletTab = 'all';
  let dashCardIdx = 0;
  let dashCardFlipped = false;
  let assetsCardFlipped = false;

  const CHIP_SVG = `<svg viewBox="0 0 36 26" width="34" height="24" aria-hidden="true"><rect x="0.5" y="0.5" width="35" height="25" rx="5" fill="#FBBF24" fill-opacity="0.26" stroke="#FCD34D" stroke-opacity="0.68"/><path d="M12 1v24M24 1v24M1 9h11M24 9h11M1 17h11M24 17h11" stroke="#FCD34D" stroke-opacity="0.52" stroke-width="1"/></svg>`;
  const DEBIT_CHIP_SVG = `<svg viewBox="0 0 36 26" width="34" height="24" aria-hidden="true"><rect x="0.5" y="0.5" width="35" height="25" rx="5" fill="#E2E8F0" fill-opacity="0.22" stroke="#F8FAFC" stroke-opacity="0.62"/><path d="M12 1v24M24 1v24M1 9h11M24 9h11M1 17h11M24 17h11" stroke="#F8FAFC" stroke-opacity="0.45" stroke-width="1"/></svg>`;
  const WALLET_ICON_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(209,250,229,0.9)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>`;
  const BANKNOTE_BADGE_SVG = `<svg viewBox="0 0 36 26" width="34" height="24" aria-hidden="true"><rect x="0.75" y="0.75" width="34.5" height="24.5" rx="6" fill="#A7F3D0" fill-opacity="0.16" stroke="#6EE7B7" stroke-opacity="0.55" stroke-width="1.2"/><circle cx="18" cy="13" r="4.5" fill="none" stroke="#6EE7B7" stroke-opacity="0.85" stroke-width="1.4"/><path d="M5 6h3M28 6h3M5 20h3M28 20h3" stroke="#6EE7B7" stroke-opacity="0.7" stroke-width="1.4" stroke-linecap="round"/></svg>`;
  const NFC_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="rgba(255,255,255,0.78)" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 15a5 5 0 0 0 0-6"/><path d="M10 17.5a8.5 8.5 0 0 0 0-11"/><path d="M14 20a12 12 0 0 0 0-16"/></svg>`;

  function cardSurfaceGradient(acc) {
    if (!acc) return 'linear-gradient(135deg, #09206E 0%, #1F57E8 55%, #3B82F6 100%)';
    if (acc.type === 'credit') return 'linear-gradient(135deg, #0B0F1F 0%, #1C2344 50%, #2D1F4F 100%)';
    if (acc.type === 'cash') return 'linear-gradient(135deg, #042F24 0%, #065F46 54%, #0D9488 100%)';
    return 'linear-gradient(135deg, #09206E 0%, #1F57E8 55%, #3B82F6 100%)';
  }

  function renderInteractiveCardStack(host, list, activeIdx, opts = {}) {
    if (!host || !list || list.length === 0) return;
    const len = list.length;
    const safeIdx = ((activeIdx % len) + len) % len;
    const holder = esc((State.isTestMode ? 'Test Kullanıcısı' : State.vaultProfile?.username) || 'Kullanıcı');

    const visibleIndices = [];
    for (let offset = Math.min(2, len - 1); offset >= 0; offset--) {
      visibleIndices.push({ idx: (safeIdx + offset) % len, depth: offset });
    }

    const cardsHtml = visibleIndices.map(({ idx, depth }) => {
      const a = list[idx];
      const isFront = depth === 0;
      const isCredit = a.type === 'credit';
      const isCash = a.type === 'cash';
      const variantCls = isCredit ? 'vy-c3d--credit' : (isCash ? 'vy-c3d--cash' : 'vy-c3d--debit');
      const used = Number(a.debt || 0);
      const limit = Number(a.limit || 0);
      const avail = Math.max(0, round2(limit - used));
      const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
      const ident = getAccountDisplayIdentifier(a, State.accounts);
      const last4 = a.last4 || (ident.copyValue ? ident.copyValue.slice(-4) : '0000');
      const valNum = isCredit ? used : Number(a.balance || 0);
      const typeLabel = isCredit ? 'Kredi Kartı' : (isCash ? 'Fiziki Cüzdan' : 'Banka Kartı');
      const flipCls = isFront && opts.flipped ? 'is-flipped' : '';
      const throwCls = isFront && opts.throwDir ? `vy-throw-${opts.throwDir}` : '';

      const topBadgeHtml = isCredit
        ? `<span class="vy-c3d-type-tag vy-c3d-type-tag--credit">KREDİ KARTI</span>`
        : (isCash
          ? `<span class="vy-c3d-type-tag vy-c3d-type-tag--cash">FİZİKİ CÜZDAN</span>`
          : `<span class="vy-c3d-type-tag vy-c3d-type-tag--debit">BANKA KARTI</span>`);

      const midCenterHtml = isCredit
        ? `
          <div class="vy-c3d-mid">
            ${CHIP_SVG}
            <div class="vy-c3d-bal-wrap">
              <span class="vy-c3d-bal-lbl">Güncel Kart Borcu</span>
              <span class="vy-c3d-bal mono" data-privacy-blur>${tryFmt(valNum)}</span>
            </div>
          </div>
          <div class="vy-c3d-credit-bar">
            <div class="vy-c3d-credit-bar__labels">
              <span data-privacy-blur>Kullanılabilir: ${tryFmt(avail)}</span>
              <span class="mono">%${pct}</span>
            </div>
            <div class="vy-c3d-credit-bar__track"><i style="width:${pct}%"></i></div>
          </div>`
        : (isCash
          ? `
            <div class="vy-c3d-mid">
              ${BANKNOTE_BADGE_SVG}
              <div class="vy-c3d-bal-wrap">
                <span class="vy-c3d-bal-lbl">Eldeki Nakit</span>
                <span class="vy-c3d-bal mono" data-privacy-blur>${tryFmt(valNum)}</span>
              </div>
            </div>
            <div class="vy-c3d-cash-code mono">Kasa: ${esc(ident.assetCode || 'KAS-TL-01')}</div>`
          : `
            <div class="vy-c3d-mid">
              ${DEBIT_CHIP_SVG}
              <div class="vy-c3d-bal-wrap">
                <span class="vy-c3d-bal-lbl">Kullanılabilir Bakiye</span>
                <span class="vy-c3d-bal mono" data-privacy-blur>${tryFmt(valNum)}</span>
              </div>
            </div>
            <div class="vy-c3d-num mono">•••• •••• •••• ${esc(last4)}</div>`);

      const rightMarkHtml = isCredit
        ? `<span class="vy-c3d-logo vy-c3d-logo--credit" aria-hidden="true"><i></i><i></i></span>`
        : (isCash
          ? `<span class="vy-c3d-cash-seal mono">₺ TRY</span>`
          : `<span class="vy-c3d-logo vy-c3d-logo--debit" aria-hidden="true"><i></i><i></i></span>`);

      return `
        <div class="vy-c3d-slot vy-c3d-slot--d${depth} ${throwCls}" data-depth="${depth}" data-acc-id="${a.id}">
          <div class="vy-c3d-inner ${flipCls}">
            <!-- ÖN YÜZ -->
            <div class="vy-c3d-face vy-c3d-front ${variantCls}" style="background:${cardSurfaceGradient(a)};">
              <div class="vy-c3d-shine"></div>
              <div class="vy-c3d-top">
                <div class="vy-c3d-brand">
                  <span class="vy-c3d-nick">${esc(a.nickname || 'Hesap')}</span>
                  <span class="vy-c3d-inst">${esc(a.institution || typeLabel)}</span>
                </div>
                <div class="vy-c3d-top-right">
                  ${topBadgeHtml}
                  <span class="vy-c3d-nfc">${isCash ? WALLET_ICON_SVG : NFC_SVG}</span>
                </div>
              </div>
              ${midCenterHtml}
              <div class="vy-c3d-foot">
                <div><span class="vy-c3d-flbl">${isCash ? 'Kasa Sahibi' : (isCredit ? 'Kart Sahibi' : 'Hesap Sahibi')}</span><span class="vy-c3d-fval">${holder}</span></div>
                <div><span class="vy-c3d-flbl">${isCredit ? 'Son Ödeme' : (isCash ? 'Hesap Tipi' : 'Tür')}</span><span class="vy-c3d-fval mono">${isCredit ? ('Her ay ' + (a.dueDay || 15) + '.') : (isCash ? 'Fiziki Nakit' : 'Vadesiz')}</span></div>
                ${rightMarkHtml}
              </div>
            </div>
            <!-- ARKA YÜZ (Çevrilince) -->
            <div class="vy-c3d-face vy-c3d-back" style="background:${cardSurfaceGradient(a)};">
              <div class="vy-c3d-magstrip"></div>
              <div class="vy-c3d-back-body">
                <div class="vy-c3d-back-row">
                  <span class="vy-c3d-flbl">IBAN / Hesap No</span>
                  <strong class="mono vy-c3d-iban">${esc(ident.displayLabel)}</strong>
                </div>
                ${isCredit ? `
                <div class="vy-c3d-back-row">
                  <div style="display:flex;justify-content:space-between;width:100%;font-size:11px;">
                    <span>Kalan Limit: <strong class="mono" data-privacy-blur>${tryFmt(avail)}</strong></span>
                    <span class="mono">%${pct}</span>
                  </div>
                  <div class="vy-c3d-track"><i style="width:${pct}%"></i></div>
                </div>` : `
                <div class="vy-c3d-back-row">
                  <span class="vy-c3d-flbl">Kasa Kodu &amp; Durum</span>
                  <strong class="mono">${esc(ident.assetCode)} · Aktif</strong>
                </div>`}
                <div class="vy-c3d-back-actions">
                  <button type="button" class="vy-c3d-mini-btn" data-card-copy="${esc(ident.copyValue)}">Kodu Kopyala</button>
                  <button type="button" class="vy-c3d-mini-btn vy-c3d-mini-btn--pri" data-card-goto="${a.id}">${opts.backCtaLabel || 'Hesap Detayı →'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>`;
    }).join('');

    const dotsHtml = list.map((a, i) =>
      `<button type="button" class="vy-c3d-dot ${i === safeIdx ? 'is-active' : ''}" data-card-dot="${i}" aria-label="${esc(a.nickname || 'Kart')} (${i + 1})"></button>`
    ).join('');

    const activeAcc = list[safeIdx];
    const activeIdent = activeAcc ? getAccountDisplayIdentifier(activeAcc, State.accounts) : null;
    const isActCredit = activeAcc?.type === 'credit';
    const actLimit = Number(activeAcc?.limit) || 0;
    const actDebt = Number(activeAcc?.debt) || 0;
    const actAvail = isActCredit ? Math.max(0, round2(actLimit - actDebt)) : Number(activeAcc?.balance || 0);
    const totalLiquid = (State.accounts || [])
      .filter((a) => a && (a.type === 'checking' || a.type === 'cash'))
      .reduce((s, a) => s + Math.max(0, Number(a.balance) || 0), 0);
    const meterPct = isActCredit
      ? (actLimit > 0 ? Math.min(100, Math.round((actDebt / actLimit) * 100)) : 0)
      : (totalLiquid > 0 ? Math.min(100, Math.round((Math.max(0, actAvail) / totalLiquid) * 100)) : 0);
    const meterLabel = isActCredit ? 'Limit Kullanımı' : 'Likit Portföy Payı';
    const meterStat = isActCredit
      ? (actLimit > 0 ? `%${meterPct} · Limit ${tryFmt(actLimit)}` : 'Limit tanımlı değil')
      : `%${meterPct} · Toplam ${tryFmt(totalLiquid)}`;
    const meterColor = isActCredit && meterPct >= 80 ? '#FB7185' : (isActCredit && meterPct >= 50 ? '#FBBF24' : 'var(--primary)');

    const lastAccTx = activeAcc
      ? (State.tx || []).filter((t) => t && (t.accountId === activeAcc.id || t.sourceAccountId === activeAcc.id)).sort((a, b) => (a.date < b.date ? 1 : -1))[0]
      : null;
    const lastTxAmt = lastAccTx ? Number((lastAccTx.amount ?? lastAccTx.tutar) || 0) : 0;
    const lastTxPos = lastAccTx && lastAccTx.type === 'Gelir';
    const metaStripHtml = opts.showMetaStrip && activeAcc ? `
      <div class="vy-card-meta-box">
        <div class="vy-card-meta-strip">
          <div class="vy-card-meta-item">
            <span>${isActCredit ? 'Kalan Limit' : 'Hesap / IBAN'}</span>
            <button type="button" class="vy-card-copy-val mono" data-card-copy="${esc(activeIdent?.copyValue || '')}" title="Kopyalamak için tıklayın" data-privacy-blur>
              ${isActCredit ? tryFmt(actAvail) : esc(activeIdent?.displayLabel || '—')}
            </button>
          </div>
          <div class="vy-card-meta-item vy-card-meta-item--right">
            <span>${lastAccTx ? 'Son Hareket' : (isActCredit ? 'Ekstre Kesim' : 'Kasa Kodu')}</span>
            <strong class="mono" data-privacy-blur style="${lastAccTx ? ('color:' + (lastTxPos ? 'var(--ink-green)' : 'var(--ink-red)')) : ''}">
              ${lastAccTx ? ((lastTxPos ? '+' : '−') + tryFmt(lastTxAmt)) : (isActCredit ? ('Her ay ' + (activeAcc.cutoffDay || 15) + '.') : esc(activeIdent?.assetCode || '—'))}
            </strong>
          </div>
        </div>
        <div class="vy-card-meter">
          <div class="vy-card-meter__head">
            <span>${meterLabel}</span>
            <strong class="mono" data-privacy-blur>${meterStat}</strong>
          </div>
          <div class="vy-card-meter__track"><i style="width:${meterPct}%;background:${meterColor};"></i></div>
        </div>
        <div class="vy-card-quick-actions">
          <button type="button" class="vy-c3d-pill vy-c3d-pill--grow" data-card-balance="${activeAcc.id}">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <span>Bakiye Güncelle</span>
          </button>
          <button type="button" class="vy-c3d-pill vy-c3d-pill--grow" data-action="open-transfer-modal">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 16 5 5 5-5M12 21V3M17 8l-5-5-5 5"/></svg>
            <span>Para Aktar</span>
          </button>
          <button type="button" class="vy-c3d-pill vy-c3d-pill--pri" data-card-goto="${activeAcc.id}">Detay →</button>
        </div>
      </div>` : '';

    host.innerHTML = `
      <div class="vy-card-deck">
        <div class="vy-c3d-stage" title="Kartı çevirmek için tıklayın">
          ${cardsHtml}
        </div>
        <div class="vy-c3d-controls">
          <div class="vy-c3d-nav">
            <button type="button" class="vy-c3d-arrow" data-card-nav="-1" ${len <= 1 ? 'disabled' : ''} aria-label="Önceki kart">‹</button>
            <div class="vy-c3d-dots">${dotsHtml}</div>
            <button type="button" class="vy-c3d-arrow" data-card-nav="1" ${len <= 1 ? 'disabled' : ''} aria-label="Sonraki kart">›</button>
          </div>
        </div>
      </div>${metaStripHtml}`;

    const frontSlot = host.querySelector('.vy-c3d-slot--d0');
    frontSlot?.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      opts.onFlip?.();
    });
    frontSlot?.addEventListener('mousemove', (e) => {
      const r = frontSlot.getBoundingClientRect();
      const px = (e.clientX - r.left) / Math.max(1, r.width);
      const py = (e.clientY - r.top) / Math.max(1, r.height);
      frontSlot.style.setProperty('--mx', `${e.clientX - r.left}px`);
      frontSlot.style.setProperty('--my', `${e.clientY - r.top}px`);
      frontSlot.style.setProperty('--rx', `${((0.5 - py) * 7).toFixed(2)}deg`);
      frontSlot.style.setProperty('--ry', `${((px - 0.5) * 9).toFixed(2)}deg`);
    });
    frontSlot?.addEventListener('mouseleave', () => {
      frontSlot.style.setProperty('--rx', '0deg');
      frontSlot.style.setProperty('--ry', '0deg');
    });
    host.querySelector('[data-card-flip]')?.addEventListener('click', () => opts.onFlip?.());
    host.querySelectorAll('[data-card-nav]').forEach((b) => {
      b.addEventListener('click', () => opts.onStep?.(Number(b.dataset.cardNav)));
    });
    host.querySelectorAll('[data-card-dot]').forEach((b) => {
      b.addEventListener('click', () => opts.onJump?.(Number(b.dataset.cardDot)));
    });
    host.querySelectorAll('[data-card-copy]').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = b.dataset.cardCopy;
        if (navigator.clipboard && val) navigator.clipboard.writeText(val).catch(() => {});
        State.showToast?.(`"${val}" panoya kopyalandı.`);
      });
    });
    host.querySelectorAll('[data-card-goto]').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        opts.onInspect?.(b.dataset.cardGoto);
      });
    });
    host.querySelectorAll('[data-card-balance]').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const acc = State.getAccountById ? State.getAccountById(b.dataset.cardBalance) : null;
        if (acc && window.Vaulty.Modals?.AccountModals?.openUpdateBalanceModal) {
          window.Vaulty.Modals.AccountModals.openUpdateBalanceModal(acc);
        }
      });
    });
  }

  const BANK_CODE_MAP = [
    { match: /akbank/i, code: 'AKB' },
    { match: /garanti/i, code: 'GAR' },
    { match: /iş\s*bank|is\s*bank/i, code: 'ISB' },
    { match: /yapı\s*kredi|yapi\s*kredi/i, code: 'YKB' },
    { match: /enpara/i, code: 'ENP' },
    { match: /qnb/i, code: 'QNB' },
    { match: /ziraat/i, code: 'ZRT' },
    { match: /nakit|kasa|cüzdan/i, code: 'KAS' },
  ];

  function getBankCode(institution) {
    if (!institution) return 'BNK';
    for (const entry of BANK_CODE_MAP) {
      if (entry.match.test(institution)) return entry.code;
    }
    const clean = institution.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ]/g, '').slice(0, 3).toUpperCase();
    return clean || 'BNK';
  }

  function getAccountTypeCode(type) {
    if (type === 'credit') return 'KK';
    if (type === 'cash') return 'TL';
    return 'BK'; // Banka Kartı / Vadesiz
  }

  function getAccountAssetCode(acc, allAccounts = State.accounts) {
    if (acc.assetCode && !acc.assetCode.includes('undefined')) return acc.assetCode;
    const bCode = getBankCode(acc.institution || (acc.type === 'cash' ? 'Nakit Cüzdan' : ''));
    const tCode = getAccountTypeCode(acc.type);
    const prefix = `${bCode}-${tCode}`;

    const matching = (allAccounts || []).filter((a) => {
      const aB = getBankCode(a.institution || (a.type === 'cash' ? 'Nakit Cüzdan' : ''));
      const aT = getAccountTypeCode(a.type);
      return `${aB}-${aT}` === prefix;
    });

    let idx = matching.findIndex((a) => a.id === acc.id);
    if (idx === -1) idx = matching.length;
    const seq = String(idx + 1).padStart(2, '0');
    return `${prefix}-${seq}`;
  }

  function isOldFakeNumber(str) {
    if (!str) return true;
    const clean = String(str).replace(/\s+/g, '');
    if (clean.startsWith('TR56000620000000000010')) return true;
    if (str.startsWith('4543 •••• ••••') || str.startsWith('4543••••••••')) return true;
    if (str === 'Fiziksel Nakit Cüzdan' || str === 'NAKİT') return true;
    return false;
  }

  function getAccountDisplayIdentifier(acc, allAccounts = State.accounts) {
    const customNum = (acc.customNumber || (!isOldFakeNumber(acc.iban) ? acc.iban : '')).trim();
    const assetCode = getAccountAssetCode(acc, allAccounts);

    if (customNum) {
      const clean = customNum.replace(/\s+/g, '');
      let masked = customNum;
      if (clean.toUpperCase().startsWith('TR') && clean.length >= 8) {
        masked = `${clean.slice(0, 4)} •••• ${clean.slice(-4)}`;
      } else if (clean.length >= 4) {
        masked = `•••• ${clean.slice(-4)}`;
      }
      return {
        hasCustom: true,
        displayLabel: masked,
        copyValue: customNum,
        isAssetCode: false,
        assetCode,
      };
    }

    return {
      hasCustom: false,
      displayLabel: `Kasa Kodu: ${assetCode}`,
      copyValue: assetCode,
      isAssetCode: true,
      assetCode,
    };
  }

  function getCreditCardDueBadge(acc) {
    const cutoffDay = Number(acc.cutoffDay) || 15;
    const dueDay = Number(acc.dueDay) || (((cutoffDay + 10 - 1) % 30) + 1);
    const debt = Number(acc.debt || 0);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    const makeDate = (y, m, d) => {
      const dt = new Date(y, m, 1);
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      dt.setDate(Math.min(d, daysInMonth));
      dt.setHours(0, 0, 0, 0);
      return dt;
    };

    let cutoffDate = makeDate(curYear, curMonth, cutoffDay);
    let dueDate = dueDay > cutoffDay ? makeDate(curYear, curMonth, dueDay) : makeDate(curYear, curMonth + 1, dueDay);

    if (now < cutoffDate) {
      let prevDue = dueDay > cutoffDay ? makeDate(curYear, curMonth - 1, dueDay) : makeDate(curYear, curMonth, dueDay);

      if (now <= prevDue && debt > 0) {
        const daysToDue = Math.round((prevDue - now) / 864e5);
        if (daysToDue <= 1) {
          return {
            cls: 'wc-due-pill--critical',
            text: daysToDue <= 0 ? '🚨 Son Gün • Bugün' : '🚨 Son 24 Saat',
            days: daysToDue,
            status: 'critical',
          };
        }
        if (daysToDue <= 3) {
          return {
            cls: 'wc-due-pill--warning',
            text: `⚡ Son ${daysToDue} Gün`,
            days: daysToDue,
            status: 'warning',
          };
        }
        return {
          cls: 'wc-due-pill--warning',
          text: `⚡ Ekstre Kesildi • Son ${daysToDue} Gün`,
          days: daysToDue,
          status: 'warning',
        };
      }

      const daysToCut = Math.round((cutoffDate - now) / 864e5);
      if (daysToCut > 5) {
        return {
          cls: 'wc-due-pill--safe',
          text: `🗓️ Kesime ${daysToCut} gün`,
          days: daysToCut,
          status: 'safe',
        };
      }
      return {
        cls: 'wc-due-pill--warning',
        text: `⚡ Kesime ${daysToCut} gün`,
        days: daysToCut,
        status: 'warning',
      };
    }

    if (now <= dueDate) {
      const daysToDue = Math.round((dueDate - now) / 864e5);
      if (daysToDue <= 1) {
        return {
          cls: 'wc-due-pill--critical',
          text: daysToDue <= 0 ? '🚨 Son Gün • Bugün' : '🚨 Son 24 Saat',
          days: daysToDue,
          status: 'critical',
        };
      }
      if (daysToDue <= 3) {
        return {
          cls: 'wc-due-pill--warning',
          text: `⚡ Son ${daysToDue} Gün`,
          days: daysToDue,
          status: 'warning',
        };
      }
      return {
        cls: 'wc-due-pill--warning',
        text: `⚡ Ekstre Kesildi • Son ${daysToDue} Gün`,
        days: daysToDue,
        status: 'warning',
      };
    }

    if (debt > 0) {
      const overdue = Math.round((now - dueDate) / 864e5);
      return {
        cls: 'wc-due-pill--critical',
        text: `🚨 Vadesi Geçti (${overdue} gün)`,
        days: -overdue,
        status: 'critical',
      };
    }

    const nextCutoff = makeDate(curYear, curMonth + 1, cutoffDay);
    const daysToNext = Math.round((nextCutoff - now) / 864e5);
    if (daysToNext > 5) {
      return {
        cls: 'wc-due-pill--safe',
        text: `🗓️ Kesime ${daysToNext} gün`,
        days: daysToNext,
        status: 'safe',
      };
    }
    return {
      cls: 'wc-due-pill--warning',
      text: `⚡ Kesime ${daysToNext} gün`,
      days: daysToNext,
      status: 'warning',
    };
  }

  function renderAssetsKpis() {
    try {
      const host = document.getElementById('assetsKpis');
      if (!host) return;

      const bankAccs = State.accounts.filter((a) => a.type === 'checking');
      const cashAccs = State.accounts.filter((a) => a.type === 'cash');
      const liquidAccs = [...bankAccs, ...cashAccs];
      const creditAccs = State.accounts.filter((a) => a.type === 'credit');

      const bankTotal = round2(bankAccs.reduce((s, a) => s + Number(a.balance || 0), 0));
      const cashTotal = round2(cashAccs.reduce((s, a) => s + Number(a.balance || 0), 0));
      const totalLiquidity = round2(bankTotal + cashTotal);
      const totalCardDebt = round2(creditAccs.reduce((s, a) => s + Number(a.debt || 0), 0));
      const totalCreditLimit = round2(creditAccs.reduce((s, a) => s + Number(a.limit || 0), 0));
      const availableLimit = Math.max(0, round2(totalCreditLimit - totalCardDebt));
      const utilPct = totalCreditLimit > 0 ? Math.round((totalCardDebt / totalCreditLimit) * 100) : 0;
      const bankPct = totalLiquidity > 0 ? Math.round((bankTotal / totalLiquidity) * 100) : 0;
      const cashPct = totalLiquidity > 0 ? 100 - bankPct : 0;
      const availPct = totalCreditLimit > 0 ? 100 - utilPct : 100;

      host.innerHTML = `
        <article class="dc-kpi-card tx-kpi-card tx-kpi-card--income">
          <div class="tx-kpi-card__head">
            <div>
              <span class="dc-kpi-card__label">Net Likidite</span>
              <div class="dc-kpi-card__value mono tx-kpi-val--income" data-privacy-blur>${tryFmt(totalLiquidity)}</div>
            </div>
            <span class="dc-kpi-badge dc-kpi-badge--emerald mono">${liquidAccs.length} aktif hesap</span>
          </div>
          <div class="tx-kpi-spark-row">
            <div class="tx-kpi-spark-track">
              <span class="tx-kpi-spark-fill tx-kpi-spark-fill--emerald" style="width: ${Math.max(8, bankPct)}%;"></span>
            </div>
            <div class="tx-kpi-foot">
              <span class="tx-kpi-caption">Banka %${bankPct} · Nakit %${cashPct}</span>
              <span class="tx-kpi-caption mono" data-privacy-blur>${tryFmt(bankTotal)} banka</span>
            </div>
          </div>
        </article>

        <article class="dc-kpi-card tx-kpi-card tx-kpi-card--expense">
          <div class="tx-kpi-card__head">
            <div>
              <span class="dc-kpi-card__label">Toplam Kredi Kartı Borcu</span>
              <div class="dc-kpi-card__value mono ${totalCardDebt > 0 ? 'tx-kpi-val--expense' : ''}" data-privacy-blur>${tryFmt(totalCardDebt)}</div>
            </div>
            <span class="dc-kpi-badge ${totalCardDebt > 0 ? 'dc-kpi-badge--rose' : 'dc-kpi-badge--emerald'} mono">${creditAccs.length} aktif kart</span>
          </div>
          <div class="tx-kpi-spark-row">
            <div class="tx-kpi-spark-track">
              <span class="tx-kpi-spark-fill tx-kpi-spark-fill--rose" style="width: ${Math.max(4, utilPct)}%;"></span>
            </div>
            <div class="tx-kpi-foot">
              <span class="tx-kpi-caption">Toplam limit kullanımı</span>
              <span class="tx-kpi-caption mono">%${utilPct} dolu</span>
            </div>
          </div>
        </article>

        <article class="dc-kpi-card tx-kpi-card tx-kpi-card--net">
          <div class="tx-kpi-card__head">
            <div>
              <span class="dc-kpi-card__label">Kullanılabilir Kredi Limiti</span>
              <div class="dc-kpi-card__value mono" style="color:var(--ink-blue);" data-privacy-blur>${tryFmt(availableLimit)}</div>
            </div>
            <span class="dc-kpi-badge dc-kpi-badge--blue mono">%${availPct} boş</span>
          </div>
          <div class="tx-kpi-spark-row">
            <div class="tx-kpi-dual-track" title="Kullanılabilir %${availPct} / Kullanılan %${utilPct}">
              <span class="tx-kpi-dual-in" style="width: ${availPct}%; background: linear-gradient(90deg, #2F6BFF, #60A5FA);"></span>
              <span class="tx-kpi-dual-out" style="width: ${utilPct}%;"></span>
            </div>
            <div class="tx-kpi-foot">
              <span class="tx-kpi-caption">Toplam Kart Limiti</span>
              <span class="tx-kpi-caption mono" data-privacy-blur>${tryFmt(totalCreditLimit)}</span>
            </div>
          </div>
        </article>
      `;

      const mixHost = document.getElementById('assetsMixCard');
      if (mixHost) {
        const netRes = round2(totalLiquidity - totalCardDebt);
        const gross = Math.max(1, totalLiquidity + totalCardDebt);
        const liqShare = Math.round((totalLiquidity / gross) * 100);
        const debtShare = 100 - liqShare;
        mixHost.innerHTML = `
          <div class="assets-mix-head">
            <span class="assets-mix-title">Varlık &amp; Borç Özeti</span>
            <span class="assets-mix-net mono ${netRes >= 0 ? 'is-pos' : 'is-neg'}" data-privacy-blur>${netRes >= 0 ? '+' : '−'}${tryFmt(Math.abs(netRes))}</span>
          </div>
          <div class="tx-kpi-dual-track" title="Likidite %${liqShare} / Kart Borcu %${debtShare}">
            <span class="tx-kpi-dual-in" style="width:${liqShare}%;"></span>
            <span class="tx-kpi-dual-out" style="width:${debtShare}%;"></span>
          </div>
          <div class="assets-mix-rows">
            <div class="assets-mix-row">
              <span><i style="background:#2F6BFF"></i>Vadesiz Banka</span>
              <strong class="mono" data-privacy-blur>${tryFmt(bankTotal)}</strong>
            </div>
            <div class="assets-mix-row">
              <span><i style="background:#10B981"></i>Fiziki Nakit</span>
              <strong class="mono" data-privacy-blur>${tryFmt(cashTotal)}</strong>
            </div>
            <div class="assets-mix-row">
              <span><i style="background:#F43F5E"></i>Kart Borcu</span>
              <strong class="mono" data-privacy-blur>−${tryFmt(totalCardDebt)}</strong>
            </div>
          </div>
        `;
      }
    } catch (err) {
      console.error('renderAssetsKpis error:', err);
    }
  }

  function getFilteredAccounts() {
    return State.accounts.filter((a) => {
      if (activeWalletTab === 'liquid') return a.type === 'checking' || a.type === 'cash';
      if (activeWalletTab === 'credit') return a.type === 'credit';
      return true;
    });
  }

  function renderAssetsCardStage(filtered, throwDir) {
    const stageHost = document.getElementById('assetsCardStage');
    if (!stageHost) return;
    if (!filtered || filtered.length === 0) {
      stageHost.hidden = true;
      stageHost.innerHTML = '';
      return;
    }
    stageHost.hidden = false;
    const selIdx = Math.max(0, filtered.findIndex((a) => a.id === State.selectedAccountId));
    renderInteractiveCardStack(stageHost, filtered, selIdx, {
      flipped: assetsCardFlipped,
      throwDir,
      backCtaLabel: 'Düzenle',
      onFlip: () => {
        assetsCardFlipped = !assetsCardFlipped;
        stageHost.querySelector('.vy-c3d-slot--d0 .vy-c3d-inner')?.classList.toggle('is-flipped', assetsCardFlipped);
      },
      onStep: (dir) => {
        assetsCardFlipped = false;
        const nextIdx = (selIdx + dir + filtered.length) % filtered.length;
        State.selectedAccountId = filtered[nextIdx].id;
        renderWalletList(dir > 0 ? 'next' : 'prev');
      },
      onJump: (idx) => {
        if (idx === selIdx) return;
        const dir = idx > selIdx ? 'next' : 'prev';
        assetsCardFlipped = false;
        State.selectedAccountId = filtered[idx].id;
        renderWalletList(dir);
      },
      onInspect: (accId) => {
        const acc = State.getAccountById ? State.getAccountById(accId) : null;
        if (acc && window.Vaulty.Modals?.AccountModals?.openAddOrEditAccountModal) {
          window.Vaulty.Modals.AccountModals.openAddOrEditAccountModal(acc);
        }
      },
    });
  }

  function renderWalletList(throwDir) {
    try {
      const host = document.getElementById('walletStack');
      if (!host) return;

      const allCount = State.accounts.length;
      const liquidCount = State.accounts.filter((a) => a.type === 'checking' || a.type === 'cash').length;
      const creditCount = State.accounts.filter((a) => a.type === 'credit').length;

      const wAll = document.getElementById('wCountAll');
      if (wAll) wAll.textContent = allCount;
      const wLiq = document.getElementById('wCountLiquid');
      if (wLiq) wLiq.textContent = liquidCount;
      const wCred = document.getElementById('wCountCredit');
      if (wCred) wCred.textContent = creditCount;

      const filtered = getFilteredAccounts();
      if (filtered.length > 0 && !filtered.some((a) => a.id === State.selectedAccountId)) {
        State.selectedAccountId = filtered[0].id;
      }

      renderAssetsCardStage(filtered, throwDir);

      if (filtered.length === 0) {
        State.selectedAccountId = null;
        host.innerHTML = `
          <div class="dc-empty" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 16px;text-align:center;gap:10px;">
            <p style="color:var(--text-secondary);font-size:13px;margin:0;">Bu kategoride tanımlı hesap veya kart bulunmuyor.</p>
            <button type="button" class="btn btn--secondary btn--sm" id="emptyWalletAddBtn" data-action="open-account-modal">+ Hesap Ekle</button>
          </div>`;
        document.getElementById('emptyWalletAddBtn')?.addEventListener('click', () => {
          if (window.Vaulty.Modals?.AccountModals?.openAddOrEditAccountModal) {
            window.Vaulty.Modals.AccountModals.openAddOrEditAccountModal(null);
          }
        });
        renderAccountInspector();
        return;
      }

      host.innerHTML = filtered
        .map((acc) => {
          const pal = ACCENT_PALETTE[acc.accent] || ACCENT_PALETTE.navy;
          const isSelected = acc.id === State.selectedAccountId;
          const selClass = isSelected ? 'is-selected' : '';

          if (acc.type === 'credit') {
            const limit = Number(acc.limit || 1);
            const debt = Number(acc.debt || 0);
            const pct = Math.min(100, Math.round((debt / limit) * 100));
            const highCls = pct >= 75 ? 'is-high' : '';
            const ident = getAccountDisplayIdentifier(acc, State.accounts);
            const rightTag = ident.hasCustom ? ident.displayLabel : (acc.last4 ? `•• ${acc.last4}` : ident.assetCode);
            const badgeMeta = getCreditCardDueBadge(acc);

            return `
            <article
              class="wallet-card wallet-card--credit ${selClass}"
              style="--cc-bg:${pal.ccGradient}"
              data-acc-id="${acc.id}"
              role="option"
              aria-selected="${isSelected}"
              tabindex="0"
            >
              <div class="wc-row-top">
                <span class="wc-brand-wrap">
                  <i class="wc-chip wc-chip--gold" aria-hidden="true"></i>
                  <span>${esc(acc.institution || 'Kredi Kartı')}</span>
                </span>
                <span class="wc-tag-right mono">${esc(rightTag)}</span>
              </div>

              <div class="wc-row-core">
                <span class="wc-title">${esc(acc.nickname || 'Kredi Kartı')}</span>
                <span class="wc-amount mono">${tryFmt(debt)}</span>
              </div>

              <div class="wc-row-bottom wc-row-bottom--credit">
                <div class="wc-credit-meter-wrap">
                  <div class="wc-credit-meter-text mono">
                    <span>${tryFmt(debt)} / ${tryFmt(limit)}</span>
                    <span>%${pct} Dolu</span>
                  </div>
                  <div class="wc-credit-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
                    <i class="wc-credit-fill ${highCls}" style="width:${pct}%"></i>
                  </div>
                </div>
                <div class="wc-card-footer-meta">
                  <span class="wc-asset-code mono">${esc(ident.hasCustom ? ident.displayLabel : ident.assetCode)}</span>
                  <button type="button" class="wc-due-pill ${badgeMeta.cls}" data-action="open-transfer-modal" data-target-id="${acc.id}" data-amount="${debt}" title="Hızlı Transfer & Borç Kapatma Masası">
                    <span>${badgeMeta.text}</span>
                  </button>
                </div>
              </div>
            </article>`;
          }

          if (acc.type === 'cash') {
            const ident = getAccountDisplayIdentifier(acc, State.accounts);
            const copyVal = ident.copyValue || ident.assetCode || 'KAS-TL-01';
            const displayCode = ident.hasCustom ? ident.displayLabel : (ident.assetCode || 'KAS-TL-01');

            return `
            <article
              class="wallet-card wallet-card--cash ${selClass}"
              data-acc-id="${acc.id}"
              role="option"
              aria-selected="${isSelected}"
              tabindex="0"
            >
              <div class="wc-row-top">
                <span class="wc-brand-wrap">
                  <span class="wc-wallet-badge" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                      <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
                      <path d="M16 12h5v4h-5a2 2 0 0 1 0-4z" />
                    </svg>
                  </span>
                  <span>${esc(acc.institution || 'Eldeki Nakit')}</span>
                </span>
                <span class="wc-tag-cash">Eldeki Nakit</span>
              </div>

              <div class="wc-row-core">
                <span class="wc-title">${esc(acc.nickname || 'Nakit Kasa')}</span>
                <span class="wc-amount wc-amount--emerald mono">${tryFmt(acc.balance || 0)}</span>
              </div>

              <div class="wc-row-bottom">
                <button type="button" class="wc-iban-copy mono" data-copy="${esc(copyVal)}" title="Kopyalamak için tıklayın">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>${esc(displayCode)}</span>
                </button>
                <span class="wc-pill wc-pill--cash">Fiziki Nakit</span>
              </div>
            </article>`;
          }

          // Varsayılan: Banka Kartı / Vadesiz Hesap (Debit)
          const ident = getAccountDisplayIdentifier(acc, State.accounts);
          const titleLabel = acc.nickname || 'Vadesiz Hesap';
          const rightTag = ident.hasCustom ? ident.displayLabel : (acc.last4 ? `•• ${acc.last4}` : ident.assetCode);
          const copyVal = ident.copyValue;

          return `
          <article
            class="wallet-card wallet-card--debit ${selClass}"
            data-acc-id="${acc.id}"
            role="option"
            aria-selected="${isSelected}"
            tabindex="0"
          >
            <div class="wc-row-top">
              <span class="wc-brand-wrap">
                <i class="wc-chip wc-chip--silver" aria-hidden="true"></i>
                <span>${esc(acc.institution || 'Banka')}</span>
              </span>
              <span class="wc-tag-right mono">${esc(rightTag)}</span>
            </div>

            <div class="wc-row-core">
              <span class="wc-title">${esc(titleLabel)}</span>
              <span class="wc-amount mono">${tryFmt(acc.balance || 0)}</span>
            </div>

            <div class="wc-row-bottom">
              <button type="button" class="wc-iban-copy mono" data-copy="${esc(copyVal)}" title="Kopyalamak için tıklayın">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>${esc(ident.hasCustom ? ident.displayLabel : ident.assetCode)}</span>
              </button>
              <span class="wc-pill wc-pill--emerald">● Vadesiz / Likit</span>
            </div>
          </article>`;
        })
        .join('');

      host.querySelectorAll('.wallet-card').forEach((card) => {
        const selectThis = () => {
          State.selectedAccountId = card.dataset.accId;
          renderWalletList();
          State.emit('account:selected', State.selectedAccountId);
        };
        card.addEventListener('click', selectThis);
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectThis();
          }
        });
      });

      host.querySelectorAll('.wc-iban-copy').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const text = btn.dataset.copy;
          if (text) {
            navigator.clipboard?.writeText(text).catch(() => {});
            State.showToast(`IBAN / Kasa kodu (${text}) panoya kopyalandı.`);
          }
        });
      });

      host.querySelectorAll('.wc-due-pill').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetId = btn.dataset.targetId;
          const debtAmt = Number(btn.dataset.amount || 0);
          if (window.Vaulty.Modals?.TransferModal?.openTransferModal) {
            window.Vaulty.Modals.TransferModal.openTransferModal(null, targetId, debtAmt);
          } else if (window.openTransferModal) {
            window.openTransferModal(null, targetId, debtAmt);
          } else if (window.Vaulty.Modals?.DebtPayDesk?.openPayCardDebtModal) {
            window.Vaulty.Modals.DebtPayDesk.openPayCardDebtModal(targetId);
          }
        });
      });

      host.querySelectorAll('.wc-cash-adjust-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const accId = btn.dataset.accId;
          const targetAcc = State.accounts.find((a) => a.id === accId);
          if (targetAcc) {
            State.selectedAccountId = targetAcc.id;
            if (window.Vaulty.Modals?.AccountModals?.openUpdateBalanceModal) {
              window.Vaulty.Modals.AccountModals.openUpdateBalanceModal(targetAcc);
            }
          }
        });
      });

      renderAccountInspector();
    } catch (err) {
      console.error('renderWalletList error:', err);
    }
  }

  function renderAccountInspector() {
    try {
      const host = document.getElementById('accountInspector');
      if (!host) return;
      const acc = State.accounts.find((a) => a.id === State.selectedAccountId);

      if (!acc) {
        host.innerHTML = `
          <div class="insp-empty" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 24px;text-align:center;gap:12px;height:100%;min-height:360px;">
            <div style="width:52px;height:52px;border-radius:14px;background:var(--bg-muted);display:grid;place-items:center;color:var(--text-secondary);">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/><path d="M6 15h4"/>
              </svg>
            </div>
            <h3 style="font-size:16px;font-weight:700;color:var(--text-primary);margin:0;">Henüz Hesap veya Kart Seçilmedi</h3>
            <p style="font-size:13px;color:var(--text-secondary);max-width:320px;margin:0;">İncelemek için sol listeden bir hesap seçin veya kasanıza yeni bir varlık tanımlayın.</p>
            <button type="button" class="dc-add-btn" id="emptyInspAddAccBtn" data-action="open-account-modal" style="margin-top:6px;">+ Yeni Hesap / Kart Ekle</button>
          </div>`;
        document.getElementById('emptyInspAddAccBtn')?.addEventListener('click', () => {
          if (window.Vaulty.Modals?.AccountModals?.openAddOrEditAccountModal) {
            window.Vaulty.Modals.AccountModals.openAddOrEditAccountModal(null);
          }
        });
        return;
      }

      const pal = ACCENT_PALETTE[acc.accent] || ACCENT_PALETTE.navy;
      const isCredit = acc.type === 'credit';
      const limit = Number(acc.limit || 0);
      const debt = Number(acc.debt || 0);
      const avail = Math.max(0, round2(limit - debt));
      const cutoff = acc.cutoffDay || 15;
      const dueDay = acc.dueDay || ((cutoff + 10 - 1) % 30) + 1;

      const globalTx = (Array.isArray(State.tx) ? State.tx : []).filter(
        (t) => t && (t.accountId === acc.id || t.sourceAccountId === acc.id)
      );
      // Merge with any legacy acc.transactions not already in State.tx
      const legacyTx = (Array.isArray(acc.transactions) ? acc.transactions : []).filter(
        (at) => at && !globalTx.some((gt) => gt && (gt.id === at.id || gt.id === at.globalTxId))
      );
      const txs = [...globalTx, ...legacyTx].sort(
        (a, b) => String(b.date || '').localeCompare(String(a.date || ''))
      );
      const ident = getAccountDisplayIdentifier(acc, State.accounts);

      host.innerHTML = `
        <div class="insp-top">
          <div class="insp-identity">
            <div class="insp-title-row">
              <h2 class="insp-name">${esc(acc.nickname)}</h2>
              <span class="insp-inst-badge">
                <i class="insp-inst-dot" style="background:${pal.color}" aria-hidden="true"></i>
                <span>${esc(acc.institution)}</span>
              </span>
            </div>

            <div class="insp-iban-row">
              <span class="mono" id="inspIbanText">${esc(ident.displayLabel)}</span>
              <button type="button" class="copy-iban-btn" id="copyIbanBtn" title="Panoya kopyala">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                <span id="copyIbanLabel">Kopyala</span>
              </button>
            </div>
          </div>

          <div class="insp-actions">
            ${
              isCredit
                ? `
            <button type="button" class="insp-action-btn" id="btnPayCardDebtInspector" data-action="open-transfer-modal" data-target-id="${acc.id}" data-amount="${acc.debt}" style="background:var(--tint-blue);color:var(--ink-blue);border-color:var(--border-blue-2);font-weight:600">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m7 16 5 5 5-5"/><path d="M12 21V3"/><path d="m17 8-5-5-5 5"/>
              </svg>
              <span>Borç Öde / Aktar</span>
            </button>`
                : ''
            }
            <button type="button" class="insp-action-btn insp-action-btn--primary" id="btnUpdateBalance" data-action="open-update-balance" data-acc-id="${acc.id}">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              <span>Bakiye Güncelle</span>
            </button>
            <button type="button" class="insp-action-btn insp-action-btn--ghost" id="btnEditAccount" data-action="open-edit-account" data-acc-id="${acc.id}">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              <span>Düzenle</span>
            </button>
            <button type="button" class="insp-action-btn insp-action-btn--ghost" id="btnDeleteAccount" data-action="delete-account" data-acc-id="${acc.id}" title="Hesabı Sil" aria-label="Hesabı Sil" style="color:#EF4444;border-color:rgba(239,68,68,0.25)">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              <span>Sil</span>
            </button>
          </div>
        </div>

        <div class="insp-metrics-grid">
          ${
            isCredit
              ? `
          <div class="insp-metric-card">
            <span class="insp-metric-label">Güncel Borç</span>
            <span class="insp-metric-value mono">${tryFmt(debt)}</span>
          </div>
          <div class="insp-metric-card">
            <span class="insp-metric-label">Kullanılabilir Limit</span>
            <span class="insp-metric-value mono" style="color:var(--ink-green)">${tryFmt(avail)}</span>
          </div>
          <div class="insp-metric-card">
            <span class="insp-metric-label">Hesap Kesim / Son Ödeme</span>
            <span class="insp-metric-value mono" style="font-size:14px">${cutoff}. gün / ${dueDay}. gün</span>
          </div>`
              : `
          <div class="insp-metric-card">
            <span class="insp-metric-label">Kullanılabilir Net Bakiye</span>
            <span class="insp-metric-value mono" style="color:var(--ink-green)">${tryFmt(acc.balance || 0)}</span>
          </div>
          <div class="insp-metric-card">
            <span class="insp-metric-label">Hesap Türü</span>
            <span class="insp-metric-value" style="font-size:14px">${acc.type === 'cash' ? 'Fiziki Nakit Cüzdan' : 'Vadesiz Banka Hesabı'}</span>
          </div>
          <div class="insp-metric-card">
            <span class="insp-metric-label">Hareket Adedi</span>
            <span class="insp-metric-value mono" style="font-size:14px">${txs.length} kayıt</span>
          </div>`
          }
        </div>

        <div class="insp-tx-section">
          <div class="insp-tx-header">
            <h3 class="insp-tx-title">Bu Hesaba Ait Son Hareketler</h3>
            <span class="insp-tx-sub mono">${txs.length} hareket bulundu</span>
          </div>
          <div class="insp-tx-table-wrap">
            <table class="insp-tx-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Açıklama</th>
                  <th>Kategori</th>
                  <th style="text-align:right">Tutar</th>
                </tr>
              </thead>
              <tbody>
                ${
                  txs.length === 0
                    ? `<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-muted)">Bu hesaba ait henüz işlem kaydedilmedi.</td></tr>`
                    : txs
                        .slice(0, 18)
                        .map((t) => {
                          const amt = Math.abs(Number((t.amount ?? t.tutar) || 0));
                          let sign = '−';
                          let color = '#E11D48';

                          if (t.type === 'Transfer' || String(t.type).toLowerCase() === 'transfer') {
                            if (t.accountId === acc.id) {
                              sign = '+';
                              color = '#059669';
                            } else {
                              sign = '−';
                              color = '#2563EB';
                            }
                          } else if (t.type === 'Gelir') {
                            sign = '+';
                            color = '#059669';
                          } else if (t.type === 'Kart Borcu Ödeme') {
                            if (acc.type === 'credit') {
                              sign = '▼ ';
                              color = '#059669';
                            } else {
                              sign = '−';
                              color = '#E11D48';
                            }
                          } else {
                            sign = '−';
                            color = '#E11D48';
                          }
                          return `
                        <tr>
                          <td class="mono" style="color:var(--text-secondary)">${esc(t.date || '')}</td>
                          <td style="font-weight:600;color:var(--text-primary)">${esc(t.desc || '')}</td>
                          <td><span class="dc-badge" style="background:var(--bg-muted);color:var(--text-3)">${esc(t.cat || t.type || 'İşlem')}</span></td>
                          <td class="mono insp-tx-amt" data-privacy-blur style="text-align:right;font-weight:700;color:${color}">
                            ${sign}${tryFmt(amt)}
                          </td>
                        </tr>`;
                        })
                        .join('')
                }
              </tbody>
            </table>
          </div>
        </div>
      `;

      // Buton Dinleyicileri
      document.getElementById('copyIbanBtn')?.addEventListener('click', () => {
        if (ident.copyValue) {
          navigator.clipboard?.writeText(ident.copyValue).then(() => {
            const lbl = document.getElementById('copyIbanLabel');
            if (lbl) {
              const old = lbl.textContent;
              lbl.textContent = 'Kopyalandı!';
              setTimeout(() => { lbl.textContent = old; }, 1800);
            }
            State.showToast(`IBAN / Kasa kodu (${ident.copyValue}) panoya kopyalandı.`);
          }).catch(() => {
            State.showToast('Kopyalama başarısız oldu.');
          });
        }
      });

      document.getElementById('btnPayCardDebtInspector')?.addEventListener('click', () => {
        if (window.Vaulty.Modals?.TransferModal?.openTransferModal) {
          window.Vaulty.Modals.TransferModal.openTransferModal(null, acc.id, acc.debt);
        } else if (window.openTransferModal) {
          window.openTransferModal(null, acc.id, acc.debt);
        } else if (window.Vaulty.Modals?.DebtPayDesk?.openPayCardDebtModal) {
          window.Vaulty.Modals.DebtPayDesk.openPayCardDebtModal(acc.id);
        }
      });

      document.getElementById('btnUpdateBalance')?.addEventListener('click', () => {
        if (window.Vaulty.Modals?.AccountModals?.openUpdateBalanceModal) {
          window.Vaulty.Modals.AccountModals.openUpdateBalanceModal(acc);
        }
      });

      document.getElementById('btnEditAccount')?.addEventListener('click', () => {
        if (window.Vaulty.Modals?.AccountModals?.openAddOrEditAccountModal) {
          window.Vaulty.Modals.AccountModals.openAddOrEditAccountModal(acc);
        }
      });

      document.getElementById('btnDeleteAccount')?.addEventListener('click', async () => {
        let ok = false;
        if (window.Vaulty?.confirm) {
          ok = await window.Vaulty.confirm({
            title: 'Hesabı Silmek İstiyor Musunuz?',
            message: `"${acc.nickname}" hesabını kalıcı olarak silmek istediğinize emin misiniz?`,
            subMessage: 'Bu hesaba ait tüm geçmiş işlemler de kalıcı olarak silinecektir.',
            confirmText: 'Hesabı Sil',
            cancelText: 'Vazgeç',
            type: 'danger',
          });
        } else {
          ok = confirm(`"${acc.nickname}" hesabını silmek istediğinize emin misiniz?\nBu hesaba ait tüm geçmiş işlemler de kalıcı olarak silinecektir.`);
        }
        if (ok) {
          State.deleteAccount(acc.id);
        }
      });
    } catch (err) {
      console.error('renderAccountInspector error:', err);
    }
  }

  function renderDashboardWalletCards(throwDir) {
    try {
      const walletHost = document.getElementById('dashWallet');
      if (!walletHost) return;

      const list = Array.isArray(State.accounts) ? State.accounts : [];
      if (list.length === 0) {
        walletHost.innerHTML = `
          <div style="padding:28px 14px;text-align:center;color:var(--text-secondary);font-size:13px;display:flex;flex-direction:column;align-items:center;gap:10px;">
            <span style="font-weight:600;color:var(--text-primary);">Henüz Hesap Tanımlanmadı</span>
            <span style="font-size:12px;">Banka veya kredi kartı ekleyerek bakiyelerinizi 3D kart vitrininden izleyebilirsiniz.</span>
            <button type="button" class="btn btn--primary btn--sm" data-action="open-account-modal">+ Hesap / Kart Ekle</button>
          </div>`;
        return;
      }

      if (dashCardIdx >= list.length) dashCardIdx = 0;

      renderInteractiveCardStack(walletHost, list, dashCardIdx, {
        flipped: dashCardFlipped,
        throwDir,
        showMetaStrip: true,
        backCtaLabel: 'Varlıklara Git →',
        onFlip: () => {
          dashCardFlipped = !dashCardFlipped;
          walletHost.querySelector('.vy-c3d-slot--d0 .vy-c3d-inner')?.classList.toggle('is-flipped', dashCardFlipped);
        },
        onStep: (dir) => {
          dashCardFlipped = false;
          dashCardIdx = (dashCardIdx + dir + list.length) % list.length;
          renderDashboardWalletCards(dir > 0 ? 'next' : 'prev');
        },
        onJump: (idx) => {
          if (idx === dashCardIdx) return;
          const dir = idx > dashCardIdx ? 'next' : 'prev';
          dashCardFlipped = false;
          dashCardIdx = idx;
          renderDashboardWalletCards(dir);
        },
        onInspect: (accId) => {
          State.selectedAccountId = accId;
          window.Vaulty.Sidebar?.activateNavItem?.('assets');
        },
      });
    } catch (err) {
      console.error('renderDashboardWalletCards error:', err);
    }
  }

  function initCards() {
    document.querySelectorAll('[data-wtab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeWalletTab = btn.dataset.wtab;
        document.querySelectorAll('[data-wtab]').forEach((b) => {
          const on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-selected', String(on));
        });
        renderWalletList();
      });
    });
    // Note: accounts:changed is orchestrated by Views.Assets and Views.Overview to prevent duplicate rendering.
  }

  const Cards = {
    init: initCards,
    renderAssetsKpis,
    renderWalletList,
    renderAccountInspector,
    renderDashboardWalletCards,
    getAccountDisplayIdentifier,
    getAccountAssetCode,
  };

  window.Vaulty = window.Vaulty || {};
  window.Vaulty.Cards = Cards;
})();

