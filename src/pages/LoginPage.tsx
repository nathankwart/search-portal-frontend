import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicSettingsSchema } from "@shared";
import { useAuth } from "@/auth";
import { usePageTitle } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/fields";
import { api } from "@/lib/api";
import { keys } from "@/lib/keys";
import { safePath } from "@/lib/utils";
import { returnPathFrom } from "@/shell";

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const settings = useQuery({
    queryKey: keys.publicSettings,
    queryFn: () => api.get("/settings/public", publicSettingsSchema),
    staleTime: 60_000,
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  usePageTitle("Sign in");

  if (!auth.loading && auth.session) return <Navigate to={returnPathFrom(location.state)} replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await auth.signIn(email, password);
      const stored = sessionStorage.getItem("post-login-path");
      sessionStorage.removeItem("post-login-path");
      const from = location.state && typeof location.state === "object" && "from" in location.state ? String(location.state.from) : null;
      navigate(safePath(from || stored || "/"), { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-primary px-4 py-10">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">China sourcing</p>
        <h1 className="mt-1 text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Search Chinese factories, build a sourcing list, and send it to your team.</p>
        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" className="mt-1" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" className="mt-1" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          <FieldError message={error || undefined} />
          <Button type="submit" variant="primary" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
          {settings.data?.allowBuyerSignup ? (
            <p className="text-center text-sm">
              <Link className="font-medium text-primary underline" to="/signup">
                Create a buyer account
              </Link>
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
