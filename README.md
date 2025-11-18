# Ankara Hal Fiyatları Uygulaması

Ankara Büyükşehir Belediyesi’nin **hal fiyatları verisini** toplayan, saklayan ve
modern bir web arayüzüyle gösteren tam yığın (full‑stack) bir projedir.

Projede üç ana parça vardır:
- **Scraper (backend/scraper.py)**  
  Resmi ABB hal fiyatları sayfasından verileri çekip SQLite veritabanına yazar.
- **Backend API (backend/app.py)**  
  Veritabanındaki ürün ve fiyat bilgilerini JSON REST API olarak sunar.
- **Frontend (frontend)**  
  React + Vite tabanlı, ürün listesi, fiyat grafikleri ve alışveriş listesi içeren arayüz.

---

## Dizin Yapısı

```text
.
├── backend/              # Flask API + scraper
│   ├── app.py            # REST API
│   ├── scraper.py        # ABB hal sayfası scraper
│   ├── run_scraper.sh    # Cron ile çalıştırma örneği
│   └── README.md         # Backend'e özel detaylar
├── frontend/             # React + Vite arayüzü
│   ├── src/              # UI bileşenleri, sayfalar
│   └── package.json
├── hal_fiyatlari.db      # SQLite veritabanı (scraper tarafından oluşturulur)
└── requirements.txt      # Python bağımlılıkları (backend + scraper)
```

---

## Gereksinimler

**Backend / Scraper:**
- Python 3.10+ (tercihen 3.11 veya üstü)
- `pip` paket yöneticisi

**Frontend:**
- Node.js 18+ (önerilir)
- `npm` (veya `pnpm`, `yarn`, vb.)

Python tarafında kullanılan temel kütüphaneler (`requirements.txt`):
- Flask, Flask-Cors
- pandas
- requests
- beautifulsoup4

Frontend tarafında (`frontend/package.json`):
- React, React Router
- Vite
- Tailwind CSS
- @tanstack/react-query
- Recharts
- Zustand

---

## Hızlı Başlangıç

### 1. Backend ve Scraper’ı Kurma

Proje kök dizininden:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r ../requirements.txt
``>

Veritabanını oluşturmak ve ilk verileri çekmek için:

```bash
python scraper.py
```

Ardından Flask API’yi başlatın:

```bash
python app.py
```

Varsayılan:
- API adresi: `http://localhost:5001`
- Veritabanı: proje kökündeki `hal_fiyatlari.db`

> Daha ayrıntılı backend dökümantasyonu için: `backend/README.md`

### 2. Frontend’i Kurma ve Çalıştırma

Yeni bir terminalde:

```bash
cd frontend
npm install
npm run dev
```

Varsayılan olarak Vite:
- Uygulama: `http://localhost:5173`
- `vite.config.ts` içinde `/api` isteklerini `http://localhost:5001` adresine proxy eder.  
  Bu nedenle frontend çalışırken backend’in de çalışıyor olması gerekir.

Üretim build’i almak için:

```bash
cd frontend
npm run build
npm run preview    # build edilmiş halini test etmek için
```

---

## Backend Özeti (Flask API + Scraper)

Backend iki ana dosyadan oluşur:

- `backend/scraper.py`  
  - ABB’nin `https://www.ankara.bel.tr/hal-fiyatlari` sayfasından günlük/geriye dönük fiyatları çeker.  
  - Veriler `hal_fiyatlari.db` dosyasında şu tablolara kaydedilir:
    - `categories` (Sebze/Meyve, Balık)
    - `products` (ürün adı, birim, kategori)
    - `prices` (min/max fiyat, tarih, ürün)
  - Parametreler:
    - `--date DD.MM.YYYY` → Tek bir gün
    - `--start-date` ve `--end-date` → Tarih aralığı
    - `--db PATH` → Veritabanı yolunu değiştirme

- `backend/app.py`  
  - SQLite veritabanından okuyup JSON API olarak döner.
  - CORS açık olduğu için başka porttaki frontend’ler erişebilir.
  - Varsayılan veritabanı yolu, `HAL_DB_PATH` ortam değişkeniyle değiştirilebilir:

    ```bash
    export HAL_DB_PATH="/path/to/hal_fiyatlari.db"
    python app.py
    ```

### API Uç Noktaları

- `GET /api/products`  
  Tüm ürünleri ve her ürün için **en güncel min/max fiyatı** döner.

- `GET /api/prices/<int:id>`  
  Belirli ürünün **tüm tarihli fiyat listesini** döner (grafikte kullanmak için uygundur).

- `POST /api/shopping/cost`  
  İstek gövdesinde gönderilen ürün + miktar listesi için, güncel fiyatlara göre minimum ve maksimum toplam alışveriş tutarını hesaplar.

> Backend’in tüm detayları, tablo şemaları, örnek JSON çıktıları vb. için:
> `backend/README.md` dosyasına bakabilirsiniz.

---

## Frontend Özeti (React + Vite)

Frontend, API’den aldığı verileri kullanıcıya sunan tek sayfa uygulamasıdır.

### Mimari ve Teknolojiler

- React 18
- Vite 5
- React Router (`/` ve `/product/:id` sayfaları)
- Tailwind CSS ile sade tasarım
- @tanstack/react-query → API istekleri ve cache
- Axios → HTTP istemcisi (`frontend/src/api/client.ts`)
- Zustand → Alışveriş listesi (sepet) durumu
- Recharts → Fiyat geçmişi grafiği

### Önemli Parçalar

- `frontend/src/api/client.ts`  
  - `baseURL: "/api"` olarak ayarlı Axios istemcisi.  
  - Vite dev sunucusunda `/api` istekleri otomatik olarak `http://localhost:5001`’e yönlenir.

- `frontend/src/hooks/useProducts.ts`  
  - `GET /api/products` ile ürünleri çeker.  
  - React Query üzerinden cache yönetimi yapar.

- `frontend/src/pages/Home.tsx`  
  - “Güncel Ürün Listesi” başlığı.  
  - `ProductGrid` bileşeni ile arama ve kategori bazlı ürün listesi.

- `frontend/src/components/products/ProductGrid.tsx`  
  - Ürünleri arama kutusuna göre filtreler.  
  - Kategorilere (Sebze/Meyve, Balık) göre gruplayıp kartlar halinde gösterir.

- `frontend/src/pages/ProductPage.tsx`  
  - `/product/:id` rotası.  
  - `GET /api/prices/:id` ile ürün detayını ve fiyat geçmişini çeker.  
  - Kullanıcı miktar girip ürünü alışveriş listesine ekleyebilir.  
  - `PriceHistoryChart` ile tarihsel min/max fiyat grafiği gösterilir.

- `frontend/src/components/shopping/ShoppingList.tsx` ve `ShoppingListDrawer.tsx`  
  - Sağ üstteki sepet ikonuna tıklandığında açılan panel.  
  - Seçili ürünleri, adetleri ve tahmini min–max toplam tutarı gösterir.  
  - Zustand ile global state yönetimi.

- `frontend/src/components/Layout.tsx`  
  - Üst bar, sepet, içerik alanı ve footer yerleşimini sağlar.

---

## Otomatik Veri Güncelleme (Cron)

Verilerin her gün otomatik güncellenmesini istiyorsanız:

1. `backend/run_scraper.sh` içindeki Python yolu ve proje yolunu kendi ortamınıza göre güncelleyin.
2. `backend/crontab_script.txt` içeriğini düzenleyip crontab’a ekleyin:

```bash
crontab backend/crontab_script.txt
```

Örnek satır (her gün 07:30’da):

```cron
30 7 * * * /.../hal_project/backend/run_scraper.sh
```

---

## Geliştirme Notları

- Backend ve frontend bağımsızdır; isterseniz sadece API’yi veya sadece UI’ı kullanabilirsiniz.
- Frontend tarafında API adresini değiştirmek isterseniz:
  - `frontend/src/api/client.ts` içindeki `baseURL` veya
  - `frontend/vite.config.ts` içindeki proxy ayarını güncellemeniz yeterlidir.
- Proje, ABB verilerini sadece **bilgilendirme amaçlı** gösterir; resmi fiyat bilgisinin
  değişebileceğini göz önünde bulundurun.
