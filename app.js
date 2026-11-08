/* =========================================================================
   VAULTY PIN AUTH & SECURITY DESK (app.js)
   6 Haneli Bankacılık Tipi PIN Giriş Matrisi & Kasa Kilit Açma Motoru
   ========================================================================= */
(() => {
  'use strict';

  const form = document.getElementById('unlockForm');
  const pinMatrix = document.getElementById('pinMatrix');
  if (!form || !pinMatrix) return;

  const cells = Array.from(pinMatrix.querySelectorAll('.pin-cell'));
  const inputs = cells.map((cell) => cell.querySelector('input'));
  const errorEl = document.getElementById('pinError');
  const unlockBtn = document.getElementById('unlockBtn');
  let isVerifying = false;

  // 1. Girdi Hijyeni (Tarayıcı otomatik tamamlama ve önerilerini engelle)
  inputs.forEach((inp, idx) => {
    inp.setAttribute('autocomplete', 'off');
    inp.setAttribute('autocorrect', 'off');
    inp.setAttribute('autocapitalize', 'off');
    inp.setAttribute('spellcheck', 'false');
    inp.setAttribute('inputmode', 'numeric');
    inp.dataset.index = String(idx);
  });

  // 2. Kasa Profil Bilgilerini Çekme & Arayüze Yansıtma
  function getStoredProfile() {
    if (window.vaultStore && typeof window.vaultStore.get === 'function') {
      return window.vaultStore.get('vaultProfile', null);
    }
    return null;
  }

  function hydrateProfileUI() {
    const profile = getStoredProfile();
    const welcomeHeading = document.getElementById('welcome-heading');
    if (welcomeHeading) {
      const username = (profile && profile.username && profile.username.trim()) || 'Usta';
      welcomeHeading.textContent = `Hoş geldin, ${username}`;
    }

    const lockAvatar = document.querySelector('.avatar');
    if (lockAvatar && profile && profile.avatarDataUrl) {
      lockAvatar.innerHTML = `<img src="${profile.avatarDataUrl}" alt="${(profile.username || 'Usta')}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">`;
    }
  }

  hydrateProfileUI();

  // 3. Hücre Durum Senkronizasyonu (Doluluk Noktası .is-filled)
  function syncCellState(index) {
    if (inputs[index]) {
      const hasVal = Boolean(inputs[index].value && inputs[index].value.length > 0);
      cells[index].classList.toggle('is-filled', hasVal);
    }
  }

  function getPinValue() {
    return inputs.map((input) => input.value || '').join('');
  }

  // 4. Hata ve CSS Sallantı (Shake) Animasyonu
  function setError(message) {
    const hasError = Boolean(message);
    pinMatrix.classList.toggle('has-error', hasError);
    if (errorEl) {
      errorEl.textContent = message || '';
      errorEl.classList.toggle('is-visible', hasError);
    }

    if (hasError) {
      pinMatrix.classList.remove('shake');
      void pinMatrix.offsetWidth; // Force reflow
      pinMatrix.classList.add('shake');
    }
  }

  function clearError() {
    if (pinMatrix.classList.contains('has-error') || pinMatrix.classList.contains('shake')) {
      pinMatrix.classList.remove('has-error', 'shake');
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('is-visible');
      }
    }
  }

  pinMatrix.addEventListener('animationend', (e) => {
    if (e.animationName === 'pinShake' || pinMatrix.classList.contains('shake')) {
      pinMatrix.classList.remove('shake');
    }
  });

  // 5. Kasa Doğrulama & Oturum Açma (core/storage.js üzerinden vaultProfile.pin)
  function triggerVerify() {
    if (isVerifying) return;
    const pin = getPinValue();

    if (pin.length < 6) {
      setError('Lütfen 6 haneli PIN kodunuzu eksiksiz girin.');
      focusFirstEmptyInput();
      return;
    }

    const profile = getStoredProfile();
    const expectedPin = (profile && profile.pin && /^\d{6}$/.test(String(profile.pin)))
      ? String(profile.pin)
      : '000000';

    if (pin !== expectedPin) {
      setError('Girilen kasa PIN kodu hatalı. (Varsayılan şifre: 000000)');
      inputs.forEach((inp, i) => {
        inp.value = '';
        syncCellState(i);
      });
      if (inputs[0]) inputs[0].focus();
      return;
    }

    // Profilde PIN henüz kayıtlı değilse varsayılan '000000' olarak mühürle
    if (window.vaultStore && (!profile || !profile.pin)) {
      const updated = profile
        ? { ...profile, pin: '000000' }
        : { username: 'Usta', avatarDataUrl: '', pin: '000000' };
      window.vaultStore.set('vaultProfile', updated);
    }

    clearError();
    isVerifying = true;

    if (unlockBtn) {
      unlockBtn.classList.add('is-loading');
      unlockBtn.setAttribute('aria-busy', 'true');
    }
    inputs.forEach((inp) => inp.setAttribute('readonly', 'true'));

    if (window.vaultStore) {
      window.vaultStore.set('lastUnlockedAt', new Date().toISOString());
    }

    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 450);
  }

  // 6. Odaklama Kolaylaştırıcıları
  function focusFirstEmptyInput() {
    const firstEmpty = inputs.find((inp) => !inp.value) || inputs[0];
    if (firstEmpty) {
      firstEmpty.focus();
      firstEmpty.select?.();
    }
  }

  // 7. Tuş Vuruşları & İleri/Geri Hücre Atlama Mantığı
  inputs.forEach((input, idx) => {
    // Hücreye tıklanınca odaklama
    cells[idx].addEventListener('mousedown', (e) => {
      if (e.target !== input) {
        e.preventDefault();
        const firstEmpty = inputs.find((inp) => !inp.value);
        (firstEmpty || input).focus();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (isVerifying) {
        e.preventDefault();
        return;
      }

      // Enter Tuşu: Doğrulamayı başlat
      if (e.key === 'Enter') {
        e.preventDefault();
        triggerVerify();
        return;
      }

      // Backspace Tuşu: Değer varsa sil, yoksa bir önceki hücreye geçip sil
      if (e.key === 'Backspace') {
        e.preventDefault();
        clearError();
        if (input.value) {
          input.value = '';
          syncCellState(idx);
        } else if (idx > 0) {
          inputs[idx - 1].value = '';
          syncCellState(idx - 1);
          inputs[idx - 1].focus();
        }
        return;
      }

      // Delete Tuşu: Aktif hücreyi sil
      if (e.key === 'Delete') {
        e.preventDefault();
        clearError();
        input.value = '';
        syncCellState(idx);
        return;
      }

      // Sol Ok Tuşu
      if (e.key === 'ArrowLeft' && idx > 0) {
        e.preventDefault();
        inputs[idx - 1].focus();
        return;
      }

      // Sağ Ok Tuşu
      if (e.key === 'ArrowRight' && idx < inputs.length - 1) {
        e.preventDefault();
        inputs[idx + 1].focus();
        return;
      }

      // Rakam Girişi (Normal Klavyeden 0-9 veya Numpad0-Numpad9)
      let digit = null;
      if (/^[0-9]$/.test(e.key)) {
        digit = e.key;
      } else if (/^Numpad[0-9]$/.test(e.code)) {
        digit = e.code.replace('Numpad', '');
      }

      if (digit !== null) {
        e.preventDefault();
        clearError();
        input.value = digit;
        syncCellState(idx);

        if (idx < inputs.length - 1) {
          inputs[idx + 1].focus();
        } else {
          input.blur();
        }

        if (getPinValue().length === 6) {
          triggerVerify();
        }
        return;
      }

      // Harf veya diğer tekil karakterleri engelle
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
      }
    });

    // input event (otomatik tamamlama veya mobil/IME desteği)
    input.addEventListener('input', () => {
      if (isVerifying) return;
      clearError();
      const digit = input.value.replace(/\D/g, '').slice(-1);
      input.value = digit;
      syncCellState(idx);

      if (digit && idx < inputs.length - 1) {
        inputs[idx + 1].focus();
      }

      if (getPinValue().length === 6) {
        triggerVerify();
      }
    });

    // Yapıştırma (Paste) Desteği: 6 haneli kod yapıştırıldığında sıralı doldur
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      if (isVerifying) return;
      clearError();
      const rawText = (e.clipboardData || window.clipboardData)?.getData('text') || '';
      const digits = rawText.replace(/\D/g, '');
      if (!digits) return;

      // 6 hane birden kopyalanmışsa baştan başlat, aksi halde aktif hücreden itibaren doldur
      const startIdx = digits.length >= 6 ? 0 : idx;
      const sliceDigits = digits.slice(0, inputs.length - startIdx);

      sliceDigits.split('').forEach((ch, offset) => {
        const targetIdx = startIdx + offset;
        if (targetIdx < inputs.length) {
          inputs[targetIdx].value = ch;
          syncCellState(targetIdx);
        }
      });

      const nextEmpty = inputs.findIndex((inp) => !inp.value);
      if (nextEmpty !== -1) {
        inputs[nextEmpty].focus();
      } else {
        inputs[inputs.length - 1].blur();
        triggerVerify();
      }
    });
  });

  // Form submit olayı
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    triggerVerify();
  });

  // Demo / Test Hesabı Hızlı Giriş Butonu
  const demoLoginBtn = document.getElementById('demoModeLoginBtn');
  demoLoginBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.vaultStore && typeof window.vaultStore.set === 'function') {
      window.vaultStore.set('vaultActiveMode', 'test');
    }
    sessionStorage.setItem('vaulty_authed', 'true');
    window.location.href = 'dashboard.html';
  });

  // Sayfa açıldığında otomatik ilk boş hücreye odaklanma
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', focusFirstEmptyInput);
  } else {
    focusFirstEmptyInput();
  }
})();
