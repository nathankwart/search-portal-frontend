import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supplierDetailSchema } from "@shared";
import { useAuth } from "@/auth";
import { ContactBlock, ShopLink, VerifiedMark } from "@/components/ContactBlock";
import { ProductCard } from "@/components/ProductCard";
import { ChipList, Fact, QueryState, SafeImage, ShowMore, usePageTitle } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { asProductCard } from "@/lib/catalog";
import { supplierProductListSchema } from "@/lib/contracts";
import { areaLabel, formatNumber, percentLabel, repeatLabel, starsLabel, yearsLabel } from "@/lib/format";
import { sellerLabel } from "@/lib/labels";
import { keys } from "@/lib/keys";
import { splitPhrases } from "@/lib/phrases";
import { track } from "@/lib/track";
import { useMediaQuery } from "@/lib/useMediaQuery";

export function SupplierPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const auth = useAuth();
  const state = location.state as { searchEventId?: string } | null;
  const [page, setPage] = useState(1);
  const supplier = useQuery({
    queryKey: keys.supplier(id),
    queryFn: () => api.get(`/suppliers/${id}`, supplierDetailSchema),
    enabled: Boolean(id),
  });
  const products = useQuery({
    queryKey: keys.supplierProducts(id, page),
    queryFn: () => api.get(`/suppliers/${id}/products`, supplierProductListSchema, { page, pageSize: 20 }),
    enabled: Boolean(supplier.data),
    placeholderData: (previous) => previous,
  });
  usePageTitle(supplier.data?.companyName ?? "Supplier");

  useEffect(() => {
    if (!supplier.data) return;
    track({ eventType: "supplier_view", supplierId: supplier.data.id, searchEventId: state?.searchEventId });
  }, [supplier.data, state?.searchEventId]);

  const data = supplier.data;
  const place = [data?.city, data?.district, data?.province].filter(Boolean).join(", ");
  const photoGroups = new Map<string, { url: string; alt: string }[]>();
  for (const photo of data?.photos ?? []) {
    const list = photoGroups.get(photo.type) ?? [];
    list.push({ url: photo.url, alt: photo.type });
    photoGroups.set(photo.type, list);
  }
  const pages = Math.max(1, Math.ceil((products.data?.total ?? 0) / (products.data?.pageSize ?? 20)));

  return (
    <QueryState isLoading={supplier.isLoading} isError={supplier.isError} onRetry={() => void supplier.refetch()}>
      {data ? (
        <div className="space-y-6">
          <header className="rounded-lg border border-border bg-white p-4">
            <div className="flex flex-wrap items-start gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-md bg-muted">
                <SafeImage src={data.logoUrl} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-semibold break-words">{data.companyName}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <VerifiedMark verified={data.isVerifiedFactory} />
                  {data.sellerType ? <Badge>{sellerLabel(data.sellerType)}</Badge> : null}
                </div>
                {place ? <p className="mt-2 text-sm text-muted-foreground">{place}</p> : null}
                {yearsLabel(data.yearsOnPlatform) ? <p className="text-sm text-muted-foreground">{yearsLabel(data.yearsOnPlatform)}</p> : null}
                {data.rankLabel ? <p className="mt-2 text-sm break-words">{data.rankLabel}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <ShopLink href={data.shopUrl} supplierId={data.id} />
                </div>
                <div className="mt-4">
                  <ContactBlock anonymous={!auth.session} contactName={data.contactName} mobile={data.mobile} telephone={data.telephone} fullAddress={data.fullAddress} supplierId={data.id} />
                </div>
              </div>
            </div>
          </header>
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Fact label="Customer star">{starsLabel(data.customerStar) ?? "—"}</Fact>
            <Fact label="Repeat buyers">{repeatLabel(data.repeatBuyerRate) ?? "—"}</Fact>
            <Fact label="Positive reviews">{percentLabel(data.positiveReviewRate) ?? "—"}</Fact>
            <Fact label="Employees">{data.employeesCount == null ? "—" : formatNumber(data.employeesCount, 0)}</Fact>
            <Fact label="Factory area">{areaLabel(data.factoryAreaM2) ?? "—"}</Fact>
            <Fact label="Annual revenue">{data.annualRevenueBand ?? "—"}</Fact>
            <Fact label="OEM modes">{data.oemModes.length ? data.oemModes.join(", ") : "—"}</Fact>
          </dl>
          <Section title="About">
            <ShowMore text={data.summary} />
          </Section>
          <Section title="What they make">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Production</h3>
                <div className="mt-2">
                  <ChipList items={splitPhrases(data.productionService)} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium">Industries</h3>
                <div className="mt-2">
                  <ChipList items={data.mainIndustries} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium">On-sale categories</h3>
                <div className="mt-2">
                  <ChipList items={data.onsaleCategories} />
                </div>
              </div>
            </div>
          </Section>
          <Section title="Capacity">
            <dl className="grid gap-3 sm:grid-cols-2">
              <Fact label="Production staff">{data.productionEmployeesCount == null ? "—" : formatNumber(data.productionEmployeesCount, 0)}</Fact>
              <Fact label="R&D staff">{data.rdStaffCount == null ? "—" : formatNumber(data.rdStaffCount, 0)}</Fact>
              <Fact label="Monthly output">{data.monthlyOutputBand ?? "—"}</Fact>
              <Fact label="Processing capacity">{data.processingCapacity ?? "—"}</Fact>
            </dl>
            <div className="mt-4 space-y-3">
              <div>
                <h3 className="text-sm font-medium">Technology</h3>
                <div className="mt-2"><ChipList items={data.technologyTypes} /></div>
              </div>
              <div>
                <h3 className="text-sm font-medium">Special processes</h3>
                <div className="mt-2"><ChipList items={data.specialProcesses} /></div>
              </div>
              <div>
                <h3 className="text-sm font-medium">Equipment</h3>
                {data.mainEquipment.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">—</p> : (
                  <ul className="mt-2 space-y-2 text-sm">
                    {data.mainEquipment.map((item, index) => (
                      <li key={`${item.equipName ?? "equipment"}-${index}`} className="break-words">
                        {[item.equipName, item.brand, item.equipVersion].filter(Boolean).join(" · ") || "Equipment"}
                        {item.equipNum ? ` × ${item.equipNum}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Section>
          <Section title="Quality and trust">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Certifications</h3>
                <div className="mt-2"><ChipList items={data.certifications} /></div>
              </div>
              <p className="text-sm">Patents: {data.patentCount == null ? "—" : formatNumber(data.patentCount, 0)}</p>
              <div>
                <h3 className="text-sm font-medium">Guarantees</h3>
                <div className="mt-2"><ChipList items={data.guaranteeTags} /></div>
              </div>
              {data.deepAuthInfo ? <p className="break-words text-sm">{data.deepAuthInfo}</p> : null}
              <div>
                <h3 className="text-sm font-medium">Review labels</h3>
                <div className="mt-2">
                  <ChipList items={data.reviewLabels.map((label) => (label.count == null ? label.label : `${label.label} (${label.count})`))} />
                </div>
              </div>
            </div>
          </Section>
          <Section title="Registration">
            <dl className="grid gap-3 sm:grid-cols-2">
              <Fact label="Registered name">{data.registeredName ?? "—"}</Fact>
              <Fact label="Legal form">{data.legalForm ?? "—"}</Fact>
              <Fact label="Registered capital">{data.registeredCapitalText ?? "—"}</Fact>
              <Fact label="Registration start">{data.registrationStartDate ?? "—"}</Fact>
              <Fact label="Business scope">{data.businessScope ?? "—"}</Fact>
            </dl>
          </Section>
          <Section title="Photos">
            {photoGroups.size === 0 ? <p className="text-sm text-muted-foreground">No photos yet.</p> : (
              <div className="space-y-4">
                {[...photoGroups.entries()].map(([type, photos]) => (
                  <div key={type}>
                    <h3 className="text-sm font-medium">{type}</h3>
                    <ul className="mt-2 flex gap-2 overflow-x-auto">
                      {photos.map((photo) => (
                        <li key={photo.url} className="h-28 w-40 shrink-0 overflow-hidden rounded-md bg-muted">
                          <SafeImage src={photo.url} alt={photo.alt} className="h-full w-full object-cover" />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Section>
          <section>
            <h2 className="text-lg font-semibold">Products</h2>
            <QueryState isLoading={products.isLoading} isError={products.isError} onRetry={() => void products.refetch()} isEmpty={(products.data?.data.length ?? 0) === 0} emptyTitle="No active products for this supplier.">
              <ul className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(products.data?.data ?? []).map((item, index) => (
                  <li key={item.id}>
                    <ProductCard product={asProductCard(item)} position={index + 1} signedIn={Boolean(auth.session)} searchEventId={state?.searchEventId} />
                  </li>
                ))}
              </ul>
              {pages > 1 ? (
                <div className="mt-4 flex items-center justify-between text-sm">
                  <p className="text-muted-foreground">Page {page} of {pages}</p>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
                    <Button type="button" variant="outline" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>Next</Button>
                  </div>
                </div>
              ) : null}
            </QueryState>
          </section>
        </div>
      ) : null}
    </QueryState>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const desktop = useMediaQuery("(min-width: 768px)");
  const [open, setOpen] = useState(false);
  const shown = desktop || open;
  return (
    <section className="rounded-lg border border-border bg-white">
      <button type="button" className="flex min-h-11 w-full items-center justify-between px-4 text-left font-semibold md:cursor-default" aria-expanded={shown} onClick={() => setOpen((value) => !value)}>
        {title}
        <span className="md:hidden" aria-hidden>{shown ? "−" : "+"}</span>
      </button>
      {shown ? <div className="border-t border-border px-4 py-4">{children}</div> : null}
    </section>
  );
}
