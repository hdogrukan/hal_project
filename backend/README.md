# Ankara Hal Backend

Bu klasörde, Ankara Büyükşehir Belediyesi’nin **hal fiyatları verisini toplayan (scraper)** ve bu veriyi
**SQLite veritabanından okuyup REST API olarak sunan (Flask backend)** kodlar bulunur.

Ana bileşenler:
- `scraper.py` → Ankara Hal sayfasından fiyatları çekip `hal_fiyatlari.db` veritabanına kaydeder.
- `app.py` → Veritabanındaki ürün ve fiyat bilgilerini JSON API olarak sunar.
- `run_scraper.sh` + `crontab_script.txt` → Scraper’ı her gün otomatik çalıştırmak için örnek cron ayarı.
- `../hal_fiyatlari.db` → Verilerin saklandığı SQLite veritabanı (otomatik oluşturulur/güncellenir).

---

## Gereksinimler

- Python 3.10+ (tercihen 3.11 veya üstü)
- `pip` paket yöneticisi
- (Opsiyonel) Sanal ortam (`venv`) kullanımı
- İnternet bağlantısı (sadece `scraper.py` çalışırken gerekir)

Kullanılan Python paketleri `requirements.txt` dosyasında tanımlıdır:

- Flask
- Flask-Cors
- pandas
- requests
- beautifulsoup4

---

## Kurulum (Backend + Scraper)

Proje kök dizinindeyken:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows için: .venv\Scripts\activate
pip install -r ../requirements.txt
```

> Not: `requirements.txt` dosyası proje kök dizinindedir, bu yüzden `../requirements.txt` verilmiştir.

---

## Veritabanı Yapısı (`hal_fiyatlari.db`)

Scraper ilk çalıştığında, veritabanı yoksa otomatik oluşturur ve aşağıdaki tabloları kurar:

### `categories` tablosu
- `id` (INTEGER, PK)  
- `name` (TEXT)  
- `created_at` (TIMESTAMP, varsayılan CURRENT_TIMESTAMP)

Öntanımlı kayıtlar:
- `1, "MEYVE / SEBZE"`
- `2, "BALIK"`

### `products` tablosu
- `id` (INTEGER, PK, AUTOINCREMENT)  
- `category_id` (INTEGER, `categories.id` FK)  
- `name` (TEXT) → Ürün adı (örn. "DOMATES")  
- `unit` (TEXT) → Birim (örn. "KG", "ADET")  
- `image_url` (TEXT, opsiyonel) → Ürün görseli için link  
- `created_at` (TIMESTAMP)  
- `updated_at` (TIMESTAMP)

### `prices` tablosu
- `id` (INTEGER, PK, AUTOINCREMENT)  
- `product_id` (INTEGER, `products.id` FK)  
- `min_price` (DECIMAL) → Günün minimum hal fiyatı  
- `max_price` (DECIMAL) → Günün maksimum hal fiyatı  
- `date` (DATE, `YYYY-MM-DD`) → Fiyatın geçerli olduğu gün  
- `created_at` (TIMESTAMP)  
- `UNIQUE(product_id, date)` → Aynı ürün için aynı gün bir kayıt

---

## Scraper (`scraper.py`) Kullanımı

Scraper, `https://www.ankara.bel.tr/hal-fiyatlari` adresindeki fiyat listesini okuyup
tablolara kayıt atar.

### Temel çalıştırma

```bash
cd backend
python scraper.py
```

- Varsayılan olarak **bugünün tarihini** çekmeye çalışır.
- Veritabanı dosyası varsayılan olarak `backend/hal_fiyatlari.db` yolunda tutulur.

### Parametreler

```bash
python scraper.py --date 01.01.2024
python scraper.py --start-date 01.01.2024 --end-date 07.01.2024
python scraper.py --db /farkli/bir/yol/hal_fiyatlari.db
```

- `--date DD.MM.YYYY`  
  Belirli bir günün verisini çeker.

- `--start-date DD.MM.YYYY` ve `--end-date DD.MM.YYYY`  
  Belirtilen tarih aralığındaki **her gün** için verileri çeker. İki tarih de dahil.

- `--db PATH`  
  Veritabanı dosyasının yolunu özelleştirir.

Scraper her çalıştırıldığında:
- `categories` tablosu varsa kullanır, yoksa oluşturur.
- Ürünler `name + unit + category_id` kombinasyonuna göre bulunur veya yeni ürün eklenir.
- Fiyatlar `prices` tablosuna kaydedilir. Aynı gün ve ürün için kayıt varsa `INSERT OR REPLACE`
  ile güncellenir.

---

## Cron ile Otomatik Çalıştırma

Backende düzenli veri akışı sağlamak için `scraper.py` günlük çalıştırılabilir.

### Örnek shell script (`run_scraper.sh`)

`backend/run_scraper.sh`:

```bash
#!/bin/bash
source ~/.bash_profile
/opt/miniconda3/envs/myenv/bin/python /Users/miotehuzeyfe/Desktop/projeler/hal_project/backend/scraper.py >> /Users/miotehuzeyfe/Desktop/projeler/hal_project/backend/logs/hal_scraper.log 2>&1
```

- Önce ortam değişkenleri yüklenir (`~/.bash_profile`).
- İlgili conda/venv ortamındaki Python ile `scraper.py` çalıştırılır.
- Loglar `backend/logs/hal_scraper.log` dosyasına eklenir.

### Örnek crontab kaydı

`backend/crontab_script.txt` içeriği:

```cron
30 7 * * * /Users/miotehuzeyfe/Desktop/projeler/hal_project/backend/run_scraper.sh
```

Bu ayar, her gün **sabah 07:30’da** scraper’ı çalıştırır.

Crontab’a eklemek için:

```bash
crontab backend/crontab_script.txt
```

> Not: Bu dosyadaki yollar, mevcut makineye özeldir. Kendi ortamınıza göre güncellemeniz gerekir.

---

## Backend API (`app.py`) Kullanımı

Backend, Flask ile yazılmış basit bir REST API sunar.

### Çalıştırma

Önce veritabanınızda (kök dizindeki `hal_fiyatlari.db`) verinin olduğundan emin olun
(yani en az bir kez `scraper.py` çalışmış olmalı).

Ardından:

```bash
cd backend
python app.py
```

Sunucu varsayılan olarak:
- Host: `0.0.0.0`
- Port: `5001`
- `debug=True`

Tarayıcıdan veya istemciden şu adresleri deneyebilirsiniz:
- `http://localhost:5001/api/products`

### Ortam değişkenleri

- `HAL_DB_PATH` → Backend’in kullanacağı SQLite dosyasının tam yolu.  
  Varsayılan değer:
  `/Users/miotehuzeyfe/Desktop/projeler/hal_project/hal_fiyatlari.db`

Kendi ortamınızda şu şekilde değiştirebilirsiniz:

```bash
export HAL_DB_PATH="/path/to/hal_fiyatlari.db"
python app.py
```

---

## API Uç Noktaları

### 1. `GET /api/products`

Tüm ürünleri ve her ürün için **en güncel min/max fiyatı** döner.

Örnek cevap:

```json
[
  {
    "id": 1,
    "name": "DOMATES",
    "unit": "KG",
    "category_id": 1,
    "image_url": null,
    "latest_min": 12.5,
    "latest_max": 18.0
  },
  ...
]
```

Notlar:
- `latest_min` ve `latest_max`, ilgili ürün için `prices` tablosundaki **en son tarihe ait** kayıtlar üzerinden hesaplanır.
- Sonuçlar `category_id, name` sırasına göre sıralanır.

### 2. `GET /api/prices/<int:id>`

Belirli bir ürünün **tüm fiyat geçmişini** döner.

Örnek istek:

```http
GET /api/prices/1
```

Örnek cevap:

```json
{
  "product": {
    "id": 1,
    "name": "DOMATES",
    "unit": "KG",
    "category_id": 1,
    "image_url": null
  },
  "prices": [
    {
      "date": "2024-01-01",
      "min_price": 10.0,
      "max_price": 15.0
    },
    {
      "date": "2024-01-02",
      "min_price": 11.0,
      "max_price": 16.0
    }
  ]
}
```

Notlar:
- Tarihler `YYYY-MM-DD` formatında döner.
- Ürün bulunamazsa **404 Not Found** döner.

### 3. `POST /api/shopping/cost`

Belirli ürünlerden oluşan bir alışveriş listesinin, **güncel fiyatlara göre minimum ve maksimum toplam maliyetini** hesaplar.

İstek gövdesi (`JSON`):

```json
{
  "items": [
    { "product_id": 1, "qty": 2.5 },
    { "product_id": 5, "qty": 1 }
  ]
}
```

Alanlar:
- `items` → Zorunlu.  
  - `product_id` (INTEGER) → `products.id`  
  - `qty` (FLOAT) → Miktar (ürünün birimine göre kg/adet vb.)

Örnek cevap:

```json
{
  "total_min": 100.5,
  "total_max": 140.75
}
```

Notlar:
- Her ürün için **en güncel** `min_price` ve `max_price` kullanılır.
- `items` alanı yoksa **400 Bad Request** döner.

---

## Log Dosyaları

- `backend/scraper.log` → Scraper için genel loglar.
- `backend/logs/hal_scraper.log` → `run_scraper.sh` üzerinden çalışan cron job çıktıları.

Bu loglar, hata ayıklama ve takip için kullanılabilir.

---

## Geliştirme Notları

- Backend Flask uygulaması, CORS için `Flask-Cors` kullanır. Bu sayede farklı porttaki frontend (örn. Vite/React) rahatça bağlanabilir.
- Veritabanı bağlantısı `get_db()` fonksiyonuyla her istek için açılıp iş bitince kapatılır.
- Ürün görselleri için `image_url` alanı şimdilik opsiyoneldir; istenirse harici bir görsel servisiyle doldurulabilir.

Bu README, backend klasörünün içeriğini ve kullanımını açıklamaktadır. Frontend tarafı için `frontend` klasöründe ayrı bir README oluşturulabilir.
