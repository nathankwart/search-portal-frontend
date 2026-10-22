import { useEffect, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { publicSettingsSchema } from "@shared";
import { useAuth } from "@/auth";
import { AuthFrame } from "@/components/AuthFrame";
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
  const [showPassword, setShowPassword] = useState(false);
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
    <AuthFrame
      title={needsPassword ? "Set your password" : "Sign in"}
      description={
        needsPassword
          ? "Choose a password to finish your account. You will use it the next time you sign in."
          : "Search Chinese factories, build a sourcing list, and send it to your team."
      }
      onSubmit={needsPassword ? onSetPassword : onSubmit}
    >
      {needsPassword ? (
        <>
          <AuthField id="invite-email" label="Email" icon={<Mail className="h-4 w-4" aria-hidden="true" />} type="email" value={auth.session?.user.email ?? ""} readOnly />
          <AuthField id="new-password" label="Password" icon={<LockKeyhole className="h-4 w-4" aria-hidden="true" />} type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} revealed={showPassword} onToggleReveal={() => setShowPassword((value) => !value)} />
          <AuthField id="confirm-password" label="Confirm password" icon={<LockKeyhole className="h-4 w-4" aria-hidden="true" />} type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={6} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
        </>
      ) : (
        <>
          <AuthField id="email" label="Email" icon={<Mail className="h-4 w-4" aria-hidden="true" />} type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
          <AuthField id="password" label="Password" icon={<LockKeyhole className="h-4 w-4" aria-hidden="true" />} type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} revealed={showPassword} onToggleReveal={() => setShowPassword((value) => !value)} />
        </>
      )}
      {error ? (
        <div className="rounded-2xl bg-destructive/10 px-3 py-2">
          <FieldError message={error} />
        </div>
      ) : null}
      <Button type="submit" variant="primary" className="mt-1 h-11 w-full rounded-2xl text-base shadow-sm disabled:opacity-100" disabled={pending} aria-busy={pending}>
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
        {pending ? (needsPassword ? "Saving" : "Signing in") : needsPassword ? "Save password" : "Sign in"}
      </Button>
      {settings.data?.allowBuyerSignup && !needsPassword ? (
        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link className="font-semibold text-primary" to="/signup" state={location.state}>
            Create a buyer account
          </Link>
        </p>
      ) : null}
    </AuthFrame>
  );
}

function AuthField({
  id,
  label,
  icon,
  revealed,
  onToggleReveal,
  ...props
}: ComponentProps<typeof Input> & {
  id: string;
  label: string;
  icon: ReactNode;
  revealed?: boolean;
  onToggleReveal?: () => void;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-1.5">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <Input id={id} className="h-11 rounded-2xl bg-background pl-10 pr-12 shadow-none" {...props} />
        {onToggleReveal ? (
          <button type="button" className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted" onClick={onToggleReveal} aria-label={revealed ? "Hide password" : "Show password"}>
            {revealed ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        ) : null}
      </div>
    </div>
  );
}
