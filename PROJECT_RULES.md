# PROJECT_RULES.md — DENİZ-NAV Geliştirme Kuralları

> Bu dosya projenin tüm yaşam döngüsü boyunca geçerlidir.
> Hiçbir AI asistanı veya geliştirici bu kuralları ihlal edemez.

---

## 1. KESİN OFFLINE-FIRST MİMARİ

- Bu uygulama **açık denizde, sıfır internet bağlantısıyla** çalışmak zorundadır.
- Tam bir **PWA (Progressive Web App)** olarak yapılandırılacaktır.
- Tarayıcı üzerinden cihazın **dahili GPS donanımına** erişecektir (Geolocation API).
- Service Worker tüm kritik varlıkları (assets) önbelleğe alacaktır.
- Uygulama ilk yüklemeden sonra tamamen offline çalışabilir olmalıdır.

## 2. OPTİMİZE DEPOLAMA

- Harita katmanları (OpenSeaMap vb.) **asla raster tile olarak tutulmayacaktır**.
- Disk şişmesini engellemek için yalnızca **Vector Tiles** (PMTiles formatı) kullanılacaktır.
- GRIB verileri **en sıkıştırılmış haliyle** işlenecektir.
- Gereksiz dosya kopyalama, cache duplikasyonu ve büyük blob depolamadan kaçınılacaktır.
- Hedef depolama bütçesi: harita verileri ≤ 500MB, GRIB cache ≤ 100MB.

## 3. VERİ KALICILIĞI VE SENKRONİZASYON

- Rota, favori demirleme yeri, waypoint gibi kullanıcı verileri **IndexedDB**'de persistent (kalıcı) olarak tutulacaktır.
- `navigator.storage.persist()` ile tarayıcının storage eviction yapması engellenecektir.
- İnternet bağlantısı bulunduğu anda **Supabase** ile senkronizasyon yapılacaktır.
- Çakışma çözümleme stratejisi: **last-write-wins + timestamp**.

## 4. HALÜSİNASYON VE SAHTE KÜTÜPHANE YASAĞI

- Önerilen her NPM paketi veya GitHub reposunun **gerçekten var olduğu ve güncel olduğu** doğrulanacaktır.
- Hayali, uydurma eklentiler (örn: `react-marine-wind`, `offline-grib-parser`) **kesinlikle kullanılmayacaktır**.
- Her bağımlılık eklenmeden önce npm registry'de varlığı kontrol edilecektir.

## 5. ANTIGRAVITY KOMUT SINIRI

- Terminal işlemleri için yalnızca **standart Git, Node.js, pnpm** komutları kullanılacaktır.
- Uydurma IDE veya CLI komutları verilmeyecektir.
- Tüm komutlar çalıştırılmadan önce doğrulanacaktır.

## 6. ADIM ADIM İLERLEME (KOD KUSMA YASAĞI)

- Geliştirici açıkça **"Bana tam kodu ver"** komutu vermediği sürece, uzun kod blokları yazılmayacaktır.
- Sadece bir sonraki mantıksal adım, kurulacak kütüphane veya değiştirilecek dosya yapısı açıklanacaktır.
- Geliştirici onayı beklenmeden bir sonraki adıma geçilmeyecektir.

---

## Proje Bilgileri

| Alan | Değer |
|---|---|
| **Hedef Bölge** | Edremit Körfezi (Burhaniye, Edremit, Ayvalık) |
| **Hedef Cihaz** | Cep telefonu (mobile-first, dokunmatik) |
| **Donanım** | Apple M2, 16GB RAM |
| **Depolama** | Harici Verbatim SSD (kısıtlı I/O) |
| **Framework** | Vite + React + TypeScript |
| **Paket Yöneticisi** | pnpm |
| **Repo** | github.com/frkncoder/deniz-nav |

---

*Bu dosya proje boyunca güncellenebilir ancak mevcut kurallar gevşetilemez.*
