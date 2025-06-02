import { useState } from "react";
import ProductCard from "./ProductCard";
import { useProducts, Product } from "@/hooks/useProducts";

const CATEGORY_LABELS: Record<number, string> = {
  1: "Sebze / Meyve",
  2: "Balık"
};

export default function ProductGrid() {
  const { data = [], isLoading, error } = useProducts();
  const [q, setQ] = useState("");

  if (isLoading) return <p>Yükleniyor…</p>;
  if (error)     return <p className="text-red-600">Ürünler alınamadı.</p>;

  // arama filtresi
  const filtered = data.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase())
  );

  // kategoriye göre grupla
  const groups = filtered.reduce<Record<number, Product[]>>((acc, p) => {
    (acc[p.category_id] ??= []).push(p);
    return acc;
  }, {});

  return (
    <>
      <input
        placeholder="Ürün ara…"
        value={q}
        onChange={e => setQ(e.target.value)}
        className="mb-6 w-full md:w-1/2 border px-3 py-2 rounded"
      />

      {Object.entries(groups).map(([cid, plist]) => (
        <section key={cid} className="mb-10">
          <h2 className="text-xl font-semibold mb-4">
            {CATEGORY_LABELS[+cid] ?? "Diğer"}
          </h2>

          <div className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
            {plist.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
