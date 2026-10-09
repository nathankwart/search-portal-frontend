import type { Cart, Inquiry, ProductCard, SupplierSummary } from "@shared";

export const productId = "11111111-1111-4111-8111-111111111111";
export const productTwoId = "11111111-1111-4111-8111-111111111112";
export const productThreeId = "11111111-1111-4111-8111-111111111113";
export const supplierAId = "22222222-2222-4222-8222-222222222222";
export const supplierBId = "33333333-3333-4333-8333-333333333333";
export const searchEventId = "44444444-4444-4444-8444-444444444444";
export const userId = "55555555-5555-4555-8555-555555555555";
export const inquiryId = "77777777-7777-4777-8777-777777777777";

export function supplier(overrides: Partial<SupplierSummary> = {}): SupplierSummary {
  return {
    id: supplierAId,
    companyName: "Guangzhou Huazhimu Biotechnology",
    province: "Guangdong",
    city: "Guangzhou",
    sellerType: "super_factory",
    isVerifiedFactory: true,
    businessModel: "Manufacturer",
    customerStar: 4.5,
    repeatBuyerRate: 62,
    yearsOnPlatform: 6,
    oemModes: ["OEM"],
    trustScore: 0.82,
    logoUrl: null,
    shopUrl: "https://example.com/shop",
    ...overrides,
  };
}

export function productCard(overrides: Partial<ProductCard> = {}): ProductCard {
  return {
    id: productId,
    name: "PE water supply pipe",
    categoryName: "Home decoration and building materials",
    imageUrl: null,
    priceMin: 12,
    priceMax: 18,
    currency: "CNY",
    moq: 100,
    unit: "meter",
    isEnriched: true,
    supplier: supplier(),
    score: 0.9,
    matchReason: "Matched 'PVC pipe' in product name. Guangdong manufacturer, 4.5 stars, 62% repeat buyers.",
    ...overrides,
  };
}

export const searchFixture = {
  searchEventId,
  query: "perfume",
  correctedQuery: "perfume factories in Guangdong",
  notesForUser: "Showing perfume makers in Guangdong that accept OEM.",
  appliedFilters: { provinces: ["Guangdong"], oemModes: ["OEM"] as const },
  aiInferredFilters: ["provinces", "oemModes"] as const,
  aiUsed: true,
  products: [productCard({ id: productId, name: "Floral perfume", priceMin: null, priceMax: null, moq: null, unit: null, isEnriched: false, matchReason: "Matched perfume." })],
  suppliers: [supplier()],
  facets: { categories: [], provinces: [{ value: "Guangdong", count: 1 }], sellerTypes: [], },
  page: 1,
  pageSize: 20,
  total: 1,
  latencyMs: 20,
};

export const cartFixture: Cart = {
  supplierCount: 2,
  itemCount: 3,
  groups: [
    {
      supplier: supplier(),
      items: [
        {
          id: "66666666-6666-4666-8666-666666666661",
          productId,
          productName: "Floral perfume",
          imageUrl: null,
          quantity: 10,
          unit: "piece",
          targetPrice: null,
          targetCurrency: null,
          notes: null,
          priceMin: null,
          priceMax: null,
          currency: null,
          categoryName: "Beauty",
        },
        {
          id: "66666666-6666-4666-8666-666666666662",
          productId: productTwoId,
          productName: "Perfume bottle",
          imageUrl: null,
          quantity: 20,
          unit: "piece",
          targetPrice: null,
          targetCurrency: null,
          notes: "Need gold caps",
          priceMin: null,
          priceMax: null,
          currency: null,
          categoryName: "Beauty",
        },
      ],
    },
    {
      supplier: supplier({ id: supplierBId, companyName: "Yiwu Display Co", city: "Jinhua", province: "Zhejiang" }),
      items: [
        {
          id: "66666666-6666-4666-8666-666666666663",
          productId: productThreeId,
          productName: "Supermarket display racks",
          imageUrl: null,
          quantity: 5,
          unit: "set",
          targetPrice: null,
          targetCurrency: null,
          notes: null,
          priceMin: null,
          priceMax: null,
          currency: null,
          categoryName: "Displays",
        },
      ],
    },
  ],
};

export const inquiryFixture: Inquiry = {
  id: inquiryId,
  reference: "INQ-2026-000001",
  userId,
  status: "submitted",
  buyerNote: "Need these before June",
  destination: "Tema, Ghana",
  neededBy: null,
  adminNotes: null,
  createdAt: "2026-04-11T00:00:00.000Z",
  itemCount: 3,
  supplierCount: 2,
};
