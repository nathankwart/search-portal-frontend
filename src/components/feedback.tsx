import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function QueryState({
  isLoading,
  isError,
  onRetry,
  isEmpty,
  emptyTitle,
  emptyAction,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyAction?: ReactNode;
  children: ReactNode;
}) {
  if (isLoading) return <SkeletonBlock />;
  if (isError) {
    return (
      <div className="rounded-lg border border-border bg-white p-6" role="alert">
        <p className="font-medium">This page could not be loaded.</p>
        <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
        {onRetry ? (
          <Button type="button" className="mt-4" variant="primary" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </div>
    );
  }
  if (isEmpty) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-white p-8 text-center">
        <p className="font-medium">{emptyTitle}</p>
        {emptyAction ? <div className="mt-4">{emptyAction}</div> : null}
      </div>
    );
  }
  return <>{children}</>;
}

export function SkeletonBlock() {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <div className="h-24 animate-pulse rounded-md bg-muted" />
      <div className="h-24 animate-pulse rounded-md bg-muted" />
      <div className="h-24 animate-pulse rounded-md bg-muted" />
    </div>
  );
}

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="h-80 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}

export function ShowMore({ text }: { text: string | null | undefined }) {
  const [open, setOpen] = useState(false);
  if (!text) return <p className="text-sm text-muted-foreground">No summary yet.</p>;
  if (text.length <= 280) return <p className="whitespace-pre-wrap break-words text-sm">{text}</p>;
  return (
    <div>
      <p className="whitespace-pre-wrap break-words text-sm">{open ? text : `${text.slice(0, 280)}…`}</p>
      <button type="button" className="mt-2 min-h-11 text-sm font-medium text-primary underline" onClick={() => setOpen((value) => !value)}>
        {open ? "Show less" : "Show more"}
      </button>
    </div>
  );
}

export function SafeImage({ src, alt, className, eager }: { src: string | null | undefined; alt: string; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(!src);
  useEffect(() => setFailed(!src), [src]);
  if (failed || !src) {
    return (
      <div className={`grid h-full w-full place-items-center bg-muted text-xs text-muted-foreground ${className ?? ""}`} aria-hidden>
        No image
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

export function ChipList({ items }: { items: string[] }) {
  if (items.length === 0) return <span className="text-sm text-muted-foreground">—</span>;
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item} className="max-w-full break-words rounded-full bg-muted px-3 py-1 text-xs">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-white p-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm">{children ?? "—"}</dd>
    </div>
  );
}

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · Sourcing`;
  }, [title]);
}
