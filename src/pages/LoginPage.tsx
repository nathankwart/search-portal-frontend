import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicSettingsSchema } from "@shared";
import { useAuth } from "@/auth";
import { usePageTitle } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/fields";
import { api } from "@/lib/api";
import { keys } from "@/lib/keys";
import { supabase } from "@/lib/supabase";
import { safePath } from "@/lib/utils";
import { FullScreenStatus, returnPathFrom } from "@/shell";

const PASSWORD_SETUP_KEY = "pending-password-setup";

function captureInviteCallback(): boolean {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const type = params.get("type");
  if (type === "invite" || type === "recovery") sessionStorage.setItem(PASSWORD_SETUP_KEY, "1");
  return sessionStorage.getItem(PASSWORD_SETUP_KEY) === "1";
}

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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(captureInviteCallback);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  usePageTitle(needsPassword ? "Set your password" : "Sign in");

  useEffect(() => {
    if (!needsPassword || auth.loading || auth.session) return;
    sessionStorage.removeItem(PASSWORD_SETUP_KEY);
    setNeedsPassword(false);
    setError("This invitation link has expired. Ask your team to send a new one.");
  }, [auth.loading, auth.session, needsPassword]);

  if (needsPassword && auth.loading) return <FullScreenStatus label="Opening your invitation…" />;
  if (!auth.loading && auth.session && !needsPassword) return <Navigate to={returnPathFrom(location.state)} replace />;

  function destination() {
    const stored = sessionStorage.getItem("post-login-path");
    sessionStorage.removeItem("post-login-path");
    const from = location.state && typeof location.state === "object" && "from" in location.state ? String(location.state.from) : null;
    return safePath(from || stored || "/");
  }

  async function onSetPassword(event: FormEvent) {
    event.preventDefault();
    if (password.length < 6) {
      setError("Use at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setPending(true);
    setError("");
    try {
      const result = await supabase.auth.updateUser({ password });
      if (result.error) throw new Error(result.error.message);
      sessionStorage.removeItem(PASSWORD_SETUP_KEY);
      navigate(destination(), { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save your password");
    } finally {
      setPending(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await auth.signIn(email, password);
      navigate(destination(), { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-primary px-4 py-10">
      <form onSubmit={needsPassword ? onSetPassword : onSubmit} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">China sourcing</p>
        <h1 className="mt-1 text-2xl font-semibold">{needsPassword ? "Set your password" : "Sign in"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {needsPassword
            ? "Choose a password to finish your account. You will use it the next time you sign in."
            : "Search Chinese factories, build a sourcing list, and send it to your team."}
        </p>
        <div className="mt-6 space-y-4">
          {needsPassword ? (
            <>
              <div>
                <Label htmlFor="invite-email">Email</Label>
                <Input id="invite-email" className="mt-1" type="email" value={auth.session?.user.email ?? ""} readOnly />
              </div>
              <div>
                <Label htmlFor="new-password">Password</Label>
                <Input id="new-password" className="mt-1" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input id="confirm-password" className="mt-1" type="password" autoComplete="new-password" required minLength={6} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" className="mt-1" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" className="mt-1" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
            </>
          )}
          <FieldError message={error || undefined} />
          <Button type="submit" variant="primary" className="w-full" disabled={pending}>
            {pending ? (needsPassword ? "Saving…" : "Signing in…") : needsPassword ? "Save password" : "Sign in"}
          </Button>
          {settings.data?.allowBuyerSignup && !needsPassword ? (
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
