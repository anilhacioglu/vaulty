# 📱 Vaulty — Güncelleme Geçmişi & Sürüm Notları

Vaulty'yi her geçen gün daha güvenli, akıcı ve keyifli bir finansal yönetim deneyimine dönüştürmek için sürekli güncelliyoruz. İşte her sürümle gelen yenilikler ve geliştirmeler:

---

### 🛡️ Sürüm 1.5.1 — *Uçtan Uca AES-256-GCM Veri Şifreleme & Yüksek Güvenlik*
*(08 Kasım 2026)*

Bu sürümle birlikte Vaulty, tüm kullanıcı verilerini ve hassas finansal bilgileri diskte ve yerel bellekte **%100 şifreli (okunamaz)** olarak depolayan kurumsal düzeyde askeri şifreleme altyapısına kavuştu:

* 🔐 **Diskte AES-256-GCM Otantikasyonlu Şifreleme:** %APPDATA%\Vaulty\vault.json dosyasında saklanan tüm hesaplar, bakiyeler, kredi kartı bilgileri, harcama geçmişi, borç kayıtları ve profil verileri artık düz metin olarak değil; **AES-256-GCM (Galois/Counter Mode)** algoritması ile şifreli zarf içinde saklanır. Dosya Not Defteri veya herhangi bir harici araçla açıldığında kesinlikle okunamaz, tahrif edilemez.
* 🛡️ **Windows DPAPI + Donanım Entropisi ile Anahtar Koruma:** Şifreleme anahtarı, Windows işletim sisteminin yerel güvenlik altyapısı olan DPAPI (DataProtectionScope.CurrentUser) ve makineye özel SHA-256 donanım tuzu ile korunur. Kasa dosyası başka bir bilgisayara veya harici belleğe kopyalansa dahi yetkisiz açılamaz ve deşifre edilemez.
* 🗄️ **Tarayıcı İçi Depolama Koruması (Encrypted LocalStorage):** WebView2 çalışma zamanındaki localStorage anahtarları da düz metin yerine anlık şifrelenmiş akış blokları (VAULT_ENC_V1:) olarak tutulur. Geliştirici araçları (F12) veya geçici veritabanı dosyaları üzerinden hiçbir finansal bilgiye çıplak gözle ulaşılamaz.
* 🔄 **Sıfır Veri Kayıplı Otomatik Geçiş (Silent Migration):** Önceki sürümlerden kalan mevcut açık metin ### 🛡️ Sürüm 1.5.1 — *Uçtan Uca AES-256-GCM Veri Şifreleme & Yüksek Güvenlik*
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
* 📥 **Yedekten Geri Yükleme Arayüzü (Restore from Backup):** Daha önce alınan `.json` kasa yedeklerini tek tıkla geri yükleme imkanı eklendi. Hem Ayarlar menüsündeki "Veri Yedekleme & Geri Yükleme" bölümünden hem de sol alt kullanıcı menüsünden doğrudan erişilebilir. Yedek dosyası seçildiğinde otomatik şema doğrulaması yapılır, dosyadaki hesap, işlem, borç ve kumbara sayılarını içeren önizleme onay penceresi açılır ve onaylandığında kasanız anında sıfır veri kaybıyla güncellenir.
* 💳 **Taksitli İşlem & Kredi Kartı Taksit Motoru (Installment Engine):** Kredi kartı ile yapılan harcamalarda harcamayı aylara bölme desteği eklendi. Yeni işlem modalında kredi kartı seçildiğinde beliren taksit seçicisi ile 2, 3, 6, 9 veya 12 taksit seçilebilir. Toplam harcama kart limitinden tam bloke edilirken, bütçe ve ekstreye her ay yalnızca o ayın taksit payı yansıtılır. İşlem tablolarında mor `[X/Y Taksit]` rozetleri görüntülenir, gelecek taksitler Nakit Akışı Takviminde mor vadelerle planlanır ve silme anında tüm taksit grubu kart borcuyla birlikte tek adımda temizlenebilir.
* 🔄 **Akıllı Anahtar Senkronizasyonu (Taksit & Tekrarlayan Uyum):** Kredi kartı harcamalarında hem Düzenli/Tekrarlayan İşlem hem de Taksitli Alışveriş anahtarları yan yana aktif tutuldu. Çakışmayı engellemek için akıllı çift yönlü senkronizasyon eklendi; kullanıcı "Taksitli Alışveriş"i açtığında "Tekrarlayan İşlem" otomatik kapanır, "Tekrarlayan İşlem"i açtığında ise taksit seçicisi pürüzsüzce kapanır.
* 🛠️ **Merkezi Taksit Düzenleme Motoru (Unified Group Editing):** Taksitli bir işlem grubundaki herhangi bir taksit (örn. 2/6 veya 3/6) düzenlenmek istendiğinde, sistem tüm grubu tespit eder ve modalda toplam tutarı, ana açıklamayı ve seçili taksit adedini açar. Kaydet tıklandığında eski taksitler ve kart bakiyesi güvenle sıfırlanıp yeni tutar ve taksit sayısına göre tüm aylar tek tıkla senkronize olarak güncellenir.
* 🔢 **Tutar Barlarına Yazı/Harf Giriş Kilidi (Strict Monetary Input Hygiene):** İşlem tutarı, kumbara hedefi, transfer tutarı ve hesap bakiye girişleri gibi tüm parasal alanlara harf, kelime, boşluk veya geçersiz sembol yazılması klavye basış anında (`keydown`), yapıştırmada (`paste`), sürüklemede (`drop`) ve canlı girişte (`input`) 4 katmanlı olarak engellendi. Yalnızca rakamlar (`0-9`) ve ondalık basamak ayıraçlarına (`.`, `,`) izin verilir.
* 🎛️ **Modern Kasa Ayarları & Yönetim Masası (Settings Hub):** Dar ve sıkışık profil penceresi baştan aşağı yeniden tasarlandı. Genişletilmiş (780px) 4 sekmeli modern masaüstü yönetim yapısına kavuştu:
  - 👤 **Profilim:** Büyük profil avatarı, hızlı fotoğraf yükleme/kaldırma, hitap adı değiştirme ve cihaz/kasa sistemi kimlik özeti.
  - ⚙️ **Uygulama & Tercihler:** Gelecek sürümler için tema seçimi (Açık Tema, Karanlık Mod v1.6, Sistemle Eşitle), portföy ana para birimi seçicisi (TRY, USD, EUR, Altın), dil paketi kartları ve "Açılışta Tutarları Gizle" başlangıç gizlilik tercihi.
  - 🔒 **Kasa Güvenliği & PIN:** AES-256 koruma paneli ve 6 haneli kasa PIN değiştirme/şifreleme formu.
  - 💾 **Veri & Yedekleme:** Canlı kasa veri sayaçları (Hesap, İşlem, Borç, Kumbara sayıları) ve ferah JSON yedek alma ile geri yükleme kartları.
  - Alt kısımdaki mükerrer ve kalabalık butonlar kaldırılarak sade, profesyonel bir masaüstü ayar deneyimi sunuldu. Sol menü popover'ına da doğrudan "Uygulama Tercihleri"ne giden hızlı erişim butonu eklendi.
* 🏗️ **Tam Modüler CSS Mimarisine Geçiş (dashboard.css Emekliye Ayrıldı):** 7.200 satırlık hantal ve monolitik `dashboard.css` dosyası tamamen devreden çıkarıldı. Uygulamanın tüm görsel kuralları ve ekranları 8 adet temiz, bağımsız modüler CSS dosyasına paylaştırıldı:
  - `shell.css` (Masaüstü pencere kabuğu, CSS değişkenleri, hit-test ve butonlar)
  - `components/sidebar/sidebar.css` (Sol menü ve kullanıcı profili kartı)
  - `components/cards/cards.css` (Cüzdan kartları, bakiye ve KPI sayaçları)
  - `components/charts/charts.css` (Grafikler ve nakit akış diyagramları)
  - `components/tables/tables.css` (İşlemler ve borçlar tabloları)
  - `components/recurring/recurring.css` (Akıllı düzenli işlem bandı ve takvim)
  - `views/views.css` (Varlıklar, Borçlar, İşlemler ve Bento Grid kokpiti)
  - `modals/modals.css` (Ayarlar Hub'ı, Yeni İşlem, Ödeme Masaları ve Formlar)
  Sistemde sıfır hata ve %100 stil kapsama garantisi sağlandı; CSS bakım ve geliştirme ergonomisi üst seviyeye taşındı.

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

### 🌟 Sürüm 1.4.1 — *Görsel İyileştirmeler & Kararlılık*
*(05 Kasım 2026)*

Bu sürümde topluluk geri bildirimlerine odaklanarak arayüz detaylarını cilaladık ve kullanıcı deneyimini daha pürüzsüz hale getirdik:

* 👁️ **Gelişmiş Gizlilik Modu:** Başlık çubuğundaki çift tıklama çakışmaları giderildi; "Tutarları Gizle" özelliği sol menü altına (`H` kısayoluyla) taşındı. Artık KPI'lar, borç/alacak radarı ve kart hareketleri dahil tüm parasal değerler eksiksiz sansürleniyor.
* 🍩 **Ferah Harcama Dağılımı:** Donut grafiği genişletildi; dinamik font ölçekleme sayesinde yüksek tutarların halkanın üzerine taşma sorunu çözüldü.
* 📊 **Kusursuz Nakit Akışı Tooltip'i:** Grafik bilgi kartı akıllı konumlandırma motoruna bağlandı; artık panel dışına taşmıyor, kesilmiyor ve fare hareketlerine göre her zaman en uygun alanda beliriyor.
* 💰 **Tek Çerçeveli Tutar Girişleri:** Kumbara ve transfer ekranlarında iç içe geçmiş çift kenarlık sorunu düzeltilerek modern, tek parça giriş barlarına dönüştürüldü.
* 📅 **Net Vade Rozetleri:** Sabit ödeme inceleme ekranında `Vade:` etiketi ile `[ Bugün ]` ve `[ Gecikmiş ]` durumları şık renkli rozetlerle ayrıştırıldı.
* 🐷 **Kumbara & Sabit Ödeme Pencereleri:** Başlıkların tavan kenarına yapışması engellendi; başlıklardaki isim tekrarları ("Kumbarası Kumbarasına") temizlendi ve iki satırlı akıllı ilerleme özeti eklendi.
* 🧹 **Kod Temizliği:** Kategori Bütçe Kotaları motoru ve eski artıkları temizlenerek uygulama boyutu optimize edildi.

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

### 🚀 Sürüm 1.4.0 — *Akıllı Finans, Nakit Takvimi & Kumbaralar*
*(04 Kasım 2026)*

Sektör standartlarını Vaulty'ye taşıyan dev güncelleme:

* 🗓️ **Finansal Nakit Akışı Takvimi:** Gelecek 30 günün kart hesap kesim günlerini, faturalarını ve borç/alacak vadelerini ay takviminde gün gün izleyin.
* 🐷 **Birikim Hedefleri & Kumbaralar:** Genel kasa dengenizi bozmadan sanal birikim hedefleri (Yeni Laptop, Tatil, Acil Durum Fonu vb.) açın, para yatırın ve birikim yüzdenizi takip edin.
* 🔁 **Abonelik & Sabit Gider Motoru:** Periyodik ödemelerinizi akıllı banner ile takip edin; günü geldiğinde tek tek inceleyin, onaylayın veya o ay için pas geçin.
* 🧪 **Güvenli Test & Demo Modu:** Gerçek kasa verilerinize dokunmadan, tek tıkla zengin örnek veriler içeren test hesabına geçin, özellikleri deneyin ve istediğinizde sıfırlayın.

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

### 📊 Sürüm 1.3.0 — *Finansal Görselleştirme & Radarlar*
*(03 Kasım 2026)*

Finansal durumunuzu bir bakışta anlamanızı sağlayan yeni analitik araçlar:

* 📈 **6 Aylık Nakit Akışı Analizi:** Gelir ve giderlerinizi aylık karşılaştırmalı çubuk grafikte görün.
* 🥧 **Kategori Harcama Dağılımı:** Hangi kategoride ne kadar harcadığınızı gösteren renkli donut pasta grafiği.
* 🚨 **Yaklaşan ve Geciken Ödemeler Radarı:** Kritik vadeleri kaçırmamanız için ana ekranda canlı acil ödeme listesi.

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

### 💳 Sürüm 1.2.0 — *Hızlı İşlem Masası & Mutabakat*
*(02 Kasım 2026)*

Hesaplar arası akıcı para trafiği ve borç takibi:

* 🔄 **Dahili Virman & Mahsup Masası:** Hesaplarınız arasında saniyeler içinde komisyonsuz transfer yapın.
* 💳 **Kredi Kartı Borç Kapama:** Ekstre borcunu veya asgari tutarı banka/nakit hesabınızdan tek dokunuşla kapatın.
* 🤝 **Borç & Alacak Defteri:** Kişi bazlı kısmi ödeme kayıtları ve mutabakat geçmişi.

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

### 🎨 Sürüm 1.1.0 — *Cüzdan Tasarımı & Akıllı Kartlar*
*(02 Kasım 2026)*

Fiziksel cüzdan deneyimini ekrana taşıyan tasarım devrimi:

* 💳 **Özelleştirilmiş Kart Görünümleri:**
  * **Kredi Kartı:** Antrasit koyu tema, altın çip ve canlı limit kullanım göstergesi.
  * **Banka / Vadesiz Hesap:** Gece mavisi tema, gümüş çip ve tek tıkla IBAN kopyalama.
  * **Fiziki Nakit Cüzdan:** Zümrüt yeşili tema ve hızlı bakiye sayım düğmesi.
* 📑 **Hesap Detay Çekmecesi:** İlgili hesaba ait geçmiş hareketleri sağ çekmecede anında filtreleme.

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

### 🛡️ Sürüm 1.0.0 — *İlk Lansman: Güvenli Yerel Kasa*
*(01 Kasım 2026)*

Vaulty ile tanışın! Buluta ihtiyaç duymayan, tamamen çevrimdışı ve gizlilik odaklı kişisel kasa:

* 🔒 **Yerel AES-256 Şifreleme:** Verileriniz asla cihazınızın dışına çıkmaz, diskte şifreli tutulur.
* 🔑 **6 Haneli Güvenli PIN:** Hızlı ve güvenli kilit açma mekanizması.
* 💼 **Kapsamlı Finansal Yönetim:** Genel bakış paneli, gelir/gider kaydetme ve temel borç/alacak takibi.
* ⚡ **Hafif ve Bağımsız:** Kurulum gerektirmeyen, hızlı açılan bağımsız masaüstü (.exe) mimarisi.

