# 📱 Vaulty — Güncelleme Geçmişi & Sürüm Notları

Vaulty'yi her geçen gün daha güvenli, akıcı ve keyifli bir finansal yönetim deneyimine dönüştürmek için sürekli güncelliyoruz. İşte her sürümle gelen yenilikler ve geliştirmeler:

---

### ✨ Sürüm 1.6.0 — *Yeni Modern Tasarım Dili, Koyu/Açık Tema & Tam Ekran Kokpit Deneyimi*
*(11 Kasım 2026)*

Bu sürümle Vaulty baştan aşağı yenilenen Açık/Koyu tasarım sistemine, akıcı mikro animasyonlara ve tüm ekranlarda tek bakışta net okunabilen kaydırmasız kokpit düzenine kavuştu:

* 🌗 **Yeni Açık & Koyu Tema Motoru (`theme.css` + `motion.js`):** Derin gece mavisi (`#050A1C` / `#0C1534`) ve elektrik mavisi (`#2F6BFF`) tonlarında göz yormayan Koyu Tema ile ferah Açık Tema eklendi. Üst çubuktaki tema anahtarıyla anında geçiş yapılabilir; tüm kartlar, tablolar ve grafikler seçili temayla tam uyumludur.
* 🧭 **Sadeleştirilmiş Üst Çubuk & Sol Navigasyon:** Arama çubuğu merkeze sabitlendi; tekrarlayan ödeme uyarıları ekranı titreten sabit bant yerine aşağı açılan yarı saydam kapsüle dönüştürüldü. Bildirim içeren simgeler elektrik mavisi + kırmızı köşe noktasıyla birleştirildi. Sol menüdeki gereksiz *"Bu Ay Net Akış"* kartı ve menü yanındaki sayaç rozetleri kaldırılarak temiz bir görünüm sağlandı.
* 💳 **3D Etkileşimli Cüzdan Vitrini & Kart Kaplamaları:** Banka kartı, kredi kartı ve fiziki nakit cüzdan için üç ayrı kart tasarımı geliştirildi. *Toplam Net Varlık* panelindeki 4 mini özet kutusu ve *Harcama Dağılımı* kartı boşluk bırakmayacak şekilde dengelendi.
* 📊 **Yenilenen İşlemler Ekranı:** 7 çubuklu mini grafiklere sahip KPI şeridi, hızlı işlem türü filtre hapları (`Tümü`, `Gider`, `Gelir`, `Kart Ödeme`, `Transfer`), zebra satırlı göz yormayan tablo ve sağ tarafta **Kategori Dağılımı**, **Ödeme Kanalları** ile **Dönem & Akış Nabzı** özet sütunu eklendi.
* ⚖️ **Borç & Alacak Defteri:** Ekrana kaydırmasız oturan 2 sütunlu düzene geçildi; **Denge & İlerleme** ve **Yaklaşan Vadeler** panelleri eklendi, satırlara **Alacak** / **Borç** tür etiketleri ile sol renk kenarlığı kazandırıldı.
* 🏦 **Varlıklarım & Birikim Kumbaraları:** Yinelenen büyük 3D kart sahnesi kaldırılarak Hesap Listesi, Hesap İnceleyici ve Birikim Kumbaraları tek ekranda eşit yükseklikli 3 sütunda toplandı.
* 🗓️ **Finansal Nakit Akışı Takvimi:** Takvim ızgarası 7×N eksiksiz ay görünümüne taşındı; sağ tarafa yüksekliği eşitleyen **Günlük Hareket Özeti** ve tıklanabilir **Planlı Akışlar** kartı eklendi.
* 🔐 **Giriş Ekranı PIN Maskeleme Düzeltmesi:** Açık ve koyu temada 6 haneli PIN kutularında yazılan rakamların noktaların arkasında görünmesine neden olan stil çakışması giderildi.
* 📦 **Tek Parça Bağımsız Windows Uygulaması (`Vaulty.exe v1.6.0`):** Tüm güncellemeler, tema/animasyon modülleri ve şifreleme altyapısı tek bir `Vaulty.exe` dosyası olarak derlendi.

---

### 🛡️ Sürüm 1.5.1 — *Uçtan Uca AES-256-GCM Veri Şifreleme & Yüksek Güvenlik*
*(08 Kasım 2026)*

Bu sürümle birlikte Vaulty, tüm kullanıcı verilerini ve hassas finansal bilgileri diskte ve yerel bellekte **%100 şifreli (okunamaz)** olarak depolayan kurumsal düzeyde askeri şifreleme altyapısına kavuştu:

* 🔐 **Diskte AES-256-GCM Otantikasyonlu Şifreleme:** `%APPDATA%\Vaulty\vault.json` dosyasında saklanan tüm hesaplar, bakiyeler, kredi kartı bilgileri, harcama geçmişi, borç kayıtları ve profil verileri artık düz metin olarak değil; **AES-256-GCM (Galois/Counter Mode)** algoritması ile şifreli zarf içinde saklanır. Dosya Not Defteri veya herhangi bir harici araçla açıldığında kesinlikle okunamaz, tahrif edilemez.
* 🛡️ **Windows DPAPI + Donanım Entropisi ile Anahtar Koruma:** Şifreleme anahtarı, Windows işletim sisteminin yerel güvenlik altyapısı olan DPAPI (`DataProtectionScope.CurrentUser`) ve makineye özel SHA-256 donanım tuzu ile korunur. Kasa dosyası başka bir bilgisayara veya harici belleğe kopyalansa dahi yetkisiz açılamaz ve deşifre edilemez.
* 🗄️ **Tarayıcı İçi Depolama Koruması (Encrypted LocalStorage):** WebView2 çalışma zamanındaki `localStorage` anahtarları da düz metin yerine anlık şifrelenmiş akış blokları (`VAULT_ENC_V1:`) olarak tutulur. Geliştirici araçları (F12) veya geçici veritabanı dosyaları üzerinden hiçbir finansal bilgiye çıplak gözle ulaşılamaz.
* 🔄 **Sıfır Veri Kayıplı Otomatik Geçiş (Silent Migration):** Önceki sürümlerden kalan mevcut açık metin `vault.json` dosyaları, v1.5.1 başlatıldığı anda arka planda otomatik olarak tespit edilir, belleğe aktarılır ve diske anında AES-256-GCM ile şifrelenerek yeniden yazılır. Kullanıcı hiçbir ayar veya işlem kaybetmez.
* 🎨 **Varlıklarım & Kartlar Yüksek Kontrastlı Beyaz UI Düzeltmesi:** Genel Bakış ekranındaki koyu lacivert ve koyu grafit degrade mini cüzdan kartlarında metinlerin siyah kalmasına neden olan stil çakışması giderildi; tüm bakiye, kart tipi, banka ve limit bilgileri yüksek kontrastlı, parlak beyaz tipografi ve fareyi takip eden interaktif ışık yansımasıyla optimize edildi.
* 📦 **Tek Parça Bağımsız Windows Uygulaması (Vaulty.exe v1.5.1):** Tüm güncellemeler, şifreleme modülleri ve stil dosyaları tek bir `Vaulty.exe` dosyasında birleştirilerek Windows için derlendi.

---

### ⚡ Sürüm 1.5.0 — *Kusursuz Silme Onayı & Güvenlik Deneyimi*
*(05 Kasım 2026)*

Bu sürümde işletim sisteminin yabancı ve biçimsiz tarayıcı onay pencereleri (`app.vaulty.local şunu diyor:`) tarihe karıştı; yerini Vaulty tasarım diline %100 uyumlu, modern ve güvenli onay mekanizmalarına bıraktı:

* 🛡️ **İki Aşamalı Güvenli Silme Butonları (Inline Confirmation):** Birikim hedefleri ve kumbara düzenleme ekranında "Hedefi Sil" butonuna tıklandığında, buton yerinde animasyonlu ve kırmızı parlayan `[ ⚠️ Silmeyi Onayla ]` butonuna dönüşür. İkinci tıklamayla silme anında gerçekleşir; 4 saniye içinde tıklanmazsa veya "Vazgeç" denirse otomatik olarak başlangıç haline geri döner.
* 💬 **Özel Vaulty Onay Masası (Universal Confirm Dialog):** İşlem silme, hesap kaldırma, borç defteri ödeme iptali veya test verisi sıfırlama gibi tüm aksiyonlarda; arka planı flu yapan (backdrop blur), uyarı ikonlu ve net açıklamalı yepyeni Vaulty onay penceresi devreye girer.
* 🚫 **İlkel Tarayıcı Dialoglarına Veda:** WebView2'nin siyah ve yabancı `window.confirm` popup'ları tamamen temizlendi, masaüstü uygulama hissiyatı %100 korundu.
* 📥 **Yedekten Geri Yükleme Arayüzü (Restore from Backup):** Daha önce alınan `.json` kasa yedeklerini tek tıkla geri yükleme imkanı eklendi. Hem Ayarlar menüsündeki "Veri Yedekleme & Geri Yükleme" bölümünden hem de sol alt kullanıcı menüsünden doğrudan erişilebilir.
* 💳 **Taksitli İşlem & Kredi Kartı Taksit Motoru (Installment Engine):** Kredi kartı ile yapılan harcamalarda 2, 3, 6, 9 veya 12 taksit bölme, mor `[X/Y Taksit]` rozetleri, merkezi taksit grup düzenleme ve akıllı tekrarlayan/taksit anahtarı senkronizasyonu eklendi.
* 🔢 **Tutar Barlarına Yazı/Harf Giriş Kilidi (Strict Monetary Input Hygiene):** Parasal alanlara harf ve geçersiz sembol girişi 4 katmanlı olarak engellendi.
* 🎛️ **Modern Kasa Ayarları & Yönetim Masası (Settings Hub):** 780px genişlikte 4 sekmeli (Profilim, Uygulama & Tercihler, Kasa Güvenliği & PIN, Veri & Yedekleme) ayar deneyimi sunuldu.
* 🏗️ **Tam Modüler CSS Mimarisine Geçiş:** Tekil `dashboard.css` 8 bağımsız modüler CSS dosyasına bölündü.

---

### 🌟 Sürüm 1.4.1 — *Görsel İyileştirmeler & Kararlılık*
*(05 Kasım 2026)*

* 👁️ **Gelişmiş Gizlilik Modu:** "Tutarları Gizle" özelliği sol menü altına (`H` kısayoluyla) taşındı.
* 🍩 **Ferah Harcama Dağılımı:** Donut grafiği genişletildi ve dinamik font ölçekleme eklendi.
* 📊 **Kusursuz Nakit Akışı Tooltip'i:** Grafik bilgi kartı akıllı konumlandırma motoruna bağlandı.
* 💰 **Tek Çerçeveli Tutar Girişleri & Net Vade Rozetleri:** Kumbara/transfer giriş barları tek çerçeveye alındı, vade rozetleri renklerle ayrıştırıldı.
* 🧹 **Kod Temizliği:** Kategori Bütçe Kotaları motoru kaldırılarak uygulama boyutu optimize edildi.

---

### 🚀 Sürüm 1.4.0 — *Akıllı Finans, Nakit Takvimi & Kumbaralar*
*(04 Kasım 2026)*

* 🗓️ **Finansal Nakit Akışı Takvimi:** Gelecek 30 günün kart kesim günlerini, faturalarını ve vadelerini takvimde izleme.
* 🐷 **Birikim Hedefleri & Kumbaralar:** Genel kasa dengesini bozmadan sanal birikim hedefleri oluşturma ve takip etme.
* 🔁 **Abonelik & Sabit Gider Motoru:** Periyodik ödemeleri akıllı banner ile takip ve tek tıkla onaylama.
* 🧪 **Güvenli Test & Demo Modu:** Gerçek verilere dokunmadan örnek verilerle test hesabını deneme imkanı.

---

### 📊 Sürüm 1.3.0 — *Finansal Görselleştirme & Radarlar*
*(03 Kasım 2026)*

* 📈 **6 Aylık Nakit Akışı Analizi**
* 🥧 **Kategori Harcama Dağılımı**
* 🚨 **Yaklaşan ve Geciken Ödemeler Radarı**

---

### 💳 Sürüm 1.2.0 — *Hızlı İşlem Masası & Mutabakat*
*(02 Kasım 2026)*

* 🔄 **Dahili Virman & Mahsup Masası**
* 💳 **Kredi Kartı Borç Kapama**
* 🤝 **Borç & Alacak Defteri**

---

### 🎨 Sürüm 1.1.0 — *Cüzdan Tasarımı & Akıllı Kartlar*
*(02 Kasım 2026)*

* 💳 **Özelleştirilmiş Kart Görünümleri (Kredi Kartı, Banka / Vadesiz, Fiziki Nakit Cüzdan)**
* 📑 **Hesap Detay Çekmecesi**

---

### 🛡️ Sürüm 1.0.0 — *İlk Lansman: Güvenli Yerel Kasa*
*(01 Kasım 2026)*

* 🔒 **Yerel AES-256 Şifreleme & 6 Haneli PIN**
* 💼 **Genel Bakış, Gelir/Gider & Temel Borç/Alacak Takibi**
* ⚡ **Tek Dosya Masaüstü (.exe) Mimarisi**
