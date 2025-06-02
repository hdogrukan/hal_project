import { useShoppingStore } from "./store";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ShoppingList() {
  const { items, remove, clear } = useShoppingStore();

  // Sepetteki toplam tutar (son fiyatlara göre)
  const totalMin = items.reduce((s, i) => s + (i.latest_min ?? 0) * i.qty, 0);
  const totalMax = items.reduce((s, i) => s + (i.latest_max ?? 0) * i.qty, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Başlık + Temizle butonu */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Sepetim
          {items.length > 0 && (
            <span className="text-sm font-normal ml-2">
              {totalMin.toFixed(2)}–{totalMax.toFixed(2)} ₺
            </span>
          )}
        </h2>

        <button
          onClick={clear}
          disabled={!items.length}
          className="text-sm flex items-center gap-1 text-gray-600 hover:text-red-600 disabled:opacity-40"
        >
          <X size={14} /> Temizle
        </button>
      </div>

      {/* Ürün listesi */}
      <ul className="flex-1 overflow-y-auto space-y-2 text-gray-800">
        {items.map(i => (
          <li key={i.id} className="flex justify-between items-center">
            <span className="truncate max-w-[180px]">
              {i.name} × {i.qty}
            </span>
            <button onClick={() => remove(i.id)} className="text-red-600">
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>

      {/* Alt kısım boş bırakıldı – isterseniz not ekleyebilirsiniz */}
    </div>
  );
}
