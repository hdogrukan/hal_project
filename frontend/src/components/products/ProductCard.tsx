import { useState } from "react";
import { Link } from "react-router-dom";
import { useShoppingStore } from "@/components/shopping/store";
import { Product } from "@/hooks/useProducts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart } from "lucide-react";

interface Props { product: Product }

export default function ProductCard({ product }: Props) {
  const [qty, setQty] = useState(1);
  const add = useShoppingStore(s => s.add);

  const min = product.latest_min ?? "-";
  const max = product.latest_max ?? "-";

  return (
    <Card className="p-0 flex flex-col justify-between">
      <Link to={`/product/${product.id}`} className="block relative">
        <img
          src={product.image_url ?? "/placeholder.svg"}
          alt={product.name}
          className="h-32 w-full object-cover rounded-t-2xl"
        />
        {/* grafik ikonu */}
        <BarChart className="absolute top-2 right-2 w-5 h-5 text-white/80" />
      </Link>

      <CardContent className="p-3 flex-1 flex flex-col gap-2">
        <h3 className="font-semibold leading-snug">{product.name}</h3>

        <p className="text-sm text-gray-600">
          {min === "-" ? "Fiyat yok" : `${min}-${max} ₺ / ${product.unit}`}
        </p>

        <div className="flex items-center gap-2 mt-auto">
          <input
            type="number"
            min={1}
            value={qty}
            onChange={e => setQty(+e.target.value)}
            className="w-16 border rounded px-1 py-0.5 text-sm"
          />
          <Button
            disabled={min === "-"}
            onClick={() => add(product, qty)}
            className="flex-1 text-xs"
          >
            Sepete ekle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
