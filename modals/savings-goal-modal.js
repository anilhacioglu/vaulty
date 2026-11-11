/**
 * Vaulty - Savings Goals & Pots Modal Logic (Birikim Hedefleri & Kumbaralar)
 * modals/savings-goal-modal.js
 */

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  const State = window.Vaulty?.State;
  const Modal = window.Vaulty?.ModalBase || window.Vaulty?.Modal;

  const ICONS = [
    { key: 'shield', label: '🛡️ Güvenlik / Fon' },
    { key: 'laptop', label: '💻 Teknoloji' },
    { key: 'plane', label: '✈️ Tatil / Seyahat' },
    { key: 'car', label: '🚗 Araç / Ulaşım' },
    { key: 'home', label: '🏠 Ev / Yaşam' },
    { key: 'gift', label: '🎁 Hediye / Özel' },
  ];

  const COLORS = [
    { key: '#10B981', label: 'Zümrüt Yeşili' },
    { key: '#3B82F6', label: 'Klasik Mavi' },
    { key: '#8B5CF6', label: 'Asil Mor' },
    { key: '#F59E0B', label: 'Kehribar Sarısı' },
    { key: '#EC4899', label: 'Gül Pembesi' },
    { key: '#06B6D4', label: 'Turkuaz' },
  ];

  let deleteConfirmTimeout = null;

  function resetDeleteGoalBtn() {
    if (deleteConfirmTimeout) {
      clearTimeout(deleteConfirmTimeout);
      deleteConfirmTimeout = null;
    }
    const btn = $('#deleteSavingsGoalBtn');
    if (!btn) return;
    btn.dataset.confirming = 'false';
    btn.classList.remove('is-confirming');
    btn.style.background = 'transparent';
    btn.style.color = '#EF4444';
    btn.style.borderColor = 'rgba(239,68,68,0.2)';
    btn.style.fontWeight = '500';
    btn.style.boxShadow = 'none';
    btn.innerHTML = 'Hedefi Sil';
  }

  function setDeleteGoalBtnConfirming() {
    const btn = $('#deleteSavingsGoalBtn');
    if (!btn) return;
    btn.dataset.confirming = 'true';
    btn.classList.add('is-confirming');
    btn.style.background = '#DC2626';
    btn.style.color = '#FFFFFF';
    btn.style.borderColor = '#DC2626';
    btn.style.fontWeight = '600';
    btn.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.35)';
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:-2px;margin-right:5px;display:inline-block;" aria-hidden="true">
        <path d="M12 9v4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
      </svg>Silmeyi Onayla
    `;
    deleteConfirmTimeout = setTimeout(() => {
      resetDeleteGoalBtn();
    }, 4500);
  }

  // 1. Kumbara Tanımlama Modalı Montajı
  if (Modal?.mountModal) {
    Modal.mountModal('savingsGoalModalDlg', `
<!-- =====================================================================
     MODAL: "BİRİKİM HEDEFİ TANIMLAMA & DÜZENLEME" (#savingsGoalModalDlg)
     ===================================================================== -->
<div id="savingsGoalModalDlg" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="savingsGoalModalTitle" hidden style="display: none !important; pointer-events: none !important;">
  <div class="modal-box modal-box--savings" style="max-width: 500px;">
    <form id="savingsGoalModalForm" class="modal-form" novalidate autocomplete="off">
      <input type="hidden" id="savingsGoalIdInput" value="">
      <header class="cd-modal-header">
        <div class="cd-modal-titles">
          <div class="cd-header-badge" style="background:var(--tint-green);color:var(--ink-green);">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h.5A2.5 2.5 0 0 0 23 9.5c0-1.4-1.1-2.5-2.5-2.5H20a2.7 2.7 0 0 0-1-2z"/>
              <circle cx="17.5" cy="9.5" r="1"/>
            </svg>
            <span>Birikim &amp; Hedef Kasası</span>
          </div>
          <h3 class="modal-box__title" id="savingsGoalModalTitle">Yeni Birikim Hedefi</h3>
          <p class="modal-box__sub">Gelecek planlarınız için sanal kumbara oluşturun ve hedefinizi takip edin</p>
        </div>
        <button type="button" class="modal-close-btn" id="closeSavingsGoalModalIcon" data-action="close-modal" aria-label="Kapat" title="Kapat">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </header>

      <div class="modal-stack" style="padding: 20px 24px; display: flex; flex-direction: column; gap: 16px;">
        <div class="m-field">
          <label class="m-field__label" for="savingsGoalNameInput">Hedef / Kumbara Adı</label>
          <input
            type="text"
            id="savingsGoalNameInput"
            class="m-input"
            placeholder="Örn: Acil Durum Fonu, Yeni Laptop, Yaz Tatili"
            required
            autocomplete="off"
          >
        </div>

        <div class="m-field">
          <label class="m-field__label" for="savingsGoalTargetInput">Hedeflenen Tutar (₺)</label>
          <div class="td-amount-input-box">
            <input
              type="text"
              inputmode="decimal"
              id="savingsGoalTargetInput"
              class="td-amount-input mono"
              placeholder="0,00"
              style="font-size: 22px; font-weight: 800;"
              required
              autocomplete="off"
            >
            <span class="td-currency-symbol">₺</span>
          </div>
          <div class="td-quick-chips" style="display:flex; gap:8px; margin-top:8px;">
            <button type="button" class="td-chip" data-goal-amt="10000">+10.000 ₺</button>
            <button type="button" class="td-chip" data-goal-amt="25000">+25.000 ₺</button>
            <button type="button" class="td-chip" data-goal-amt="50000">+50.000 ₺</button>
            <button type="button" class="td-chip" data-goal-amt="100000">+100.000 ₺</button>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
          <div class="m-field">
            <label class="m-field__label" for="savingsGoalCurrentInput">Mevcut Birikim (₺)</label>
            <input
              type="text"
              inputmode="decimal"
              id="savingsGoalCurrentInput"
              class="m-input mono"
              placeholder="0,00"
              autocomplete="off"
            >
          </div>

          <div class="m-field">
            <label class="m-field__label" for="savingsGoalDateInput">Hedef Tarih</label>
            <input
              type="date"
              id="savingsGoalDateInput"
              class="m-input mono"
              required
            >
          </div>
        </div>

        <div class="m-field">
          <label class="m-field__label">İkon ve Vurgu Rengi</label>
          <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-top:4px;">
            <select id="savingsGoalIconSelect" class="m-input" style="flex:1; min-width:140px;">
              ${ICONS.map((ic) => `<option value="${ic.key}">${ic.label}</option>`).join('')}
            </select>
            <div id="savingsGoalColorPicker" style="display:flex; gap:8px; align-items:center;">
              ${COLORS.map((c, i) => `
                <label style="cursor:pointer; display:flex; align-items:center;">
                  <input type="radio" name="goalColorRadio" value="${c.key}" ${i === 0 ? 'checked' : ''} style="display:none;">
                  <span class="color-dot" data-color="${c.key}" style="width:24px; height:24px; border-radius:50%; background:${c.key}; display:inline-block; border:2px solid ${i === 0 ? '#0F172A' : 'transparent'}; transition:transform 0.15s ease;"></span>
                </label>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <footer class="modal-box__footer" style="padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); background: var(--bg-subtle);">
        <button type="button" class="btn btn--danger" id="deleteSavingsGoalBtn" style="display:none; color:#EF4444; border:1px solid rgba(239,68,68,0.2); background:transparent; border-radius:8px; padding:8px 14px; cursor:pointer;">Hedefi Sil</button>
        <div style="display: flex; gap: 10px; margin-left: auto;">
          <button type="button" class="btn btn--secondary" id="cancelSavingsGoalBtn" data-action="close-modal">Vazgeç</button>
          <button type="submit" class="btn btn--primary" id="saveSavingsGoalBtn">Hedefi Kaydet</button>
        </div>
      </footer>
    </form>
  </div>
</div>
    `);

    // 2. Kumbara Transfer / Para Ekle-Çek Modalı Montajı
    Modal.mountModal('savingsPotTransferDlg', `
<!-- =====================================================================
     MODAL: "KUMBARA TRANSFER" (#savingsPotTransferDlg)
     ===================================================================== -->
<div id="savingsPotTransferDlg" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="potTransferTitle" hidden style="display: none !important; pointer-events: none !important;">
  <div class="modal-box modal-box--pot-transfer" style="max-width: 440px;">
    <form id="potTransferForm" class="modal-form" novalidate autocomplete="off">
      <input type="hidden" id="potTransferGoalId" value="">
      <input type="hidden" id="potTransferMode" value="deposit">

      <header class="cd-modal-header">
        <div class="cd-modal-titles">
          <div class="cd-header-badge" id="potTransferBadge" style="background:var(--tint-green);color:var(--ink-green);">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="m7 16 5 5 5-5"/><path d="M12 21V3"/><path d="m17 8-5-5-5 5"/>
            </svg>
            <span id="potTransferBadgeText">Kumbaraya Para Ekle</span>
          </div>
          <h3 class="modal-box__title" id="potTransferTitle">Kumbaraya Para Yatır</h3>
          <p class="modal-box__sub" id="potTransferSub">Birikim hedefinize ulaşmak için hesabınızdan aktarım yapın</p>
        </div>
        <button type="button" class="modal-close-btn" id="closePotTransferIcon" data-action="close-modal" aria-label="Kapat" title="Kapat">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </header>

      <div class="modal-stack" style="padding: 20px 24px; display: flex; flex-direction: column; gap: 16px;">
        <div id="potTransferGoalSummary" class="pot-summary-card">
          <div class="pot-summary-row">
            <span class="pot-summary-name" id="potTransferGoalName">Hedef</span>
            <span class="pot-summary-pct mono" id="potTransferGoalPct">0%</span>
          </div>
          <div class="pot-summary-meter">
            <div class="pot-summary-bar" id="potTransferGoalBar" style="width: 0%;"></div>
          </div>
          <div class="pot-summary-row pot-summary-sub">
            <span>Mevcut: <strong class="mono" id="potTransferGoalCurrent" data-privacy-blur>0 ₺</strong></span>
            <span>Hedef: <strong class="mono" id="potTransferGoalTarget" data-privacy-blur>0 ₺</strong></span>
          </div>
        </div>

        <div class="m-field">
          <label class="m-field__label" for="potTransferAccountSelect" id="potTransferAccountLabel">Kaynak Hesap</label>
          <select id="potTransferAccountSelect" class="m-input" required></select>
        </div>

        <div class="m-field">
          <label class="m-field__label" for="potTransferAmountInput">İşlem Tutarı (₺)</label>
          <div class="td-amount-input-box">
            <input
              type="text"
              inputmode="decimal"
              id="potTransferAmountInput"
              class="td-amount-input mono"
              placeholder="0,00"
              style="font-size: 22px; font-weight: 800;"
              required
              autocomplete="off"
            >
            <span class="td-currency-symbol">₺</span>
          </div>

          <div class="td-quick-chips" style="display:flex; gap:8px; margin-top:8px;">
            <button type="button" class="td-chip" data-pot-amt="500">+500 ₺</button>
            <button type="button" class="td-chip" data-pot-amt="1000">+1.000 ₺</button>
            <button type="button" class="td-chip" data-pot-amt="2500">+2.500 ₺</button>
            <button type="button" class="td-chip" data-pot-amt="5000">+5.000 ₺</button>
          </div>
        </div>
      </div>

      <footer class="modal-box__footer" style="padding: 16px 24px; display: flex; justify-content: flex-end; align-items: center; gap: 10px; border-top: 1px solid var(--border); background: var(--bg-subtle);">
        <button type="button" class="btn btn--secondary" id="cancelPotTransferBtn" data-action="close-modal">Vazgeç</button>
        <button type="submit" class="btn btn--primary" id="submitPotTransferBtn">Aktarımı Onayla</button>
      </footer>
    </form>
  </div>
</div>
    `);
  }

  // Renk radyo seçicisi görsel güncelleme
  function bindColorPicker() {
    const radios = $$('input[name="goalColorRadio"]');
    radios.forEach((r) => {
      r.addEventListener('change', () => {
        $$('#savingsGoalColorPicker .color-dot').forEach((dot) => {
          dot.style.border = dot.dataset.color === r.value ? '2px solid #0F172A' : '2px solid transparent';
          dot.style.transform = dot.dataset.color === r.value ? 'scale(1.15)' : 'scale(1)';
        });
      });
    });
  }

  // 1. Goal Creation / Edit Dialog
  function openGoalModal(goalId = null) {
    const dlg = $('#savingsGoalModalDlg');
    if (!dlg) return;

    const State = window.Vaulty?.State;
    const titleEl = $('#savingsGoalModalTitle');
    const idInput = $('#savingsGoalIdInput');
    const nameInput = $('#savingsGoalNameInput');
    const targetInput = $('#savingsGoalTargetInput');
    const curInput = $('#savingsGoalCurrentInput');
    const dateInput = $('#savingsGoalDateInput');
    const iconSelect = $('#savingsGoalIconSelect');
    const delBtn = $('#deleteSavingsGoalBtn');

    bindColorPicker();
    resetDeleteGoalBtn();

    if (goalId) {
      const goal = (State?.savingsGoals || []).find((g) => g.id === goalId);
      if (goal) {
        if (titleEl) titleEl.textContent = 'Birikim Hedefini Düzenle';
        if (idInput) idInput.value = goal.id;
        if (nameInput) nameInput.value = goal.name;
        if (targetInput) targetInput.value = State ? State.tryFmt(goal.targetAmount).replace(' ₺', '').trim() : goal.targetAmount;
        if (curInput) curInput.value = State ? State.tryFmt(goal.currentAmount).replace(' ₺', '').trim() : goal.currentAmount;
        if (dateInput) dateInput.value = goal.targetDate || '';
        if (iconSelect) iconSelect.value = goal.icon || 'shield';
        if (delBtn) delBtn.style.display = 'inline-block';

        const colorRadio = $(`input[name="goalColorRadio"][value="${goal.color}"]`);
        if (colorRadio) {
          colorRadio.checked = true;
          colorRadio.dispatchEvent(new Event('change'));
        }
      }
    } else {
      if (titleEl) titleEl.textContent = 'Yeni Birikim Hedefi';
      if (idInput) idInput.value = '';
      if (nameInput) nameInput.value = '';
      if (targetInput) targetInput.value = '';
      if (curInput) curInput.value = '';
      if (dateInput) {
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        dateInput.value = nextYear.toISOString().slice(0, 10);
      }
      if (iconSelect) iconSelect.value = 'shield';
      if (delBtn) delBtn.style.display = 'none';

      const firstRadio = $('input[name="goalColorRadio"]');
      if (firstRadio) {
        firstRadio.checked = true;
        firstRadio.dispatchEvent(new Event('change'));
      }
    }

    const ModalBase = window.Vaulty?.ModalBase || window.Vaulty?.Modal;
    if (ModalBase?.openModal) {
      ModalBase.openModal(dlg);
    } else {
      dlg.hidden = false;
      dlg.removeAttribute('hidden');
      dlg.style.display = 'flex';
    }
  }

  // 2. Transfer Modal (Para Ekle / Çek)
  function openTransferDlg(goalId, mode = 'deposit') {
    const dlg = $('#savingsPotTransferDlg');
    if (!dlg) return;

    const State = window.Vaulty?.State;
    const goal = (State?.savingsGoals || []).find((g) => g.id === goalId);
    if (!goal) return;

    $('#potTransferGoalId').value = goal.id;
    $('#potTransferMode').value = mode;

    const badgeEl = $('#potTransferBadge');
    const badgeTextEl = $('#potTransferBadgeText');
    const titleEl = $('#potTransferTitle');
    const subEl = $('#potTransferSub');
    const accLabelEl = $('#potTransferAccountLabel');
    const submitBtn = $('#submitPotTransferBtn');

    const cleanName = (goal.name || 'Hedef').replace(/\s*kumbaras[ıi]\b/gi, '').trim() || goal.name;
    const curAmt = Number(goal.currentAmount || 0);
    const tgtAmt = Number(goal.targetAmount || 1);
    const pct = Math.min(100, Math.round((curAmt / Math.max(1, tgtAmt)) * 100));

    $('#potTransferGoalName').textContent = goal.name;
    const pctEl = $('#potTransferGoalPct');
    if (pctEl) pctEl.textContent = `%${pct}`;
    const barEl = $('#potTransferGoalBar');
    if (barEl) barEl.style.width = `${pct}%`;
    const curEl = $('#potTransferGoalCurrent');
    if (curEl) curEl.textContent = State.tryFmt(curAmt);
    const tgtEl = $('#potTransferGoalTarget');
    if (tgtEl) tgtEl.textContent = State.tryFmt(tgtAmt);

    const accSelect = $('#potTransferAccountSelect');
    if (accSelect) {
      const eligibleAccounts = (State?.accounts || []).filter((a) => a && (a.type === 'checking' || a.type === 'cash' || a.type === 'credit'));
      accSelect.innerHTML = eligibleAccounts
        .map((a) => {
          const balText = a.type === 'credit' ? `Kullanılan: ${State.tryFmt(a.debt || 0)}` : `Bakiye: ${State.tryFmt(a.balance || 0)}`;
          return `<option value="${a.id}">${State.esc(a.nickname)} (${State.esc(a.institution)}) — ${balText}</option>`;
        })
        .join('');
    }

    const amtInput = $('#potTransferAmountInput');
    if (amtInput) amtInput.value = '';

    if (mode === 'deposit') {
      badgeEl.style.background = '#ECFDF5';
      badgeEl.style.color = '#059669';
      badgeTextEl.textContent = 'Kumbaraya Para Ekle';
      titleEl.textContent = `"${cleanName}" Kumbarasına Yatır`;
      subEl.textContent = 'Seçtiğiniz varlık hesabından kumbaraya para ayırın';
      accLabelEl.textContent = 'Paranın Çıkacağı Kaynak Hesap';
      submitBtn.textContent = 'Kumbaraya Yatır';
      submitBtn.style.background = '#059669';
      if (barEl) barEl.style.background = 'linear-gradient(90deg, #10B981, #059669)';
      if (pctEl) {
        pctEl.style.color = '#059669';
        pctEl.style.background = '#ECFDF5';
        pctEl.style.borderColor = '#A7F3D0';
      }
    } else {
      badgeEl.style.background = '#EFF6FF';
      badgeEl.style.color = '#2563EB';
      badgeTextEl.textContent = 'Kumbaradan Para Çek';
      titleEl.textContent = `"${cleanName}" Kumbarasından Çek`;
      subEl.textContent = 'Kumbaradaki birikimden hesabınıza para geri aktarın';
      accLabelEl.textContent = 'Paranın Geçeceği Hedef Hesap';
      submitBtn.textContent = 'Hesaba Aktar';
      submitBtn.style.background = '#2563EB';
      if (barEl) barEl.style.background = 'linear-gradient(90deg, #3B82F6, #2563EB)';
      if (pctEl) {
        pctEl.style.color = '#2563EB';
        pctEl.style.background = '#EFF6FF';
        pctEl.style.borderColor = '#BFDBFE';
      }
    }

    const ModalBase = window.Vaulty?.ModalBase || window.Vaulty?.Modal;
    if (ModalBase?.openModal) {
      ModalBase.openModal(dlg);
    } else {
      dlg.hidden = false;
      dlg.removeAttribute('hidden');
      dlg.style.display = 'flex';
    }
  }

  function initListeners() {
    // Quick chips for Goal target amount
    $$('[data-goal-amt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const amt = btn.dataset.goalAmt;
        const input = $('#savingsGoalTargetInput');
        if (input) input.value = State.tryFmt(Number(amt));
      });
    });

    // Quick chips for Transfer amount
    $$('[data-pot-amt]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const amt = btn.dataset.potAmt;
        const input = $('#potTransferAmountInput');
        if (input) input.value = State.tryFmt(Number(amt));
      });
    });

    // Save Goal Form
    $('#savingsGoalModalForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = $('#savingsGoalIdInput')?.value || null;
      const name = $('#savingsGoalNameInput')?.value.trim();
      const targetAmount = State.parseMoney($('#savingsGoalTargetInput')?.value || 0);
      const currentAmount = State.parseMoney($('#savingsGoalCurrentInput')?.value || 0);
      const targetDate = $('#savingsGoalDateInput')?.value || '';
      const icon = $('#savingsGoalIconSelect')?.value || 'shield';
      const colorRadio = $('input[name="goalColorRadio"]:checked');
      const color = colorRadio ? colorRadio.value : '#10B981';

      if (!name) {
        State.showToast('Lütfen kumbara adı girin.');
        return;
      }
      if (targetAmount <= 0) {
        State.showToast('Lütfen geçerli bir hedef tutar belirleyin.');
        return;
      }

      State.setSavingsGoal({
        id,
        name,
        targetAmount,
        currentAmount,
        targetDate,
        color,
        icon,
      });

      State.showToast(`"${name}" kumbarası başarıyla kaydedildi.`);
      const ModalBase = window.Vaulty?.ModalBase || window.Vaulty?.Modal;
      if (ModalBase?.closeModal) {
        ModalBase.closeModal($('#savingsGoalModalDlg'));
      } else {
        $('#savingsGoalModalDlg').style.display = 'none';
        $('#savingsGoalModalDlg').hidden = true;
      }
    });

    // Cancel / Close buttons reset delete state
    $('#cancelSavingsGoalBtn')?.addEventListener('click', resetDeleteGoalBtn);
    $('#closeSavingsGoalModalIcon')?.addEventListener('click', resetDeleteGoalBtn);

    // Delete Goal (İki Aşamalı Güvenli Silme Butonu)
    $('#deleteSavingsGoalBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      const id = $('#savingsGoalIdInput')?.value;
      if (!id) return;
      const btn = $('#deleteSavingsGoalBtn');

      if (btn.dataset.confirming !== 'true') {
        // 1. Tıklama: Butonu kırmızı onay durumuna dönüştür ("Silmeyi Onayla")
        setDeleteGoalBtnConfirming();
        return;
      }

      // 2. Tıklama: Onaylandı, hedefi sil
      resetDeleteGoalBtn();
      State.deleteSavingsGoal(id);
      State.showToast('Birikim hedefi ve kumbarası silindi.');
      const ModalBase = window.Vaulty?.ModalBase || window.Vaulty?.Modal;
      if (ModalBase?.closeModal) {
        ModalBase.closeModal($('#savingsGoalModalDlg'));
      } else {
        $('#savingsGoalModalDlg').style.display = 'none';
        $('#savingsGoalModalDlg').hidden = true;
      }
    });

    // Submit Pot Transfer
    $('#potTransferForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const goalId = $('#potTransferGoalId')?.value;
      const mode = $('#potTransferMode')?.value;
      const accountId = $('#potTransferAccountSelect')?.value;
      const amount = State.parseMoney($('#potTransferAmountInput')?.value || 0);

      if (!goalId || !accountId) {
        State.showToast('Lütfen hesap ve hedefi kontrol edin.');
        return;
      }
      if (amount <= 0) {
        State.showToast('Lütfen geçerli bir tutar girin.');
        return;
      }

      let res;
      if (mode === 'deposit') {
        res = State.depositToSavingsGoal(goalId, amount, accountId);
      } else {
        res = State.withdrawFromSavingsGoal(goalId, amount, accountId);
      }

      if (res && res.ok) {
        const ModalBase = window.Vaulty?.ModalBase || window.Vaulty?.Modal;
        if (ModalBase?.closeModal) {
          ModalBase.closeModal($('#savingsPotTransferDlg'));
        } else {
          $('#savingsPotTransferDlg').style.display = 'none';
          $('#savingsPotTransferDlg').hidden = true;
        }
      } else if (res && res.msg) {
        State.showToast(res.msg);
      }
    });
  }

  // Otomatik Başlat
  initListeners();

  const SavingsGoalModal = {
    openGoalModal,
    openTransferDlg,
  };

  window.Vaulty = window.Vaulty || {};
  window.Vaulty.Modals = window.Vaulty.Modals || {};
  window.Vaulty.Modals.SavingsGoal = SavingsGoalModal;
})();

