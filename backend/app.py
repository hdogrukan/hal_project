#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, sqlite3, pandas as pd
from flask import Flask, jsonify, request, abort
from flask_cors import CORS
from datetime import datetime

DB_PATH = os.getenv("HAL_DB_PATH", "/Users/miotehuzeyfe/Desktop/projeler/hal_project/hal_fiyatlari.db")

app = Flask(__name__)
CORS(app)

def get_db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con

def fetch_products():
    db = get_db()
    rows = db.execute("""
        SELECT p.id, p.name, p.unit, p.category_id, p.image_url,
               (SELECT min_price FROM prices pr
                 WHERE pr.product_id = p.id
                 ORDER BY pr.date DESC LIMIT 1) AS latest_min,
               (SELECT max_price FROM prices pr
                 WHERE pr.product_id = p.id
                 ORDER BY pr.date DESC LIMIT 1) AS latest_max
        FROM products p
        ORDER BY category_id, name
    """).fetchall()
    db.close()
    return [dict(r) for r in rows]


def fetch_prices(pid:int):
    db = get_db()
    product = db.execute("SELECT id,name,unit,category_id,image_url FROM products WHERE id=?",(pid,)).fetchone()
    if not product: abort(404)
    prices = db.execute("SELECT date,min_price,max_price FROM prices WHERE product_id=? ORDER BY date",(pid,)).fetchall()
    db.close()
    df = pd.DataFrame(prices, columns=["date","min_price","max_price"])
    df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
    return dict(product=dict(product), prices=df.to_dict("records"))

def calc_cost(items):
    pid_qty = {i['product_id']: i['qty'] for i in items}
    ids = tuple(pid_qty.keys())

    if not ids:
        return {"total_min": 0.0, "total_max": 0.0}

    marks = ",".join("?" * len(ids))
    db = get_db()
    rows = db.execute(
        f"""SELECT p.id, pr.min_price, pr.max_price
             FROM products p
             JOIN prices pr ON pr.product_id=p.id
             WHERE p.id IN ({marks})
               AND pr.date=(SELECT MAX(date) FROM prices pr2 WHERE pr2.product_id=p.id)""",
        ids,
    ).fetchall()
    db.close()

    tmin = tmax = 0
    for r in rows:
        qty = pid_qty[r["id"]]
        tmin += r["min_price"] * qty
        tmax += r["max_price"] * qty

    return {"total_min": round(tmin, 2), "total_max": round(tmax, 2)}

@app.route("/api/products")
def products(): return jsonify(fetch_products())

@app.route("/api/prices/<int:pid>")
def prices(pid): return jsonify(fetch_prices(pid))

@app.route("/api/shopping/cost", methods=["POST"])
def shopping_cost():
    data=request.json or {}
    if 'items' not in data: abort(400)
    return jsonify(calc_cost(data['items']))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)