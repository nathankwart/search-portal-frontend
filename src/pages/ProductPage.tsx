import { useEffect, useRef } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { cartSchema, productDetailSchema } from "@shared";
import { useAuth } from "@/auth";
import { SourcingPanel } from "@/components/AddToList";
import { ContactBlock, ShopLink, VerifiedMark } from "@/components/ContactBlock";
import { Gallery } from "@/components/Gallery";
import { ProductCard } from "@/components/ProductCard";
import { PriceText } from "@/components/PriceText";
import { ChipList, QueryState, usePageTitle } from "@/components/feedback";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { asProductCard, gallerySources } from "@/lib/catalog";
import { relatedProductsSchema, supplierProductListSchema } from "@/lib/contracts";
import { percentLabel, repeatLabel, starsLabel, yearsLabel } from "@/lib/format";
import { sellerLabel } from "@/lib/labels";
import { keys } from "@/lib/keys";
import { searchPath } from "@/lib/searchState";
import { track } from "@/lib/track";

export function ProductPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const auth = useAuth();
  const state = location.state as { searchEventId?: string } | null;
  const searchEventId = state?.searchEventId;
  const tracked = useRef<string | null>(null);
  const product = useQuery({
    queryKey: keys.product(id),
    queryFn: () => api.get(`/products/${id}`, productDetailSchema),
    enabled: Boolean(id),
  });
  const related = useQuery({
    queryKey: keys.related(id),
    queryFn: () => api.get(`/products/${id}/related`, relatedProductsSchema),
    enabled: Boolean(product.data),
  });
  const more = useQuery({
    queryKey: keys.supplierProducts(product.data?.supplier.id ?? "", 1),
    queryFn: () => api.get(`/suppliers/${product.data?.supplier.id}/products`, supplierProductListSchema, { page: 1, pageSize: 8 }),
    enabled: Boolean(product.data?.supplier.id),
  });
  const cart = useQuery({
    queryKey: keys.cart,
    queryFn: () => api.get("/cart", cartSchema),
    enabled: Boolean(auth.session),
  });
  usePageTitle(product.data?.name ?? "Product");

  useEffect(() => {
    const current = product.data;
    if (!current || tracked.current === current.id) return;
    tracked.current = current.id;
    track({
      eventType: "product_view",
      productId: current.id,
      supplierId: current.supplier.id,
      searchEventId,
    });
  }, [product.data, searchEventId]);

  const cartItem = cart.data?.groups.flatMap((group) => group.items).find((item) => item.productId === id) ?? null;
  const supplier = product.data?.supplier;
  const place = [supplier?.city, supplier?.province].filter(Boolean).join(", ");

  return (
    <QueryState isLoading={product.isLoading} isError={product.isError} onRetry={() => void product.refetch()}>
      {product.data && supplier ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="order-2 min-w-0 space-y-6 lg:order-1">
            <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <Link className="underline" to="/">Home</Link>
              {product.data.categoryName && product.data.categoryId ? (
                <Link className="underline" to={searchPath({ q: product.data.categoryName, page: 1, filters: { categoryIds: [product.data.categoryId] }, suppressed: [] })}>
                  {product.data.categoryName}
                </Link>
              ) : null}
              <span className="text-foreground">{product.data.name}</span>
            </nav>
            <Gallery images={gallerySources(product.data)} />
            <div>
              <h1 className="text-2xl font-semibold break-words">{product.data.name}</h1>
              <div className="mt-3">
                <PriceText priceMin={product.data.priceMin} priceMax={product.data.priceMax} currency={product.data.currency} moq={product.data.moq} unit={product.data.unit} />
              </div>
              {!product.data.isEnriched ? (
                <p className="mt-3 text-sm text-muted-foreground">Details from supplier profile. Ask for a quote for full specifications.</p>
              ) : null}
              {product.data.tags.length > 0 ? (
                <div className="mt-4">
                  <ChipList items={product.data.tags} />
                </div>
              ) : null}
            </div>
            {product.data.description ? (
              <section>
                <h2 className="font-semibold">Description</h2>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm">{product.data.description}</p>
              </section>
            ) : null}
            {product.data.specs.length > 0 ? (
              <section>
                <h2 className="font-semibold">Specifications</h2>
                <table className="mt-2 w-full text-left text-sm">
                  <tbody>
                    {product.data.specs.map((spec) => (
                      <tr key={spec.key} className="border-t border-border">
                        <th className="py-2 pr-3 font-medium">{spec.key}</th>
                        <td className="py-2 break-words">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ) : null}
            <section>
              <h2 className="font-semibold">More from this supplier</h2>
              <CardRow products={(more.data?.data ?? []).filter((item) => item.id !== id).slice(0, 8)} signedIn={Boolean(auth.session)} searchEventId={searchEventId} />
            </section>
            <section>
              <h2 className="font-semibold">Similar products from other suppliers</h2>
              <CardRow products={related.data ?? []} signedIn={Boolean(auth.session)} searchEventId={searchEventId} />
            </section>
          </div>
          <aside className="order-1 space-y-4 lg:order-2">
            <div>
              <SourcingPanel product={product.data} cartItem={cartItem} signedIn={Boolean(auth.session)} searchEventId={searchEventId} key={cartItem?.id ?? "new"} />
            </div>
            <section className="rounded-lg border border-border bg-white p-4">
              <h2 className="font-semibold">Supplier</h2>
              <Link to={`/suppliers/${supplier.id}`} state={{ searchEventId }} className="mt-2 block font-medium text-primary underline break-words">
                {supplier.companyName}
              </Link>
              {place ? <p className="mt-1 text-sm text-muted-foreground">{place}</p> : null}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {supplier.sellerType ? <Badge>{sellerLabel(supplier.sellerType)}</Badge> : null}
                <VerifiedMark verified={supplier.isVerifiedFactory} />
              </div>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {supplier.businessModel ? <li>{supplier.businessModel}</li> : null}
                {yearsLabel(supplier.yearsOnPlatform) ? <li>{yearsLabel(supplier.yearsOnPlatform)}</li> : null}
                {supplier.oemModes.length > 0 ? <li>OEM: {supplier.oemModes.join(", ")}</li> : null}
                {starsLabel(supplier.customerStar) ? <li>Customer {starsLabel(supplier.customerStar)}</li> : null}
                {starsLabel(supplier.productRating) ? <li>Product {starsLabel(supplier.productRating)}</li> : null}
                {repeatLabel(supplier.repeatBuyerRate) ? <li>{repeatLabel(supplier.repeatBuyerRate)}</li> : null}
                {percentLabel(supplier.fulfillmentRate) ? <li>Fulfillment {percentLabel(supplier.fulfillmentRate)}</li> : null}
                {percentLabel(supplier.positiveReviewRate) ? <li>Positive reviews {percentLabel(supplier.positiveReviewRate)}</li> : null}
                {supplier.creditLevel ? <li>{supplier.creditLevel}</li> : null}
                {supplier.factoryMedal ? <li>{supplier.factoryMedal}</li> : null}
              </ul>
              <div className="mt-4">
                <ContactBlock
                  anonymous={!auth.session}
                  contactName={supplier.contactName}
                  mobile={supplier.mobile}
                  telephone={supplier.telephone}
                  fullAddress={supplier.fullAddress}
                  supplierId={supplier.id}
                  productId={product.data.id}
                />
              </div>
              <div className="mt-3">
                <ShopLink href={supplier.shopUrl} supplierId={supplier.id} productId={product.data.id} />
              </div>
            </section>
          </aside>
        </div>
      ) : null}
    </QueryState>
  );
}

function CardRow({
  products,
  signedIn,
  searchEventId,
}: {
  products: Parameters<typeof asProductCard>[0][];
  signedIn: boolean;
  searchEventId?: string;
}) {
  if (products.length === 0) return <p className="mt-2 text-sm text-muted-foreground">None yet.</p>;
  return (
    <ul className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((item, index) => (
        <li key={item.id}>
          <ProductCard product={asProductCard(item)} position={index + 1} signedIn={signedIn} searchEventId={searchEventId} />
        </li>
      ))}
    </ul>
  );
}
