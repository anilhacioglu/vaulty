/* =========================================================================
   VAULTY CARDS COMPONENT (Banka, Nakit ve Kredi Kartı Kartları & Limit Barları)
   ========================================================================= */
(() => {
  const { State } = window.Vaulty;
  const { esc, tryFmt, round2, ACCENT_PALETTE } = State;

  let activeWalletTab = 'all';

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

      const liquidAccs = State.accounts.filter((a) => a.type === 'checking' || a.type === 'cash');
      const creditAccs = State.accounts.filter((a) => a.type === 'credit');

      const totalLiquidity = round2(liquidAccs.reduce((s, a) => s + Number(a.balance || 0), 0));
      const totalCardDebt = round2(creditAccs.reduce((s, a) => s + Number(a.debt || 0), 0));
      const totalCreditLimit = round2(creditAccs.reduce((s, a) => s + Number(a.limit || 0), 0));
      const availableLimit = Math.max(0, round2(totalCreditLimit - totalCardDebt));
      const utilPct = totalCreditLimit > 0 ? Math.round((totalCardDebt / totalCreditLimit) * 100) : 0;

      host.innerHTML = `
        <article class="dc-kpi-card">
          <div class="dc-kpi-card__top">
            <span class="dc-kpi-card__label">Net Likidite</span>
          </div>
          <div class="dc-kpi-card__value mono" style="color:#059669;">${tryFmt(totalLiquidity)}</div>
          <span class="dc-kpi-badge dc-kpi-badge--emerald mono">
            ${liquidAccs.length} aktif hesap
          </span>
        </article>

        <article class="dc-kpi-card">
          <div class="dc-kpi-card__top">
            <span class="dc-kpi-card__label">Toplam Kredi Kartı Borcu</span>
          </div>
          <div class="dc-kpi-card__value mono" style="color:${totalCardDebt > 0 ? '#E11D48' : '#0F172A'};">${tryFmt(totalCardDebt)}</div>
          <span class="dc-kpi-badge ${totalCardDebt > 0 ? 'dc-kpi-badge--rose' : 'dc-kpi-badge--emerald'} mono">
            ${creditAccs.length} aktif kart
          </span>
        </article>

        <article class="dc-kpi-card">
          <div class="dc-kpi-card__top">
            <span class="dc-kpi-card__label">Kullanılabilir Kredi Limiti</span>
          </div>
          <div class="dc-kpi-card__value mono" style="color:#2563EB;">${tryFmt(availableLimit)}</div>
          <span class="dc-kpi-badge dc-kpi-badge--blue mono">
            %${utilPct} kullanıldı (Limit: ${tryFmt(totalCreditLimit)})
          </span>
        </article>
      `;
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

  function renderWalletList() {
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

      if (filtered.length === 0) {
        State.selectedAccountId = null;
        host.innerHTML = `
          <div class="dc-empty" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 16px;text-align:center;gap:10px;">
            <p style="color:#64748B;font-size:13px;margin:0;">Bu kategoride tanımlı hesap veya kart bulunmuyor.</p>
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
            <div style="width:52px;height:52px;border-radius:14px;background:#F1F5F9;display:grid;place-items:center;color:#64748B;">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/><path d="M6 15h4"/>
              </svg>
            </div>
            <h3 style="font-size:16px;font-weight:700;color:#0F172A;margin:0;">Henüz Hesap veya Kart Seçilmedi</h3>
            <p style="font-size:13px;color:#64748B;max-width:320px;margin:0;">İncelemek için sol listeden bir hesap seçin veya kasanıza yeni bir varlık tanımlayın.</p>
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
            <button type="button" class="insp-action-btn" id="btnPayCardDebtInspector" data-action="open-transfer-modal" data-target-id="${acc.id}" data-amount="${acc.debt}" style="background:#EFF6FF;color:#2563EB;border-color:#BFDBFE;font-weight:600">
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
            <span class="insp-metric-value mono" style="color:#059669">${tryFmt(avail)}</span>
          </div>
          <div class="insp-metric-card">
            <span class="insp-metric-label">Hesap Kesim / Son Ödeme</span>
            <span class="insp-metric-value mono" style="font-size:14px">${cutoff}. gün / ${dueDay}. gün</span>
          </div>`
              : `
          <div class="insp-metric-card">
            <span class="insp-metric-label">Kullanılabilir Net Bakiye</span>
            <span class="insp-metric-value mono" style="color:#059669">${tryFmt(acc.balance || 0)}</span>
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
                    ? `<tr><td colspan="4" style="text-align:center;padding:24px;color:#94A3B8">Bu hesaba ait henüz işlem kaydedilmedi.</td></tr>`
                    : txs
                        .slice(0, 10)
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
                          <td class="mono" style="color:#64748B">${esc(t.date || '')}</td>
                          <td style="font-weight:600;color:#0F172A">${esc(t.desc || '')}</td>
                          <td><span class="dc-badge" style="background:#F1F5F9;color:#475569">${esc(t.cat || t.type || 'İşlem')}</span></td>
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

  function renderDashboardWalletCards() {
    try {
      const walletHost = document.getElementById('dashWallet');
      if (!walletHost) return;

      if (State.accounts.length === 0) {
        walletHost.innerHTML = `
          <div style="padding:24px 12px;text-align:center;color:#64748B;font-size:13px;display:flex;flex-direction:column;align-items:center;gap:6px;">
            <span style="font-weight:600;color:#0F172A;">Henüz Hesap Tanımlanmadı</span>
            <span style="font-size:12px;">Banka veya kredi kartı ekleyerek bakiyelerinizi buradan izleyebilirsiniz.</span>
          </div>`;
        return;
      }

      const walletPicks = [
        State.accounts.find((a) => a && a.type === 'checking'),
        State.accounts.find((a) => a && a.type === 'credit'),
      ].filter(Boolean);

      const listToRender = walletPicks.length > 0 ? walletPicks : State.accounts.slice(0, 2);

      walletHost.innerHTML = listToRender
        .map((a, i) => {
          const isCredit = a.type === 'credit';
          const used = Number(a.debt || 0);
          const limit = Number(a.limit || 0);
          const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
          return `
          <button type="button" class="dash-wcard ${isCredit ? 'dash-wcard--credit' : 'dash-wcard--checking'} dash-anim" style="--i:${i + 3}" data-goto="assets">
            <span class="dash-wcard__row">
              <span class="dash-wcard__bank">${esc(a.institution)}</span>
              <span class="dash-wcard__type">${isCredit ? 'Kredi Kartı' : 'Vadesiz'}</span>
            </span>
            <span class="dash-wcard__name">${esc(a.nickname)} <em class="mono">•••• ${esc(a.last4)}</em></span>
            <span class="dash-wcard__bal mono">${isCredit ? tryFmt(used) : tryFmt(a.balance)}</span>
            ${
              isCredit
                ? `<span class="dash-wcard__limit"><span class="dash-wcard__track"><i style="width:${pct}%"></i></span><span class="dash-wcard__limit-txt mono">Kullanılan · Limit ${tryFmt(limit)} (%${pct})</span></span>`
                : `<span class="dash-wcard__limit-txt">Güncel bakiye</span>`
            }
          </button>`;
        })
        .join('');

      walletHost.querySelectorAll('[data-goto="assets"]').forEach((btn) => {
        btn.addEventListener('click', () => {
          window.Vaulty.Sidebar?.activateNavItem('assets');
        });
        btn.addEventListener('mousemove', (e) => {
          const rect = btn.getBoundingClientRect();
          btn.style.setProperty('--mx', `${e.clientX - rect.left}px`);
          btn.style.setProperty('--my', `${e.clientY - rect.top}px`);
        });
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

