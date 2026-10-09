import type { SearchRequest } from "@shared";

export const keys = {
  publicSettings: ["public-settings"] as const,
  me: ["me"] as const,
  cart: ["cart"] as const,
  categories: ["categories"] as const,
  popular: ["popular-searches"] as const,
  search: (request: SearchRequest) => ["search", request] as const,
  suggest: (q: string) => ["suggest", q] as const,
  product: (id: string) => ["product", id] as const,
  related: (id: string) => ["related", id] as const,
  supplier: (id: string) => ["supplier", id] as const,
  supplierProducts: (id: string, page: number) => ["supplier-products", id, page] as const,
  inquiries: (page: number) => ["inquiries", page] as const,
  inquiry: (id: string) => ["inquiry", id] as const,
};
