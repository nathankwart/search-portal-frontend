import { Link } from "react-router-dom";
import type { ProductCard as ProductCardData } from "@shared";
import { AddToListButton } from "@/components/AddToList";
import { VerifiedMark } from "@/components/ContactBlock";
import { SafeImage } from "@/components/feedback";
import { PriceText } from "@/components/PriceText";
import { Badge } from "@/components/ui/badge";
import { repeatLabel, starsLabel, yearsLabel } from "@/lib/format";
import { sellerLabel } from "@/lib/labels";
import { track } from "@/lib/track";

export function ProductCard({
  product,
  position,
  searchEventId,
  signedIn,
  cartQuantity,
}: {
  product: ProductCardData;
  position: number;
  searchEventId?: string;
  signedIn: boolean;
  cartQuantity?: number | null;
}) {
  const place = [product.supplier.city, product.supplier.province].filter(Boolean).join(", ");
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-white">
      <Link
        to={`/products/${product.id}`}
        state={{ searchEventId, position }}
        className="flex flex-1 flex-col"
        onClick={() =>
          track({
            eventType: "result_click",
            productId: product.id,
            supplierId: product.supplier.id,
            position,
            searchEventId,
          })
        }
      >
        <div className="aspect-[4/3] bg-muted">
          <SafeImage src={product.imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3">
          <h2 className="line-clamp-2 text-base font-semibold">{product.name}</h2>
          {product.categoryName ? <p className="text-xs text-muted-foreground">{product.categoryName}</p> : null}
          <PriceText priceMin={product.priceMin} priceMax={product.priceMax} currency={product.currency} moq={product.moq} unit={product.unit} />
          <div className="mt-auto space-y-1 text-sm">
            <p className="font-medium break-words">{product.supplier.companyName}</p>
            {place ? <p className="text-muted-foreground">{place}</p> : null}
            <div className="flex flex-wrap items-center gap-2">
              {product.supplier.sellerType ? <Badge>{sellerLabel(product.supplier.sellerType)}</Badge> : null}
              <VerifiedMark verified={product.supplier.isVerifiedFactory} />
            </div>
            <p className="text-xs text-muted-foreground">
              {[starsLabel(product.supplier.customerStar), repeatLabel(product.supplier.repeatBuyerRate), yearsLabel(product.supplier.yearsOnPlatform)]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {product.matchReason ? <p className="text-xs text-muted-foreground">{product.matchReason}</p> : null}
            {cartQuantity ? <p className="text-xs font-medium text-accent">In your list (qty {cartQuantity})</p> : null}
            <p className="text-sm font-medium text-primary">View details</p>
          </div>
        </div>
      </Link>
      <div className="p-3 pt-0">
        <AddToListButton
          productId={product.id}
          supplierId={product.supplier.id}
          unit={product.unit}
          searchEventId={searchEventId}
          signedIn={signedIn}
        />
      </div>
    </article>
  );
}
