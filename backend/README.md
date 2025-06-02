# Ankara Hal Backend

## Kurulum
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

* `/api/products` — ürün listesi  
* `/api/prices/<id>` — fiyat geçmişi  
* `/api/shopping/cost` — {items:[{product_id,qty}]} → toplam ₺