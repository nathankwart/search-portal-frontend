import type { FormEvent, ReactNode } from "react";
import { ClipboardList, Factory, Search, Send } from "lucide-react";

const points = [
  { icon: Search, title: "Search", text: "Find factories in plain English" },
  { icon: ClipboardList, title: "List", text: "Collect products and quantities" },
  { icon: Send, title: "Send", text: "Share the list with your team" },
];

export function AuthFrame({
  title,
  description,
  onSubmit,
  children,
}: {
  title: string;
  description: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.18),transparent_58%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-4 md:px-6 md:py-8 lg:px-10">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden lg:block">
            <BrandMark />
            <h2 className="mt-6 max-w-md text-4xl font-semibold tracking-tight text-foreground">Source from Chinese factories with a list your team can act on.</h2>
            <ul className="mt-8 space-y-4">
              {points.map((point) => (
                <li key={point.title} className="flex items-center gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <point.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{point.title}</span>
                    <span className="block text-sm text-muted-foreground">{point.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <form
            onSubmit={onSubmit}
            className="mx-auto w-full max-w-[440px] rounded-[28px] border border-border/80 bg-card px-6 py-5 text-card-foreground shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_40px_rgba(15,23,42,0.10)] md:px-8 md:py-8"
          >
            <div className="flex items-center gap-3">
              <BrandMark compact />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">China sourcing</p>
            </div>
            <h1 className="mt-5 text-[1.75rem] font-semibold leading-tight tracking-tight">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            <div className="mt-5 space-y-3">{children}</div>
          </form>
        </div>
      </div>
    </div>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm" : "grid h-14 w-14 place-items-center rounded-[20px] bg-primary text-primary-foreground shadow-md"}>
      <Factory className={compact ? "h-5 w-5" : "h-7 w-7"} aria-hidden="true" />
    </span>
  );
}
