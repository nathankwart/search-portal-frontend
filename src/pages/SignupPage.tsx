import { useState, type ComponentProps, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LockKeyhole, Mail } from "lucide-react";
import { publicSettingsSchema } from "@shared";
import { useAuth } from "@/auth";
import { AuthFrame } from "@/components/AuthFrame";
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
    <AuthFrame title="Create a buyer account" description="Use your work email. You can search factories and send a sourcing list after the account is ready." onSubmit={onSubmit}>
      <SignupField id="signup-email" label="Email" icon={<Mail className="h-4 w-4" aria-hidden="true" />} type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
      <SignupField id="signup-password" label="Password" icon={<LockKeyhole className="h-4 w-4" aria-hidden="true" />} type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} />
      {error ? (
        <div className="rounded-2xl bg-destructive/10 px-3 py-2">
          <FieldError message={error} />
        </div>
      ) : null}
      {info ? <p className="rounded-2xl bg-accent/10 px-3 py-2 text-sm text-accent">{info}</p> : null}
      <Button type="submit" variant="primary" className="h-12 w-full rounded-2xl text-base shadow-sm" disabled={pending || settings.isLoading}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link className="font-semibold text-primary" to="/login" state={{ from: returnTo }}>
          Sign in
        </Link>
      </p>
    </AuthFrame>
  );
}

function SignupField({ id, label, icon, ...props }: ComponentProps<typeof Input> & { id: string; label: string; icon: ReactNode }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-1.5">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <Input id={id} className="h-12 rounded-2xl bg-background pl-10 shadow-none" {...props} />
      </div>
    </div>
  );
}
