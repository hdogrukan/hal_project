#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Ankara Hal Fiyatları Veri Çekme Scripti

Bu script, Ankara Büyükşehir Belediyesi'nin hal fiyatları sayfasından
günlük ve geçmiş tarihli fiyat verilerini çeker ve SQLite veritabanına kaydeder.
"""

import os
import sys
import time
import json
import sqlite3
import logging
import argparse
from datetime import datetime, timedelta
from typing import Dict, Optional, Any

import requests
from bs4 import BeautifulSoup

# Loglama ayarları
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("scraper.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("hal_fiyatlari_scraper")

# Sabitler
BASE_URL = "https://www.ankara.bel.tr/hal-fiyatlari"
DB_PATH = "hal_fiyatlari.db"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
DEFAULT_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
}

CATEGORY_FRUIT_VEGETABLE = 1
CATEGORY_FISH = 2

class HalFiyatlariScraper:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self.conn = None
        self.session = requests.Session()
        self.session.headers.update(DEFAULT_HEADERS)
        self._init_db()

    def _init_db(self):
        try:
            self.conn = sqlite3.connect(self.db_path)
            cursor = self.conn.cursor()
            cursor.execute('''CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY, name TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
            cursor.execute('''CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, category_id INTEGER NOT NULL, name TEXT NOT NULL, unit TEXT NOT NULL, image_url TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (category_id) REFERENCES categories (id))''')
            cursor.execute('''CREATE TABLE IF NOT EXISTS prices (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, min_price DECIMAL NOT NULL, max_price DECIMAL NOT NULL, date DATE NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (product_id) REFERENCES products (id), UNIQUE(product_id, date))''')
            cursor.execute('SELECT COUNT(*) FROM categories')
            if cursor.fetchone()[0] == 0:
                cursor.execute('INSERT INTO categories (id, name) VALUES (?, ?)', (CATEGORY_FRUIT_VEGETABLE, 'MEYVE / SEBZE'))
                cursor.execute('INSERT INTO categories (id, name) VALUES (?, ?)', (CATEGORY_FISH, 'BALIK'))
            self.conn.commit()
            logger.info("Veritabanı başarıyla oluşturuldu: %s", self.db_path)
        except sqlite3.Error as e:
            logger.error("Veritabanı hatası: %s", e)
            if self.conn:
                self.conn.close()
            raise

    def _parse_price_value(self, price_str: str) -> float:
        try:
            cleaned = price_str.replace('.', '').replace(',', '.')
            return float(cleaned)
        except ValueError as e:
            logger.error("Fiyat ayrıştırılamadı: %s", price_str)
            raise

    def _get_or_create_product(self, name: str, unit: str, category_id: int) -> int:
        cursor = self.conn.cursor()
        cursor.execute('SELECT id FROM products WHERE name = ? AND unit = ? AND category_id = ?', (name, unit, category_id))
        result = cursor.fetchone()
        if result:
            return result[0]
        cursor.execute('INSERT INTO products (name, unit, category_id) VALUES (?, ?, ?)', (name, unit, category_id))
        self.conn.commit()
        return cursor.lastrowid

    def _save_price(self, product_id: int, min_price: float, max_price: float, date: str):
        cursor = self.conn.cursor()
        try:
            cursor.execute('INSERT OR REPLACE INTO prices (product_id, min_price, max_price, date) VALUES (?, ?, ?, ?)', (product_id, min_price, max_price, date))
            self.conn.commit()
        except sqlite3.Error as e:
            logger.error("Fiyat kaydetme hatası: %s", e)
            self.conn.rollback()
            raise

    def _parse_date(self, date_str: str) -> str:
        try:
            return datetime.strptime(date_str, "%d.%m.%Y").strftime("%Y-%m-%d")
        except ValueError as e:
            logger.error("Tarih ayrıştırma hatası: %s", e)
            raise

    def _get_page(self, url: str, params: Optional[Dict[str, Any]] = None) -> BeautifulSoup:
        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            return BeautifulSoup(response.text, 'html.parser')
        except requests.RequestException as e:
            logger.error("Sayfa çekme hatası: %s", e)
            raise

    def _parse_price_table(self, table: BeautifulSoup, category_id: int, date: str) -> int:
        rows = table.find_all('tr')
        count = 0
        for row in rows[1:]:
            cells = row.find_all('td')
            if len(cells) < 5:
                continue
            try:
                name = cells[0].text.strip()
                unit = cells[1].text.strip()
                min_price = self._parse_price_value(cells[2].text.strip())
                max_price = self._parse_price_value(cells[3].text.strip())
                product_id = self._get_or_create_product(name, unit, category_id)
                self._save_price(product_id, min_price, max_price, date)
                count += 1
            except Exception as e:
                logger.error("Satır ayrıştırma hatası: %s", e)
                continue
        return count

    def scrape_prices(self, date: Optional[str] = None) -> Dict[str, int]:
        params = {}
        if date:
            try:
                datetime.strptime(date, "%d.%m.%Y")
                params = {"baslangic_tarihi": date, "bitis_tarihi": date}
            except ValueError:
                logger.error("Geçersiz tarih formatı. Doğru format: DD.MM.YYYY")
                raise

        soup = self._get_page(BASE_URL, params)

        date_str = soup.select_one('table tr:nth-child(2) td:last-child')
        date_str = date_str.text.strip() if date_str else date or datetime.now().strftime("%d.%m.%Y")
        iso_date = self._parse_date(date_str)

        tables = soup.find_all('table')
        fruit_veg_count = self._parse_price_table(tables[0], CATEGORY_FRUIT_VEGETABLE, iso_date) if len(tables) > 0 else 0
        fish_count = self._parse_price_table(tables[1], CATEGORY_FISH, iso_date) if len(tables) > 1 else 0

        logger.info("Tarih %s için %d meyve/sebze ve %d balık fiyatı kaydedildi", iso_date, fruit_veg_count, fish_count)
        return {"MEYVE / SEBZE": fruit_veg_count, "BALIK": fish_count}

    def close(self):
        if self.conn:
            self.conn.close()
            logger.info("Veritabanı bağlantısı kapatıldı")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--date")
    parser.add_argument("--start-date")
    parser.add_argument("--end-date")
    parser.add_argument("--db", default=DB_PATH)
    args = parser.parse_args()

    scraper = HalFiyatlariScraper(db_path=args.db)
    try:
        if args.start_date and args.end_date:
            start = datetime.strptime(args.start_date, "%d.%m.%Y")
            end = datetime.strptime(args.end_date, "%d.%m.%Y")
            while start <= end:
                scraper.scrape_prices(start.strftime("%d.%m.%Y"))
                start += timedelta(days=1)
                time.sleep(1)
        elif args.date:
            scraper.scrape_prices(args.date)
        else:
            scraper.scrape_prices()
    finally:
        scraper.close()

if __name__ == "__main__":
    sys.exit(main())