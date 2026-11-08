/* =========================================================================
   VAULTY VIEW: ASSETS (Varlıklarım Görünümü, Hesaplar & Birikim Kumbaraları)
   ========================================================================= */
(() => {
  'use strict';

  const { State } = window.Vaulty;
  const { esc, tryFmt, round2 } = State;

  const ICON_SVGS = {
    shield: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    laptop: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/></svg>`,
    plane: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m17.8 19.2 1.7-1.7-4.4-6.8L19 7l-2-2-4.7 3.9L5.5 4.5l-1.7 1.7 4.2 5-3.3 3.3-2.1-.7-1.4 1.4 2.8 1.4 1.4 2.8 1.4-1.4-.7-2.1 3.3-3.3 5 4.2z"/></svg>`,
    car: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.1 2 11.5 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`,
    home: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    gift: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>`,
    star: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  };

  function renderSavingsGoals() {
    const host = document.getElementById('savingsPotsGrid');
    if (!host) return;

    const goals = State.getSavingsGoals ? State.getSavingsGoals() : (State.savingsGoals || []);

    if (goals.length === 0) {
      host.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; background: #FFFFFF; border: 1px dashed #CBD5E1; border-radius: 14px;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: #ECFDF5; color: #059669; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h.5A2.5 2.5 0 0 0 23 9.5c0-1.4-1.1-2.5-2.5-2.5H20a2.7 2.7 0 0 0-1-2z"/><circle cx="17.5" cy="9.5" r="1"/></svg>
          </div>
          <h3 style="font-size: 16px; font-weight: 700; color: #0F172A; margin: 0 0 4px;">Henüz Birikim Hedefi Tanımlanmadı</h3>
          <p style="font-size: 13px; color: #64748B; margin: 0 0 16px;">Acil durum fonu, teknoloji, tatil veya ev peşinatı gibi hedefleriniz için sanal kumbara oluşturun.</p>
          <button type="button" class="btn btn--primary" id="emptyAddSavingsGoalBtn" style="padding: 8px 16px; border-radius: 8px; font-weight: 600;">+ İlk Kumbarayı Oluştur</button>
        </div>`;
      return;
    }

    host.innerHTML = goals
      .map((g) => {
        const cur = Number(g.currentAmount || 0);
        const tgt = Math.max(1, Number(g.targetAmount || 0));
        const pct = Math.min(100, Math.round((cur / tgt) * 100));
        const remaining = Math.max(0, round2(tgt - cur));
        const iconSvg = ICON_SVGS[g.icon] || ICON_SVGS.star;
        const color = g.color || '#10B981';

        let dateDisplay = 'Belirtilmedi';
        if (g.targetDate) {
          try {
            const d = new Date(g.targetDate);
            if (!isNaN(d.getTime())) {
              dateDisplay = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
            }
          } catch {
            dateDisplay = g.targetDate;
          }
        }

        return `
          <article class="card pot-card" style="padding:18px; background:#FFFFFF; border:1px solid #E2E8F0; border-radius:14px; box-shadow:0 1px 3px rgba(0,0,0,0.04); display:flex; flex-direction:column; justify-content:space-between; position:relative; overflow:hidden;">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <div style="width:40px; height:40px; border-radius:10px; background:${color}15; color:${color}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    ${iconSvg}
                  </div>
                  <div>
                    <h3 style="font-size:15px; font-weight:700; color:#0F172A; margin:0;">${esc(g.name)}</h3>
                    <span style="font-size:12px; color:#64748B;">Hedef: ${dateDisplay}</span>
                  </div>
                </div>
                <button type="button" class="btn btn--ghost edit-pot-btn" data-pot-id="${g.id}" style="padding:4px 8px; font-size:12px; color:#64748B; border:none; background:none; cursor:pointer;" title="Düzenle">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>

              <div style="margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px;">
                  <span class="mono" style="font-size:19px; font-weight:800; color:#0F172A;">${tryFmt(cur)}</span>
                  <span class="mono" style="font-size:13px; color:#64748B; font-weight:600;">/ ${tryFmt(tgt)}</span>
                </div>
                <div style="height:8px; width:100%; background:#F1F5F9; border-radius:999px; overflow:hidden;">
                  <div style="height:100%; width:${pct}%; background:${color}; border-radius:999px; transition:width 0.3s ease;"></div>
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:6px; font-size:11px; color:#64748B;">
                  <span class="mono" style="font-weight:700; color:${color};">%${pct} Tamamlandı</span>
                  <span class="mono">${remaining <= 0 ? '🎉 Hedefe Ulaşıldı!' : `Kalan: ${tryFmt(remaining)}`}</span>
                </div>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px; padding-top:12px; border-top:1px solid #F1F5F9;">
              <button type="button" class="btn btn--secondary pot-withdraw-btn" data-pot-id="${g.id}" style="padding:7px 10px; font-size:12px; font-weight:600; border-radius:8px; display:inline-flex; align-items:center; justify-content:center; gap:4px; border:1px solid #CBD5E1; background:#FFFFFF; cursor:pointer;">
                <span>− Para Çek</span>
              </button>
              <button type="button" class="btn btn--primary pot-deposit-btn" data-pot-id="${g.id}" style="padding:7px 10px; font-size:12px; font-weight:600; border-radius:8px; display:inline-flex; align-items:center; justify-content:center; gap:4px; background:${color}; border:none; color:#FFFFFF; cursor:pointer;">
                <span>+ Para Ekle</span>
              </button>
            </div>
          </article>
        `;
      })
      .join('');

    // Buton dinleyicilerini bağla
    host.querySelectorAll('.edit-pot-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.Vaulty.Modals?.SavingsGoal?.openGoalModal(btn.dataset.potId);
      });
    });

    host.querySelectorAll('.pot-deposit-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.Vaulty.Modals?.SavingsGoal?.openTransferDlg(btn.dataset.potId, 'deposit');
      });
    });

    host.querySelectorAll('.pot-withdraw-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.Vaulty.Modals?.SavingsGoal?.openTransferDlg(btn.dataset.potId, 'withdraw');
      });
    });
  }

  function render() {
    window.Vaulty.Cards?.renderAssetsKpis?.();
    window.Vaulty.Cards?.renderWalletList?.();
    window.Vaulty.Cards?.renderAccountInspector?.();
    renderSavingsGoals();
  }

  function init() {
    // Note: Action buttons (openAddAccountBtn, openTransferModalBtn, openQuickTxFromAssetsBtn, openAddSavingsGoalBtn)
    // are delegated centrally in core/events.js to avoid duplicate execution.

    State.on('accounts:changed', render);
    State.on('transactions:changed', render);
    State.on('savings:changed', render);
  }

  const AssetsView = {
    init,
    render,
    renderSavingsGoals,
  };

  window.Vaulty = window.Vaulty || {};
  window.Vaulty.Views = window.Vaulty.Views || {};
  window.Vaulty.Views.Assets = AssetsView;
})();
