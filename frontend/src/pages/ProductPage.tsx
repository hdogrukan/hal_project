import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import PriceHistoryChart from "@/components/charts/PriceHistoryChart";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useShoppingStore } from "@/components/shopping/store";

export default function ProductPage() {
  const { id } = useParams();
  const [qty, setQty] = useState(1);
  const addItem = useShoppingStore(s => s.add);

  const { data, isLoading, error } = useQuery({
    queryKey: ["prices", id],
    queryFn: async () => (await api.get(`/prices/${id}`)).data
  });

  if (isLoading) return <p>Yükleniyor…</p>;
  if (error)     return <p className="text-red-600">Veri alınamadı.</p>;

  const { product, prices } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{product.name}</h1>

      <div className="flex gap-4 items-end">
        <label className="text-sm font-medium">
          Adet:
          <input
            type="number"
            className="border rounded px-2 py-1 ml-2 w-24"
            value={qty}
            min={1}
            onChange={e => setQty(+e.target.value)}
          />
        </label>
        <Button onClick={() => addItem(product, qty)}>Listeye ekle</Button>
      </div>

      <PriceHistoryChart data={prices} />
    </div>
  );
}