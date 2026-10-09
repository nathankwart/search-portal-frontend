import { Check, Copy, Phone } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { track } from "@/lib/track";

export function ContactBlock({
  anonymous,
  contactName,
  mobile,
  telephone,
  fullAddress,
  supplierId,
  productId,
}: {
  anonymous: boolean;
  contactName: string | null;
  mobile: string | null;
  telephone: string | null;
  fullAddress?: string | null;
  supplierId?: string;
  productId?: string;
}) {
  const location = useLocation();
  if (anonymous) {
    return (
      <p className="text-sm">
        <Link className="font-medium text-primary underline" to="/login" state={{ from: `${location.pathname}${location.search}` }}>
          Sign in to see contact details
        </Link>
      </p>
    );
  }

  function copy(value: string, field: string) {
    track({ eventType: "contact_copy", supplierId, productId, metadata: { field } });
    void navigator.clipboard?.writeText(value).then(
      () => toast.success("Copied"),
      () => toast.error("Could not copy"),
    );
  }

  return (
    <div className="space-y-2 text-sm" id="contact">
      <p>
        <span className="text-muted-foreground">Contact </span>
        <span className="break-words">{contactName || "—"}</span>
      </p>
      <p className="flex flex-wrap items-center gap-2">
        <Phone className="h-4 w-4" aria-hidden />
        {mobile ? (
          <a className="underline" href={`tel:${mobile.replace(/[^\d+]/g, "")}`}>
            {mobile}
          </a>
        ) : (
          "—"
        )}
        {mobile ? (
          <button type="button" className="inline-flex min-h-11 items-center gap-1 rounded-md border border-border px-3 text-xs" onClick={() => copy(mobile, "mobile")}>
            <Copy className="h-3.5 w-3.5" aria-hidden />
            Copy
          </button>
        ) : null}
      </p>
      <p>
        <span className="text-muted-foreground">Telephone </span>
        {telephone || "—"}
        {telephone ? (
          <button type="button" className="ml-2 inline-flex min-h-11 items-center rounded-md border border-border px-3 text-xs" onClick={() => copy(telephone, "telephone")}>
            Copy
          </button>
        ) : null}
      </p>
      {fullAddress !== undefined ? (
        <p className="break-words">
          <span className="text-muted-foreground">Address </span>
          {fullAddress || "—"}
        </p>
      ) : null}
    </div>
  );
}

export function ShopLink({ href, supplierId, productId }: { href: string | null; supplierId?: string; productId?: string }) {
  if (!href) return null;
  return (
    <a
      className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-medium"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track({ eventType: "shop_link_click", supplierId, productId })}
    >
      Visit 1688 shop
    </a>
  );
}

export function VerifiedMark({ verified }: { verified: boolean | null }) {
  if (!verified) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
      <Check className="h-4 w-4" aria-hidden />
      Verified factory
    </span>
  );
}
