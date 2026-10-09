import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { cartItemInputSchema, cartItemPatchSchema, cartSchema, currencySchema, type CartItem, type ProductDetail } from "@shared";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/fields";
import { ApiClientError, api } from "@/lib/api";
import { keys } from "@/lib/keys";
import { track } from "@/lib/track";

export function AddToListButton({
  productId,
  supplierId,
  unit,
  searchEventId,
  signedIn,
}: {
  productId: string;
  supplierId: string;
  unit: string | null;
  searchEventId?: string;
  signedIn: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");
  const mutation = useMutation({
    mutationFn: (qty: number) => api.post("/cart/items", { productId, quantity: qty, ...(unit ? { unit } : {}) }, cartSchema, { silent: true }),
    onSuccess: (cart) => {
      queryClient.setQueryData(keys.cart, cart);
      track({ eventType: "cart_add", productId, supplierId, searchEventId });
      toast.success("Added to your sourcing list");
      setOpen(false);
    },
    onError: (caught) => setError(caught instanceof ApiClientError ? caught.message : "Could not add this product"),
  });

  if (!signedIn) {
    return (
      <Button
        type="button"
        variant="primary"
        onClick={() => navigate("/login", { state: { from: `${location.pathname}${location.search}` } })}
      >
        Add to sourcing list
      </Button>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="primary"
        onClick={() => {
          setError("");
          setQuantity("1");
          setOpen(true);
        }}
      >
        Add to sourcing list
      </Button>
      <Modal open={open} onOpenChange={setOpen} title="Add to sourcing list" description="Choose a quantity. You can add a target price on the product page.">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const qty = Number(quantity);
            if (!Number.isFinite(qty) || qty <= 0) {
              setError("Enter a quantity greater than 0");
              return;
            }
            mutation.mutate(qty);
          }}
        >
          <div>
            <Label htmlFor={`qty-${productId}`}>Quantity</Label>
            <Input id={`qty-${productId}`} className="mt-1" inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          </div>
          <FieldError message={error || undefined} />
          <Button type="submit" variant="primary" disabled={mutation.isPending}>
            {mutation.isPending ? "Adding…" : "Add"}
          </Button>
        </form>
      </Modal>
    </>
  );
}

export function SourcingPanel({
  product,
  cartItem,
  signedIn,
  searchEventId,
}: {
  product: ProductDetail;
  cartItem: CartItem | null;
  signedIn: boolean;
  searchEventId?: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(String(cartItem?.quantity ?? 1));
  const [unit, setUnit] = useState(cartItem?.unit ?? product.unit ?? "");
  const [targetPrice, setTargetPrice] = useState(cartItem?.targetPrice != null ? String(cartItem.targetPrice) : "");
  const [targetCurrency, setTargetCurrency] = useState(cartItem?.targetCurrency ?? product.currency ?? "CNY");
  const [notes, setNotes] = useState(cartItem?.notes ?? "");

  const save = useMutation({
    mutationFn: async () => {
      const qty = Number(quantity);
      const price = targetPrice.trim() === "" ? undefined : Number(targetPrice);
      const body = {
        productId: product.id,
        quantity: qty,
        unit: unit.trim() || undefined,
        targetPrice: price,
        targetCurrency: price == null ? undefined : currencySchema.parse(targetCurrency),
        notes: notes.trim() || undefined,
      };
      const parsed = cartItemInputSchema.safeParse(body);
      if (!parsed.success) throw new ApiClientError(parsed.error.issues[0]?.message ?? "Check the quantity", 400, "VALIDATION_ERROR");
      if (cartItem) {
        const patch = cartItemPatchSchema.parse({
          quantity: parsed.data.quantity,
          unit: parsed.data.unit,
          targetPrice: parsed.data.targetPrice,
          targetCurrency: parsed.data.targetCurrency,
          notes: parsed.data.notes,
        });
        return api.patch(`/cart/items/${cartItem.id}`, patch, cartSchema, { silent: true });
      }
      return api.post("/cart/items", parsed.data, cartSchema, { silent: true });
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(keys.cart, cart);
      track({ eventType: "cart_add", productId: product.id, supplierId: product.supplier.id, searchEventId });
      toast.success(cartItem ? "Sourcing list updated" : "Added to your sourcing list");
      setError("");
    },
    onError: (caught) => setError(caught instanceof ApiClientError ? caught.message : "Could not update your sourcing list"),
  });

  const remove = useMutation({
    mutationFn: () => api.delete(cartItem ? `/cart/items/${cartItem.id}` : "/cart/items/missing", cartSchema, { silent: true }),
    onSuccess: (cart) => {
      queryClient.setQueryData(keys.cart, cart);
      track({ eventType: "cart_remove", productId: product.id, supplierId: product.supplier.id, searchEventId });
      toast.success("Removed from your sourcing list");
    },
    onError: (caught) => setError(caught instanceof ApiClientError ? caught.message : "Could not remove this product"),
  });

  if (!signedIn) {
    return (
      <Button type="button" variant="primary" onClick={() => navigate("/login", { state: { from: `${location.pathname}${location.search}` } })}>
        Sign in to add to your sourcing list
      </Button>
    );
  }

  return (
    <form
      className="space-y-3 rounded-lg border border-border bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate();
      }}
    >
      <h2 className="font-semibold">Add to sourcing list</h2>
      {cartItem ? <p className="text-sm text-accent">In your list (qty {cartItem.quantity})</p> : null}
      <div>
        <Label htmlFor="sourcing-qty">Quantity</Label>
        <Input id="sourcing-qty" className="mt-1" inputMode="decimal" required value={quantity} onChange={(event) => setQuantity(event.target.value)} />
      </div>
      <div>
        <Label htmlFor="sourcing-unit">Unit</Label>
        <Input id="sourcing-unit" className="mt-1" value={unit} onChange={(event) => setUnit(event.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="sourcing-price">Target price</Label>
          <Input id="sourcing-price" className="mt-1" inputMode="decimal" value={targetPrice} onChange={(event) => setTargetPrice(event.target.value)} />
        </div>
        <div>
          <Label htmlFor="sourcing-currency">Target currency</Label>
          <Select id="sourcing-currency" className="mt-1" value={targetCurrency} onChange={(event) => setTargetCurrency(event.target.value as "CNY" | "USD" | "GHS")}>
            <option value="CNY">CNY</option>
            <option value="USD">USD</option>
            <option value="GHS">GHS</option>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="sourcing-notes">Notes</Label>
        <Textarea id="sourcing-notes" className="mt-1" value={notes} onChange={(event) => setNotes(event.target.value)} />
      </div>
      <p className="text-xs text-muted-foreground">Target price is what you hope to pay the supplier in China. It is not a landed cost in Ghana.</p>
      <FieldError message={error || undefined} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" disabled={save.isPending}>
          {cartItem ? "Update" : "Add to sourcing list"}
        </Button>
        {cartItem ? (
          <Button type="button" variant="outline" disabled={remove.isPending} onClick={() => remove.mutate()}>
            Remove
          </Button>
        ) : null}
      </div>
    </form>
  );
}
