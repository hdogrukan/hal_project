import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";

export interface Product {
  id: number;
  name: string;
  unit: string;
  category_id: number;
  image_url?: string;
  latest_min: number | null;
  latest_max: number | null;
}

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => (await api.get("/products")).data
  });
}
