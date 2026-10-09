import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { publicSettingsSchema } from "@shared";
import { buttonStyles } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { keys } from "@/lib/keys";

export function AuthPrompt({
  open,
  onOpenChange,
  title = "Sign in to continue",
  description = "Create a free buyer account or sign in to save products to your sourcing list and send inquiries. You can keep browsing without an account.",
  from,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  from?: string;
}) {
  const location = useLocation();
  const settings = useQuery({
    queryKey: keys.publicSettings,
    queryFn: () => api.get("/settings/public", publicSettingsSchema),
    staleTime: 60_000,
  });
  const state = { from: from ?? `${location.pathname}${location.search}` };
  const canSignUp = Boolean(settings.data?.allowBuyerSignup);

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <div className="flex flex-col gap-2 sm:flex-row">
        {canSignUp ? (
          <Link to="/signup" state={state} className={buttonStyles({ variant: "primary" })}>
            Create account
          </Link>
        ) : null}
        <Link to="/login" state={state} className={buttonStyles({ variant: canSignUp ? "outline" : "primary" })}>
          Sign in
        </Link>
        <button type="button" className={buttonStyles({ variant: "ghost" })} onClick={() => onOpenChange(false)}>
          Keep browsing
        </button>
      </div>
    </Modal>
  );
}
