/* =========================================================================
   VAULTY CORE STATE & STORE (Merkezi Durum Yönetimi & Hassas Matematik)
   ========================================================================= */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // IEEE-754 kayan nokta drift korumalı kuruş yuvarlayıcı
  const round2 = (num) => Math.round((Number(num || 0) + Number.EPSILON) * 100) / 100;

  // Esnek Para Ayrıştırıcı (virgül, nokta ve para birimi sembollerini doğru ayıklar)
  function parseMoney(val) {
    if (val == null || val === '') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : round2(val);
    let str = String(val).trim().replace(/[−–]/g, '-').replace(/[₺TLtl$\s]/g, '');
    if (!str) return 0;
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastDot !== -1 && lastComma !== -1) {
      if (lastComma > lastDot) str = str.replace(/\./g, '').replace(',', '.');
      else str = str.replace(/,/g, '');
    } else if (lastComma !== -1) {
      str = str.replace(',', '.');
    }
    const num = parseFloat(str);
    return isNaN(num) ? 0 : round2(num);
  }

  // Dinamik Kuruş Biçimlendirici (kuruş varsa 2 hane, yoksa sade tam sayı)
  const tryFmt = (n, decimals = null) => {
    const num = typeof n === 'number' ? n : parseMoney(n);
    if (isNaN(num)) return '0 ₺';
    let d = decimals;
    if (d === null || d === undefined) {
      d = Math.abs(num % 1) > 0.0001 ? 2 : 0;
    }
    return (
      new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      }).format(num) + ' ₺'
    );
  };

  const shortTry = (n) => (Math.abs(n) >= 1000 ? (n / 1000).toFixed(0) + ' B ₺' : `${n} ₺`);
  const TODAY = new Date();
  const daysTo = (iso) => {
    if (!iso) return 9999;
    const target = new Date(iso);
    if (isNaN(target.getTime())) return 9999;
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - now.getTime()) / 864e5);
  };

  function formatDuePill(item) {
    const d = daysTo(item.dueDate);
    if (d < 0) return { cls: 'dash-pill--rose', text: `${Math.abs(d)} gün gecikti` };
    if (d === 0) return { cls: 'dash-pill--amber', text: 'Bugün' };
    return { cls: d <= 7 ? 'dash-pill--amber' : 'dash-pill--slate', text: `${d} gün kaldı` };
  }

  const esc = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const initials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const ACCENT_PALETTE = {
    navy: {
      color: '#1E3A8A',
      tint: '#EFF6FF',
      ccGradient: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
    },
    emerald: {
      color: '#065F46',
      tint: '#ECFDF5',
      ccGradient: 'linear-gradient(135deg, #065F46 0%, #064E3B 100%)',
    },
    charcoal: {
      color: '#1E293B',
      tint: '#F1F5F9',
      ccGradient: 'linear-gradient(135deg, #273449 0%, #0F172A 100%)',
    },
    purple: {
      color: '#4C1D95',
      tint: '#F5F3FF',
      ccGradient: 'linear-gradient(135deg, #4C1D95 0%, #1E1B4B 100%)',
    },
    amber: {
      color: '#92400E',
      tint: '#FFFBEB',
      ccGradient: 'linear-gradient(135deg, #78350F 0%, #451A03 100%)',
    },
    slate: {
      color: '#334155',
      tint: '#F1F5F9',
      ccGradient: 'linear-gradient(135deg, #334155 0%, #1E293B 100%)',
    },
  };

  const DASH_DONUT_COLORS = ['#2563EB', '#F59E0B', '#10B981', '#7E22CE', '#94A3B8'];

  function bankShortCode(inst) {
    const map = {
      'Garanti BBVA': 'GB',
      'İş Bankası': 'İŞ',
      'Yapı Kredi': 'YK',
      'Akbank': 'AK',
      'Enpara': 'EN',
      'QNB': 'QN',
      'Ziraat': 'ZR',
      'Nakit Cüzdan': 'NK',
    };
    return map[inst] || initials(inst);
  }

  function safeRun(fn, label = 'operation') {
    try {
      if (typeof fn === 'function') fn();
    } catch (err) {
      console.error(`[Vaulty SafeRun] ${label} hatası:`, err);
    }
  }

  let toastTimer = null;
  function showToast(msg) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    toast.removeAttribute('hidden');
    toast.style.setProperty('display', 'block', 'important');
    toast.style.setProperty('pointer-events', 'auto', 'important');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.hidden = true;
      toast.setAttribute('hidden', '');
      toast.style.setProperty('display', 'none', 'important');
      toast.style.setProperty('pointer-events', 'none', 'important');
    }, 2600);
  }

  /* ---------------- Normalizasyon Fonksiyonları ---------------- */
  function paidAmount(item) {
    if (!item || !Array.isArray(item.payments)) return 0;
    return round2(item.payments.reduce((s, p) => s + parseMoney(p && (p.amount ?? p.tutar)), 0));
  }

  function remainingAmount(item) {
    if (!item) return 0;
    const tot = parseMoney(item.total ?? item.tutar ?? item.amount ?? 0);
    return Math.max(0, round2(tot - paidAmount(item)));
  }

  function isArchived(item) {
    return remainingAmount(item) <= 0.005;
  }

  function normalizeAccount(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const id = String(raw.id || raw._id || `acc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);

    let type = String(raw.type || raw.hesapTuru || raw.tur || 'checking').toLowerCase();
    if (type === 'vadesiz' || type === 'banka' || type === 'bankakarti') type = 'checking';
    else if (type === 'kredi' || type === 'kredikarti') type = 'credit';
    else if (type === 'nakit' || type === 'cuzdan' || type === 'kasa') type = 'cash';
    if (!['checking', 'credit', 'cash'].includes(type)) type = 'checking';

    const nickname = String(raw.nickname || raw.hesapAdi || raw.name || raw.ad || (type === 'cash' ? 'Nakit Cüzdan' : 'Hesap')).trim();
    const institution = String(raw.institution || raw.banka || raw.bank || (type === 'cash' ? 'Nakit Cüzdan' : 'Banka')).trim();
    const iban = String(raw.iban || raw.hesapNo || raw.cardNumber || '').trim();
    let last4 = String(raw.last4 || raw.sonDort || '').trim();
    if (!last4 && iban) {
      const digits = iban.replace(/\D/g, '');
      if (digits.length >= 4) last4 = digits.slice(-4);
    }
    const accent = String(raw.accent || raw.renk || (type === 'cash' ? 'emerald' : type === 'credit' ? 'charcoal' : 'navy'));
    const balance = parseMoney(raw.balance ?? raw.bakiye ?? raw.tutar ?? 0);
    const debt = parseMoney(raw.debt ?? raw.borc ?? raw.guncelBorc ?? 0);
    const limit = parseMoney(raw.limit ?? raw.kartLimiti ?? raw.toplamLimit ?? 0);
    const cutoffDay = Number(raw.cutoffDay ?? raw.hesapKesimGunu ?? 1) || 1;
    const dueDay = Number(raw.dueDay ?? raw.sonOdemeGunu ?? 15) || 15;

    const rawTxList = Array.isArray(raw.transactions) ? raw.transactions : [];
    const txList = rawTxList.map((at, idx) => {
      if (!at || typeof at !== 'object') return null;
      return {
        id: String(at.id || `at-${Date.now()}-${idx}`),
        date: String(at.date || at.tarih || new Date().toISOString().slice(0, 10)),
        desc: String(at.desc || at.aciklama || 'Hesap Hareketi'),
        cat: String(at.cat || at.kategori || 'Genel'),
        amount: parseMoney(at.amount ?? at.tutar ?? 0),
      };
    }).filter(Boolean);

    return {
      id,
      type,
      nickname,
      institution,
      iban,
      last4,
      accent,
      balance,
      debt,
      limit,
      cutoffDay,
      dueDay,
      transactions: txList,
      assetCode: raw.assetCode || undefined,
      customNumber: raw.customNumber || undefined,
    };
  }

  function normalizeTransaction(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const id = String(raw.id || raw._id || `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    const date = String(raw.date || raw.tarih || new Date().toISOString().slice(0, 10)).trim();
    const desc = String(raw.desc || raw.aciklama || raw.description || raw.memo || 'İşlem').trim();
    const cat = String(raw.cat || raw.kategori || raw.category || 'Genel').trim();
    let type = String(raw.type || raw.tur || raw.islemTuru || 'Gider').trim();
    if (type === 'Gelir' || type === 'income') type = 'Gelir';
    else if (type === 'Kart Borcu Ödeme' || type === 'card_payment' || type === 'Kart Borcu Odeme') type = 'Kart Borcu Ödeme';
    else if (type === 'Transfer' || type === 'transfer') type = 'Transfer';
    else type = 'Gider';

    const status = String(raw.status || raw.durum || 'Ödendi').trim();
    const amount = parseMoney(raw.amount ?? raw.tutar ?? raw.miktar ?? 0);
    const accountId = String(raw.accountId || raw.hesapId || raw.account || '').trim();
    const sourceAccountId = raw.sourceAccountId || raw.kaynakHesapId || undefined;

    const isRecurring = Boolean(raw.isRecurring === true || raw.isRecurring === 'true');
    const result = {
      id,
      date,
      desc,
      cat,
      type,
      status,
      amount,
      accountId,
      sourceAccountId,
      isRecurring,
    };

    if (isRecurring) {
      result.recurringInterval = ['monthly', 'weekly', 'yearly'].includes(String(raw.recurringInterval).toLowerCase())
        ? String(raw.recurringInterval).toLowerCase()
        : 'monthly';
      result.recurringDay = raw.recurringDay != null ? Number(raw.recurringDay) : (date ? new Date(date).getDate() : 1);
      result.nextDueDate = raw.nextDueDate ? String(raw.nextDueDate).trim() : date;
      result.autoConfirm = Boolean(raw.autoConfirm);
      if (raw.recurringEndDate) {
        result.recurringEndDate = String(raw.recurringEndDate).trim();
      }
    }

    const isInstallment = Boolean(raw.isInstallment || (raw.installment && raw.installment.totalInstallments > 1));
    if (isInstallment) {
      result.isInstallment = true;
      result.installment = {
        groupId: String(raw.installment?.groupId || raw.installmentGroupId || `inst-grp-${Date.now()}`),
        totalAmount: round2(parseMoney(raw.installment?.totalAmount || raw.installmentTotal || result.amount)),
        currentInstallment: Number(raw.installment?.currentInstallment || raw.installmentIndex || 1),
        totalInstallments: Number(raw.installment?.totalInstallments || raw.installmentCount || 1),
        installmentAmount: round2(parseMoney(raw.installment?.installmentAmount || result.amount)),
      };
    }

    if (raw.recurringParentId) {
      result.recurringParentId = String(raw.recurringParentId).trim();
    }

    return result;
  }

  function normalizeDebtItem(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const id = String(raw.id || raw._id || `dl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    let kind = String(raw.kind || raw.tur || (raw.isPayable ? 'payable' : 'receivable') || 'payable').toLowerCase();
    if (kind !== 'payable' && kind !== 'receivable') kind = 'payable';

    const party = String(raw.party || raw.kisi || raw.unvan || raw.name || 'Kişi / Kurum').trim();
    const category = String(raw.category || raw.kategori || 'Diğer').trim();
    const createdAt = String(raw.createdAt || raw.olusturmaTarihi || raw.date || new Date().toISOString().slice(0, 10)).trim();
    const dueDate = String(raw.dueDate || raw.vadeTarihi || raw.vade || new Date().toISOString().slice(0, 10)).trim();
    const total = parseMoney(raw.total ?? raw.tutar ?? raw.borcTutari ?? raw.amount ?? 0);

    const rawPayments = Array.isArray(raw.payments) ? raw.payments : (Array.isArray(raw.odemeler) ? raw.odemeler : []);
    const payments = rawPayments.map((p, idx) => {
      if (!p || typeof p !== 'object') return null;
      return {
        id: String(p.id || `pm-${Date.now()}-${idx}`),
        date: String(p.date || p.tarih || new Date().toISOString().slice(0, 10)),
        amount: parseMoney(p.amount ?? p.tutar ?? 0),
        note: String(p.note || p.not || p.aciklama || ''),
        accountId: p.accountId || p.hesapId || undefined,
      };
    }).filter(Boolean);

    return {
      id,
      kind,
      party,
      category,
      createdAt,
      dueDate,
      total,
      payments,
    };
  }

  /* ---------------- Test & Demo Hesabı Örnek Veri Üreteci ---------------- */
  function createTestSampleData() {
    const now = new Date();
    const curY = now.getFullYear();
    const curM = now.getMonth(); // 0-based
    const pad = (n) => String(n).padStart(2, '0');

    const fmtDate = (y, m, d) => {
      const dt = new Date(y, m, d);
      return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
    };

    const accounts = [
      {
        id: 'acc-test-1',
        institution: 'Ziraat Bankası',
        nickname: 'Ana Vadesiz TL',
        type: 'checking',
        balance: 42850.00,
        currency: 'TRY',
        color: '#E11D48',
        iban: 'TR33 0001 0000 0000 0000 0000 01',
      },
      {
        id: 'acc-test-2',
        institution: 'Garanti BBVA',
        nickname: 'Maaş & Birikim',
        type: 'checking',
        balance: 18420.50,
        currency: 'TRY',
        color: '#059669',
        iban: 'TR62 0006 2000 0000 0000 0000 02',
      },
      {
        id: 'acc-test-3',
        institution: 'Nakit Cüzdan',
        nickname: 'Fiziki Cüzdan',
        type: 'cash',
        balance: 3250.00,
        currency: 'TRY',
        color: '#0284C7',
      },
      {
        id: 'acc-test-4',
        institution: 'Garanti BBVA',
        nickname: 'Bonus Platinum',
        type: 'credit',
        limit: 75000.00,
        debt: 14850.00,
        currency: 'TRY',
        color: '#10B981',
        cutoffDay: Math.max(1, (now.getDate() + 5) % 28 || 1),
        dueDay: Math.max(1, (now.getDate() + 15) % 28 || 1),
      },
      {
        id: 'acc-test-5',
        institution: 'İş Bankası',
        nickname: 'Maximum Kart',
        type: 'credit',
        limit: 50000.00,
        debt: 6200.00,
        currency: 'TRY',
        color: '#2563EB',
        cutoffDay: Math.max(1, (now.getDate() - 3 + 28) % 28 || 1),
        dueDay: Math.max(1, (now.getDate() + 7) % 28 || 1),
      },
    ];

    const tx = [];
    let txCounter = 1;

    // Son 6 ay için zengin gelir & gider verisi üret
    for (let offset = 5; offset >= 0; offset--) {
      const y = curY;
      const m = curM - offset;

      // Gelir 1: Maaş (+65.000 ₺)
      tx.push({
        id: `tx-test-${txCounter++}`,
        date: fmtDate(y, m, 15),
        desc: 'Şirket Aylık Maaş Hakedişi',
        cat: 'Maaş Geliri',
        type: 'Gelir',
        amount: 65000.00,
        accountId: 'acc-test-1',
        status: 'Tamamlandı',
      });

      // Gelir 2: Serbest Danışmanlık (+15.000 ₺)
      tx.push({
        id: `tx-test-${txCounter++}`,
        date: fmtDate(y, m, 22),
        desc: 'Yazılım Danışmanlığı & Mimari Destek',
        cat: 'Serbest Gelir',
        type: 'Gelir',
        amount: 15000.00,
        accountId: 'acc-test-2',
        status: 'Tamamlandı',
      });

      // Gider 1: Ev Kirası (-18.500 ₺)
      tx.push({
        id: `tx-test-${txCounter++}`,
        date: fmtDate(y, m, 1),
        desc: 'Konut Kira Bedeli',
        cat: 'Ev & Yaşam',
        type: 'Gider',
        amount: 18500.00,
        accountId: 'acc-test-1',
        status: 'Tamamlandı',
      });

      // Gider 2: Migros Market (-2.850 ₺)
      tx.push({
        id: `tx-test-${txCounter++}`,
        date: fmtDate(y, m, 6),
        desc: 'Migros Sanal Market Aylık Alışveriş',
        cat: 'Market',
        type: 'Gider',
        amount: 2850.00,
        accountId: 'acc-test-4',
        status: 'Tamamlandı',
      });

      // Gider 3: Enerjisa Elektrik (-1.120 ₺)
      tx.push({
        id: `tx-test-${txCounter++}`,
        date: fmtDate(y, m, 12),
        desc: 'Enerjisa Elektrik Faturası',
        cat: 'Fatura & Aidat',
        type: 'Gider',
        amount: 1120.00,
        accountId: 'acc-test-1',
        status: 'Tamamlandı',
      });

      // Gider 4: Restoran & Yemek (-1.650 ₺)
      tx.push({
        id: `tx-test-${txCounter++}`,
        date: fmtDate(y, m, 18),
        desc: 'Akşam Yemeği & Buluşma',
        cat: 'Yeme & İçme',
        type: 'Gider',
        amount: 1650.00,
        accountId: 'acc-test-4',
        status: 'Tamamlandı',
      });

      // Gider 5: Opet Akaryakıt (-2.200 ₺)
      tx.push({
        id: `tx-test-${txCounter++}`,
        date: fmtDate(y, m, 24),
        desc: 'Opet Benzin Depo Dolumu',
        cat: 'Ulaşım & Akaryakıt',
        type: 'Gider',
        amount: 2200.00,
        accountId: 'acc-test-5',
        status: 'Tamamlandı',
      });

      // Gider 6: Abonelikler (-329.98 ₺)
      tx.push({
        id: `tx-test-${txCounter++}`,
        date: fmtDate(y, m, 10),
        desc: 'Netflix & Spotify Premium Abonelik',
        cat: 'Abonelikler',
        type: 'Gider',
        amount: 329.98,
        accountId: 'acc-test-4',
        status: 'Tamamlandı',
      });
    }

    // Bu ay için güncel birkaç ek hareket
    tx.unshift(
      {
        id: `tx-test-${txCounter++}`,
        date: fmtDate(curY, curM, Math.max(1, now.getDate() - 1)),
        desc: 'Garanti Bonus Kart Borcu Kısmi Ödeme',
        cat: 'Kart Borcu Ödeme',
        type: 'Kart Borcu Ödeme',
        amount: 8000.00,
        accountId: 'acc-test-4',
        sourceAccountId: 'acc-test-1',
        status: 'Tamamlandı',
      },
      {
        id: `tx-test-${txCounter++}`,
        date: fmtDate(curY, curM, Math.max(1, now.getDate() - 2)),
        desc: 'Hesaplar Arası Dahili Virman',
        cat: 'Dahili Virman',
        type: 'Transfer',
        amount: 5000.00,
        accountId: 'acc-test-2',
        sourceAccountId: 'acc-test-1',
        status: 'Tamamlandı',
      },
      {
        id: `tx-test-${txCounter++}`,
        date: fmtDate(curY, curM, Math.max(1, now.getDate() - 3)),
        desc: 'Carrefour Gurme Market Alışverişi',
        cat: 'Market',
        type: 'Gider',
        amount: 1420.00,
        accountId: 'acc-test-4',
        status: 'Tamamlandı',
      },
      {
        id: `tx-test-${txCounter++}`,
        date: fmtDate(curY, curM, Math.max(1, now.getDate() - 4)),
        desc: 'Nakit Çekim & Harçlık',
        cat: 'Fiziki Cüzdan',
        type: 'Transfer',
        amount: 1500.00,
        accountId: 'acc-test-3',
        sourceAccountId: 'acc-test-1',
        status: 'Tamamlandı',
      },
      // Tekrarlayan İşlem Örnekleri (Akıllı Tekrarlayan Onay Bandı ve Takvim için)
      {
        id: `tx-test-${txCounter++}`,
        date: fmtDate(curY, curM, Math.max(1, now.getDate() - 1)),
        desc: 'Turkcell Fiber İnternet & TV+',
        cat: 'Fatura & Aidat',
        type: 'Gider',
        amount: 450.00,
        accountId: 'acc-test-1',
        status: 'Tamamlandı',
        isRecurring: true,
        frequency: 'monthly',
        repeatDay: now.getDate() <= 28 ? now.getDate() : 1,
        nextDueDate: fmtDate(curY, curM, Math.max(1, now.getDate() + 1)),
      },
      {
        id: `tx-test-${txCounter++}`,
        date: fmtDate(curY, curM, 5),
        desc: 'Ofis Aidatı & Güvenlik',
        cat: 'Fatura & Aidat',
        type: 'Gider',
        amount: 1250.00,
        accountId: 'acc-test-2',
        status: 'Tamamlandı',
        isRecurring: true,
        frequency: 'monthly',
        repeatDay: 5,
        nextDueDate: fmtDate(curY, curM, Math.max(1, now.getDate() - 1)),
      }
    );

    const ledgerItems = [
      {
        id: 'led-test-1',
        kind: 'receivable',
        title: 'Tasarım Hakedişi (Müşteri ABC)',
        person: 'ABC Teknoloji A.Ş.',
        total: 25000.00,
        dueDate: fmtDate(curY, curM, now.getDate() + 10),
        note: 'Mobil uygulama UI teslim hakedişi',
        payments: [],
        createdAt: fmtDate(curY, curM, 1),
      },
      {
        id: 'led-test-2',
        kind: 'receivable',
        title: 'Ahmet Yılmaz (Ödünç)',
        person: 'Ahmet Yılmaz',
        total: 15000.00,
        dueDate: fmtDate(curY, curM, now.getDate() + 4),
        note: 'Acil ihtiyaç için verilen borç',
        payments: [
          {
            id: 'pm-test-1',
            date: fmtDate(curY, curM, now.getDate() - 5),
            amount: 5000.00,
            note: '1. Kısmi Tahsilat (Havale)',
            accountId: 'acc-test-1',
          },
        ],
        createdAt: fmtDate(curY, curM - 1, 20),
      },
      {
        id: 'led-test-3',
        kind: 'payable',
        title: 'Beko Beyaz Eşya Taksiti',
        person: 'Beko Yetkili Satıcı',
        total: 24000.00,
        dueDate: fmtDate(curY, curM, now.getDate() + 3),
        note: 'Kurutma makinesi son taksit',
        payments: [
          {
            id: 'pm-test-2',
            date: fmtDate(curY, curM - 2, 5),
            amount: 8000.00,
            note: '1. Taksit Ödemesi',
            accountId: 'acc-test-1',
          },
          {
            id: 'pm-test-3',
            date: fmtDate(curY, curM - 1, 5),
            amount: 8000.00,
            note: '2. Taksit Ödemesi',
            accountId: 'acc-test-1',
          },
        ],
        createdAt: fmtDate(curY, curM - 2, 5),
      },
      {
        id: 'led-test-4',
        kind: 'payable',
        title: 'Mehmet Demir Borç Payı',
        person: 'Mehmet Demir',
        total: 6000.00,
        dueDate: fmtDate(curY, curM, now.getDate() - 2),
        note: 'Ortak seyahat masraf payı',
        payments: [],
        createdAt: fmtDate(curY, curM - 1, 10),
      },
    ];

    const savingsGoals = [
      {
        id: 'sg-test-1',
        name: 'Acil Durum Fonu',
        targetAmount: 60000,
        currentAmount: 38500,
        targetDate: fmtDate(curY + 1, 11, 31),
        color: '#2563EB',
      },
      {
        id: 'sg-test-2',
        name: 'Yeni MacBook Pro M4',
        targetAmount: 75000,
        currentAmount: 52000,
        targetDate: fmtDate(curY, 11, 31),
        color: '#10B981',
      },
      {
        id: 'sg-test-3',
        name: 'Yaz Tatili Kumbarası',
        targetAmount: 35000,
        currentAmount: 14000,
        targetDate: fmtDate(curY + 1, 5, 30),
        color: '#F59E0B',
      },
    ];

    const vaultProfile = {
      username: 'Test Kullanıcısı',
      avatarDataUrl: '',
      pin: '000000',
      theme: 'light',
      currency: 'TRY',
      language: 'tr',
      startInPrivacyMode: false,
    };

    return {
      accounts,
      tx,
      ledgerItems,
      savingsGoals,
      vaultProfile,
    };
  }

  /* ---------------- Merkezi Durum Nesnesi (State) ---------------- */
  const listeners = new Map();

  const State = {
    // Veri Modelleri
    isTestMode: false,
    accounts: [],
    tx: [],
    ledgerItems: [],
    savingsGoals: [],
    selectedAccountId: null,
    activeSegment: 'all',
    activeDrawerItemId: null,
    modalTxType: 'Gider',
    vaultProfile: {
      username: 'Usta',
      avatarDataUrl: '',
      pin: '000000',
      theme: 'light',
      currency: 'TRY',
      language: 'tr',
      startInPrivacyMode: false,
    },

    // Kasa / Mod İzolasyon Anahtarı
    getKey(name) {
      return State.isTestMode ? `test_${name}` : name;
    },

    // Yardımcı Fonksiyonlar
    round2,
    parseMoney,
    tryFmt,
    shortTry,
    daysTo,
    formatDuePill,
    esc,
    initials,
    bankShortCode,
    safeRun,
    showToast,
    ACCENT_PALETTE,
    DASH_DONUT_COLORS,
    paidAmount,
    remainingAmount,
    isArchived,

    // Getter & Setter Kolaylaştırıcıları
    getAccounts() {
      return State.accounts;
    },
    getTransactions() {
      return State.tx;
    },
    getLedgerItems() {
      return State.ledgerItems;
    },
    getVaultProfile() {
      return State.vaultProfile;
    },
    getSelectedAccountId() {
      return State.selectedAccountId;
    },
    setSelectedAccountId(id) {
      State.selectedAccountId = id;
    },

    // Hesap Bulucu
    getAccountById(id) {
      return State.accounts.find((a) => a && a.id === id) || null;
    },

    // İşlem Etkisini Hesaplardan Güvenle Geri Alma
    revertTransactionFromAccounts(t) {
      if (!t || !t.accountId) return;
      const acc = State.getAccountById(t.accountId);
      const amt = round2(parseMoney(t.amount || 0));
      if (!acc || amt <= 0) return;

      const isTransfer = t.type === 'Transfer' || String(t.type).toLowerCase() === 'transfer';

      if (isTransfer) {
        // Hedef hesaptan tutarı geri al
        if (acc.type === 'credit') {
          acc.debt = round2(Number(acc.debt || 0) + amt);
        } else {
          acc.balance = round2(Number(acc.balance || 0) - amt);
        }
        // Kaynak hesaba tutarı iade et
        if (t.sourceAccountId) {
          const srcAcc = State.getAccountById(t.sourceAccountId);
          if (srcAcc) {
            if (srcAcc.type === 'credit') {
              srcAcc.debt = Math.max(0, round2(Number(srcAcc.debt || 0) - amt));
            } else {
              srcAcc.balance = round2(Number(srcAcc.balance || 0) + amt);
            }
            if (Array.isArray(srcAcc.transactions)) {
              srcAcc.transactions = srcAcc.transactions.filter((x) => x && x.id !== t.id && x.desc !== t.desc);
            }
          }
        }
      } else if (t.type === 'Kart Borcu Ödeme') {
        acc.debt = round2(Number(acc.debt || 0) + amt);
        if (t.sourceAccountId && t.sourceAccountId !== 'external') {
          const srcAcc = State.getAccountById(t.sourceAccountId);
          if (srcAcc) {
            srcAcc.balance = round2(Number(srcAcc.balance || 0) + amt);
            if (Array.isArray(srcAcc.transactions)) {
              srcAcc.transactions = srcAcc.transactions.filter((x) => x && x.id !== t.id && x.desc !== t.desc);
            }
          }
        }
      } else if (acc.type === 'credit') {
        if (t.type === 'Gider') {
          acc.debt = Math.max(0, round2(Number(acc.debt || 0) - amt));
        } else {
          acc.debt = round2(Number(acc.debt || 0) + amt);
        }
      } else {
        if (t.type === 'Gelir') {
          acc.balance = round2(Number(acc.balance || 0) - amt);
        } else {
          acc.balance = round2(Number(acc.balance || 0) + amt);
        }
      }
      if (Array.isArray(acc.transactions)) {
        acc.transactions = acc.transactions.filter((x) => x && x.id !== t.id && x.desc !== t.desc);
      }
    },

    // Defter İşlemleri
    addLedgerItem(item) {
      State.ledgerItems.unshift(item);
      State.saveLedger();
    },
    updateLedgerItem(id, updates) {
      const item = State.ledgerItems.find((x) => x.id === id);
      if (item) {
        Object.assign(item, updates);
        State.saveLedger();
      }
      return item;
    },
    deleteLedgerItem(id) {
      const item = State.ledgerItems.find((x) => x && x.id === id);
      if (!item) return false;

      const partyName = item.party || 'Borç / Alacak';
      const prevLedger = [...State.ledgerItems];
      const prevAccounts = JSON.parse(JSON.stringify(State.accounts));
      const prevTx = [...State.tx];

      try {
        // Varsa bu borç kaydına bağlı ödemeleri varlık hesaplarından geri al
        if (Array.isArray(item.payments) && item.payments.length > 0) {
          item.payments.forEach((pm) => {
            if (window.Vaulty?.DebtPayDesk?.revertLedgerPaymentFromAsset) {
              window.Vaulty.DebtPayDesk.revertLedgerPaymentFromAsset(item, pm);
            } else if (window.revertLedgerPaymentFromAsset) {
              window.revertLedgerPaymentFromAsset(item, pm);
            }
          });
        }

        State.ledgerItems = State.ledgerItems.filter((x) => x && x.id !== id);

        const okLedger = window.vaultStore.set(State.getKey('debtLedger'), State.ledgerItems);
        const okAcc = window.vaultStore.set(State.getKey('vaultAccounts'), State.accounts);
        const okTx = window.vaultStore.set(State.getKey('transactionsTr'), State.tx);

        if (!okLedger || !okAcc || !okTx) {
          throw new Error('Diske (%APPDATA%\\Vaulty\\vault.json) yazma başarısız oldu.');
        }

        State.emit('ledger:changed', State.ledgerItems);
        State.emit('accounts:changed', State.accounts);
        State.emit('transactions:changed', State.tx);
        State.showToast(`"${partyName}" kaydı güvenle silindi ve diskle eşitlendi.`);
        return true;
      } catch (err) {
        // Hata durumunda rollback yap
        State.ledgerItems = prevLedger;
        State.accounts = prevAccounts;
        State.tx = prevTx;
        State.showToast(`Hata: Borç/alacak kaydı silinemedi! ${err.message || ''}`);
        console.error('deleteLedgerItem persistence error:', err);
        return false;
      }
    },
    deleteDebt(id) {
      return State.deleteLedgerItem(id);
    },

    // İşlem Kayıtları
    addTransaction(t) {
      State.tx.unshift(t);
      State.saveTransactions();
    },
    deleteTransaction(id, skipConfirm = false) {
      const target = State.tx.find((x) => x && x.id === id);
      if (!target) return false;

      const prevTx = [...State.tx];
      const prevAccounts = JSON.parse(JSON.stringify(State.accounts));

      try {
        State.revertTransactionFromAccounts(target);
        State.tx = State.tx.filter((x) => x && x.id !== id);

        const okTx = window.vaultStore.set(State.getKey('transactionsTr'), State.tx);
        const okAcc = window.vaultStore.set(State.getKey('vaultAccounts'), State.accounts);

        if (!okTx || !okAcc) {
          throw new Error('Diske (%APPDATA%\\Vaulty\\vault.json) yazma başarısız oldu.');
        }

        State.emit('transactions:changed', State.tx);
        State.emit('accounts:changed', State.accounts);
        State.showToast(`"${target.desc}" işlemi silindi ve hesap bakiyesi diskte güncellendi.`);
        return true;
      } catch (err) {
        State.tx = prevTx;
        State.accounts = prevAccounts;
        State.emit('transactions:changed', State.tx);
        State.emit('accounts:changed', State.accounts);
        State.showToast(`Hata: İşlem silinemedi! ${err.message || ''}`);
        console.error('deleteTransaction persistence error:', err);
        return false;
      }
    },

    deleteInstallmentGroup(groupId) {
      if (!groupId) return false;
      const groupTxs = State.tx.filter((x) => x && x.installment?.groupId === groupId);
      if (groupTxs.length === 0) return false;

      const firstTx = groupTxs[0];
      const acc = firstTx ? State.getAccountById(firstTx.accountId) : null;
      const totalAmt = Number(firstTx?.installment?.totalAmount || 0);

      if (acc && acc.type === 'credit' && totalAmt > 0) {
        acc.debt = Math.max(0, round2(Number(acc.debt || 0) - totalAmt));
      } else {
        groupTxs.forEach((t) => State.revertTransactionFromAccounts(t));
      }

      State.tx = State.tx.filter((x) => !(x && x.installment?.groupId === groupId));

      State.saveTransactions();
      State.saveAccounts();
      State.showToast(`Tüm taksit grubu (${groupTxs.length} taksit) başarıyla silindi.`);
      return true;
    },

    // Hesap ve Varlık Silme
    deleteAccount(id) {
      const acc = State.getAccountById(id);
      if (!acc) return false;

      const nickname = acc.nickname || 'Hesap';
      const prevAccounts = JSON.parse(JSON.stringify(State.accounts));
      const prevTx = [...State.tx];
      const prevSelected = State.selectedAccountId;

      try {
        State.accounts = State.accounts.filter((x) => x && x.id !== id);
        State.tx = State.tx.filter((x) => x && x.accountId !== id && x.sourceAccountId !== id);

        if (State.selectedAccountId === id) {
          State.selectedAccountId = State.accounts.length > 0 ? State.accounts[0].id : null;
        }

        const okAcc = window.vaultStore.set(State.getKey('vaultAccounts'), State.accounts);
        const okTx = window.vaultStore.set(State.getKey('transactionsTr'), State.tx);

        if (!okAcc || !okTx) {
          throw new Error('Diske (%APPDATA%\\Vaulty\\vault.json) yazma başarısız oldu.');
        }

        State.emit('accounts:changed', State.accounts);
        State.emit('transactions:changed', State.tx);
        State.showToast(`"${nickname}" hesabı ve bağlı hareketleri kalıcı olarak silindi.`);
        return true;
      } catch (err) {
        State.accounts = prevAccounts;
        State.tx = prevTx;
        State.selectedAccountId = prevSelected;
        State.showToast(`Hata: Hesap silinemedi! ${err.message || ''}`);
        console.error('deleteAccount persistence error:', err);
        return false;
      }
    },

    // Olay Dinleyici (Pub/Sub)
    on(event, callback) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(callback);
      return () => listeners.get(event)?.delete(callback);
    },

    emit(event, data) {
      if (listeners.has(event)) {
        for (const cb of listeners.get(event)) {
          try {
            cb(data);
          } catch (err) {
            console.error(`[State.emit] Event "${event}" listener error:`, err);
          }
        }
      }
    },

    // Veri Yükleyiciler
    loadAccounts() {
      try {
        const raw = window.vaultStore.get(State.getKey('vaultAccounts'), []);
        const list = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []);
        State.accounts = Array.isArray(list) ? list.map(normalizeAccount).filter(Boolean) : [];
      } catch (err) {
        console.error('loadAccounts hydration error:', err);
        State.accounts = [];
      }
      return State.accounts;
    },

    saveAccounts() {
      window.vaultStore.set(State.getKey('vaultAccounts'), State.accounts);
      State.emit('accounts:changed', State.accounts);
    },

    loadTransactions() {
      try {
        const raw = window.vaultStore.get(State.getKey('transactionsTr'), []);
        const list = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []);
        State.tx = Array.isArray(list) ? list.map(normalizeTransaction).filter(Boolean) : [];
      } catch (err) {
        console.error('loadTransactions hydration error:', err);
        State.tx = [];
      }
      return State.tx;
    },

    saveTransactions() {
      window.vaultStore.set(State.getKey('transactionsTr'), State.tx);
      State.emit('transactions:changed', State.tx);
    },

    loadDebts() {
      try {
        const raw = window.vaultStore.get(State.getKey('debtLedger'), []);
        const list = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []);
        State.ledgerItems = Array.isArray(list) ? list.map(normalizeDebtItem).filter(Boolean) : [];
      } catch (err) {
        console.error('loadDebts hydration error:', err);
        State.ledgerItems = [];
      }
      return State.ledgerItems;
    },

    saveLedger() {
      window.vaultStore.set(State.getKey('debtLedger'), State.ledgerItems);
      State.emit('ledger:changed', State.ledgerItems);
    },

    loadVaultProfile() {
      try {
        const defaultProf = State.isTestMode
          ? { username: 'Test Kullanıcısı', avatarDataUrl: '', pin: '000000', theme: 'light', currency: 'TRY', language: 'tr', startInPrivacyMode: false }
          : { username: 'Usta', avatarDataUrl: '', pin: '000000', theme: 'light', currency: 'TRY', language: 'tr', startInPrivacyMode: false };
        const prof = window.vaultStore.get(State.getKey('vaultProfile'), defaultProf);
        if (prof && typeof prof === 'object') {
          State.vaultProfile = Object.assign({}, defaultProf, prof);
        } else {
          State.vaultProfile = defaultProf;
        }
      } catch (err) {
        console.error('loadVaultProfile error:', err);
      }
      if (!State.vaultProfile.pin) {
        State.vaultProfile.pin = '000000';
        State.saveVaultProfile();
      }
      return State.vaultProfile;
    },

    saveVaultProfile() {
      window.vaultStore.set(State.getKey('vaultProfile'), State.vaultProfile);
      State.emit('profile:changed', State.vaultProfile);
    },

    // Birikim Hedefleri & Kumbaralar (Savings Pots)
    loadSavingsGoals() {
      try {
        const defaultGoals = [
          {
            id: 'pot-emergency',
            name: 'Acil Durum Fonu',
            targetAmount: 50000,
            currentAmount: 22500,
            targetDate: '2027-12-31',
            color: '#10B981',
            icon: 'shield',
          },
          {
            id: 'pot-laptop',
            name: 'Yeni Laptop & Ekipman',
            targetAmount: 45000,
            currentAmount: 18000,
            targetDate: '2027-06-30',
            color: '#3B82F6',
            icon: 'laptop',
          },
        ];
        const raw = window.vaultStore.get(State.getKey('vaultSavingsGoals'), defaultGoals);
        State.savingsGoals = Array.isArray(raw) ? raw : defaultGoals;
      } catch (err) {
        console.error('loadSavingsGoals error:', err);
        State.savingsGoals = [];
      }
      return State.savingsGoals;
    },
    saveSavingsGoals() {
      window.vaultStore.set(State.getKey('vaultSavingsGoals'), State.savingsGoals);
      State.emit('savings:changed', State.savingsGoals);
    },
    getSavingsGoals() {
      return State.savingsGoals || [];
    },
    setSavingsGoal(goal) {
      if (!goal || !goal.name) return false;
      State.savingsGoals = State.savingsGoals || [];
      const idx = goal.id ? State.savingsGoals.findIndex((g) => g.id === goal.id) : -1;
      const existing = idx >= 0 ? State.savingsGoals[idx] : null;
      const item = {
        id: goal.id || 'pot-' + Date.now(),
        name: goal.name,
        targetAmount: round2(parseMoney(goal.targetAmount || 0)),
        currentAmount: round2(parseMoney(goal.currentAmount !== undefined ? goal.currentAmount : (existing ? existing.currentAmount : 0))),
        targetDate: goal.targetDate || '2027-12-31',
        color: goal.color || '#3B82F6',
        icon: goal.icon || 'star',
      };
      if (idx >= 0) {
        State.savingsGoals[idx] = item;
      } else {
        State.savingsGoals.push(item);
      }
      State.saveSavingsGoals();
      return true;
    },
    addSavingsGoal(goal) {
      return State.setSavingsGoal(goal);
    },
    deleteSavingsGoal(goalId) {
      State.savingsGoals = (State.savingsGoals || []).filter((g) => g.id !== goalId);
      State.saveSavingsGoals();
      return true;
    },
    depositToSavingsGoal(goalId, amount, fromAccountId) {
      const amt = round2(parseMoney(amount));
      if (amt <= 0) return { ok: false, msg: 'Geçersiz tutar' };
      const goal = (State.savingsGoals || []).find((g) => g.id === goalId);
      if (!goal) return { ok: false, msg: 'Kumbara bulunamadı' };
      const acc = State.getAccountById(fromAccountId);
      if (!acc) return { ok: false, msg: 'Kaynak hesap seçilmedi' };

      if (acc.type !== 'credit' && amt > Number(acc.balance || 0) + 0.005) {
        return { ok: false, msg: `Yetersiz hesap bakiyesi (${tryFmt(acc.balance)})` };
      }

      if (acc.type === 'credit') {
        acc.debt = round2(Number(acc.debt || 0) + amt);
      } else {
        acc.balance = round2(Number(acc.balance || 0) - amt);
      }
      goal.currentAmount = round2(Number(goal.currentAmount || 0) + amt);

      const potTx = {
        id: `tx-pot-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        desc: `Birikim: ${goal.name}`,
        cat: 'Birikim & Kumbara',
        type: 'Transfer',
        amount: amt,
        accountId: acc.id,
        status: 'Tamamlandı',
      };
      State.tx.unshift(potTx);

      State.saveSavingsGoals();
      State.saveAccounts();
      State.saveTransactions();
      State.showToast(`${tryFmt(amt)} "${goal.name}" kumbarasına eklendi.`);
      return { ok: true };
    },
    withdrawFromSavingsGoal(goalId, amount, toAccountId) {
      const amt = round2(parseMoney(amount));
      if (amt <= 0) return { ok: false, msg: 'Geçersiz tutar' };
      const goal = (State.savingsGoals || []).find((g) => g.id === goalId);
      if (!goal) return { ok: false, msg: 'Kumbara bulunamadı' };
      if (amt > Number(goal.currentAmount || 0) + 0.005) {
        return { ok: false, msg: `Kumbarada yeterli birikim yok (${tryFmt(goal.currentAmount)})` };
      }
      const acc = State.getAccountById(toAccountId);
      if (!acc) return { ok: false, msg: 'Hedef hesap seçilmedi' };

      goal.currentAmount = Math.max(0, round2(Number(goal.currentAmount || 0) - amt));
      if (acc.type === 'credit') {
        acc.debt = Math.max(0, round2(Number(acc.debt || 0) - amt));
      } else {
        acc.balance = round2(Number(acc.balance || 0) + amt);
      }

      const potTx = {
        id: `tx-pot-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        desc: `Kumbaradan Çekim: ${goal.name}`,
        cat: 'Birikim & Kumbara',
        type: 'Transfer',
        amount: amt,
        accountId: acc.id,
        status: 'Tamamlandı',
      };
      State.tx.unshift(potTx);

      State.saveSavingsGoals();
      State.saveAccounts();
      State.saveTransactions();
      State.showToast(`${tryFmt(amt)} "${goal.name}" kumbarasından "${acc.nickname}" hesabına aktarıldı.`);
      return { ok: true };
    },

    restoreFromBackup(payload) {
      if (!payload || typeof payload !== 'object') {
        throw new Error('Geçersiz yedek dosyası yapısı.');
      }

      const rawAccounts = payload.accounts || payload.vaultAccounts || [];
      const rawTx = payload.transactions || payload.transactionsTr || payload.tx || [];
      const rawLedger = payload.debtLedger || payload.ledgerItems || [];
      const rawGoals = payload.savingsGoals || payload.vaultSavingsGoals || payload.savings || [];
      const rawProf = payload.vaultProfile || payload.profile || null;

      if (!Array.isArray(rawAccounts) && !Array.isArray(rawTx) && !Array.isArray(rawLedger)) {
        throw new Error('Yedek dosyasında geçerli finansal veri bulunamadı.');
      }

      State.accounts = Array.isArray(rawAccounts) ? rawAccounts.map(normalizeAccount).filter(Boolean) : [];
      State.tx = Array.isArray(rawTx) ? rawTx.map(normalizeTransaction).filter(Boolean) : [];
      State.ledgerItems = Array.isArray(rawLedger) ? rawLedger.map(normalizeDebtItem).filter(Boolean) : [];

      if (Array.isArray(rawGoals) && rawGoals.length > 0) {
        State.savingsGoals = rawGoals;
      }

      if (rawProf) {
        if (typeof rawProf === 'string') {
          const namePart = rawProf.split('·')[0]?.trim();
          if (namePart) {
            State.vaultProfile.username = namePart;
          }
        } else if (typeof rawProf === 'object') {
          State.vaultProfile = Object.assign({}, State.vaultProfile, rawProf);
        }
      }

      // Kalıcı depolamaya yaz
      State.saveAccounts();
      State.saveTransactions();
      State.saveLedger();
      State.saveSavingsGoals();
      State.saveVaultProfile();

      // Global alias senkronizasyonu
      window.accounts = State.accounts;
      window.tx = State.tx;
      window.ledgerItems = State.ledgerItems;
      window.vaultProfile = State.vaultProfile;

      // Tüm bileşen ve görünümlere bildirim gönder
      State.emit('accounts:changed', State.accounts);
      State.emit('transactions:changed', State.tx);
      State.emit('ledger:changed', State.ledgerItems);
      State.emit('savings:changed', State.savingsGoals);
      State.emit('profile:changed', State.vaultProfile);
      State.emit('state:restored', {
        accountsCount: State.accounts.length,
        txCount: State.tx.length,
        ledgerCount: State.ledgerItems.length,
        savingsCount: (State.savingsGoals || []).length,
      });

      safeRun(() => window.Vaulty.Views?.Overview?.render?.(), 'Overview.render');
      safeRun(() => window.Vaulty.Views?.Transactions?.render?.(), 'Transactions.render');
      safeRun(() => window.Vaulty.Views?.Debts?.render?.(), 'Debts.render');
      safeRun(() => window.Vaulty.Views?.Assets?.render?.(), 'Assets.render');
      safeRun(() => window.Vaulty.Views?.Calendar?.render?.(), 'Calendar.render');
      safeRun(() => window.Vaulty.AccountModals?.renderProfileIdentityUI?.(), 'renderProfileIdentityUI');

      return {
        accountsCount: State.accounts.length,
        txCount: State.tx.length,
        ledgerCount: State.ledgerItems.length,
        savingsCount: (State.savingsGoals || []).length,
      };
    },

    setTestMode(enabled) {
      State.isTestMode = Boolean(enabled);
      window.vaultStore.set('vaultActiveMode', State.isTestMode ? 'test' : 'primary');

      if (State.isTestMode) {
        const existing = window.vaultStore.get('test_vaultAccounts', null);
        if (!existing || (Array.isArray(existing) && existing.length === 0)) {
          State.resetTestData(true);
        } else {
          State.init();
        }
        State.showToast('🧪 Test Hesabı (Demo Modu) aktif edildi. Kişisel kasanız koruma altında.');
      } else {
        State.init();
        State.showToast('Kişisel kasanıza dönüldü.');
      }

      State.syncModeUI();
      State.emit('mode:changed', State.isTestMode);
      State.emit('accounts:changed', State.accounts);
      State.emit('transactions:changed', State.tx);
      State.emit('ledger:changed', State.ledgerItems);
      State.emit('savings:changed', State.savingsGoals);
      State.emit('profile:changed', State.vaultProfile);

      safeRun(() => window.Vaulty.Views?.Overview?.render?.(), 'Overview.render');
      safeRun(() => window.Vaulty.Views?.Transactions?.render?.(), 'Transactions.render');
      safeRun(() => window.Vaulty.Views?.Debts?.render?.(), 'Debts.render');
      safeRun(() => window.Vaulty.Views?.Assets?.render?.(), 'Assets.render');
      safeRun(() => window.Vaulty.Views?.Calendar?.render?.(), 'Calendar.render');
    },

    resetTestData(silent = false) {
      const sample = createTestSampleData();
      window.vaultStore.set('test_vaultAccounts', sample.accounts);
      window.vaultStore.set('test_transactionsTr', sample.tx);
      window.vaultStore.set('test_debtLedger', sample.ledgerItems);
      window.vaultStore.set('test_vaultSavingsGoals', sample.savingsGoals);
      window.vaultStore.set('test_vaultProfile', sample.vaultProfile);

      State.init();

      State.syncModeUI();
      State.emit('mode:changed', State.isTestMode);
      State.emit('accounts:changed', State.accounts);
      State.emit('transactions:changed', State.tx);
      State.emit('ledger:changed', State.ledgerItems);
      State.emit('savings:changed', State.savingsGoals);
      State.emit('profile:changed', State.vaultProfile);

      safeRun(() => window.Vaulty.Views?.Overview?.render?.(), 'Overview.render');
      safeRun(() => window.Vaulty.Views?.Transactions?.render?.(), 'Transactions.render');
      safeRun(() => window.Vaulty.Views?.Debts?.render?.(), 'Debts.render');
      safeRun(() => window.Vaulty.Views?.Assets?.render?.(), 'Assets.render');
      safeRun(() => window.Vaulty.Views?.Calendar?.render?.(), 'Calendar.render');

      if (!silent) {
        State.showToast('🔄 Test verileri başarıyla ilk haline sıfırlandı.');
      }
    },

    syncModeUI() {
      const isTest = State.isTestMode;
      const toggleBtn = document.getElementById('toggleTestModeBtn');
      const activeBar = document.getElementById('testModeActiveBar');
      const envBadge = document.getElementById('titlebarEnvBadge');
      const popoverToggle = document.getElementById('popoverTestToggleBtn');
      const popoverToggleText = document.getElementById('popoverTestToggleText');
      const popoverReset = document.getElementById('popoverResetTestBtn');

      if (toggleBtn) {
        toggleBtn.style.display = isTest ? 'none' : 'inline-flex';
      }
      if (activeBar) {
        activeBar.style.display = isTest ? 'inline-flex' : 'none';
      }
      if (envBadge) {
        if (isTest) {
          envBadge.innerHTML = '<i class="dot dot--amber" style="background:#D97706;"></i>Test Kasası · İzolasyon';
          envBadge.style.background = '#FFFBEB';
          envBadge.style.borderColor = '#FDE68A';
          envBadge.style.color = '#B45309';
        } else {
          envBadge.innerHTML = '<i class="dot"></i>Yerel Kasa · Şifreli';
          envBadge.style.background = '';
          envBadge.style.borderColor = '';
          envBadge.style.color = '';
        }
      }
      if (popoverToggle && popoverToggleText) {
        if (isTest) {
          popoverToggle.dataset.action = 'exit-test-mode';
          popoverToggleText.textContent = '✕ Kişisel Hesabıma Dön';
        } else {
          popoverToggle.dataset.action = 'enter-test-mode';
          popoverToggleText.textContent = '🧪 Test Hesabına Geç';
        }
      }
      if (popoverReset) {
        popoverReset.style.display = isTest ? 'flex' : 'none';
      }

      if (window.Vaulty.Sidebar?.renderProfileIdentityUI) {
        window.Vaulty.Sidebar.renderProfileIdentityUI();
      }
    },

    bindTestModeEvents() {
      if (document.body.dataset.boundTestModeEvents) return;
      document.body.dataset.boundTestModeEvents = 'true';

      document.addEventListener('click', async (e) => {
        const btn = e.target.closest('#toggleTestModeBtn, #resetTestDataBtn, #exitTestModeBtn, [data-action="enter-test-mode"], [data-action="reset-test-mode"], [data-action="exit-test-mode"]');
        if (!btn) return;
        e.preventDefault();

        if (btn.id === 'toggleTestModeBtn' || btn.dataset.action === 'enter-test-mode') {
          State.setTestMode(true);
        } else if (btn.id === 'resetTestDataBtn' || btn.dataset.action === 'reset-test-mode') {
          let ok = false;
          if (window.Vaulty?.confirm) {
            ok = await window.Vaulty.confirm({
              title: 'Test Verilerini Sıfırla',
              message: 'Test hesabındaki tüm işlemleri sıfırlayıp örnek başlangıç verilerine dönmek istediğinize emin misiniz?',
              confirmText: 'Sıfırla',
              cancelText: 'Vazgeç',
              type: 'warning',
            });
          } else {
            ok = confirm('Test hesabındaki tüm işlemleri sıfırlayıp örnek başlangıç verilerine dönmek istediğinize emin misiniz?');
          }
          if (ok) {
            State.resetTestData(false);
          }
        } else if (btn.id === 'exitTestModeBtn' || btn.dataset.action === 'exit-test-mode') {
          State.setTestMode(false);
        }
      });
    },

    // Tüm Durumu Başlatma
    init() {
      const activeMode = window.vaultStore.get('vaultActiveMode', 'primary');
      State.isTestMode = activeMode === 'test';

      State.loadAccounts();
      State.loadTransactions();
      State.loadDebts();
      State.loadVaultProfile();
      State.loadSavingsGoals();

      if (State.accounts.length > 0 && !State.accounts.some((a) => a && a.id === State.selectedAccountId)) {
        State.selectedAccountId = State.accounts[0].id;
      }

      State.syncModeUI();
      State.bindTestModeEvents();
    },
  };

  window.Vaulty = window.Vaulty || {};
  window.Vaulty.State = State;
  window.Vaulty.deleteTransaction = State.deleteTransaction;
  window.Vaulty.deleteDebt = State.deleteDebt;
  window.Vaulty.deleteLedgerItem = State.deleteLedgerItem;
  window.Vaulty.deleteAccount = State.deleteAccount;
  window.Vaulty.setTestMode = State.setTestMode;
  window.Vaulty.resetTestData = State.resetTestData;

  // Global window bindings
  window.deleteTransaction = State.deleteTransaction;
  window.deleteDebt = State.deleteDebt;
  window.deleteLedgerItem = State.deleteLedgerItem;
  window.deleteAccount = State.deleteAccount;
  window.setTestMode = State.setTestMode;
  window.resetTestData = State.resetTestData;
})();

