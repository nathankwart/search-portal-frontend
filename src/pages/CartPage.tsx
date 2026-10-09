import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartSchema, currencySchema, inquiryCreateSchema, inquirySchema, type Cart, type CartItem, type Inquiry } from "@shared";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { ShopLink } from "@/components/ContactBlock";
import { SafeImage, usePageTitle } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Modal } from "@/components/ui/dialog";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/fields";
import { api } from "@/lib/api";
import { formatPriceRange } from "@/lib/format";
import { keys } from "@/lib/keys";
import { track } from "@/lib/track";
import { useDebounced } from "@/lib/useDebounced";

export function CartPage() {
  const queryClient = useQueryClient();
  const [confirmClear, setConfirmClear] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitted, setSubmitted] = useState<Inquiry | null>(null);
  const cart = useQuery({ queryKey: keys.cart, queryFn: () => api.get("/cart", cartSchema) });
  usePageTitle("Sourcing list");
  const clear = useMutation({
    mutationFn: () => api.delete("/cart", cartSchema, { silent: true }),
    onSuccess: (next) => {
      queryClient.setQueryData(keys.cart, next);
      setConfirmClear(false);
      toast.success("Sourcing list cleared");
    },
    onError: () => toast.error("Could not clear the sourcing list"),
  });

  if (submitted) {
    return (
      <div className="rounded-lg border border-border bg-white p-6">
        <h1 className="text-2xl font-semibold">Inquiry {submitted.reference} submitted</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your sourcing list is now empty. Staff will follow up with the factories.</p>
        <Link className="mt-4 inline-flex min-h-11 items-center font-medium text-primary underline" to={`/inquiries/${submitted.id}`}>View inquiry</Link>
      </div>
    );
  }

  if (cart.isLoading) return <div className="h-40 animate-pulse rounded-lg bg-muted" aria-busy="true" />;
  if (cart.isError || !cart.data) {
    return (
      <div className="rounded-lg border border-border bg-white p-6" role="alert">
        <p className="font-medium">The sourcing list could not be loaded.</p>
        <Button type="button" className="mt-4" variant="primary" onClick={() => void cart.refetch()}>Retry</Button>
      </div>
    );
  }
  if (cart.data.itemCount === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-white p-8 text-center">
        <h1 className="text-xl font-semibold">Your sourcing list is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">Search for products to add them.</p>
        <Link to="/" className="mt-4 inline-flex min-h-11 items-center font-medium text-primary underline">Search products</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Sourcing list</h1>
        {cart.data.groups.map((group) => (
          <section key={group.supplier.id} aria-label={group.supplier.companyName} className="rounded-lg border border-border bg-white">
            <header className="border-b border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">
                    <Link className="text-primary underline break-words" to={`/suppliers/${group.supplier.id}`}>{group.supplier.companyName}</Link>
                  </h2>
                  <p className="text-sm text-muted-foreground">{[group.supplier.city, group.supplier.province].filter(Boolean).join(", ") || "Location not listed"}</p>
                  <p className="mt-1 text-sm">{group.items.length} {group.items.length === 1 ? "product" : "products"}</p>
                  <Link className="mt-1 inline-flex min-h-11 items-center text-sm font-medium text-primary underline" to={`/suppliers/${group.supplier.id}#contact`}>Contact details</Link>
                </div>
                <ShopLink href={group.supplier.shopUrl} supplierId={group.supplier.id} />
              </div>
            </header>
            <ul>
              {group.items.map((item) => (
                <CartRow key={item.id} item={item} />
              ))}
            </ul>
          </section>
        ))}
      </div>
      <aside className="h-fit rounded-lg border border-border bg-white p-4">
        <h2 className="font-semibold">Summary</h2>
        <p className="mt-2 text-sm">{cart.data.supplierCount} suppliers</p>
        <p className="text-sm">{cart.data.itemCount} products</p>
        <p className="mt-3 text-xs text-muted-foreground">No payment on this page. Prices, when shown, are supplier prices in China. Your team follows up with the factories.</p>
        <div className="mt-4 space-y-2">
          <Button type="button" variant="outline" className="w-full" onClick={() => void api.download("/cart/export.csv", "sourcing-list.csv")}>Export to Excel (CSV)</Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => setConfirmClear(true)}>Clear list</Button>
          <Button type="button" variant="primary" className="w-full" onClick={() => setSubmitOpen(true)}>Submit inquiry</Button>
        </div>
      </aside>
      <ConfirmDialog open={confirmClear} title="Clear the sourcing list?" body="This removes every product from your list." confirmLabel="Clear list" destructive pending={clear.isPending} onConfirm={() => clear.mutate()} onClose={() => setConfirmClear(false)} />
      <Modal open={submitOpen} onOpenChange={setSubmitOpen} title="Submit inquiry" description="Staff will follow up with the factories. Nothing is paid here.">
        <SubmitInquiry onDone={(inquiry) => { setSubmitOpen(false); setSubmitted(inquiry); }} />
      </Modal>
    </div>
  );
}

function CartRow({ item }: { item: CartItem }) {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [notes, setNotes] = useState(item.notes ?? "");
  const [unit, setUnit] = useState(item.unit ?? "");
  const [targetPrice, setTargetPrice] = useState(item.targetPrice == null ? "" : String(item.targetPrice));
  const [targetCurrency, setTargetCurrency] = useState(item.targetCurrency ?? "CNY");
  const focused = useRef(false);
  const debouncedNotes = useDebounced(notes, 400);
  const debouncedQuantity = useDebounced(quantity, 400);
  const savedNotes = useRef(item.notes ?? "");
  const savedQuantity = useRef(item.quantity);

  useEffect(() => {
    if (focused.current) return;
    setQuantity(String(item.quantity));
    savedQuantity.current = item.quantity;
  }, [item.quantity]);

  const patch = useMutation({
    mutationFn: (body: { quantity?: number; notes?: string; unit?: string; targetPrice?: number; targetCurrency?: "CNY" | "USD" | "GHS" }) =>
      api.patch(`/cart/items/${item.id}`, body, cartSchema, { silent: true }),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: keys.cart });
      const previous = queryClient.getQueryData<Cart>(keys.cart);
      if (previous && body.quantity != null) {
        queryClient.setQueryData<Cart>(keys.cart, {
          ...previous,
          groups: previous.groups.map((group) => ({
            ...group,
            items: group.items.map((row) => (row.id === item.id ? { ...row, quantity: body.quantity ?? row.quantity } : row)),
          })),
        });
      }
      return { previous };
    },
    onError: (_error, _body, context) => {
      if (context?.previous) queryClient.setQueryData(keys.cart, context.previous);
      toast.error("Could not update the sourcing list");
    },
    onSuccess: (next) => queryClient.setQueryData(keys.cart, next),
  });

  const { mutate } = patch;

  useEffect(() => {
    if (debouncedNotes === savedNotes.current) return;
    savedNotes.current = debouncedNotes;
    mutate({ notes: debouncedNotes });
  }, [debouncedNotes, mutate]);

  useEffect(() => {
    const next = Number(debouncedQuantity);
    if (!Number.isFinite(next) || next <= 0 || next === savedQuantity.current) return;
    savedQuantity.current = next;
    mutate({ quantity: next });
  }, [debouncedQuantity, mutate]);

  const remove = useMutation({
    mutationFn: () => api.delete(`/cart/items/${item.id}`, cartSchema, { silent: true }),
    onSuccess: (next) => {
      queryClient.setQueryData(keys.cart, next);
      track({ eventType: "cart_remove", productId: item.productId });
    },
    onError: () => toast.error("Could not remove the product"),
  });

  const price = formatPriceRange(item.priceMin, item.priceMax, item.currency);

  return (
    <li className="grid gap-3 border-t border-border p-4 sm:grid-cols-[4.5rem_minmax(0,1fr)]">
      <div className="aspect-square overflow-hidden rounded-md bg-muted">
        <SafeImage src={item.imageUrl} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 space-y-3">
        <div>
          <Link className="font-medium text-primary underline break-words" to={`/products/${item.productId}`}>{item.productName}</Link>
          {price ? <p className="text-xs text-muted-foreground" title="Supplier price in China, not a landed cost in Ghana.">{price}</p> : <p className="text-xs text-muted-foreground">Price on inquiry</p>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor={`qty-${item.id}`}>Quantity</Label>
            <Input
              id={`qty-${item.id}`}
              className="mt-1"
              inputMode="decimal"
              value={quantity}
              onFocus={() => {
                focused.current = true;
              }}
              onBlur={() => {
                focused.current = false;
              }}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`unit-${item.id}`}>Unit</Label>
            <Input id={`unit-${item.id}`} className="mt-1" value={unit} onChange={(event) => setUnit(event.target.value)} onBlur={() => patch.mutate({ unit })} />
          </div>
          <div>
            <Label htmlFor={`price-${item.id}`}>Target price</Label>
            <Input
              id={`price-${item.id}`}
              className="mt-1"
              inputMode="decimal"
              value={targetPrice}
              onChange={(event) => setTargetPrice(event.target.value)}
              onBlur={() => {
                if (targetPrice.trim() === "") return;
                const amount = Number(targetPrice);
                if (Number.isFinite(amount) && amount >= 0) patch.mutate({ targetPrice: amount, targetCurrency });
              }}
            />
          </div>
          <div>
            <Label htmlFor={`currency-${item.id}`}>Target currency</Label>
            <Select
              id={`currency-${item.id}`}
              className="mt-1"
              value={targetCurrency}
              onChange={(event) => {
                const next = currencySchema.parse(event.target.value);
                setTargetCurrency(next);
                if (targetPrice.trim() !== "") patch.mutate({ targetCurrency: next, targetPrice: Number(targetPrice) });
              }}
            >
              <option value="CNY">CNY</option>
              <option value="USD">USD</option>
              <option value="GHS">GHS</option>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor={`notes-${item.id}`}>Notes</Label>
          <Textarea id={`notes-${item.id}`} className="mt-1" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>
        <Button type="button" variant="outline" disabled={remove.isPending} onClick={() => remove.mutate()}>Remove</Button>
      </div>
    </li>
  );
}

export function SubmitInquiry({ onDone }: { onDone?: (inquiry: Inquiry) => void }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [done, setDone] = useState<Inquiry | null>(null);
  const form = useForm({ defaultValues: { buyerNote: "", destination: "Tema, Ghana", neededBy: "" } });
  const submit = useMutation({
    mutationFn: async (values: { buyerNote: string; destination: string; neededBy: string }) => {
      const parsed = inquiryCreateSchema.safeParse({
        buyerNote: values.buyerNote.trim() || undefined,
        destination: values.destination.trim() || undefined,
        neededBy: values.neededBy || undefined,
      });
      if (!parsed.success) {
        return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Check the form" };
      }
      try {
        const inquiry = await api.post("/inquiries", parsed.data, inquirySchema, { silent: true });
        return { ok: true as const, inquiry };
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Could not submit the inquiry";
        return { ok: false as const, message };
      }
    },
    onSuccess: (result) => {
      if (!result.ok) {
        setError(result.message);
        return;
      }
      queryClient.setQueryData(keys.cart, { groups: [], itemCount: 0, supplierCount: 0 });
      void queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      track({ eventType: "inquiry_submit", metadata: { reference: result.inquiry.reference } });
      setDone(result.inquiry);
      onDone?.(result.inquiry);
    },
  });

  if (done) {
    return (
      <div>
        <p className="text-lg font-semibold">Inquiry {done.reference} submitted</p>
        <p className="mt-2 text-sm text-muted-foreground">Your sourcing list is now empty. Staff will follow up with the factories.</p>
        <Link className="mt-4 inline-flex min-h-11 items-center font-medium text-primary underline" to={`/inquiries/${done.id}`}>View inquiry</Link>
      </div>
    );
  }

  return (
    <form className="space-y-3" onSubmit={form.handleSubmit((values) => submit.mutate(values))}>
      <div>
        <Label htmlFor="buyer-note">Buyer note</Label>
        <Textarea id="buyer-note" className="mt-1" {...form.register("buyerNote")} />
      </div>
      <div>
        <Label htmlFor="destination">Destination</Label>
        <Input id="destination" className="mt-1" {...form.register("destination")} />
      </div>
      <div>
        <Label htmlFor="needed-by">Needed by</Label>
        <Input id="needed-by" className="mt-1" type="date" {...form.register("neededBy")} />
      </div>
      <FieldError message={error || undefined} />
      <Button type="submit" variant="primary" disabled={submit.isPending}>{submit.isPending ? "Submitting…" : "Submit inquiry"}</Button>
    </form>
  );
}
