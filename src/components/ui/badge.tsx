import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  submitted: "bg-sky-50 text-sky-800",
  in_review: "bg-amber-50 text-amber-800",
  sent_to_suppliers: "bg-indigo-50 text-indigo-800",
  quoted: "bg-emerald-50 text-emerald-800",
  closed: "bg-slate-100 text-slate-700",
  cancelled: "bg-red-50 text-red-800",
};

export function Badge({ value, children }: { value?: string; children: string }) {
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", tones[value ?? ""] ?? "bg-muted text-foreground")}>{children}</span>;
}
