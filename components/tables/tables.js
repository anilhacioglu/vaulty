/* =========================================================================
   VAULTY TABLES COMPONENT (İşlemler Tablosu, Son Hareketler, Borç & Alacak Radarı)
   ========================================================================= */
(() => {
  const { State } = window.Vaulty;
  const { esc, tryFmt, round2, remainingAmount, paidAmount, isArchived, formatDuePill } = State;

  const TR_MONTHS_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const TR_DAYS_LONG = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

  let txViewPage = 1;
  let txViewPageSize = 12;
  let txViewSearch = '';
  let txViewAccountFilter = 'all';
  let txViewTypeFilter = 'all';
  let txViewRangeFilter = 'all';
  let debtSortMode = 'due';

  function isAllFilter(val) {
    return !val || val === 'all' || val === '' || val === 'undefined';
  }

  function getActiveTxFilters() {
    return {
      search: (document.getElementById('txSearchInput')?.value ?? txViewSearch ?? '').trim().toLowerCase(),
      account: document.getElementById('txFilterAccount')?.value ?? txViewAccountFilter ?? 'all',
      type: document.getElementById('txFilterType')?.value ?? txViewTypeFilter ?? 'all',
      range: document.getElementById('txFilterRange')?.value ?? txViewRangeFilter ?? 'all',
    };
  }

  function getPaginationPages(current, total) {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  }

  function formatTxDateTwoLines(isoDate) {
    const parts = String(isoDate || '').split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) {
      return { main: String(isoDate || '—'), sub: '' };
    }
    const [y, m, d] = parts;
    const dt = new Date(y, m - 1, d);
    const dd = String(d).padStart(2, '0');
    const mon = TR_MONTHS_SHORT[m - 1] || '';
    const dayName = TR_DAYS_LONG[dt.getDay()] || '';
    return {
      main: `${dd} ${mon} ${y}`,
      sub: dayName,
    };
  }

  function getCategoryVisualMeta(cat, type) {
    const c = String(cat || '').toLowerCase();

    if (c.includes('market') || c.includes('restoran') || c.includes('kafe') || c.includes('gıda')) {
      return {
        cls: 'tx-cat-icon--market',
        sub: 'Market & Günlük Harcama',
        svg: `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`,
      };
    }

    if (c.includes('seyahat') || c.includes('ulaşım') || c.includes('akaryakıt') || c.includes('uçak')) {
      const isFlight = c.includes('seyahat') || c.includes('uçak');
      return {
        cls: 'tx-cat-icon--travel',
        sub: isFlight ? 'Seyahat & Uçuş' : 'Ulaşım & Akaryakıt',
        svg: isFlight
          ? `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>`
          : `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="15" y2="22"/><line x1="4" y1="9" x2="14" y2="9"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/></svg>`,
      };
    }

    if (type === 'Transfer' || type === 'transfer' || c.includes('transfer') || c.includes('virman')) {
      return {
        cls: 'tx-cat-icon--transfer',
        sub: 'Hesaplar Arası Virman',
        svg: `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 16 5 5 5-5"/><path d="M12 21V3"/><path d="m17 8-5-5-5 5"/></svg>`,
      };
    }

    if (
      type === 'Gelir' ||
      c.includes('maaş') ||
      c.includes('serbest') ||
      c.includes('yatırım') ||
      c.includes('alacak')
    ) {
      return {
        cls: 'tx-cat-icon--income',
        sub: 'Hesaba Gelen Tahsilat',
        svg: `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
      };
    }

    if (c.includes('teknoloji') || c.includes('yazılım') || c.includes('abonelik')) {
      return {
        cls: 'tx-cat-icon--tech',
        sub: 'Teknoloji & Dijital Servis',
        svg: `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
      };
    }

    return {
      cls: 'tx-cat-icon--housing',
      sub: type === 'Kart Borcu Ödeme' ? 'Kredi Kartı Ekstre Mahsubu' : 'Konut, Kira & Sabit Ödeme',
      svg: `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    };
  }

  function getLedgerPartyIconMeta(item) {
    const hay = `${item?.party || ''} ${item?.category || ''}`.toLowerCase();
    const isCorp =
      hay.includes('a.ş') ||
      hay.includes('ltd') ||
      hay.includes('studio') ||
      hay.includes('digital') ||
      hay.includes('fatura') ||
      hay.includes('kurumsal') ||
      hay.includes('retainer') ||
      hay.includes('danışmanlık') ||
      hay.includes('garanti') ||
      hay.includes('banka') ||
      hay.includes('koçfinans') ||
      hay.includes('kredi') ||
      hay.includes('belediye') ||
      hay.includes('vergi') ||
      hay.includes('apple') ||
      hay.includes('mağaza') ||
      hay.includes('ekstre');

    if (isCorp) {
      return {
        cls: 'dc-avatar--corp',
        sdCls: 'sd-avatar--corp',
        svg: `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M14 8H8"/><path d="M16 12H8"/><path d="M13 16H8"/></svg>`,
      };
    }

    return {
      cls: 'dc-avatar--person',
      sdCls: 'sd-avatar--person',
      svg: `<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    };
  }

  function renderAccountBadgeHtml(accountId, sourceAccountId = null) {
    const acc = State.getAccountById(accountId);
    if (!acc) {
      return `
        <span class="acct-chip">
          <span class="acct-chip__icon acct-chip__icon--cash" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>
          </span>
          <span>Genel Kasa</span>
        </span>`;
    }

    if (sourceAccountId) {
      const srcAcc = State.getAccountById(sourceAccountId);
      if (srcAcc) {
        return `
          <div class="acct-transfer-pair" title="${esc(srcAcc.nickname)} ➔ ${esc(acc.nickname)}">
            <span class="acct-chip acct-chip--src"><span>${esc(srcAcc.nickname)}</span></span>
            <span class="acct-chip__arrow">→</span>
            <span class="acct-chip acct-chip--dest"><span>${esc(acc.nickname)}</span></span>
          </div>`;
      }
    }

    const typeCls = acc.type === 'credit' ? 'credit' : acc.type === 'cash' ? 'cash' : 'checking';
    return `
      <span class="acct-chip" title="${esc(acc.institution)} – ${esc(acc.nickname)}">
        <span class="acct-chip__icon acct-chip__icon--${typeCls}" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
        </span>
        <span>${esc(acc.institution)} · ${esc(acc.nickname)}</span>
      </span>`;
  }

  function renderTransactionsView() {
    try {
      const tbody = document.getElementById('txViewRows') || document.getElementById('txTableBody');
      if (!tbody) return;

      const active = getActiveTxFilters();
      const q = active.search;

      let filtered = (Array.isArray(State.tx) ? State.tx : []).filter((t) => {
        if (!t) return false;

        // Hesap / Kart Filtresi
        if (!isAllFilter(active.account)) {
          if (t.accountId !== active.account && t.sourceAccountId !== active.account) {
            return false;
          }
        }

        // İşlem Türü Filtresi (Gelir, Gider, Kart Borcu Ödeme, Transfer)
        if (!isAllFilter(active.type)) {
          const tType = String(t.type || '').trim().toLowerCase();
          const fType = String(active.type).trim().toLowerCase();
          if (fType === 'transfer') {
            if (tType !== 'transfer') return false;
          } else if (fType === 'gider') {
            if (tType !== 'gider') return false;
          } else if (fType === 'gelir') {
            if (tType !== 'gelir') return false;
          } else if (fType.includes('kart')) {
            if (!tType.includes('kart')) return false;
          } else if (t.type !== active.type) {
            return false;
          }
        }

        // Zaman Aralığı Filtresi (Son 7 Gün, Son 30 Gün, Bu Ay)
        if (!isAllFilter(active.range)) {
          const days = State.daysTo ? -State.daysTo(t.date) : 0;
          if (active.range === '7') {
            if (days > 7 || days < 0) return false;
          } else if (active.range === '30') {
            if (days > 30 || days < 0) return false;
          } else if (active.range === 'month') {
            const now = new Date();
            const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            if (!String(t.date || '').startsWith(monthKey)) return false;
          }
        }

        // Canlı Metin Araması (Açıklama, Kategori, Hesap, Kart, Tür)
        if (q) {
          const acc = State.getAccountById(t.accountId);
          const srcAcc = t.sourceAccountId ? State.getAccountById(t.sourceAccountId) : null;
          const hay = `${t.desc || ''} ${t.cat || ''} ${t.type || ''} ${acc?.nickname || ''} ${acc?.institution || ''} ${srcAcc?.nickname || ''} ${srcAcc?.institution || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }

        return true;
      });

      filtered.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

      const totalCount = filtered.length;
      const totalPages = Math.max(1, Math.ceil(totalCount / txViewPageSize));
      if (txViewPage > totalPages) txViewPage = totalPages;

      const startOffset = (txViewPage - 1) * txViewPageSize;
      const pagedItems = filtered.slice(startOffset, startOffset + txViewPageSize);
      const displayStart = totalCount === 0 ? 0 : startOffset + 1;
      const displayEnd = totalCount === 0 ? 0 : Math.min(totalCount, startOffset + pagedItems.length);

      tbody.innerHTML = pagedItems
        .map((t) => {
          const isTransfer = t.type === 'Transfer' || String(t.type).toLowerCase() === 'transfer';
          const isPositive = t.type === 'Gelir';
          const isCardPay = t.type === 'Kart Borcu Ödeme';
          const catMeta = getCategoryVisualMeta(t.cat, t.type);
          const dateLines = formatTxDateTwoLines(t.date);
          const instBadge = t.isInstallment && t.installment
            ? `<span class="inst-micro-pill" title="Taksitli Harcama (Toplam: ${tryFmt(t.installment.totalAmount)} · ${t.installment.currentInstallment}/${t.installment.totalInstallments} Taksit)"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> ${t.installment.currentInstallment}/${t.installment.totalInstallments} Taksit</span>`
            : '';
          const recBadge = t.isRecurring
            ? `<span class="rec-micro-pill" title="Düzenli Tekrarlayan İşlem (Sonraki Vade: ${t.nextDueDate || '-'})"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg> Sabit</span>`
            : '';

          const acc = State.getAccountById(t.accountId);
          const last4Tag = !isTransfer && acc && acc.last4 ? `<span class="tx-last4 mono">[ ${esc(acc.last4)} ]</span>` : '';
          const flowCls = isPositive ? 'tx-flow--in' : isTransfer ? 'tx-flow--transfer' : isCardPay ? 'tx-flow--card' : 'tx-flow--out';
          const amtSign = isPositive ? '+' : isTransfer ? '⇄ ' : '-';
          const amtCls = isPositive ? 'is-income' : isTransfer ? 'is-transfer' : '';

          return `
          <tr data-tx-row="${esc(t.id)}">
            <td>
              <div class="tx-primary-cell">
                <span class="tx-cat-icon ${catMeta.cls}" aria-hidden="true">${catMeta.svg}</span>
                <div class="tx-primary-stack">
                  <span class="tx-desc-line">${esc(t.desc)}${recBadge}${instBadge}</span>
                  <span class="tx-cat-line">${esc(t.cat)} · ${esc(catMeta.sub)}</span>
                </div>
              </div>
            </td>
            <td>
              <div class="tx-date-stack">
                <span class="tx-date-main">${esc(dateLines.main)}</span>
                <span class="tx-date-sub">${esc(dateLines.sub)}</span>
              </div>
            </td>
            <td><div class="tx-acct-cell">${renderAccountBadgeHtml(t.accountId, isTransfer ? t.sourceAccountId : null)}${last4Tag}</div></td>
            <td><span class="tx-flow ${flowCls}">${esc(t.type)}</span></td>
            <td class="tx-amt-cell">
              <div class="tx-amt-wrap">
                <div class="tx-row-actions">
                  <button type="button" class="tx-row-btn tx-row-btn--text" data-edit-tx="${esc(t.id)}" title="Düzenle">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                    </svg>
                    <span>Düzenle</span>
                  </button>
                  <button type="button" class="tx-row-btn tx-row-btn--del" data-del-tx="${esc(t.id)}" title="İşlemi sil">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
                <span class="tx-amt-val mono ${amtCls}">${amtSign}${tryFmt(t.amount)}</span>
              </div>
            </td>
          </tr>`;
        })
        .join('');

      tbody.querySelectorAll('[data-edit-tx]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const txId = btn.dataset.editTx;
          if (window.Vaulty.Modals?.NewTransaction?.startEditTransaction) {
            window.Vaulty.Modals.NewTransaction.startEditTransaction(txId);
          } else if (window.startEditTransaction) {
            window.startEditTransaction(txId);
          }
        });
      });

      tbody.querySelectorAll('[data-del-tx]').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const txId = btn.dataset.delTx;
          const target = State?.tx?.find((x) => x && x.id === txId);
          const desc = target?.desc || 'Bu';
          let ok = false;
          if (window.Vaulty?.confirm) {
            ok = await window.Vaulty.confirm({
              title: 'İşlemi Silmek İstiyor Musunuz?',
              message: `"${desc}" işlemini silmek istediğinize emin misiniz?`,
              subMessage: 'İlgili hesap bakiyesi otomatik olarak eski haline getirilecektir.',
              confirmText: 'İşlemi Sil',
              cancelText: 'Vazgeç',
              type: 'danger',
            });
          } else {
            ok = confirm(`"${desc}" işlemini silmek istediğinize emin misiniz?`);
          }
          if (!ok) return;

          if (window.Vaulty.Modals?.NewTransaction?.deleteTransactionById) {
            window.Vaulty.Modals.NewTransaction.deleteTransactionById(txId, true);
          } else if (State.deleteTransaction) {
            State.deleteTransaction(txId, true);
          }
        });
      });

      const emptyEl = document.getElementById('txViewEmpty');
      if (emptyEl) emptyEl.hidden = filtered.length > 0;
      const countEl = document.getElementById('txViewRowCount');
      if (countEl) countEl.textContent = `${filtered.length} işlem`;

      const footerCounterEl = document.getElementById('txFooterCounter');
      if (footerCounterEl) {
        footerCounterEl.textContent =
          totalCount === 0
            ? 'Toplam 0 işlemden 0-0 arası gösteriliyor'
            : `Toplam ${totalCount} işlemden ${displayStart}-${displayEnd} arası gösteriliyor`;
      }

      document.querySelectorAll('.tx-pagesize-chip').forEach((chip) => {
        const sz = Number(chip.dataset.pagesize) || 12;
        chip.classList.toggle('is-active', sz === txViewPageSize);
      });

      const paginationEl = document.getElementById('txPaginationControls');
      if (paginationEl) {
        let pageButtonsHtml = `
          <button type="button" class="tx-page-btn" data-tx-page="${txViewPage - 1}" ${txViewPage <= 1 ? 'disabled' : ''} aria-label="Önceki sayfa">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            <span>Önceki</span>
          </button>
        `;

        const pages = getPaginationPages(txViewPage, totalPages);
        pages.forEach((p) => {
          if (p === '...') {
            pageButtonsHtml += `<span class="tx-page-ellipsis" style="padding:0 4px;color:#94A3B8;font-size:13px;font-weight:600;">…</span>`;
          } else {
            pageButtonsHtml += `
              <button type="button" class="tx-page-btn ${p === txViewPage ? 'is-active' : ''}" data-tx-page="${p}" aria-current="${p === txViewPage ? 'page' : 'false'}">
                ${p}
              </button>
            `;
          }
        });

        pageButtonsHtml += `
          <button type="button" class="tx-page-btn" data-tx-page="${txViewPage + 1}" ${txViewPage >= totalPages ? 'disabled' : ''} aria-label="Sonraki sayfa">
            <span>Sonraki</span>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        `;

        paginationEl.innerHTML = pageButtonsHtml;
        paginationEl.querySelectorAll('[data-tx-page]').forEach((btn) => {
          btn.addEventListener('click', () => {
            if (btn.disabled) return;
            const targetPage = Number(btn.dataset.txPage);
            if (targetPage >= 1 && targetPage <= totalPages && targetPage !== txViewPage) {
              txViewPage = targetPage;
              renderTransactionsView();
            }
          });
        });
      }

      window.Vaulty.Views?.Transactions?.renderTxKpiStrip?.();
    } catch (err) {
      console.error('renderTransactionsView error:', err);
    }
  }

  function renderRecentTxTable() {
    try {
      const recentHost = document.getElementById('dashRecent');
      if (!recentHost) return;

      const recent = [...State.tx].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, 6);

      if (recent.length === 0) {
        recentHost.innerHTML = `
          <li style="padding:28px 16px;text-align:center;color:#64748B;font-size:13px;display:flex;flex-direction:column;align-items:center;gap:10px;">
            <span>Henüz kayıtlı bir işlem hareketi yok.</span>
            <button type="button" class="btn btn--secondary btn--sm" id="emptyDashAddTxBtn">+ İlk İşlemi Ekle</button>
          </li>`;
        document.getElementById('emptyDashAddTxBtn')?.addEventListener('click', () => {
          if (window.Vaulty.Modals?.NewTransaction?.openNewTransactionModal) {
            window.Vaulty.Modals.NewTransaction.openNewTransactionModal('Gider');
          }
        });
        return;
      }

      recentHost.innerHTML = recent
        .map((t) => {
          const pos = t.type === 'Gelir';
          const isTransfer = t.type === 'Transfer';
          const meta = getCategoryVisualMeta(t.cat, t.type);
          const dl = formatTxDateTwoLines(t.date);
          const instBadge = t.isInstallment && t.installment
            ? `<span class="inst-micro-pill" title="Taksitli Harcama (Toplam: ${tryFmt(t.installment.totalAmount)} · ${t.installment.currentInstallment}/${t.installment.totalInstallments} Taksit)"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> ${t.installment.currentInstallment}/${t.installment.totalInstallments} Taksit</span>`
            : '';
          const recBadge = t.isRecurring
            ? `<span class="rec-micro-pill" title="Tekrarlayan"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg> Sabit</span>`
            : '';
          const amtSign = pos ? '+' : isTransfer ? '⇄ ' : '−';
          const valCls = pos ? 'pos' : isTransfer ? 'transfer' : '';
          return `
          <li class="dash-act">
            <span class="tx-cat-icon ${meta.cls} dash-act__icon" aria-hidden="true">${meta.svg}</span>
            <div class="dash-act__body">
              <span class="dash-act__title">${esc(t.desc)}${recBadge}${instBadge}</span>
              <span class="dash-act__meta">${esc(t.cat)} · ${esc(dl.main)}</span>
            </div>
            <span class="dash-act__val mono ${valCls}">${amtSign}${tryFmt(t.amount)}</span>
          </li>`;
        })
        .join('');
    } catch (err) {
      console.error('renderRecentTxTable error:', err);
    }
  }

  function renderDebtList() {
    try {
      const q = (document.getElementById('dcSearchInput')?.value || '').trim().toLowerCase();
      let filtered = State.ledgerItems.filter((item) => {
        if (!item) return false;
        if (State.activeSegment === 'payable') {
          if (item.kind !== 'payable') return false;
        } else if (State.activeSegment === 'receivable') {
          if (item.kind !== 'receivable') return false;
        } // 'all': show both payable and receivable
        if (q) {
          const hay = `${item.party || ''} ${item.category || ''} ${item.dueDate || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });

      filtered.sort((a, b) => {
        if (debtSortMode === 'remaining') {
          return remainingAmount(b) - remainingAmount(a);
        }
        return String(a.dueDate || '').localeCompare(String(b.dueDate || ''));
      });

      const host = document.getElementById('dcList');
      if (!host) return;

      if (filtered.length === 0) {
        host.innerHTML = `
          <div class="dc-empty" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 24px;text-align:center;gap:12px;">
            <p style="color:#64748B;font-size:13px;margin:0;">Bu görünümde kayıtlı alacak veya borç bulunmuyor.</p>
            <button type="button" class="dc-add-btn" id="emptyDebtAddBtn" data-action="open-debt-modal" style="margin-top:6px;">+ Yeni Kayıt Ekle</button>
          </div>`;
        document.getElementById('emptyDebtAddBtn')?.addEventListener('click', () => {
          if (window.Vaulty.AccountModals?.openAddOrEditLedgerModal) {
            window.Vaulty.AccountModals.openAddOrEditLedgerModal(null);
          } else if (window.openNewLedgerModal) {
            window.openNewLedgerModal();
          }
        });
        return;
      }

      host.innerHTML = filtered
        .map((item) => {
          const paid = paidAmount(item);
          const rem = remainingAmount(item);
          const totalNum = Number(item.total || 0);
          const pct = totalNum > 0 ? Math.min(100, Math.round((paid / totalNum) * 100)) : 0;
          const due = formatDuePill(item);
          const fillCls = item.kind === 'receivable' ? 'dc-progress-fill--rec' : 'dc-progress-fill--pay';
          const selectedCls = item.id === State.activeDrawerItemId ? 'is-selected' : '';
          const iconMeta = getLedgerPartyIconMeta(item);

          return `
          <article class="dc-row ${selectedCls}" data-id="${item.id}" tabindex="0" role="button" aria-label="${esc(item.party)} detaylarını aç">
            <div class="dc-col-party">
              <span class="dc-avatar ${iconMeta.cls}" aria-hidden="true">${iconMeta.svg}</span>
              <div class="dc-party-info">
                <span class="dc-party-name">${esc(item.party)}</span>
                <span class="dc-party-meta">${esc(item.category)} • <span class="mono">${item.createdAt || ''}</span></span>
              </div>
            </div>

            <div class="dc-col-progress">
              <span class="dc-progress-label mono">%${pct} ödendi • ${tryFmt(paid)} / ${tryFmt(totalNum)}</span>
              <div class="dc-progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
                <i class="dc-progress-fill ${fillCls}" style="width:${pct}%"></i>
              </div>
            </div>

            <div class="dc-col-due">
              <span class="dc-due-pill ${due.cls} mono"><span>${due.text}</span></span>
            </div>

            <div class="dc-col-balance mono">
              ${tryFmt(rem)}
            </div>

            <div class="dc-col-actions">
              <button type="button" class="dc-pay-btn" data-pay-btn="${item.id}" title="${isArchived(item) ? 'Detaylar' : item.kind === 'receivable' ? 'Tahsilat Ekle' : 'Ödeme Düş'}">
                ${isArchived(item) ? 'Detaylar' : item.kind === 'receivable' ? 'Tahsilat Ekle' : 'Ödeme Düş'}
              </button>
              <div class="dc-row-btn-group">
                <button type="button" class="dc-action-icon-btn dc-action-icon-btn--edit" data-edit-debt="${item.id}" title="Kaydı Düzenle" aria-label="Kaydı Düzenle">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                  </svg>
                </button>
                <button type="button" class="dc-action-icon-btn dc-action-icon-btn--del" data-del-debt="${item.id}" title="Kaydı Sil" aria-label="Kaydı Sil">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          </article>`;
        })
        .join('');

      host.querySelectorAll('[data-edit-debt]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.editDebt;
          const item = State.ledgerItems.find((x) => x && x.id === id);
          if (item) {
            if (window.Vaulty.AccountModals?.openAddOrEditLedgerModal) {
              window.Vaulty.AccountModals.openAddOrEditLedgerModal(item);
            } else if (window.openAddOrEditLedgerModal) {
              window.openAddOrEditLedgerModal(item);
            }
          }
        });
      });

      host.querySelectorAll('[data-del-debt]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.delDebt;
          const item = State.ledgerItems.find((x) => x && x.id === id);
          if (item) {
            if (window.Vaulty.AccountModals?.openConfirmDeleteDebtModal) {
              window.Vaulty.AccountModals.openConfirmDeleteDebtModal(item);
            } else if (window.openConfirmDeleteDebtModal) {
              window.openConfirmDeleteDebtModal(item);
            }
          }
        });
      });

      host.querySelectorAll('.dc-row').forEach((row) => {
        const id = row.dataset.id;
        row.addEventListener('click', (e) => {
          if (e.target.closest('[data-edit-debt]') || e.target.closest('[data-del-debt]')) {
            return;
          }
          const fromPayBtn = Boolean(e.target.closest('[data-pay-btn]'));
          if (window.Vaulty.DebtPayDesk?.openDrawer) {
            window.Vaulty.DebtPayDesk.openDrawer(id, fromPayBtn);
          } else if (window.openDrawer) {
            window.openDrawer(id, fromPayBtn);
          }
        });
        row.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (window.Vaulty.DebtPayDesk?.openDrawer) {
              window.Vaulty.DebtPayDesk.openDrawer(id, false);
            } else if (window.openDrawer) {
              window.openDrawer(id, false);
            }
          }
        });
      });
    } catch (err) {
      console.error('renderDebtList error:', err);
    }
  }

  function renderRadarTable() {
    try {
      const radarHost = document.getElementById('dashRadar');
      if (!radarHost) return;

      // 7 gün içinde vadesi gelen veya geciken kayıtlar (öncelikli)
      let dues = State.ledgerItems
        .filter((x) => x && !isArchived(x) && State.daysTo(x.dueDate) <= 7)
        .sort((a, b) => State.daysTo(a.dueDate) - State.daysTo(b.dueDate));

      // 7 gün içinde acil yoksa 14 gün içindekileri göster
      if (dues.length === 0) {
        dues = State.ledgerItems
          .filter((x) => x && !isArchived(x) && State.daysTo(x.dueDate) <= 14)
          .sort((a, b) => State.daysTo(a.dueDate) - State.daysTo(b.dueDate));
      }

      if (dues.length === 0) {
        radarHost.innerHTML = `<li class="dash-radar__empty">${State.ledgerItems.length === 0 ? 'Kayıtlı borç veya alacak bulunmuyor.' : 'Yaklaşan acil vadeli kayıt bulunmuyor 🎉'}</li>`;
        return;
      }

      radarHost.innerHTML = dues
        .slice(0, 5)
        .map((it) => {
          const b = formatDuePill(it);
          const icon = getLedgerPartyIconMeta(it);
          const isRec = it.kind === 'receivable';
          return `
          <li class="dash-radar__item" data-id="${esc(it.id)}" style="cursor:pointer;" title="Ödeme masasını açmak için tıklayın">
            <span class="dc-avatar ${icon.cls} dash-radar__avatar" aria-hidden="true">${icon.svg}</span>
            <div class="dash-radar__body">
              <span class="dash-radar__party">${esc(it.party)}</span>
              <span class="dash-radar__meta"><span class="${isRec ? 'dash-tag--rec' : 'dash-tag--pay'}">${isRec ? 'Alacak' : 'Borç'}</span>: <span class="mono dash-radar__amt" data-privacy-blur>${tryFmt(remainingAmount(it))}</span></span>
              <span class="dash-pill ${b.cls}">${b.text}</span>
            </div>
            <button type="button" class="dash-mini-btn" data-radar-open="${esc(it.id)}">İncele</button>
          </li>`;
        })
        .join('');

      radarHost.querySelectorAll('.dash-radar__item').forEach((li) => {
        const id = li.dataset.id;
        li.addEventListener('click', (e) => {
          window.Vaulty.Sidebar?.activateNavItem('debt');
          if (window.Vaulty.Modals?.DebtPayDesk?.openDrawer) {
            window.Vaulty.Modals.DebtPayDesk.openDrawer(id, false);
          }
        });
      });
    } catch (err) {
      console.error('renderRadarTable error:', err);
    }
  }

  function initTables() {
    document.querySelectorAll('.tx-pagesize-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const newSize = Number(chip.dataset.pagesize) || 12;
        if (newSize !== txViewPageSize) {
          txViewPageSize = newSize;
          txViewPage = 1;
          renderTransactionsView();
        }
      });
    });

    document.getElementById('txSearchInput')?.addEventListener('input', (e) => {
      txViewSearch = e.target.value;
      txViewPage = 1;
      renderTransactionsView();
    });

    document.getElementById('txFilterAccount')?.addEventListener('change', (e) => {
      txViewAccountFilter = e.target.value;
      txViewPage = 1;
      renderTransactionsView();
    });

    document.getElementById('txFilterType')?.addEventListener('change', (e) => {
      txViewTypeFilter = e.target.value;
      txViewPage = 1;
      renderTransactionsView();
    });

    document.getElementById('txFilterRange')?.addEventListener('change', (e) => {
      txViewRangeFilter = e.target.value;
      txViewPage = 1;
      renderTransactionsView();
    });

    document.getElementById('dcSearchInput')?.addEventListener('input', () => {
      renderDebtList();
    });

    document.getElementById('dcSortSelect')?.addEventListener('change', (e) => {
      debtSortMode = e.target.value;
      renderDebtList();
    });
    // Note: State change listeners (transactions:changed, ledger:changed) are orchestrated
    // by their respective View controllers (Overview, Transactions, Debts) to eliminate duplicate table rendering.
  }

  function setDebtSortMode(mode) {
    debtSortMode = mode;
    const sel = document.getElementById('dcSortSelect');
    if (sel && sel.value !== mode) {
      sel.value = mode;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      renderDebtList();
    }
  }

  function getDebtSortMode() {
    return debtSortMode;
  }

  const Tables = {
    init: initTables,
    renderTransactionsView,
    renderRecentTxTable,
    renderDebtList,
    renderRadarTable,
    getActiveTxFilters,
    getCategoryVisualMeta,
    formatTxDateTwoLines,
    getLedgerPartyIconMeta,
    setDebtSortMode,
    getDebtSortMode,
  };

  window.Vaulty = window.Vaulty || {};
  window.Vaulty.Tables = Tables;
})();

