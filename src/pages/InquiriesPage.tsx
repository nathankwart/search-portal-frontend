import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { inquirySchema } from "@shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QueryState, usePageTitle } from "@/components/feedback";
import { api } from "@/lib/api";
import { inquiryListSchema } from "@/lib/contracts";
import { formatPriceRange, formatWhen } from "@/lib/format";
import { inquiryLabel } from "@/lib/labels";
import { keys } from "@/lib/keys";
import { snapshotNumber, snapshotText } from "@/lib/utils";

export function InquiryListPage() {
  const [page, setPage] = useState(1);
  const list = useQuery({
    queryKey: keys.inquiries(page),
    queryFn: () => api.get("/inquiries", inquiryListSchema, { page, pageSize: 20 }),
  });
  const pages = Math.max(1, Math.ceil((list.data?.total ?? 0) / (list.data?.pageSize || 20)));
  usePageTitle("My inquiries");
  return (
    <div>
      <h1 className="text-2xl font-semibold">My inquiries</h1>
      <div className="mt-4">
        <QueryState isLoading={list.isLoading} isError={list.isError} onRetry={() => void list.refetch()} isEmpty={(list.data?.data.length ?? 0) === 0} emptyTitle="You have not submitted an inquiry yet.">
          <ul className="space-y-3">
            {list.data?.data.map((inquiry) => (
              <li key={inquiry.id}>
                <Link to={`/inquiries/${inquiry.id}`} className="block rounded-lg border border-border bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{inquiry.reference}</span>
                    <Badge value={inquiry.status}>{inquiryLabel(inquiry.status)}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{formatWhen(inquiry.createdAt)}</p>
                  <p className="text-sm">{inquiry.supplierCount ?? 0} suppliers · {inquiry.itemCount ?? 0} products</p>
                </Link>
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
      </div>
    </div>
  );
}

export function InquiryDetailPage() {
  const { id = "" } = useParams();
  const inquiry = useQuery({
    queryKey: keys.inquiry(id),
    queryFn: () => api.get(`/inquiries/${id}`, inquirySchema),
    enabled: Boolean(id),
  });
  usePageTitle(inquiry.data?.reference ?? "Inquiry");
  const data = inquiry.data;
  return (
    <QueryState isLoading={inquiry.isLoading} isError={inquiry.isError} onRetry={() => void inquiry.refetch()}>
      {data ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">{formatWhen(data.createdAt)}</p>
              <h1 className="text-2xl font-semibold">{data.reference}</h1>
            </div>
            <Badge value={data.status}>{inquiryLabel(data.status)}</Badge>
          </div>
          <dl className="grid gap-3 rounded-lg border border-border bg-white p-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Destination</dt>
              <dd>{data.destination || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Needed by</dt>
              <dd>{formatWhen(data.neededBy)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Buyer note</dt>
              <dd className="break-words">{data.buyerNote || "—"}</dd>
            </div>
          </dl>
          <Button type="button" variant="outline" onClick={() => void api.download(`/inquiries/${data.id}/export.csv`, `${data.reference}.csv`)}>
            Export CSV
          </Button>
          {(data.groups ?? []).map((group) => (
            <section key={group.supplierId ?? group.supplierName ?? "supplier"} className="rounded-lg border border-border bg-white">
              <header className="border-b border-border p-4">
                <h2 className="font-semibold">{group.supplierName || "Supplier"}</h2>
                <p className="text-sm text-muted-foreground">{[group.city, group.province].filter(Boolean).join(", ")}</p>
                {group.contactName ? <p className="text-sm">Contact {group.contactName}</p> : null}
                {group.mobile ? <p className="text-sm">{group.mobile}</p> : null}
              </header>
              <ul>
                {group.items.map((item) => {
                  const name = snapshotText(item.snapshot, "productName") ?? "Product";
                  const price = formatPriceRange(snapshotNumber(item.snapshot, "priceMin"), snapshotNumber(item.snapshot, "priceMax"), snapshotText(item.snapshot, "currency"));
                  return (
                    <li key={item.id} className="border-t border-border p-4 text-sm">
                      <p className="font-medium break-words">{name}</p>
                      {snapshotText(item.snapshot, "category") ? <p className="text-muted-foreground">{snapshotText(item.snapshot, "category")}</p> : null}
                      <p className="mt-1">Qty {item.quantity ?? "—"} {item.unit ?? ""}</p>
                      {item.targetPrice != null ? <p>Target {item.targetPrice} {item.targetCurrency ?? ""}</p> : null}
                      {price ? <p className="text-muted-foreground" title="Supplier price in China at the time of the inquiry.">{price}</p> : null}
                      {item.notes ? <p className="break-words">{item.notes}</p> : null}
                      {item.productChanged ? <p className="text-amber-800">Product details changed since this inquiry was sent.</p> : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
    </QueryState>
  );
}
