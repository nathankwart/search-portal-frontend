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
import { returnPathFrom } from "@/shell";

export function SignupPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = returnPathFrom(location.state);
  const settings = useQuery({
    queryKey: keys.publicSettings,
    queryFn: () => api.get("/settings/public", publicSettingsSchema),
    staleTime: 60_000,
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [pending, setPending] = useState(false);
  usePageTitle("Create account");

  if (!settings.isLoading && settings.data && !settings.data.allowBuyerSignup) return <Navigate to="/login" replace />;
  if (!auth.loading && auth.session) return <Navigate to={returnTo} replace />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setInfo("");
    try {
      const result = await auth.signUp(email, password);
      if (result === "confirm") {
        sessionStorage.setItem("post-login-path", returnTo);
        setInfo("Check your email to confirm the account, then sign in.");
        return;
      }
      navigate(returnTo, { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the account");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-primary px-4 py-10">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">China sourcing</p>
        <h1 className="mt-1 text-2xl font-semibold">Create a buyer account</h1>
        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="signup-email">Email</Label>
            <Input id="signup-email" className="mt-1" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="signup-password">Password</Label>
            <Input id="signup-password" className="mt-1" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          <FieldError message={error || undefined} />
          {info ? <p className="text-sm text-accent">{info}</p> : null}
          <Button type="submit" variant="primary" className="w-full" disabled={pending || settings.isLoading}>
            {pending ? "Creating account…" : "Create account"}
          </Button>
          <p className="text-center text-sm">
            <Link className="font-medium text-primary underline" to="/login" state={{ from: returnTo }}>
              Already have an account? Sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
