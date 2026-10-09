import { useEffect, useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicSettingsSchema, cartSchema } from "@shared";
import { ClipboardList, LogOut, ShoppingCart, UserRound } from "lucide-react";
import { useAuth } from "@/auth";
import { AuthPrompt } from "@/components/AuthPrompt";
import { SearchBox } from "@/components/SearchBox";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useCurrency, type DisplayCurrency } from "@/lib/currency";
import { keys } from "@/lib/keys";
import { safePath } from "@/lib/utils";

export function FullScreenStatus({ label }: { label: string }) {
  return (
    <div className="grid min-h-screen place-items-center px-4" aria-busy="true">
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function BrowseGate() {
  const auth = useAuth();
  const location = useLocation();
  const settings = useQuery({
    queryKey: keys.publicSettings,
    queryFn: () => api.get("/settings/public", publicSettingsSchema),
    staleTime: 60_000,
  });

  if (settings.isLoading || auth.loading) return <FullScreenStatus label="Loading…" />;
  if (settings.isError || !settings.data) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="max-w-md rounded-lg border border-border bg-white p-6 text-center" role="alert">
          <p className="font-medium">The sourcing portal could not be reached.</p>
          <button type="button" className={cn(buttonStyles({ variant: "primary" }), "mt-4")} onClick={() => void settings.refetch()}>
            Retry
          </button>
        </div>
      </div>
    );
  }
  if (!settings.data.publicSearch && !auth.session) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  return <Outlet />;
}

export function RequireAuth() {
  const auth = useAuth();
  const location = useLocation();
  if (auth.loading) return <FullScreenStatus label="Checking your session…" />;
  if (!auth.session) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  return <Outlet />;
}

export function AppShell() {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const currency = useCurrency();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartPromptOpen, setCartPromptOpen] = useState(false);
  const showSearch = location.pathname !== "/";
  const cart = useQuery({
    queryKey: keys.cart,
    queryFn: () => api.get("/cart", cartSchema),
    enabled: Boolean(auth.session),
  });

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return;
      }
      if (!window.matchMedia("(min-width: 768px)").matches) return;
      const input = document.getElementById("portal-search");
      if (!(input instanceof HTMLInputElement)) return;
      event.preventDefault();
      input.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const count = cart.data?.itemCount ?? 0;
  const params = new URLSearchParams(location.search);
  const currentQuery = location.pathname === "/search" ? params.get("q") ?? "" : "";

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
          <Link to="/" className="mr-auto inline-flex min-h-11 flex-col justify-center md:mr-0">
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">China sourcing</span>
            <span className="text-lg font-semibold text-primary">Sourcing</span>
          </Link>
          {showSearch ? (
            <div className="order-last w-full md:order-none md:min-w-0 md:flex-1">
              <SearchBox
                size="compact"
                value={currentQuery}
                onSearch={(query) => navigate(`/search?q=${encodeURIComponent(query)}`)}
              />
            </div>
          ) : null}
          <div className="flex items-center gap-1">
            {currency.options.length > 1 ? (
              <div role="group" aria-label="Display currency" className="flex rounded-md border border-border">
                {currency.options.map((code) => (
                  <button
                    key={code}
                    type="button"
                    className={`min-h-11 px-2 text-xs font-medium ${currency.currency === code ? "bg-primary text-primary-foreground" : ""}`}
                    aria-pressed={currency.currency === code}
                    onClick={() => currency.setCurrency(code as DisplayCurrency)}
                  >
                    {code}
                  </button>
                ))}
              </div>
            ) : null}
            {auth.session ? (
              <Link to="/cart" className="relative inline-flex h-11 w-11 items-center justify-center rounded-md hover:bg-muted" aria-label={`Sourcing list, ${count} items`}>
                <ShoppingCart className="h-5 w-5" aria-hidden />
                {count > 0 ? <span className="absolute right-1 top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] text-accent-foreground">{count}</span> : null}
              </Link>
            ) : (
              <>
                <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-md hover:bg-muted" aria-label="Sourcing list" onClick={() => setCartPromptOpen(true)}>
                  <ShoppingCart className="h-5 w-5" aria-hidden />
                </button>
                <AuthPrompt
                  open={cartPromptOpen}
                  onOpenChange={setCartPromptOpen}
                  title="Sign in to see your sourcing list"
                  description="Create a free buyer account or sign in to build a sourcing list and send inquiries. You can keep browsing without an account."
                  from="/cart"
                />
              </>
            )}
            {auth.session ? (
              <div className="relative">
                <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-md hover:bg-muted" aria-expanded={menuOpen} aria-haspopup="menu" aria-label="Account menu" onClick={() => setMenuOpen((open) => !open)}>
                  <UserRound className="h-5 w-5" aria-hidden />
                </button>
                {menuOpen ? (
                  <div role="menu" className="absolute right-0 z-20 mt-1 w-48 rounded-md border border-border bg-white p-1 shadow-lg">
                    <NavLink role="menuitem" to="/inquiries" className="flex min-h-11 items-center gap-2 rounded px-3 text-sm hover:bg-muted" onClick={() => setMenuOpen(false)}>
                      <ClipboardList className="h-4 w-4" aria-hidden /> My inquiries
                    </NavLink>
                    <NavLink role="menuitem" to="/profile" className="flex min-h-11 items-center gap-2 rounded px-3 text-sm hover:bg-muted" onClick={() => setMenuOpen(false)}>
                      <UserRound className="h-4 w-4" aria-hidden /> Profile
                    </NavLink>
                    <button
                      type="button"
                      role="menuitem"
                      className="flex min-h-11 w-full items-center gap-2 rounded px-3 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        setMenuOpen(false);
                        void auth.signOut();
                      }}
                    >
                      <LogOut className="h-4 w-4" aria-hidden /> Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link to="/login" state={{ from: `${location.pathname}${location.search}` }} className={buttonStyles({ variant: "primary" })}>
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export function returnPathFrom(state: unknown): string {
  if (state && typeof state === "object" && "from" in state && typeof state.from === "string") return safePath(state.from);
  return "/";
}
