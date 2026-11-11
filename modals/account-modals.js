/**
 * Vaulty - Account & Settings Modals Logic
 * modals/account-modals.js
 *
 * Encapsulates:
 * 1. Add / Edit Account & Card Modal (#addAccountDlg, #addAccountForm)
 * 2. Quick Balance Update Modal (#updateBalanceDlg, #updateBalanceForm)
 * 3. New Debt / Receivable Item Modal (#newLedgerDlg, #newLedgerForm)
 * 4. Profile & Vault Settings Modal (#settingsDlg)
 */

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  const ModalBase = window.Vaulty?.ModalBase;
  if (ModalBase?.mountModal) {
    ModalBase.mountModal('addAccountDlg', `
<!-- =====================================================================
     MODAL 1: "+ YENİ HESAP / KART EKLE" (520px Küresel Overlay Modal)
     ===================================================================== -->
<div id="addAccountDlg" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="accountModalTitle" hidden style="display: none !important; pointer-events: none !important;">
  <div class="modal-box">
    <form id="addAccountForm" class="modal-form" novalidate autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
      <header class="modal-box__header">
        <div class="modal-box__titles">
          <h3 class="modal-box__title" id="accountModalTitle">Yeni Hesap veya Kart Ekle</h3>
          <p class="modal-box__sub" id="accountModalSub">Finansal kasanıza yeni bir varlık tanımlayın</p>
        </div>
        <button type="button" class="modal-close-btn" id="closeAddAccountIcon" data-action="close-modal" aria-label="Kapat" title="Kapat">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </header>

      <div class="modal-box__body">
        <input type="hidden" name="editId" id="accountEditId" value="">

        <!-- 1. Hesap Türü Seçici (3 Sütunlu Eşit Grid) -->
        <div class="acct-type-group" role="radiogroup" aria-label="Hesap Türü Seçimi">
          <button type="button" class="acct-type-card is-selected" data-acct-type="checking" role="radio" aria-checked="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>
            </svg>
            <span>Vadesiz Banka Hesabı</span>
          </button>
          <button type="button" class="acct-type-card" data-acct-type="credit" role="radio" aria-checked="false">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <path d="M2 10h20M6 15h4"/>
            </svg>
            <span>Kredi Kartı</span>
          </button>
          <button type="button" class="acct-type-card" data-acct-type="cash" role="radio" aria-checked="false">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="2" y="6" width="20" height="12" rx="2"/>
              <circle cx="12" cy="12" r="2.5"/>
              <path d="M6 12h.01M18 12h.01"/>
            </svg>
            <span>Nakit Kasa</span>
          </button>
        </div>

        <!-- 2. Tam Genişlikli İsim & Kurum Alanları (44px yükseklik, 10px radius, #CBD5E1 kenarlık) -->
        <div class="modal-stack">
          <label class="m-field">
            <span class="m-field__label">Hesap / Kart Takma Adı</span>
            <input name="nickname" id="acctNickname" type="text" class="m-input" placeholder="Örn: Günlük Harcama Kartım" required autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
          </label>

          <label class="m-field">
            <span class="m-field__label">Banka / Kurum Seçimi</span>
            <select name="institution" id="acctInstitution" class="m-input">
              <option value="Garanti BBVA">Garanti BBVA</option>
              <option value="İş Bankası">İş Bankası</option>
              <option value="Yapı Kredi">Yapı Kredi</option>
              <option value="Akbank">Akbank</option>
              <option value="Enpara">Enpara</option>
              <option value="QNB">QNB</option>
              <option value="Ziraat">Ziraat</option>
              <option value="Nakit Cüzdan">Nakit Cüzdan</option>
            </select>
          </label>

          <label class="m-field">
            <span class="m-field__label">Hesap / Kart No veya IBAN (İsteğe Bağlı)</span>
            <input name="customNumber" id="acctCustomNumber" type="text" class="m-input mono" placeholder="Örn: TR56 •••• 6110 veya •••• 6110" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
          </label>

          <!-- 3. Renk Paleti: "Kart Teması / Rengi" (6 Mat Renk Noktası, 28px çap, 12px boşluk) -->
          <div class="m-field">
            <span class="m-field__label">Kart Teması / Rengi</span>
            <div class="accent-dots" id="accentDots" role="radiogroup" aria-label="Kart Teması / Rengi">
              <button type="button" class="accent-dot is-selected" data-accent="navy" style="--dot:#1E3A8A" title="Lacivert" aria-label="Lacivert" aria-checked="true"></button>
              <button type="button" class="accent-dot" data-accent="emerald" style="--dot:#065F46" title="Zümrüt" aria-label="Zümrüt" aria-checked="false"></button>
              <button type="button" class="accent-dot" data-accent="charcoal" style="--dot:#1E293B" title="Antrasit" aria-label="Antrasit" aria-checked="false"></button>
              <button type="button" class="accent-dot" data-accent="purple" style="--dot:#4C1D95" title="Mor" aria-label="Mor" aria-checked="false"></button>
              <button type="button" class="accent-dot" data-accent="amber" style="--dot:#92400E" title="Kehribar" aria-label="Kehribar" aria-checked="false"></button>
              <button type="button" class="accent-dot" data-accent="slate" style="--dot:#334155" title="Arduvaz" aria-label="Arduvaz" aria-checked="false"></button>
            </div>
          </div>

          <!-- 4A. Dinamik Finansal Alanlar: Vadesiz Banka / Nakit Kasa -->
          <div class="dynamic-group" id="liquidFieldsGroup">
            <label class="m-field">
              <span class="m-field__label">Başlangıç Bakiyesi (₺)</span>
              <input name="balance" id="acctBalance" type="text" inputmode="decimal" placeholder="0,00" class="m-input mono" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
            </label>
          </div>

          <!-- 4B. Dinamik Finansal Alanlar: Kredi Kartı (Satır 1: 2 Sütun %50/%50 | Satır 2: Kesim Günü + Yardımcı Metin) -->
          <div class="dynamic-group credit-fields-stack" id="creditFieldsGroup" hidden>
            <div class="m-grid-2">
              <label class="m-field">
                <span class="m-field__label">Toplam Limit (₺)</span>
                <input name="limit" id="acctLimit" type="text" inputmode="decimal" placeholder="120.000,00" class="m-input mono" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
              </label>
              <label class="m-field">
                <span class="m-field__label">Mevcut Borç Tutarı (₺)</span>
                <input name="debt" id="acctDebt" type="text" inputmode="decimal" placeholder="36.000,00" class="m-input mono" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
              </label>
            </div>

            <div class="m-field">
              <label class="m-field" for="acctCutoff">
                <span class="m-field__label">Hesap Kesim Günü (1-31)</span>
              </label>
              <div class="cutoff-row">
                <input name="cutoffDay" id="acctCutoff" type="number" min="1" max="31" placeholder="15" class="m-input mono cutoff-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
                <span class="m-helper">Her ay ekstrenizin kesildiği gün (Son ödeme tarihi otomatik +10 gün olarak atanır).</span>
              </div>
            </div>
          </div>
        </div>

        <p class="form-error" id="acctFormError" role="alert" hidden></p>
      </div>

      <footer class="modal-box__footer">
        <button type="button" class="btn btn--ghost" id="cancelAddAccountBtn" data-action="close-modal">Vazgeç</button>
        <button type="submit" class="btn btn--primary" id="submitAddAccountBtn">Hesabı Oluştur</button>
      </footer>
    </form>
  </div>
</div>
`);
    ModalBase.mountModal('updateBalanceDlg', `
<!-- =====================================================================
     MODAL 3: HIZLI BAKİYE GÜNCELLEME MODALI
     ===================================================================== -->
<div id="updateBalanceDlg" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="updateBalTitle" hidden style="display: none !important; pointer-events: none !important;">
  <div class="modal-box modal-box--sm">
    <form id="updateBalanceForm" class="modal-form" novalidate autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
      <header class="modal-box__header">
        <div class="modal-box__titles">
          <h3 class="modal-box__title" id="updateBalTitle">Bakiye Güncelle</h3>
          <p class="modal-box__sub">Hesap bakiyesini veya güncel kart borcunu doğrudan düzenleyin</p>
        </div>
        <button type="button" class="modal-close-btn" id="closeUpdateBalIcon" aria-label="Kapat">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </header>
      <div class="modal-box__body">
        <label class="m-field">
          <span class="m-field__label" id="updateBalLabel">Yeni Bakiye Tutarı (₺)</span>
          <input id="updateBalInput" name="upd_bal_val" type="text" inputmode="decimal" placeholder="0,00" class="m-input mono" required autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
        </label>
      </div>
      <footer class="modal-box__footer">
        <button type="button" class="btn btn--ghost" id="cancelUpdateBalBtn">Vazgeç</button>
        <button type="submit" class="btn btn--primary">Güncelle</button>
      </footer>
    </form>
  </div>
</div>
`);
    ModalBase.mountModal('newLedgerDlg', `
<!-- =====================================================================
     MODAL 4: "+ YENİ KAYIT EKLE" (Borç/Alacak Defteri Modalı)
     ===================================================================== -->
<div id="newLedgerDlg" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="newLedgerTitle" hidden style="display: none !important; pointer-events: none !important;">
  <div class="modal-box">
    <form id="newLedgerForm" class="modal-form" novalidate autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
      <input type="hidden" name="ledgerId" id="newLedgerEditId" value="">
      <header class="modal-box__header">
        <div class="modal-box__titles">
          <h3 class="modal-box__title" id="newLedgerTitle">Yeni Alacak / Borç Kaydı</h3>
          <p class="modal-box__sub" id="newLedgerSub">Kısmi ödeme takipli yeni bir alacak veya yükümlülük ekleyin</p>
        </div>
        <button type="button" class="modal-close-btn" id="closeNewLedgerIcon" data-action="close-modal" aria-label="Kapat">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </header>

      <div class="modal-box__body">
        <div class="modal-stack">
          <label class="m-field">
            <span class="m-field__label">Kayıt Türü</span>
            <select name="kind" id="newLedgerKind" class="m-input">
              <option value="receivable">Alacak (Bana Ödenecek)</option>
              <option value="payable">Borç (Benim Ödeyeceğim)</option>
            </select>
          </label>
          <label class="m-field">
            <span class="m-field__label">Kişi veya Kurum Adı</span>
            <input name="party" class="m-input" placeholder="Örn: Ahmet Yılmaz, Garanti BBVA…" required autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
          </label>
          <div class="m-grid-2">
            <label class="m-field">
              <span class="m-field__label">Toplam Tutar (₺)</span>
              <input name="total" type="text" inputmode="decimal" placeholder="10.000,00" class="m-input mono" required autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
            </label>
            <label class="m-field" id="newLedgerInitialPaidWrap">
              <span class="m-field__label">Başlangıçta Ödenen (₺)</span>
              <input name="initialPaid" type="text" inputmode="decimal" value="0" placeholder="0,00" class="m-input mono" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
            </label>
          </div>
          <div class="m-grid-2">
            <label class="m-field">
              <span class="m-field__label">Kategori / Açıklama</span>
              <input name="category" class="m-input" placeholder="Örn: Elden Borç, Fatura #108" required autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
            </label>
            <label class="m-field">
              <span class="m-field__label">Vade Tarihi</span>
              <input name="dueDate" type="date" class="m-input mono" required autocomplete="off">
            </label>
          </div>
        </div>
      </div>

      <footer class="modal-box__footer">
        <button type="button" class="btn btn--ghost" id="cancelNewLedgerBtn" data-action="close-modal">Vazgeç</button>
        <button type="submit" class="btn btn--primary" id="submitNewLedgerBtn">Kaydı Oluştur</button>
      </footer>
    </form>
  </div>
</div>
`);
    ModalBase.mountModal('confirmDeleteDebtDlg', `
<!-- =====================================================================
     MODAL: BORÇ / ALACAK KAYDI SİLME ONAYI (Kompakt Güvenli Onay Penceresi)
     ===================================================================== -->
<div id="confirmDeleteDebtDlg" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirmDeleteDebtTitle" hidden style="display: none !important; pointer-events: none !important;">
  <div class="modal-box modal-box--sm">
    <header class="modal-box__header">
      <div class="modal-box__titles">
        <h3 class="modal-box__title" id="confirmDeleteDebtTitle" style="color: var(--ink-red); display: flex; align-items: center; gap: 8px;">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 9v4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
          </svg>
          Kaydı Silmek İstiyor Musunuz?
        </h3>
        <p class="modal-box__sub">Bu işlem geri alınamaz ve bu kayda ait tüm ödeme geçmişi silinir.</p>
      </div>
      <button type="button" class="modal-close-btn" id="closeConfirmDeleteDebtIcon" data-action="close-modal" aria-label="Kapat">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </header>

    <div class="modal-box__body">
      <div class="del-confirm-card" style="background:var(--tint-red);border:1px solid #FEE2E2;border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:8px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 13px; color: var(--text-secondary);">Kişi / Kurum:</span>
          <strong id="delDebtParty" style="font-size: 15px; color: var(--text-primary);">—</strong>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 13px; color: var(--text-secondary);">Kalan Bakiye:</span>
          <strong id="delDebtRemaining" class="mono" style="font-size: 16px; color: var(--ink-red);">—</strong>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-size: 12px; color: var(--text-secondary);">Kayıt Türü:</span>
          <span id="delDebtKindBadge" class="sd-kind-badge sd-kind-badge--pay">—</span>
        </div>
      </div>
      <p style="font-size: 12.5px; color: var(--text-secondary); margin-top: 14px; line-height: 1.45;">
        Bu kaydı sildiğinizde, kasa defterinizden tamamen kaldırılacak ve hesap özetleriniz otomatik olarak yeniden hesaplanacaktır.
      </p>
    </div>

    <footer class="modal-box__footer" style="display: flex; justify-content: flex-end; gap: 10px;">
      <button type="button" class="btn btn--ghost" id="cancelDeleteDebtBtn" data-action="close-modal">Vazgeç</button>
      <button type="button" class="btn" id="confirmDeleteDebtBtn" style="background-color: #DC2626; color: #FFFFFF; font-weight: 600; border: none; box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);">
        Kaydı Sil
      </button>
    </footer>
  </div>
</div>
`);
    ModalBase.mountModal('settingsDlg', `
<!-- =====================================================================
     MODAL 5: KASA AYARLARI & PROFİL YÖNETİM MERKEZİ (v1.5.0 Modern Hub)
     ===================================================================== -->
<div id="settingsDlg" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="settingsModalTitle" hidden style="display: none !important; pointer-events: none !important;">
  <div class="modal-box modal-box--settings modal-box--profile">
    <div class="modal-form">
      <!-- HEADER -->
      <header class="modal-box__header settings-header">
        <div class="modal-box__titles">
          <div class="settings-title-row">
            <h3 class="modal-box__title" id="settingsModalTitle">Kasa &amp; Uygulama Ayarları</h3>
            <span class="settings-enc-badge mono">Yerel AES-256-GCM</span>
            <span class="settings-ver-badge mono">v1.5.1</span>
          </div>
          <p class="modal-box__sub">Profilinizi, kasa güvenliğinizi, veri yedeklemenizi ve arayüz tercihlerinizi tek merkezden yönetin</p>
        </div>
        <button type="button" class="modal-close-btn" id="closeSettingsIcon" data-action="close-modal" aria-label="Kapat" title="Kapat">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </header>

      <!-- SEGMENTED TABS NAV -->
      <nav class="settings-tab-nav" aria-label="Ayar Kategorileri">
        <button type="button" class="settings-tab-btn is-active" data-settings-tab="profile" id="tabBtnProfile">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>Profilim</span>
        </button>
        <button type="button" class="settings-tab-btn" data-settings-tab="preferences" id="tabBtnPreferences">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>
          </svg>
          <span>Tercihler</span>
        </button>
        <button type="button" class="settings-tab-btn" data-settings-tab="security" id="tabBtnSecurity">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>Kasa Güvenliği</span>
        </button>
        <button type="button" class="settings-tab-btn" data-settings-tab="data" id="tabBtnData">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span>Veri &amp; Yedek</span>
        </button>
      </nav>

      <!-- HIDDEN FILE INPUTS -->
      <input type="file" id="avatarFileInput" accept="image/png,image/jpeg,image/webp" hidden>
      <input type="file" id="restoreBackupFileInput" accept=".json,application/json" hidden>

      <!-- MODAL BODY WITH TAB PANELS -->
      <div class="modal-box__body settings-body scroll">
        
        <!-- ================= TAB 1: PROFİLİM ================= -->
        <div class="settings-tab-pane is-active" id="settingsPaneProfile" data-pane="profile">
          <!-- Profil Hero Kartı -->
          <div class="settings-hero-card">
            <div class="settings-hero-avatar-wrap">
              <button type="button" class="prof-avatar-box" id="settingsAvatarTrigger" aria-label="Profil fotoğrafını değiştir">
                <span class="prof-avatar-box__inner" id="settingsAvatarPreview">
                  <svg viewBox="0 0 72 72" width="72" height="72" fill="none">
                    <rect width="72" height="72" rx="36" fill="#EFF6FF"/>
                    <circle cx="36" cy="28" r="11" fill="#2563EB"/>
                    <path d="M15 62c3.4-11.2 12-16.8 21-16.8s17.6 5.6 21 16.8" fill="#2563EB"/>
                  </svg>
                </span>
                <span class="prof-avatar-overlay" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                    <circle cx="12" cy="13" r="3"/>
                  </svg>
                </span>
              </button>
            </div>
            <div class="settings-hero-meta">
              <div class="settings-hero-header">
                <h4 class="settings-hero-name" id="settingsHeroUsername">Kullanıcı</h4>
                <span class="settings-role-badge">Kasa Yöneticisi</span>
              </div>
              <p class="settings-hero-sub">Yerel Masaüstü Oturumu • Tam Kasa Yetkisi</p>
              <div class="settings-hero-actions">
                <button type="button" class="btn btn--secondary btn--sm" id="uploadAvatarBtn">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>Fotoğraf Yükle</span>
                </button>
                <button type="button" class="btn btn--ghost btn--sm btn--danger-text" id="removeAvatarBtn">Kaldır</button>
                <span class="settings-hint-inline" id="avatarHintText">PNG, JPG veya WebP • Maks. 2 MB</span>
              </div>
            </div>
          </div>

          <!-- Kullanıcı Adı Formu -->
          <div class="settings-card">
            <div class="settings-card__head">
              <div>
                <h5 class="settings-card__title">Görünen İsim / Hitap Adı</h5>
                <p class="settings-card__desc">Kasa oturumunda, sol alt profil kartında ve bildirimlerde kullanılan adınız</p>
              </div>
            </div>
            <form id="profileUsernameForm" class="settings-username-form" novalidate autocomplete="off">
              <div class="settings-input-group">
                <span class="settings-input-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <input id="profileUsernameInput" name="prof_user_name" type="text" class="m-input" value="Usta" maxlength="36" placeholder="Kullanıcı adınızı girin" required autocomplete="off">
              </div>
              <button type="submit" class="btn btn--primary" id="saveUsernameBtn">Değişikliği Kaydet</button>
            </form>
          </div>

          <!-- Cihaz & Kasa Kimliği -->
          <div class="settings-card settings-card--subtle">
            <h5 class="settings-card__title">Sistem &amp; Kasa Özeti</h5>
            <div class="settings-info-grid">
              <div class="settings-info-item">
                <span class="settings-info-label">Çalışma Ortamı</span>
                <span class="settings-info-val">Windows Masaüstü (.NET 9 + WebView2)</span>
              </div>
              <div class="settings-info-item">
                <span class="settings-info-label">Depolama Tipi</span>
                <span class="settings-info-val">Cihaz İçi Şifreli Yerel Kasa</span>
              </div>
              <div class="settings-info-item">
                <span class="settings-info-label">Kasa Versiyonu</span>
                <span class="settings-info-val mono">Vaulty v1.5.1 Production (AES-256-GCM)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ================= TAB 2: UYGULAMA & TERCİHLER ================= -->
        <div class="settings-tab-pane" id="settingsPanePreferences" data-pane="preferences">
          <!-- Tema Seçimi -->
          <div class="settings-card">
            <div class="settings-card__head">
              <div>
                <h5 class="settings-card__title">Arayüz Teması</h5>
                <p class="settings-card__desc">Vaulty masaüstü çalışma alanınızın renk ve kontrast deneyimini belirleyin</p>
              </div>
            </div>
            <div class="settings-theme-grid">
              <button type="button" class="settings-theme-card is-active" data-theme-val="light" id="themeLightCard">
                <div class="settings-theme-preview settings-theme-preview--light">
                  <div class="theme-bar-mockup"></div>
                  <div class="theme-body-mockup">
                    <span class="mock-sidebar"></span>
                    <span class="mock-content"></span>
                  </div>
                </div>
                <div class="settings-theme-info">
                  <span class="settings-theme-title">Açık Tema</span>
                  <span class="settings-theme-sub">Ferah &amp; Klasik Vaulty</span>
                </div>
                <span class="settings-status-badge settings-status-badge--active">Aktif</span>
              </button>

              <button type="button" class="settings-theme-card" data-theme-val="dark" id="themeDarkCard">
                <div class="settings-theme-preview settings-theme-preview--dark">
                  <div class="theme-bar-mockup"></div>
                  <div class="theme-body-mockup">
                    <span class="mock-sidebar"></span>
                    <span class="mock-content"></span>
                  </div>
                </div>
                <div class="settings-theme-info">
                  <span class="settings-theme-title">Karanlık Mod</span>
                  <span class="settings-theme-sub">Gece Göz Yormayan Palet</span>
                </div>
                <span class="settings-status-badge">Pek Yakında (v1.6)</span>
              </button>

              <button type="button" class="settings-theme-card" data-theme-val="system" id="themeSystemCard">
                <div class="settings-theme-preview settings-theme-preview--system">
                  <div class="theme-bar-mockup"></div>
                  <div class="theme-body-mockup">
                    <span class="mock-sidebar"></span>
                    <span class="mock-content"></span>
                  </div>
                </div>
                <div class="settings-theme-info">
                  <span class="settings-theme-title">Sistemle Eşitle</span>
                  <span class="settings-theme-sub">Windows Temasına Uyum</span>
                </div>
                <span class="settings-status-badge">Beta</span>
              </button>
            </div>
          </div>

          <!-- Varsayılan Para Birimi -->
          <div class="settings-card">
            <div class="settings-card__head">
              <div>
                <h5 class="settings-card__title">Ana Para Birimi &amp; Portföy Dövizleri</h5>
                <p class="settings-card__desc">Genel bakiye hesaplamaları ve işlem tutarları için temel para birimi</p>
              </div>
            </div>
            <div class="settings-currency-grid">
              <button type="button" class="settings-currency-card is-active" data-currency-val="TRY">
                <div class="currency-symbol-box">₺</div>
                <div class="currency-details">
                  <span class="currency-name">Türk Lirası</span>
                  <span class="currency-code mono">TRY (₺)</span>
                </div>
                <span class="currency-check">✓</span>
              </button>
              <button type="button" class="settings-currency-card" data-currency-val="USD">
                <div class="currency-symbol-box">$</div>
                <div class="currency-details">
                  <span class="currency-name">Amerikan Doları</span>
                  <span class="currency-code mono">USD ($)</span>
                </div>
                <span class="currency-badge-upcoming">v1.6</span>
              </button>
              <button type="button" class="settings-currency-card" data-currency-val="EUR">
                <div class="currency-symbol-box">€</div>
                <div class="currency-details">
                  <span class="currency-name">Euro</span>
                  <span class="currency-code mono">EUR (€)</span>
                </div>
                <span class="currency-badge-upcoming">v1.6</span>
              </button>
              <button type="button" class="settings-currency-card" data-currency-val="XAU">
                <div class="currency-symbol-box">🪙</div>
                <div class="currency-details">
                  <span class="currency-name">Gram Altın</span>
                  <span class="currency-code mono">XAU (gr)</span>
                </div>
                <span class="currency-badge-upcoming">v1.6</span>
              </button>
            </div>
            <p class="settings-helper-text">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <span>Çoklu döviz ve kıymetli maden portföy entegrasyonu bir sonraki ana sürümde tam desteklenecektir.</span>
            </p>
          </div>

          <!-- Uygulama Dili -->
          <div class="settings-card">
            <div class="settings-card__head">
              <div>
                <h5 class="settings-card__title">Arayüz Dili</h5>
                <p class="settings-card__desc">Uygulama genelinde kullanılacak yerel dil paketi</p>
              </div>
            </div>
            <div class="settings-lang-grid">
              <button type="button" class="settings-lang-card is-active" data-lang-val="tr">
                <span class="lang-flag">🇹🇷</span>
                <div class="lang-meta">
                  <span class="lang-name">Türkçe</span>
                  <span class="lang-native">Varsayılan Sistem Dili</span>
                </div>
                <span class="settings-status-badge settings-status-badge--active">Aktif</span>
              </button>
              <button type="button" class="settings-lang-card" data-lang-val="en">
                <span class="lang-flag">🇬🇧</span>
                <div class="lang-meta">
                  <span class="lang-name">English</span>
                  <span class="lang-native">Global (Coming Soon)</span>
                </div>
                <span class="settings-status-badge">Pek Yakında</span>
              </button>
            </div>
          </div>

          <!-- Başlangıç & Gizlilik Seçenekleri -->
          <div class="settings-card">
            <div class="settings-card__head">
              <div>
                <h5 class="settings-card__title">Başlangıç &amp; Davranış Tercihleri</h5>
                <p class="settings-card__desc">Uygulama açılışında otomatik devreye girecek güvenlik tercihleri</p>
              </div>
            </div>
            <div class="settings-switch-row">
              <div class="settings-switch-info">
                <span class="settings-switch-title">Açılışta Tutarları Gizle (Gizlilik Modu)</span>
                <span class="settings-switch-desc">Uygulama her başlatıldığında bakiyeler, tutarlar ve kart limitleri otomatik olarak sansürlü (••••) başlasın.</span>
              </div>
              <label class="settings-switch" for="prefStartPrivacyToggle">
                <input type="checkbox" id="prefStartPrivacyToggle">
                <span class="settings-switch-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <!-- ================= TAB 3: GÜVENLİK & PIN ================= -->
        <div class="settings-tab-pane" id="settingsPaneSecurity" data-pane="security">
          <!-- Güvenlik Bilgi Kutusu -->
          <div class="settings-security-banner">
            <div class="security-banner-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <div class="security-banner-content">
              <h5 class="security-banner-title">AES-256 Yerel Şifreleme Aktif</h5>
              <p class="security-banner-desc">Kasa şifreniz ve finansal verileriniz cihazınızda güvenli bir şekilde şifrelenir. Asla uzak sunuculara veya üçüncü şahıslara iletilmez.</p>
            </div>
          </div>

          <!-- Şifre Değiştirme Formu -->
          <div class="settings-card">
            <div class="settings-card__head">
              <div>
                <h5 class="settings-card__title">Kasa PIN Kodu Yönetimi</h5>
                <p class="settings-card__desc">Kilit ekranında oturum açmak için kullanılan 6 haneli bankacılık tipi PIN kodunuzu güncelleyin</p>
              </div>
            </div>

            <form id="profilePinForm" class="settings-pin-form" novalidate autocomplete="off">
              <!-- Mevcut PIN -->
              <div class="m-field">
                <div class="pin-field-header">
                  <label for="currentPinInput" class="m-field__label">Mevcut Kasa PIN Kodu</label>
                  <span class="pin-hint-text">Varsayılan: 000000</span>
                </div>
                <div class="pin-input-wrap">
                  <input id="currentPinInput" name="cur_vault_code" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" class="m-input mono pin-input-box" placeholder="••••••" autocomplete="off" required>
                  <button type="button" class="pin-toggle-btn" data-target="currentPinInput" aria-label="PIN göster/gizle" title="Şifreyi Göster/Gizle">
                    <svg class="eye-open" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    <svg class="eye-closed" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="display:none;"><path d="m2 2 20 20M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/></svg>
                  </button>
                </div>
              </div>

              <!-- Yeni PIN -->
              <div class="m-field">
                <div class="pin-field-header">
                  <label for="newPinInput" class="m-field__label">Yeni 6 Haneli PIN</label>
                  <span class="pin-counter-badge" id="newPinCounter">0 / 6 hane</span>
                </div>
                <div class="pin-input-wrap">
                  <input id="newPinInput" name="new_vault_code" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" class="m-input mono pin-input-box" placeholder="Yeni 6 haneli PIN (0-9)" autocomplete="off" required>
                  <button type="button" class="pin-toggle-btn" data-target="newPinInput" aria-label="PIN göster/gizle" title="Şifreyi Göster/Gizle">
                    <svg class="eye-open" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    <svg class="eye-closed" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="display:none;"><path d="m2 2 20 20M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/></svg>
                  </button>
                </div>
              </div>

              <!-- Yeni PIN Tekrar -->
              <div class="m-field">
                <div class="pin-field-header">
                  <label for="confirmPinInput" class="m-field__label">Yeni PIN (Tekrar)</label>
                  <span class="pin-match-badge" id="confirmPinMatchBadge">Eşleşme bekleniyor</span>
                </div>
                <div class="pin-input-wrap">
                  <input id="confirmPinInput" name="cnf_vault_code" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" class="m-input mono pin-input-box" placeholder="Yeni 6 haneli PIN'i tekrar girin" autocomplete="off" required>
                  <button type="button" class="pin-toggle-btn" data-target="confirmPinInput" aria-label="PIN göster/gizle" title="Şifreyi Göster/Gizle">
                    <svg class="eye-open" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    <svg class="eye-closed" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="display:none;"><path d="m2 2 20 20M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/></svg>
                  </button>
                </div>
              </div>

              <p class="prof-feedback" id="pinFormFeedback" role="alert" hidden></p>

              <div class="settings-form-actions">
                <button type="submit" class="btn btn--primary" id="updatePinBtn">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span>PIN Kodunu Güncelle</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Güvenlik İpuçları -->
          <div class="settings-card settings-card--subtle">
            <h5 class="settings-card__title">Önemli Güvenlik Notu</h5>
            <p class="settings-card__desc">
              Vaulty şifrenizi sıfırlayabilecek harici bir bulut servisine bağlı değildir. Şifrenizi unutmanız durumunda verilerinizi kurtarabilmek için "Veri &amp; Yedekleme" sekmesinden düzenli olarak <strong>JSON Yedeği</strong> almanız kritik önem taşır.
            </p>
          </div>
        </div>

        <!-- ================= TAB 4: VERİ & YEDEKLEME ================= -->
        <div class="settings-tab-pane" id="settingsPaneData" data-pane="data">
          <!-- Kasa Veri İstatistikleri Barı -->
          <div class="settings-data-stats">
            <div class="settings-stat-box">
              <span class="settings-stat-num" id="settingsStatAccounts">0</span>
              <span class="settings-stat-lbl">Hesap &amp; Kart</span>
            </div>
            <div class="settings-stat-box">
              <span class="settings-stat-num" id="settingsStatTx">0</span>
              <span class="settings-stat-lbl">Kayıtlı İşlem</span>
            </div>
            <div class="settings-stat-box">
              <span class="settings-stat-num" id="settingsStatDebts">0</span>
              <span class="settings-stat-lbl">Borç &amp; Alacak</span>
            </div>
            <div class="settings-stat-box">
              <span class="settings-stat-num" id="settingsStatGoals">0</span>
              <span class="settings-stat-lbl">Birikim Kumbarası</span>
            </div>
          </div>

          <!-- Yedekleme & Geri Yükleme Kartları -->
          <div class="settings-backup-grid">
            <!-- Kart 1: Yedek Al -->
            <div class="settings-backup-card">
              <div class="settings-backup-icon settings-backup-icon--export">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
              </div>
              <div class="settings-backup-meta">
                <h5 class="settings-backup-title">Kasa Yedeği Al (JSON Dışa Aktar)</h5>
                <p class="settings-backup-desc">Tüm finansal hesaplarınızı, işlem dökümlerinizi, taksitleri ve hedeflerinizi içeren bağımsız bir JSON yedeği indirin.</p>
              </div>
              <button type="button" class="btn btn--secondary settings-backup-btn" id="sectionBackupBtn" data-action="backup-vault">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>Yedek Dosyası İndir</span>
              </button>
            </div>

            <!-- Kart 2: Yedekten Geri Yükle -->
            <div class="settings-backup-card">
              <div class="settings-backup-icon settings-backup-icon--restore">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div class="settings-backup-meta">
                <h5 class="settings-backup-title">Yedekten Geri Yükle (JSON İçe Aktar)</h5>
                <p class="settings-backup-desc">Daha önceden alınmış bir Vaulty JSON yedek dosyasını seçerek kasanızı tek tıkla eski haline geri döndürün.</p>
              </div>
              <button type="button" class="btn btn--primary settings-backup-btn" id="sectionRestoreBtn" data-action="restore-vault">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <span>Yedek Dosyası Seç &amp; Geri Yükle</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- CLEAN FOOTER: NO REDUNDANCIES -->
      <footer class="modal-box__footer settings-footer">
        <div class="settings-footer-left">
          <button type="button" class="btn btn--ghost prof-quick-btn prof-quick-btn--danger" id="settingsLockBtn" data-action="lock-vault">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="4" y="11" width="16" height="10" rx="2"/>
              <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
            </svg>
            <span>Kasayı Kilitle</span>
          </button>
          <span class="settings-footer-tag mono">Vaulty v1.5.1 • Yerel AES-256-GCM</span>
        </div>
        <button type="button" class="btn btn--secondary" id="closeSettingsBtn" data-action="close-modal">Kapat</button>
      </footer>
    </div>
  </div>
</div>
`);
  }

  function getState() {
    return window.Vaulty?.State;
  }

  function round2(num) {
    return getState() ? getState().round2(num) : Math.round((Number(num) || 0) * 100) / 100;
  }

  function parseMoney(val) {
    return getState() ? getState().parseMoney(val) : parseFloat(val) || 0;
  }

  function tryFmt(num) {
    return getState() ? getState().tryFmt(num) : `${Number(num || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
  }

  function esc(s) {
    return getState() ? getState().esc(s) : String(s || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function showToast(msg) {
    if (getState() && getState().showToast) {
      getState().showToast(msg);
    } else if (window.showToast) {
      window.showToast(msg);
    }
  }

  function getBankCode(institution) {
    const s = String(institution || '').toLowerCase();
    if (s.includes('garanti')) return 'GRN';
    if (s.includes('iş') || s.includes('is bank')) return 'ISB';
    if (s.includes('yapı') || s.includes('yapi')) return 'YKB';
    if (s.includes('akbank')) return 'AKB';
    if (s.includes('qnb') || s.includes('finans')) return 'QNB';
    if (s.includes('ziraat')) return 'ZRT';
    if (s.includes('vakıf') || s.includes('vakif')) return 'VKF';
    if (s.includes('halk')) return 'HLK';
    if (s.includes('enpara')) return 'ENP';
    if (s.includes('papara')) return 'PAP';
    if (s.includes('nakit') || s.includes('cüzdan') || s.includes('kasa')) return 'CSH';
    return 'VLT';
  }

  function getAccountTypeCode(type) {
    if (type === 'credit') return 'KK';
    if (type === 'cash') return 'TL';
    return 'BK';
  }

  function getAccountAssetCode(acc, allAccounts) {
    if (window.Vaulty?.Cards?.getAccountAssetCode) {
      return window.Vaulty.Cards.getAccountAssetCode(acc, allAccounts);
    }
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

  /* -------------------------------------------------------------------------
     1. HESAP / KART EKLEME & DÜZENLEME MODALI (#addAccountDlg)
     ------------------------------------------------------------------------- */
  let modalSelectedType = 'checking';
  let modalSelectedAccent = 'navy';

  function setModalAccountType(type) {
    modalSelectedType = type;
    $$('#addAccountForm .acct-type-card').forEach((card) => {
      const on = card.dataset.acctType === type;
      card.classList.toggle('is-selected', on);
      card.setAttribute('aria-checked', String(on));
    });

    const isCredit = type === 'credit';
    const liquidFieldsGroup = $('#liquidFieldsGroup');
    const creditFieldsGroup = $('#creditFieldsGroup');
    if (liquidFieldsGroup) liquidFieldsGroup.hidden = isCredit;
    if (creditFieldsGroup) creditFieldsGroup.hidden = !isCredit;

    const instEl = $('#acctInstitution');
    if (instEl) {
      if (type === 'cash') {
        instEl.value = 'Nakit Cüzdan';
      } else if (instEl.value === 'Nakit Cüzdan') {
        instEl.value = 'Garanti BBVA';
      }
    }
  }

  function setModalAccent(accent) {
    modalSelectedAccent = accent;
    $$('.accent-dot').forEach((dot) => {
      const on = dot.dataset.accent === accent;
      dot.classList.toggle('is-selected', on);
      dot.setAttribute('aria-checked', String(on));
    });
  }

  function openAddOrEditAccountModal(editAcc = null) {
    const addAccountForm = $('#addAccountForm');
    const acctFormError = $('#acctFormError');
    const addAccountDlg = $('#addAccountDlg');

    if (addAccountForm) addAccountForm.reset();
    if (acctFormError) acctFormError.hidden = true;

    if (editAcc) {
      if ($('#accountModalTitle')) $('#accountModalTitle').textContent = 'Hesap veya Kartı Düzenle';
      if ($('#accountModalSub')) $('#accountModalSub').textContent = `"${editAcc.nickname}" varlık bilgilerini güncelleyin`;
      if ($('#submitAddAccountBtn')) $('#submitAddAccountBtn').textContent = 'Değişiklikleri Kaydet';
      if ($('#accountEditId')) $('#accountEditId').value = editAcc.id;

      setModalAccountType(editAcc.type || 'checking');
      setModalAccent(editAcc.accent || 'navy');

      if ($('#acctNickname')) $('#acctNickname').value = editAcc.nickname || '';
      if ($('#acctInstitution')) $('#acctInstitution').value = editAcc.institution || '';
      if ($('#acctCustomNumber')) {
        $('#acctCustomNumber').value = editAcc.customNumber || (!isOldFakeNumber(editAcc.iban) ? editAcc.iban : '') || '';
      }
      if (editAcc.type === 'credit') {
        if ($('#acctLimit')) $('#acctLimit').value = editAcc.limit || '';
        if ($('#acctDebt')) $('#acctDebt').value = editAcc.debt || '';
        if ($('#acctCutoff')) $('#acctCutoff').value = editAcc.cutoffDay || 15;
      } else {
        if ($('#acctBalance')) $('#acctBalance').value = editAcc.balance || '';
      }
    } else {
      if ($('#accountModalTitle')) $('#accountModalTitle').textContent = 'Yeni Hesap veya Kart Ekle';
      if ($('#accountModalSub')) $('#accountModalSub').textContent = 'Finansal kasanıza yeni bir varlık tanımlayın';
      if ($('#submitAddAccountBtn')) $('#submitAddAccountBtn').textContent = 'Hesabı Oluştur';
      if ($('#accountEditId')) $('#accountEditId').value = '';

      setModalAccountType('checking');
      setModalAccent('navy');
      if ($('#acctCutoff')) $('#acctCutoff').value = '15';
      if ($('#acctCustomNumber')) $('#acctCustomNumber').value = '';
    }

    if (window.openModal) window.openModal(addAccountDlg);
    setTimeout(() => $('#acctNickname')?.focus(), 40);
  }

  function initAccountModalEvents() {
    const addAccountDlg = $('#addAccountDlg');
    const addAccountForm = $('#addAccountForm');
    const acctFormError = $('#acctFormError');

    $$('#addAccountForm .acct-type-card').forEach((card) => {
      card.addEventListener('click', () => setModalAccountType(card.dataset.acctType));
    });

    $$('.accent-dot').forEach((dot) => {
      dot.addEventListener('click', () => setModalAccent(dot.dataset.accent));
    });

    $('#openAddAccountBtn')?.addEventListener('click', () => openAddOrEditAccountModal(null));
    $('#dashAddAccBtn')?.addEventListener('click', () => openAddOrEditAccountModal(null));
    $('#closeAddAccountIcon')?.addEventListener('click', () => {
      if (window.closeModal) window.closeModal(addAccountDlg);
    });
    $('#cancelAddAccountBtn')?.addEventListener('click', () => {
      if (window.closeModal) window.closeModal(addAccountDlg);
    });

    addAccountForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const nickname = $('#acctNickname')?.value.trim();
      const institution = $('#acctInstitution')?.value || 'Garanti BBVA';
      const editId = $('#accountEditId')?.value;
      const customNumber = $('#acctCustomNumber')?.value.trim() || '';
      const cleanDigits = customNumber.replace(/\s+/g, '');
      const last4Digits = cleanDigits.length >= 4 ? cleanDigits.slice(-4) : '';

      if (!nickname) {
        if (acctFormError) {
          acctFormError.textContent = 'Lütfen bir hesap veya kart takma adı girin.';
          acctFormError.hidden = false;
        }
        $('#acctNickname')?.focus();
        return;
      }

      const s = getState();
      const accounts = s ? s.getAccounts() : window.accounts || [];

      if (modalSelectedType === 'credit') {
        const limit = parseMoney($('#acctLimit')?.value);
        const debt = parseMoney($('#acctDebt')?.value || '0');
        const cutoffDay = Math.min(31, Math.max(1, parseInt($('#acctCutoff')?.value || '15', 10)));

        if (isNaN(limit) || limit <= 0) {
          if (acctFormError) {
            acctFormError.textContent = 'Lütfen geçerli bir toplam kredi kartı limiti girin.';
            acctFormError.hidden = false;
          }
          $('#acctLimit')?.focus();
          return;
        }

        if (editId) {
          const target = accounts.find((x) => x.id === editId);
          if (target) {
            target.type = 'credit';
            target.nickname = nickname;
            target.institution = institution;
            target.accent = modalSelectedAccent;
            target.limit = limit;
            target.debt = Math.max(0, debt);
            target.cutoffDay = cutoffDay;
            target.dueDay = ((cutoffDay + 10 - 1) % 30) + 1;
            target.customNumber = customNumber;
            target.iban = customNumber;
            if (last4Digits) target.last4 = last4Digits;
            target.assetCode = getAccountAssetCode(target, accounts);
          }
        } else {
          const newAcc = {
            id: 'acc-' + Date.now(),
            type: 'credit',
            nickname,
            institution,
            last4: last4Digits,
            iban: customNumber,
            customNumber,
            accent: modalSelectedAccent,
            limit,
            debt: Math.max(0, debt),
            cutoffDay,
            dueDay: ((cutoffDay + 10 - 1) % 30) + 1,
            transactions:
              debt > 0
                ? [
                    {
                      id: 'at-' + Date.now(),
                      date: '2026-11-02',
                      desc: 'Kart Açılış / Devreden Dönem Borcu',
                      cat: 'Başlangıç',
                      amount: -Math.abs(debt),
                    },
                  ]
                : [],
          };
          newAcc.assetCode = getAccountAssetCode(newAcc, accounts);
          accounts.unshift(newAcc);
          if (s) s.setSelectedAccountId(newAcc.id);
        }
      } else {
        const balance = parseMoney($('#acctBalance')?.value || '0');
        if (isNaN(balance)) {
          if (acctFormError) {
            acctFormError.textContent = 'Lütfen geçerli bir başlangıç bakiyesi girin.';
            acctFormError.hidden = false;
          }
          $('#acctBalance')?.focus();
          return;
        }

        if (editId) {
          const target = accounts.find((x) => x.id === editId);
          if (target) {
            target.type = modalSelectedType;
            target.nickname = nickname;
            target.institution = institution;
            target.accent = modalSelectedAccent;
            target.balance = balance;
            target.customNumber = customNumber;
            target.iban = customNumber;
            if (last4Digits) target.last4 = last4Digits;
            target.assetCode = getAccountAssetCode(target, accounts);
          }
        } else {
          const newAcc = {
            id: 'acc-' + Date.now(),
            type: modalSelectedType,
            nickname,
            institution,
            last4: last4Digits,
            iban: customNumber,
            customNumber,
            accent: modalSelectedAccent,
            balance,
            transactions:
              balance > 0
                ? [
                    {
                      id: 'at-' + Date.now(),
                      date: '2026-11-02',
                      desc: 'Hesap Açılış / Başlangıç Bakiyesi',
                      cat: 'Başlangıç',
                      amount: balance,
                    },
                  ]
                : [],
          };
          newAcc.assetCode = getAccountAssetCode(newAcc, accounts);
          accounts.unshift(newAcc);
          if (s) s.setSelectedAccountId(newAcc.id);
        }
      }

      if (s) {
        s.saveAccounts();
        s.emit('accounts:changed', s.getAccounts());
      } else {
        if (window.saveAccounts) window.saveAccounts();
      }

      if (window.closeModal) window.closeModal(addAccountDlg);
      showToast(editId ? 'Hesap bilgileri güncellendi.' : 'Yeni hesap kasanıza eklendi ve işlemlere bağlandı.');
    });
  }

  /* -------------------------------------------------------------------------
     2. HIZLI BAKİYE GÜNCELLEME MODALI (#updateBalanceDlg)
     ------------------------------------------------------------------------- */
  function openUpdateBalanceModal(acc) {
    if (!acc) return;
    const isCredit = acc.type === 'credit';
    const updateBalanceDlg = $('#updateBalanceDlg');
    const updateBalInput = $('#updateBalInput');

    if ($('#updateBalTitle')) {
      $('#updateBalTitle').textContent = isCredit ? 'Kart Borcunu Güncelle' : 'Hesap Bakiyesini Güncelle';
    }
    if ($('#updateBalLabel')) {
      $('#updateBalLabel').textContent = isCredit ? `${acc.nickname} · Güncel Borç (₺)` : `${acc.nickname} · Yeni Bakiye (₺)`;
    }
    if (updateBalInput) {
      updateBalInput.value = isCredit ? (acc.debt ?? 0) : (acc.balance ?? 0);
    }

    if (window.openModal) window.openModal(updateBalanceDlg);
    setTimeout(() => {
      if (updateBalInput) {
        updateBalInput.focus();
        updateBalInput.select();
      }
    }, 40);
  }

  function initUpdateBalanceEvents() {
    const updateBalanceDlg = $('#updateBalanceDlg');
    const updateBalanceForm = $('#updateBalanceForm');
    const updateBalInput = $('#updateBalInput');

    $('#closeUpdateBalIcon')?.addEventListener('click', () => {
      if (window.closeModal) window.closeModal(updateBalanceDlg);
    });
    $('#cancelUpdateBalBtn')?.addEventListener('click', () => {
      if (window.closeModal) window.closeModal(updateBalanceDlg);
    });

    updateBalanceForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const s = getState();
      const currentSelectedId = s ? s.getSelectedAccountId() : window.selectedAccountId;
      const accounts = s ? s.getAccounts() : window.accounts || [];
      const acc = accounts.find((a) => a.id === currentSelectedId);
      if (!acc) return;

      const newVal = parseMoney(updateBalInput?.value);
      if (isNaN(newVal)) return;

      acc.transactions = acc.transactions || [];

      if (acc.type === 'credit') {
        const diff = round2((acc.debt || 0) - newVal);
        acc.debt = Math.max(0, newVal);
        if (Math.abs(diff) >= 0.005) {
          acc.transactions.unshift({
            id: 'at-' + Date.now(),
            date: '2026-11-02',
            desc: diff > 0 ? 'Manuel Borç Düşümü / Ödeme' : 'Manuel Borç Güncellemesi',
            cat: 'Bakiye Düzeltme',
            amount: diff,
          });
        }
      } else {
        const diff = round2(newVal - (acc.balance || 0));
        acc.balance = newVal;
        if (Math.abs(diff) >= 0.005) {
          acc.transactions.unshift({
            id: 'at-' + Date.now(),
            date: '2026-11-02',
            desc: 'Manuel Bakiye Güncellemesi',
            cat: 'Bakiye Düzeltme',
            amount: diff,
          });
        }
      }

      if (s) {
        s.saveAccounts();
        s.emit('accounts:changed', s.getAccounts());
      } else {
        if (window.saveAccounts) window.saveAccounts();
      }

      if (window.closeModal) window.closeModal(updateBalanceDlg);
      showToast('Bakiye başarıyla güncellendi.');
    });
  }

  /* -------------------------------------------------------------------------
     3. BORÇ / ALACAK MODALI (#newLedgerDlg) & SİLME ONAYI (#confirmDeleteDebtDlg)
     ------------------------------------------------------------------------- */
  let pendingDeleteDebtItem = null;

  function openAddOrEditLedgerModal(editItem = null) {
    const newLedgerDlg = $('#newLedgerDlg');
    const newLedgerForm = $('#newLedgerForm');
    if (newLedgerForm) newLedgerForm.reset();

    const titleEl = $('#newLedgerTitle');
    const subEl = $('#newLedgerSub');
    const submitBtn = $('#submitNewLedgerBtn');
    const kindInp = $('#newLedgerKind');
    const editIdInp = $('#newLedgerEditId');
    const initialPaidWrap = $('#newLedgerInitialPaidWrap');

    if (editItem) {
      if (titleEl) titleEl.textContent = 'Borç / Alacak Kaydını Düzenle';
      if (subEl) subEl.textContent = `"${editItem.party}" kaydını ve vade bilgilerini güncelleyin`;
      if (submitBtn) submitBtn.textContent = 'Değişiklikleri Kaydet';
      if (editIdInp) editIdInp.value = editItem.id;

      if (kindInp) kindInp.value = editItem.kind;
      if (newLedgerForm?.elements?.party) newLedgerForm.elements.party.value = editItem.party || '';
      if (newLedgerForm?.elements?.total) newLedgerForm.elements.total.value = editItem.total || '';
      if (newLedgerForm?.elements?.category) newLedgerForm.elements.category.value = editItem.category || '';
      if (newLedgerForm?.elements?.dueDate) newLedgerForm.elements.dueDate.value = editItem.dueDate || '2026-11-25';
      if (initialPaidWrap) initialPaidWrap.style.display = 'none';
    } else {
      if (titleEl) titleEl.textContent = 'Yeni Alacak / Borç Kaydı';
      if (subEl) subEl.textContent = 'Kısmi ödeme takipli yeni bir alacak veya yükümlülük ekleyin';
      if (submitBtn) submitBtn.textContent = 'Kaydı Oluştur';
      if (editIdInp) editIdInp.value = '';

      const s = getState();
      const activeSegment = s ? s.activeSegment : 'all';
      if (kindInp) {
        kindInp.value = activeSegment === 'receivable' ? 'receivable' : 'payable';
      }
      if (newLedgerForm?.elements?.dueDate) {
        newLedgerForm.elements.dueDate.value = '2026-11-25';
      }
      if (initialPaidWrap) initialPaidWrap.style.display = '';
    }

    if (window.openModal) window.openModal(newLedgerDlg);
    setTimeout(() => newLedgerForm?.elements?.party?.focus(), 40);
  }

  function openNewLedgerModal(preferredKind = null) {
    openAddOrEditLedgerModal(null);
    if (preferredKind) {
      const kindInp = $('#newLedgerKind');
      if (kindInp) kindInp.value = preferredKind;
    }
  }

  function openConfirmDeleteDebtModal(item) {
    if (!item) return;
    pendingDeleteDebtItem = item;

    const dlg = $('#confirmDeleteDebtDlg');
    const partyEl = $('#delDebtParty');
    const remEl = $('#delDebtRemaining');
    const badgeEl = $('#delDebtKindBadge');

    const s = getState();
    const rem = s && s.remainingAmount ? s.remainingAmount(item) : Math.max(0, Number(item.total || 0));
    const isRec = item.kind === 'receivable';

    if (partyEl) partyEl.textContent = item.party;
    if (remEl) remEl.textContent = tryFmt(rem);
    if (badgeEl) {
      badgeEl.textContent = isRec ? 'Alacak' : 'Borç';
      badgeEl.className = `sd-kind-badge ${isRec ? 'sd-kind-badge--rec' : 'sd-kind-badge--pay'}`;
    }

    if (window.openModal) window.openModal(dlg);
  }

  function initNewLedgerEvents() {
    const newLedgerDlg = $('#newLedgerDlg');
    const newLedgerForm = $('#newLedgerForm');

    $('#openNewDebtModalBtn')?.addEventListener('click', () => openNewLedgerModal());
    $('#closeNewLedgerIcon')?.addEventListener('click', () => {
      if (window.closeModal) window.closeModal(newLedgerDlg);
    });
    $('#cancelNewLedgerBtn')?.addEventListener('click', () => {
      if (window.closeModal) window.closeModal(newLedgerDlg);
    });

    newLedgerForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(newLedgerForm);
      const editId = $('#newLedgerEditId')?.value;
      const kind = fd.get('kind');
      const party = String(fd.get('party') || '').trim();
      const total = parseMoney(fd.get('total'));
      const initialPaid = Math.min(total, Math.max(0, parseMoney(fd.get('initialPaid') || '0')));
      const category = String(fd.get('category') || 'Genel').trim();
      const dueDate = fd.get('dueDate') || '2026-11-25';

      if (!party || !total || total <= 0) return;

      const s = getState();

      if (editId) {
        // Düzenleme modu
        const target = s ? s.getLedgerItems().find((x) => x.id === editId) : (window.ledgerItems || []).find((x) => x.id === editId);
        if (target) {
          target.kind = kind;
          target.party = party;
          target.category = category;
          target.dueDate = dueDate;
          target.total = round2(total);

          if (s) {
            s.saveLedger();
            s.emit('ledger:changed', s.getLedgerItems());
          } else {
            if (window.saveLedger) window.saveLedger();
          }
          if (window.closeModal) window.closeModal(newLedgerDlg);
          showToast(`"${party}" kaydı başarıyla güncellendi.`);
          return;
        }
      }

      // Yeni kayıt oluşturma modu
      const newItem = {
        id: 'dl-' + Date.now(),
        kind,
        party,
        category,
        createdAt: '2026-11-02',
        dueDate,
        total: round2(total),
        payments:
          initialPaid > 0
            ? [{ id: 'pm-' + Date.now(), date: '2026-11-02', amount: round2(initialPaid), note: 'Başlangıç Ödemesi' }]
            : [],
      };

      if (s) {
        s.addLedgerItem(newItem);
        s.saveLedger();
        s.emit('ledger:changed', s.getLedgerItems());
      } else {
        if (window.ledgerItems) window.ledgerItems.unshift(newItem);
        if (window.saveLedger) window.saveLedger();
      }

      if (window.closeModal) window.closeModal(newLedgerDlg);
      showToast(`"${party}" borç/alacak kaydı başarıyla oluşturuldu.`);
    });

    // Güvenli Silme Onay Penceresi Olayları
    const confirmDeleteDebtDlg = $('#confirmDeleteDebtDlg');
    $('#closeConfirmDeleteDebtIcon')?.addEventListener('click', () => {
      if (window.closeModal) window.closeModal(confirmDeleteDebtDlg);
      pendingDeleteDebtItem = null;
    });
    $('#cancelDeleteDebtBtn')?.addEventListener('click', () => {
      if (window.closeModal) window.closeModal(confirmDeleteDebtDlg);
      pendingDeleteDebtItem = null;
    });

    $('#confirmDeleteDebtBtn')?.addEventListener('click', () => {
      if (!pendingDeleteDebtItem) return;
      const item = pendingDeleteDebtItem;

      const s = getState();
      if (s && s.deleteLedgerItem) {
        s.deleteLedgerItem(item.id);
      } else if (window.deleteDebt) {
        window.deleteDebt(item.id);
      } else {
        if (window.ledgerItems) {
          window.ledgerItems = window.ledgerItems.filter((x) => x.id !== item.id);
        }
        if (window.saveLedger) window.saveLedger();
        if (window.saveAccounts) window.saveAccounts();
        if (window.saveTransactions) window.saveTransactions();
      }

      if (window.closeModal) window.closeModal(confirmDeleteDebtDlg);
      pendingDeleteDebtItem = null;
    });
  }

  /* -------------------------------------------------------------------------
     4. PROFİL & AYARLAR MODALI (#settingsDlg)
     ------------------------------------------------------------------------- */
    /* -------------------------------------------------------------------------
     4. PROFİL & AYARLAR MODALI (#settingsDlg) - v1.5.0 Modern Hub
     ------------------------------------------------------------------------- */
  const DEFAULT_AVATAR_34_SVG = `
    <svg viewBox="0 0 36 36" width="34" height="34" fill="none">
      <rect width="36" height="36" rx="18" fill="#EFF6FF"/>
      <circle cx="18" cy="14" r="5.5" fill="#2563EB"/>
      <path d="M7.5 31c1.7-5.6 6-8.4 10.5-8.4s8.8 2.8 10.5 8.4" fill="#2563EB"/>
    </svg>`;

  const DEFAULT_AVATAR_72_SVG = `
    <svg viewBox="0 0 72 72" width="72" height="72" fill="none">
      <rect width="72" height="72" rx="36" fill="#EFF6FF"/>
      <circle cx="36" cy="28" r="11" fill="#2563EB"/>
      <path d="M15 62c3.4-11.2 12-16.8 21-16.8s17.6 5.6 21 16.8" fill="#2563EB"/>
    </svg>`;

  function renderProfileIdentityUI() {
    const s = getState();
    const vaultProfile = s ? s.getVaultProfile() : window.vaultProfile || { username: 'Usta', avatarDataUrl: '', pin: '000000' };
    const name = (vaultProfile.username || 'Usta').trim() || 'Usta';

    const sidebarNameEl = $('#sidebarUserName');
    if (sidebarNameEl) sidebarNameEl.textContent = name;

    const heroNameEl = $('#settingsHeroUsername');
    if (heroNameEl) heroNameEl.textContent = name;

    const usernameInput = $('#profileUsernameInput');
    if (usernameInput && document.activeElement !== usernameInput) {
      usernameInput.value = name;
    }

    const sidebarAvatarEl = $('#sidebarUserAvatar');
    const settingsAvatarEl = $('#settingsAvatarPreview');
    const removeBtn = $('#removeAvatarBtn');

    if (vaultProfile.avatarDataUrl) {
      if (sidebarAvatarEl) {
        sidebarAvatarEl.innerHTML = `<img src="${esc(vaultProfile.avatarDataUrl)}" alt="${esc(name)}">`;
      }
      if (settingsAvatarEl) {
        settingsAvatarEl.innerHTML = `<img src="${esc(vaultProfile.avatarDataUrl)}" alt="${esc(name)}">`;
      }
      if (removeBtn) removeBtn.disabled = false;
    } else {
      if (sidebarAvatarEl) sidebarAvatarEl.innerHTML = DEFAULT_AVATAR_34_SVG;
      if (settingsAvatarEl) settingsAvatarEl.innerHTML = DEFAULT_AVATAR_72_SVG;
      if (removeBtn) removeBtn.disabled = false;
    }
  }

  function renderPreferencesUI() {
    const s = getState();
    const prof = s ? s.getVaultProfile() : window.vaultProfile || {};
    const theme = prof.theme || 'light';
    const currency = prof.currency || 'TRY';
    const lang = prof.language || 'tr';
    const startInPrivacy = prof.startInPrivacyMode === true;

    $$('.settings-theme-card').forEach((card) => {
      const isSel = card.dataset.themeVal === theme;
      card.classList.toggle('is-active', isSel);
    });

    $$('.settings-currency-card').forEach((card) => {
      const isSel = card.dataset.currencyVal === currency;
      card.classList.toggle('is-active', isSel);
    });

    $$('.settings-lang-card').forEach((card) => {
      const isSel = card.dataset.langVal === lang;
      card.classList.toggle('is-active', isSel);
    });

    const privacyToggle = $('#prefStartPrivacyToggle');
    if (privacyToggle) {
      privacyToggle.checked = startInPrivacy;
    }
  }

  function updateSettingsDataStats() {
    const s = getState();
    const accounts = s ? s.getAccounts() : window.accounts || [];
    const tx = s ? s.getTransactions() : window.tx || [];
    const ledger = s ? s.getLedgerItems() : window.ledgerItems || [];
    const goals = s ? s.getSavingsGoals() : [];

    const accEl = $('#settingsStatAccounts');
    const txEl = $('#settingsStatTx');
    const debtsEl = $('#settingsStatDebts');
    const goalsEl = $('#settingsStatGoals');

    if (accEl) accEl.textContent = accounts.length;
    if (txEl) txEl.textContent = tx.length;
    if (debtsEl) debtsEl.textContent = ledger.length;
    if (goalsEl) goalsEl.textContent = goals.length;
  }

  function switchSettingsTab(tabName = 'profile') {
    const tabs = $$('.settings-tab-btn');
    const panes = $$('.settings-tab-pane');

    tabs.forEach((btn) => {
      const isActive = btn.dataset.settingsTab === tabName;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });

    panes.forEach((pane) => {
      const isActive = pane.dataset.pane === tabName;
      pane.classList.toggle('is-active', isActive);
    });

    if (tabName === 'data') {
      updateSettingsDataStats();
    }
  }

  function openProfileSettingsModal(initialTab = 'profile') {
    if (window.Vaulty?.Sidebar?.setPopoverOpen) {
      window.Vaulty.Sidebar.setPopoverOpen(false);
    } else if (window.setPopoverOpen) {
      window.setPopoverOpen(false);
    }

    renderProfileIdentityUI();
    renderPreferencesUI();
    updateSettingsDataStats();

    const fb = $('#pinFormFeedback');
    if (fb) fb.hidden = true;

    switchSettingsTab(typeof initialTab === 'string' && initialTab ? initialTab : 'profile');

    const settingsDlg = $('#settingsDlg');
    if (window.openModal) window.openModal(settingsDlg);
  }

  function triggerBackupExport() {
    if (window.Vaulty?.Sidebar?.setPopoverOpen) {
      window.Vaulty.Sidebar.setPopoverOpen(false);
    }
    const s = getState();
    const vaultProfile = s ? s.getVaultProfile() : window.vaultProfile || { username: 'Usta' };
    const accounts = s ? s.getAccounts() : window.accounts || [];
    const ledgerItems = s ? s.getLedgerItems() : window.ledgerItems || [];
    const tx = s ? s.getTransactions() : window.tx || [];
    const savingsGoals = s ? s.getSavingsGoals() : [];

    const payload = {
      exportedAt: new Date().toISOString(),
      profile: `${vaultProfile.username || 'Usta'} · Kişisel Kasa`,
      accounts,
      debtLedger: ledgerItems,
      transactions: tx,
      savingsGoals,
      vaultProfile: {
        username: vaultProfile.username || 'Usta',
        avatarDataUrl: vaultProfile.avatarDataUrl || '',
        theme: vaultProfile.theme || 'light',
        currency: vaultProfile.currency || 'TRY',
        language: vaultProfile.language || 'tr',
        startInPrivacyMode: vaultProfile.startInPrivacyMode === true,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vault-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Kasa yedeği başarıyla indirildi.');
  }

  function triggerRestoreBackup() {
    if (window.Vaulty?.Sidebar?.setPopoverOpen) {
      window.Vaulty.Sidebar.setPopoverOpen(false);
    }

    let fileInput = document.getElementById('restoreBackupFileInput');
    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'restoreBackupFileInput';
      fileInput.accept = '.json,application/json';
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);
    }

    fileInput.onchange = (e) => {
      const file = e.target.files?.[0];
      fileInput.value = '';
      if (!file) return;

      if (file.size > 15 * 1024 * 1024) {
        showToast('Dosya boyutu çok büyük (Maksimum 15 MB).');
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const content = String(reader.result || '');
          let data;
          try {
            data = JSON.parse(content);
          } catch (jsonErr) {
            showToast('Seçilen dosya geçerli bir JSON formatında değil.');
            return;
          }

          if (!data || typeof data !== 'object') {
            showToast('Geçersiz yedek dosyası içeriği.');
            return;
          }

          const rawAccounts = data.accounts || data.vaultAccounts || [];
          const rawTx = data.transactions || data.transactionsTr || data.tx || [];
          const rawLedger = data.debtLedger || data.ledgerItems || [];
          const rawGoals = data.savingsGoals || data.vaultSavingsGoals || data.savings || [];

          if (!Array.isArray(rawAccounts) && !Array.isArray(rawTx) && !Array.isArray(rawLedger)) {
            showToast('Dosyada geçerli kasa verisi (hesap, işlem, borç) bulunamadı.');
            return;
          }

          const accCount = Array.isArray(rawAccounts) ? rawAccounts.length : 0;
          const txCount = Array.isArray(rawTx) ? rawTx.length : 0;
          const debtCount = Array.isArray(rawLedger) ? rawLedger.length : 0;
          const goalsCount = Array.isArray(rawGoals) ? rawGoals.length : 0;

          let dateStr = 'Belirtilmemiş';
          if (data.exportedAt) {
            try {
              dateStr = new Date(data.exportedAt).toLocaleString('tr-TR');
            } catch (_) {
              dateStr = String(data.exportedAt);
            }
          }

          const profileName = (typeof data.profile === 'string' ? data.profile : data.vaultProfile?.username) || 'Kişisel Kasa';

          const detailText = `Yedek Dosyası Özeti:\n• Dosya Adı: ${file.name}\n• Kasa Profili: ${profileName}\n• Yedek Alma Tarihi: ${dateStr}\n• Hesap / Kart Sayısı: ${accCount} adet\n• Kayıtlı İşlem Sayısı: ${txCount} adet\n• Borç & Alacak Kayıtları: ${debtCount} adet\n• Birikim Kumbaraları: ${goalsCount} adet`;

          let confirmed = false;
          if (window.Vaulty?.confirm) {
            confirmed = await window.Vaulty.confirm({
              title: 'Kasa Yedeği Geri Yüklensin mi?',
              message: 'Seçtiğiniz yedek dosyası mevcut verilerinizin üzerine yazılacaktır. Devam etmek istiyor musunuz?',
              detail: detailText,
              confirmText: 'Evet, Yedeği Yükle',
              cancelText: 'Vazgeç',
              type: 'warning',
            });
          } else {
            confirmed = confirm(`Kasa Yedeği Geri Yüklensin mi?\n\n${detailText}\n\nMevcut verileriniz silinecektir. Devam edilsin mi?`);
          }

          if (!confirmed) {
            showToast('Yedek geri yükleme işlemi iptal edildi.');
            return;
          }

          const s = getState();
          if (s && s.restoreFromBackup) {
            const stats = s.restoreFromBackup(data);
            const settingsDlg = document.getElementById('settingsDlg');
            if (settingsDlg && window.closeModal) window.closeModal(settingsDlg);

            showToast(`Kasa yedeği başarıyla geri yüklendi! (${stats.accountsCount} hesap, ${stats.txCount} işlem)`);
          } else {
            showToast('Kasa durumu güncellenirken bir hata oluştu.');
          }
        } catch (err) {
          console.error('Yedek yükleme hatası:', err);
          showToast('Yedek geri yüklenirken hata oluştu: ' + (err.message || ''));
        }
      };

      reader.onerror = () => {
        showToast('Yedek dosyası okunurken hata oluştu.');
      };

      reader.readAsText(file);
    };

    fileInput.click();
  }

  function triggerLockVault() {
    if (window.Vaulty?.Sidebar?.setPopoverOpen) {
      window.Vaulty.Sidebar.setPopoverOpen(false);
    }
    window.location.href = 'index.html';
  }

  function initSettingsModalEvents() {
    const settingsDlg = $('#settingsDlg');
    const avatarFileInput = $('#avatarFileInput');

    // 1. Tab switching events
    $$('.settings-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.settingsTab;
        if (tab) switchSettingsTab(tab);
      });
    });

    // 2. Avatar events
    $('#settingsAvatarTrigger')?.addEventListener('click', () => avatarFileInput?.click());
    $('#uploadAvatarBtn')?.addEventListener('click', () => avatarFileInput?.click());

    avatarFileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        showToast('Dosya boyutu 2 MB sınırını aşıyor.');
        avatarFileInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const s = getState();
        const p = s ? s.getVaultProfile() : window.vaultProfile;
        if (p) {
          p.avatarDataUrl = String(reader.result || '');
          if (s) {
            s.saveVaultProfile();
            s.emit('profile:changed', p);
          }
          renderProfileIdentityUI();
          showToast('Profil fotoğrafı güncellendi.');
        }
      };
      reader.readAsDataURL(file);
      avatarFileInput.value = '';
    });

    $('#removeAvatarBtn')?.addEventListener('click', () => {
      const s = getState();
      const p = s ? s.getVaultProfile() : window.vaultProfile;
      if (p) {
        if (!p.avatarDataUrl) {
          showToast('Varsayılan profil görseli zaten aktif.');
          return;
        }
        p.avatarDataUrl = '';
        if (s) {
          s.saveVaultProfile();
          s.emit('profile:changed', p);
        }
        renderProfileIdentityUI();
        showToast('Profil fotoğrafı kaldırıldı.');
      }
    });

    // 3. Username change form
    $('#profileUsernameForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const inp = $('#profileUsernameInput');
      const nextName = (inp?.value || '').trim();
      if (!nextName) {
        showToast('Lütfen geçerli bir kullanıcı adı girin.');
        inp?.focus();
        return;
      }
      const s = getState();
      const p = s ? s.getVaultProfile() : window.vaultProfile;
      if (p) {
        p.username = nextName;
        if (s) {
          s.saveVaultProfile();
          s.emit('profile:changed', p);
        }
        renderProfileIdentityUI();
        showToast(`Kullanıcı adı "${nextName}" olarak kaydedildi.`);
      }
    });

    // 4. Preferences: Themes
    $$('.settings-theme-card').forEach((card) => {
      card.addEventListener('click', () => {
        const val = card.dataset.themeVal;
        if (val === 'dark') {
          showToast('Karanlık mod (Dark theme) v1.6 sürümünde tam olarak entegre edilecektir.');
          return;
        }
        const s = getState();
        const p = s ? s.getVaultProfile() : window.vaultProfile;
        if (p) {
          p.theme = val;
          if (s) s.saveVaultProfile();
        }
        renderPreferencesUI();
        showToast(val === 'system' ? 'Tema: Sistemle eşitle seçildi (Beta).' : 'Tema: Açık tema aktif.');
      });
    });

    // 5. Preferences: Currencies
    $$('.settings-currency-card').forEach((card) => {
      card.addEventListener('click', () => {
        const val = card.dataset.currencyVal;
        if (val !== 'TRY') {
          showToast(`${val} çoklu döviz ve emtia portföy desteği v1.6 sürümünde aktifleşecektir.`);
          return;
        }
        const s = getState();
        const p = s ? s.getVaultProfile() : window.vaultProfile;
        if (p) {
          p.currency = val;
          if (s) s.saveVaultProfile();
        }
        renderPreferencesUI();
        showToast('Ana para birimi: Türk Lirası (₺).');
      });
    });

    // 6. Preferences: Language
    $$('.settings-lang-card').forEach((card) => {
      card.addEventListener('click', () => {
        const val = card.dataset.langVal;
        if (val !== 'tr') {
          showToast('English language support will be available in v1.6.');
          return;
        }
        showToast('Arayüz dili: Türkçe (Varsayılan).');
      });
    });

    // 7. Preferences: Privacy on startup
    $('#prefStartPrivacyToggle')?.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      const s = getState();
      const p = s ? s.getVaultProfile() : window.vaultProfile;
      if (p) {
        p.startInPrivacyMode = isChecked;
        if (s) s.saveVaultProfile();
      }
      showToast(isChecked ? 'Açılışta tutarları gizleme tercihi kaydedildi.' : 'Açılışta tutarları gizleme tercihi kaldırıldı.');
    });

    // 8. Security & PIN Form
    const curPinInp = $('#currentPinInput');
    const newPinInp = $('#newPinInput');
    const cfmPinInp = $('#confirmPinInput');
    const newCounter = $('#newPinCounter');
    const matchBadge = $('#confirmPinMatchBadge');

    function filterToDigits(inp, max = 6) {
      if (!inp) return '';
      const clean = inp.value.replace(/\D/g, '').slice(0, max);
      if (inp.value !== clean) {
        inp.value = clean;
      }
      return clean;
    }

    function updatePinLiveState() {
      const curVal = filterToDigits(curPinInp, 6);
      const newVal = filterToDigits(newPinInp, 6);
      const cfmVal = filterToDigits(cfmPinInp, 6);

      if (newCounter) {
        if (newVal.length === 6) {
          newCounter.textContent = '✓ 6 hane tamamlandı';
          newCounter.className = 'pin-counter-badge pin-counter-badge--success';
        } else {
          newCounter.textContent = `${newVal.length} / 6 hane`;
          newCounter.className = 'pin-counter-badge';
        }
      }

      if (matchBadge) {
        if (!cfmVal) {
          matchBadge.textContent = 'Eşleşme bekleniyor';
          matchBadge.className = 'pin-match-badge';
        } else if (newVal.length === 6 && cfmVal === newVal) {
          matchBadge.textContent = '✓ PIN eşleşti';
          matchBadge.className = 'pin-match-badge pin-match-badge--success';
        } else {
          matchBadge.textContent = '✗ PIN eşleşmiyor';
          matchBadge.className = 'pin-match-badge pin-match-badge--error';
        }
      }
    }

    [curPinInp, newPinInp, cfmPinInp].forEach((inp) => {
      inp?.addEventListener('input', updatePinLiveState);
      inp?.addEventListener('keydown', (e) => {
        if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
          return;
        }
        if (e.ctrlKey || e.metaKey) return;
        if (!/^\d$/.test(e.key)) {
          e.preventDefault();
          return;
        }
        if (inp.value.length >= 6 && inp.selectionStart === inp.selectionEnd) {
          e.preventDefault();
        }
      });
      inp?.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData)?.getData('text') || '';
        const digits = text.replace(/\D/g, '').slice(0, 6);
        inp.value = digits;
        updatePinLiveState();
      });
    });

    // Eye toggle buttons for show/hide PIN
    $$('.pin-toggle-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const targetInp = targetId ? $(`#${targetId}`) : null;
        if (!targetInp) return;
        const isPassword = targetInp.type === 'password';
        targetInp.type = isPassword ? 'text' : 'password';
        const eyeOpen = btn.querySelector('.eye-open');
        const eyeClosed = btn.querySelector('.eye-closed');
        if (eyeOpen) eyeOpen.style.display = isPassword ? 'none' : 'block';
        if (eyeClosed) eyeClosed.style.display = isPassword ? 'block' : 'none';
      });
    });

    $('#profilePinForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const curVal = filterToDigits(curPinInp, 6);
      const newVal = filterToDigits(newPinInp, 6);
      const cfmVal = filterToDigits(cfmPinInp, 6);
      const fb = $('#pinFormFeedback');

      const showPinFeedback = (msg, isError) => {
        if (!fb) return;
        fb.textContent = msg;
        fb.className = `prof-feedback ${isError ? 'prof-feedback--error' : 'prof-feedback--success'}`;
        fb.hidden = false;
      };

      if (!curVal || curVal.length < 6) {
        showPinFeedback('Lütfen mevcut 6 haneli kasa PIN kodunuzu girin.', true);
        curPinInp?.focus();
        return;
      }

      if (!newVal || newVal.length !== 6) {
        showPinFeedback('Yeni PIN kodu tam olarak 6 haneli rakamlardan oluşmalıdır (0-9).', true);
        newPinInp?.focus();
        return;
      }

      if (newVal !== cfmVal) {
        showPinFeedback('Yeni PIN kodu ile tekrarı birbiriyle eşleşmiyor.', true);
        cfmPinInp?.focus();
        return;
      }

      const s = getState();
      const p = s ? s.getVaultProfile() : window.vaultProfile;
      const currentPinExpected = p?.pin || '000000';

      if (curVal !== currentPinExpected) {
        showPinFeedback('Mevcut kasa PIN kodu hatalı. (Varsayılan PIN: 000000)', true);
        curPinInp?.focus();
        return;
      }

      if (p) {
        p.pin = newVal;
        if (s) s.saveVaultProfile();
      }
      if (curPinInp) curPinInp.value = '';
      if (newPinInp) newPinInp.value = '';
      if (cfmPinInp) cfmPinInp.value = '';
      updatePinLiveState();

      showPinFeedback('✓ Kasa PIN kodunuz başarıyla güncellendi ve şifrelendi.', false);
      showToast('Kasa PIN kodu başarıyla güncellendi.');
    });

    // 9. Modal Open/Close & Action buttons
    $('#openSettingsBtn')?.addEventListener('click', () => openProfileSettingsModal('profile'));
    $('#openPreferencesBtn')?.addEventListener('click', () => openProfileSettingsModal('preferences'));
    $('#closeSettingsIcon')?.addEventListener('click', () => {
      if (window.closeModal) window.closeModal(settingsDlg);
    });
    $('#closeSettingsBtn')?.addEventListener('click', () => {
      if (window.closeModal) window.closeModal(settingsDlg);
    });

    $('#backupVaultBtn')?.addEventListener('click', triggerBackupExport);
    $('#sectionBackupBtn')?.addEventListener('click', triggerBackupExport);
    $('#restoreVaultBtn')?.addEventListener('click', triggerRestoreBackup);
    $('#sectionRestoreBtn')?.addEventListener('click', triggerRestoreBackup);
    $('#lockVaultBtn')?.addEventListener('click', triggerLockVault);
    $('#settingsLockBtn')?.addEventListener('click', triggerLockVault);
  }

  function init() {
    initAccountModalEvents();
    initUpdateBalanceEvents();
    initNewLedgerEvents();
    initSettingsModalEvents();
    renderProfileIdentityUI();
  }

  const AccountModals = {
    init,
    openAddOrEditAccountModal,
    openUpdateBalanceModal,
    openNewLedgerModal,
    openAddOrEditLedgerModal,
    openConfirmDeleteDebtModal,
    openProfileSettingsModal,
    switchSettingsTab,
    renderPreferencesUI,
    updateSettingsDataStats,
    renderProfileIdentityUI,
    triggerBackupExport,
    triggerRestoreBackup,
    triggerLockVault,
    setModalAccountType,
    setModalAccent,
  };

  window.Vaulty = window.Vaulty || {};
  window.Vaulty.AccountModals = AccountModals;
  window.Vaulty.Modals = window.Vaulty.Modals || {};
  window.Vaulty.Modals.AccountModals = AccountModals;

  // Global aliases
  window.openAddOrEditAccountModal = openAddOrEditAccountModal;
  window.openUpdateBalanceModal = openUpdateBalanceModal;
  window.openNewLedgerModal = openNewLedgerModal;
  window.openAddOrEditLedgerModal = openAddOrEditLedgerModal;
  window.openConfirmDeleteDebtModal = openConfirmDeleteDebtModal;
  window.openProfileSettingsModal = openProfileSettingsModal;
  window.switchSettingsTab = switchSettingsTab;
  window.renderProfileIdentityUI = renderProfileIdentityUI;
  window.triggerBackupExport = triggerBackupExport;
  window.triggerRestoreBackup = triggerRestoreBackup;
  window.triggerLockVault = triggerLockVault;
})();

