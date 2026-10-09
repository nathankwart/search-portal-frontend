import type { ProductCard, ProductDetail, SupplierSummary } from "@shared";

export function asProductCard(detail: ProductDetail): ProductCard {
  return {
    id: detail.id,
    name: detail.name,
    categoryName: detail.categoryName,
    imageUrl: detail.imageUrl,
    priceMin: detail.priceMin,
    priceMax: detail.priceMax,
    currency: detail.currency,
    moq: detail.moq,
    unit: detail.unit,
    isEnriched: detail.isEnriched,
    supplier: toSummary(detail.supplier),
    score: 0,
    matchReason: "",
  };
}

export function toSummary(supplier: ProductDetail["supplier"]): SupplierSummary {
  return {
    id: supplier.id,
    companyName: supplier.companyName,
    province: supplier.province,
    city: supplier.city,
    sellerType: supplier.sellerType,
    isVerifiedFactory: supplier.isVerifiedFactory,
    businessModel: supplier.businessModel,
    customerStar: supplier.customerStar,
    repeatBuyerRate: supplier.repeatBuyerRate,
    yearsOnPlatform: supplier.yearsOnPlatform,
    oemModes: supplier.oemModes,
    trustScore: supplier.trustScore,
    logoUrl: supplier.logoUrl,
    shopUrl: supplier.shopUrl,
  };
}

export function gallerySources(product: ProductDetail): { url: string; alt: string }[] {
  if (product.images.length > 0) {
    return product.images.map((image) => ({ url: image.url, alt: image.alt || product.name }));
  }
  const main = product.supplier.photos.filter((photo) => photo.type === "Main Products" && photo.url);
  if (main.length > 0) {
    return main.map((photo) => ({ url: photo.url, alt: `${product.supplier.companyName} main products` }));
  }
  if (product.supplier.logoUrl) return [{ url: product.supplier.logoUrl, alt: `${product.supplier.companyName} logo` }];
  if (product.imageUrl) return [{ url: product.imageUrl, alt: product.name }];
  return [];
}
