import { PropsWithChildren } from "react";
import { ShoppingCart, Leaf } from "lucide-react";
import { ShoppingListDrawer } from "@/components/shopping/ShoppingListDrawer";
import { useShoppingStore } from "@/components/shopping/store";

export default function Layout({ children }: PropsWithChildren) {
  // Sepetteki toplam adet
  const itemCount = useShoppingStore(s =>
    s.items.reduce((sum, i) => sum + i.qty, 0)
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Üst bar */}
      <header className="bg-green-700 text-white py-3 shadow">
        <div className="container mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 font-bold text-xl">
            <Leaf className="w-6 h-6" /> Ankara Hal Fiyatları
          </a>

          {/* Sepet */}
          <ShoppingListDrawer
            trigger={
              <button className="relative">
                <ShoppingCart className="w-6 h-6" />

                {/* Adet rozeti */}
                {itemCount > 0 && (
                  <span
                    className="absolute -top-1 -right-2 min-w-[18px] rounded-full
                               bg-red-600 text-xs leading-4 px-1 text-white"
                  >
                    {itemCount}
                  </span>
                )}
              </button>
            }
          />
        </div>
      </header>

      {/* Sayfa içeriği */}
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} ABB | Veriler bilgilendirme amaçlıdır
      </footer>
    </div>
  );
}
