import ProductGrid from "@/components/products/ProductGrid";

export default function Home() {
  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Güncel Ürün Listesi</h1>
      <ProductGrid />
    </>
  );
}