import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { profilePatchSchema, profileSchema } from "@shared";
import { toast } from "sonner";
import { QueryState, usePageTitle } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/fields";
import { ApiClientError, api } from "@/lib/api";
import { keys } from "@/lib/keys";

export function ProfilePage() {
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: keys.me, queryFn: () => api.get("/me", profileSchema) });
  const form = useForm({ defaultValues: { fullName: "", phone: "", companyName: "" } });
  usePageTitle("Profile");
  useEffect(() => {
    if (!me.data) return;
    form.reset({
      fullName: me.data.fullName ?? "",
      phone: me.data.phone ?? "",
      companyName: me.data.companyName ?? "",
    });
  }, [form, me.data]);

  const save = useMutation({
    mutationFn: (values: { fullName: string; phone: string; companyName: string }) => {
      const parsed = profilePatchSchema.safeParse(values);
      if (!parsed.success) throw new ApiClientError(parsed.error.issues[0]?.message ?? "Check the form", 400, "VALIDATION_ERROR");
      return api.patch("/me", parsed.data, profileSchema, { silent: true });
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(keys.me, profile);
      toast.success("Profile saved");
    },
    onError: (error) => toast.error(error instanceof ApiClientError ? error.message : "Could not save your profile"),
  });

  return (
    <QueryState isLoading={me.isLoading} isError={me.isError} onRetry={() => void me.refetch()}>
      {me.data ? (
        <form className="mx-auto max-w-lg space-y-4" onSubmit={form.handleSubmit((values) => save.mutate(values))}>
          <h1 className="text-2xl font-semibold">Profile</h1>
          <div>
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" className="mt-1" value={me.data.email ?? ""} readOnly />
          </div>
          <div>
            <Label htmlFor="profile-name">Name</Label>
            <Input id="profile-name" className="mt-1" {...form.register("fullName")} />
          </div>
          <div>
            <Label htmlFor="profile-phone">Phone</Label>
            <Input id="profile-phone" className="mt-1" {...form.register("phone")} />
          </div>
          <div>
            <Label htmlFor="profile-company">Company</Label>
            <Input id="profile-company" className="mt-1" {...form.register("companyName")} />
          </div>
          <FieldError message={form.formState.errors.fullName?.message} />
          <Button type="submit" variant="primary" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save profile"}</Button>
        </form>
      ) : null}
    </QueryState>
  );
}
